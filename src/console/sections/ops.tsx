import { useEffect, useState } from "react";
import { Activity as ActivityIcon, Cpu, Plus, Server, Shield, Trash2, UserPlus, Workflow } from "lucide-react";
import { api, Health, Metrics, Shield as ShieldT, WafRule } from "../api";
import { ago, Badge, Btn, CopyBtn, Empty, Field, inputCls, Notice, Panel, selectCls, serverOnly, Spinner, Stat, Toggle, useLoad } from "../ui";
import type { Ctx } from "./project";

/* Tiny SVG charts — no chart library. */
function Bars({ values, height = 120, label }: { values: number[]; height?: number; label: string }) {
  const max = Math.max(1, ...values);
  const w = 100 / Math.max(values.length, 1);
  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="h-32 w-full" role="img" aria-label={label}>
      {values.map((v, i) => {
        const h = (v / max) * (height - 4);
        return <rect key={i} x={i * w + w * 0.15} y={height - h} width={w * 0.7} height={Math.max(h, v > 0 ? 1.5 : 0.5)} rx="0.6" className={v > 0 ? "fill-neutral-200" : "fill-neutral-800"} />;
      })}
    </svg>
  );
}
function Line({ values, max = 100, label }: { values: number[]; max?: number; label: string }) {
  const h = 60, n = Math.max(values.length - 1, 1);
  const pts = values.map((v, i) => `${(i / n) * 100},${h - (Math.min(v, max) / max) * (h - 2) - 1}`).join(" ");
  return (
    <svg viewBox={`0 0 100 ${h}`} preserveAspectRatio="none" className="h-24 w-full" role="img" aria-label={label}>
      {[0.25, 0.5, 0.75].map((f) => <line key={f} x1="0" x2="100" y1={h * f} y2={h * f} className="stroke-neutral-900" strokeWidth="0.4" vectorEffect="non-scaling-stroke" />)}
      {values.length > 1 && <polyline points={pts} fill="none" className="stroke-white" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />}
    </svg>
  );
}

/* ---------------- Firewall ---------------- */

