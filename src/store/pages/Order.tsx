import { useCallback, useEffect, useRef, useState } from "react";
import { getClaim, hub, Order as OrderT, storage } from "../api";
import { clock, paymentUri, toCoin, usd, when } from "../format";
import { Button, Copy, Label, Mono, Notice, Page, Spinner } from "../ui";

const PAID = ["paid", "manually_approved"];

function useQr(text: string | null) {
  const [svg, setSvg] = useState<string | null>(null);
  useEffect(() => {
    if (!text) return;
    let cancelled = false;
    const render = () => {
      const qrcode = (window as any).qrcode;
      if (!qrcode || cancelled) return;
      const q = qrcode(0, "M"); q.addData(text); q.make();
      setSvg(q.createSvgTag({ cellSize: 4, margin: 0, scalable: true }));
    };
    if ((window as any).qrcode) render();
    else {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js";
      s.onload = render;
      document.head.appendChild(s);
    }
    return () => { cancelled = true; };
  }, [text]);
  return svg;
}

function downloadReceipt(o: OrderT, code: string | null) {
  const lines = [
    "MONICO LABS — RECEIPT", "",
    `Order:      ${o.id}`, `Product:    ${o.product_name} ${o.tier_name}`, `Price:      ${usd(o.price_usd)} USD`,
    `Paid with:  ${toCoin(o.expected_amount, o.asset)} ${o.symbol}`, `To:         ${o.receive_address}`,
    `From:       ${o.payer_address}`, `Tx:         ${o.txid || "—"}`, `Paid at:    ${o.paid_at || "—"}`,
    "", code ? `ACCESS CODE: ${code}` : "Access code: added to your existing code", "",
    "Keep this file. Your access code signs you in on the product site.",
  ];
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain" }));
  a.download = `monico-receipt-${o.id}.txt`;
  a.click();
}

