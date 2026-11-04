/* Monico Labs console — data layer.
 *
 * Two backends behind one interface:
 *   server  — the Monico Node server (desktop app, Docker, self-host). Every
 *             console section is live: deploys, domains, env, functions,
 *             SQLite database, auth, API keys, firewall, analytics, teams.
 *   local   — no server reachable (static hosting such as Vercel/IPFS).
 *             Projects and deployments live in this browser's IndexedDB,
 *             deploys are HTML you paste or upload, and IPFS publishing runs
 *             in the page. Server-only sections say so instead of faking it.
 */
import { createIndexedDBStore, createMemoryStore, isIndexedDBAvailable, StateStore } from "../lib/store";
import { AppState, emptyState, newDeployment, newProject } from "../lib/model";

export type Framework = "static" | "react" | "nextjs" | "svelte" | "serverless";
export const FRAMEWORKS: { id: Framework; label: string }[] = [
  { id: "static", label: "Static HTML" }, { id: "react", label: "React / Vite" },
  { id: "nextjs", label: "Next.js" }, { id: "svelte", label: "SvelteKit" }, { id: "serverless", label: "API / Serverless" },
];

export interface Project {
  id: string; name: string; framework: string; repo?: string; branch?: string;
  createdAt: string; activeDeploymentId?: string;
}
export interface Deployment {
  id: string; projectId: string; status: "building" | "ready" | "failed" | "error";
  previewUrl?: string; createdAt: string; commitMessage?: string; commitHash?: string;
  buildLogs?: string[]; deployedHtml?: string; ipfsCid?: string; ipfsUrls?: string[]; ipfsPublishedAt?: string;
}
export interface EnvVar { id: string; key: string; value: string }
export interface Fn { id: string; projectId: string; name: string; route: string; code: string; description: string }
export interface FnLog { id: string; functionId: string; timestamp: string; status: number; durationMs: number; memoryMb: number; stdout: string[]; responseBody: string }
export interface DbTable { id: string; name: string; columns: { name: string; type: string }[]; rows: Record<string, unknown>[] }
export interface QueryResult { success: boolean; command?: string; fields?: string[]; rowCount?: number; rows: Record<string, unknown>[]; message?: string; error?: string }
export interface AuthUser { id: string; email: string; createdAt: string; lastLogin: string; status: "active" | "suspended"; role?: string }
export interface AuthConfig { jwtLifespan: number; allowSignup: boolean; passwordMinLength: number; providers: { emailPassword: boolean; magicLink: boolean; otp: boolean }; redirectUrls: string[] }
export interface ApiKey { id: string; name: string; secret: string; createdAt: string; rateLimit: number; description: string }
export interface WafRule { id: string; field: "ip" | "country" | "user_agent" | "uri"; operator: "eq" | "contains" | "ne"; value: string; action: "block" | "challenge" | "allow"; isEnabled: boolean }
export interface Shield { sslMode: string; developmentMode: boolean; brotli: boolean; securityLevel: string; wafRules: WafRule[]; totalThreatsBlocked: number }
export interface Threat { id: string; timestamp: string; ip: string; country: string; flag: string; threatType: string; action: string; query: string }
export interface Scaling { minInstances: number; maxInstances: number; targetCpuPercent: number; maxMemoryOption: string; concurrencyLimit: number; optimizeTreeShaking: boolean }
export interface AuditEntry { timestamp: string; action: string; user: string }
export interface Bucket { timestamp: string; requests: number; bandwidth: number; errors: number; latency: number }
export interface Workspace { id: string; name: string; owner: string; members: { email: string; role: string }[] }
export interface Health { ok: boolean; version?: string; selfContained?: boolean; storage?: string; deployMode?: string; degraded?: string[]; notes?: Record<string, string> }
export interface Metrics { metrics: { time?: string; cpu: number; ram: number }[]; totalRam: number; currentCpu: number; currentRam: number }

