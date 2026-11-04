import { FormEvent, useEffect, useState } from "react";
import { CodeXml, Database as DbIcon, Play, Plus, Table2, Trash2, UserPlus } from "lucide-react";
import { api, AuthConfig, Fn, QueryResult } from "../api";
import { ago, Badge, Btn, cx, Empty, Field, inputCls, Notice, Panel, selectCls, serverOnly, Spinner, Toggle, useLoad } from "../ui";
import type { Ctx } from "./project";

/* ---------------- Database ---------------- */

function ResultTable({ rows, fields }: { rows: Record<string, unknown>[]; fields?: string[] }) {
  const cols = fields && fields.length ? fields : rows.length ? Object.keys(rows[0]) : [];
  if (!rows.length) return <p className="px-4 py-6 font-mono text-xs text-neutral-500">0 rows</p>;
  return (
    <div className="overflow-auto max-h-[420px]">
      <table className="w-full font-mono text-[11px]">
        <thead className="sticky top-0 bg-neutral-950 text-left text-[10px] uppercase tracking-widest text-neutral-500">
          <tr>{cols.map((c) => <th key={c} className="border-b border-neutral-900 px-3 py-2 font-semibold whitespace-nowrap">{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-neutral-900/70 hover:bg-neutral-900/40">
              {cols.map((c) => <td key={c} className="px-3 py-1.5 text-neutral-300 whitespace-nowrap max-w-[280px] truncate">{r[c] === null || r[c] === undefined ? <span className="text-neutral-600">NULL</span> : String(r[c])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const Database = serverOnly("The database", function DatabaseInner({ project }: Ctx) {
  const tables = useLoad(() => api.tables(project.id), [project.id]);
  const [active, setActive] = useState<string | null>(null);
  const [sql, setSql] = useState("SELECT * FROM sqlite_master WHERE type = 'table';");
  const [res, setRes] = useState<QueryResult | null>(null);
  const [running, setRunning] = useState(false);
  const [newName, setNewName] = useState("");
  const [rowJson, setRowJson] = useState('{\n  "name": "example"\n}');
  const [err, setErr] = useState<string | null>(null);
  const table = tables.data?.find((t) => t.name === active) || tables.data?.[0];

  async function run() {
    setRunning(true);
    try { setRes(await api.query(project.id, sql)); if (!/^\s*select/i.test(sql)) tables.reload(); }
    catch (e: any) { setRes({ success: false, error: e.message, rows: [] }); } finally { setRunning(false); }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <Panel title="Tables" pad={false}>
          {tables.loading ? <Spinner /> : (
            <>
              <ul className="py-1">
                {(tables.data || []).map((t) => (
                  <li key={t.id}><button onClick={() => setActive(t.name)} className={cx("flex w-full items-center justify-between gap-2 px-4 py-2 text-left font-mono text-xs", table?.name === t.name ? "bg-neutral-900 text-white" : "text-neutral-400 hover:text-white")}>
                    <span className="flex items-center gap-2 truncate"><Table2 className="h-3.5 w-3.5 shrink-0" />{t.name}</span><span className="text-neutral-600">{t.rows.length}</span>
                  </button></li>
                ))}
                {!tables.data?.length && <li className="px-4 py-3 text-xs text-neutral-500">No tables yet.</li>}
              </ul>
              <form className="flex gap-1.5 border-t border-neutral-900 p-3" onSubmit={async (e: FormEvent) => {
                e.preventDefault(); setErr(null);
                if (!/^[a-z_][a-z0-9_]*$/i.test(newName)) { setErr("Table names: letters, numbers, underscores."); return; }
                try { await api.createTable(project.id, newName); setActive(newName); setNewName(""); tables.reload(); } catch (e: any) { setErr(e.message); }
              }}>
                <input className={inputCls} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="new_table" />
                <Btn type="submit" kind="primary"><Plus className="h-3.5 w-3.5" /></Btn>
              </form>
            </>
          )}
        </Panel>

        <Panel title={table ? table.name : "Rows"} subtitle={table ? `${table.rows.length} rows · SQLite on this server` : undefined} pad={false}
          actions={table && <Btn kind="danger" onClick={async () => { if (prompt(`Type "${table.name}" to drop the table and all its rows.`) === table.name) { await api.dropTable(project.id, table.name); setActive(null); tables.reload(); } }}><Trash2 className="h-3.5 w-3.5" />Drop</Btn>}>
          {!table ? <Empty icon={<DbIcon className="h-5 w-5" />} title="No tables">Create a table on the left, or run CREATE TABLE in the SQL console below.</Empty> : (
            <>
              <ResultTable rows={table.rows} />
              <details className="border-t border-neutral-900">
                <summary className="cursor-pointer px-4 py-3 font-mono text-[11px] uppercase tracking-widest text-neutral-400 hover:text-white">Insert row</summary>
                <div className="space-y-2 px-4 pb-4">
                  <textarea value={rowJson} onChange={(e) => setRowJson(e.target.value)} spellCheck={false} className="h-24 w-full rounded-lg border border-neutral-800 bg-black p-3 font-mono text-xs text-neutral-200 focus:outline-none focus:border-neutral-500" />
                  <Btn kind="primary" onClick={async () => {
                    setErr(null);
                    try { await api.insertRow(project.id, table.name, JSON.parse(rowJson)); tables.reload(); } catch (e: any) { setErr(e instanceof SyntaxError ? "Row must be valid JSON." : e.message); }
                  }}>Insert</Btn>
                </div>
              </details>
            </>
          )}
        </Panel>
      </div>
      {err && <Notice tone="error">{err}</Notice>}

      <Panel title="SQL console" subtitle="Runs against this project's SQLite database. ⌘/Ctrl + Enter to run."
        actions={<Btn kind="primary" busy={running} onClick={run}><Play className="h-3.5 w-3.5" />Run</Btn>} pad={false}>
        <textarea value={sql} onChange={(e) => setSql(e.target.value)} spellCheck={false}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); run(); } }}
          className="block h-32 w-full resize-y border-b border-neutral-900 bg-black p-4 font-mono text-xs leading-relaxed text-neutral-100 focus:outline-none" />
        {res && (res.success
          ? (res.command === "SELECT" ? <><div className="px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-neutral-500">{res.rowCount} rows</div><ResultTable rows={res.rows} fields={res.fields} /></>
            : <div className="p-4"><Notice tone="ok">{res.message || `${res.command}: ${res.rowCount} row(s) affected`}</Notice></div>)
          : <div className="p-4"><Notice tone="error">{res.error}</Notice></div>)}
      </Panel>
    </div>
  );
});

/* ---------------- Functions ---------------- */

const FN_TEMPLATE = `// Runs on the Monico server. 'req' has body + query.
export default async function handler(req) {
  const name = req.query.name || "world";
  return { status: 200, body: { hello: name, at: new Date().toISOString() } };
}
`;

export const Functions = serverOnly("Serverless functions", function FunctionsInner({ project }: Ctx) {
  const fns = useLoad(() => api.functions(project.id), [project.id]);
  const [sel, setSel] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ name: "hello.ts", route: "/api/hello", code: FN_TEMPLATE, description: "" });
  const [body, setBody] = useState("{}");
  const [query, setQuery] = useState("name=jay");
  const [out, setOut] = useState<{ status: number; durationMs?: number; stdout?: string[]; responseBody?: string; body?: string } | null>(null);
  const [running, setRunning] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fn: Fn | undefined = fns.data?.find((f) => f.id === sel) || fns.data?.[0];
  const logs = useLoad(() => (fn ? api.functionLogs(fn.id) : Promise.resolve([])), [fn?.id, out]);

  return (
    <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
      <Panel title="Functions" pad={false} actions={<Btn kind="primary" onClick={() => setCreating(true)}><Plus className="h-3.5 w-3.5" />New</Btn>}>
        {fns.loading ? <Spinner /> : !fns.data?.length ? <p className="p-4 text-xs text-neutral-500">No functions yet.</p> : (
          <ul className="py-1">{fns.data.map((f) => (
            <li key={f.id}><button onClick={() => { setSel(f.id); setCreating(false); setOut(null); }} className={cx("w-full px-4 py-2.5 text-left", !creating && fn?.id === f.id ? "bg-neutral-900" : "hover:bg-neutral-900/40")}>
              <div className="font-mono text-xs text-neutral-100">{f.name}</div><div className="font-mono text-[10px] text-neutral-500">{f.route}</div>
            </button></li>
          ))}</ul>
        )}
      </Panel>

      {creating ? (
        <Panel title="New function" actions={<><Btn kind="ghost" onClick={() => setCreating(false)}>Cancel</Btn><Btn kind="primary" onClick={async () => {
          setErr(null);
          try { const f = await api.createFunction(project.id, draft); setSel(f.id); setCreating(false); fns.reload(); } catch (e: any) { setErr(e.message); }
        }}>Create</Btn></>}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="File name"><input className={inputCls} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
            <Field label="Route"><input className={inputCls} value={draft.route} onChange={(e) => setDraft({ ...draft, route: e.target.value })} /></Field>
            <Field label="Description" className="sm:col-span-2"><input className={inputCls} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></Field>
          </div>
          <textarea value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} spellCheck={false}
            className="mt-4 h-72 w-full rounded-lg border border-neutral-800 bg-black p-3 font-mono text-xs leading-relaxed text-neutral-100 focus:outline-none focus:border-neutral-500" />
          {err && <div className="mt-3"><Notice tone="error">{err}</Notice></div>}
        </Panel>
      ) : !fn ? (
        <Panel><Empty icon={<CodeXml className="h-5 w-5" />} title="No functions" action={<Btn kind="primary" onClick={() => setCreating(true)}>Create one</Btn>}>Server-side endpoints for your project.</Empty></Panel>
      ) : (
        <div className="space-y-5 min-w-0">
          <Panel title={fn.name} subtitle={<span className="font-mono">{fn.route}{fn.description ? ` · ${fn.description}` : ""}</span>} pad={false}>
            <pre className="max-h-72 overflow-auto bg-black p-4 font-mono text-[11px] leading-relaxed text-neutral-200">{fn.code}</pre>
          </Panel>
          <Panel title="Test" actions={<Btn kind="primary" busy={running} onClick={async () => {
            setRunning(true); setErr(null);
            try { setOut(await api.runFunction(fn.id, body, Object.fromEntries(new URLSearchParams(query)))); } catch (e: any) { setErr(e.message); } finally { setRunning(false); }
          }}><Play className="h-3.5 w-3.5" />Invoke</Btn>}>
            <div className="mb-4"><Notice>Heads up: this server stores your function code but doesn't execute it yet. Invoking returns an echo of the request you sent (plus the built-in hello.ts and analyze-sentiment.ts demos).</Notice></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Query string"><input className={inputCls} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="a=1&b=2" /></Field>
              <Field label="JSON body"><input className={inputCls} value={body} onChange={(e) => setBody(e.target.value)} /></Field>
            </div>
            {err && <div className="mt-3"><Notice tone="error">{err}</Notice></div>}
            {out && (
              <div className="mt-4 space-y-2">
                <div className="flex gap-2"><Badge tone={out.status < 400 ? "ok" : "bad"}>{out.status}</Badge>{out.durationMs !== undefined && <Badge>{out.durationMs} ms</Badge>}</div>
                <pre className="max-h-56 overflow-auto rounded-lg border border-neutral-900 bg-black p-3 font-mono text-[11px] text-neutral-200">{out.responseBody ?? out.body}</pre>
                {out.stdout && out.stdout.length > 0 && <pre className="max-h-40 overflow-auto rounded-lg border border-neutral-900 bg-black p-3 font-mono text-[11px] text-neutral-500">{out.stdout.join("\n")}</pre>}
              </div>
            )}
          </Panel>
          <Panel title="Invocations" pad={false}>
            {!logs.data?.length ? <p className="p-4 text-xs text-neutral-500">No invocations yet.</p> : (
              <ul className="divide-y divide-neutral-900">{logs.data.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 px-5 py-2.5 font-mono text-[11px]">
                  <span className="text-neutral-400">{ago(l.timestamp)}</span>
                  <span className="flex gap-2"><Badge tone={l.status < 400 ? "ok" : "bad"}>{l.status}</Badge><span className="text-neutral-500">{l.durationMs} ms · {l.memoryMb} MB</span></span>
                </li>
              ))}</ul>
            )}
          </Panel>
        </div>
      )}
    </div>
  );
});

