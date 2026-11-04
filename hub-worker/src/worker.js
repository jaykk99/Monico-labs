/* Monico Labs hub - Cloudflare Worker.
 *
 * The hub is the ONLY thing that knows who paid. Product sites never
 * check payments or codes themselves; they verify a short-lived token
 * the hub signs (Ed25519). Checkout is the vendored paywatch port
 * (src/vendor, same rules as jaykk99/crypto-payment-watcher): BTC, ETH,
 * SOL, price pinned for 60 minutes, payer binding, single-use txid.
 *
 * Bindings: D1 as DB. Secrets: HUB_SIGNING_KEY, OWNER_TOTP_SECRET,
 * OWNER_RECOVERY_HASH (all from scripts/keygen.mjs). Optional:
 * PAYWATCH_CRON_SECRET, PAYWATCH_ADDRESSES, ALLOWED_ORIGINS.
 *
 * Public routes
 *   GET  /health
 *   GET  /api/catalog                 products + buyable plans
 *   GET  /api/assets                  live per-coin availability
 *   POST /api/orders                  {product, tier, asset, payer_address, code?}
 *   GET  /api/orders/:id
 *   POST /api/orders/:id/check
 *   POST /api/orders/:id/claim        {claim_secret, reissue?} -> access code once
 *   POST /api/auth/code               {code} -> hub token (what product sites call)
 *   POST /api/auth/refresh            Bearer token -> fresh token (revocation honoured)
 *   GET  /api/me                      Bearer token -> grants
 *   GET  /.well-known/monico-hub.json public key for product sites
 * Owner routes (Bearer owner token from /api/owner/login)
 *   POST /api/owner/login             {totp} or {recovery_code}
 *   GET  /api/owner/orders | /api/owner/codes
 *   POST /api/owner/orders/:id/approve
 *   POST /api/owner/codes/:id/revoke
 *   POST /api/owner/grant             {product, tier, label?, code?}
 *   POST /api/owner/sweep
 */
import { CheckoutService, CheckoutError } from "./vendor/service.js";
import { D1Store } from "./vendor/store.js";
import { publicOrder, supportedAssets, getAsset } from "./vendor/core.js";
import { PRODUCTS, buyablePlans, planId, splitPlanId, findTier } from "./catalog.js";
import { Ledger, LedgerError } from "./ledger.js";
import {
  loadSigningKey, signToken, verifyToken, verifyTotp, sha256Hex, safeEqual,
} from "./crypto.js";

const ISSUER = "monico-labs-hub";
const CUSTOMER_TTL = 24 * 3600;          // token life
const REFRESH_WINDOW = 30 * 24 * 3600;   // how long a token can be refreshed from its first sign-in
const OWNER_TTL = 12 * 3600;
// BNB is registered in the core but its public explorer fails closed; the
// hub only offers the three coins the storefront sells.
const HUB_ASSETS = ["btc", "eth", "sol"];

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = String(env.ALLOWED_ORIGINS || "*").split(",").map((s) => s.trim()).filter(Boolean);
  const allow = allowed.includes("*") ? "*" : (allowed.includes(origin) ? origin : allowed[0] || "*");
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

class HttpError extends Error {
  constructor(message, status = 400, code = null) { super(message); this.status = status; this.code = code; }
}

function makeService(env, ledger, overrides = {}) {
  if (!env.DB) throw new HttpError("D1 binding DB is not set on this Worker; bind the monico-hub database as DB", 503, "NO_DB");
  const svc = new CheckoutService({
    store: new D1Store(env.DB),
    env: { ...env, PAYWATCH_PLANS_JSON: JSON.stringify({ plans: buyablePlans() }) },
    ...overrides,
  });
  const baseUnlock = svc.onUnlock;
  svc.onUnlock = async (order, tx) => {
    await baseUnlock(order, tx);         // vendored paid flag
    await ledger.grantForOrder(order);   // shared entitlement ledger
  };
  return svc;
}

function bearer(request) {
  const h = request.headers.get("Authorization") || "";
  return h.startsWith("Bearer ") ? h.slice(7).trim() : "";
}

async function requireKey(env) {
  const key = await loadSigningKey(env);
  if (!key) throw new HttpError("sign-in is not configured on the hub yet (HUB_SIGNING_KEY missing)", 503, "AUTH_NOT_CONFIGURED");
  return key;
}

async function customerToken(key, codeRow, grants, firstIat) {
  const iat = Math.floor(Date.now() / 1000);
  return signToken(key, {
    iss: ISSUER, sub: codeRow.id, role: "customer",
    ent: grants.map((g) => ({ p: g.product, t: g.tier })),
    iat, fia: firstIat || iat, exp: iat + CUSTOMER_TTL,
  });
}

async function requireOwner(request, env) {
  const key = await requireKey(env);
  const payload = await verifyToken(bearer(request), key.publicKey);
  if (!payload || payload.role !== "owner") throw new HttpError("owner sign-in required", 401, "OWNER_REQUIRED");
  return payload;
}

