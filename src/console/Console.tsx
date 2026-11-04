import { FormEvent, useCallback, useEffect, useMemo, useState, type JSX } from "react";
import {
  Activity, ChartColumn, ChevronDown, CodeXml, Database, FolderOpen, Github, Globe, KeyRound, Layers, Plus, Rocket,
  Server, Settings as SettingsIcon, Shield, SlidersHorizontal, Users, Search,
} from "lucide-react";
import { Backend, Deployment, detectMode, FRAMEWORKS, localBackend, Mode, Project, serverBackend } from "./api";
import { ago, Badge, Btn, cx, Empty, Field, inputCls, Modal, Notice, selectCls, Spinner, statusTone } from "./ui";
import { Deployments, Overview, type Ctx } from "./sections/project";
import { Domains, Environment, Keys, Settings } from "./sections/config";
import { Auth, Database as DatabaseTab, Functions } from "./sections/data";
import { Activity as ActivityTab, Analytics, Firewall, System, Teams } from "./sections/ops";

type TabDef = { id: string; label: string; icon: any; server?: boolean; render: (c: Ctx) => JSX.Element };
const PROJECT_TABS: TabDef[] = [
  { id: "overview", label: "Overview", icon: FolderOpen, render: (c) => <Overview {...c} /> },
  { id: "deployments", label: "Deployments", icon: Rocket, render: (c) => <Deployments {...c} /> },
  { id: "domains", label: "Domains", icon: Globe, server: true, render: (c) => <Domains {...c} /> },
  { id: "environment", label: "Environment", icon: SlidersHorizontal, server: true, render: (c) => <Environment {...c} /> },
  { id: "functions", label: "Functions", icon: CodeXml, server: true, render: (c) => <Functions {...c} /> },
  { id: "database", label: "Database", icon: Database, server: true, render: (c) => <DatabaseTab {...c} /> },
  { id: "auth", label: "Auth", icon: Users, server: true, render: (c) => <Auth {...c} /> },
  { id: "keys", label: "API Keys", icon: KeyRound, server: true, render: (c) => <Keys {...c} /> },
  { id: "firewall", label: "Firewall", icon: Shield, server: true, render: (c) => <Firewall {...c} /> },
  { id: "analytics", label: "Analytics", icon: ChartColumn, server: true, render: (c) => <Analytics {...c} /> },
  { id: "activity", label: "Activity", icon: Activity, server: true, render: (c) => <ActivityTab {...c} /> },
  { id: "settings", label: "Settings", icon: SettingsIcon, render: (c) => <Settings {...c} /> },
];
const HOME_TABS = [
  { id: "projects", label: "Projects", icon: Layers },
  { id: "teams", label: "Teams", icon: Users },
  { id: "system", label: "System", icon: Server },
];

function useRoute() {
  const [hash, setHash] = useState(() => window.location.hash || "#/");
  useEffect(() => {
    const f = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", f); return () => window.removeEventListener("hashchange", f);
  }, []);
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
  if (parts[0] === "p" && parts[1]) return { kind: "project" as const, projectId: parts[1], tab: parts[2] || "overview" };
  return { kind: "home" as const, tab: parts[0] && HOME_TABS.some((t) => t.id === parts[0]) ? parts[0] : "projects" };
}
const nav = (h: string) => { window.location.hash = h; };

/* ---------------- New project ---------------- */

