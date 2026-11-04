import { FormEvent, useEffect, useState } from "react";
import { ASSETS, Asset, AssetStatus, findProduct, hub, hubOnline, rememberOrder, saveClaim, storage, Order } from "../api";
import { usd } from "../format";
import { Button, Field, Label, Notice, Page, Spinner, go, inputCls } from "../ui";

const PLACEHOLDER: Record<Asset, string> = {
  btc: "bc1q… or 1… / 3…", eth: "0x… (40 hex characters)", sol: "Base58 address, 32–44 characters",
};

export default function Checkout({ productId, tierId }: { productId: string; tierId: string }) {
  const product = findProduct(productId);
  const tier = product?.tiers.find((t) => t.id === tierId);
  const [asset, setAsset] = useState<Asset>("btc");
  const [status, setStatus] = useState<Record<string, AssetStatus>>({});
  const [loadingStatus, setLoadingStatus] = useState(hubOnline);
  const [payer, setPayer] = useState("");
  const [code, setCode] = useState(() => storage.get("ml.lastCode") || "");
  const [useCode, setUseCode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hubOnline) return;
    hub<{ assets: AssetStatus[] }>("/api/assets")
      .then((r) => {
        const map: Record<string, AssetStatus> = {};
        r.assets.forEach((a) => { map[a.asset] = a; });
        setStatus(map);
        const first = ASSETS.find((a) => map[a.key]?.available);
        if (first) setAsset(first.key);
      })
      .catch(() => { /* availability is advisory; ordering still reports errors */ })
      .finally(() => setLoadingStatus(false));
  }, []);

  if (!product || !tier || product.status !== "live" || !(tier.price_usd > 0)) {
    return (
      <Page narrow>
        <h1 className="font-display text-4xl font-semibold">Not for sale</h1>
        <p className="mt-3 text-neutral-400">That product or tier can't be bought right now.</p>
        <div className="mt-8"><Button href="#/products" variant="line">All products</Button></div>
      </Page>
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null); setBusy(true);
    try {
      const r = await hub<{ order: Order; claim_secret: string }>("/api/orders", {
        body: { product: productId, tier: tierId, asset, payer_address: payer.trim(),
          code: useCode && code.trim() ? code.trim() : undefined },
      });
      saveClaim(r.order.id, r.claim_secret);
      rememberOrder(r.order.id);
      go(`#/order/${r.order.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally { setBusy(false); }
  }

  const sel = status[asset];
  return (
    <Page narrow>
      <a href={`#/product/${product.id}`} className="font-mono text-[11px] uppercase tracking-widest text-neutral-500 hover:text-white">← {product.name}</a>
      <div className="mt-8 flex items-end justify-between gap-4 border-b border-neutral-900 pb-6">
        <div>
          <Label>Checkout</Label>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl font-semibold tracking-tight">{product.name} {tier.name}</h1>
        </div>
        <div className="font-display text-3xl sm:text-4xl font-semibold">{usd(tier.price_usd)}</div>
      </div>

      <form onSubmit={submit} className="mt-8 space-y-8">
        <fieldset>
          <legend className="font-mono text-[11px] uppercase tracking-widest text-neutral-400">Pay with</legend>
          <div className="mt-2 grid grid-cols-3 border-l border-t border-neutral-800">
            {ASSETS.map((a) => {
              const st = status[a.key];
              const down = st && !st.available;
              const on = asset === a.key;
              return (
                <button key={a.key} type="button" disabled={down} onClick={() => setAsset(a.key)} aria-pressed={on}
                  className={`border-r border-b border-neutral-800 p-4 text-left transition-colors disabled:opacity-35 disabled:cursor-not-allowed
                    ${on ? "bg-white text-black" : "hover:bg-neutral-950"}`}>
                  <div className="font-mono text-sm font-semibold">{a.symbol}</div>
                  <div className={`mt-1 text-xs ${on ? "text-neutral-600" : "text-neutral-500"}`}>
                    {down ? "Busy, pick another" : st?.price_usd ? `$${Math.round(st.price_usd).toLocaleString()}` : a.name}
                  </div>
                </button>
              );
            })}
          </div>
          {loadingStatus && <p className="mt-2 flex items-center gap-2 text-xs text-neutral-500"><Spinner /> Checking live prices…</p>}
          {sel?.price_stale && <p className="mt-2 text-xs text-neutral-400">Price feed is briefly delayed; your amount uses the last good price.</p>}
        </fieldset>

        <Field label={`Your ${ASSETS.find((a) => a.key === asset)!.symbol} wallet address`}
          hint="The address you'll send from. Payments are matched to it, so it has to be the wallet you actually pay with. We never ask for keys or seed phrases.">
          <input className={inputCls} value={payer} onChange={(e) => setPayer(e.target.value)}
            placeholder={PLACEHOLDER[asset]} autoComplete="off" spellCheck={false} required />
        </Field>

        <div>
          <label className="flex items-center gap-3 text-sm text-neutral-300 cursor-pointer">
            <input type="checkbox" checked={useCode} onChange={(e) => setUseCode(e.target.checked)}
              className="h-4 w-4 accent-white" />
            Add this to an access code I already have
          </label>
          {useCode && (
            <div className="mt-3">
              <input className={inputCls} value={code} onChange={(e) => setCode(e.target.value)}
                placeholder="ML-XXXX-XXXX-XXXX-XXXX" autoComplete="off" spellCheck={false} />
              <p className="mt-1.5 text-xs text-neutral-500">Keeps everything you own on one code.</p>
            </div>
          )}
        </div>

        {error && <Notice tone="error">{error}</Notice>}

        <div className="space-y-3">
          <Button type="submit" full disabled={!hubOnline || busy || !payer.trim()}>
            {busy ? <><Spinner /> Locking price</> : `Lock price and pay with ${asset.toUpperCase()}`}
          </Button>
          <p className="font-mono text-[11px] text-neutral-500 leading-relaxed">
            Next screen shows the exact amount and address. You have 60 minutes to send it.
            Send at least the full amount; less than 99% won't unlock.
          </p>
        </div>
      </form>
    </Page>
  );
}