export class ApiError extends Error { status: number; constructor(m: string, s: number) { super(m); this.status = s; } }

async function req<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, { method, headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch { throw new ApiError("Can't reach the Monico server.", 0); }
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* non-JSON */ }
  if (!res.ok) throw new ApiError((data && data.error) || `Request failed (${res.status})`, res.status);
  return data as T;
}
const enc = encodeURIComponent;

/* ---------- mode detection ---------- */

export type Mode = { kind: "server"; health: Health } | { kind: "local" };

export async function detectMode(): Promise<Mode> {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 2500);
    const res = await fetch("/api/health", { signal: ctl.signal });
    clearTimeout(t);
    if (!res.ok) return { kind: "local" };
    const health = await res.json();
    return health && health.ok ? { kind: "server", health } : { kind: "local" };
  } catch { return { kind: "local" }; }
}

/* ---------- local (browser) store ---------- */

let localStore: StateStore | null = null;
let localState: AppState | null = null;
async function local(): Promise<AppState> {
  if (!localStore) localStore = isIndexedDBAvailable() ? createIndexedDBStore() : createMemoryStore();
  if (!localState) localState = (await localStore.load()) || emptyState();
  return localState;
}
async function saveLocal() { if (localStore && localState) await localStore.save(localState); }

/* ---------- unified project + deployment API ---------- */

export interface Backend {
  mode: Mode;
  listProjects(): Promise<Project[]>;
  createProject(p: { name: string; framework: string; repo?: string; branch?: string }): Promise<Project>;
  updateProject(id: string, patch: Partial<Project>): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  listDeployments(projectId: string): Promise<Deployment[]>;
  /** server: build from repo. local: deploy the given HTML. */
  deploy(projectId: string, opts: { commitMessage?: string; html?: string }): Promise<Deployment>;
  promote(projectId: string, deploymentId: string): Promise<void>;
  publishIpfs(projectId: string, dep: Deployment): Promise<{ cid: string; urls: string[] }>;
  previewHref(dep: Deployment): string;
}

export function serverBackend(mode: Mode): Backend {
  return {
    mode,
    listProjects: () => req<Project[]>("/api/projects"),
    createProject: (p) => req<Project>("/api/projects", "POST", { ...p, repo: p.repo || `local/${p.name}`, branch: p.branch || "main" }),
    updateProject: (id, patch) => req<Project>(`/api/projects/${enc(id)}`, "PUT", patch),
    deleteProject: async (id) => { await req(`/api/projects/${enc(id)}`, "DELETE"); },
    listDeployments: (pid) => req<Deployment[]>(`/api/projects/${enc(pid)}/deployments`),
    deploy: (pid, o) => req<Deployment>(`/api/projects/${enc(pid)}/deployments/trigger`, "POST", { commitMessage: o.commitMessage }),
    promote: async (pid, did) => { await req(`/api/projects/${enc(pid)}`, "PUT", { activeDeploymentId: did }); },
    publishIpfs: (pid, dep) => req(`/api/projects/${enc(pid)}/deployments/${enc(dep.id)}/publish`, "POST"),
    previewHref: (dep) => `/api/preview/${enc(dep.id)}`,
  };
}

