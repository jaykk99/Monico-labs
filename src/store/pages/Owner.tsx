import { FormEvent, useCallback, useEffect, useState } from "react";
import { hub, hubOnline, PRODUCTS, storage } from "../api";
import { toCoin, usd, when } from "../format";
import { Button, Copy, Field, Label, Notice, Page, Spinner, inputCls } from "../ui";

const KEY = "ml.owner";

type OrderRow = { id: string; plan_id: string; price_usd: number; asset: string; status: string;
  payer_address: string; expected_amount: string; seen_amount: string; txid: string | null;
  created_at: string; paid_at: string | null; late_payment_note: string | null;
  product: string | null; tier: string | null; code_id: string | null };
type CodeRow = { id: string; label: string; source: string; created_at: number; last_used_at: number | null;
  revoked_at: number | null; grants: { product: string; tier: string; source: string }[] };

function Login({ onToken }: { onToken: (t: string) => void }) {
  const [mode, setMode] = useState<"totp" | "recovery">("totp");
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(null);
    try {
      const r = await hub<{ token: string }>("/api/owner/login",
        { body: mode === "totp" ? { totp: value } : { recovery_code: value } });
      onToken(r.token);
    } catch (err: any) { setError(err.message); }
    finally { setBusy(false); }
  }
  return (
    <Page narrow>
      <Label>Owner</Label>
      <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight">Sign in</h1>
      <form onSubmit={submit} className="mt-10 space-y-5 max-w-sm">
        <Field label={mode === "totp" ? "6-digit code from your authenticator" : "Break-glass recovery code"}>
          <input className={inputCls} value={value} onChange={(e) => setValue(e.target.value)} autoComplete="one-time-code"
            inputMode={mode === "totp" ? "numeric" : "text"} placeholder={mode === "totp" ? "000000" : "mlr-…"} required />
        </Field>
        {error && <Notice tone="error">{error}</Notice>}
        <Button type="submit" full disabled={!hubOnline || busy || !value}>{busy ? <Spinner /> : "Sign in"}</Button>
        <button type="button" className="font-mono text-[11px] text-neutral-500 hover:text-white"
          onClick={() => { setMode(mode === "totp" ? "recovery" : "totp"); setValue(""); }}>
          {mode === "totp" ? "Lost your phone? Use the recovery code" : "Use authenticator code"}
        </button>
      </form>
    </Page>
  );
}

