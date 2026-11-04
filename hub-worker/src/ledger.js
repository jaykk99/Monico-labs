/* The shared entitlement ledger: the one source of truth for who owns
 * what across the hub and every product site.
 *
 *   access_codes  one row per issued code (hash only, never plaintext)
 *   grants        product + tier a code unlocks (purchase or owner comp)
 *   order_claims  links a checkout order to the browser that started it
 *                 (claim secret hash) and to the code it pays into
 */
import { hashCode, newAccessCode, randomId, sha256Hex, safeEqual } from "./crypto.js";

export class LedgerError extends Error {
  constructor(message, status = 400, code = null) { super(message); this.status = status; this.code = code; }
}

const now = () => Math.floor(Date.now() / 1000);
const PAID = ["paid", "manually_approved"];

export class Ledger {
  constructor(db) { this.db = db; }

  q(sql, ...binds) { return this.db.prepare(sql).bind(...binds); }

  /* ---- codes ---- */

  async issueCode(label, source) {
    const code = newAccessCode();
    const id = "c_" + randomId(8);
    await this.q("INSERT INTO access_codes (id, code_hash, label, source, created_at) VALUES (?,?,?,?,?)",
      id, await hashCode(code), label || "", source, now()).run();
    return { id, code };
  }

  async findCode(code) {
    const h = await hashCode(code);
    if (!h) return null;
    const row = await this.q("SELECT * FROM access_codes WHERE code_hash = ?", h).first();
    if (!row || row.revoked_at) return null;
    return row;
  }

  async grantsForCode(codeId) {
    const res = await this.q(
      "SELECT product, tier, source, order_id, granted_at FROM grants WHERE code_id = ? AND revoked_at IS NULL ORDER BY granted_at",
      codeId).all();
    return res.results || [];
  }

  async touchCode(codeId) {
    await this.q("UPDATE access_codes SET last_used_at = ? WHERE id = ?", now(), codeId).run();
  }

  /* ---- checkout linkage ---- */

  async createClaim({ orderId, product, tier, codeId }) {
    const secret = "cs_" + randomId(16);
    await this.q(
      "INSERT INTO order_claims (order_id, claim_hash, code_id, code_preexisting, product, tier, created_at) VALUES (?,?,?,?,?,?,?)",
      orderId, await sha256Hex(secret), codeId || null, codeId ? 1 : 0, product, tier, now()).run();
    return secret;
  }

  async getClaim(orderId) {
    return this.q("SELECT * FROM order_claims WHERE order_id = ?", orderId).first();
  }

  /* Called by the checkout service the moment an order unlocks (watcher
   * or owner approval). Idempotent per order. */
  async grantForOrder(order) {
    const claim = await this.getClaim(order.id);
    if (!claim) return;
    await this.q(
      "INSERT OR IGNORE INTO grants (id, code_id, product, tier, source, order_id, granted_at) VALUES (?,?,?,?,?,?,?)",
      "g_" + randomId(8), claim.code_id || null, claim.product, claim.tier, "purchase", order.id, now()).run();
  }

  /* The buyer's browser trades its claim secret for the access code once
   * the order is paid. Email is not wired, so this on-screen hand-off is
   * the delivery channel. reissue=true rotates a lost or leaked code. */
  async claim(order, secret, { reissue = false } = {}) {
    const claim = await this.getClaim(order.id);
    if (!claim || !secret || !safeEqual(claim.claim_hash, await sha256Hex(secret))) {
      throw new LedgerError("claim denied", 403, "CLAIM_DENIED");
    }
    if (!PAID.includes(order.status)) {
      throw new LedgerError("order is not paid yet", 409, "NOT_PAID");
    }
    await this.grantForOrder(order); // belt and braces if unlock hook missed
    if (claim.code_preexisting) {
      return { attached_to_existing: true, product: claim.product, tier: claim.tier };
    }
    if (claim.code_id && !reissue) {
      return { already_claimed: true, product: claim.product, tier: claim.tier };
    }
    const fresh = await this.issueCode("", "purchase");
    if (claim.code_id) {
      // rotate: old code dies, its grants move to the new one
      await this.q("UPDATE access_codes SET revoked_at = ? WHERE id = ?", now(), claim.code_id).run();
      await this.q("UPDATE grants SET code_id = ? WHERE code_id = ?", fresh.id, claim.code_id).run();
      await this.q("UPDATE order_claims SET code_id = ? WHERE code_id = ?", fresh.id, claim.code_id).run();
    }
    await this.q("UPDATE grants SET code_id = ? WHERE order_id = ?", fresh.id, order.id).run();
    await this.q("UPDATE order_claims SET code_id = ? WHERE order_id = ?", fresh.id, order.id).run();
    return { code: fresh.code, product: claim.product, tier: claim.tier, rotated: Boolean(claim.code_id) };
  }

  /* ---- owner ---- */

  async compGrant({ product, tier, label, code }) {
    let target;
    if (code) {
      target = await this.findCode(code);
      if (!target) throw new LedgerError("unknown or revoked access code", 404);
    } else {
      target = await this.issueCode(label || "owner comp", "owner");
    }
    await this.q(
      "INSERT INTO grants (id, code_id, product, tier, source, order_id, granted_at) VALUES (?,?,?,?,?,?,?)",
      "g_" + randomId(8), target.id, product, tier, "owner", null, now()).run();
    return { code_id: target.id, code: code ? null : target.code };
  }

  async revokeCode(codeId) {
    await this.q("UPDATE access_codes SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL", now(), codeId).run();
  }

  async listCodes(limit = 200) {
    const res = await this.q(
      "SELECT id, label, source, created_at, last_used_at, revoked_at FROM access_codes ORDER BY created_at DESC LIMIT ?",
      limit).all();
    const codes = res.results || [];
    for (const c of codes) {
      const g = await this.q("SELECT product, tier, source, order_id, revoked_at FROM grants WHERE code_id = ?", c.id).all();
      c.grants = g.results || [];
    }
    return codes;
  }

  async listOrders(limit = 200) {
    const res = await this.q(
      `SELECT o.id, o.plan_id, o.price_usd, o.asset, o.status, o.payer_address, o.receive_address,
              o.expected_amount, o.seen_amount, o.txid, o.confirmations, o.required_confirmations,
              o.created_at, o.expires_at, o.paid_at, o.late_payment_note, o.provider_error,
              c.code_id, c.product, c.tier
         FROM orders o LEFT JOIN order_claims c ON c.order_id = o.id
        ORDER BY o.created_at DESC LIMIT ?`, limit).all();
    return res.results || [];
  }

  /* ---- brute-force brake for owner login and code sign-in ---- */

  async tooManyFailures(bucket, max = 10, windowSec = 900) {
    const key = `fail:${bucket}:${Math.floor(now() / windowSec)}`;
    const row = await this.q("SELECT value FROM meta WHERE key = ?", key).first();
    return Number(row ? row.value : 0) >= max;
  }
  async recordFailure(bucket, windowSec = 900) {
    const key = `fail:${bucket}:${Math.floor(now() / windowSec)}`;
    await this.q("INSERT INTO meta (key, value) VALUES (?, 1) ON CONFLICT(key) DO UPDATE SET value = value + 1", key).run();
  }
}
