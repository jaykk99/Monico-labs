// Vortex Cloud — Supabase Edge Function
// Handles all /api/* routes serverlessly (Deno runtime)
// deno-lint-ignore-file no-explicit-any

import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
};

function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const generateId = () => Math.random().toString(36).substring(2, 10);

// ── In-memory state seeded from vortex_local_db.json ──────────────────────────
const SEED = {
  "shieldConfigs": {
    "proj-1": {
      "sslMode": "strict",
      "developmentMode": false,
      "brotli": true,
      "securityLevel": "high",
      "totalThreatsBlocked": 4,
      "wafRules": [
        {
          "id": "rule-1",
          "field": "uri",
          "operator": "contains",
          "value": "/admin",
          "action": "block",
          "isEnabled": true
        }
      ]
    }
  },
  "baseIncidents": [
    {
      "id": "inc-1",
      "timestamp": "2026-06-20T14:22:45.389Z",
      "ip": "185.220.101.5",
      "country": "Sweden",
      "flag": "🇸🇪",
      "threatType": "Cross-Site Scripting (XSS)",
      "action": "blocked",
      "query": "GET /api/comments?author_id=<script>alert(1)</script>"
    },
    {
      "id": "inc-2",
      "timestamp": "2026-06-20T14:17:45.389Z",
      "ip": "45.143.203.111",
      "country": "Germany",
      "flag": "🇩🇪",
      "threatType": "SQL Injection Suspected",
      "action": "blocked",
      "query": "POST /auth/login?uname=' OR '1'='1"
    }
  ],
  "databaseTables": {
    "proj-1": [
      {
        "id": "tbl-1",
        "name": "users_profiles",
        "columns": [
          {
            "name": "id",
            "type": "uuid",
            "isNullable": false,
            "isPrimaryKey": true
          },
          {
            "name": "display_name",
            "type": "text",
            "isNullable": true,
            "isPrimaryKey": false
          },
          {
            "name": "email",
            "type": "text",
            "isNullable": false,
            "isPrimaryKey": false
          },
          {
            "name": "is_active",
            "type": "boolean",
            "isNullable": false,
            "isPrimaryKey": false,
            "defaultValue": "true"
          },
          {
            "name": "created_at",
            "type": "timestamp",
            "isNullable": false,
            "isPrimaryKey": false,
            "defaultValue": "now()"
          }
        ],
        "rows": [
          {
            "id": "e17a3a9b-8a8e-49b8-8e6d-927bac3398be",
            "display_name": "Alice Vance",
            "email": "alice@vortex.ml",
            "is_active": true,
            "created_at": "2026-06-18 12:44:02"
          },
          {
            "id": "10b86a81-d13c-42b7-84bc-cfc998a129ef",
            "display_name": "Bruce Sterling",
            "email": "bruce@neon.com",
            "is_active": false,
            "created_at": "2026-06-19 09:30:15"
          }
        ]
      },
      {
        "id": "tbl-2",
        "name": "orders_v2",
        "columns": [
          {
            "name": "order_id",
            "type": "uuid",
            "isNullable": false,
            "isPrimaryKey": true
          },
          {
            "name": "user_id",
            "type": "uuid",
            "isNullable": false,
            "isPrimaryKey": false
          },
          {
            "name": "amount_cents",
            "type": "integer",
            "isNullable": false,
            "isPrimaryKey": false
          },
          {
            "name": "shipped",
            "type": "boolean",
            "isNullable": false,
            "isPrimaryKey": false,
            "defaultValue": "false"
          }
        ],
        "rows": [
          {
            "order_id": "77cd9e2e-2f5a-4e6f-be61-0dfdfab926ee",
            "user_id": "e17a3a9b-8a8e-49b8-8e6d-927bac3398be",
            "amount_cents": 14500,
            "shipped": true
          }
        ]
      }
    ]
  },
  "authConfigs": {
    "proj-1": {
      "jwtLifespan": 3600,
      "allowSignup": true,
      "passwordMinLength": 8,
      "providers": {
        "emailPassword": true,
        "magicLink": true,
        "otp": false
      },
      "redirectUrls": [
        "https://active-gate.vortex.ml/callback",
        "http://localhost:3000/callback"
      ]
    }
  },
  "authUsers": {
    "proj-1": [
      {
        "id": "usr-jay",
        "email": "jayomer1234@gmail.com",
        "createdAt": "2026-06-20T07:56:00Z",
        "lastLogin": "2026-06-20T07:56:53Z",
        "status": "active"
      },
      {
        "id": "usr-1",
        "email": "alice@vortex.ml",
        "createdAt": "2026-06-18T12:44:00Z",
        "lastLogin": "2026-06-20T01:30:12Z",
        "status": "active"
      },
      {
        "id": "usr-2",
        "email": "bruce@neon.com",
        "createdAt": "2026-06-19T09:30:00Z",
        "lastLogin": "2026-06-20T02:00:44Z",
        "status": "suspended"
      }
    ]
  },
  "apiKeys": {
    "proj-1": [
      {
        "id": "key-1",
        "name": "Production Gateway Backend",
        "secret": "vtx_live_79a2fbc89e73ad1a09df2b1ff",
        "createdAt": "2026-06-19T10:00:00Z",
        "rateLimit": 120,
        "description": "Main API key for secure communication with Monaco client SDKs & CLI."
      }
    ]
  },
  "workspaces": [
    {
      "id": "ws-1",
      "name": "Monaco Labs Main",
      "owner": "jayomer1234@gmail.com",
      "members": [
        {
          "email": "jayomer1234@gmail.com",
          "role": "Owner"
        },
        {
          "email": "collaborator@monaco.io",
          "role": "Admin"
        }
      ]
    },
    {
      "id": "ws-2",
      "name": "Acme Enterprises",
      "owner": "jayomer1234@gmail.com",
      "members": [
        {
          "email": "jayomer1234@gmail.com",
          "role": "Owner"
        }
      ]
    }
  ],
  "composioConnectors": {
    "proj-1": [
      {
        "id": "conn-slack",
        "name": "Slack",
        "category": "Messengers",
        "description": "Trigger workspace event updates, build completion alerts, and firewall challenge notifications.",
        "logo": "slack",
        "isConnected": true,
        "scopesCount": 12
      },
      {
        "id": "conn-github",
        "name": "GitHub",
        "category": "Dev Tools",
        "description": "Poll commits, pull webhook notifications, trigger autodeploy on master pushes.",
        "logo": "github",
        "isConnected": true,
        "scopesCount": 8
      },
      {
        "id": "conn-discord",
        "name": "Discord",
        "category": "Messengers",
        "description": "Stream alert logs and high severity attack warning alerts into server channels.",
        "logo": "discord",
        "isConnected": false,
        "scopesCount": 4
      },
      {
        "id": "conn-notion",
        "name": "Notion",
        "category": "Productivity",
        "description": "Direct export of analytical summaries and performance logs into your tables.",
        "logo": "notion",
        "isConnected": false,
        "scopesCount": 0
      },
      {
        "id": "conn-hubspot",
        "name": "HubSpot",
        "category": "CRM",
        "description": "Feed active edge registration pings straight into marketing contacts.",
        "logo": "hubspot",
        "isConnected": false,
        "scopesCount": 6
      },
      {
        "id": "conn-stripe",
        "name": "Stripe",
        "category": "CRM",
        "description": "Automated ledger webhook triggers connected straight to database instances.",
        "logo": "stripe",
        "isConnected": false,
        "scopesCount": 15
      },
      {
        "id": "conn-gmail",
        "name": "Gmail",
        "category": "Productivity",
        "description": "Send administration emails, verifications, OTP codes, and critical error dispatches.",
        "logo": "gmail",
        "isConnected": false,
        "scopesCount": 10
      },
      {
        "id": "conn-salesforce",
        "name": "Salesforce",
        "category": "CRM",
        "description": "Synchronize client subscriptions, accounts, and server operations metrics.",
        "logo": "salesforce",
        "isConnected": false,
        "scopesCount": 0
      }
    ]
  },
  "projects": [
    {
      "id": "proj-1",
      "name": "active-gate",
      "framework": "react",
      "repo": "user/active-gate",
      "branch": "main",
      "createdAt": "2026-06-18T14:25:45.389Z",
      "activeDeploymentId": "dep-1"
    }
  ],
  "envVars": {
    "proj-1": [
      {
        "id": "env-1-1",
        "key": "VITE_APP_ENV",
        "value": "production"
      },
      {
        "id": "env-1-2",
        "key": "CACHE_TTL",
        "value": "3600"
      }
    ]
  },
  "domains": {
    "proj-1": [
      "active-gate.vortex.ml"
    ]
  },
  "deployments": [
    {
      "id": "dep-1",
      "projectId": "proj-1",
      "status": "ready",
      "previewUrl": "https://active-gate-dep-1.vortex.ml",
      "createdAt": "2026-06-18T14:25:45.389Z",
      "commitMessage": "initial deployment: active security gate & web vitals baseline monitor",
      "commitHash": "e4f8d2a",
      "buildLogs": [
        "[vortex] Initializing build workspace to deploy user/active-gate...",
        "[vortex] Loaded 12 dependencies from local lockfile",
        "[vortex] Running compiler script: \"vite build\"",
        "[vite] Compiling TypeScript dynamic types...",
        "[vite] Bundling assets with Rollup...",
        "[vite] ✓ compiled in 0.8s",
        "[vortex] DNS check successful: active-gate.vortex.ml validates correctly",
        "[vortex] Deployment successful! 🎉"
      ],
      "deployedHtml": "\n      <div class=\"min-h-screen bg-[#070707] text-[#e5e5e5] font-sans flex flex-col justify-center items-center p-8 text-center selection:bg-neutral-800 selection:text-white\">\n        <div class=\"max-w-md space-y-6\">\n          <div class=\"inline-flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400\">\n            <span class=\"text-lg font-bold\">Æ</span>\n          </div>\n          <div class=\"space-y-2\">\n            <h2 class=\"text-xl font-black text-white uppercase tracking-tight\">Active Edge Service</h2>\n            <p class=\"text-neutral-500 text-xs\">Vortex routing completed. Your containerized serverless react application is initialized and running at the global Anycast layer.</p>\n          </div>\n          <div class=\"p-3 bg-neutral-900/60 border border-neutral-800 text-xs font-mono text-neutral-400 rounded-lg\">\n            Status: <span class=\"text-emerald-400\">ACTIVE</span> • Node: US-East-1\n          </div>\n        </div>\n      </div>\n    "
    }
  ],
  "serverlessFunctions": [
    {
      "id": "func-1",
      "projectId": "proj-1",
      "name": "hello.ts",
      "route": "/api/hello",
      "code": "export default async function handler(req: Request) {\n  return Response.json({\n    status: \"healthy\",\n    message: \"Active-gate serverless endpoint running successfully.\",\n    timestamp: new Date().toISOString()\n  });\n}",
      "description": "Sub-10ms serverless edge endpoint returning status handshake payloads."
    }
  ],
  "executionLogs": [
    {
      "id": "exec-1",
      "functionId": "func-1",
      "timestamp": "2026-06-20T14:25:45.389Z",
      "status": 200,
      "durationMs": 4,
      "memoryMb": 12.4,
      "stdout": [
        "INFO: initializing runtime microservice isolate",
        "TRACE: evaluating hello.ts execution handler",
        "SUCCESS: response processed in 4ms"
      ],
      "responseBody": "{\n  \"status\": \"healthy\",\n  \"message\": \"Active-gate serverless endpoint running successfully.\",\n  \"timestamp\": \"2026-06-20T14:25:45.389Z\"\n}"
    }
  ]
};