function orderView(order, claim) {
  const out = publicOrder(order);
  const { product, tier } = splitPlanId(order.plan_id);
  const t = findTier(product, tier);
  out.product = product; out.tier = tier;
  out.product_name = t ? t.product.name : product;
  out.tier_name = t ? t.tier.name : tier;
  out.claimed = Boolean(claim && claim.code_id);
  delete out.buyer_ref;
  return out;
}

async function body(request) { return request.json().catch(() => ({})); }

async function handle(request, env, overrides = {}) {
  const url = new URL(request.url);
  const p = url.pathname;
  const m = request.method;
  const json = (obj, status = 200) => new Response(JSON.stringify(obj), {
    status, headers: { "Content-Type": "application/json", ...corsHeaders(request, env) },
  });
  if (m === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request, env) });

  try {
    if (p === "/" || p === "/health") {
      const key = await loadSigningKey(env).catch(() => null);
      return json({ ok: true, service: ISSUER, db: Boolean(env.DB), signing: Boolean(key),
        owner_login: Boolean((env.OWNER_TOTP_SECRET || "").trim()) });
    }
    if (p === "/.well-known/monico-hub.json" && m === "GET") {
      const key = await requireKey(env);
      return json({ issuer: ISSUER, alg: "Ed25519", token_prefix: "mh1",
        public_key: { kty: "OKP", crv: "Ed25519", x: key.publicX } });
    }
    if (p === "/api/catalog" && m === "GET") {
      return json({ products: PRODUCTS, plans: buyablePlans(), assets: HUB_ASSETS,
        invoice_minutes: 60, tolerance_pct: 1 });
    }

    const ledger = new Ledger(env.DB);
    const svc = makeService(env, ledger, overrides);

    if (p === "/api/assets" && m === "GET") {
      const assets = [];
      for (const a of HUB_ASSETS) assets.push(await svc.assetStatus(a));
      return json({ assets });
    }

    if (p === "/api/orders" && m === "POST") {
      const b = await body(request);
      const t = findTier(b.product, b.tier);
      if (!t || t.product.status !== "live" || !(t.tier.price_usd > 0)) {
        throw new HttpError("that product or tier is not for sale", 404, "NOT_FOR_SALE");
      }
      const asset = String(b.asset || "btc").toLowerCase();
      if (!HUB_ASSETS.includes(asset)) throw new HttpError(`${asset.toUpperCase()} is not accepted here`, 400);
      if (!b.payer_address) throw new HttpError("payer_address is required", 400);
      let codeId = null;
      if (b.code) {
        const row = await ledger.findCode(b.code);
        if (!row) throw new HttpError("that access code is not valid; leave it blank to get a new one", 400, "BAD_CODE");
        codeId = row.id;
      }
      const order = await svc.createOrder(planId(t.product.id, t.tier.id), b.payer_address, { asset });
      const claimSecret = await ledger.createClaim({ orderId: order.id, product: t.product.id, tier: t.tier.id, codeId });
      return json({ order: orderView(order, null), claim_secret: claimSecret });
    }

    let mm = p.match(/^\/api\/orders\/([a-f0-9]{16})(\/check|\/claim)?$/);
    if (mm) {
      const [, id, action] = mm;
      if (!action && m === "GET") {
        const order = await svc.getOrder(id);
        if (!order) throw new HttpError(`unknown order: ${id}`, 404);
        return json({ order: orderView(order, await ledger.getClaim(id)) });
      }
      if (action === "/check" && m === "POST") {
        const res = await svc.checkOrder(id);
        const order = await svc.getOrder(id);
        return json({ action: res.action, provider_errors: res.provider_errors || [],
          order: orderView(order, await ledger.getClaim(id)) });
      }
      if (action === "/claim" && m === "POST") {
        const b = await body(request);
        const order = await svc.getOrder(id);
        if (!order) throw new HttpError(`unknown order: ${id}`, 404);
        return json(await ledger.claim(order, b.claim_secret, { reissue: Boolean(b.reissue) }));
      }
    }

    if (p === "/api/auth/code" && m === "POST") {
      const ip = request.headers.get("CF-Connecting-IP") || "anon";
      if (await ledger.tooManyFailures("code:" + ip, 20)) throw new HttpError("too many attempts, wait 15 minutes", 429);
      const key = await requireKey(env);
      const b = await body(request);
      const row = await ledger.findCode(b.code);
      if (!row) { await ledger.recordFailure("code:" + ip); throw new HttpError("that access code is not valid", 401, "BAD_CODE"); }
      const grants = await ledger.grantsForCode(row.id);
      await ledger.touchCode(row.id);
      return json({ token: await customerToken(key, row, grants), grants, expires_in: CUSTOMER_TTL });
    }

    if (p === "/api/auth/refresh" && m === "POST") {
      const key = await requireKey(env);
      // accept an expired token for refresh, but only inside the refresh window
      const payload = await verifyToken(bearer(request), key.publicKey, 0);
      const nowS = Math.floor(Date.now() / 1000);
      if (!payload || payload.role !== "customer" || nowS - (payload.fia || payload.iat) > REFRESH_WINDOW) {
        throw new HttpError("sign in again with your access code", 401, "REAUTH");
      }
      const row = await env.DB.prepare("SELECT * FROM access_codes WHERE id = ?").bind(payload.sub).first();
      if (!row || row.revoked_at) throw new HttpError("this access code was revoked", 401, "REVOKED");
      const grants = await ledger.grantsForCode(row.id);
      return json({ token: await customerToken(key, row, grants, payload.fia), grants, expires_in: CUSTOMER_TTL });
    }

    if (p === "/api/me" && m === "GET") {
      const key = await requireKey(env);
      const payload = await verifyToken(bearer(request), key.publicKey);
      if (!payload) throw new HttpError("not signed in", 401);
      if (payload.role === "owner") return json({ role: "owner", grants: "*" });
      return json({ role: "customer", grants: await ledger.grantsForCode(payload.sub) });
    }

    /* ---------- owner ---------- */

    if (p === "/api/owner/login" && m === "POST") {
      if (await ledger.tooManyFailures("owner", 10)) throw new HttpError("owner login locked for 15 minutes after repeated failures", 429);
      const key = await requireKey(env);
      const b = await body(request);
      const totpSecret = (env.OWNER_TOTP_SECRET || "").trim();
      const recoveryHash = (env.OWNER_RECOVERY_HASH || "").trim().toLowerCase();
      if (!totpSecret && !recoveryHash) throw new HttpError("owner login is not configured (OWNER_TOTP_SECRET missing)", 503, "OWNER_NOT_CONFIGURED");
      let ok = false, method = null;
      if (b.totp && totpSecret) { ok = await verifyTotp(totpSecret, b.totp); method = "totp"; }
      else if (b.recovery_code && recoveryHash) {
        ok = safeEqual(await sha256Hex(String(b.recovery_code).trim()), recoveryHash); method = "recovery";
      }
      if (!ok) { await ledger.recordFailure("owner"); throw new HttpError("owner login failed", 401); }
      const iat = Math.floor(Date.now() / 1000);
      const token = await signToken(key, { iss: ISSUER, sub: "owner", role: "owner", ent: "*", amr: method, iat, exp: iat + OWNER_TTL });
      return json({ token, expires_in: OWNER_TTL, method });
    }
    if (p.startsWith("/api/owner/")) {
      await requireOwner(request, env);
      if (p === "/api/owner/orders" && m === "GET") return json({ orders: await ledger.listOrders() });
      if (p === "/api/owner/codes" && m === "GET") return json({ codes: await ledger.listCodes() });
      if (p === "/api/owner/sweep" && m === "POST") return json(await svc.sweep());
      if (p === "/api/owner/grant" && m === "POST") {
        const b = await body(request);
        if (!findTier(b.product, b.tier)) throw new HttpError("unknown product or tier", 404);
        return json(await ledger.compGrant({ product: b.product, tier: b.tier, label: b.label, code: b.code }));
      }
      mm = p.match(/^\/api\/owner\/orders\/([a-f0-9]{16})\/approve$/);
      if (mm && m === "POST") {
        const res = await svc.approveOrder(mm[1], (env.PAYWATCH_CRON_SECRET || "").trim() || null);
        return json({ action: res.action, order: orderView(await svc.getOrder(mm[1]), await ledger.getClaim(mm[1])) });
      }
      mm = p.match(/^\/api\/owner\/codes\/(c_[a-f0-9]{16})\/revoke$/);
      if (mm && m === "POST") { await ledger.revokeCode(mm[1]); return json({ revoked: mm[1] }); }
    }

    return json({ error: "not found" }, 404);
  } catch (e) {
    if (e instanceof CheckoutError || e instanceof HttpError || e instanceof LedgerError) {
      const payload = { error: e.message };
      if (e.code) payload.code = e.code;
      if (e.provider_errors && e.provider_errors.length) payload.provider_errors = e.provider_errors;
      return json(payload, e.status || 400);
    }
    if (e && e.code === "ASSET_NOT_SUPPORTED") return json({ error: e.message, code: e.code }, 404);
    return json({ error: String((e && e.message) || e) }, 500);
  }
}

/* Tests pass provider overrides (mocked price/chain fetchers). */
export function createHub(overrides = {}) {
  return {
    fetch: (request, env) => handle(request, env, overrides),
    async scheduled(_event, env, ctx) {
      ctx.waitUntil(makeService(env, new Ledger(env.DB), overrides).sweep());
    },
  };
}

export default createHub();