export default function Owner() {
  const [token, setToken] = useState(() => storage.get(KEY));
  const [tab, setTab] = useState<"orders" | "codes" | "grant">("orders");
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [codes, setCodes] = useState<CodeRow[] | null>(null);
  const [msg, setMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [comp, setComp] = useState({ product: PRODUCTS[0].id, tier: PRODUCTS[0].tiers[0]?.id || "", label: "" });
  const [newCode, setNewCode] = useState<string | null>(null);

  const call = useCallback(async <T,>(path: string, body?: unknown, post = body !== undefined) => {
    try { return await hub<T>(path, { token: token!, body, method: post ? "POST" : "GET" }); }
    catch (e: any) {
      if (e.status === 401) { storage.del(KEY); setToken(null); }
      setMsg({ tone: "error", text: e.message }); throw e;
    }
  }, [token]);

  const load = useCallback(async () => {
    if (!token) return;
    const [o, c] = await Promise.all([call<{ orders: OrderRow[] }>("/api/owner/orders"), call<{ codes: CodeRow[] }>("/api/owner/codes")]);
    setOrders(o.orders); setCodes(c.codes);
  }, [token, call]);
  useEffect(() => { load().catch(() => {}); }, [load]);

  if (!token) return <Login onToken={(t) => { storage.set(KEY, t); setToken(t); }} />;

  const paid = (orders || []).filter((o) => ["paid", "manually_approved"].includes(o.status));
  const revenue = paid.reduce((s, o) => s + Number(o.price_usd || 0), 0);
  const attention = (orders || []).filter((o) => ["paid_late", "underpaid"].includes(o.status)).length;
  const tiersFor = PRODUCTS.find((p) => p.id === comp.product)?.tiers || [];

  return (
    <Page>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Label>Owner console</Label>
          <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight">Monico Labs</h1>
        </div>
        <div className="flex gap-2">
          <Button small variant="line" onClick={async () => { const r: any = await call("/api/owner/sweep", undefined, true); setMsg({ tone: "ok", text: `Checked ${r.checked} open orders, ${r.unlocked} unlocked.` }); load(); }}>Sweep now</Button>
          <Button small variant="ghost" onClick={() => { storage.del(KEY); setToken(null); }}>Sign out</Button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-3 border-l border-t border-neutral-900">
        {[["Revenue", usd(revenue)], ["Paid orders", String(paid.length)], ["Need attention", String(attention)]].map(([k, v]) => (
          <div key={k} className="border-r border-b border-neutral-900 p-4 sm:p-6">
            <Label>{k}</Label>
            <div className="mt-2 font-display text-2xl sm:text-4xl font-semibold tabular-nums">{orders ? v : "—"}</div>
          </div>
        ))}
      </div>

      {msg && <div className="mt-6"><Notice tone={msg.tone}>{msg.text}</Notice></div>}

      <div className="mt-8 flex gap-6 border-b border-neutral-900 font-mono text-[11px] uppercase tracking-widest">
        {(["orders", "codes", "grant"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`pb-3 -mb-px border-b uppercase tracking-widest ${tab === t ? "border-white text-white" : "border-transparent text-neutral-500 hover:text-white"}`}>
            {t === "grant" ? "Comp access" : t}
          </button>
        ))}
      </div>

      {tab === "orders" && (
        <div className="mt-4 overflow-x-auto">
          {!orders ? <p className="py-6 flex gap-2 items-center text-neutral-400"><Spinner /> Loading</p> : orders.length === 0 ? (
            <p className="py-6 text-neutral-500">No orders yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 text-left">
                <tr><th className="py-2 pr-4">Order</th><th className="pr-4">Product</th><th className="pr-4">Amount</th><th className="pr-4">Status</th><th className="pr-4">Created</th><th /></tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-neutral-900 align-top">
                    <td className="py-3 pr-4 font-mono text-xs"><a href={`#/order/${o.id}`} className="hover:underline">{o.id}</a></td>
                    <td className="py-3 pr-4">{o.product} <span className="text-neutral-500">{o.tier}</span><div className="font-mono text-xs text-neutral-500">{usd(o.price_usd)}</div></td>
                    <td className="py-3 pr-4 font-mono text-xs">{toCoin(o.expected_amount, o.asset)} {o.asset.toUpperCase()}
                      {o.seen_amount !== "0" && <div className="text-neutral-500">seen {toCoin(o.seen_amount, o.asset)}</div>}</td>
                    <td className="py-3 pr-4">
                      <span className={`font-mono text-[10px] uppercase tracking-widest px-2 py-1 ${["paid", "manually_approved"].includes(o.status) ? "bg-white text-black" : ["paid_late", "underpaid"].includes(o.status) ? "border border-white" : "text-neutral-500"}`}>
                        {o.status.replace("_", " ")}
                      </span>
                      {o.late_payment_note && <div className="mt-1 text-xs text-neutral-500 max-w-xs">{o.late_payment_note}</div>}
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-neutral-500 whitespace-nowrap">{when(o.created_at)}</td>
                    <td className="py-3 text-right">
                      {!["paid", "manually_approved"].includes(o.status) && (
                        <Button small variant="line" onClick={async () => {
                          if (!confirm(`Approve order ${o.id} without an automatic match? Only do this after checking the payment on-chain.`)) return;
                          await call(`/api/owner/orders/${o.id}/approve`, undefined, true); setMsg({ tone: "ok", text: `Approved ${o.id}. The buyer can now claim their code.` }); load();
                        }}>Approve</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "codes" && (
        <div className="mt-4">
          {!codes ? <p className="py-6 text-neutral-400">Loading</p> : codes.length === 0 ? <p className="py-6 text-neutral-500">No codes issued yet.</p> : (
            <ul>
              {codes.map((c) => (
                <li key={c.id} className="border-b border-neutral-900 py-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-mono text-xs">{c.id} <span className="text-neutral-500">· {c.source}{c.label ? ` · ${c.label}` : ""}</span></div>
                    <div className="mt-1 text-sm">{c.grants.length ? c.grants.map((g) => `${g.product} ${g.tier}`).join(", ") : <span className="text-neutral-500">nothing claimed yet</span>}</div>
                    <div className="mt-1 font-mono text-[11px] text-neutral-500">Issued {when(c.created_at)} · last used {when(c.last_used_at)}</div>
                  </div>
                  {c.revoked_at ? <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">Revoked</span> : (
                    <Button small variant="line" onClick={async () => {
                      if (!confirm(`Revoke ${c.id}? It stops working everywhere within 24 hours.`)) return;
                      await call(`/api/owner/codes/${c.id}/revoke`, undefined, true); load();
                    }}>Revoke</Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "grant" && (
        <form className="mt-6 max-w-md space-y-5" onSubmit={async (e) => {
          e.preventDefault(); setNewCode(null);
          const r: any = await call("/api/owner/grant", comp);
          setNewCode(r.code); setMsg(null); load();
        }}>
          <p className="text-sm text-neutral-400">Give someone free access (a tester, a partner). Creates a new access code.</p>
          <Field label="Product">
            <select className={inputCls} value={comp.product}
              onChange={(e) => { const p = PRODUCTS.find((x) => x.id === e.target.value)!; setComp({ ...comp, product: p.id, tier: p.tiers[0]?.id || "" }); }}>
              {PRODUCTS.filter((p) => p.tiers.length).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Tier">
            <select className={inputCls} value={comp.tier} onChange={(e) => setComp({ ...comp, tier: e.target.value })}>
              {tiersFor.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>
          <Field label="Label (who it's for)">
            <input className={inputCls} value={comp.label} onChange={(e) => setComp({ ...comp, label: e.target.value })} placeholder="e.g. beta tester" />
          </Field>
          <Button type="submit">Create code</Button>
          {newCode && (
            <div className="bg-white text-black p-4 flex items-center justify-between gap-3">
              <span className="font-mono font-semibold">{newCode}</span>
              <span className="text-black"><Copy value={newCode} /></span>
            </div>
          )}
        </form>
      )}
    </Page>
  );
}