/* ---------------- Auth ---------------- */

export const Auth = serverOnly("Authentication", function AuthInner({ project }: Ctx) {
  const cfg = useLoad(() => api.authConfig(project.id), [project.id]);
  const users = useLoad(() => api.authUsers(project.id), [project.id]);
  const [c, setC] = useState<AuthConfig | null>(null);
  const [email, setEmail] = useState(""); const [role, setRole] = useState("member");
  const [msg, setMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [q, setQ] = useState("");
  useEffect(() => { if (cfg.data) setC(cfg.data); }, [cfg.data]);
  const list = (users.data || []).filter((u) => u.email.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <Panel title={`Users · ${users.data?.length ?? 0}`} pad={false}
        actions={<input className={inputCls + " w-44"} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search email" />}>
        <form className="flex flex-col sm:flex-row gap-2 border-b border-neutral-900 p-4" onSubmit={async (e) => {
          e.preventDefault(); setMsg(null);
          try { await api.addAuthUser(project.id, email, role); setEmail(""); users.reload(); } catch (e: any) { setMsg({ tone: "error", text: e.message }); }
        }}>
          <input className={inputCls} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="person@example.com" />
          <select className={selectCls + " sm:w-32"} value={role} onChange={(e) => setRole(e.target.value)}><option value="admin">Admin</option><option value="member">Member</option><option value="viewer">Viewer</option></select>
          <Btn kind="primary" type="submit" size="md"><UserPlus className="h-3.5 w-3.5" />Add</Btn>
        </form>
        {users.loading ? <Spinner /> : !list.length ? <p className="p-5 text-xs text-neutral-500">No users.</p> : (
          <ul className="divide-y divide-neutral-900">{list.map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0"><div className="truncate text-sm text-neutral-100">{u.email}</div><div className="font-mono text-[11px] text-neutral-500">joined {ago(u.createdAt)} · last seen {ago(u.lastLogin)}</div></div>
              <div className="flex items-center gap-2"><Badge>{u.role || "member"}</Badge><Badge tone={u.status === "active" ? "ok" : "bad"}>{u.status}</Badge>
                <button aria-label="Remove user" className="p-1.5 text-neutral-500 hover:text-red-300" onClick={async () => { if (confirm(`Remove ${u.email}?`)) { await api.removeAuthUser(project.id, u.id); users.reload(); } }}><Trash2 className="h-3.5 w-3.5" /></button></div>
            </li>
          ))}</ul>
        )}
      </Panel>

      <Panel title="Sign-in settings">
        {!c ? <Spinner /> : (
          <form onSubmit={async (e) => { e.preventDefault(); setC(await api.saveAuthConfig(project.id, c)); setMsg({ tone: "ok", text: "Auth settings saved." }); }}>
            <div className="divide-y divide-neutral-900">
              <Toggle on={c.providers.emailPassword} onChange={(v) => setC({ ...c, providers: { ...c.providers, emailPassword: v } })} label="Email + password" />
              <Toggle on={c.providers.magicLink} onChange={(v) => setC({ ...c, providers: { ...c.providers, magicLink: v } })} label="Magic link" hint="Needs an outbound mail sender" />
              <Toggle on={c.providers.otp} onChange={(v) => setC({ ...c, providers: { ...c.providers, otp: v } })} label="One-time code" />
              <Toggle on={c.allowSignup} onChange={(v) => setC({ ...c, allowSignup: v })} label="Allow new sign-ups" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Field label="Session (seconds)"><input type="number" min={300} className={inputCls} value={c.jwtLifespan} onChange={(e) => setC({ ...c, jwtLifespan: Number(e.target.value) })} /></Field>
              <Field label="Min password length"><input type="number" min={6} className={inputCls} value={c.passwordMinLength} onChange={(e) => setC({ ...c, passwordMinLength: Number(e.target.value) })} /></Field>
            </div>
            <Field label="Redirect URLs" hint="One per line" className="mt-3">
              <textarea className="h-20 w-full rounded-lg border border-neutral-800 bg-neutral-950 p-3 font-mono text-xs text-neutral-100 focus:outline-none focus:border-neutral-500"
                value={c.redirectUrls.join("\n")} onChange={(e) => setC({ ...c, redirectUrls: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })} />
            </Field>
            <div className="mt-4"><Btn kind="primary" type="submit">Save</Btn></div>
          </form>
        )}
        {msg && <div className="mt-3"><Notice tone={msg.tone}>{msg.text}</Notice></div>}
      </Panel>
    </div>
  );
});
