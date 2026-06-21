import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";

dotenv.config();

// Ensure the ID generator is fast and safe
const generateId = () => Math.random().toString(36).substring(2, 10);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client Lazily/Safely with User-Agent telemetry
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

// In-Memory Database for Vortex
interface EnvVar {
  id: string;
  key: string;
  value: string;
}

interface Project {
  id: string;
  name: string;
  framework: string; // 'react' | 'nextjs' | 'svelte' | 'serverless' | 'static'
  repo: string;
  branch: string;
  createdAt: string;
  activeDeploymentId: string;
}

interface Deployment {
  id: string;
  projectId: string;
  status: "building" | "ready" | "failed";
  previewUrl: string;
  createdAt: string;
  commitMessage: string;
  commitHash: string;
  buildLogs: string[];
  deployedHtml?: string;
}

interface ServerlessFunction {
  id: string;
  projectId: string;
  name: string;
  route: string;
  code: string;
  description: string;
}

interface FunctionExecutionLog {
  id: string;
  functionId: string;
  timestamp: string;
  status: number;
  durationMs: number;
  memoryMb: number;
  stdout: string[];
  responseBody: string;
}

interface WafRule {
  id: string;
  field: "ip" | "country" | "user_agent" | "uri";
  operator: "eq" | "contains" | "ne";
  value: string;
  action: "block" | "challenge" | "allow";
  isEnabled: boolean;
}

interface ShieldConfig {
  sslMode: "off" | "flexible" | "full" | "strict";
  developmentMode: boolean;
  brotli: boolean;
  securityLevel: "off" | "low" | "medium" | "high" | "under-attack";
  wafRules: WafRule[];
  totalThreatsBlocked: number;
}

interface ThreatIncident {
  id: string;
  timestamp: string;
  ip: string;
  country: string;
  flag: string;
  threatType: string;
  action: "blocked" | "challenged" | "allowed";
  query: string;
}

// Initial Shield Mock Databases
let shieldConfigs: Record<string, ShieldConfig> = {
  "proj-1": {
    sslMode: "strict",
    developmentMode: false,
    brotli: true,
    securityLevel: "high",
    totalThreatsBlocked: 4,
    wafRules: [
      { id: "rule-1", field: "uri", operator: "contains", value: "/admin", action: "block", isEnabled: true },
    ]
  }
};

let baseIncidents: ThreatIncident[] = [
  { id: "inc-1", timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(), ip: "185.220.101.5", country: "Sweden", flag: "🇸🇪", threatType: "Cross-Site Scripting (XSS)", action: "blocked", query: "GET /api/comments?author_id=<script>alert(1)</script>" },
  { id: "inc-2", timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(), ip: "45.143.203.111", country: "Germany", flag: "🇩🇪", threatType: "SQL Injection Suspected", action: "blocked", query: "POST /auth/login?uname=' OR '1'='1" }
];


import { DbTable, AuthConfig, AuthUser, ApiKey, Workspace, ComposioConnector } from "./src/types";

// Monaco Labs Control Databases
let databaseTables: Record<string, DbTable[]> = {
  "proj-1": [
    {
      id: "tbl-1",
      name: "users_profiles",
      columns: [
        { name: "id", type: "uuid", isNullable: false, isPrimaryKey: true },
        { name: "display_name", type: "text", isNullable: true, isPrimaryKey: false },
        { name: "email", type: "text", isNullable: false, isPrimaryKey: false },
        { name: "is_active", type: "boolean", isNullable: false, isPrimaryKey: false, defaultValue: "true" },
        { name: "created_at", type: "timestamp", isNullable: false, isPrimaryKey: false, defaultValue: "now()" }
      ],
      rows: [
        { id: "e17a3a9b-8a8e-49b8-8e6d-927bac3398be", display_name: "Alice Vance", email: "alice@vortex.ml", is_active: true, created_at: "2026-06-18 12:44:02" },
        { id: "10b86a81-d13c-42b7-84bc-cfc998a129ef", display_name: "Bruce Sterling", email: "bruce@neon.com", is_active: false, created_at: "2026-06-19 09:30:15" }
      ]
    },
    {
      id: "tbl-2",
      name: "orders_v2",
      columns: [
        { name: "order_id", type: "uuid", isNullable: false, isPrimaryKey: true },
        { name: "user_id", type: "uuid", isNullable: false, isPrimaryKey: false },
        { name: "amount_cents", type: "integer", isNullable: false, isPrimaryKey: false },
        { name: "shipped", type: "boolean", isNullable: false, isPrimaryKey: false, defaultValue: "false" }
      ],
      rows: [
        { order_id: "77cd9e2e-2f5a-4e6f-be61-0dfdfab926ee", user_id: "e17a3a9b-8a8e-49b8-8e6d-927bac3398be", amount_cents: 14500, shipped: true }
      ]
    }
  ]
};

let authConfigs: Record<string, AuthConfig> = {
  "proj-1": {
    jwtLifespan: 3600,
    allowSignup: true,
    passwordMinLength: 8,
    providers: {
      emailPassword: true,
      magicLink: true,
      otp: false
    },
    redirectUrls: ["https://active-gate.vortex.ml/callback", "http://localhost:3000/callback"]
  }
};

let authUsers: Record<string, AuthUser[]> = {
  "proj-1": [
    { id: "usr-jay", email: "jayomer1234@gmail.com", createdAt: "2026-06-20T07:56:00Z", lastLogin: "2026-06-20T07:56:53Z", status: "active" },
    { id: "usr-1", email: "alice@vortex.ml", createdAt: "2026-06-18T12:44:00Z", lastLogin: "2026-06-20T01:30:12Z", status: "active" },
    { id: "usr-2", email: "bruce@neon.com", createdAt: "2026-06-19T09:30:00Z", lastLogin: "2026-06-20T02:00:44Z", status: "suspended" }
  ]
};

let apiKeys: Record<string, ApiKey[]> = {
  "proj-1": [
    { id: "key-1", name: "Production Gateway Backend", secret: "vtx_live_79a2fbc89e73ad1a09df2b1ff", createdAt: "2026-06-19T10:00:00Z", rateLimit: 120, description: "Main API key for secure communication with Monaco client SDKs & CLI." }
  ]
};

let workspaces: Workspace[] = [
  {
    id: "ws-1",
    name: "Monaco Labs Main",
    owner: "jayomer1234@gmail.com",
    members: [
      { email: "jayomer1234@gmail.com", role: "Owner" },
      { email: "collaborator@monaco.io", role: "Admin" }
    ]
  },
  {
    id: "ws-2",
    name: "Acme Enterprises",
    owner: "jayomer1234@gmail.com",
    members: [
      { email: "jayomer1234@gmail.com", role: "Owner" }
    ]
  }
];

let composioConnectors: Record<string, ComposioConnector[]> = {
  "proj-1": [
    { id: "conn-slack", name: "Slack", category: "Messengers", description: "Trigger workspace event updates, build completion alerts, and firewall challenge notifications.", logo: "slack", isConnected: true, scopesCount: 12 },
    { id: "conn-github", name: "GitHub", category: "Dev Tools", description: "Poll commits, pull webhook notifications, trigger autodeploy on master pushes.", logo: "github", isConnected: true, scopesCount: 8 },
    { id: "conn-discord", name: "Discord", category: "Messengers", description: "Stream alert logs and high severity attack warning alerts into server channels.", logo: "discord", isConnected: false, scopesCount: 4 },
    { id: "conn-notion", name: "Notion", category: "Productivity", description: "Direct export of analytical summaries and performance logs into your tables.", logo: "notion", isConnected: false, scopesCount: 5 },
    { id: "conn-hubspot", name: "HubSpot", category: "CRM", description: "Feed active edge registration pings straight into marketing contacts.", logo: "hubspot", isConnected: false, scopesCount: 6 },
    { id: "conn-stripe", name: "Stripe", category: "CRM", description: "Automated ledger webhook triggers connected straight to database instances.", logo: "stripe", isConnected: false, scopesCount: 15 },
    { id: "conn-gmail", name: "Gmail", category: "Productivity", description: "Send administration emails, verifications, OTP codes, and critical error dispatches.", logo: "gmail", isConnected: false, scopesCount: 10 },
    { id: "conn-salesforce", name: "Salesforce", category: "CRM", description: "Synchronize client subscriptions, accounts, and server operations metrics.", logo: "salesforce", isConnected: false, scopesCount: 20 }
  ]
};


// Initial Mock Seed Data
let projects: Project[] = [
  {
    id: "proj-1",
    name: "active-gate",
    framework: "react",
    repo: "user/active-gate",
    branch: "main",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    activeDeploymentId: "dep-1",
  }
];

let envVars: Record<string, EnvVar[]> = {
  "proj-1": [
    { id: "env-1-1", key: "VITE_APP_ENV", value: "production" },
    { id: "env-1-2", key: "CACHE_TTL", value: "3600" },
  ]
};

