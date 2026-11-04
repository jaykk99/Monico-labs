/* Client for the Monico Labs hub Worker (hub-worker/).
 * The hub URL is baked in at build time with VITE_HUB_URL. When it is
 * not set, the storefront still renders the catalog but every checkout
 * and sign-in screen says plainly that the hub is offline. */
import catalog from "../../catalog/products.json";

export type Tier = { id: string; name: string; price_usd: number; features: string[] };
export type Product = {
  id: string; name: string; tagline: string; description: string;
  status: "live" | "soon"; site: string | null; tiers: Tier[];
};
export const PRODUCTS = catalog.products as unknown as Product[];
export const findProduct = (id: string) => PRODUCTS.find((p) => p.id === id) || null;

export const HUB_URL: string = (import.meta.env.VITE_HUB_URL || "").replace(/\/$/, "");
export const hubOnline = Boolean(HUB_URL);

export type Asset = "btc" | "eth" | "sol";
export const ASSETS: { key: Asset; symbol: string; name: string; decimals: number; unit: string }[] = [
  { key: "btc", symbol: "BTC", name: "Bitcoin", decimals: 8, unit: "sats" },
  { key: "eth", symbol: "ETH", name: "Ethereum", decimals: 18, unit: "wei" },
  { key: "sol", symbol: "SOL", name: "Solana", decimals: 9, unit: "lamports" },
];

export type AssetStatus = {
  asset: Asset; symbol: string; available: boolean; message: string | null;
  price_usd: number | null; price_stale: boolean; required_confirmations: number;
};

export type Order = {
  id: string; asset: Asset; symbol: string; status: string;
  product: string; tier: string; product_name: string; tier_name: string; price_usd: number;
  payer_address: string; receive_address: string; amount_unit: string;
  expected_amount: string; threshold_amount: string; seen_amount: string;
  txid: string | null; confirmations: number; required_confirmations: number;
  created_at: string; expires_at: string; paid_at: string | null;
  late_payment_note: string | null; provider_error: string | null; claimed: boolean;
};

export type Grant = { product: string; tier: string; source: string; granted_at: number };

export class HubError extends Error {
  status: number; code?: string;
  constructor(msg: string, status: number, code?: string) { super(msg); this.status = status; this.code = code; }
}

export async function hub<T = any>(path: string, opts: { method?: string; body?: unknown; token?: string } = {}): Promise<T> {
  if (!HUB_URL) throw new HubError("The checkout hub is offline right now.", 503, "HUB_OFFLINE");
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  let res: Response;
  try {
    res = await fetch(HUB_URL + path, {
      method: opts.method || (opts.body !== undefined ? "POST" : "GET"),
      headers, body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    throw new HubError("Can't reach the checkout hub. Check your connection and try again.", 0, "NETWORK");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new HubError(data.error || `Request failed (${res.status})`, res.status, data.code);
  return data as T;
}

/* ---- local state: claim secrets for orders this browser started ---- */

const safe = {
  get(k: string) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
  del(k: string) { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};
export const storage = safe;

export function saveClaim(orderId: string, secret: string) { safe.set(`ml.claim.${orderId}`, secret); }
export function getClaim(orderId: string) { return safe.get(`ml.claim.${orderId}`); }

export function recentOrders(): string[] {
  try { return JSON.parse(safe.get("ml.orders") || "[]"); } catch { return []; }
}
export function rememberOrder(id: string) {
  safe.set("ml.orders", JSON.stringify([id, ...recentOrders().filter((x) => x !== id)].slice(0, 20)));
}