export const Firewall = serverOnly("The firewall", function FirewallInner({ project }: Ctx) {
  const sh = useLoad(() => api.shield(project.id), [project.id]);
  const th = useLoad(() => api.threats(project.id), [project.id]);
  const [s, setS] = useState<ShieldT | null>(null);
  const [rule, setRule] = useState<Omit<WafRule, "id">>({ field: "ip", operator: "eq", value: "", action: "block", isEnabled: true });
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { if (sh.data) setS(sh.data); }, [sh.data]);
  const save = async (patch: Partial<ShieldT>) => { if (!s) return; const next = { ...s, ...patch }; setS(next); try { setS(await api.saveShield(project.id, patch)); } catch (e: any) { setErr(e.message); } };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Threats blocked" value={th.data?.totalBlocked ?? "…"} />
        <Stat label="Security level" value={<span className="text-lg uppercase">{s?.securityLevel || "…"}</span>} />
        <Stat label="WAF rules" value={s?.wafRules.length ?? "…"} sub={`${s?.wafRules.filter((r) => r.isEnabled).length ?? 0} enabled`} />
        <Stat label="SSL" value={<span className="text-lg uppercase">{s?.sslMode || "…"}</span>} />
      </div>
      {err && <Notice tone="error">{err}</Notice>}
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Protection">
          {!s ? <Spinner /> : (
            <div className="space-y-4">
              <Field label="Security level"><select className={selectCls} value={s.securityLevel} onChange={(e) => save({ securityLevel: e.target.value })}>
                {["off", "low", "medium", "high", "under-attack"].map((l) => <option key={l} value={l}>{l === "under-attack" ? "Under attack (challenge everyone)" : l}</option>)}</select></Field>
              <Field label="SSL mode"><select className={selectCls} value={s.sslMode} onChange={(e) => save({ sslMode: e.target.value })}>
                {["off", "flexible", "full", "strict"].map((l) => <option key={l}>{l}</option>)}</select></Field>
              <div className="divide-y divide-neutral-900">
                <Toggle on={s.brotli} onChange={(v) => save({ brotli: v })} label="Brotli compression" />
                <Toggle on={s.developmentMode} onChange={(v) => save({ developmentMode: v })} label="Development mode" hint="Bypass caching while you work" />
              </div>
            </div>
          )}
        </Panel>
        <Panel title="WAF rules" pad={false}>
          <form className="grid grid-cols-2 sm:grid-cols-[110px_110px_1fr_110px_auto] gap-2 border-b border-neutral-900 p-4" onSubmit={async (e) => {
            e.preventDefault(); setErr(null); if (!rule.value.trim()) return;
            try { setS(await api.addWaf(project.id, rule)); setRule({ ...rule, value: "" }); } catch (e: any) { setErr(e.message); }
          }}>
            <select className={selectCls} value={rule.field} onChange={(e) => setRule({ ...rule, field: e.target.value as WafRule["field"] })}><option value="ip">IP</option><option value="country">Country</option><option value="user_agent">User agent</option><option value="uri">Path</option></select>
            <select className={selectCls} value={rule.operator} onChange={(e) => setRule({ ...rule, operator: e.target.value as WafRule["operator"] })}><option value="eq">equals</option><option value="contains">contains</option><option value="ne">not equal</option></select>
            <input className={inputCls + " col-span-2 sm:col-span-1"} value={rule.value} onChange={(e) => setRule({ ...rule, value: e.target.value })} placeholder="value" />
            <select className={selectCls} value={rule.action} onChange={(e) => setRule({ ...rule, action: e.target.value as WafRule["action"] })}><option value="block">Block</option><option value="challenge">Challenge</option><option value="allow">Allow</option></select>
            <Btn kind="primary" type="submit"><Plus className="h-3.5 w-3.5" /></Btn>
          </form>
          {!s?.wafRules.length ? <p className="p-5 text-xs text-neutral-500">No rules. Traffic is filtered by security level only.</p> : (
            <ul className="divide-y divide-neutral-900">{s.wafRules.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-2.5 font-mono text-xs">
                <span className="truncate text-neutral-300">{r.field} {r.operator === "eq" ? "=" : r.operator === "ne" ? "≠" : "∋"} <span className="text-white">{r.value}</span></span>
                <span className="flex items-center gap-2"><Badge tone={r.action === "block" ? "bad" : r.action === "allow" ? "ok" : "warn"}>{r.action}</Badge>
                  <button aria-label="Delete rule" className="p-1 text-neutral-500 hover:text-red-300" onClick={async () => { const res = await api.removeWaf(project.id, r.id); setS((cur) => (cur ? { ...cur, wafRules: res.wafRules } : cur)); }}><Trash2 className="h-3.5 w-3.5" /></button></span>
              </li>
            ))}</ul>
          )}
        </Panel>
      </div>
      <Panel title="Recent incidents" subtitle="From real requests routed through this server" pad={false} actions={<Btn kind="ghost" onClick={th.reload}>Refresh</Btn>}>
        {th.loading ? <Spinner /> : !th.data?.incidents.length ? <Empty icon={<Shield className="h-5 w-5" />} title="No incidents">Nothing has been blocked or challenged yet.</Empty> : (
          <div className="overflow-x-auto"><table className="w-full font-mono text-[11px]">
            <thead className="text-left text-[10px] uppercase tracking-widest text-neutral-500"><tr><th className="px-5 py-2">When</th><th>IP</th><th>Country</th><th>Type</th><th>Action</th><th className="pr-5">Request</th></tr></thead>
            <tbody>{th.data.incidents.slice(0, 50).map((i) => (
              <tr key={i.id} className="border-t border-neutral-900 text-neutral-300"><td className="px-5 py-2 text-neutral-500 whitespace-nowrap">{ago(i.timestamp)}</td><td>{i.ip}</td><td>{i.flag} {i.country}</td><td>{i.threatType}</td>
                <td><Badge tone={i.action === "blocked" ? "bad" : i.action === "allowed" ? "ok" : "warn"}>{i.action}</Badge></td><td className="pr-5 max-w-[260px] truncate">{i.query}</td></tr>
            ))}</tbody>
          </table></div>
        )}
      </Panel>
    </div>
  );
});

/* ---------------- Analytics ---------------- */