let domains: Record<string, string[]> = {
  "proj-1": ["active-gate.vortex.ml"],
};

let deployments: Deployment[] = [
  {
    id: "dep-1",
    projectId: "proj-1",
    status: "ready",
    previewUrl: "https://active-gate-dep-1.vortex.ml",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    commitMessage: "initial deployment: active security gate & web vitals baseline monitor",
    commitHash: "e4f8d2a",
    buildLogs: [
      "[vortex] Initializing build workspace to deploy user/active-gate...",
      "[vortex] Loaded 12 dependencies from local lockfile",
      "[vortex] Running compiler script: \"vite build\"",
      "[vite] Compiling TypeScript dynamic types...",
      "[vite] Bundling assets with Rollup...",
      "[vite] ✓ compiled in 0.8s",
      "[vortex] DNS check successful: active-gate.vortex.ml validates correctly",
      "[vortex] Deployment successful! 🎉",
    ],
    deployedHtml: `
      <div class="min-h-screen bg-[#070707] text-[#e5e5e5] font-sans flex flex-col justify-center items-center p-8 text-center selection:bg-neutral-800 selection:text-white">
        <div class="max-w-md space-y-6">
          <div class="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400">
            <span class="text-lg font-bold">Æ</span>
          </div>
          <div class="space-y-2">
            <h2 class="text-xl font-black text-white uppercase tracking-tight">Active Edge Service</h2>
            <p class="text-neutral-500 text-xs">Vortex routing completed. Your containerized serverless react application is initialized and running at the global Anycast layer.</p>
          </div>
          <div class="p-3 bg-neutral-900/60 border border-neutral-800 text-xs font-mono text-neutral-400 rounded-lg">
            Status: <span class="text-emerald-400">ACTIVE</span> • Node: US-East-1
          </div>
        </div>
      </div>
    `,
  },
  {
    id: "dep-2",
    projectId: "proj-1",
    status: "failed",
    previewUrl: "",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    commitMessage: "feat: add OAuth authorization flow routes & telemetry logs",
    commitHash: "cb81a29",
    buildLogs: [
      "[vortex] Spawning cloud compiler node for user/active-gate...",
      "[vortex] Loaded 14 dependencies from package.json lockfile",
      "[vortex] Running compiler script: \"npm run build\"",
      "[vite] Compiling TypeScript dynamic types...",
      "[compiler] Critical error in /src/routes/auth.ts (Line 42:8)",
      "[compiler] Type 'null' is not assignable to type 'string' for OAuth ClientId credential mapping.",
      "[compiler] └─ Source: const clientId: string = process.env.GITHUB_CLIENT_ID;",
      "[compiler] Error: Vite build process exited with status code 1. Bundling canceled.",
      "[vortex] Error: Build failed and edge-compilation was halted. Review diagnostics above."
    ],
    deployedHtml: ""
  }
];

let serverlessFunctions: ServerlessFunction[] = [
  {
    id: "func-1",
    projectId: "proj-1",
    name: "hello.ts",
    route: "/api/hello",
    code: `export default async function handler(req: Request) {
  return Response.json({
    status: "healthy",
    message: "Active-gate serverless endpoint running successfully.",
    timestamp: new Date().toISOString()
  });
}`,
    description: "Sub-10ms serverless edge endpoint returning status handshake payloads.",
  }
];

let executionLogs: FunctionExecutionLog[] = [
  {
    id: "exec-1",
    functionId: "func-1",
    timestamp: new Date().toISOString(),
    status: 200,
    durationMs: 4,
    memoryMb: 12.4,
    stdout: [
      "INFO: initializing runtime microservice isolate",
      "TRACE: evaluating hello.ts execution handler",
      "SUCCESS: response processed in 4ms",
    ],
    responseBody: JSON.stringify(
      {
        status: "healthy",
        message: "Active-gate serverless endpoint running successfully.",
        timestamp: new Date().toISOString()
      },
      null,
      2
    ),
  },
];

let databaseServices: Record<string, any[]> = {
  "proj-1": [
    {
      id: "dbs-1",
      projectId: "proj-1",
      name: "prod-postgres",
      type: "postgresql",
      status: "active",
      connectionString: "postgresql://postgres:vx_pwd_948a28f8ac2@vortex.ml:5432/active-gate-db",
      host: "vortex.ml",
      port: 5432,
      username: "postgres",
      password: "vx_pwd_948a28f8ac2",
      databaseName: "active-gate-db",
      allocatedCpu: 0.25,
      allocatedRam: 512,
      allocatedStorage: 10,
      metrics: {
        cpuUsage: [12, 19, 11, 24, 18, 15, 23, 14, 16],
        ramUsage: [64, 68, 62, 70, 72, 65, 68, 69, 71]
      },
      region: "US-East-1 (N. Virginia)",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]
};

let scalingConfigs: Record<string, any> = {
  "proj-1": {
    minInstances: 1,
    maxInstances: 5,
    targetCpuPercent: 70,
    maxMemoryOption: "512MB",
    concurrencyLimit: 80,
    optimizeTreeShaking: true
  }
};

let projectEnvironments: Record<string, any[]> = {
  "proj-1": [
    {
      id: "env-prod",
      projectId: "proj-1",
      name: "production",
      isActive: true,
      variablesCount: 2
    },
    {
      id: "env-stag",
      projectId: "proj-1",
      name: "staging",
      isActive: false,
      variablesCount: 2,
      clonedFrom: "production"
    }
  ]
};

interface TeamAccessToken {
  id: string;
  name: string;
  token: string;
  createdAt: string;
  scope: "Read" | "Write" | "None";
  role: string;
}

interface WorkspacePolicies {
  projects: "Read" | "Write" | "None";
  database: "Read" | "Write" | "None";
  auth: "Read" | "Write" | "None";
  shield: "Read" | "Write" | "None";
  billing: "Read" | "Write" | "None";
  deployment: "Read" | "Write" | "None";
}

let teamTokens: Record<string, TeamAccessToken[]> = {
  "ws-1": [
    { id: "tok-1", name: "CI Sync Deploy pipeline", token: "vx_team_priv_7f3a9e9a4f4e19bda", createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), scope: "Write", role: "CI/CD automation tool" },
    { id: "tok-2", name: "Read-only analytics aggregator", token: "vx_team_priv_324ebd9ad2a71bf", createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), scope: "Read", role: "Metrics analyzer" }
  ]
};

let workspacePolicies: Record<string, WorkspacePolicies> = {
  "ws-1": {
    projects: "Write",
    database: "Read",
    auth: "None",
    shield: "Read",
    billing: "None",
    deployment: "Write"
  },
  "ws-2": {
    projects: "Read",
    database: "None",
    auth: "None",
    shield: "None",
    billing: "None",
    deployment: "Read"
  }
};

// --- MONACO LABS CUSTOM PERSISTENT DATABASE ENGINE ---
// This database operates entirely independently of third-party platforms like Vercel or Supabase.
// It persists the entire server-side application state to local files inside the disk.
const DB_FILE_PATH = path.join(process.cwd(), "vortex_local_db.json");

function saveToLocalDB() {
  try {
    const dataToSave = {
      shieldConfigs,
      baseIncidents,
      databaseTables,
      authConfigs,
      authUsers,
      apiKeys,
      workspaces,
      composioConnectors,
      projects,
      envVars,
      domains,
      deployments,
      serverlessFunctions,
      executionLogs,
      databaseServices,
      scalingConfigs,
      projectEnvironments,
      teamTokens,
      workspacePolicies
    };
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(dataToSave, null, 2), "utf-8");
  } catch (err) {
    console.error("[vortex-db] Write security/data serialization error:", err);
  }
}

function loadFromLocalDB() {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const data = fs.readFileSync(DB_FILE_PATH, "utf-8");
      const loaded = JSON.parse(data);
      if (loaded.shieldConfigs) shieldConfigs = loaded.shieldConfigs;
      if (loaded.baseIncidents) baseIncidents = loaded.baseIncidents;
      if (loaded.databaseTables) databaseTables = loaded.databaseTables;
      if (loaded.authConfigs) authConfigs = loaded.authConfigs;
      if (loaded.authUsers) authUsers = loaded.authUsers;
      if (loaded.apiKeys) apiKeys = loaded.apiKeys;
      if (loaded.workspaces) workspaces = loaded.workspaces;
      if (loaded.composioConnectors) composioConnectors = loaded.composioConnectors;
      if (loaded.projects) projects = loaded.projects;
      if (loaded.envVars) envVars = loaded.envVars;
      if (loaded.domains) domains = loaded.domains;
      if (loaded.deployments) deployments = loaded.deployments;
      if (loaded.serverlessFunctions) serverlessFunctions = loaded.serverlessFunctions;
      if (loaded.executionLogs) executionLogs = loaded.executionLogs;
      if (loaded.databaseServices) databaseServices = loaded.databaseServices;
      if (loaded.scalingConfigs) scalingConfigs = loaded.scalingConfigs;
      if (loaded.projectEnvironments) projectEnvironments = loaded.projectEnvironments;
      if (loaded.teamTokens) teamTokens = loaded.teamTokens;
      if (loaded.workspacePolicies) workspacePolicies = loaded.workspacePolicies;
      console.log("[vortex-db] State restored successfully from local file database.");
    } else {
      saveToLocalDB();
    }
  } catch (err) {
    console.error("[vortex-db] Read error, running on default memory variables:", err);
  }
}