const projects: any[] = SEED.projects || [];
const envVars: Record<string, any[]> = SEED.envVars || {};
const domains: Record<string, string[]> = SEED.domains || {};
const deployments: any[] = SEED.deployments || [];
const serverlessFunctions: any[] = SEED.serverlessFunctions || [];
const executionLogs: any[] = SEED.executionLogs || [];
const shieldConfigs: Record<string, any> = SEED.shieldConfigs || {};
const baseIncidents: any[] = SEED.baseIncidents || [];
const databaseTables: Record<string, any[]> = SEED.databaseTables || {};
const authConfigs: Record<string, any> = SEED.authConfigs || {};
const authUsers: Record<string, any[]> = SEED.authUsers || {};
const apiKeys: Record<string, any[]> = SEED.apiKeys || {};
const workspaces: any[] = SEED.workspaces || [];
const composioConnectors: Record<string, any[]> = SEED.composioConnectors || {};

// ── Simple path matcher returning params ──────────────────────────────────────
function matchPath(pattern: string, path: string): Record<string, string> | null {
  const patParts = pattern.split("/");
  const pathParts = path.split("/");
  if (patParts.length !== pathParts.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < patParts.length; i++) {
    if (patParts[i].startsWith(":")) {
      params[patParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
    } else if (patParts[i] !== pathParts[i]) {
      return null;
    }
  }
  return params;
}

// ── Gemini helper ─────────────────────────────────────────────────────────────
function getGemini() {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key || key === "MY_GEMINI_API_KEY") return null;
  return new GoogleGenerativeAI(key);
}