function NewProject({ backend, open, onClose, onCreated }: { backend: Backend; open: boolean; onClose: () => void; onCreated: (p: Project) => void }) {
  const [name, setName] = useState(""); const [repo, setRepo] = useState(""); const [branch, setBranch] = useState("main");
  const [framework, setFramework] = useState("static"); const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const server = backend.mode.kind === "server";
  useEffect(() => {
    const m = repo.trim().replace(/^https?:\/\/github\.com\//i, "").replace(/\.git$/, "");
    if (m.includes("/") && !name) setName(m.split("/")[1]);
  }, [repo]);
  async function submit(e: FormEvent) {
    e.preventDefault(); setErr(null);
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
    if (!slug) { setErr("Give the project a name."); return; }
    const cleanRepo = repo.trim().replace(/^https?:\/\/github\.com\//i, "").replace(/\.git$/, "").replace(/\/$/, "");
    if (cleanRepo && !/^[\w.-]+\/[\w.-]+$/.test(cleanRepo)) { setErr("Repository should look like owner/repo."); return; }
    setBusy(true);
    try { const p = await backend.createProject({ name: slug, framework, repo: cleanRepo || undefined, branch }); onCreated(p); onClose(); setName(""); setRepo(""); }
    catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }
  return (
    <Modal open={open} onClose={onClose} title="New project">
      <form onSubmit={submit} className="space-y-4">
        <Field label="GitHub repository" hint={server ? "Public repo, owner/repo or a github.com URL. Leave blank to start empty." : "Optional in browser-only mode: deploys are HTML you paste or upload."}>
          <div className="relative"><Github className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-neutral-600" />
            <input className={inputCls + " pl-9"} value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="jaykk99/my-site" /></div>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Project name"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="my-site" /></Field>
          <Field label="Branch"><input className={inputCls} value={branch} onChange={(e) => setBranch(e.target.value)} /></Field>
        </div>
        <Field label="Framework">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {FRAMEWORKS.map((f) => (
              <button type="button" key={f.id} onClick={() => setFramework(f.id)} className={cx("rounded-lg border px-3 py-2.5 text-left font-mono text-[11px] uppercase tracking-wider transition",
                framework === f.id ? "border-white bg-white text-neutral-950" : "border-neutral-800 text-neutral-400 hover:border-neutral-600")}>{f.label}</button>
            ))}
          </div>
        </Field>
        {err && <Notice tone="error">{err}</Notice>}
        <div className="flex justify-end gap-2 pt-1"><Btn kind="ghost" onClick={onClose}>Cancel</Btn><Btn kind="primary" type="submit" busy={busy}><Plus className="h-3.5 w-3.5" />Create project</Btn></div>
      </form>
    </Modal>
  );
}

/* ---------------- Projects dashboard ---------------- */

function ProjectsGrid({ backend, projects, onNew }: { backend: Backend; projects: Project[]; onNew: () => void }) {
  const [q, setQ] = useState("");
  const [deps, setDeps] = useState<Record<string, Deployment[]>>({});
  useEffect(() => {
    let alive = true;
    Promise.all(projects.map(async (p) => [p.id, await backend.listDeployments(p.id).catch(() => [])] as const))
      .then((rows) => alive && setDeps(Object.fromEntries(rows)));
    return () => { alive = false; };
  }, [projects, backend]);
  const list = projects.filter((p) => !q || `${p.name} ${p.repo || ""}`.toLowerCase().includes(q.toLowerCase()));

  if (!projects.length) {
    return (
      <div className="py-24 flex flex-col items-center text-center gap-8">
        <div className="relative"><div className="absolute -inset-4 rounded-full bg-white/5 blur-2xl" />
          <div className="relative grid h-20 w-20 place-items-center rounded-3xl border border-neutral-800 bg-neutral-900 shadow-2xl"><Plus className="h-10 w-10 text-white" /></div></div>
        <div className="max-w-sm space-y-3">
          <h2 className="text-2xl font-black uppercase tracking-tight text-white">No projects found</h2>
          <p className="font-mono text-sm leading-relaxed text-neutral-500">Your hosting is ready, but nothing is deployed yet. Import a repository or start from HTML to go live.</p>
        </div>
        <button onClick={onNew} className="group flex items-center gap-3 rounded-2xl bg-white px-8 py-4 text-sm font-black uppercase tracking-widest text-neutral-950 shadow-xl transition hover:scale-105 active:scale-95">
          <Github className="h-5 w-5" />Deploy first project
        </button>
      </div>
    );
  }
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-72"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-neutral-600" />
          <input className={inputCls + " pl-9"} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search projects" /></div>
        <Btn kind="primary" size="md" onClick={onNew}><Plus className="h-3.5 w-3.5" />New project</Btn>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((p) => {
          const ds = deps[p.id] || [];
          const prod = ds.find((d) => d.id === p.activeDeploymentId) || ds.find((d) => d.status === "ready");
          const last = ds[0];
          return (
            <a key={p.id} href={`#/p/${encodeURIComponent(p.id)}/overview`} className="group rounded-xl border border-neutral-900 bg-neutral-950/60 transition hover:border-neutral-700">
              <div className="h-32 overflow-hidden rounded-t-xl border-b border-neutral-900 bg-neutral-900/40">
                {prod?.deployedHtml
                  ? <iframe title={`${p.name} preview`} srcDoc={prod.deployedHtml} sandbox="" tabIndex={-1} className="pointer-events-none h-[400%] w-[400%] origin-top-left scale-25 bg-white" />
                  : <div className="grid h-full place-items-center font-mono text-[10px] uppercase tracking-widest text-neutral-600">{prod ? "Live" : "No deployment"}</div>}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-bold text-neutral-100">{p.name}</span>
                  {last && <Badge tone={statusTone(last.status)}>{last.status}</Badge>}
                </div>
                <div className="mt-1 truncate font-mono text-[11px] text-neutral-500">{p.repo && !p.repo.startsWith("local/") ? p.repo : "No repository"}</div>
                <div className="mt-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                  <span>{p.framework}</span><span>{last ? `deployed ${ago(last.createdAt)}` : `created ${ago(p.createdAt)}`}</span>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Shell ---------------- */

export default function Console() {
  const route = useRoute();
  const [mode, setMode] = useState<Mode | null>(null);
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [newOpen, setNewOpen] = useState(false);
  const [switcher, setSwitcher] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { detectMode().then(setMode); }, []);
  const backend = useMemo(() => (mode ? (mode.kind === "server" ? serverBackend(mode) : localBackend()) : null), [mode]);

  const loadProjects = useCallback(async () => {
    if (!backend) return;
    try { setProjects(await backend.listProjects()); setErr(null); } catch (e: any) { setErr(e.message); setProjects([]); }
  }, [backend]);
  useEffect(() => { loadProjects(); }, [loadProjects]);

  const project = route.kind === "project" ? projects?.find((p) => p.id === route.projectId) : undefined;
  const loadDeps = useCallback(async () => {
    if (!backend || !project) return;
    try { setDeployments(await backend.listDeployments(project.id)); } catch (e: any) { setErr(e.message); }
  }, [backend, project?.id]);
  useEffect(() => { setDeployments([]); loadDeps(); }, [loadDeps]);

  const refresh = useCallback(() => { loadProjects(); loadDeps(); }, [loadProjects, loadDeps]);
  const tab = route.kind === "project" ? PROJECT_TABS.find((t) => t.id === route.tab) || PROJECT_TABS[0] : null;
  const local = mode?.kind === "local";

  return (
    <div className="min-h-screen bg-[#070707] text-neutral-200 font-sans selection:bg-white selection:text-black">
      <header className="sticky top-0 z-30 border-b border-neutral-900 bg-[#0a0a0a]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <a href="#/" className="flex items-center gap-3" aria-label="Monico Labs console home">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-neutral-800 bg-neutral-900"><span className="h-3.5 w-3.5 rotate-45 rounded-[3px] bg-white" /></span>
              <span className="hidden sm:block leading-tight">
                <span className="block font-mono text-sm font-bold tracking-[0.12em] text-white">MONICO LABS</span>
                <span className="block font-mono text-[9px] font-semibold tracking-[0.18em] text-neutral-500">CONSOLE MANAGEMENT SUITE</span>
              </span>
            </a>
            {project && projects && (
              <div className="relative ml-1 sm:ml-3 min-w-0">
                <span className="mr-2 text-neutral-700">/</span>
                <button onClick={() => setSwitcher(!switcher)} className="inline-flex max-w-[48vw] items-center gap-1.5 rounded-lg px-2 py-1.5 font-mono text-xs font-semibold text-neutral-100 hover:bg-neutral-900">
                  <span className="truncate">{project.name}</span><ChevronDown className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
                </button>
                {switcher && (
                  <div className="absolute left-0 top-10 z-40 w-64 rounded-xl border border-neutral-800 bg-neutral-950 p-1.5 shadow-2xl" onMouseLeave={() => setSwitcher(false)}>
                    {projects.map((p) => (
                      <a key={p.id} href={`#/p/${encodeURIComponent(p.id)}/${route.kind === "project" ? route.tab : "overview"}`} onClick={() => setSwitcher(false)}
                        className={cx("block truncate rounded-lg px-3 py-2 font-mono text-xs", p.id === project.id ? "bg-neutral-900 text-white" : "text-neutral-400 hover:bg-neutral-900/60 hover:text-white")}>{p.name}</a>
                    ))}
                    <button onClick={() => { setSwitcher(false); setNewOpen(true); }} className="mt-1 flex w-full items-center gap-2 rounded-lg border-t border-neutral-900 px-3 py-2 font-mono text-xs text-neutral-400 hover:text-white"><Plus className="h-3.5 w-3.5" />New project</button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {mode && <span title={local ? "No server reachable: data stays in this browser" : "Connected to a Monico server"}>
              <Badge tone={local ? "neutral" : "ok"}><span className="whitespace-nowrap">{local ? <><span className="sm:hidden">Local</span><span className="hidden sm:inline">Browser mode</span></> : "Server"}</span></Badge></span>}
            <button onClick={() => setNewOpen(true)} className="flex h-9 items-center gap-2 rounded-lg bg-white px-4 font-mono text-[11px] font-bold uppercase tracking-wider text-neutral-950 shadow hover:bg-neutral-200">
              <Github className="h-3.5 w-3.5" /><span className="hidden sm:inline">Import Git</span><span className="sm:hidden">New</span>
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-5 overflow-x-auto px-4 md:px-8 text-[11px] [scrollbar-width:none]" aria-label="Sections">
          {(route.kind === "project" ? PROJECT_TABS : HOME_TABS).map((t) => {
            const active = route.kind === "project" ? t.id === tab?.id : t.id === route.tab;
            const Icon = t.icon;
            const dim = local && (t as TabDef).server;
            return (
              <a key={t.id} href={route.kind === "project" ? `#/p/${encodeURIComponent(route.projectId)}/${t.id}` : `#/${t.id === "projects" ? "" : t.id}`}
                className={cx("flex items-center gap-1.5 whitespace-nowrap border-b-2 py-3.5 font-mono font-semibold uppercase tracking-wider transition",
                  active ? "border-neutral-200 text-white" : "border-transparent text-neutral-500 hover:text-neutral-300", dim && !active && "opacity-50")}>
                <Icon className="h-3.5 w-3.5" />{t.label}
              </a>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        {err && <div className="mb-5"><Notice tone="error">{err}</Notice></div>}
        {!mode || !backend || projects === null ? <Spinner label="Connecting" /> : route.kind === "home" ? (
          route.tab === "teams" ? <Teams backend={backend} /> : route.tab === "system" ? <System backend={backend} /> :
            <ProjectsGrid backend={backend} projects={projects} onNew={() => setNewOpen(true)} />
        ) : !project ? (
          <Empty title="Project not found" action={<Btn href="#/">All projects</Btn>}>It may have been deleted.</Empty>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-neutral-900 pb-5">
              <div className="min-w-0 space-y-1.5">
                <div className="flex items-center gap-2"><h1 className="truncate text-2xl font-black uppercase tracking-tight text-neutral-100">{tab!.label}</h1>
                  <span className="rounded border border-neutral-800 bg-neutral-900 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-neutral-400">{project.framework}</span></div>
                <p className="font-mono text-xs text-neutral-500">{project.name}{project.repo && !project.repo.startsWith("local/") ? ` · ${project.repo}@${project.branch || "main"}` : ""}</p>
              </div>
              {tab!.id !== "deployments" && <Btn kind="primary" onClick={() => nav(`#/p/${encodeURIComponent(project.id)}/deployments`)}><Rocket className="h-3.5 w-3.5" />Deploy</Btn>}
            </div>
            {tab!.render({ backend, project, deployments, refresh, go: (t) => nav(`#/p/${encodeURIComponent(project.id)}/${t}`) })}
          </div>
        )}
      </main>

      {backend && <NewProject backend={backend} open={newOpen} onClose={() => setNewOpen(false)}
        onCreated={(p) => { loadProjects(); nav(`#/p/${encodeURIComponent(p.id)}/deployments`); }} />}
    </div>
  );
}