// Intercept write requests to sync state
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function (obj) {
    const response = originalJson.call(this, obj);
    if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
      saveToLocalDB();
    }
    return response;
  };
  next();
});

// Run load on boot
loadFromLocalDB();

// Helper to generate mock deployments dynamically inside the deployment trigger
const FRAMEWORK_BUILD_DURATION_SIM = 3000; // Simulated compiler block in ms

// Express API Routes
app.get("/api/projects", (req, res) => {
  res.json(projects);
});

app.post("/api/projects", (req, res) => {
  const { name, framework, repo, branch, customDescription } = req.body;
  if (!name || !repo) {
    return res.status(400).json({ error: "Name and Repo are required fields." });
  }

  const normalizedRepo = repo.includes("/") ? repo : `jayomer1234/${repo}`;

  const prj: Project = {
    id: `proj-${generateId()}`,
    name: name.toLowerCase().replace(/[^a-z0-9_-]/g, "-"),
    framework: framework || "react",
    repo: normalizedRepo,
    branch: branch || "main",
    createdAt: new Date().toISOString(),
    activeDeploymentId: "",
  };

  projects.push(prj);
  domains[prj.id] = [`${prj.name}.vortex.ml`];
  envVars[prj.id] = [];
  res.status(201).json(prj);
});

app.get("/api/projects/:id/env", (req, res) => {
  res.json(envVars[req.params.id] || []);
});

app.post("/api/projects/:id/env", (req, res) => {
  const { key, value } = req.body;
  if (!key) return res.status(400).json({ error: "Key is required" });

  const id = req.params.id;
  if (!envVars[id]) envVars[id] = [];

  const existing = envVars[id].findIndex((e) => e.key === key);
  if (existing >= 0) {
    envVars[id][existing].value = value;
  } else {
    envVars[id].push({ id: `env-${generateId()}`, key, value });
  }
  res.json(envVars[id]);
});

app.delete("/api/projects/:projectId/env/:envId", (req, res) => {
  const { projectId, envId } = req.params;
  if (envVars[projectId]) {
    envVars[projectId] = envVars[projectId].filter((e) => e.id !== envId);
  }
  res.json({ success: true, envs: envVars[projectId] || [] });
});

app.get("/api/projects/:id/domains", (req, res) => {
  res.json(domains[req.params.id] || []);
});

app.post("/api/projects/:id/domains", (req, res) => {
  const { domain } = req.body;
  if (!domain) return res.status(400).json({ error: "Domain name required" });

  const id = req.params.id;
  if (!domains[id]) domains[id] = [];

  const formatted = domain.toLowerCase().trim();
  if (!domains[id].includes(formatted)) {
    domains[id].push(formatted);
  }
  res.json(domains[id]);
});

// Autonomous Agent Autopilot Subdomain Allocation Node Endpoint
app.post("/api/projects/:id/domains/agent-allocate", (req, res) => {
  const { subdomain, provider } = req.body;
  if (!subdomain) return res.status(400).json({ error: "Subdomain name is required for automated allocation." });

  const id = req.params.id;
  const project = projects.find(p => p.id === id);
  if (!project) return res.status(404).json({ error: "Project not found for subdomain allocation" });

  const chosenProvider = provider || "Vortex Anycast Subdomain Router";
  const formattedSubdomain = `${subdomain.toLowerCase().trim()}.${chosenProvider.includes("Vortex") ? "vortex.ml" : "monacodev.ml"}`;

  if (!domains[id]) domains[id] = [];
  if (!domains[id].includes(formattedSubdomain)) {
    domains[id].push(formattedSubdomain);
  }

  // Create high-fidelity automated deployment block
  const newDeployment: Deployment = {
    id: `dep-${generateId()}`,
    projectId: id,
    status: "ready",
    previewUrl: `https://${formattedSubdomain}`,
    createdAt: new Date().toISOString(),
    commitMessage: `[AGENT-AUTOPILOT] Assigned custom website subdomain routing via ${chosenProvider}`,
    commitHash: generateId().substring(0, 7),
    buildLogs: [
      `[vortex] Agent Autopilot Triggered: Subdomain Allocation Request received for ${formattedSubdomain}`,
      `[vortex] Syncing custom DNS entries into the independent file-based persistent DB...`,
      `[vortex] DNS A/AAAA records mapped cleanly under Vortex network ingress.`,
      `[vortex] Initiating Let's Encrypt automated challenge validation (HTTP-01)...`,
      `[vortex] ACME verification challenge passed successfully.`,
      `[vortex] Generating SSL/TLS cert for domain ${formattedSubdomain}... SUCCESS!`,
      `[vortex] Compiling security bundle and binding Edge Proxy routes... complete!`,
      `[vortex] Application live on new subdomain: https://${formattedSubdomain} 🎉`
    ],
    deployedHtml: `
      <div class="min-h-screen bg-[#070707] text-[#e5e5e5] font-sans flex flex-col justify-center items-center p-8 text-center select-none">
        <div class="max-w-md space-y-6">
          <div class="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <span class="text-sm font-bold font-mono">AGENT</span>
          </div>
          <div class="space-y-2">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight font-mono">${subdomain.toUpperCase()}</h2>
            <p class="text-neutral-500 text-xs text-left leading-relaxed">This container was successfully provisioned, compiled, and mapped to this subdomain URL by an automated code agent. High capacity ingress tunnels are active.</p>
          </div>
          <div class="p-3 bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-neutral-400 rounded-lg flex items-center justify-between">
            <span>DNS STATUS: <span class="text-emerald-400 font-bold">PROPAGATED</span></span>
            <span>PROVIDER: <span class="text-amber-400 font-bold">${chosenProvider.toUpperCase()}</span></span>
          </div>
        </div>
      </div>
    `
  };

  deployments.push(newDeployment);
  project.activeDeploymentId = newDeployment.id;

  res.json({
    success: true,
    allocatedDomain: formattedSubdomain,
    provider: chosenProvider,
    deployment: newDeployment
  });
});

app.delete("/api/projects/:projectId/domains/:domainName", (req, res) => {
  const { projectId, domainName } = req.params;
  if (domains[projectId]) {
    domains[projectId] = domains[projectId].filter((d) => d !== domainName);
  }
  res.json({ success: true, domains: domains[projectId] || [] });
});

app.get("/api/projects/:projectId/deployments", (req, res) => {
  const prjDeps = deployments.filter((d) => d.projectId === req.params.projectId);
  // Sort descending by date
  prjDeps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(prjDeps);
});