export function localBackend(): Backend {
  return {
    mode: { kind: "local" },
    async listProjects() { return [...(await local()).projects].reverse() as Project[]; },
    async createProject(p) {
      const s = await local();
      const prj = { ...newProject(p.name), framework: p.framework, repo: p.repo, branch: p.branch || "main" };
      s.projects.push(prj); await saveLocal(); return prj as Project;
    },
    async updateProject(id, patch) {
      const s = await local(); const prj = s.projects.find((x) => x.id === id);
      if (!prj) throw new ApiError("Project not found", 404);
      Object.assign(prj, patch); await saveLocal(); return prj as Project;
    },
    async deleteProject(id) {
      const s = await local();
      s.projects = s.projects.filter((p) => p.id !== id);
      s.deployments = s.deployments.filter((d) => d.projectId !== id);
      await saveLocal();
    },
    async listDeployments(pid) {
      return (await local()).deployments.filter((d) => d.projectId === pid)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)) as Deployment[];
    },
    async deploy(pid, o) {
      if (!o.html || !o.html.trim()) throw new ApiError("Paste or upload the HTML to deploy.", 400);
      const s = await local();
      const dep = newDeployment(pid, o.html, o.commitMessage);
      dep.buildLogs = [
        `[local] stored ${new Blob([o.html]).size.toLocaleString()} bytes of HTML in this browser`,
        `[local] preview ready at #/preview/${dep.id}`,
      ];
      s.deployments.push(dep);
      const prj = s.projects.find((p) => p.id === pid);
      if (prj) prj.activeDeploymentId = dep.id;
      await saveLocal(); return dep as Deployment;
    },
    async promote(pid, did) {
      const s = await local(); const prj = s.projects.find((p) => p.id === pid);
      if (prj) { prj.activeDeploymentId = did; await saveLocal(); }
    },
    async publishIpfs(_pid, dep) {
      const { publishHtmlToIpfs } = await import("../lib/ipfs");
      if (!dep.deployedHtml) throw new ApiError("This deployment has no HTML to publish.", 400);
      const r = await publishHtmlToIpfs(dep.deployedHtml);
      const s = await local(); const d = s.deployments.find((x) => x.id === dep.id);
      if (d) { d.ipfsCid = r.cid; d.ipfsUrls = r.urls; d.ipfsPublishedAt = new Date().toISOString(); await saveLocal(); }
      return { cid: r.cid, urls: r.urls };
    },
    previewHref: (dep) => `#/preview/${dep.id}`,
  };
}

/* ---------- server-only sections ---------- */

