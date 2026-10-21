/**
 * Backend deployment-log tests — self-contained Monico Labs server (dist/server.cjs).
 * Covers the log-streaming endpoints plus project search and deployment
 * pagination added 2026-10-20:
 *   - GET  /api/projects?q=                  (project search)
 *   - GET  /api/projects/:id/deployments?limit=&offset=  (pagination)
 *   - GET  /api/projects/:id/deployments/:depId/logs?cursor=N (cursor polling)
 *   - GET  /api/projects/:id/deployments/:depId/logs/stream (SSE)
 * Run: node --test tests/backend-deployment-logs.test.cjs
 *      (requires `npm run build:server` first)
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const net = require("node:net");
const os = require("node:os");
const fs = require("node:fs");
const path = require("node:path");

const repo = path.join(__dirname, "..");
const serverEntry = path.join(repo, "dist", "server.cjs");

function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.once("error", reject);
    s.listen(0, "127.0.0.1", () => {
      const p = s.address().port;
      s.close(() => resolve(p));
    });
  });
}

function spawnServer(dataDir, port) {
  const child = spawn(process.execPath, [serverEntry], {
    cwd: repo,
    env: {
      PATH: process.env.PATH,
      PORT: String(port),
      VORTEX_HOST: "127.0.0.1",
      VORTEX_DATA_DIR: dataDir,
      NODE_ENV: "production",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stderr.on("data", () => {}); // stderr is diagnostics only
  return child;
}

async function waitForHttp(base, timeoutMs = 90000) {
  const start = Date.now();
  for (;;) {
    try {
      // /api/health is the readiness signal ("/" needs the built web client).
      const res = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) return;
    } catch {
      // not up yet
    }
    if (Date.now() - start > timeoutMs) throw new Error(`server at ${base} did not come up in time`);
    await new Promise((r) => setTimeout(r, 500));
  }
}

async function api(base, method, p, body) {
  const res = await fetch(`${base}${p}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(60000),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // non-JSON (404 HTML etc.)
  }
  return { status: res.status, text, json };
}

// Read SSE events from the stream until the "done" event or a timeout.
async function readSse(base, p, timeoutMs = 30000) {
  const res = await fetch(`${base}${p}`, { headers: { Accept: "text/event-stream" } });
  assert.equal(res.status, 200, `SSE stream status for ${p}`);
  assert.ok(
    (res.headers.get("content-type") || "").includes("text/event-stream"),
    "SSE content type"
  );
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const events = [];
  let buf = "";
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    if (Date.now() > deadline) break;
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf("\n\n")) !== -1) {
      const raw = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      const ev = { type: "message", data: null };
      for (const line of raw.split("\n")) {
        if (line.startsWith("event:")) ev.type = line.slice(6).trim();
        else if (line.startsWith("data:")) ev.data = line.slice(5).trim();
      }
      if (ev.type !== "message" || ev.data !== null) events.push(ev);
      if (ev.type === "done") {
        try {
          await reader.cancel();
        } catch {
          // already closed by server
        }
        return events;
      }
    }
  }
  return events;
}

test("deployment logs: cursor polling, SSE stream, project search, deployment pagination", async () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "vortex-logs-"));
  const port = await freePort();
  const base = `http://127.0.0.1:${port}`;
  const child = spawnServer(dataDir, port);
  try {
    await waitForHttp(base);

    // Create two projects so search has something to filter.
    const p1 = await api(base, "POST", "/api/projects", { name: "logs-alpha", repo: "local" });
    assert.equal(p1.status, 201, p1.text);
    const p2 = await api(base, "POST", "/api/projects", { name: "other-beta", repo: "local" });
    assert.equal(p2.status, 201, p2.text);

    // --- project search (?q=) ---
    const all = await api(base, "GET", "/api/projects");
    assert.equal(all.status, 200);
    assert.ok(all.json.length >= 2, "unfiltered list still returns the array shape");
    const hit = await api(base, "GET", "/api/projects?q=alpha");
    assert.equal(hit.status, 200);
    assert.ok(Array.isArray(hit.json), "search keeps the array response shape");
    assert.ok(hit.json.some((p) => p.id === p1.json.id), "search finds the matching project");
    assert.ok(!hit.json.some((p) => p.id === p2.json.id), "search excludes non-matching projects");
    const miss = await api(base, "GET", "/api/projects?q=zzz-no-such-project");
    assert.equal(miss.json.length, 0, "search with no matches returns []");

    // --- trigger a failing deployment (injectFailure -> terminal "failed" status) ---
    const trig = await api(base, "POST", `/api/projects/${p1.json.id}/deployments/trigger`, {
      injectFailure: true,
    });
    assert.equal(trig.status, 202, trig.text);
    const depId = trig.json.id;
    const depUrl = `/api/projects/${p1.json.id}/deployments/${depId}`;

    // --- cursor polling ---
    const logs0 = await api(base, "GET", `${depUrl}/logs?cursor=0`);
    assert.equal(logs0.status, 200, logs0.text);
    assert.ok(logs0.json.lines.length > 0, "seeded build logs are returned");
    assert.equal(logs0.json.lines[0].index, 0, "first line has index 0");
    assert.ok(
      logs0.json.lines.every((l, i) => l.index === i),
      "indexes are sequential from the cursor"
    );
    const cursor = logs0.json.cursor;
    const logs1 = await api(base, "GET", `${depUrl}/logs?cursor=${cursor}`);
    assert.equal(logs1.status, 200);
    assert.equal(logs1.json.lines.length, 0, "no new lines after the cursor");
    assert.equal(logs1.json.cursor, cursor, "cursor is stable when nothing is new");

    // --- SSE stream: must replay missed lines then close on terminal status ---
    const events = await readSse(base, `${depUrl}/logs/stream?cursor=0`);
    const logEvents = events.filter((e) => e.type === "log");
    assert.ok(logEvents.length > 0, "stream emits log events");
    const doneEvents = events.filter((e) => e.type === "done");
    assert.equal(doneEvents.length, 1, "stream emits exactly one done event");
    const doneStatus = JSON.parse(doneEvents[0].data).status;
    assert.ok(["ready", "error", "failed"].includes(doneStatus), `terminal status, got ${doneStatus}`);

    // --- deployment pagination ---
    const trig2 = await api(base, "POST", `/api/projects/${p1.json.id}/deployments/trigger`, {
      injectFailure: true,
    });
    assert.equal(trig2.status, 202, trig2.text);
    const allDeps = await api(base, "GET", `/api/projects/${p1.json.id}/deployments`);
    assert.ok(allDeps.json.length >= 2, "project has at least 2 deployments");
    const page = await api(base, "GET", `/api/projects/${p1.json.id}/deployments?limit=1&offset=0`);
    assert.equal(page.status, 200);
    assert.equal(page.json.length, 1, "limit=1 returns exactly one deployment");
    assert.equal(page.json[0].id, allDeps.json[0].id, "pagination keeps newest-first order");
    const page2 = await api(base, "GET", `/api/projects/${p1.json.id}/deployments?limit=1&offset=1`);
    assert.equal(page2.json.length, 1);
    assert.equal(page2.json[0].id, allDeps.json[1].id, "offset=1 returns the second deployment");

    // --- 404s for unknown deployment ---
    const missing = await api(base, "GET", `/api/projects/${p1.json.id}/deployments/nope/logs`);
    assert.equal(missing.status, 404);
  } finally {
    child.kill("SIGTERM");
    await new Promise((r) => child.once("exit", r));
  }
});