export const Analytics = serverOnly("Analytics", function AnalyticsInner(_c: Ctx) {
  const a = useLoad(() => api.analytics(), []);
  useEffect(() => { const t = setInterval(a.reload, 10_000); return () => clearInterval(t); }, []);
  const m = a.data?.metrics || [];
  const total = m.reduce((s, b) => s + b.requests, 0);
  const errors = m.reduce((s, b) => s + b.errors, 0);
  const bw = m.reduce((s, b) => s + b.bandwidth, 0);
  const lat = m.filter((b) => b.requests).map((b) => b.latency);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Requests · 20 min" value={total.toLocaleString()} />
        <Stat label="Error rate" value={total ? `${((errors / total) * 100).toFixed(1)}%` : "0%"} sub={`${errors} errors`} />
        <Stat label="Avg latency" value={lat.length ? `${Math.round(lat.reduce((s, x) => s + x, 0) / lat.length)} ms` : "—"} />
        <Stat label="Bandwidth" value={bw >= 1024 ? `${(bw / 1024).toFixed(1)} MB` : `${bw.toFixed(0)} KB`} />
      </div>
      <Panel title="Requests per minute" subtitle={`Measured from ${a.data?.sampleSize ?? 0} real requests to this server · refreshes every 10 s`}>
        {a.loading && !a.data ? <Spinner /> : <><Bars values={m.map((b) => b.requests)} label="Requests per minute" />
          <div className="mt-2 flex justify-between font-mono text-[10px] text-neutral-600"><span>{m[0]?.timestamp}</span><span>{m[m.length - 1]?.timestamp}</span></div></>}
      </Panel>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Errors per minute"><Bars values={m.map((b) => b.errors)} label="Errors per minute" /></Panel>
        <Panel title="Latency (ms)"><Line values={m.map((b) => b.latency)} max={Math.max(50, ...m.map((b) => b.latency))} label="Latency" /></Panel>
      </div>
      <Notice>Web Vitals (LCP, CLS, INP) need a beacon in your site's pages; they aren't guessed here.</Notice>
    </div>
  );
});

/* ---------------- Activity ---------------- */

export const Activity = serverOnly("The activity log", function ActivityInner({ project }: Ctx) {
  const log = useLoad(() => api.audit(project.id), [project.id]);
  const [q, setQ] = useState("");
  const list = (log.data || []).filter((e) => !q || `${e.action} ${e.user}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <Panel title="Activity" subtitle="Every change made to this project, by people and by AI agents over MCP" pad={false}
      actions={<input className={inputCls + " w-48"} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter" />}>
      {log.loading ? <Spinner /> : !list.length ? <Empty icon={<ActivityIcon className="h-5 w-5" />} title="No activity yet" /> : (
        <ol className="divide-y divide-neutral-900">{list.map((e, i) => (
          <li key={i} className="flex items-start justify-between gap-4 px-5 py-3">
            <div className="min-w-0"><div className="text-sm text-neutral-200">{e.action}</div><div className="font-mono text-[11px] text-neutral-500">{e.user}</div></div>
            <time className="shrink-0 font-mono text-[11px] text-neutral-500" title={new Date(e.timestamp).toLocaleString()}>{ago(e.timestamp)}</time>
          </li>
        ))}</ol>
      )}
    </Panel>
  );
});

/* ---------------- Workspace: Teams ---------------- */

export const Teams = serverOnly("Teams", function TeamsInner(_c: { backend: Ctx["backend"] }) {
  const ws = useLoad(() => api.workspaces(), []);
  const [email, setEmail] = useState(""); const [role, setRole] = useState("Developer");
  const [err, setErr] = useState<string | null>(null);
  const w = ws.data?.[0];
  if (ws.loading) return <Spinner />;
  if (!w) return <Panel><Empty title="No workspace">The server creates one on first boot.</Empty></Panel>;
  return (
    <Panel title={w.name} subtitle={`Owner ${w.owner}`} pad={false}>
      <form className="flex flex-col sm:flex-row gap-2 border-b border-neutral-900 p-4" onSubmit={async (e) => {
        e.preventDefault(); setErr(null);
        try { await api.addMember(w.id, email, role); setEmail(""); ws.reload(); } catch (e: any) { setErr(e.message); }
      }}>
        <input type="email" required className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@example.com" />
        <select className={selectCls + " sm:w-40"} value={role} onChange={(e) => setRole(e.target.value)}>{["Admin", "Developer", "Viewer"].map((r) => <option key={r}>{r}</option>)}</select>
        <Btn kind="primary" type="submit" size="md"><UserPlus className="h-3.5 w-3.5" />Invite</Btn>
      </form>
      {err && <div className="p-4"><Notice tone="error">{err}</Notice></div>}
      <ul className="divide-y divide-neutral-900">{w.members.map((m) => (
        <li key={m.email} className="flex items-center justify-between gap-3 px-5 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-neutral-800 bg-neutral-900 font-mono text-[11px] uppercase text-neutral-300">{m.email.slice(0, 2)}</span>
            <span className="truncate text-sm text-neutral-100">{m.email}</span>
          </div>
          <div className="flex items-center gap-2"><Badge tone={m.role === "Owner" ? "live" : "neutral"}>{m.role}</Badge>
            {m.role !== "Owner" && <button aria-label="Remove member" className="p-1.5 text-neutral-500 hover:text-red-300" onClick={async () => { if (confirm(`Remove ${m.email}?`)) { await api.removeMember(w.id, m.email); ws.reload(); } }}><Trash2 className="h-3.5 w-3.5" /></button>}</div>
        </li>
      ))}</ul>
    </Panel>
  );
});

/* ---------------- Workspace: System ---------------- */

export function System({ backend }: { backend: Ctx["backend"] }) {
  if (backend.mode.kind !== "server") {
    return (
      <div className="space-y-5">
        <Panel title="Running in browser-only mode">
          <p className="text-sm text-neutral-400 leading-relaxed">No Monico server answered at this address, so projects and deployments are kept in this browser and published to IPFS from the page.
            Run the server to unlock domains, environment, database, functions, auth, API keys, firewall, analytics, teams and MCP.</p>
          <pre className="mt-4 overflow-x-auto rounded-lg border border-neutral-900 bg-black p-4 font-mono text-xs text-neutral-300">{`git clone https://github.com/jaykk99/monico-labs\ncd monico-labs && npm install\nnpm run dev            # http://localhost:3000\n\n# or: docker build -t monico-labs . && docker run -p 3000:3000 -v monico:/data monico-labs`}</pre>
        </Panel>
      </div>
    );
  }
  return <SystemServer health={backend.mode.health} />;
}

