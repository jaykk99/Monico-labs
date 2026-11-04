/* Crypto helpers for the Monico Labs hub. WebCrypto only, so the same
 * code runs in Cloudflare Workers and Node 22 (tests, keygen).
 *
 *  - access codes: ML-XXXX-XXXX-XXXX-XXXX (80 random bits, Crockford
 *    base32). Only a SHA-256 hash is stored; the plaintext is shown once.
 *  - hub tokens:   mh1.<payload>.<signature>, Ed25519-signed JSON. The
 *    hub is the only signer; product sites verify with the public key.
 *  - owner login:  RFC 6238 TOTP (SHA-1, 30 s, 6 digits) plus a single
 *    break-glass recovery code stored as a SHA-256 hash.
 */

const enc = new TextEncoder();
const dec = new TextDecoder();
const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function b64url(bytes) {
  let s = "";
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function fromB64url(str) {
  const s = String(str).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(s + "===".slice((s.length + 3) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
export function fromB64(str) {
  const bin = atob(String(str).replace(/\s+/g, ""));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export async function sha256Hex(text) {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(String(text)));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function randomId(bytes = 12) {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return [...a].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/* Constant-time string compare for equal-length secrets. */
export function safeEqual(a, b) {
  a = String(a); b = String(b);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* ---------- access codes ---------- */

export function newAccessCode() {
  const a = new Uint8Array(10); // 80 bits
  crypto.getRandomValues(a);
  let bits = 0, value = 0, out = "";
  for (const byte of a) {
    value = (value << 8) | byte; bits += 8;
    while (bits >= 5) { out += CROCKFORD[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  return "ML-" + out.match(/.{4}/g).join("-");
}

/* Normalise what a human typed: case, spaces, dashes, and the
 * Crockford look-alikes (O->0, I/L->1). */
export function normalizeCode(code) {
  let s = String(code || "").toUpperCase().replace(/[\s-]/g, "");
  if (s.startsWith("ML")) s = s.slice(2);
  s = s.replace(/O/g, "0").replace(/[IL]/g, "1");
  if (!/^[0-9A-HJKMNP-TV-Z]{16}$/.test(s)) return null;
  return "ML-" + s.match(/.{4}/g).join("-");
}

export async function hashCode(code) {
  const n = normalizeCode(code);
  return n ? sha256Hex("monico-access:" + n) : null;
}

/* ---------- Ed25519 hub tokens ---------- */

let keyCache = null;

/* HUB_SIGNING_KEY is a base64 PKCS#8 Ed25519 private key (made by
 * scripts/keygen.mjs). Returns null when unset so callers can report an
 * honest "not configured" state instead of crashing. */
export async function loadSigningKey(env) {
  const raw = (env && env.HUB_SIGNING_KEY || "").trim();
  if (!raw) return null;
  if (keyCache && keyCache.raw === raw) return keyCache;
  const privateKey = await crypto.subtle.importKey(
    "pkcs8", fromB64(raw), { name: "Ed25519" }, true, ["sign"]);
  const jwk = await crypto.subtle.exportKey("jwk", privateKey);
  const publicKey = await crypto.subtle.importKey(
    "jwk", { kty: "OKP", crv: "Ed25519", x: jwk.x }, { name: "Ed25519" }, true, ["verify"]);
  keyCache = { raw, privateKey, publicKey, publicX: jwk.x };
  return keyCache;
}

export async function signToken(key, payload) {
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign({ name: "Ed25519" }, key.privateKey, enc.encode("mh1." + body));
  return `mh1.${body}.${b64url(sig)}`;
}

/* Verifies with a CryptoKey or a raw base64url public key (x). */
export async function verifyToken(token, publicKeyOrX, nowSec = Math.floor(Date.now() / 1000)) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3 || parts[0] !== "mh1") return null;
  let pub = publicKeyOrX;
  if (typeof pub === "string") {
    pub = await crypto.subtle.importKey("jwk", { kty: "OKP", crv: "Ed25519", x: pub },
      { name: "Ed25519" }, false, ["verify"]);
  }
  let ok = false;
  try {
    ok = await crypto.subtle.verify({ name: "Ed25519" }, pub, fromB64url(parts[2]),
      enc.encode("mh1." + parts[1]));
  } catch { return null; }
  if (!ok) return null;
  let payload;
  try { payload = JSON.parse(dec.decode(fromB64url(parts[1]))); } catch { return null; }
  if (!payload.exp || payload.exp < nowSec) return null;
  return payload;
}

/* ---------- TOTP ---------- */

export function base32Decode(str) {
  const s = String(str).toUpperCase().replace(/[\s=]/g, "");
  let bits = 0, value = 0;
  const out = [];
  for (const c of s) {
    const i = B32.indexOf(c);
    if (i < 0) throw new Error("bad base32");
    value = (value << 5) | i; bits += 5;
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  return new Uint8Array(out);
}
export function base32Encode(bytes) {
  let bits = 0, value = 0, out = "";
  for (const b of bytes) {
    value = (value << 8) | b; bits += 8;
    while (bits >= 5) { out += B32[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

export async function totpAt(secretB32, counter) {
  const key = await crypto.subtle.importKey("raw", base32Decode(secretB32),
    { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const msg = new Uint8Array(8);
  let c = BigInt(counter);
  for (let i = 7; i >= 0; i--) { msg[i] = Number(c & 255n); c >>= 8n; }
  const h = new Uint8Array(await crypto.subtle.sign("HMAC", key, msg));
  const o = h[h.length - 1] & 15;
  const bin = ((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(bin % 1_000_000).padStart(6, "0");
}

/* Accepts the current 30 s step and one step either side (clock drift). */
export async function verifyTotp(secretB32, code, nowMs = Date.now()) {
  const c = String(code || "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(c)) return false;
  const step = Math.floor(nowMs / 30_000);
  for (const d of [-1, 0, 1]) {
    if (safeEqual(await totpAt(secretB32, step + d), c)) return true;
  }
  return false;
}
