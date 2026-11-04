import { useEffect, useRef, useState } from "react";
import { ExternalLink, GitBranch, Github, Globe, Monitor, Rocket, Smartphone, Tablet, Upload, RotateCcw, Share2 } from "lucide-react";
import { api, Backend, Deployment, Project, streamLogs } from "../api";
import { ago, Badge, Btn, CopyBtn, cx, Empty, Field, inputCls, Modal, Notice, Panel, Spinner, Stat, statusTone, useLoad } from "../ui";
import { DEFAULT_SITE_TEMPLATE } from "../../lib/model";

export type Ctx = { backend: Backend; project: Project; deployments: Deployment[]; refresh: () => void; go: (tab: string) => void };

const isServer = (b: Backend) => b.mode.kind === "server";

/* ---------------- Overview ---------------- */

export function Overview({ backend, project, deployments, refresh, go }: Ctx) {
  const active = deployments.find((d) => d.id === project.activeDeploymentId) || deployments.find((d) => d.status === "ready");
  const [device, setDevice] = useState<"desktop" | "tablet" | "phone">("desktop");
  const domains = useLoad(() => (isServer(backend) ? api.domains(project.id) : Promise.resolve([] as string[])), [project.id]);
  const ready = deployments.filter((d) => d.status === "ready").length;
  const failed = deployments.filter((d) => d.status === "failed" || d.status === "error").length;
  const width = device === "desktop" ? "100%" : device === "tablet" ? "768px" : "390px";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Production" value={active ? <Badge tone="ok">Live</Badge> : <Badge>None</Badge>} sub={active ? `${active.id.slice(0, 14)} · ${ago(active.createdAt)}` : "Deploy to go live"} />
        <Stat label="Deployments" value={deployments.length} sub={`${ready} ready · ${failed} failed`} />
        <Stat label="Domains" value={domains.data?.length ?? (isServer(backend) ? "…" : "—")} sub={isServer(backend) ? "Routed by this server" : "Server mode only"} />
        <Stat label="Framework" value={<span className="text-lg uppercase">{project.framework}</span>} sub={project.branch ? `branch ${project.branch}` : "—"} />
      </div>

      <Panel title="Production preview" subtitle={active ? active.commitMessage || "Latest ready deployment" : undefined} pad={false}
        actions={active && <>
          <div className="flex rounded-lg border border-neutral-800 p-0.5">
            {([["desktop", Monitor], ["tablet", Tablet], ["phone", Smartphone]] as const).map(([d, I]) => (
              <button key={d} onClick={() => setDevice(d)} aria-label={d} className={cx("grid h-7 w-8 place-items-center rounded-md", device === d ? "bg-white text-neutral-950" : "text-neutral-500 hover:text-white")}><I className="h-3.5 w-3.5" /></button>
            ))}
          </div>
          <Btn kind="primary" href={backend.previewHref(active)} target="_blank"><ExternalLink className="h-3.5 w-3.5" />Visit</Btn>
        </>}>
        {active ? (
          <div className="bg-neutral-900/40 p-3 sm:p-5 flex justify-center">
            <div className="w-full overflow-hidden rounded-lg border border-neutral-800 bg-white transition-all" style={{ maxWidth: width }}>
              <div className="flex items-center gap-1.5 border-b border-neutral-200 bg-neutral-100 px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-neutral-300" /><span className="h-2 w-2 rounded-full bg-neutral-300" /><span className="h-2 w-2 rounded-full bg-neutral-300" />
                <span className="ml-2 truncate font-mono text-[10px] text-neutral-500">{domains.data?.[0] || active.previewUrl || project.name}</span>
              </div>
              {active.deployedHtml
                ? <iframe title="Production preview" srcDoc={active.deployedHtml} sandbox="allow-scripts" className="h-[460px] w-full bg-white" />
                : <iframe title="Production preview" src={backend.previewHref(active)} sandbox="allow-scripts allow-same-origin" className="h-[460px] w-full bg-white" />}
            </div>
          </div>
        ) : (
          <Empty icon={<Rocket className="h-5 w-5" />} title="Nothing deployed yet" action={<Btn kind="primary" onClick={() => go("deployments")}>Deploy now</Btn>}>
            Your first deployment becomes production automatically.
          </Empty>
        )}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Recent deployments" actions={<Btn kind="ghost" onClick={() => go("deployments")}>All →</Btn>} pad={false}>
          {deployments.length === 0 ? <p className="p-5 text-xs text-neutral-500">No deployments yet.</p> : (
            <ul className="divide-y divide-neutral-900">
              {deployments.slice(0, 5).map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm text-neutral-200">{d.commitMessage || "Deployment"}</div>
                    <div className="font-mono text-[11px] text-neutral-500">{d.commitHash || d.id.slice(0, 12)} · {ago(d.createdAt)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {d.id === project.activeDeploymentId && <Badge tone="live">Prod</Badge>}
                    <Badge tone={statusTone(d.status)}>{d.status}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Source">
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3"><dt className="flex items-center gap-2 text-neutral-500"><Github className="h-3.5 w-3.5" />Repository</dt>
              <dd className="truncate font-mono text-xs text-neutral-200">{project.repo && !project.repo.startsWith("local/") ? <a className="hover:underline" target="_blank" rel="noreferrer" href={`https://github.com/${project.repo}`}>{project.repo}</a> : "Not connected"}</dd></div>
            <div className="flex items-center justify-between gap-3"><dt className="flex items-center gap-2 text-neutral-500"><GitBranch className="h-3.5 w-3.5" />Branch</dt><dd className="font-mono text-xs text-neutral-200">{project.branch || "main"}</dd></div>
            <div className="flex items-center justify-between gap-3"><dt className="flex items-center gap-2 text-neutral-500"><Globe className="h-3.5 w-3.5" />Primary domain</dt><dd className="truncate font-mono text-xs text-neutral-200">{domains.data?.[0] || "—"}</dd></div>
            <div className="flex items-center justify-between gap-3"><dt className="text-neutral-500">Created</dt><dd className="font-mono text-xs text-neutral-200">{new Date(project.createdAt).toLocaleDateString()}</dd></div>
          </dl>
          <div className="mt-5 flex flex-wrap gap-2">
            <Btn onClick={() => go("domains")}>Domains</Btn><Btn onClick={() => go("environment")}>Environment</Btn><Btn onClick={() => go("settings")}>Settings</Btn>
            <Btn kind="ghost" onClick={refresh}>Refresh</Btn>
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ---------------- Deployments ---------------- */

function logClass(l: string) {
  if (/error|failed|critical/i.test(l)) return "text-red-300";
  if (/warn/i.test(l)) return "text-amber-200";
  if (/success|ready|done|✓/i.test(l)) return "text-emerald-300";
  return "text-neutral-400";
}

function LogConsole({ backend, project, dep, onDone }: { backend: Backend; project: Project; dep: Deployment; onDone: () => void }) {
  const [lines, setLines] = useState<string[]>(dep.buildLogs || []);
  const [status, setStatus] = useState(dep.status);
  const box = useRef<HTMLPreElement>(null);
  useEffect(() => {
    setLines(dep.buildLogs || []); setStatus(dep.status);
    if (!isServer(backend) || dep.status !== "building") return;
    setLines([]);
    return streamLogs(project.id, dep.id, (l) => setLines((x) => [...x, l]), (s) => { setStatus(s as Deployment["status"]); onDone(); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dep.id, dep.status]);
  useEffect(() => { box.current?.scrollTo({ top: box.current.scrollHeight }); }, [lines.length]);
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-900 bg-black">
      <div className="flex items-center justify-between border-b border-neutral-900 px-3 py-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">Build output · {lines.length} lines</span>
        <Badge tone={statusTone(status)}>{status}</Badge>
      </div>
      <pre ref={box} className="max-h-80 overflow-auto p-3 font-mono text-[11px] leading-relaxed">
        {lines.length === 0 ? <span className="text-neutral-600">Waiting for output…</span>
          : lines.map((l, i) => <div key={i} className={logClass(l)}><span className="select-none pr-3 text-neutral-700">{String(i + 1).padStart(3, " ")}</span>{l}</div>)}
      </pre>
    </div>
  );
}

function DeployDialog({ backend, project, open, onClose, onDeployed }: { backend: Backend; project: Project; open: boolean; onClose: () => void; onDeployed: (d: Deployment) => void }) {
  const [msg, setMsg] = useState("");
  const [html, setHtml] = useState(DEFAULT_SITE_TEMPLATE);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const server = isServer(backend);
  async function go() {
    setBusy(true); setErr(null);
    try { const d = await backend.deploy(project.id, { commitMessage: msg || undefined, html }); onDeployed(d); onClose(); setMsg(""); }
    catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }
  return (
    <Modal open={open} onClose={onClose} title={server ? "New deployment" : "Deploy HTML"} wide={!server}>
      <div className="space-y-4">
        {server ? (
          <Notice>Deploys <span className="text-neutral-200">{project.repo}</span> @ <span className="text-neutral-200">{project.branch || "main"}</span>. This server fetches the repo's static <span className="text-neutral-200">index.html</span> (root, public/, dist/ or src/) and serves it; it doesn't run your build command yet, so build output shown here is the server's own log.</Notice>
        ) : (
          <>
            <Notice>Browser-only mode: the deployment is stored in this browser and previewed from it. Publish it to IPFS afterwards to make it public.</Notice>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-neutral-500">index.html</span>
              <label className="inline-flex cursor-pointer items-center gap-1.5 font-mono text-[11px] uppercase text-neutral-400 hover:text-white">
                <Upload className="h-3.5 w-3.5" />Upload file
                <input type="file" accept=".html,.htm,text/html" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setHtml(await f.text()); }} />
              </label>
            </div>
            <textarea value={html} onChange={(e) => setHtml(e.target.value)} spellCheck={false}
              className="h-72 w-full rounded-lg border border-neutral-800 bg-black p-3 font-mono text-[11px] leading-relaxed text-neutral-200 focus:border-neutral-500 focus:outline-none" />
          </>
        )}
        <Field label="Deployment message"><input className={inputCls} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="What changed?" /></Field>
        {err && <Notice tone="error">{err}</Notice>}
        <div className="flex justify-end gap-2"><Btn kind="ghost" onClick={onClose}>Cancel</Btn><Btn kind="primary" busy={busy} onClick={go}><Rocket className="h-3.5 w-3.5" />Deploy</Btn></div>
      </div>
    </Modal>
  );
}

export function Deployments({ backend, project, deployments, refresh }: Ctx) {
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [filter, setFilter] = useState<"all" | "ready" | "building" | "failed">("all");
  const current = deployments.find((d) => d.id === sel) || deployments[0];

  useEffect(() => {
    if (!deployments.some((d) => d.status === "building")) return;
    const t = setInterval(refresh, 3000); return () => clearInterval(t);
  }, [deployments, refresh]);

  const list = deployments.filter((d) => filter === "all" || (filter === "failed" ? ["failed", "error"].includes(d.status) : d.status === filter));

  async function act(id: string, fn: () => Promise<unknown>, ok: string) {
    setBusy(id); setNote(null);
    try { await fn(); setNote({ tone: "ok", text: ok }); refresh(); } catch (e: any) { setNote({ tone: "error", text: e.message }); } finally { setBusy(null); }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-lg border border-neutral-900 p-0.5 font-mono text-[11px] uppercase">
          {(["all", "ready", "building", "failed"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={cx("rounded-md px-3 py-1.5", filter === f ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-white")}>{f}</button>
          ))}
        </div>
        <Btn kind="primary" size="md" onClick={() => setOpen(true)}><Rocket className="h-3.5 w-3.5" />New deployment</Btn>
      </div>
      {note && <Notice tone={note.tone}>{note.text}</Notice>}

      {deployments.length === 0 ? (
        <Panel><Empty icon={<Rocket className="h-5 w-5" />} title="No deployments" action={<Btn kind="primary" onClick={() => setOpen(true)}>Deploy</Btn>}>Ship your first version.</Empty></Panel>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <Panel pad={false} title={`${list.length} deployment${list.length === 1 ? "" : "s"}`}>
            <ul className="divide-y divide-neutral-900 max-h-[640px] overflow-y-auto">
              {list.map((d) => {
                const prod = d.id === project.activeDeploymentId;
                return (
                  <li key={d.id}>
                    <button onClick={() => setSel(d.id)} className={cx("w-full px-5 py-3.5 text-left transition", current?.id === d.id ? "bg-neutral-900/70" : "hover:bg-neutral-900/30")}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-sm text-neutral-200">{d.commitMessage || "Deployment"}</span>
                        <span className="flex shrink-0 gap-1.5">{prod && <Badge tone="live">Prod</Badge>}<Badge tone={statusTone(d.status)}>{d.status}</Badge></span>
                      </div>
                      <div className="mt-1 flex gap-3 font-mono text-[11px] text-neutral-500">
                        <span>{d.commitHash || d.id.slice(0, 12)}</span><span>{ago(d.createdAt)}</span>{d.ipfsCid && <span className="text-neutral-400">IPFS</span>}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Panel>

          {current && (
            <div className="space-y-4">
              <Panel title={current.commitMessage || "Deployment"} subtitle={<span className="font-mono">{current.id} · {new Date(current.createdAt).toLocaleString()}</span>}
                actions={<>
                  {current.status === "ready" && <Btn href={backend.previewHref(current)} target="_blank"><ExternalLink className="h-3.5 w-3.5" />Open</Btn>}
                  {current.status === "ready" && current.id !== project.activeDeploymentId && (
                    <Btn kind="primary" busy={busy === "promote"} onClick={() => act("promote", () => backend.promote(project.id, current.id), "Promoted to production.")}>
                      <RotateCcw className="h-3.5 w-3.5" />{deployments.findIndex((d) => d.id === current.id) > deployments.findIndex((d) => d.id === project.activeDeploymentId) ? "Roll back to this" : "Promote"}
                    </Btn>
                  )}
                </>}>
                <LogConsole backend={backend} project={project} dep={current} onDone={refresh} />
              </Panel>

              <Panel title="Publish to IPFS" subtitle="Static HTML only. Gets a content address anyone can load through public gateways.">
                {current.ipfsCid ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-neutral-900 bg-black px-3 py-2">
                      <span className="truncate font-mono text-xs text-neutral-200">{current.ipfsCid}</span><CopyBtn value={current.ipfsCid} />
                    </div>
                    <ul className="space-y-1">{(current.ipfsUrls || []).map((u) => (
                      <li key={u} className="flex items-center justify-between gap-3 font-mono text-[11px]"><a href={u} target="_blank" rel="noreferrer" className="truncate text-neutral-400 hover:text-white">{u}</a><CopyBtn value={u} /></li>
                    ))}</ul>
                    <p className="text-[11px] text-neutral-600">This device stays the provider while it's online; gateways were asked to cache it.</p>
                  </div>
                ) : (
                  <Btn busy={busy === "ipfs"} disabled={current.status !== "ready"}
                    onClick={() => act("ipfs", () => backend.publishIpfs(project.id, current), "Published to IPFS.")}><Share2 className="h-3.5 w-3.5" />Publish</Btn>
                )}
              </Panel>
            </div>
          )}
        </div>
      )}
      <DeployDialog backend={backend} project={project} open={open} onClose={() => setOpen(false)} onDeployed={(d) => { setSel(d.id); refresh(); }} />
    </div>
  );
}

export function Loading() { return <Spinner label="Loading project" />; }
