import { findProduct } from "../api";
import { usd } from "../format";
import { Button, Label, Page } from "../ui";
import { ProductGrid } from "./Home";

export function Products() {
  return (
    <Page>
      <Label>Catalog</Label>
      <h1 className="mt-4 mb-10 font-display text-5xl sm:text-6xl font-semibold tracking-tight">Products</h1>
      <ProductGrid />
    </Page>
  );
}

export default function Product({ id }: { id: string }) {
  const p = findProduct(id);
  if (!p) {
    return (
      <Page narrow>
        <h1 className="font-display text-4xl font-semibold">Not found</h1>
        <p className="mt-3 text-neutral-400">That product doesn't exist.</p>
        <div className="mt-8"><Button href="#/products" variant="line">All products</Button></div>
      </Page>
    );
  }
  return (
    <Page>
      <a href="#/products" className="font-mono text-[11px] uppercase tracking-widest text-neutral-500 hover:text-white">← Products</a>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <Label>{p.status === "live" ? "● Available now" : "○ Coming soon"}</Label>
          <h1 className="mt-4 font-display text-5xl sm:text-7xl font-semibold tracking-tight leading-[0.95]">{p.name}</h1>
          <p className="mt-6 text-xl text-neutral-300 leading-snug">{p.tagline}</p>
          <p className="mt-6 text-neutral-400 leading-relaxed max-w-xl">{p.description}</p>
          {p.site && (
            <a href={p.site} target="_blank" rel="noreferrer"
              className="mt-8 inline-block font-mono text-[11px] uppercase tracking-widest underline underline-offset-4 decoration-neutral-600 hover:decoration-white">
              Open {p.name} ↗
            </a>
          )}
        </div>

        <div className="border-t border-neutral-900 lg:border-t-0">
          {p.tiers.length === 0 ? (
            <div className="border border-neutral-900 p-8">
              <Label>Pricing</Label>
              <p className="mt-4 font-display text-2xl">Not on sale yet.</p>
              <p className="mt-2 text-sm text-neutral-400">Pricing hasn't been set. Check back soon.</p>
            </div>
          ) : (
            <div className="border-l border-t border-neutral-900">
              {p.tiers.map((t) => (
                <div key={t.id} className="border-r border-b border-neutral-900 p-6 flex flex-col sm:flex-row sm:items-center gap-5 justify-between">
                  <div>
                    <div className="flex items-baseline gap-3">
                      <h2 className="font-display text-2xl font-semibold">{t.name}</h2>
                      <span className="font-mono text-sm text-neutral-400">{usd(t.price_usd)}</span>
                    </div>
                    <ul className="mt-3 space-y-1">
                      {t.features.map((f) => (
                        <li key={f} className="text-sm text-neutral-400 flex gap-2"><span className="text-neutral-600">—</span>{f}</li>
                      ))}
                    </ul>
                  </div>
                  {t.price_usd > 0 ? (
                    <Button href={`#/checkout/${p.id}/${t.id}`}>Buy {t.name}</Button>
                  ) : p.site ? (
                    <Button href={p.site} variant="line">Use free</Button>
                  ) : (
                    <span className="font-mono text-[11px] uppercase tracking-widest text-neutral-500">No purchase needed</span>
                  )}
                </div>
              ))}
            </div>
          )}
          {p.tiers.some((t) => t.price_usd > 0) && (
            <p className="mt-4 font-mono text-[11px] text-neutral-500 leading-relaxed">
              Prices in USD, paid in BTC, ETH or SOL. The coin amount is locked for 60 minutes when you start checkout.
            </p>
          )}
        </div>
      </div>
    </Page>
  );
}