export const api = {
  health: () => req<Health>("/api/health"),
  metrics: () => req<Metrics>("/api/metrics"),
  analytics: () => req<{ metrics: Bucket[]; sampleSize: number }>("/api/analytics"),
  mcpUrl: () => req<{ publicUrl?: string; rawUrl?: string; localUrl?: string }>("/api/mcp/public-url"),

  domains: (p: string) => req<string[]>(`/api/projects/${enc(p)}/domains`),
  addDomain: (p: string, domain: string) => req<string[]>(`/api/projects/${enc(p)}/domains`, "POST", { domain }),
  removeDomain: (p: string, d: string) => req<string[]>(`/api/projects/${enc(p)}/domains/${enc(d)}`, "DELETE"),

  env: (p: string) => req<EnvVar[]>(`/api/projects/${enc(p)}/env`),
  addEnv: (p: string, key: string, value: string) => req<EnvVar[]>(`/api/projects/${enc(p)}/env`, "POST", { key, value }),
  removeEnv: (p: string, id: string) => req<EnvVar[]>(`/api/projects/${enc(p)}/env/${enc(id)}`, "DELETE"),

  functions: (p: string) => req<Fn[]>(`/api/functions/${enc(p)}`),
  createFunction: (p: string, f: { name: string; route: string; code: string; description?: string }) => req<Fn>(`/api/functions/${enc(p)}`, "POST", f),
  runFunction: (functionId: string, reqBody: string, reqQuery: Record<string, string> = {}) =>
    req<{ status: number; durationMs?: number; stdout?: string[]; responseBody?: string; body?: string }>("/api/functions/run", "POST", { functionId, reqBody, reqQuery }),
  functionLogs: (fid: string) => req<FnLog[]>(`/api/functions/logs/${enc(fid)}`),

  tables: (p: string) => req<DbTable[]>(`/api/projects/${enc(p)}/database/tables`),
  createTable: (p: string, name: string) => req<DbTable>(`/api/projects/${enc(p)}/database/tables`, "POST", { name }),
  dropTable: (p: string, name: string) => req(`/api/projects/${enc(p)}/database/tables/${enc(name)}`, "DELETE"),
  query: (p: string, sql: string) => req<QueryResult>(`/api/projects/${enc(p)}/database/query`, "POST", { sql }),
  insertRow: (p: string, t: string, row: Record<string, unknown>) => req(`/api/projects/${enc(p)}/database/tables/${enc(t)}/record`, "POST", row),
  deleteRow: (p: string, t: string, id: string) => req(`/api/projects/${enc(p)}/database/tables/${enc(t)}/record/${enc(id)}`, "DELETE"),

  authConfig: (p: string) => req<AuthConfig>(`/api/projects/${enc(p)}/auth/config`),
  saveAuthConfig: (p: string, c: Partial<AuthConfig>) => req<AuthConfig>(`/api/projects/${enc(p)}/auth/config`, "POST", c),
  authUsers: (p: string) => req<AuthUser[]>(`/api/projects/${enc(p)}/auth/users`),
  addAuthUser: (p: string, email: string, role: string) => req<AuthUser>(`/api/projects/${enc(p)}/auth/users`, "POST", { email, role, status: "active" }),
  removeAuthUser: (p: string, id: string) => req(`/api/projects/${enc(p)}/auth/users/${enc(id)}`, "DELETE"),

  keys: (p: string) => req<ApiKey[]>(`/api/projects/${enc(p)}/api-keys`),
  createKey: (p: string, name: string, rateLimit: number) => req<ApiKey>(`/api/projects/${enc(p)}/api-keys`, "POST", { name, rateLimit }),
  revokeKey: (p: string, id: string) => req(`/api/projects/${enc(p)}/api-keys/${enc(id)}`, "DELETE"),

  shield: (p: string) => req<Shield>(`/api/projects/${enc(p)}/shield`),
  saveShield: (p: string, s: Partial<Shield>) => req<Shield>(`/api/projects/${enc(p)}/shield`, "POST", s),
  addWaf: (p: string, r: Omit<WafRule, "id">) => req<Shield>(`/api/projects/${enc(p)}/shield/waf`, "POST", r),
  removeWaf: (p: string, id: string) => req<{ wafRules: WafRule[] }>(`/api/projects/${enc(p)}/shield/waf/${enc(id)}`, "DELETE"),
  threats: (p: string) => req<{ totalBlocked: number; securityLevel: string; incidents: Threat[] }>(`/api/projects/${enc(p)}/shield/threats`),

  scaling: (p: string) => req<Scaling>(`/api/projects/${enc(p)}/scaling`),
  saveScaling: (p: string, s: Partial<Scaling>) => req<Scaling>(`/api/projects/${enc(p)}/scaling`, "POST", s),

  audit: (p: string) => req<AuditEntry[]>(`/api/projects/${enc(p)}/audit-logs`),

  workspaces: () => req<Workspace[]>("/api/workspaces"),
  addMember: (w: string, email: string, role: string) => req<Workspace>(`/api/workspaces/${enc(w)}/members`, "POST", { email, role }),
  removeMember: (w: string, email: string) => req<Workspace>(`/api/workspaces/${enc(w)}/members`, "DELETE", { email }),
};

/* Live build log stream (server only). Returns a closer. */
export function streamLogs(projectId: string, depId: string, onLine: (line: string) => void, onDone: (status: string) => void): () => void {
  if (typeof EventSource === "undefined") return () => {};
  const es = new EventSource(`/api/projects/${enc(projectId)}/deployments/${enc(depId)}/logs/stream`);
  es.addEventListener("log", (e: MessageEvent) => { try { onLine(JSON.parse(e.data).line); } catch { /* ignore */ } });
  es.addEventListener("done", (e: MessageEvent) => { try { onDone(JSON.parse(e.data).status); } catch { onDone("ready"); } es.close(); });
  es.onerror = () => es.close();
  return () => es.close();
}
