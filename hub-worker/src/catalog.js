/* Turns catalog/products.json into paywatch plans.
 * A plan id is "<product>__<tier>". Only live products with a price
 * above zero become buyable plans; free tiers and "soon" products never
 * reach checkout. */
import data from "../../catalog/products.json" with { type: "json" };

export const PRODUCTS = data.products;

export function planId(productId, tierId) { return `${productId}__${tierId}`; }

export function splitPlanId(id) {
  const [product, tier] = String(id).split("__");
  return { product, tier };
}

export function buyablePlans() {
  const plans = [];
  for (const p of PRODUCTS) {
    if (p.status !== "live") continue;
    for (const t of p.tiers) {
      if (!(Number(t.price_usd) > 0)) continue;
      plans.push({ id: planId(p.id, t.id), name: `${p.name} ${t.name}`,
        price_usd: Number(t.price_usd), features: t.features || [] });
    }
  }
  return plans;
}

export function findTier(productId, tierId) {
  const p = PRODUCTS.find((x) => x.id === productId);
  const t = p && p.tiers.find((x) => x.id === tierId);
  return p && t ? { product: p, tier: t } : null;
}

export function productIds() { return PRODUCTS.map((p) => p.id); }
