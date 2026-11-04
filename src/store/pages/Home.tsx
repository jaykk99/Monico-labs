import { PRODUCTS, Product } from "../api";
import { usd } from "../format";
import { Label } from "../ui";

function fromPrice(p: Product): string {
  const paid = p.tiers.filter((t) => t.price_usd > 0).map((t) => t.price_usd);
  if (p.status !== "live") return "Coming soon";
  if (p.tiers.some((t) => t.price_usd === 0)) return "Free tier · paid from " + usd(Math.min(...paid));
  return paid.length ? "From " + usd(Math.min(...paid)) : "—";
}

export function ProductGrid() {
  return (
    <div className="grid sm:grid-cols-2 border-t border-l border-neutral-900">
      {PRODUCTS.map((p, i) => (
        <a key={p.id} href={`#/product/${p.id}`}
          className="group relative border-r border-b border-neutral-900 p-6 sm:p-8 min-h-64 flex flex-col justify-between transition-colors hover:bg-white hover:text-black">
          <div className="flex items-start justify-between font-mono text-[11px] uppercase tracking-widest">
            <span className="text-neutral-500 group-hover:text-neutral-500">{String(i + 1).padStart(2, "0")}</span>
            <span className={p.status === "live" ? "" : "text-neutral-500"}>
              {p.status === "live" ? "● Available" : "○ Soon"}
            </span>
          </div>
          <div className="mt-10">
            <h3 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">{p.name}</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-neutral-400 group-hover:text-neutral-700 max-w-md">{p.tagline}</p>
          </div>
          <div className="mt-8 flex items-center justify-between font-mono text-[11px] uppercase tracking-widest">
            <span>{fromPrice(p)}</span>
            <span className="transition-transform group-hover:translate-x-1" aria-hidden>→</span>
          </div>
        </a>
      ))}
    </div>
  );
}

export default function Home() {
  const live = PRODUCTS.filter((p) => p.status === "live").length;
  return (
    <>
      <section className="border-b border-neutral-900">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-16 pb-14 sm:pt-28 sm:pb-20">
          <Label>Independent software · {live} products live</Label>
          <h1 className="mt-6 font-display font-semibold tracking-tight leading-[0.95] text-[13vw] sm:text-7xl lg:text-8xl">
            Tools that<br />do the work.
          </h1>
          <p className="mt-8 max-w-xl text-lg text-neutral-400 leading-relaxed">
            AI agents, recon and automation built by one developer and sold straight to you.
            Pay in crypto from your own wallet. One access code signs you into everything you own.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <a href="#/products" className="inline-flex h-11 items-center bg-white px-5 font-mono text-[11px] uppercase tracking-widest text-black hover:bg-neutral-300">Browse products</a>
            <a href="#/account" className="inline-flex h-11 items-center border border-neutral-700 px-5 font-mono text-[11px] uppercase tracking-widest hover:border-white">I have a code</a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-14">
        <div className="flex items-end justify-between mb-6">
          <Label>Products</Label>
        </div>
        <ProductGrid />
      </section>

      <section className="border-t border-neutral-900">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 grid gap-10 sm:grid-cols-3">
          {[
            ["01", "Pick a tier", "Every price is in USD. Choose BTC, ETH or SOL at checkout."],
            ["02", "Pay from your wallet", "Your amount is locked for 60 minutes. No cards, no wallet connect, no custody."],
            ["03", "Get your code", "Once the network confirms, you get an access code. It signs you in on the product's own site."],
          ].map(([n, t, d]) => (
            <div key={n}>
              <div className="font-mono text-[11px] text-neutral-500">{n}</div>
              <h3 className="mt-3 font-display text-xl font-semibold">{t}</h3>
              <p className="mt-2 text-sm text-neutral-400 leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