export default function Order({ id }: { id: string }) {
  const [order, setOrder] = useState<OrderT | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [claim, setClaim] = useState<{ code?: string; attached_to_existing?: boolean; already_claimed?: boolean } | null>(null);
  const [claimErr, setClaimErr] = useState<string | null>(null);
  const claiming = useRef(false);
  const secret = getClaim(id);

  const check = useCallback(async (poll: boolean) => {
    setChecking(true);
    try {
      const r = poll
        ? await hub<{ order: OrderT }>(`/api/orders/${id}/check`, { method: "POST" })
        : await hub<{ order: OrderT }>(`/api/orders/${id}`);
      setOrder(r.order); setError(null);
    } catch (e: any) { setError(e.message); }
    finally { setChecking(false); }
  }, [id]);

  useEffect(() => { check(false); }, [check]);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => {
    if (!order || PAID.includes(order.status) || ["expired", "paid_late"].includes(order.status)) return;
    const t = setInterval(() => check(true), 30_000);
    const onVis = () => { if (document.visibilityState === "visible") check(true); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", onVis); };
  }, [order?.status, check]);

  const doClaim = useCallback(async (reissue = false) => {
    if (!secret || claiming.current) return;
    claiming.current = true; setClaimErr(null);
    try {
      const r = await hub<any>(`/api/orders/${id}/claim`, { body: { claim_secret: secret, reissue } });
      setClaim(r);
      if (r.code) storage.set("ml.lastCode", r.code);
    } catch (e: any) { setClaimErr(e.message); }
    finally { claiming.current = false; }
  }, [id, secret]);

  useEffect(() => {
    if (order && PAID.includes(order.status) && !claim) doClaim();
  }, [order?.status, claim, doClaim]);

  const uri = order ? paymentUri(order.asset, order.receive_address, order.expected_amount) : null;
  const qr = useQr(order && !PAID.includes(order.status) ? uri : null);

  if (!order) {
    return (
      <Page narrow>
        {error ? <Notice tone="error">{error}</Notice>
          : <p className="flex items-center gap-2 text-neutral-400"><Spinner /> Loading order…</p>}
      </Page>
    );
  }

  const left = new Date(order.expires_at).getTime() - now;
  const amount = toCoin(order.expected_amount, order.asset);
  const paid = PAID.includes(order.status);
  const open = ["pending", "confirming", "underpaid"].includes(order.status) && left > 0;

  return (
    <Page narrow>
      <div className="flex items-end justify-between gap-4 border-b border-neutral-900 pb-6">
        <div>
          <Label>Order {order.id}</Label>
          <h1 className="mt-3 font-display text-3xl sm:text-4xl font-semibold tracking-tight">{order.product_name} {order.tier_name}</h1>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl font-semibold">{usd(order.price_usd)}</div>
          {open && <div className={`font-mono text-sm tabular-nums ${left < 5 * 60_000 ? "text-white" : "text-neutral-400"}`}>{clock(left)} left</div>}
        </div>
      </div>

      {paid ? (
        <section className="mt-8 space-y-6">
          <div className="bg-white text-black p-6 sm:p-8">
            <Label>Payment confirmed</Label>
            {claim?.code ? (
              <>
                <p className="mt-4 text-sm text-neutral-600">Your access code. It's shown once, so save it now.</p>
                <div className="mt-3 flex items-center justify-between gap-4 border border-black px-4 py-4">
                  <span className="font-mono text-xl sm:text-2xl font-semibold tracking-wider break-all">{claim.code}</span>
                  <button type="button" onClick={() => navigator.clipboard.writeText(claim.code!)}
                    className="font-mono text-[10px] uppercase tracking-widest shrink-0 hover:underline">Copy</button>
                </div>
              </>
            ) : claim?.attached_to_existing ? (
              <p className="mt-4 font-display text-2xl">Added to your existing access code.</p>
            ) : claim?.already_claimed ? (
              <p className="mt-4 text-sm text-neutral-700">This order's code was already shown. Lost it? Issue a new one below; the old one stops working.</p>
            ) : !secret ? (
              <p className="mt-4 text-sm text-neutral-700">This order was started in another browser. Open it there to see your code.</p>
            ) : claimErr ? (
              <p className="mt-4 text-sm">{claimErr}</p>
            ) : (
              <p className="mt-4 flex items-center gap-2 text-sm"><Spinner /> Issuing your code…</p>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button href="#/account">Sign in with code</Button>
            <Button variant="line" onClick={() => downloadReceipt(order, claim?.code || null)}>Download receipt</Button>
            {secret && claim?.already_claimed && <Button variant="ghost" onClick={() => doClaim(true)}>Issue new code</Button>}
          </div>
          <p className="font-mono text-[11px] text-neutral-500">Paid {when(order.paid_at)}{order.txid ? ` · tx ${order.txid.slice(0, 16)}…` : ""}</p>
        </section>
      ) : order.status === "expired" || (!open && !paid && order.status !== "paid_late") ? (
        <section className="mt-8 space-y-5">
          <Notice>This invoice expired before a payment confirmed. Nothing was charged to this order.</Notice>
          <p className="text-sm text-neutral-400">If you already sent funds, don't send again. Keep your transaction id; the owner can approve it manually.</p>
          <Button href={`#/checkout/${order.product}/${order.tier}`}>Start a new checkout</Button>
        </section>
      ) : order.status === "paid_late" ? (
        <section className="mt-8">
          <Notice>Your payment arrived after the 60-minute window. It's recorded and waiting for manual approval by the owner. Don't pay again.</Notice>
        </section>
      ) : (
        <section className="mt-8 space-y-8">
          <div className="grid gap-6 sm:grid-cols-[auto_1fr] items-start">
            <div className="bg-white p-3 w-44 h-44 grid place-items-center" role="img" aria-label="Payment QR code">
              {qr ? <div className="w-full h-full [&_svg]:w-full [&_svg]:h-full" dangerouslySetInnerHTML={{ __html: qr }} />
                : <span className="text-black text-xs font-mono">QR</span>}
            </div>
            <div className="space-y-5 min-w-0">
              <div>
                <Label>Send exactly</Label>
                <div className="mt-2 flex items-center justify-between gap-3 border border-neutral-800 px-3 py-3">
                  <Mono big>{amount} {order.symbol}</Mono><Copy value={amount} />
                </div>
              </div>
              <div>
                <Label>To this {order.symbol} address</Label>
                <div className="mt-2 flex items-center justify-between gap-3 border border-neutral-800 px-3 py-3">
                  <Mono>{order.receive_address}</Mono><Copy value={order.receive_address} />
                </div>
              </div>
              <div>
                <Label>From your wallet</Label>
                <p className="mt-2 font-mono text-xs text-neutral-400 break-all">{order.payer_address}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-neutral-900 pt-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className={`h-2 w-2 rounded-full ${order.status === "confirming" ? "bg-white animate-pulse" : "bg-neutral-600"}`} />
                <span className="text-sm">
                  {order.status === "confirming"
                    ? `Payment seen · ${order.confirmations} of ${order.required_confirmations} confirmations`
                    : order.status === "underpaid"
                      ? `Received ${toCoin(order.seen_amount, order.asset)} ${order.symbol}, short of ${toCoin(order.threshold_amount, order.asset)}`
                      : "Waiting for your payment"}
                </span>
              </div>
              <Button small variant="line" onClick={() => check(true)} disabled={checking}>
                {checking ? <Spinner /> : "Check now"}
              </Button>
            </div>
            {order.status === "underpaid" && <Notice>Send the remaining difference from the same wallet before the timer runs out.</Notice>}
            {error && <Notice tone="error">{error}</Notice>}
            <p className="font-mono text-[11px] text-neutral-500 leading-relaxed">
              This page checks every 30 seconds and you can close it; open it again from Account → Recent orders.
              Unlocks after {order.required_confirmations > 1 ? `${order.required_confirmations} confirmations` : "finalization"}.
            </p>
          </div>
        </section>
      )}
    </Page>
  );
}