function SystemServer({ health }: { health: Health }) {
  const met = useLoad<Metrics>(() => api.metrics(), []);
  const mcp = useLoad(() => api.mcpUrl(), []);
  useEffect(() => { const t = setInterval(met.reload, 5000); return () => clearInterval(t); }, []);
  const m = met.data;
  const ramPct = m ? (m.currentRam / m.totalRam) * 100 : 0;
  const sse = mcp.data?.publicUrl || (typeof window !== "undefined" ? `${window.location.origin}/api/mcp/sse` : "");
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Status" value={<Badge tone={health.degraded?.length ? "warn" : "ok"}>{health.degraded?.length ? "Degraded" : "Healthy"}</Badge>} sub={health.version} />
        <Stat label="CPU" value={m ? `${Math.round(m.currentCpu)}%` : "…"} />
        <Stat label="Memory" value={m ? `${Math.round(ramPct)}%` : "…"} sub={m ? `${Math.round(m.currentRam)} / ${Math.round(m.totalRam)} MB` : undefined} />
        <Stat label="Storage" value={<span className="text-lg uppercase">{health.storage || "—"}</span>} sub={health.deployMode ? `deploys: ${health.deployMode}` : undefined} />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="CPU · last 2 min" actions={<Cpu className="h-3.5 w-3.5 text-neutral-500" />}><Line values={(m?.metrics || []).map((x) => x.cpu)} label="CPU usage" /></Panel>
        <Panel title="Memory · last 2 min" actions={<Server className="h-3.5 w-3.5 text-neutral-500" />}><Line values={(m?.metrics || []).map((x) => (m ? (x.ram / m.totalRam) * 100 : 0))} label="Memory usage" /></Panel>
      </div>
      <Panel title="Integrations" subtitle="What runs locally and what needs a key">
        {!health.degraded?.length ? <Notice tone="ok">Everything is running locally. No keys required.</Notice> : (
          <ul className="space-y-2">{health.degraded.map((d) => (
            <li key={d} className="flex items-start justify-between gap-4 rounded-lg border border-neutral-900 px-3.5 py-2.5">
              <span className="font-mono text-xs text-neutral-200">{d}</span><span className="text-right text-xs text-neutral-500">{health.notes?.[d] || "Not configured"}</span>
            </li>
          ))}</ul>
        )}
      </Panel>
      <Panel title="Connect an AI agent (MCP)" subtitle="Claude, Grok, Gemini and other MCP clients can deploy and manage projects on this server." actions={<Workflow className="h-3.5 w-3.5 text-neutral-500" />}>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-neutral-900 bg-black px-3 py-2.5"><span className="truncate font-mono text-xs text-neutral-200">{sse}</span><CopyBtn value={sse} /></div>
          <p className="text-xs text-neutral-500 leading-relaxed">Send <span className="font-mono text-neutral-300">Authorization: Bearer &lt;VRX_MCP_AUTH_TOKEN&gt;</span>. If you didn't set one, the server printed a token in its console on boot. Desktop app: <span className="font-mono text-neutral-300">npm run desktop:mcp-stdio</span> for stdio clients.</p>
        </div>
      </Panel>
    </div>
  );
}
