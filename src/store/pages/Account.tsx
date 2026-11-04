import { FormEvent, useEffect, useState } from "react";
import { findProduct, Grant, hub, hubOnline, recentOrders, storage } from "../api";
import { when } from "../format";
import { Button, Field, Label, Notice, Page, Spinner, inputCls } from "../ui";

const TOKEN_KEY = "ml.token";

export default function Account() {
  const [token, setToken] = useState(() => storage.get(TOKEN_KEY));
  const [grants, setGrants] = useState<Grant[] | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [code, setCode] = useState(() => storage.get("ml.lastCode") || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const orders = recentOrders();

  useEffect(() => {
    if (!token || !hubOnline) return;
    hub<{ role: string; grants: Grant[] | "*" }>("/api/me", { token })
      .then((r) => { setRole(r.role); setGrants(r.grants === "*" ? [] : r.grants); })
      .catch(async () => {
        try {
          const r = await hub<{ token: string; grants: Grant[] }>("/api/auth/refresh", { method: "POST", token });
          storage.set(TOKEN_KEY, r.token); setToken(r.token); setGrants(r.grants); setRole("customer");
        } catch { storage.del(TOKEN_KEY); setToken(null); }
      });
  }, [token]);

  async function signIn(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(null);
    try {
      const r = await hub<{ token: string; grants: Grant[] }>("/api/auth/code", { body: { code: code.trim() } });
      storage.set(TOKEN_KEY, r.token); storage.set("ml.lastCode", code.trim());
      setToken(r.token); setGrants(r.grants); setRole("customer"); setCode("");
    } catch (err: any) { setError(err.message); }
    finally { setBusy(false); }
  }

  function signOut() {
    storage.del(TOKEN_KEY); storage.del("ml.lastCode");
    setToken(null); setGrants(null); setRole(null);
  }

  return (
    <Page narrow>
      <Label>Account</Label>
      <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight">Your access</h1>

      {!token ? (
        <form onSubmit={signIn} className="mt-10 space-y-5">
          <Field label="Access code" hint="The ML- code you got after paying. It also signs you in on each product's own site.">
            <input className={inputCls} value={code} onChange={(e) => setCode(e.target.value)}
              placeholder="ML-XXXX-XXXX-XXXX-XXXX" autoComplete="off" spellCheck={false} required />
          </Field>
          {error && <Notice tone="error">{error}</Notice>}
          <Button type="submit" full disabled={!hubOnline || busy || !code.trim()}>
            {busy ? <><Spinner /> Checking</> : "Sign in"}
          </Button>
        </form>
      ) : (
        <section className="mt-10">
          {grants === null ? (
            <p className="flex items-center gap-2 text-neutral-400"><Spinner /> Loading…</p>
          ) : role === "owner" ? (
            <Notice>Signed in as owner: you have access to every product.</Notice>
          ) : grants.length === 0 ? (
            <Notice>This code doesn't unlock anything yet. If you just paid, open your order to finish.</Notice>
          ) : (
            <div className="border-l border-t border-neutral-900">
              {grants.map((g, i) => {
                const p = findProduct(g.product);
                const t = p?.tiers.find((x) => x.id === g.tier);
                return (
                  <div key={i} className="border-r border-b border-neutral-900 p-5 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-display text-xl font-semibold">{p?.name || g.product} <span className="text-neutral-400">{t?.name || g.tier}</span></div>
                      <div className="mt-1 font-mono text-[11px] text-neutral-500">
                        {g.source === "owner" ? "Granted" : "Purchased"} {when(g.granted_at)}
                      </div>
                    </div>
                    {p?.site ? <Button small href={p.site}>Open ↗</Button>
                      : <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">Site link soon</span>}
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="line" href="#/products">Buy more</Button>
            <Button variant="ghost" onClick={signOut}>Sign out</Button>
          </div>
        </section>
      )}

      {orders.length > 0 && (
        <section className="mt-14">
          <Label>Recent orders on this device</Label>
          <ul className="mt-3 border-t border-neutral-900">
            {orders.map((id) => (
              <li key={id} className="border-b border-neutral-900">
                <a href={`#/order/${id}`} className="flex justify-between py-3 font-mono text-sm hover:text-neutral-300">
                  <span>{id}</span><span aria-hidden>→</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Page>
  );
}
