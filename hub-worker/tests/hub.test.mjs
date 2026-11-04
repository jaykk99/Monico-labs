/* End-to-end hub tests: checkout -> unlock -> claim code -> sign in ->
 * verify token like a product site would -> owner flows. Offline:
 * price and chain providers are mocked, D1 is real SQLite. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";

import { createHub } from "../src/worker.js";
import { verifyToken, totpAt, sha256Hex, normalizeCode, newAccessCode, b64url } from "../src/crypto.js";
import { verifyHubToken, hasAccess } from "../verify/monico-verify.js";
import { DEFAULT_ADDRESSES } from "../src/vendor/core.js";
import { makeD1 } from "./sqlite-d1.mjs";

const PAYER = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq";
const RECEIVE = DEFAULT_ADDRESSES.btc[0];
const TOTP = "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP";
const RECOVERY = "break-glass-recovery-code-for-tests";

class FakePrice { async rateInfo() { return { rate_usd: 100000, provider: "fake-price", stale: false }; } }
class FakeChain {
  constructor() { this.txs = []; this.name = "fake-chain"; }
  async fetchAddress() { return { txs: this.txs, tip_height: 100, provider: this.name, errors: [] }; }
  async health() { return this.name; }
}

async function setup() {
  const kp = await webcrypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
  const pkcs8 = Buffer.from(await webcrypto.subtle.exportKey("pkcs8", kp.privateKey)).toString("base64");
  const chain = new FakeChain();
  const hub = createHub({ priceFetcher: new FakePrice(), chainFetchers: { btc: chain, eth: chain, sol: chain } });
  const env = { DB: makeD1(), HUB_SIGNING_KEY: pkcs8, OWNER_TOTP_SECRET: TOTP,
    OWNER_RECOVERY_HASH: await sha256Hex(RECOVERY) };
  const call = async (method, path, body, token) => {
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await hub.fetch(new Request("https://hub.test" + path,
      { method, headers, body: body ? JSON.stringify(body) : undefined }), env);
    return { status: res.status, body: await res.json() };
  };
  return { hub, env, chain, call };
}

function payTx(chain, order, conf = 2, value = null) {
  chain.txs.push({ txid: "a".repeat(64), from_addresses: [PAYER], to_address: order.receive_address,
    value_amount: String(value ?? order.expected_amount), confirmations: conf });
}

test("access code helpers", async () => {
  const c = newAccessCode();
  assert.match(c, /^ML-[0-9A-HJKMNP-TV-Z]{4}(-[0-9A-HJKMNP-TV-Z]{4}){3}$/);
  assert.equal(normalizeCode(c.toLowerCase().replace(/-/g, " ")), c);
  assert.equal(normalizeCode("nope"), null);
});

test("catalog only sells live paid tiers", async () => {
  const { call } = await setup();
  const r = await call("GET", "/api/catalog");
  const ids = r.body.plans.map((p) => p.id).sort();
  assert.deepEqual(ids, ["monico-agent__elite", "monico-agent__pro", "recon-anything__agency",
    "recon-anything__pro", "recon-anything__starter"]);
  const bad = await call("POST", "/api/orders", { product: "wholesale-stack", tier: "x", asset: "btc", payer_address: PAYER });
  assert.equal(bad.status, 404);
  const free = await call("POST", "/api/orders", { product: "recon-anything", tier: "free", asset: "btc", payer_address: PAYER });
  assert.equal(free.status, 404);
});

test("buy -> pay -> claim -> sign in -> product site verifies", async () => {
  const { call, chain } = await setup();
  const created = await call("POST", "/api/orders", { product: "monico-agent", tier: "pro", asset: "btc", payer_address: PAYER });
  assert.equal(created.status, 200, JSON.stringify(created.body));
  const { order, claim_secret } = created.body;
  assert.equal(order.receive_address, RECEIVE);
  assert.equal(order.expected_amount, "149000"); // $149 at $100k/BTC = 149000 sats
  assert.equal(order.product_name, "Monico Agent");

  const early = await call("POST", `/api/orders/${order.id}/claim`, { claim_secret });
  assert.equal(early.status, 409);

  payTx(chain, order, 1);
  assert.equal((await call("POST", `/api/orders/${order.id}/check`)).body.action, "confirming");
  chain.txs.length = 0; payTx(chain, order, 2);
  assert.equal((await call("POST", `/api/orders/${order.id}/check`)).body.action, "unlocked");

  const wrong = await call("POST", `/api/orders/${order.id}/claim`, { claim_secret: "cs_nope" });
  assert.equal(wrong.status, 403);
  const claimed = await call("POST", `/api/orders/${order.id}/claim`, { claim_secret });
  assert.equal(claimed.status, 200);
  assert.match(claimed.body.code, /^ML-/);
  const again = await call("POST", `/api/orders/${order.id}/claim`, { claim_secret });
  assert.equal(again.body.already_claimed, true);
  assert.equal(again.body.code, undefined, "code is only shown once");

  const signin = await call("POST", "/api/auth/code", { code: claimed.body.code.toLowerCase() });
  assert.equal(signin.status, 200);
  assert.deepEqual(signin.body.grants.map((g) => [g.product, g.tier]), [["monico-agent", "pro"]]);

  const wk = await call("GET", "/.well-known/monico-hub.json");
  const claims = await verifyHubToken(signin.body.token, wk.body.public_key.x);
  assert.ok(hasAccess(claims, "monico-agent"));
  assert.ok(hasAccess(claims, "monico-agent", ["pro", "elite"]));
  assert.ok(!hasAccess(claims, "monico-agent", ["elite"]));
  assert.ok(!hasAccess(claims, "recon-anything"));

  // tampered token fails
  const parts = signin.body.token.split(".");
  const forged = b64url(new TextEncoder().encode(JSON.stringify({ ...claims, ent: "*", role: "owner" })));
  assert.equal(await verifyHubToken(`mh1.${forged}.${parts[2]}`, wk.body.public_key.x), null);

  // second purchase onto the same code -> one code, two products
  const second = await call("POST", "/api/orders", { product: "recon-anything", tier: "starter", asset: "btc",
    payer_address: PAYER, code: claimed.body.code });
  assert.equal(second.status, 200);
  chain.txs.length = 0;
  chain.txs.push({ txid: "b".repeat(64), from_addresses: [PAYER], to_address: second.body.order.receive_address,
    value_amount: String(second.body.order.expected_amount), confirmations: 2 });
  assert.equal((await call("POST", `/api/orders/${second.body.order.id}/check`)).body.action, "unlocked");
  const att = await call("POST", `/api/orders/${second.body.order.id}/claim`, { claim_secret: second.body.claim_secret });
  assert.equal(att.body.attached_to_existing, true);
  const me = await call("GET", "/api/me", null, signin.body.token);
  assert.deepEqual(me.body.grants.map((g) => g.product).sort(), ["monico-agent", "recon-anything"]);

  // reissue rotates: old code dies, grants follow the new one
  const rot = await call("POST", `/api/orders/${order.id}/claim`, { claim_secret, reissue: true });
  assert.equal(rot.body.rotated, true);
  assert.equal((await call("POST", "/api/auth/code", { code: claimed.body.code })).status, 401);
  const newSign = await call("POST", "/api/auth/code", { code: rot.body.code });
  assert.equal(newSign.body.grants.length, 2);
  assert.equal((await call("POST", "/api/auth/refresh", null, signin.body.token)).status, 401, "revoked code cannot refresh");
  assert.equal((await call("POST", "/api/auth/refresh", null, newSign.body.token)).status, 200);
});

test("txid cannot pay two orders", async () => {
  const { call, chain } = await setup();
  const a = (await call("POST", "/api/orders", { product: "recon-anything", tier: "pro", asset: "btc", payer_address: PAYER })).body.order;
  payTx(chain, a);
  assert.equal((await call("POST", `/api/orders/${a.id}/check`)).body.action, "unlocked");
  const b = (await call("POST", "/api/orders", { product: "recon-anything", tier: "pro", asset: "btc", payer_address: PAYER })).body.order;
  assert.equal((await call("POST", `/api/orders/${b.id}/check`)).body.action, "txid_reused");
});

test("owner login, dashboard, approve, comp, revoke", async () => {
  const { call } = await setup();
  assert.equal((await call("GET", "/api/owner/orders")).status, 401);
  assert.equal((await call("POST", "/api/owner/login", { totp: "000000" })).status, 401);
  const code = await totpAt(TOTP, Math.floor(Date.now() / 30000));
  const login = await call("POST", "/api/owner/login", { totp: code });
  assert.equal(login.status, 200);
  const owner = login.body.token;
  const rec = await call("POST", "/api/owner/login", { recovery_code: RECOVERY });
  assert.equal(rec.body.method, "recovery");

  const wk = await call("GET", "/.well-known/monico-hub.json");
  const claims = await verifyHubToken(owner, wk.body.public_key.x);
  assert.ok(hasAccess(claims, "wholesale-stack"), "owner gets into every product");

  const o = (await call("POST", "/api/orders", { product: "monico-agent", tier: "elite", asset: "btc", payer_address: PAYER })).body;
  const appr = await call("POST", `/api/owner/orders/${o.order.id}/approve`, null, owner);
  assert.equal(appr.body.action, "manually_approved");
  const cl = await call("POST", `/api/orders/${o.order.id}/claim`, { claim_secret: o.claim_secret });
  assert.match(cl.body.code, /^ML-/);

  const comp = await call("POST", "/api/owner/grant", { product: "recon-anything", tier: "agency", label: "tester" }, owner);
  assert.match(comp.body.code, /^ML-/);
  const codes = (await call("GET", "/api/owner/codes", null, owner)).body.codes;
  assert.equal(codes.length, 2);
  const orders = (await call("GET", "/api/owner/orders", null, owner)).body.orders;
  assert.equal(orders[0].product, "monico-agent");

  await call("POST", `/api/owner/codes/${comp.body.code_id}/revoke`, null, owner);
  assert.equal((await call("POST", "/api/auth/code", { code: comp.body.code })).status, 401);
});

test("owner login locks after repeated failures", async () => {
  const { call } = await setup();
  for (let i = 0; i < 10; i++) await call("POST", "/api/owner/login", { totp: "123456" });
  const code = await totpAt(TOTP, Math.floor(Date.now() / 30000));
  assert.equal((await call("POST", "/api/owner/login", { totp: code })).status, 429);
});

test("honest not-configured states", async () => {
  const hub = createHub({ priceFetcher: new FakePrice(), chainFetchers: { btc: new FakeChain() } });
  const res = await hub.fetch(new Request("https://hub.test/api/auth/code", { method: "POST", body: "{}" }), { DB: makeD1() });
  assert.equal(res.status, 503);
  assert.equal((await res.json()).code, "AUTH_NOT_CONFIGURED");
  const noDb = await hub.fetch(new Request("https://hub.test/api/assets"), {});
  assert.equal(noDb.status, 503);
});