// GET raw deployment preview HTML payload
app.get("/api/preview/:deploymentId", (req, res) => {
  const dep = deployments.find((d) => d.id === req.params.deploymentId);
  if (!dep) {
    return res.status(404).send("<h3>Deployment preview not found.</h3>");
  }

  // Inject a small banner stating hosted on Vortex preview
  const rawHtml = dep.deployedHtml || `
    <div style="padding: 2.5rem; text-align: center; font-family: sans-serif; background: #0b0f19; color: #fff; min-height: 100vh;">
      <h2>Project: ${dep.projectId}</h2>
      <p>Deployment preview successfully built at Vortex Edge!</p>
      <small style="color: #64748b">Hash: ${dep.commitHash}</small>
    </div>
  `;

  // Always append a slick bottom floating toolbar so the users realize they are exploring inside Vortex iframe sandbox!
  const enhancedHtml = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          /* Hide scrollbars just in case inside cards */
          ::-webkit-scrollbar { width: 4px; height: 4px; }
          ::-webkit-scrollbar-thumb { background: #4f46e5; border-radius: 4px; }
        </style>
      </head>
      <body class="bg-slate-950">
        ${rawHtml}
        
        <!-- Live-Preview Banner -->
        <div class="fixed bottom-3 right-3 bg-neutral-900 border border-neutral-800 text-white px-3 py-1.5 rounded-full text-[10px] font-mono shadow-2xl flex items-center gap-2 pointer-events-none z-50">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          preview active: ${dep.commitHash}
        </div>
      </body>
    </html>
  `;
  res.send(enhancedHtml);
});

// Trigger dynamic deployments (using Gemini option to customize look!)
app.post("/api/projects/:projectId/deployments/trigger", async (req, res) => {
  const { projectId } = req.params;
  const { commitMessage, buildCommand, outputDirectory, customPrompt, simulateFailure } = req.body;
  const prj = projects.find((p) => p.id === projectId);

  if (!prj) {
    return res.status(404).json({ error: "Project not found" });
  }

  const generatedIdVal = `dep-${generateId()}`;
  const commitMsg = commitMessage || "Manual deployment triggered from Vortex Dashboard";
  const commitHashHex = Math.random().toString(16).substring(2, 9);
  const dateStr = new Date().toISOString();

  // Framework logs templates
  let logs: string[] = [];
  if (simulateFailure) {
    logs = [
      `[vortex] Spawning cloud compiler node for ${prj.repo}...`,
      `[vortex] loaded 12 dependencies from local lockfile`,
      `[vortex] Executing compilation script: "${buildCommand || "npm run build"}"`,
      `[compiler] resolving module endpoints and scanning tree-shaking assets...`,
      `[compiler] Critical compilation error inside /src/layouts/dashboard.tsx (Line 38:22)`,
      `[compiler] Uncaught SyntaxError: Unexpected token. Expected closing curly bracket "}"`,
      `[compiler] └─ Source: return ( <div className="border border-neutral-90 px-3 truncate font-mono"> ...`,
      `[vortex] Error: Vite packaging compiler process exited with status code 1. Bundling aborted.`,
      `[vortex] Error: Build failed and edge-compilation was halted. Review diagnostics above.`
    ];
  } else if (prj.framework === "react") {
    logs = [
      `[vortex] Initializing build workspace to deploy ${prj.repo}...`,
      `[vortex] Found package.json: framework = Vite + React`,
      `[vortex] Executing compilation script: "${buildCommand || "npm run build"}"`,
      `[compiler] resolving module endpoints and scanning tree-shaking assets...`,
      `[compiler] loading asset router...`,
      `[vortex-cdn] uploading index.html template onto high-performance cache`,
      `[vortex] verifying SSL security boundaries for domain: ${prj.name}.vortex.ml`,
      `[vortex] Deployment active in US-East-1, EU-West-2, AP-South-1`,
      `[vortex] Deployment completed successfully! 🎉`,
    ];
  } else if (prj.framework === "nextjs") {
    logs = [
      `[vortex] Spawning cloud node workspace for ${prj.repo}...`,
      `[vortex] framework = Next.js (App Router detected)`,
      `[next] node_env changed to: production`,
      `[next] creating production build bundle with command "${buildCommand || "next build"}"`,
      `[compiler] chunking server-side dynamic paths...`,
      `[compiler] Static optimizations: 14 HTML routes resolved, 1 dynamic router edge`,
      `[vortex] Linking serverless backend nodes for /api/* gateways`,
      `[vortex] Configuring Anycast routing tables...`,
      `[vortex] Deployment successful! 🎉`,
    ];
  } else {
    logs = [
      `[vortex] Initiating deployment for serverless node project: ${prj.repo}...`,
      `[vortex] bundler = EsBuild Node compiler`,
      `[vortex] compiling APIs into single serverless bundle: output direction: "${outputDirectory || "dist"}"`,
      `[vortex] microservices validated, scanning 4 endpoints`,
      `[vortex] verifying edge SSL boundaries for ${prj.name}.vortex.ml`,
      `[vortex] Serverless edge function gateway live.`,
      `[vortex] Deployment successful! 🎉`,
    ];
  }

  // Deploy default layout placeholder in memory immediately
  let activeHtml = "";
  if (!simulateFailure) {
    if (prj.framework === "react") {
      activeHtml = `
        <div class="min-h-screen bg-slate-900 text-white font-sans flex flex-col justify-center items-center p-8 text-center">
          <div class="space-y-4">
            <div class="text-4xl text-blue-400">⚛️</div>
            <h2 class="text-3xl font-black">Modern Vite + React Application</h2>
            <p class="text-slate-400 text-sm max-w-md">Your production React application has compiled and deployed with Vortex Cloud Edge in record time.</p>
            <div class="p-3 bg-slate-800 rounded-lg text-xs font-mono border border-slate-700">Commit: ${commitHashHex} - "${commitMsg}"</div>
          </div>
        </div>
      `;
    } else if (prj.framework === "nextjs") {
      activeHtml = `
        <div class="min-h-screen bg-neutral-950 text-white font-sans flex flex-col justify-center items-center p-8 text-center">
          <div class="space-y-4">
            <div class="text-4xl text-neutral-200">▲</div>
            <h2 class="text-3xl font-black">Next.js Edge Dashboard</h2>
            <p class="text-neutral-400 text-sm max-w-md">Powered by Vortex Global CDN with fast Incremental Static Regeneration.</p>
            <div class="p-3 bg-neutral-900 rounded-lg text-xs font-mono border border-neutral-800 text-neutral-400">Commit: ${commitHashHex} - "${commitMsg}"</div>
          </div>
        </div>
      `;
    } else {
      activeHtml = `
        <div class="min-h-screen bg-[#070b13] text-transparent bg-gradient-to-tr from-slate-950 to-neutral-850 text-white font-sans flex flex-col justify-center items-center p-8 text-center">
          <label class="text-xs uppercase bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20 font-bold mb-4">VORTEX SERVICEGATE</label>
          <h2 class="text-3xl font-extrabold tracking-tight">Active API Backend</h2>
          <p class="text-slate-400 max-w-md text-sm mt-2 mb-6">Serverless dynamic functions compiled instantly and ready for requests.</p>
          <div class="flex gap-4">
            <div class="px-5 py-3 bg-slate-900/50 rounded-xl text-left border border-slate-800">
              <span class="text-xs text-indigo-400 font-mono">POST</span>
              <div class="text-xs font-bold font-mono">/api/analyze-sentiment</div>
            </div>
            <div class="px-5 py-3 bg-slate-900/50 rounded-xl text-left border border-slate-800">
              <span class="text-xs text-indigo-400 font-mono">GET</span>
              <div class="text-xs font-bold font-mono">/api/hello</div>
            </div>
          </div>
        </div>
      `;
    }
  }

  // Create & Register the deployment
  const newDep: Deployment = {
    id: generatedIdVal,
    projectId,
    status: "building", // Will remain building for UI simulation sequence
    previewUrl: simulateFailure ? "" : `https://${prj.name}-${generatedIdVal}.vortex.ml`,
    createdAt: dateStr,
    commitMessage: commitMsg,
    commitHash: commitHashHex,
    buildLogs: logs,
    deployedHtml: activeHtml,
  };

  deployments.push(newDep);
  saveToLocalDB();

  // If Gemini client exists, trigger AI generation in background to replace placeholder with ultra high-fidelity gorgeous mockup
  const ai = getGeminiClient();
  if (ai && !simulateFailure) {
    try {
      const extraInstructions = customPrompt ? `\nMake sure the app matches this user description: "${customPrompt}"` : "";
      const prompt = `You are Vortex Compiler. Write a single comprehensive, responsive visual mockup template of a web application built using Tailwind CDN CSS.
The app is named "${prj.name}" (${prj.framework} framework) with Git Repository "${prj.repo}".
Provide a beautiful dashboard, a grid, custom icons (simulated with emojis or beautiful styling), dynamic hover states, responsive structure, layout grids, or interactive look.
${extraInstructions}
Write ONLY pure, valid, formatted HTML contents to place INSIDE the body element. Do NOT output any markdown tags (like \`\`\`html) or conversational commentary. Start immediately with the visual code.`;

      const aiResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      const extractedHtml = aiResponse.text;
      if (extractedHtml) {
        newDep.deployedHtml = extractedHtml.replace(/```html|```/g, "").trim();
      }
    } catch (err) {
      console.error("Gemini build compiler failed, using high-quality local placeholder layout.", err);
    }
  }

  // Fast simulated build complete
  setTimeout(() => {
    if (simulateFailure) {
      newDep.status = "failed";
      newDep.deployedHtml = "";
    } else {
      newDep.status = "ready";
      prj.activeDeploymentId = generatedIdVal;
    }
    saveToLocalDB();
  }, FRAMEWORK_BUILD_DURATION_SIM);

  res.status(202).json(newDep);
});

// Serverless function routers
app.get("/api/functions/:projectId", (req, res) => {
  const prjFuncs = serverlessFunctions.filter((f) => f.projectId === req.params.projectId);
  res.json(prjFuncs);
});

app.post("/api/functions/:projectId", (req, res) => {
  const { name, code, route, description } = req.body;
  if (!name || !code) return res.status(400).json({ error: "Name and code are required." });

  const { projectId } = req.params;
  const newF: ServerlessFunction = {
    id: `func-${generateId()}`,
    projectId,
    name,
    route: route || `/api/${name.replace(/\.[a-z]+$/, "")}`,
    code,
    description: description || "Custom Edge serverless endpoint",
  };

  serverlessFunctions.push(newF);
  res.status(201).json(newF);
});

// Execute Serverless API endpoint live from the browser client with metrics
app.post("/api/functions/run", async (req, res) => {
  const { functionId, reqBody, reqQuery } = req.body;
  const func = serverlessFunctions.find((f) => f.id === functionId);

  if (!func) {
    return res.status(404).json({ error: "Function code not found." });
  }

  const startTime = Date.now();
  let status = 200;
  let stdout: string[] = ["INFO: spinning up edge isolate layer", "DEBUG: routing incoming payload"];
  let responseBody = "";

  try {
    // If user executes "analyze-sentiment.ts", let's run a REAL logic call to Gemini live!
    if (func.name === "analyze-sentiment.ts" && reqBody) {
      const parsedBody = typeof reqBody === "string" ? JSON.parse(reqBody) : reqBody;
      const text = parsedBody.text || reqQuery.text;

      if (!text) {
        status = 400;
        stdout.push("ERROR: Missing \"text\" parameter inside payload JSON");
        responseBody = JSON.stringify({ error: "Missing 'text' key inside JSON payload" });
      } else {
        stdout.push(`GEMINI_SDK: contacting model gemini-3.5-flash for evaluation on text "${text}"`);
        const ai = getGeminiClient();

        if (ai) {
          const aiResponse = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: `Perform sentiment analysis on this text: "${text}". Output only a simple structural JSON string containing fields: 'sentiment' ('POSITIVE' | 'NEGATIVE' | 'NEUTRAL'), 'score' (confidence value 0 to 1), and 'keywords' (array of strings). Do not write raw markdown back, only string JSON.`,
          });
          const textRes = aiResponse.text;
          const cleanJsonStr = textRes ? textRes.replace(/```json|```/g, "").trim() : "{}";
          stdout.push("SUCCESS: Gemini successfully classified request text");
          responseBody = JSON.stringify(JSON.parse(cleanJsonStr), null, 2);
        } else {
          // Mock local analyzer fallback
          stdout.push("VORTEX_AI: No API key active, running rapid local classification heuristic");
          const word = text.toLowerCase();
          const pTerms = ["love", "great", "excellent", "awesome", "perfect", "vortex", "best"];
          const nTerms = ["hate", "bad", "terrible", "worst", "broken", "lag", "fail"];

          const score = pTerms.some(t => word.includes(t)) ? 0.95 : (nTerms.some(t => word.includes(t)) ? 0.12 : 0.50);
          const sentiment = score > 0.7 ? "POSITIVE" : (score < 0.3 ? "NEGATIVE" : "NEUTRAL");

          responseBody = JSON.stringify({
            sentiment,
            score,
            keywords: text.split(" ").filter((w: string) => w.length > 4).slice(0, 3),
            fallback: true,
          }, null, 2);
        }
      }
    } else if (func.name === "hello.ts") {
      stdout.push("DEBUG: resolving static response stream from handler code");
      responseBody = JSON.stringify({
        message: "Hello from Vortex Edge Serverless runtime! You invoked me successfully.",
        timestamp: new Date().toISOString(),
        vortexNode: "us-east-edge-4",
      }, null, 2);
    } else {
      // Dynamic evaluation or mockup runner for code updates
      stdout.push("DEBUG: dynamic typescript evaluation sequence started");
      stdout.push(`DEBUG: user script length: ${func.code.length} bytes`);
      
      const bodyText = typeof reqBody === "string" ? reqBody : JSON.stringify(reqBody);
      stdout.push(`TRACE: input package: ${bodyText || "none"}`);
      stdout.push("TRACE: compiling local type scopes on isolate...");
      
      responseBody = JSON.stringify({
        status: "ok",
        receivedPayload: reqBody || {},
        receivedQuery: reqQuery || {},
        executionTimestamp: new Date().toISOString(),
        message: "Custom Serverless handler completed successfully.",
      }, null, 2);
    }
  } catch (err: any) {
    status = 500;
    stdout.push(`CRITICAL: VM execution crash. Error description: ${err?.message || err}`);
    responseBody = JSON.stringify({ error: "Serverless execution failed", details: err?.message || err });
  }

  const durationMs = Date.now() - startTime;
  const memoryMb = parseFloat((12 + Math.random() * 18).toFixed(1)); // Random lightweight microsecond memory metrics 12MB - 30MB

  const execLog: FunctionExecutionLog = {
    id: `exec-${generateId()}`,
    functionId,
    timestamp: new Date().toISOString(),
    status,
    durationMs,
    memoryMb,
    stdout,
    responseBody,
  };

  executionLogs.push(execLog);
  res.json(execLog);
});

app.get("/api/functions/logs/:functionId", (req, res) => {
  const logs = executionLogs.filter((l) => l.functionId === req.params.functionId);
  res.json(logs.reverse().slice(0, 20)); // Limit to most recent 20
});

// Analytics Logs endpoint with spike simulation support
app.get("/api/analytics", (req, res) => {
  const intervalsCount = 20;
  const isSpike = req.query.spike === "true";
  const now = Date.now();
  const data = [];

  for (let i = intervalsCount - 1; i >= 0; i--) {
    const time = new Date(now - i * 60 * 1000);
    const multiplier = isSpike ? (1.5 + Math.random()) : 1;
    
    data.push({
      timestamp: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      requests: Math.floor((120 + Math.sin(i / 1.5) * 40) * multiplier),
      bandwidth: parseFloat(((5.2 + Math.cos(i / 2) * 1.5) * multiplier).toFixed(1)),
      errors: Math.floor(Math.random() * 3 + (isSpike ? 6 : 0)),
      latency: Math.floor((45 + Math.random() * 15) * (isSpike ? 2.2 : 1)),
    });
  }

  res.json({
    metrics: data,
    vitals: {
      lcp: { value: isSpike ? 2.8 : 1.2, rating: isSpike ? "needs-improvement" : "good" },
      fid: { value: isSpike ? 110 : 22, rating: isSpike ? "needs-improvement" : "good" },
      cls: { value: 0.04, rating: "good" },
    },
  });
});

// GET Shield configuration for a project
app.get("/api/projects/:projectId/shield", (req, res) => {
  const { projectId } = req.params;
  
  // Initialize with defaults if none exists
  if (!shieldConfigs[projectId]) {
    shieldConfigs[projectId] = {
      sslMode: "flexible",
      developmentMode: false,
      brotli: true,
      securityLevel: "medium",
      wafRules: [],
      totalThreatsBlocked: Math.floor(Math.random() * 50) + 12
    };
  }
  
  res.json(shieldConfigs[projectId]);
});

// POST update Shield settings for a project
app.post("/api/projects/:projectId/shield", (req, res) => {
  const { projectId } = req.params;
  const { sslMode, developmentMode, brotli, securityLevel } = req.body;
  
  if (!shieldConfigs[projectId]) {
    shieldConfigs[projectId] = {
      sslMode: "flexible",
      developmentMode: false,
      brotli: true,
      securityLevel: "medium",
      wafRules: [],
      totalThreatsBlocked: 45
    };
  }
  
  const config = shieldConfigs[projectId];
  if (sslMode !== undefined) config.sslMode = sslMode;
  if (developmentMode !== undefined) config.developmentMode = developmentMode;
  if (brotli !== undefined) config.brotli = brotli;
  if (securityLevel !== undefined) {
    config.securityLevel = securityLevel;
    // Increase threat count if attack simulation is toggled on
    if (securityLevel === "under-attack") {
      config.totalThreatsBlocked += Math.floor(Math.random() * 12) + 5;
    }
  }
  
  res.json(config);
});

// POST add or update a WAF Rule for a project
app.post("/api/projects/:projectId/shield/waf", (req, res) => {
  const { projectId } = req.params;
  const { id, field, operator, value, action, isEnabled } = req.body;
  
  if (!shieldConfigs[projectId]) {
    shieldConfigs[projectId] = {
      sslMode: "flexible",
      developmentMode: false,
      brotli: true,
      securityLevel: "medium",
      wafRules: [],
      totalThreatsBlocked: 30
    };
  }
  
  const config = shieldConfigs[projectId];
  
  if (id) {
    // Edit existing rule
    const index = config.wafRules.findIndex(r => r.id === id);
    if (index >= 0) {
      config.wafRules[index] = { id, field, operator, value, action, isEnabled: isEnabled !== undefined ? isEnabled : true };
    }
  } else {
    // Create new rule
    const newRule: WafRule = {
      id: `rule-${generateId()}`,
      field: field || "ip",
      operator: operator || "eq",
      value: value || "",
      action: action || "block",
      isEnabled: isEnabled !== undefined ? isEnabled : true
    };
    config.wafRules.push(newRule);
  }
  
  res.json(config);
});

// DELETE a WAF rule
app.delete("/api/projects/:projectId/shield/waf/:ruleId", (req, res) => {
  const { projectId, ruleId } = req.params;
  
  if (shieldConfigs[projectId]) {
    shieldConfigs[projectId].wafRules = shieldConfigs[projectId].wafRules.filter(r => r.id !== ruleId);
  }
  
  res.json({ success: true, wafRules: shieldConfigs[projectId]?.wafRules || [] });
});

// GET threat incidents for a project
app.get("/api/projects/:projectId/shield/threats", (req, res) => {
  const { projectId } = req.params;
  const config = shieldConfigs[projectId] || { securityLevel: "medium", totalThreatsBlocked: 120 };
  
  // If the security level is "under-attack", let's append a brand new mock incident live!
  if (config.securityLevel === "under-attack") {
    // Simulate high frequency ddos blocks
    config.totalThreatsBlocked += Math.floor(Math.random() * 8) + 3;
    
    // 50% chance to push a new recent event
    if (Math.random() > 0.4) {
      const uas = ["Mozilla/5.0 Bot", "curl/7.68.0", "Python-urllib/3.8", "Go-http-client/2.0"];
      const countries = [
        { name: "China", flag: "🇨🇳", ip: "218.10.22.41", q: "GET /api/v1/users SQLi payload parsed" },
        { name: "Russia", flag: "🇷🇺", ip: "91.241.13.90", q: "GET /admin/db brute force SYN spoof" },
        { name: "Germany", flag: "🇩🇪", ip: "46.20.12.110", q: "POST /blog/publish proxy inject attempt" },
        { name: "Brazil", flag: "🇧🇷", ip: "179.180.4.52", q: "GET / WP-crawler scan tool exploit" },
        { name: "North Korea", flag: "🇰🇵", ip: "175.45.176.4", q: "SSH credentials brute-force hijack" }
      ];
      const targetCountry = countries[Math.floor(Math.random() * countries.length)];
      const freshIncident: ThreatIncident = {
        id: `inc-${generateId()}`,
        timestamp: new Date().toISOString(),
        ip: targetCountry.ip,
        country: targetCountry.name,
        flag: targetCountry.flag,
        threatType: "Simulated DDoS Threat / Exploit attempt blocked",
        action: "blocked",
        query: targetCountry.q
      };
      baseIncidents = [freshIncident, ...baseIncidents.slice(0, 14)];
    }
  } else {
    // Normal level - small chance to add basic telemetry block
    if (Math.random() > 0.88) {
      config.totalThreatsBlocked += 1;
      const normalCountries = [
        { name: "United States", flag: "🇺🇸", ip: "66.249.79.12", q: "GET /robots.txt checked" },
        { name: "Canada", flag: "🇨🇦", ip: "192.0.2.14", q: "GET /api/inventory cache missed" },
        { name: "United Kingdom", flag: "🇬🇧", ip: "195.12.3.4", q: "GET /assets/index-B7y9A1c.js" }
      ];
      const target = normalCountries[Math.floor(Math.random() * normalCountries.length)];
      const fresh: ThreatIncident = {
        id: `inc-${generateId()}`,
        timestamp: new Date().toISOString(),
        ip: target.ip,
        country: target.name,
        flag: target.flag,
        threatType: "Automated scraper signature validated",
        action: "challenged",
        query: target.q
      };
      baseIncidents = [fresh, ...baseIncidents.slice(0, 14)];
    }
  }

  res.json({
    totalBlocked: config.totalThreatsBlocked,
    securityLevel: config.securityLevel,
    incidents: baseIncidents
  });
});

// ==========================================
// WORKSPACES & TEAMS ENDPOINTS
// ==========================================
app.get("/api/workspaces", (req, res) => {
  res.json(workspaces);
});

app.post("/api/workspaces", (req, res) => {
  const { name } = req.body;
  const newWorkspace: Workspace = {
    id: `ws-${generateId()}`,
    name: name || "Untitled Workspace",
    owner: "jayomer1234@gmail.com",
    members: [
      { email: "jayomer1234@gmail.com", role: "Owner" }
    ]
  };
  workspaces.push(newWorkspace);
  res.json(newWorkspace);
});

app.post("/api/workspaces/:workspaceId/members", (req, res) => {
  const { workspaceId } = req.params;
  const { email, role } = req.body;
  const ws = workspaces.find(w => w.id === workspaceId);
  if (!ws) {
    return res.status(404).json({ error: "Workspace not found." });
  }
  const newMember = { email: email || "new@monaco.io", role: role || "Member" };
  ws.members.push(newMember);
  saveToLocalDB();
  res.json(ws);
});

app.delete("/api/workspaces/:workspaceId/members", (req, res) => {
  const { workspaceId } = req.params;
  const email = req.body?.email || req.query?.email;
  if (!email) {
    return res.status(400).json({ error: "Email parameter is required to delete workspace member." });
  }
  const ws = workspaces.find(w => w.id === workspaceId);
  if (!ws) {
    return res.status(404).json({ error: "Workspace not found." });
  }
  const member = ws.members.find(m => m.email === email);
  if (!member) {
    return res.status(404).json({ error: "Collaboration member not found." });
  }
  if (member.role === "Owner") {
    return res.status(400).json({ error: "Cannot delete the Owner of the workspace." });
  }
  ws.members = ws.members.filter(m => m.email !== email);
  saveToLocalDB();
  res.json(ws);
});

app.put("/api/workspaces/:workspaceId/members", (req, res) => {
  const { workspaceId } = req.params;
  const { email, role } = req.body;
  if (!email || !role) {
    return res.status(400).json({ error: "Both email and role parameters are required." });
  }
  const ws = workspaces.find(w => w.id === workspaceId);
  if (!ws) {
    return res.status(404).json({ error: "Workspace not found." });
  }
  const member = ws.members.find(m => m.email === email);
  if (!member) {
    return res.status(404).json({ error: "Collaboration member not found." });
  }
  if (member.role === "Owner") {
    return res.status(400).json({ error: "Cannot modify Owner permissions." });
  }
  member.role = role;
  saveToLocalDB();
  res.json(ws);
});

app.get("/api/workspaces/:workspaceId/tokens", (req, res) => {
  const { workspaceId } = req.params;
  if (!teamTokens[workspaceId]) {
    teamTokens[workspaceId] = [];
  }
  res.json(teamTokens[workspaceId]);
});

app.post("/api/workspaces/:workspaceId/tokens", (req, res) => {
  const { workspaceId } = req.params;
  const { name, scope, role } = req.body;
  
  if (!teamTokens[workspaceId]) {
    teamTokens[workspaceId] = [];
  }
  
  const newToken: TeamAccessToken = {
    id: `tok-${generateId()}`,
    name: name || "CI/CD Auto Token",
    token: `vx_team_priv_${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`,
    createdAt: new Date().toISOString(),
    scope: scope || "Read",
    role: role || "Integration Hook"
  };
  
  teamTokens[workspaceId].push(newToken);
  saveToLocalDB();
  res.json(newToken);
});

app.delete("/api/workspaces/:workspaceId/tokens/:tokenId", (req, res) => {
  const { workspaceId, tokenId } = req.params;
  if (teamTokens[workspaceId]) {
    teamTokens[workspaceId] = teamTokens[workspaceId].filter(t => t.id !== tokenId);
    saveToLocalDB();
  }
  res.json({ success: true });
});

app.get("/api/workspaces/:workspaceId/policies", (req, res) => {
  const { workspaceId } = req.params;
  if (!workspacePolicies[workspaceId]) {
    workspacePolicies[workspaceId] = {
      projects: "Write",
      database: "Read",
      auth: "None",
      shield: "Read",
      billing: "None",
      deployment: "Write"
    };
  }
  res.json(workspacePolicies[workspaceId]);
});

app.put("/api/workspaces/:workspaceId/policies", (req, res) => {
  const { workspaceId } = req.params;
  const { projects, database, auth, shield, billing, deployment } = req.body;
  
  workspacePolicies[workspaceId] = {
    projects: projects || "Read",
    database: database || "None",
    auth: auth || "None",
    shield: shield || "None",
    billing: billing || "None",
    deployment: deployment || "Read"
  };
  
  saveToLocalDB();
  res.json(workspacePolicies[workspaceId]);
});

// ==========================================
// EXPANSIVE DATABASE ENDPOINTS
// ==========================================
app.get("/api/projects/:projectId/database/services", (req, res) => {
  const { projectId } = req.params;
  if (!databaseServices[projectId]) {
    databaseServices[projectId] = [];
  }
  res.json(databaseServices[projectId]);
});

app.post("/api/projects/:projectId/database/services", (req, res) => {
  const { projectId } = req.params;
  const { name, type, region, allocatedCpu, allocatedRam, allocatedStorage } = req.body;
  if (!databaseServices[projectId]) {
    databaseServices[projectId] = [];
  }

  const generatedId = `dbs-${generateId()}`;
  const dbName = `${(name || type || "db").toLowerCase().replace(/[^a-z0-9]/g, "")}_vortex`;
  const username = type === "redis" ? undefined : "vortex_user";
  const password = `vx_pwd_${generateId()}${generateId()}`.substring(0, 18);
  
  let port = 5432;
  let proto = "postgresql";
  if (type === "mysql") {
    port = 3306;
    proto = "mysql";
  } else if (type === "mongodb") {
    port = 27017;
    proto = "mongodb";
  } else if (type === "redis") {
    port = 6379;
    proto = "redis";
  }

  let connectionString = "";
  if (type === "redis") {
    connectionString = `redis://default:${password}@vortex.ml:${port}`;
  } else if (type === "mongodb") {
    connectionString = `mongodb://${username}:${password}@vortex.ml:${port}/${dbName}?authSource=admin`;
  } else {
    connectionString = `${proto}://${username}:${password}@vortex.ml:${port}/${dbName}`;
  }

  const newService = {
    id: generatedId,
    projectId,
    name: name || `vortex-${type}`,
    type: type || "postgresql",
    status: "active",
    connectionString,
    host: "vortex.ml",
    port,
    username,
    password,
    databaseName: dbName,
    allocatedCpu: allocatedCpu || 0.25,
    allocatedRam: allocatedRam || 512,
    allocatedStorage: allocatedStorage || 10,
    metrics: {
      cpuUsage: [5, 12, 8, 14, 11, 9, 15, 12, 10],
      ramUsage: [32, 40, 38, 45, 41, 48, 50, 44, 46]
    },
    region: region || "US-East-1 (N. Virginia)",
    createdAt: new Date().toISOString()
  };

  databaseServices[projectId].push(newService);
  res.json(newService);
});

app.post("/api/projects/:projectId/database/services/:serviceId/clone", (req, res) => {
  const { projectId, serviceId } = req.params;
  const services = databaseServices[projectId] || [];
  const found = services.find(s => s.id === serviceId);
  if (!found) {
    return res.status(404).json({ error: "Database service not found." });
  }

  const clonedId = `dbs-${generateId()}`;
  const cloned = {
    ...found,
    id: clonedId,
    name: `${found.name}-cloned-test`,
    status: "active",
    createdAt: new Date().toISOString(),
    connectionString: found.connectionString.replace(found.databaseName || "", `${found.databaseName || "db"}_cloned`)
  };

  databaseServices[projectId].push(cloned);
  res.json({ success: true, service: cloned });
});

app.post("/api/projects/:projectId/database/services/:serviceId/scaling", (req, res) => {
  const { projectId, serviceId } = req.params;
  const { allocatedCpu, allocatedRam, allocatedStorage } = req.body;
  const services = databaseServices[projectId] || [];
  const found = services.find(s => s.id === serviceId);
  if (!found) {
    return res.status(404).json({ error: "Database service not found." });
  }

  found.allocatedCpu = allocatedCpu || found.allocatedCpu;
  found.allocatedRam = allocatedRam || found.allocatedRam;
  found.allocatedStorage = allocatedStorage || found.allocatedStorage;
  found.status = "scaling";
  
  // Return scaling back to active after a tiny delay
  setTimeout(() => {
    found.status = "active";
  }, 1500);

  res.json(found);
});

app.delete("/api/projects/:projectId/database/services/:serviceId", (req, res) => {
  const { projectId, serviceId } = req.params;
  if (databaseServices[projectId]) {
    databaseServices[projectId] = databaseServices[projectId].filter(s => s.id !== serviceId);
  }
  res.json({ success: true, services: databaseServices[projectId] || [] });
});

// SCALING & INFRASTRUCTURE CONFIG ENDPOINTS
app.get("/api/projects/:projectId/scaling", (req, res) => {
  const { projectId } = req.params;
  if (!scalingConfigs[projectId]) {
    scalingConfigs[projectId] = {
      minInstances: 1,
      maxInstances: 5,
      targetCpuPercent: 70,
      maxMemoryOption: "512MB",
      concurrencyLimit: 80,
      optimizeTreeShaking: true
    };
  }
  res.json(scalingConfigs[projectId]);
});

app.post("/api/projects/:projectId/scaling", (req, res) => {
  const { projectId } = req.params;
  const { minInstances, maxInstances, targetCpuPercent, maxMemoryOption, concurrencyLimit, optimizeTreeShaking } = req.body;
  
  scalingConfigs[projectId] = {
    minInstances: Number(minInstances) || 1,
    maxInstances: Number(maxInstances) || 5,
    targetCpuPercent: Number(targetCpuPercent) || 70,
    maxMemoryOption: maxMemoryOption || "512MB",
    concurrencyLimit: Number(concurrencyLimit) || 80,
    optimizeTreeShaking: optimizeTreeShaking === true
  };
  
  res.json(scalingConfigs[projectId]);
});

// ENVIRONMENTS ENDPOINTS
app.get("/api/projects/:projectId/environments", (req, res) => {
  const { projectId } = req.params;
  if (!projectEnvironments[projectId]) {
    projectEnvironments[projectId] = [
      { id: "env-prod", projectId, name: "production", isActive: true, variablesCount: 2 }
    ];
  }
  res.json(projectEnvironments[projectId]);
});

app.post("/api/projects/:projectId/environments/fork", (req, res) => {
  const { projectId } = req.params;
  const { name, cloneDb } = req.body;
  if (!projectEnvironments[projectId]) {
    projectEnvironments[projectId] = [
      { id: "env-prod", projectId, name: "production", isActive: true, variablesCount: 2 }
    ];
  }

  const nameClean = (name || "staging").toLowerCase().replace(/[^a-z0-9]/g, "");
  const envId = `env-${generateId()}`;
  const newEnv = {
    id: envId,
    projectId,
    name: nameClean,
    isActive: false,
    variablesCount: 2,
    clonedFrom: "production"
  };

  projectEnvironments[projectId].push(newEnv);

  // If cloneDb is true, automatically clone all active database services onto this environment!
  if (cloneDb && databaseServices[projectId]) {
    const parentServices = [...databaseServices[projectId]];
    parentServices.forEach(s => {
      if (!s.name.includes(`-${nameClean}-fork`)) {
        databaseServices[projectId].push({
          ...s,
          id: `dbs-${generateId()}`,
          name: `${s.name}-${nameClean}-fork`,
          connectionString: s.connectionString.replace(s.databaseName || "", `${s.databaseName || "db"}_${nameClean}`),
          createdAt: new Date().toISOString()
        });
      }
    });
  }

  res.json({ success: true, environment: newEnv, environments: projectEnvironments[projectId] });
});

app.get("/api/projects/:projectId/database/tables", (req, res) => {
  const { projectId } = req.params;
  if (!databaseTables[projectId]) {
    databaseTables[projectId] = [];
  }
  res.json(databaseTables[projectId]);
});

app.post("/api/projects/:projectId/database/tables", (req, res) => {
  const { projectId } = req.params;
  const { name, columns } = req.body;
  
  if (!databaseTables[projectId]) {
    databaseTables[projectId] = [];
  }
  
  const originalCols = columns || [
    { name: "id", type: "uuid", isNullable: false, isPrimaryKey: true },
    { name: "created_at", type: "timestamp", isNullable: false, isPrimaryKey: false }
  ];

  const newTable: DbTable = {
    id: `tbl-${generateId()}`,
    name: name || "new_table",
    columns: originalCols,
    rows: []
  };
  
  databaseTables[projectId].push(newTable);
  res.json(newTable);
});

app.delete("/api/projects/:projectId/database/tables/:tableName", (req, res) => {
  const { projectId, tableName } = req.params;
  if (databaseTables[projectId]) {
    databaseTables[projectId] = databaseTables[projectId].filter(t => t.name !== tableName);
  }
  res.json({ success: true, tables: databaseTables[projectId] || [] });
});

// Interactive SQL & Query Scanner
app.post("/api/projects/:projectId/database/query", (req, res) => {
  const { projectId } = req.params;
  const { sql } = req.body;
  
  if (!sql || typeof sql !== "string") {
    return res.status(400).json({ error: "Missing SQL string parameter value." });
  }

  const queryTrimmed = sql.trim().toLowerCase();
  
  if (!databaseTables[projectId]) {
    databaseTables[projectId] = [];
  }

  // Basic SQL interpreter mock
  if (queryTrimmed.startsWith("select")) {
    // Determine which table is being queried
    const foundTable = databaseTables[projectId].find(t => queryTrimmed.includes(t.name.toLowerCase()));
    if (!foundTable) {
      return res.json({
        success: false,
        error: `Table definition from SQL query context not found. Available tables: ${databaseTables[projectId].map(t => t.name).join(", ")}`,
        rows: []
      });
    }
    
    // Check if query selects specific filter
    if (queryTrimmed.includes("where")) {
      const parts = queryTrimmed.split("where");
      const condition = parts[1]?.trim() || "";
      // Simple where field=val interpreter
      const matchOperator = condition.includes("=") ? "=" : "like";
      const filterParts = condition.split(matchOperator);
      const rawField = filterParts[0]?.trim();
      let rawVal = filterParts[1]?.trim().replace(/['"]/g, "") || "";
      
      const realField = Object.keys(foundTable.rows[0] || {}).find(k => k.toLowerCase() === rawField);
      
      if (realField) {
        const filteredRows = foundTable.rows.filter(r => {
          const val = String(r[realField]).toLowerCase();
          return val.includes(rawVal.toLowerCase());
        });
        return res.json({
          success: true,
          command: "SELECT",
          fields: foundTable.columns.map(c => c.name),
          rowCount: filteredRows.length,
          rows: filteredRows
        });
      }
    }

    return res.json({
      success: true,
      command: "SELECT",
      fields: foundTable.columns.map(c => c.name),
      rowCount: foundTable.rows.length,
      rows: foundTable.rows
    });
  } 
  
  if (queryTrimmed.startsWith("insert")) {
    // INSERT INTO users_profiles (display_name, email) VALUES ('David', 'david@mail.com')
    const foundTable = databaseTables[projectId].find(t => queryTrimmed.includes(t.name.toLowerCase()));
    if (!foundTable) {
      return res.status(400).json({ error: "Target table not found." });
    }

    // Generate standard interactive insertion row
    const newRow: Record<string, any> = {};
    foundTable.columns.forEach(col => {
      if (col.isPrimaryKey) {
        newRow[col.name] = col.type === "uuid" ? "usr-" + generateId() : Math.floor(Math.random() * 1000000);
      } else if (col.type === "boolean") {
        newRow[col.name] = true;
      } else if (col.type === "timestamp") {
        newRow[col.name] = new Date().toISOString().replace("T", " ").substring(0, 19);
      } else if (col.type === "integer") {
        newRow[col.name] = Math.floor(Math.random() * 5000);
      } else {
        newRow[col.name] = "New Mock Value";
      }
    });

    foundTable.rows.push(newRow);
    return res.json({
      success: true,
      command: "INSERT",
      rowCount: 1,
      rows: [newRow],
      message: `Successfully executed: 1 row inserted into ${foundTable.name}.`
    });
  }

  // Default fallback statement confirmation
  return res.json({
    success: true,
    command: "EXPLAIN",
    rowCount: 0,
    rows: [],
    message: "SQL statement accepted and interpreted successfully."
  });
});

app.post("/api/projects/:projectId/database/tables/:tableName/record", (req, res) => {
  const { projectId, tableName } = req.params;
  const record = req.body;
  
  const tables = databaseTables[projectId] || [];
  const foundTable = tables.find(t => t.name === tableName);
  if (!foundTable) {
    return res.status(404).json({ error: "Table configuration not found." });
  }

  // Fill in primary key / dates if missing
  const completeRecord: Record<string, any> = { ...record };
  foundTable.columns.forEach(c => {
    if (completeRecord[c.name] === undefined || completeRecord[c.name] === "") {
      if (c.isPrimaryKey) {
        completeRecord[c.name] = c.type === "uuid" ? "rec-" + generateId() : Math.floor(Math.random() * 9999);
      } else if (c.defaultValue) {
        completeRecord[c.name] = c.defaultValue === "true" ? true : c.defaultValue === "false" ? false : c.defaultValue;
      } else {
        completeRecord[c.name] = null;
      }
    }
  });

  foundTable.rows.push(completeRecord);
  res.json(completeRecord);
});

app.delete("/api/projects/:projectId/database/tables/:tableName/record/:rowId", (req, res) => {
  const { projectId, tableName, rowId } = req.params;
  const tables = databaseTables[projectId] || [];
  const foundTable = tables.find(t => t.name === tableName);
  if (!foundTable) {
    return res.status(404).json({ error: "Table configuration not found." });
  }

  const pkCol = foundTable.columns.find(c => c.isPrimaryKey)?.name || "id";
  foundTable.rows = foundTable.rows.filter(r => String(r[pkCol]) !== rowId);
  res.json({ success: true, rowId });
});


// ==========================================
// NATIVE AUTH CONFIG & USER TABLE ENDPOINTS
// ==========================================
app.get("/api/projects/:projectId/auth/config", (req, res) => {
  const { projectId } = req.params;
  if (!authConfigs[projectId]) {
    authConfigs[projectId] = {
      jwtLifespan: 3600,
      allowSignup: true,
      passwordMinLength: 8,
      providers: { emailPassword: true, magicLink: false, otp: false },
      redirectUrls: ["http://localhost:3000"]
    };
  }
  res.json(authConfigs[projectId]);
});

app.post("/api/projects/:projectId/auth/config", (req, res) => {
  const { projectId } = req.params;
  const config = req.body;
  authConfigs[projectId] = { ...authConfigs[projectId], ...config };
  res.json(authConfigs[projectId]);
});

app.get("/api/projects/:projectId/auth/users", (req, res) => {
  const { projectId } = req.params;
  if (!authUsers[projectId]) {
    authUsers[projectId] = [];
  }
  res.json(authUsers[projectId]);
});

app.post("/api/projects/:projectId/auth/users", (req, res) => {
  const { projectId } = req.params;
  const { email, status } = req.body;
  if (!authUsers[projectId]) {
    authUsers[projectId] = [];
  }
  const newUser: AuthUser = {
    id: `usr-${generateId()}`,
    email: email || "unknown@monaco.io",
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    status: status || "active"
  };
  authUsers[projectId].push(newUser);
  res.json(newUser);
});

app.delete("/api/projects/:projectId/auth/users/:userId", (req, res) => {
  const { projectId, userId } = req.params;
  if (authUsers[projectId]) {
    authUsers[projectId] = authUsers[projectId].filter(u => u.id !== userId);
  }
  res.json({ success: true, userId });
});


// ==========================================
// GATEWAY API KEYS ENDPOINTS
// ==========================================
app.get("/api/projects/:projectId/api-keys", (req, res) => {
  const { projectId } = req.params;
  if (!apiKeys[projectId]) {
    apiKeys[projectId] = [];
  }
  res.json(apiKeys[projectId]);
});

app.post("/api/projects/:projectId/api-keys", (req, res) => {
  const { projectId } = req.params;
  const { name, rateLimit, description } = req.body;
  
  if (!apiKeys[projectId]) {
    apiKeys[projectId] = [];
  }

  const generatedHex = Math.random().toString(16).substring(2, 10) + Math.random().toString(16).substring(2, 10);
  const newKey: ApiKey = {
    id: `key-${generateId()}`,
    name: name || "Developer Gate Token",
    secret: `vtx_live_${generatedHex}`,
    createdAt: new Date().toISOString(),
    rateLimit: rateLimit ? parseInt(rateLimit, 10) : 60,
    description: description || "Main node access gate key."
  };
  
  apiKeys[projectId].push(newKey);
  res.json(newKey);
});

app.delete("/api/projects/:projectId/api-keys/:keyId", (req, res) => {
  const { projectId, keyId } = req.params;
  if (apiKeys[projectId]) {
    apiKeys[projectId] = apiKeys[projectId].filter(k => k.id !== keyId);
  }
  res.json({ success: true, keyId });
});


// ==========================================
// COMPOSIO APP INTEGRATION CONNECTOR PATHS
// ==========================================
app.get("/api/projects/:projectId/composio/connectors", (req, res) => {
  const { projectId } = req.params;
  if (!composioConnectors[projectId]) {
    composioConnectors[projectId] = [];
  }
  res.json(composioConnectors[projectId]);
});

app.post("/api/projects/:projectId/composio/connectors/:id/toggle", (req, res) => {
  const { projectId, id } = req.params;
  const connectors = composioConnectors[projectId] || [];
  const match = connectors.find(c => c.id === id);
  if (match) {
    match.isConnected = !match.isConnected;
    match.scopesCount = match.isConnected ? Math.floor(Math.random() * 12) + 5 : 0;
  }
  res.json({ success: true, connector: match });
});

app.post("/api/projects/:projectId/composio/webhooks/test", (req, res) => {
  const { connectorId, payload } = req.body;
  res.json({
    success: true,
    connectorId,
    timestamp: new Date().toISOString(),
    responseCode: 200,
    dispatchStatus: "DELIVERED",
    body: {
      message: `Successfully connected and dispatched simulated Composio webhook bridge. Received event metadata safely!`,
      payload: payload || {}
    }
  });
});


// Connect Express paths with Vite configuration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Vite Dev Mode setup
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode serving compiled static bundles
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[vortex] Server online on http://0.0.0.0:${PORT}`);
  });
}

// Only start the local dev server when not in Vercel serverless environment
if (!process.env.VERCEL) {
  startServer();
}

// Export the Express app for use as a Vercel serverless function handler
export { app };

