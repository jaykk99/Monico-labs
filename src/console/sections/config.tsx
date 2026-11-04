import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff, Globe, KeyRound, Plus, Trash2 } from "lucide-react";
import { api, FRAMEWORKS, Scaling } from "../api";
import { ago, Badge, Btn, CopyBtn, Empty, Field, inputCls, Notice, Panel, selectCls, serverOnly, Spinner, Toggle, useLoad } from "../ui";
import type { Ctx } from "./project";

const server = (c: Ctx) => c.backend.mode.kind === "server";

/* ---------------- Domains ---------------- */

export const Domains = serverOnly("Domains", function DomainsInner(c: Ctx) {
  const { project } = c;
  const d = useLoad(() => api.domains(project.id), [project.id]);
  const [value, setValue] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const host = typeof window !== "undefined" ? window.location.host : "";

  async function add(e: FormEvent) {
    e.preventDefault(); setErr(null);
    const v = value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!/^(?=.{1,253}$)([a-z0-9-]+\.)+[a-z]{2,}$/.test(v) && !v.includes(":")) { setErr("That doesn't look like a domain (e.g. app.example.com)."); return; }
    try { d.set(await api.addDomain(project.id, v)); setValue(""); } catch (e: any) { setErr(e.message); }
  }
  return (
    <div className="space-y-5">
      <Panel title="Add domain" subtitle="Requests with this Host header are routed to the project's production deployment.">
        <form onSubmit={add} className="flex flex-col sm:flex-row gap-2">
          <input className={inputCls} value={value} onChange={(e) => setValue(e.target.value)} placeholder="app.yourdomain.com" />
          <Btn kind="primary" type="submit" size="md"><Plus className="h-3.5 w-3.5" />Add</Btn>
        </form>
        {err && <div className="mt-3"><Notice tone="error">{err}</Notice></div>}
      </Panel>
      <Panel title="Domains" pad={false}>
        {d.loading ? <Spinner /> : !d.data?.length ? <Empty icon={<Globe className="h-5 w-5" />} title="No domains yet">Add one above, then point its DNS at this server.</Empty> : (
          <ul className="divide-y divide-neutral-900">
            {d.data.map((dom, i) => (
              <li key={dom} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2"><span className="truncate font-mono text-sm text-neutral-100">{dom}</span>{i === 0 && <Badge tone="live">Primary</Badge>}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Btn kind="ghost" href={`http://${dom}`} target="_blank">Visit</Btn>
                  <Btn kind="danger" onClick={async () => { if (confirm(`Remove ${dom}?`)) d.set(await api.removeDomain(project.id, dom)); }}><Trash2 className="h-3.5 w-3.5" /></Btn>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Panel title="DNS setup">
        <p className="text-xs text-neutral-400 leading-relaxed">Create one of these records at your DNS provider, pointing at the machine running this server:</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full font-mono text-xs">
            <thead className="text-left text-[10px] uppercase tracking-widest text-neutral-500"><tr><th className="py-2 pr-6">Type</th><th className="pr-6">Name</th><th>Value</th></tr></thead>
            <tbody className="text-neutral-300">
              <tr className="border-t border-neutral-900"><td className="py-2 pr-6">A</td><td className="pr-6">@</td><td>your server's public IP</td></tr>
              <tr className="border-t border-neutral-900"><td className="py-2 pr-6">CNAME</td><td className="pr-6">app</td><td className="flex items-center gap-2">{host || "your-server-host"} {host && <CopyBtn value={host} />}</td></tr>
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
});

/* ---------------- Environment ---------------- */

export const Environment = serverOnly("Environment variables", function EnvironmentInner(c: Ctx) {
  const { project } = c;
  const env = useLoad(() => api.env(project.id), [project.id]);
  const [k, setK] = useState(""); const [v, setV] = useState("");
  const [show, setShow] = useState<Record<string, boolean>>({});
  const [bulk, setBulk] = useState(false); const [text, setText] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function add(e: FormEvent) {
    e.preventDefault(); setErr(null);
    if (!/^[A-Z_][A-Z0-9_]*$/i.test(k.trim())) { setErr("Keys use letters, numbers and underscores, and can't start with a number."); return; }
    try { env.set(await api.addEnv(project.id, k.trim(), v)); setK(""); setV(""); } catch (e: any) { setErr(e.message); }
  }
  async function importBulk() {
    setErr(null);
    const pairs = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#") && l.includes("="))
      .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).replace(/^export\s+/, "").trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; });
    try { let last = env.data; for (const [kk, vv] of pairs) last = await api.addEnv(project.id, kk, vv); if (last) env.set(last); setText(""); setBulk(false); }
    catch (e: any) { setErr(e.message); }
  }
  return (
    <div className="space-y-5">
      <Panel title="Add variable" subtitle="Available to builds and functions for this project. Values are hidden by default."
        actions={<Btn kind="ghost" onClick={() => setBulk(!bulk)}>{bulk ? "Single" : "Paste .env"}</Btn>}>
        {bulk ? (
          <div className="space-y-3">
            <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={"DATABASE_URL=postgres://…\nAPI_KEY=…"} spellCheck={false}
              className="h-40 w-full rounded-lg border border-neutral-800 bg-black p-3 font-mono text-xs text-neutral-200 focus:border-neutral-500 focus:outline-none" />
            <Btn kind="primary" onClick={importBulk}>Import</Btn>
          </div>
        ) : (
          <form onSubmit={add} className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
            <input className={inputCls} value={k} onChange={(e) => setK(e.target.value.toUpperCase())} placeholder="KEY" />
            <input className={inputCls} value={v} onChange={(e) => setV(e.target.value)} placeholder="value" type="password" autoComplete="off" />
            <Btn kind="primary" type="submit" size="md"><Plus className="h-3.5 w-3.5" />Add</Btn>
          </form>
        )}
        {err && <div className="mt-3"><Notice tone="error">{err}</Notice></div>}
      </Panel>
      <Panel title={`${env.data?.length ?? 0} variables`} pad={false}>
        {env.loading ? <Spinner /> : !env.data?.length ? <Empty title="No variables">Add secrets and config here instead of committing them.</Empty> : (
          <ul className="divide-y divide-neutral-900">
            {env.data.map((e) => (
              <li key={e.id} className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] items-center gap-3 px-5 py-3">
                <span className="truncate font-mono text-xs font-semibold text-neutral-100">{e.key}</span>
                <span className="hidden sm:block truncate font-mono text-xs text-neutral-400">{show[e.id] ? e.value || "(empty)" : "••••••••••••"}</span>
                <span className="flex items-center gap-1">
                  <button aria-label="Show value" onClick={() => setShow({ ...show, [e.id]: !show[e.id] })} className="p-1.5 text-neutral-500 hover:text-white">{show[e.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
                  <CopyBtn value={e.value} />
                  <button aria-label="Delete" onClick={async () => { if (confirm(`Delete ${e.key}?`)) env.set(await api.removeEnv(project.id, e.id)); }} className="p-1.5 text-neutral-500 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" /></button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
});

/* ---------------- API keys ---------------- */

export const Keys = serverOnly("API keys", function KeysInner(c: Ctx) {
  const { project } = c;
  const keys = useLoad(() => api.keys(project.id), [project.id]);
  const [name, setName] = useState(""); const [rate, setRate] = useState(60);
  const [fresh, setFresh] = useState<string | null>(null);
  return (
    <div className="space-y-5">
      <Panel title="Create API key" subtitle="For calling this project's functions and data API from your own code.">
        <form className="grid gap-2 sm:grid-cols-[1fr_160px_auto]" onSubmit={async (e) => {
          e.preventDefault(); const k = await api.createKey(project.id, name || "API key", rate); setFresh(k.secret); setName(""); keys.reload();
        }}>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Key name (e.g. mobile app)" />
          <div className="flex items-center gap-2"><input type="number" min={1} className={inputCls} value={rate} onChange={(e) => setRate(Number(e.target.value))} /><span className="font-mono text-[10px] text-neutral-500 whitespace-nowrap">/ min</span></div>
          <Btn kind="primary" type="submit" size="md"><KeyRound className="h-3.5 w-3.5" />Create</Btn>
        </form>
        {fresh && <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-white/20 bg-white/5 px-3 py-2.5">
          <span className="truncate font-mono text-xs text-white">{fresh}</span><CopyBtn value={fresh} label="Copy" />
        </div>}
      </Panel>
      <Panel title="Keys" pad={false}>
        {keys.loading ? <Spinner /> : !keys.data?.length ? <Empty title="No keys" /> : (
          <ul className="divide-y divide-neutral-900">
            {keys.data.map((k) => (
              <li key={k.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <div className="text-sm text-neutral-100">{k.name}</div>
                  <div className="font-mono text-[11px] text-neutral-500">{k.secret.slice(0, 12)}…{k.secret.slice(-4)} · {k.rateLimit}/min · created {ago(k.createdAt)}</div>
                </div>
                <div className="flex items-center gap-2"><CopyBtn value={k.secret} /><Btn kind="danger" onClick={async () => { if (confirm(`Revoke "${k.name}"? Apps using it stop working.`)) { await api.revokeKey(project.id, k.id); keys.reload(); } }}>Revoke</Btn></div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
});

/* ---------------- Settings ---------------- */

export function Settings(c: Ctx) {
  const { backend, project, refresh } = c;
  const [name, setName] = useState(project.name);
  const [framework, setFramework] = useState(project.framework);
  const [branch, setBranch] = useState(project.branch || "main");
  const [repo, setRepo] = useState(project.repo || "");
  const [saved, setSaved] = useState<string | null>(null);
  const scaling = useLoad(() => (server(c) ? api.scaling(project.id) : Promise.resolve(null as Scaling | null)), [project.id]);
  const [sc, setSc] = useState<Scaling | null>(null);
  useEffect(() => { if (scaling.data) setSc(scaling.data); }, [scaling.data]);
  useEffect(() => { setName(project.name); setFramework(project.framework); setBranch(project.branch || "main"); setRepo(project.repo || ""); }, [project.id]);

  return (
    <div className="space-y-5">
      <Panel title="General">
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={async (e) => {
          e.preventDefault(); await backend.updateProject(project.id, { name, framework, branch, repo }); setSaved("Saved."); refresh(); setTimeout(() => setSaved(null), 1800);
        }}>
          <Field label="Project name"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Framework"><select className={selectCls} value={framework} onChange={(e) => setFramework(e.target.value)}>{FRAMEWORKS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}</select></Field>
          <Field label="Git repository" hint="owner/repo on GitHub"><input className={inputCls} value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="jaykk99/my-site" /></Field>
          <Field label="Production branch"><input className={inputCls} value={branch} onChange={(e) => setBranch(e.target.value)} /></Field>
          <div className="sm:col-span-2 flex items-center gap-3"><Btn kind="primary" type="submit">Save</Btn>{saved && <span className="font-mono text-[11px] text-emerald-300">{saved}</span>}</div>
        </form>
      </Panel>

      {server(c) && (
        <Panel title="Scaling" subtitle="How this project's runtime scales on the server.">
          {!sc ? <Spinner /> : (
            <form className="grid gap-4 sm:grid-cols-3" onSubmit={async (e) => { e.preventDefault(); setSc(await api.saveScaling(project.id, sc)); setSaved("Scaling saved."); setTimeout(() => setSaved(null), 1800); }}>
              <Field label="Min instances"><input type="number" min={0} className={inputCls} value={sc.minInstances} onChange={(e) => setSc({ ...sc, minInstances: Number(e.target.value) })} /></Field>
              <Field label="Max instances"><input type="number" min={1} className={inputCls} value={sc.maxInstances} onChange={(e) => setSc({ ...sc, maxInstances: Number(e.target.value) })} /></Field>
              <Field label="Target CPU %"><input type="number" min={10} max={95} className={inputCls} value={sc.targetCpuPercent} onChange={(e) => setSc({ ...sc, targetCpuPercent: Number(e.target.value) })} /></Field>
              <Field label="Memory"><select className={selectCls} value={sc.maxMemoryOption} onChange={(e) => setSc({ ...sc, maxMemoryOption: e.target.value })}>{["128MB", "256MB", "512MB", "1GB", "2GB", "4GB"].map((m) => <option key={m}>{m}</option>)}</select></Field>
              <Field label="Concurrency per instance"><input type="number" min={1} className={inputCls} value={sc.concurrencyLimit} onChange={(e) => setSc({ ...sc, concurrencyLimit: Number(e.target.value) })} /></Field>
              <div className="sm:col-span-3"><Toggle on={sc.optimizeTreeShaking} onChange={(v) => setSc({ ...sc, optimizeTreeShaking: v })} label="Optimize bundle (tree-shaking)" /></div>
              <div className="sm:col-span-3"><Btn kind="primary" type="submit">Save scaling</Btn></div>
            </form>
          )}
        </Panel>
      )}

      <Panel title="Danger zone">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><div className="text-sm text-neutral-200">Delete this project</div><div className="text-xs text-neutral-500">Removes the project and its deployments. This can't be undone.</div></div>
          <Btn kind="danger" onClick={async () => {
            if (prompt(`Type "${project.name}" to delete it.`) !== project.name) return;
            await backend.deleteProject(project.id); window.location.hash = "#/"; refresh();
          }}><Trash2 className="h-3.5 w-3.5" />Delete project</Btn>
        </div>
      </Panel>
    </div>
  );
}