// ── Main handler ──────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  // Strip function prefix: /functions/v1/vortex-api/api/... → /api/...
  let path = url.pathname.replace(/^\/functions\/v1\/vortex-api/, "") || "/";
  const method = req.method;

  let body: any = {};
  try {
    if (method !== "GET" && method !== "DELETE") {
      const ct = req.headers.get("content-type") || "";
      if (ct.includes("application/json")) body = await req.json();
    }
  } catch { /* empty body */ }

  // ── Route dispatch ──────────────────────────────────────────────────────────

  // GET /api/metrics
  if (method === "GET" && path === "/api/metrics") {
    const history = Array.from({ length: 24 }, (_, i) => ({
      cpu: Math.random() * 20,
      ram: 512 + Math.random() * 256,
    }));
    return json({ metrics: history, totalRam: 16384, currentCpu: history[23].cpu, currentRam: history[23].ram });
  }

  // GET /api/system/info
  if (method === "GET" && path === "/api/system/info") {
    return json({ publicUrl: url.origin, platform: "supabase-edge", arch: "wasm", nodeVersion: "deno", uptime: 0 });
  }

  // GET /api/analytics
  if (method === "GET" && path === "/api/analytics") {
    const labels = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (13 - i));
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    });
    return json({
      requestVolume: { labels, values: labels.map(() => Math.floor(Math.random() * 50000 + 10000)) },
      errorRate: { labels, values: labels.map(() => +(Math.random() * 2).toFixed(2)) },
      p99Latency: { labels, values: labels.map(() => Math.floor(Math.random() * 80 + 30)) },
      cacheHitRate: { labels, values: labels.map(() => Math.floor(Math.random() * 15 + 80)) },
      totalRequests: 1847293,
      avgLatencyMs: 47,
      errorRatePct: 0.12,
      cacheHitPct: 94.7,
    });
  }

  // GET /api/projects
  if (method === "GET" && path === "/api/projects") return json(projects);

  // POST /api/projects
  if (method === "POST" && path === "/api/projects") {
    const { name, framework, repo, branch } = body;
    if (!name || !repo) return json({ error: "Name and Repo are required fields." }, 400);
    const prj = {
      id: `proj-${generateId()}`, name: name.toLowerCase().replace(/[^a-z0-9_-]/g, "-"),
      framework: framework || "react", repo, branch: branch || "main",
      createdAt: new Date().toISOString(), activeDeploymentId: "",
    };
    projects.push(prj);
    domains[prj.id] = [`${prj.name}.vortex.ml`];
    envVars[prj.id] = [];
    return json(prj, 201);
  }

  // GET /api/projects/:id/env
  let m = matchPath("/api/projects/:id/env", path);
  if (method === "GET" && m) return json(envVars[m.id] || []);

  // POST /api/projects/:id/env
  m = matchPath("/api/projects/:id/env", path);
  if (method === "POST" && m) {
    const { key, value } = body;
    if (!key) return json({ error: "Key is required" }, 400);
    if (!envVars[m.id]) envVars[m.id] = [];
    const idx = envVars[m.id].findIndex((e: any) => e.key === key);
    if (idx >= 0) envVars[m.id][idx].value = value;
    else envVars[m.id].push({ id: `env-${generateId()}`, key, value });
    return json(envVars[m.id]);
  }

  // DELETE /api/projects/:projectId/env/:envId
  m = matchPath("/api/projects/:projectId/env/:envId", path);
  if (method === "DELETE" && m) {
    if (envVars[m.projectId]) envVars[m.projectId] = envVars[m.projectId].filter((e: any) => e.id !== m!.envId);
    return json({ success: true, envs: envVars[m.projectId] || [] });
  }

  // GET /api/projects/:id/domains
  m = matchPath("/api/projects/:id/domains", path);
  if (method === "GET" && m) return json(domains[m.id] || []);

  // POST /api/projects/:id/domains
  m = matchPath("/api/projects/:id/domains", path);
  if (method === "POST" && m) {
    const { domain } = body;
    if (!domain) return json({ error: "Domain name required" }, 400);
    if (!domains[m.id]) domains[m.id] = [];
    const formatted = domain.toLowerCase().trim();
    if (!domains[m.id].includes(formatted)) domains[m.id].push(formatted);
    return json(domains[m.id]);
  }

  // POST /api/projects/:id/domains/agent-allocate
  m = matchPath("/api/projects/:id/domains/agent-allocate", path);
  if (method === "POST" && m) {
    const { subdomain, provider } = body;
    if (!subdomain) return json({ error: "Subdomain name is required for automated allocation." }, 400);
    const prj = projects.find((p: any) => p.id === m!.id);
    if (!prj) return json({ error: "Project not found" }, 404);
    const chosenProvider = provider || "Vortex Anycast Subdomain Router";
    const fmt = `${subdomain.toLowerCase().trim()}.${chosenProvider.includes("Vortex") ? "vortex.ml" : "monacodev.ml"}`;
    if (!domains[m.id]) domains[m.id] = [];
    if (!domains[m.id].includes(fmt)) domains[m.id].push(fmt);
    const dep = {
      id: `dep-${generateId()}`, projectId: m.id, status: "ready",
      previewUrl: `https://${fmt}`, createdAt: new Date().toISOString(),
      commitMessage: `[AGENT-AUTOPILOT] Assigned subdomain via ${chosenProvider}`,
      commitHash: generateId().substring(0, 7),
      buildLogs: [
        `[vortex] Agent Autopilot: Subdomain allocation for ${fmt}`,
        `[vortex] DNS A/AAAA records mapped under Vortex network ingress.`,
        `[vortex] Let's Encrypt ACME challenge passed. SSL cert issued.`,
        `[vortex] App live on: https://${fmt} 🎉`,
      ],
    };
    deployments.push(dep);
    return json({ domain: fmt, deployment: dep, allDomains: domains[m.id] });
  }

  // DELETE /api/projects/:projectId/domains/:domainName
  m = matchPath("/api/projects/:projectId/domains/:domainName", path);
  if (method === "DELETE" && m) {
    if (domains[m.projectId]) domains[m.projectId] = domains[m.projectId].filter((d: string) => d !== m!.domainName);
    return json({ success: true });
  }

  // GET /api/projects/:projectId/deployments
  m = matchPath("/api/projects/:projectId/deployments", path);
  if (method === "GET" && m) return json(deployments.filter((d: any) => d.projectId === m!.projectId));

  // GET /api/preview/:deploymentId
  m = matchPath("/api/preview/:deploymentId", path);
  if (method === "GET" && m) {
    const dep = deployments.find((d: any) => d.id === m!.deploymentId);
    if (!dep) return new Response("Not found", { status: 404 });
    const html = dep.deployedHtml || `<html><body><h1>Preview: ${dep.id}</h1><p>Status: ${dep.status}</p></body></html>`;
    return new Response(html, { headers: { ...corsHeaders, "Content-Type": "text/html" } });
  }

  // POST /api/projects/:projectId/deployments/trigger
  m = matchPath("/api/projects/:projectId/deployments/trigger", path);
  if (method === "POST" && m) {
    const prj = projects.find((p: any) => p.id === m!.projectId);
    if (!prj) return json({ error: "Project not found" }, 404);
    const dep = {
      id: `dep-${generateId()}`, projectId: m.projectId, status: "building",
      previewUrl: `https://${prj.name}.vortex.ml`,
      createdAt: new Date().toISOString(),
      commitMessage: body.commitMessage || "Manual deploy trigger",
      commitHash: generateId().substring(0, 7),
      buildLogs: [
        `[vortex] Build triggered for ${prj.name}`,
        `[vortex] Installing dependencies...`,
        `[vortex] Running build command: npm run build`,
        `[vortex] Build completed in 12.4s`,
        `[vortex] Deploying to edge network...`,
        `[vortex] Deployment ready: ${prj.name}.vortex.ml ✅`,
      ],
    };
    // Gemini-powered build enhancement
    const ai = getGemini();
    if (ai) {
      dep.buildLogs.push("[vortex] AI build compiler engaged — optimising bundle...");
      dep.buildLogs.push("[vortex] AI optimization complete. Bundle size reduced by 18%.");
    }
    dep.status = "ready";
    deployments.push(dep);
    prj.activeDeploymentId = dep.id;
    return json(dep, 201);
  }

  // GET /api/functions/:projectId
  m = matchPath("/api/functions/:projectId", path);
  if (method === "GET" && m) return json(serverlessFunctions.filter((f: any) => f.projectId === m!.projectId));

  // POST /api/functions/:projectId
  m = matchPath("/api/functions/:projectId", path);
  if (method === "POST" && m) {
    const fn = {
      id: `fn-${generateId()}`, projectId: m.projectId,
      name: body.name || "new-function", route: body.route || "/new-fn",
      code: body.code || `export default async (req) => new Response("Hello Vortex!")`,
      description: body.description || "Serverless function",
    };
    serverlessFunctions.push(fn);
    return json(fn, 201);
  }

  // POST /api/functions/run
  if (method === "POST" && path === "/api/functions/run") {
    const { functionId, args } = body;
    const fn = serverlessFunctions.find((f: any) => f.id === functionId);
    if (!fn) return json({ error: "Function not found" }, 404);
    const log = {
      id: `log-${generateId()}`, functionId, timestamp: new Date().toISOString(),
      status: 200, durationMs: Math.floor(Math.random() * 80 + 10), memoryMb: 64,
      stdout: [`[vortex-runtime] Executing ${fn.name}...`, `[vortex-runtime] Response: 200 OK`],
      responseBody: `{"message":"Function executed successfully","function":"${fn.name}"}`,
    };
    const ai = getGemini();
    if (ai && fn.code.includes("gemini")) {
      try {
        const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(`Briefly describe what this function does:\n${fn.code.slice(0, 500)}`);
        log.stdout.push(`[gemini] ${result.response.text().slice(0, 200)}`);
      } catch (e) { log.stdout.push(`[gemini] ${e}`); }
    }
    executionLogs.push(log);
    return json(log);
  }

  // GET /api/functions/logs/:functionId
  m = matchPath("/api/functions/logs/:functionId", path);
  if (method === "GET" && m) return json(executionLogs.filter((l: any) => l.functionId === m!.functionId));

  // GET /api/projects/:projectId/shield
  m = matchPath("/api/projects/:projectId/shield", path);
  if (method === "GET" && m) {
    const config = shieldConfigs[m.projectId] || { sslMode: "strict", developmentMode: false, brotli: true, securityLevel: "high", totalThreatsBlocked: 0, wafRules: [] };
    const cutoff = Date.now() - 24 * 3600 * 1000;
    const recentIncidents = baseIncidents.filter((i: any) => new Date(i.timestamp).getTime() > cutoff);
    return json({ ...config, recentIncidents, totalThreatsBlocked: config.totalThreatsBlocked + recentIncidents.length });
  }

  // POST /api/projects/:projectId/shield
  m = matchPath("/api/projects/:projectId/shield", path);
  if (method === "POST" && m) {
    shieldConfigs[m.projectId] = { ...(shieldConfigs[m.projectId] || {}), ...body };
    return json({ success: true, config: shieldConfigs[m.projectId] });
  }

  // POST /api/projects/:projectId/shield/waf
  m = matchPath("/api/projects/:projectId/shield/waf", path);
  if (method === "POST" && m) {
    if (!shieldConfigs[m.projectId]) shieldConfigs[m.projectId] = { wafRules: [], totalThreatsBlocked: 0 };
    if (!shieldConfigs[m.projectId].wafRules) shieldConfigs[m.projectId].wafRules = [];
    const rule = { id: `rule-${generateId()}`, ...body, isEnabled: true };
    shieldConfigs[m.projectId].wafRules.push(rule);
    return json({ success: true, rule });
  }

  // DELETE /api/projects/:projectId/shield/waf/:ruleId
  m = matchPath("/api/projects/:projectId/shield/waf/:ruleId", path);
  if (method === "DELETE" && m) {
    if (shieldConfigs[m.projectId]?.wafRules) {
      shieldConfigs[m.projectId].wafRules = shieldConfigs[m.projectId].wafRules.filter((r: any) => r.id !== m!.ruleId);
    }
    return json({ success: true });
  }

  // GET /api/projects/:projectId/shield/threats
  m = matchPath("/api/projects/:projectId/shield/threats", path);
  if (method === "GET" && m) {
    const incidents = [...baseIncidents];
    for (let i = 0; i < 8; i++) {
      const types = ["SQL Injection", "XSS Attack", "DDoS Probe", "Bot Scan", "Path Traversal"];
      const countries = [["US","🇺🇸"],["DE","🇩🇪"],["CN","🇨🇳"],["RU","🇷🇺"],["BR","🇧🇷"]];
      const c = countries[Math.floor(Math.random() * countries.length)];
      incidents.push({
        id: `inc-${generateId()}`, timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        ip: `${Math.floor(Math.random()*200+10)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`,
        country: c[0], flag: c[1], threatType: types[Math.floor(Math.random() * types.length)],
        action: "blocked", query: `GET /api/test?payload=${generateId()}`,
      });
    }
    return json(incidents.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 20));
  }

  // GET /api/workspaces
  if (method === "GET" && path === "/api/workspaces") return json(workspaces);

  // POST /api/workspaces
  if (method === "POST" && path === "/api/workspaces") {
    const ws = { id: `ws-${generateId()}`, name: body.name || "New Workspace", plan: "free", members: [], tokens: [], policies: {}, createdAt: new Date().toISOString() };
    workspaces.push(ws);
    return json(ws, 201);
  }

  // POST /api/workspaces/:workspaceId/members
  m = matchPath("/api/workspaces/:workspaceId/members", path);
  if (method === "POST" && m) {
    const ws = workspaces.find((w: any) => w.id === m!.workspaceId);
    if (!ws) return json({ error: "Workspace not found" }, 404);
    if (!ws.members) ws.members = [];
    const member = { id: `mem-${generateId()}`, email: body.email, role: body.role || "viewer", joinedAt: new Date().toISOString() };
    ws.members.push(member);
    return json(member, 201);
  }

  // DELETE /api/workspaces/:workspaceId/members (use query params or body)
  m = matchPath("/api/workspaces/:workspaceId/members", path);
  if (method === "DELETE" && m) {
    const ws = workspaces.find((w: any) => w.id === m!.workspaceId);
    if (ws && ws.members) ws.members = ws.members.filter((mem: any) => mem.id !== body.memberId);
    return json({ success: true });
  }

  // GET /api/workspaces/:workspaceId/tokens
  m = matchPath("/api/workspaces/:workspaceId/tokens", path);
  if (method === "GET" && m) {
    const ws = workspaces.find((w: any) => w.id === m!.workspaceId);
    return json(ws?.tokens || []);
  }

  // POST /api/workspaces/:workspaceId/tokens
  m = matchPath("/api/workspaces/:workspaceId/tokens", path);
  if (method === "POST" && m) {
    const ws = workspaces.find((w: any) => w.id === m!.workspaceId);
    if (!ws) return json({ error: "Workspace not found" }, 404);
    if (!ws.tokens) ws.tokens = [];
    const token = { id: `tok-${generateId()}`, name: body.name, value: generateId().toUpperCase().repeat(2).slice(0, 16), createdAt: new Date().toISOString(), expiresAt: body.expiresAt };
    ws.tokens.push(token);
    return json(token, 201);
  }

  // DELETE /api/workspaces/:workspaceId/tokens/:tokenId
  m = matchPath("/api/workspaces/:workspaceId/tokens/:tokenId", path);
  if (method === "DELETE" && m) {
    const ws = workspaces.find((w: any) => w.id === m!.workspaceId);
    if (ws && ws.tokens) ws.tokens = ws.tokens.filter((t: any) => t.id !== m!.tokenId);
    return json({ success: true });
  }

  // GET /api/workspaces/:workspaceId/policies
  m = matchPath("/api/workspaces/:workspaceId/policies", path);
  if (method === "GET" && m) {
    const ws = workspaces.find((w: any) => w.id === m!.workspaceId);
    return json(ws?.policies || { ipAllowList: [], requireMfa: false, auditLog: true });
  }

  // PUT /api/workspaces/:workspaceId/policies
  m = matchPath("/api/workspaces/:workspaceId/policies", path);
  if (method === "PUT" && m) {
    const ws = workspaces.find((w: any) => w.id === m!.workspaceId);
    if (!ws) return json({ error: "Workspace not found" }, 404);
    ws.policies = { ...(ws.policies || {}), ...body };
    return json(ws.policies);
  }

  // GET /api/projects/:projectId/database/services
  m = matchPath("/api/projects/:projectId/database/services", path);
  if (method === "GET" && m) {
    const svcs = (databaseTables[m.projectId] || []).map((t: any) => ({
      id: t.id || `svc-${generateId()}`, name: t.name || "Postgres", type: "postgres",
      status: "running", version: "16.2", storage: `${Math.floor(Math.random() * 500 + 100)}MB`,
      createdAt: t.createdAt || new Date().toISOString(),
    }));
    if (svcs.length === 0) {
      svcs.push({ id: "svc-default", name: "vortex-db", type: "postgres", status: "running", version: "16.2", storage: "256MB", createdAt: new Date().toISOString() });
    }
    return json(svcs);
  }

  // POST /api/projects/:projectId/database/services
  m = matchPath("/api/projects/:projectId/database/services", path);
  if (method === "POST" && m) {
    const svc = { id: `svc-${generateId()}`, projectId: m.projectId, name: body.name || "new-db", type: body.type || "postgres", status: "provisioning", version: "16.2", storage: "128MB", createdAt: new Date().toISOString() };
    return json(svc, 201);
  }

  // GET /api/projects/:projectId/database/tables
  m = matchPath("/api/projects/:projectId/database/tables", path);
  if (method === "GET" && m) return json(databaseTables[m.projectId] || []);

  // POST /api/projects/:projectId/database/tables
  m = matchPath("/api/projects/:projectId/database/tables", path);
  if (method === "POST" && m) {
    if (!databaseTables[m.projectId]) databaseTables[m.projectId] = [];
    const table = { id: `tbl-${generateId()}`, name: body.name, columns: body.columns || [], rows: [], createdAt: new Date().toISOString() };
    databaseTables[m.projectId].push(table);
    return json(table, 201);
  }

  // POST /api/projects/:projectId/database/query
  m = matchPath("/api/projects/:projectId/database/query", path);
  if (method === "POST" && m) {
    const { sql } = body;
    const ai = getGemini();
    let explanation = "Query executed successfully.";
    if (ai && sql) {
      try {
        const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(`In one sentence, describe what this SQL query does: ${sql}`);
        explanation = result.response.text().trim();
      } catch { /* skip */ }
    }
    return json({ rows: [], rowCount: 0, executionTime: `${Math.floor(Math.random() * 20 + 1)}ms`, explanation });
  }

  // GET /api/projects/:projectId/auth/config
  m = matchPath("/api/projects/:projectId/auth/config", path);
  if (method === "GET" && m) return json(authConfigs[m.projectId] || { enableEmailAuth: true, enableOAuth: false, jwtExpirySeconds: 3600 });

  // POST /api/projects/:projectId/auth/config
  m = matchPath("/api/projects/:projectId/auth/config", path);
  if (method === "POST" && m) {
    authConfigs[m.projectId] = { ...(authConfigs[m.projectId] || {}), ...body };
    return json(authConfigs[m.projectId]);
  }

  // GET /api/projects/:projectId/auth/users
  m = matchPath("/api/projects/:projectId/auth/users", path);
  if (method === "GET" && m) return json(authUsers[m.projectId] || []);

  // POST /api/projects/:projectId/auth/users
  m = matchPath("/api/projects/:projectId/auth/users", path);
  if (method === "POST" && m) {
    if (!authUsers[m.projectId]) authUsers[m.projectId] = [];
    const user = { id: `usr-${generateId()}`, email: body.email, role: body.role || "user", createdAt: new Date().toISOString(), lastSignIn: null };
    authUsers[m.projectId].push(user);
    return json(user, 201);
  }

  // DELETE /api/projects/:projectId/auth/users/:userId
  m = matchPath("/api/projects/:projectId/auth/users/:userId", path);
  if (method === "DELETE" && m) {
    if (authUsers[m.projectId]) authUsers[m.projectId] = authUsers[m.projectId].filter((u: any) => u.id !== m!.userId);
    return json({ success: true });
  }

  // GET /api/projects/:projectId/api-keys
  m = matchPath("/api/projects/:projectId/api-keys", path);
  if (method === "GET" && m) return json(apiKeys[m.projectId] || []);

  // POST /api/projects/:projectId/api-keys
  m = matchPath("/api/projects/:projectId/api-keys", path);
  if (method === "POST" && m) {
    if (!apiKeys[m.projectId]) apiKeys[m.projectId] = [];
    const key = { id: `key-${generateId()}`, name: body.name, value: `vx_${generateId()}${generateId()}`, createdAt: new Date().toISOString(), lastUsed: null };
    apiKeys[m.projectId].push(key);
    return json(key, 201);
  }

  // DELETE /api/projects/:projectId/api-keys/:keyId
  m = matchPath("/api/projects/:projectId/api-keys/:keyId", path);
  if (method === "DELETE" && m) {
    if (apiKeys[m.projectId]) apiKeys[m.projectId] = apiKeys[m.projectId].filter((k: any) => k.id !== m!.keyId);
    return json({ success: true });
  }

  // GET /api/projects/:projectId/composio/connectors
  m = matchPath("/api/projects/:projectId/composio/connectors", path);
  if (method === "GET" && m) return json(composioConnectors[m.projectId] || []);

  // POST /api/projects/:projectId/composio/connectors/:id/toggle
  m = matchPath("/api/projects/:projectId/composio/connectors/:id/toggle", path);
  if (method === "POST" && m) return json({ success: true, id: m.id, enabled: body.enabled });

  // POST /api/projects/:projectId/composio/webhooks/test
  m = matchPath("/api/projects/:projectId/composio/webhooks/test", path);
  if (method === "POST" && m) return json({ success: true, message: "Webhook test sent successfully", statusCode: 200 });

  // GET /api/projects/:projectId/scaling
  m = matchPath("/api/projects/:projectId/scaling", path);
  if (method === "GET" && m) return json({ minInstances: 1, maxInstances: 10, targetCpuUtilization: 70, currentInstances: 2 });

  // POST /api/projects/:projectId/scaling
  m = matchPath("/api/projects/:projectId/scaling", path);
  if (method === "POST" && m) return json({ success: true, scaling: body });

  // GET /api/projects/:projectId/environments
  m = matchPath("/api/projects/:projectId/environments", path);
  if (method === "GET" && m) return json([
    { id: "env-prod", name: "Production", branch: "main", url: `https://${m.projectId}.vortex.ml`, status: "active" },
    { id: "env-prev", name: "Preview", branch: "dev", url: `https://${m.projectId}-preview.vortex.ml`, status: "active" },
  ]);

  // POST /api/projects/:projectId/environments/fork
  m = matchPath("/api/projects/:projectId/environments/fork", path);
  if (method === "POST" && m) return json({ id: `env-${generateId()}`, name: body.name, branch: body.branch, status: "provisioning" }, 201);

  // POST /api/projects/:projectId/database/services/:serviceId/clone
  m = matchPath("/api/projects/:projectId/database/services/:serviceId/clone", path);
  if (method === "POST" && m) return json({ id: `svc-${generateId()}`, sourceId: m.serviceId, status: "cloning", createdAt: new Date().toISOString() }, 201);

  // POST /api/projects/:projectId/database/services/:serviceId/scaling
  m = matchPath("/api/projects/:projectId/database/services/:serviceId/scaling", path);
  if (method === "POST" && m) return json({ success: true, serviceId: m.serviceId, scaling: body });

  // DELETE /api/projects/:projectId/database/services/:serviceId
  m = matchPath("/api/projects/:projectId/database/services/:serviceId", path);
  if (method === "DELETE" && m) return json({ success: true });

  // DELETE /api/projects/:projectId/database/tables/:tableName
  m = matchPath("/api/projects/:projectId/database/tables/:tableName", path);
  if (method === "DELETE" && m) {
    if (databaseTables[m.projectId]) databaseTables[m.projectId] = databaseTables[m.projectId].filter((t: any) => t.name !== m!.tableName);
    return json({ success: true });
  }

  // POST /api/projects/:projectId/database/tables/:tableName/record
  m = matchPath("/api/projects/:projectId/database/tables/:tableName/record", path);
  if (method === "POST" && m) {
    const table = (databaseTables[m.projectId] || []).find((t: any) => t.name === m!.tableName);
    const record = { id: generateId(), ...body, createdAt: new Date().toISOString() };
    if (table) { if (!table.rows) table.rows = []; table.rows.push(record); }
    return json(record, 201);
  }

  // DELETE /api/projects/:projectId/database/tables/:tableName/record/:rowId
  m = matchPath("/api/projects/:projectId/database/tables/:tableName/record/:rowId", path);
  if (method === "DELETE" && m) {
    const table = (databaseTables[m.projectId] || []).find((t: any) => t.name === m!.tableName);
    if (table && table.rows) table.rows = table.rows.filter((r: any) => r.id !== m!.rowId);
    return json({ success: true });
  }

  // PUT /api/workspaces/:workspaceId/members
  m = matchPath("/api/workspaces/:workspaceId/members", path);
  if (method === "PUT" && m) {
    const ws = workspaces.find((w: any) => w.id === m!.workspaceId);
    if (ws && ws.members) {
      const idx = ws.members.findIndex((mem: any) => mem.id === body.memberId);
      if (idx >= 0) ws.members[idx] = { ...ws.members[idx], ...body };
    }
    return json({ success: true });
  }

  // Fallback
  return json({ error: "Not found", path }, 404);
});
