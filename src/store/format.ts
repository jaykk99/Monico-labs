/* Exact smallest-unit -> coin formatting. BigInt only: wei amounts
 * overflow JS numbers, and a rounded amount means an underpayment. */
const DECIMALS: Record<string, number> = { btc: 8, eth: 18, sol: 9 };

export function toCoin(amount: string, asset: string): string {
  const d = DECIMALS[asset] ?? 8;
  const v = BigInt(amount || "0");
  const base = 10n ** BigInt(d);
  const whole = v / base;
  const frac = (v % base).toString().padStart(d, "0").replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole.toString();
}

export function usd(n: number): string {
  return n === 0 ? "Free" : `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

export function paymentUri(asset: string, address: string, amountSmallest: string): string {
  if (asset === "btc") return `bitcoin:${address}?amount=${toCoin(amountSmallest, "btc")}`;
  if (asset === "sol") return `solana:${address}?amount=${toCoin(amountSmallest, "sol")}`;
  return `ethereum:${address}@1?value=${amountSmallest}`;
}

export function short(s: string, n = 6): string {
  return s && s.length > n * 2 + 3 ? `${s.slice(0, n)}…${s.slice(-n)}` : s;
}

export function clock(ms: number): string {
  if (ms <= 0) return "00:00";
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function when(iso: string | number | null): string {
  if (!iso) return "—";
  const d = typeof iso === "number" ? new Date(iso * 1000) : new Date(iso);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
