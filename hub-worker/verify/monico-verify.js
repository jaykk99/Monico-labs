/* monico-verify.js - drop this one file into any Monico Labs product site
 * (Next.js, Vite, a Worker, Node 18+). No dependencies.
 *
 * Flow on a product site:
 *   1. User types their access code (ML-XXXX-XXXX-XXXX-XXXX).
 *   2. POST it to the hub:  signInWithCode(HUB_URL, code) -> { token, grants }
 *   3. Keep the token (cookie / localStorage). On each request:
 *        const claims = await verifyHubToken(token, HUB_PUBLIC_KEY_X)
 *        if (!hasAccess(claims, "recon-anything", ["pro", "agency"])) deny()
 *   4. Tokens last 24 h. Call refreshToken(HUB_URL, token) to renew; a
 *      revoked code stops refreshing.
 *
 * HUB_PUBLIC_KEY_X comes from GET <hub>/.well-known/monico-hub.json
 * (public_key.x). Pin it in your env; never fetch it per request.
 * The owner token (role "owner") passes hasAccess for every product.
 */

function fromB64url(str) {
  const s = String(str).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(s + "===".slice((s.length + 3) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

const keyCache = new Map();
async function importX(x) {
  if (!keyCache.has(x)) {
    keyCache.set(x, crypto.subtle.importKey("jwk", { kty: "OKP", crv: "Ed25519", x },
      { name: "Ed25519" }, false, ["verify"]));
  }
  return keyCache.get(x);
}

/* Returns the token's claims, or null if forged, malformed or expired. */
export async function verifyHubToken(token, publicKeyX, nowSec = Math.floor(Date.now() / 1000)) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3 || parts[0] !== "mh1") return null;
  try {
    const ok = await crypto.subtle.verify({ name: "Ed25519" }, await importX(publicKeyX),
      fromB64url(parts[2]), new TextEncoder().encode("mh1." + parts[1]));
    if (!ok) return null;
    const claims = JSON.parse(new TextDecoder().decode(fromB64url(parts[1])));
    if (claims.iss !== "monico-labs-hub" || !claims.exp || claims.exp < nowSec) return null;
    return claims;
  } catch { return null; }
}

/* tiers: optional list of tier ids that count, e.g. ["pro", "elite"]. */
export function hasAccess(claims, product, tiers = null) {
  if (!claims) return false;
  if (claims.role === "owner" && claims.ent === "*") return true;
  if (!Array.isArray(claims.ent)) return false;
  return claims.ent.some((e) => e.p === product && (!tiers || tiers.includes(e.t)));
}

export async function signInWithCode(hubUrl, code) {
  const res = await fetch(`${hubUrl.replace(/\/$/, "")}/api/auth/code`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `sign-in failed (${res.status})`);
  return body; // { token, grants, expires_in }
}

export async function refreshToken(hubUrl, token) {
  const res = await fetch(`${hubUrl.replace(/\/$/, "")}/api/auth/refresh`, {
    method: "POST", headers: { Authorization: `Bearer ${token}` } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `refresh failed (${res.status})`);
  return body;
}
