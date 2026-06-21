import React, { useState, useEffect } from "react";
import {
  Layers,
  Activity,
  Settings,
  FolderOpen,
  GitBranch,
  Github,
  Plus,
  Eye,
  EyeOff,
  Trash2,
  ExternalLink,
  Globe,
  Lock,
  Workflow,
  RefreshCw,
  ArrowRight,
  History,
  AlertCircle,
  Command,
  HeartHandshake,
  Shield,
  ShieldAlert,
  Zap,
  Check,
  Database,
  Key,
  Users,
  Radio,
  Terminal,
  Braces,
  Sparkles,
  Cpu,
  Copy,
  ChevronRight,
  Play
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Project, Deployment, EnvVar, ComposioConnector } from "./types";
import MetricCard from "./components/MetricCard";
import DeploymentLogConsole from "./components/DeploymentLogConsole";
import InteractivePreviewFrame from "./components/InteractivePreviewFrame";
import AnalyticsCharts from "./components/AnalyticsCharts";
import ServerlessPlayground from "./components/ServerlessPlayground";

export default function App() {
  // Navigation & Project tab tracking
  const [activeTab, setActiveTab] = useState<"projects" | "database" | "auth" | "apis" | "shield" | "composio" | "teams" | "settings">("projects");
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  // Monaco Labs Console Addons State
  const [dbTables, setDbTables] = useState<any[]>([]);
  const [selectedDbTable, setSelectedDbTable] = useState<any | null>(null);
  const [dbQueryText, setDbQueryText] = useState("");
  const [dbQueryResult, setDbQueryResult] = useState<any | null>(null);
  const [dbEditRecord, setDbEditRecord] = useState<any | null>(null);
  const [dbColumnsCreator, setDbColumnsCreator] = useState<any[]>([
    { name: "id", type: "uuid", isNullable: false, isPrimaryKey: true },
    { name: "created_at", type: "timestamp", isNullable: false, isPrimaryKey: false }
  ]);
  const [newTableName, setNewTableName] = useState("");

  const [authConfig, setAuthConfig] = useState<any>({
    jwtLifespan: 3600,
    allowSignup: true,
    passwordMinLength: 8,
    providers: { emailPassword: true, magicLink: false, otp: false },
    redirectUrls: []
  });
  const [authUsersList, setAuthUsersList] = useState<any[]>([]);
  const [newAuthEmail, setNewAuthEmail] = useState("");
  const [selectedUserStatus, setSelectedUserStatus] = useState<"active" | "suspended">("active");

  const [apiKeysList, setApiKeysList] = useState<any[]>([]);
  const [newApiKeyName, setNewApiKeyName] = useState("");
  const [newApiKeyRateLimit, setNewApiKeyRateLimit] = useState(60);
  const [newApiKeyDesc, setNewApiKeyDesc] = useState("");


  const [workspacesList, setWorkspacesList] = useState<any[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<any | null>(null);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [inviteMemberEmail, setInviteMemberEmail] = useState("");
  const [inviteMemberRole, setInviteMemberRole] = useState("Member");

  // Connection & loading flags
  const [loading, setLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);

  // Shield & WAF Web Application Firewall State
  const [shieldConfig, setShieldConfig] = useState<any>({
    sslMode: "flexible",
    developmentMode: false,
    brotli: true,
    securityLevel: "medium",
    wafRules: [],
    totalThreatsBlocked: 0
  });
  const [shieldIncidents, setShieldIncidents] = useState<any[]>([]);
  const [newWafField, setNewWafField] = useState<"ip" | "country" | "user_agent" | "uri">("ip");
  const [newWafOperator, setNewWafOperator] = useState<"eq" | "contains" | "ne">("eq");
  const [newWafValue, setNewWafValue] = useState("");
  const [newWafAction, setNewWafAction] = useState<"block" | "challenge" | "allow">("block");

  // New Project importer state
  const [isNewProjectModelOpen, setIsNewProjectModelOpen] = useState(false);
  const [newProjName, setNewProjName] = useState("");
  const [newProjRepo, setNewProjRepo] = useState("");
  const [newProjFramework, setNewProjFramework] = useState("react");
  const [newProjBranch, setNewProjBranch] = useState("main");
  const [newProjPrompt, setNewProjPrompt] = useState("");

  // Tab 1: Project Details State
  const [projectDeployments, setProjectDeployments] = useState<Deployment[]>([]);
  const [activeDeployment, setActiveDeployment] = useState<Deployment | null>(null);

  // Settings State: Env vars and custom Domains
  const [envVarsList, setEnvVarsList] = useState<EnvVar[]>([]);
  const [newEnvKey, setNewEnvKey] = useState("");
  const [newEnvVal, setNewEnvVal] = useState("");
  const [showEnvs, setShowEnvs] = useState<Record<string, boolean>>({});

  const [domainsList, setDomainsList] = useState<string[]>([]);
  const [newDomainName, setNewDomainName] = useState("");

  // Subdomain & Advanced Settings State
  const [subdomainPrefix, setSubdomainPrefix] = useState("");
  const [selectedBaseDomain, setSelectedBaseDomain] = useState("vortex.ml");
  const [buildRootDir, setBuildRootDir] = useState("./src");
  const [nodeVersion, setNodeVersion] = useState("Node 20.x (LTS)");
  const [bypassCache, setBypassCache] = useState(true);
  const [previewComments, setPreviewComments] = useState(false);
  const [isSavingAdvancedSettings, setIsSavingAdvancedSettings] = useState(false);
  const [showSaveMessage, setShowSaveMessage] = useState(false);

  // --- COMPOSIO MCP STATE ---
  const [composioConnectorsList, setComposioConnectorsList] = useState<any[]>([]);
  const [mcpApiKey, setMcpApiKey] = useState("ck_SYi-RiE1KuAfo-b3fbPS");
  const [mcpEndpoint, setMcpEndpoint] = useState("https://connect.composio.dev/mcp");
  const [isMcpKeyVisible, setIsMcpKeyVisible] = useState(false);
  const [isCopiedConfig, setIsCopiedConfig] = useState(false);
  const [mcpTestLogs, setMcpTestLogs] = useState<string[]>([]);
  const [isTestingMcp, setIsTestingMcp] = useState(false);
  const [mcpAgentPlatform, setMcpAgentPlatform] = useState<"VortexAutonomousOS" | "VortexCoreLLM" | "VortexAnycastRouting">("VortexAutonomousOS");
  const [mcpAgentPrompt, setMcpAgentPrompt] = useState("Query active database tables and alert slack of table changes");
  const [mcpTestRunStatus, setMcpTestRunStatus] = useState<"idle" | "running" | "success" | "failed">("idle");

  // --- PLATFORM ADMINISTRATION LOGIN STATE ---
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem("vortex_admin_session") === "jayomer1234@gmail.com";
  });
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError("");

    setTimeout(() => {
      if (loginEmail.trim().toLowerCase() === "jayomer1234@gmail.com" && loginPassword === "Jayisthegoat") {
        localStorage.setItem("vortex_admin_session", "jayomer1234@gmail.com");
        setIsLoggedIn(true);
        setIsLoggingIn(false);
      } else {
        setLoginError("✗ [VORTEX_SECURE] Invalid operational authorization credentials.");
        setIsLoggingIn(false);
      }
    }, 800);
  };

  const handleLogout = () => {
    localStorage.removeItem("vortex_admin_session");
    setIsLoggedIn(false);
    setLoginEmail("");
    setLoginPassword("");
  };

  // --- AGENT AUTOPILOT SUBDOMAIN DEPLOYER STATE ---
  const [agentAllocSubdomain, setAgentAllocSubdomain] = useState("my-secured-endpoint");
  const [agentChosenProvider, setAgentChosenProvider] = useState("Vortex Anycast Subdomain Router");
  const [isAllocatingSubdomain, setIsAllocatingSubdomain] = useState(false);
  const [agentAllocSuccessMsg, setAgentAllocSuccessMsg] = useState("");

  // --- CONFIGS: ADVANCED GENERATE API KEY STATE ---
  const [genKeyName, setGenKeyName] = useState("");
  const [genKeyRateLimit, setGenKeyRateLimit] = useState(120);
  const [genKeyPrefix, setGenKeyPrefix] = useState("vx_live");
  const [genKeyExpiry, setGenKeyExpiry] = useState("30");
  const [genKeyPermissions, setGenKeyPermissions] = useState<string[]>(["read_db", "trigger_deploy"]);
  const [generatedTokenResult, setGeneratedTokenResult] = useState("");

  // --- CONFIGS: MODELS & WORKSPACE AI AGENTS SECRET KEYS ---
  const [selectedDefaultModel, setSelectedDefaultModel] = useState("vortex-2");
  const [modelTemperature, setModelTemperature] = useState(0.7);
  const [modelMaxTokens, setModelMaxTokens] = useState(4096);
  const [modelEngineFallback, setModelEngineFallback] = useState(true);
  const [workspaceSureThingApiKey, setWorkspaceSureThingApiKey] = useState("vx_sk_948a28f8ac2e948194ff71");
  const [workspaceGrokApiKey, setWorkspaceGrokApiKey] = useState("vx_gate_f893da82fc2d8a4de012c8");
  const [workspaceBase44ApiKey, setWorkspaceBase44ApiKey] = useState("vx_router_a2b8e9ccf0e21a8d052062");
  const [isSavingAdvancedModelSettings, setIsSavingAdvancedModelSettings] = useState(false);
  const [showAdvancedModelSaveMsg, setShowAdvancedModelSaveMsg] = useState(false);

  // Deployment Trigger state inside Settings or main panel
  const [isDeployingNew, setIsDeployingNew] = useState(false);
  const [triggerLogOutput, setTriggerLogOutput] = useState<Deployment | null>(null);

  // Analytics Metrics endpoints state
  const [analyticsMetrics, setAnalyticsMetrics] = useState<any[]>([]);
  const [analyticsVitals, setAnalyticsVitals] = useState<any>({
    lcp: { value: 1.2, rating: "good" },
    fid: { value: 24, rating: "good" },
    cls: { value: 0.02, rating: "good" }
  });
  const [isTrafficSpikeActive, setIsTrafficSpikeActive] = useState(false);

  // Pre-configured Mock templates for Git Import
  const gitTemplates = [
    { repo: "jayomer1234/vue-vibe-dashboard", framework: "react" },
    { repo: "jayomer1234/blogging-next-cms", framework: "nextjs" },
    { repo: "jayomer1234/micro-auth-service", framework: "serverless" },
  ];

  // Nested Sub-Tabs & Advanced Feature States for Vercel/Supabase enclaves
  const [activeVercelSubTab, setActiveVercelSubTab] = useState<"overview" | "edge-middleware" | "speed-insights" | "domains">("overview");
  const [activeSupabaseSubTab, setActiveSupabaseSubTab] = useState<"instances" | "tables" | "templates" | "scaling" | "api-docs">("instances");

  // Vortex Cloud Expansive states
  const [databaseServices, setDatabaseServices] = useState<any[]>([]);
  const [scalingConfig, setScalingConfig] = useState<any>({
    minInstances: 1,
    maxInstances: 5,
    targetCpuPercent: 70,
    maxMemoryOption: "512MB",
    concurrencyLimit: 80,
    optimizeTreeShaking: true
  });
  const [environmentsList, setEnvironmentsList] = useState<any[]>([]);
  const [isProvisioningDb, setIsProvisioningDb] = useState(false);
  const [newDbEngine, setNewDbEngine] = useState<"postgresql" | "mysql" | "mongodb" | "redis">("postgresql");
  const [newDbInstanceName, setNewDbInstanceName] = useState("");
  const [newDbRegion, setNewDbRegion] = useState("US-East-1 (N. Virginia)");

  // Vercel: Edge Middleware Rules
  const [middlewareRules, setMiddlewareRules] = useState<any[]>([
    { id: "mw-1", path: "/old-blog/*", action: "redirect", target: "/blog/$1", status: "301", active: true },
    { id: "mw-2", path: "/api/*", action: "inject_header", target: "x-edge-geo: {country-code}", status: "200", active: true },
    { id: "mw-3", path: "/admin/*", action: "block_agent", target: "bad-bot-crawler", status: "403", active: true }
  ]);
  const [newMwPath, setNewMwPath] = useState("");
  const [newMwAction, setNewMwAction] = useState("redirect");
  const [newMwTarget, setNewMwTarget] = useState("");
  const [newMwStatus, setNewMwStatus] = useState("301");

  // Vercel: Speed Insights Controls
  const [insightsComplexity, setInsightsComplexity] = useState(30); // Interactive scale impacting JS INP/FCP metrics
  const [insightsDelay, setInsightsDelay] = useState(1.2);         // Slider scale impacting Image loading / LCP
  const [insightsNoSize, setInsightsNoSize] = useState(false);        // Checkbox simulating layout shifts / CLS

  // Supabase: Storage Buckets
  const [storageBuckets, setStorageBuckets] = useState<any[]>([
    { id: "sb-1", name: "public-avatars", isPublic: true, maxFileSize: "10 MB", fileCount: 2, byteSize: "1.4 MB" },
    { id: "sb-2", name: "invoice-vault", isPublic: false, maxFileSize: "5 MB", fileCount: 1, byteSize: "482 KB" }
  ]);
  const [selectedStorageBucket, setSelectedStorageBucket] = useState<string>("public-avatars");
  const [storageFiles, setStorageFiles] = useState<any>({
    "public-avatars": [
      { id: "f-1", name: "john-profile.jpg", size: "142 KB", type: "image/jpeg", lastModified: "2026-06-18 14:24" },
      { id: "f-2", name: "company-logo-highres.png", size: "1.2 MB", type: "image/png", lastModified: "2026-06-19 11:05" }
    ],
    "invoice-vault": [
      { id: "f-3", name: "receipt_inv_9821.pdf", size: "482 KB", type: "application/pdf", lastModified: "2026-05-12 09:15" }
    ]
  });
  const [newBucketName, setNewBucketName] = useState("");
  const [newBucketPublic, setNewBucketPublic] = useState(true);

  // Supabase: Realtime Postgres Streams
  const [realtimeChannel, setRealtimeChannel] = useState("*");
  const [realtimeListening, setRealtimeListening] = useState(true);
  const [realtimeEventsLogs, setRealtimeEventsLogs] = useState<any[]>([
    { id: "ev-1", table: "users_profiles", type: "INSERT", schema: "public", timestamp: "19:54:12", payload: { id: "p_81", display_name: "Alice Key", email: "alice@vibe.io", status: "active" } }
  ]);

  // --- Vercel/Supabase Advanced Mock Functions ---
  const handleAddMwRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMwPath.trim()) return;
    const rule = {
      id: "mw-" + Math.random().toString(36).substring(2, 7),
      path: newMwPath,
      action: newMwAction,
      target: newMwTarget || "N/A",
      status: newMwStatus,
      active: true
    };
    setMiddlewareRules([...middlewareRules, rule]);
    setNewMwPath("");
    setNewMwTarget("");
  };

  const handleToggleMwRule = (ruleId: string) => {
    setMiddlewareRules(middlewareRules.map(r => r.id === ruleId ? { ...r, active: !r.active } : r));
  };

  const handleDeleteMwRule = (ruleId: string) => {
    setMiddlewareRules(middlewareRules.filter(r => r.id !== ruleId));
  };

  // Supa: Storage bucket creators
  const handleAddNewBucket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBucketName.trim()) return;
    const bName = newBucketName.toLowerCase().replace(/[^a-z0-9-_]/g, "");
    if (storageBuckets.some(b => b.name === bName)) {
      alert("A storage bucket with this name already exists.");
      return;
    }
    const newB = {
      id: "sb-" + Math.random().toString(36).substring(2, 7),
      name: bName,
      isPublic: newBucketPublic,
      maxFileSize: newBucketPublic ? "10 MB" : "5 MB",
      fileCount: 0,
      byteSize: "0 KB"
    };

    setStorageBuckets([...storageBuckets, newB]);
    setStorageFiles({
      ...storageFiles,
      [bName]: []
    });
    setSelectedStorageBucket(bName);
    setNewBucketName("");
  };

  const handleFileUpload = (event: any) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const activeFiles = storageFiles[selectedStorageBucket] || [];
    const matchedSize = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
      : `${(file.size / 1024).toFixed(0)} KB`;
    
    const newF = {
      id: "f-" + Math.random().toString(36).substring(2, 7),
      name: file.name,
      size: matchedSize,
      type: file.type || "application/octet-stream",
      lastModified: new Date().toISOString().replace("T", " ").substring(0, 16)
    };

    const updated = [...activeFiles, newF];
    setStorageFiles({
      ...storageFiles,
      [selectedStorageBucket]: updated
    });

    // Update metrics on bucket
    setStorageBuckets(prevBuckets => prevBuckets.map(b => {
      if (b.name === selectedStorageBucket) {
        return {
          ...b,
          fileCount: updated.length
        };
      }
      return b;
    }));
  };

  const handleDeleteStorageFile = (fileId: string) => {
    const activeFiles = storageFiles[selectedStorageBucket] || [];
    const filtered = activeFiles.filter((f: any) => f.id !== fileId);
    setStorageFiles({
      ...storageFiles,
      [selectedStorageBucket]: filtered
    });
    
    setStorageBuckets(prevBuckets => prevBuckets.map(b => {
      if (b.name === selectedStorageBucket) {
        return {
          ...b,
          fileCount: filtered.length,
          byteSize: filtered.length === 0 ? "0 KB" : b.byteSize
        };
      }
      return b;
    }));
  };

  // WS Realtime Streams Triggered
  const handleTriggerRealtimeEvent = () => {
    const tableChoices = ["users_profiles", "orders_v2", "system_credentials"];
    const actionChoices = ["INSERT", "UPDATE", "DELETE"];
    const chosenTable = tableChoices[Math.floor(Math.random() * tableChoices.length)];
    const chosenAction = actionChoices[Math.floor(Math.random() * actionChoices.length)];
    
    const mockRecordId = Math.floor(Math.random() * 800) + 100;
    let payloadSeed: any = { id: mockRecordId, last_updated: new Date().toLocaleTimeString() };
    if (chosenTable === "users_profiles") {
      payloadSeed = {
        id: `usr_${mockRecordId}`,
        display_name: ["Dave Developer", "Jane Doe", "Satoshi Nakamoto", "Vercel Wizard"][Math.floor(Math.random() * 4)],
        email: `client_${mockRecordId}@domain.io`,
        status: chosenAction === "DELETE" ? "inactive" : "active"
      };
    } else {
      payloadSeed = {
        order_id: mockRecordId,
        amount: parseFloat((Math.random() * 250 + 5.5).toFixed(2)),
        currency: "USD",
        status: ["settled", "authorized", "disputed"][Math.floor(Math.random() * 3)]
      };
    }

    const newEv = {
      id: "ev-" + Math.random().toString(36).substring(2, 7),
      table: chosenTable,
      type: chosenAction,
      schema: "public",
      timestamp: new Date().toLocaleTimeString(),
      payload: payloadSeed
    };

    setRealtimeEventsLogs(prev => [newEv, ...prev].slice(0, 50));
  };

  // 1. Fetch initial Projects List on platform boot
  const fetchDbTables = (projectId: string) => {
    fetch(`/api/projects/${projectId}/database/tables`)
      .then((res) => res.json())
      .then((data) => {
        setDbTables(data);
        if (data.length > 0) {
          setSelectedDbTable(data[0]);
        } else {
          setSelectedDbTable(null);
        }
      })
      .catch((err) => console.error("Database loading error:", err));
  };

  const fetchAuthConfig = (projectId: string) => {
    fetch(`/api/projects/${projectId}/auth/config`)
      .then((res) => res.json())
      .then((data) => setAuthConfig(data))
      .catch((err) => console.error("Auth config load error:", err));

    fetch(`/api/projects/${projectId}/auth/users`)
      .then((res) => res.json())
      .then((data) => setAuthUsersList(data))
      .catch((err) => console.error("Auth users load error:", err));
  };

  const fetchApiKeys = (projectId: string) => {
    fetch(`/api/projects/${projectId}/api-keys`)
      .then((res) => res.json())
      .then((data) => setApiKeysList(data))
      .catch((err) => console.error("API keys load error:", err));
  };

  const fetchComposioConnectors = (projectId: string) => {
    fetch(`/api/projects/${projectId}/composio/connectors`)
      .then((res) => res.json())
      .then((data) => setComposioConnectorsList(data))
      .catch((err) => console.error("Composio connectors load error:", err));
  };

  const fetchDatabaseServices = (projectId: string) => {
    fetch(`/api/projects/${projectId}/database/services`)
      .then((res) => res.json())
      .then((data) => setDatabaseServices(data))
      .catch((err) => console.error("Database services load error:", err));
  };

  const fetchScalingConfig = (projectId: string) => {
    fetch(`/api/projects/${projectId}/scaling`)
      .then((res) => res.json())
      .then((data) => setScalingConfig(data))
      .catch((err) => console.error("Scaling config load error:", err));
  };

  const fetchEnvironments = (projectId: string) => {
    fetch(`/api/projects/${projectId}/environments`)
      .then((res) => res.json())
      .then((data) => setEnvironmentsList(data))
      .catch((err) => console.error("Environments load error:", err));
  };


  const fetchWorkspaces = (activeWorkspaceId?: string) => {
    fetch("/api/workspaces")
      .then((res) => res.json())
      .then((data) => {
        setWorkspacesList(data);
        if (data.length > 0) {
          const targetId = activeWorkspaceId || currentWorkspace?.id || data[0].id;
          const found = data.find((w: any) => w.id === targetId) || data[0];
          setCurrentWorkspace(found);
        }
      })
      .catch((err) => console.error("Workspaces load error:", err));
  };

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        setProjectsList(data);
        if (data.length > 0) {
          setCurrentProject(data[0]);
        }
        setIsInitializing(false);
      })
      .catch((err) => {
        console.error("Critical error bootstrapping initial parameters", err);
        setIsInitializing(false);
      });
    fetchWorkspaces();
  }, []);

  // 2. Whenever selected Project alters, reload Environments, Routing Tables, Deployments History
  useEffect(() => {
    if (!currentProject) return;

    setLoading(true);
    const projId = currentProject.id;

    // Fetch dependencies in parallel safely including Vortex Proxy Shield
    Promise.all([
      fetch(`/api/projects/${projId}/env`).then((res) => res.json()),
      fetch(`/api/projects/${projId}/domains`).then((res) => res.json()),
      fetch(`/api/projects/${projId}/deployments`).then((res) => res.json()),
      fetch(`/api/projects/${projId}/shield`).then((res) => res.json()),
      fetch(`/api/projects/${projId}/shield/threats`).then((res) => res.json()),
    ])
      .then(([envs, domains, deps, shield, threats]) => {
        setEnvVarsList(envs);
        setDomainsList(domains);
        setProjectDeployments(deps);
        setShieldConfig(shield);
        setShieldIncidents(threats.incidents || []);

        // Load new Monaco Console features
        fetchDbTables(projId);
        fetchAuthConfig(projId);
        fetchApiKeys(projId);
        fetchComposioConnectors(projId);
        fetchDatabaseServices(projId);
        fetchScalingConfig(projId);
        fetchEnvironments(projId);

        // Map actively selected deployment if exists
        const foundActive = deps.find((d: Deployment) => d.id === currentProject.activeDeploymentId);
        if (foundActive) {
          setActiveDeployment(foundActive);
        } else if (deps.length > 0) {
          setActiveDeployment(deps[0]);
        } else {
          setActiveDeployment(null);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error refreshing project metadata", err);
        setLoading(false);
      });
  }, [currentProject]);

  // Shield periodic update polling hook (rapid 4 second polling to simulate reverse proxy DDoS blocks)
  useEffect(() => {
    if (!currentProject || activeTab !== "shield") return;

    const fetchShieldUpdates = () => {
      fetch(`/api/projects/${currentProject.id}/shield/threats`)
        .then((res) => res.json())
        .then((data) => {
          setShieldIncidents(data.incidents || []);
          setShieldConfig(prev => ({
            ...prev,
            totalThreatsBlocked: data.totalBlocked
          }));
        })
        .catch((err) => console.error("Shield updates failed", err));
    };

    fetchShieldUpdates();
    const interval = setInterval(fetchShieldUpdates, 4000);
    return () => clearInterval(interval);
  }, [currentProject, activeTab, shieldConfig.securityLevel]);

  // 3. Analytics periodic polling hook (polling every 10 seconds to animate graphs)
  useEffect(() => {
    const fetchAnalytics = () => {
      fetch(`/api/analytics?spike=${isTrafficSpikeActive}`)
        .then((res) => res.json())
        .then((data) => {
          setAnalyticsMetrics(data.metrics);
          setAnalyticsVitals(data.vitals);
        })
        .catch((err) => console.error("Telemetry failed", err));
    };

    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 10000);
    return () => clearInterval(interval);
  }, [isTrafficSpikeActive]);

  // Handler: Deploy custom repository entry
  const handleDeployNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName || !newProjRepo) return;

    try {
      setIsNewProjectModelOpen(false);
      
      // Step A: Create project record on backend Express router
      const respPrj = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProjName,
          framework: newProjFramework,
          repo: newProjRepo,
          branch: newProjBranch || "main",
        }),
      });
      const addedProject = await respPrj.json();

      setProjectsList((prev) => [...prev, addedProject]);
      setCurrentProject(addedProject);
      setActiveTab("deployments"); // Redirect immediately to compilation tab to see terminal output

      // Step B: Automatically trigger first live compiler sequence
      setIsDeployingNew(true);
      const respTrigger = await fetch(`/api/projects/${addedProject.id}/deployments/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commitMessage: "chore: initial bootstrap code compiler sequence",
          buildCommand: newProjFramework === "react" ? "npm run build" : (newProjFramework === "nextjs" ? "next build" : "esbuild serverless"),
          customPrompt: newProjPrompt || "",
        }),
      });

      const triggeredDep = await respTrigger.json();
      setTriggerLogOutput(triggeredDep);
      setProjectDeployments((prev) => [triggeredDep, ...prev]);
      setActiveDeployment(triggeredDep);

      // Clean creator values
      setNewProjName("");
      setNewProjRepo("");
      setNewProjPrompt("");

      // Wait 3.2 seconds for compiler isolate simulating sequence complete, then refresh
      setTimeout(() => {
        setIsDeployingNew(false);
        setTriggerLogOutput(null);
        // Refresh project list to retrieve set deployment ID
        fetch("/api/projects")
          .then((res) => res.json())
          .then((updatedL) => {
            setProjectsList(updatedL);
            const foundNode = updatedL.find((p: Project) => p.id === addedProject.id);
            if (foundNode) setCurrentProject(foundNode);
          });
      }, 3500);

    } catch (err) {
      console.error("Critical error setting platform deployment triggers", err);
      setIsDeployingNew(false);
    }
  };

  // Handler: Trigger incremental hot-deployments from Settings / Deployments history
  const triggerManualRedeplay = async () => {
    if (!currentProject) return;

    setIsDeployingNew(true);
    setActiveTab("deployments");

    try {
      const resp = await fetch(`/api/projects/${currentProject.id}/deployments/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commitMessage: `hot-build: deploy code update revision #${Math.floor(Math.random() * 85 + 10)}`,
        }),
      });

      const dep = await resp.json();
      setTriggerLogOutput(dep);
      setProjectDeployments((prev) => [dep, ...prev]);
      setActiveDeployment(dep);

      setTimeout(() => {
        setIsDeployingNew(false);
        setTriggerLogOutput(null);
        
        // Full metadata refresh
        fetch("/api/projects")
          .then((res) => res.json())
          .then((updatedL) => {
            setProjectsList(updatedL);
            const foundNode = updatedL.find((p: Project) => p.id === currentProject.id);
            if (foundNode) setCurrentProject(foundNode);
          });
      }, 3500);

    } catch (err) {
      console.error("Manual trig deploy error", err);
      setIsDeployingNew(false);
    }
  };

  // Environment Variable CRUD trigger handlers
  const handleAddEnv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !newEnvKey || !newEnvVal) return;

    try {
      const resp = await fetch(`/api/projects/${currentProject.id}/env`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: newEnvKey, value: newEnvVal }),
      });
      const envs = await resp.json();
      setEnvVarsList(envs);
      setNewEnvKey("");
      setNewEnvVal("");
    } catch (err) {
      console.error("Error setting custom environment variable", err);
    }
  };

  const handleDeleteEnv = async (envId: string) => {
    if (!currentProject) return;

    try {
      const resp = await fetch(`/api/projects/${currentProject.id}/env/${envId}`, {
        method: "DELETE",
      });
      const data = await resp.json();
      if (data.success) {
        setEnvVarsList(data.envs);
      }
    } catch (err) {
      console.error("Error writing deletion", err);
    }
  };

  // Custom DNS domain controllers
  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !newDomainName) return;

    try {
      const resp = await fetch(`/api/projects/${currentProject.id}/domains`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: newDomainName }),
      });
      const doms = await resp.json();
      setDomainsList(doms);
      setNewDomainName("");
    } catch (err) {
      console.error("error submitting domains", err);
    }
  };

  const handleDeleteDomain = async (name: string) => {
    if (!currentProject) return;

    try {
      const resp = await fetch(`/api/projects/${currentProject.id}/domains/${name}`, {
        method: "DELETE",
      });
      const data = await resp.json();
      if (data.success) {
        setDomainsList(data.domains);
      }
    } catch (err) {
      console.error("domain err removal", err);
    }
  };

  // Custom quick-subdomain provisioner logic
  const handleProvisionSubdomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !subdomainPrefix) return;

    const prefixClean = subdomainPrefix.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!prefixClean) return;

    const fullDomain = `${prefixClean}.${selectedBaseDomain}`;

    try {
      const resp = await fetch(`/api/projects/${currentProject.id}/domains`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: fullDomain }),
      });
      const doms = await resp.json();
      setDomainsList(doms);
      setSubdomainPrefix("");
    } catch (err) {
      console.error("error submitting subdomain extension", err);
    }
  };

  // Agent Autopilot Subdomain Deployment routing handler
  const handleAgentAllocateSubdomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !agentAllocSubdomain.trim()) return;

    setIsAllocatingSubdomain(true);
    setAgentAllocSuccessMsg("");

    try {
      const resp = await fetch(`/api/projects/${currentProject.id}/domains/agent-allocate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subdomain: agentAllocSubdomain,
          provider: agentChosenProvider
        }),
      });
      const data = await resp.json();
      if (data.success) {
        setDomainsList(prev => {
          if (!prev.includes(data.allocatedDomain)) {
            return [...prev, data.allocatedDomain];
          }
          return prev;
        });
        setAgentAllocSuccessMsg(`Successfully routed & compiled at: ${data.allocatedDomain}`);
        // Fetch fresh deployments so the preview frame updates to the brand new agent deployment layout!
        fetch(`/api/projects/${currentProject.id}/deployments`)
          .then((res) => res.json())
          .then((deps) => setProjectDeployments(deps));
      }
    } catch (err) {
      console.error("Agent subdomain routing allocation error: ", err);
    } finally {
      setIsAllocatingSubdomain(false);
    }
  };

  // Advanced build & configuration parameters simulated saving
  const handleSaveAdvancedSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAdvancedSettings(true);
    setShowSaveMessage(false);
    setTimeout(() => {
      setIsSavingAdvancedSettings(false);
      setShowSaveMessage(true);
      setTimeout(() => setShowSaveMessage(false), 4000);
    }, 1200);
  };

  // --- COMPOSIO & MCP ACTION HANDLERS ---
  const handleToggleConnector = (connectorId: string) => {
    if (!currentProject) return;
    fetch(`/api/projects/${currentProject.id}/composio/connectors/${connectorId}/toggle`, {
      method: "POST"
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.connector) {
          setComposioConnectorsList(prev => 
            prev.map(c => c.id === connectorId ? data.connector : c)
          );
        }
      })
      .catch(err => console.error("Connector toggle error:", err));
  };

  const runAgentMcp = async () => {
    setIsTestingMcp(true);
    setMcpTestRunStatus("running");
    setMcpTestLogs([]);

    try {
      const response = await fetch("/api/composio/mcp/run-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: mcpApiKey,
          prompt: mcpAgentPrompt,
          platform: mcpAgentPlatform
        })
      });

      const data = await response.json();
      const logs: string[] = data.logs || [`[ERROR] Failed to connect — HTTP ${response.status}`];

      // Drip logs for live terminal effect
      let i = 0;
      const interval = setInterval(() => {
        if (i < logs.length) {
          setMcpTestLogs(prev => [...prev, logs[i]]);
          i++;
        } else {
          clearInterval(interval);
          setIsTestingMcp(false);
          setMcpTestRunStatus(data.status === "success" ? "success" : "failed");

          // Populate connectors list with real discovered tools
          if (data.tools && data.tools.length > 0) {
            const realConnectors = data.tools.slice(0, 12).map((tool: any) => ({
              id: `mcp-${tool.name}`,
              name: tool.name,
              description: tool.description || "Composio MCP Tool",
              isConnected: true,
              scopesCount: Object.keys(tool.inputSchema?.properties || {}).length,
              webhookUrl: `${mcpEndpoint}/tools/call`,
              lastSync: new Date().toISOString()
            }));
            setComposioConnectorsList(realConnectors);
          }
        }
      }, 150);

    } catch (err: any) {
      setMcpTestLogs([`[CRITICAL] Network error: ${err.message}`]);
      setIsTestingMcp(false);
      setMcpTestRunStatus("failed");
    }
  };

  // --- ADVANCED API KEY GENERATOR HANDLER ---
  const handleGenerateAdvancedKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!genKeyName.trim() || !currentProject) return;

    const tokenPart = Math.random().toString(36).substring(2, 10).toUpperCase() + Math.random().toString(36).substring(2, 10).toUpperCase();
    const token = `${genKeyPrefix}_${tokenPart}`;

    fetch(`/api/projects/${currentProject.id}/api-keys`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: genKeyName,
        rateLimit: genKeyRateLimit,
        description: `Custom expiry ${genKeyExpiry} days, prefix [${genKeyPrefix}], permissions: [${genKeyPermissions.join(", ")}]`
      })
    })
      .then(res => res.json())
      .then(() => {
        setGeneratedTokenResult(token);
        setGenKeyName("");
        fetchApiKeys(currentProject.id);
      })
      .catch(err => console.error("Generate advanced key error:", err));
  };

  // --- LLM MODEL CONFIGURATOR HANDLER ---
  const handleSaveAdvancedModelSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAdvancedModelSettings(true);
    setShowAdvancedModelSaveMsg(false);
    setTimeout(() => {
      setIsSavingAdvancedModelSettings(false);
      setShowAdvancedModelSaveMsg(true);
      setTimeout(() => setShowAdvancedModelSaveMsg(false), 4000);
    }, 1000);
  };

  // Rollbacks active deployment selector
  const activateRollbackInstance = (depId: string) => {
    if (!currentProject) return;
    
    // Simple update active deployment locally, simulates swap
    setProjectsList((prev) =>
      prev.map((p) => (p.id === currentProject.id ? { ...p, activeDeploymentId: depId } : p))
    );
    setCurrentProject((prev) => (prev ? { ...prev, activeDeploymentId: depId } : null));
    setActiveTab("projects"); // Redirect to inspect rollback preview live
  };

  // Vortex Shield state updates
  const handleUpdateShieldConfig = async (fields: any) => {
    if (!currentProject) return;
    try {
      const resp = await fetch(`/api/projects/${currentProject.id}/shield`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = await resp.json();
      setShieldConfig(data);
    } catch (err) {
      console.error("Failed to update shield configurations", err);
    }
  };

  const handleAddWafRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !newWafValue) return;
    try {
      const resp = await fetch(`/api/projects/${currentProject.id}/shield/waf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field: newWafField,
          operator: newWafOperator,
          value: newWafValue,
          action: newWafAction
        }),
      });
      const data = await resp.json();
      setShieldConfig(data);
      setNewWafValue("");
    } catch (err) {
      console.error("Failed to add WAF rule", err);
    }
  };

  const handleDeleteWafRule = async (ruleId: string) => {
    if (!currentProject) return;
    try {
      const resp = await fetch(`/api/projects/${currentProject.id}/shield/waf/${ruleId}`, {
        method: "DELETE",
      });
      const data = await resp.json();
      if (data.success) {
        setShieldConfig((prev: any) => ({
          ...prev,
          wafRules: data.wafRules
        }));
      }
    } catch (err) {
      console.error("Failed to delete WAF rule", err);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#070707] text-white flex flex-col justify-center items-center gap-4">
        <div className="flex items-center gap-2 text-lg font-mono">
          <Command className="h-6 w-6 text-neutral-400 animate-spin" />
          <span>BOOTING MONACO LABS CONSOLE...</span>
        </div>
        <p className="text-xs text-neutral-600 uppercase font-mono tracking-wider">Mounting Cloud Console Layer & Security Core</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#070707] text-neutral-200 font-sans flex items-center justify-center p-4 selection:bg-neutral-800 selection:text-white" id="vortex-login-screen">
        <div className="w-full max-w-md bg-neutral-950 border border-neutral-900 rounded-2xl p-8 space-y-6 shadow-2xl relative overflow-hidden">
          {/* Subtle background glow effect */}
          <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
          
          <div className="space-y-2 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-900 border border-neutral-850 text-white mb-2 shadow-inner">
              <Command className="h-6 w-6" />
            </div>
            <h1 className="text-lg font-black font-mono tracking-widest text-white uppercase">VORTEX CLOUD PLATFORM</h1>
            <p className="text-xs text-neutral-500 font-mono uppercase tracking-wider leading-relaxed">
              Consolidated Infrastructure & Cloud Database Engine
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] text-neutral-550 font-bold uppercase tracking-wider block font-mono">
                Operator Email Address
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="operator@monaco.io"
                className="w-full bg-neutral-900 border border-neutral-850 rounded-xl h-11 px-4 text-xs font-mono text-neutral-200 focus:outline-none focus:border-neutral-750 transition"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] text-neutral-550 font-bold uppercase tracking-wider block font-mono">
                  Administrative Password
                </label>
                <span className="text-[8.5px] text-indigo-405 font-mono">SECURED KEYPASS</span>
              </div>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••••••••"
                className="w-full bg-neutral-900 border border-neutral-850 rounded-xl h-11 px-4 text-xs font-mono text-neutral-200 focus:outline-none focus:border-neutral-750 transition"
              />
            </div>

            {loginError && (
              <div className="p-3 bg-red-950/10 border border-red-900/30 rounded-xl text-[10.5px] font-mono text-red-450 leading-relaxed text-center animate-in fade-in zoom-in-95">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-950 h-11 rounded-xl text-xs font-mono font-black uppercase tracking-wider transition duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:bg-neutral-900 disabled:text-neutral-600 disabled:cursor-not-allowed"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  AUTHENTICATING OPERATOR...
                </>
              ) : (
                <>
                  <span>Initialize Console Handshake</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070707] text-neutral-200 font-sans antialiased selection:bg-neutral-800 selection:text-white">
      
      {/* Platform Navigation Header */}
      <header className="border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          
          {/* Logo Brand Title */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-center">
              <Command className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-sm font-black font-mono tracking-widest uppercase text-white">MONACO LABS</span>
              <span className="text-[9px] block font-semibold text-neutral-500 font-mono tracking-widest uppercase leading-none">CONSOLE MANAGEMENT SUITE</span>
            </div>
          </div>

          {/* Org Selector & New Deploy command */}
          <div className="flex items-center gap-4">
            
            {/* Project List Selector dropdown */}
            {projectsList.length > 0 && currentProject && (
              <div className="relative">
                <select
                  value={currentProject.id}
                  onChange={(e) => {
                    const match = projectsList.find((p) => p.id === e.target.value);
                    if (match) setCurrentProject(match);
                  }}
                  className="bg-neutral-900 border border-neutral-800 text-neutral-200 text-xs font-mono font-semibold h-9 rounded-lg px-3 pr-8 focus:outline-none focus:border-neutral-700 cursor-pointer appearance-none uppercase animate-in fade-in"
                >
                  {projectsList.map((prj) => (
                    <option key={prj.id} value={prj.id}>
                      📁 {prj.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500 text-xs">▼</div>
              </div>
            )}

            <button
              onClick={() => setIsNewProjectModelOpen(true)}
              className="bg-neutral-100 hover:bg-neutral-200 text-neutral-950 font-bold text-xs font-mono h-9 rounded-lg px-4 flex items-center gap-1.5 transition duration-155 tracking-wider border border-neutral-300 shadow"
            >
              <Plus className="h-4 w-4" />
              IMPORT GIT
            </button>

            <button
              onClick={handleLogout}
              className="bg-neutral-950 hover:bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-805 text-xs font-mono h-9 rounded-lg px-3 transition flex items-center justify-center gap-1.5"
              id="dev-logout-btn"
            >
              <EyeOff className="h-3.5 w-3.5" />
              SIGN OUT
            </button>
          </div>
        </div>

        {/* Global Navigation Tabs header */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 border-t border-neutral-900 flex gap-6 text-xs overflow-auto select-none no-scrollbar">
          {(["projects", "database", "auth", "apis", "shield", "composio", "teams", "settings"] as const).map((tab) => {
            const isActive = activeTab === tab;
            let displayString = tab.toUpperCase();
            if (tab === "projects") displayString = "Deployments";
            if (tab === "database") displayString = "Monaco DB";
            if (tab === "auth") displayString = "Native Auth";
            if (tab === "apis") displayString = "API Gateway";
            if (tab === "shield") displayString = "WAF Shield";
            if (tab === "composio") displayString = "Integrations";
            if (tab === "teams") displayString = "Workspaces";
            if (tab === "settings") displayString = "Configs";

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3.5 font-mono tracking-wider font-semibold border-b-2 transition duration-150 flex items-center gap-1.5 focus:outline-none whitespace-nowrap ${
                  isActive
                    ? "border-neutral-200 text-white"
                    : "border-transparent text-neutral-500 hover:text-neutral-300"
                }`}
              >
                {tab === "projects" && <FolderOpen className="h-3.5 w-3.5" />}
                {tab === "database" && <Database className="h-3.5 w-3.5" />}
                {tab === "auth" && <Users className="h-3.5 w-3.5" />}
                {tab === "apis" && <Key className="h-3.5 w-3.5" />}
                {tab === "shield" && <Shield className="h-3.5 w-3.5" />}
                {tab === "composio" && <Workflow className="h-3.5 w-3.5" />}
                {tab === "teams" && <Terminal className="h-3.5 w-3.5" />}
                {tab === "settings" && <Settings className="h-3.5 w-3.5" />}
                {displayString}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Container Sandbox body */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        
        {/* Loading cover */}
        {loading && (
          <div className="py-24 text-center text-neutral-500 text-xs uppercase font-mono flex flex-col justify-center items-center gap-3">
            <RefreshCw className="h-6 w-6 text-neutral-500 animate-spin" />
            <span>Scanning Vortex global Anycast tables...</span>
          </div>
        )}

        {!loading && currentProject && (
          <div className="space-y-8 animate-in fade-in duration-200">
            
            {/* Active Project Heading Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-900 pb-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-neutral-100 uppercase tracking-tight">{currentProject.name}</h1>
                  <span className="text-[10px] font-semibold bg-neutral-900 border border-neutral-800 text-neutral-400 px-2.5 py-0.5 rounded font-mono uppercase">
                    {currentProject.framework}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono text-neutral-500">
                  <span className="flex items-center gap-1">
                    <Github className="h-3.5 w-3.5" />
                    <a
                      href={`https://github.com/${currentProject.repo}`}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-neutral-300 transition"
                    >
                      {currentProject.repo}
                    </a>
                  </span>
                  <span className="flex items-center gap-1">
                    <GitBranch className="h-3.5 w-3.5" />
                    <span>{currentProject.branch}</span>
                  </span>
                </div>
              </div>

              {/* Deployment Action Status Tag */}
              {isDeployingNew ? (
                <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-xl text-xs font-mono text-neutral-300 animate-pulse">
                  <RefreshCw className="h-4.5 w-4.5 animate-spin text-neutral-400" />
                  <span>Isolate running: Triggering compilation pipeline...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={triggerManualRedeplay}
                    className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-200 text-xs font-semibold font-mono h-9 rounded-lg px-4 flex items-center gap-1.5 transition shadow"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    TRIGGER DEPLOY
                  </button>
                  {activeDeployment && (
                    <a
                      href={`/api/preview/${activeDeployment.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-white hover:bg-neutral-200 text-neutral-900 text-xs font-semibold font-mono h-9 rounded-lg px-4 flex items-center gap-1.5 transition shadow"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      LIVE ADDR
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* TAB 1: Projects Overview (Live Preview Canvas, Details & Deployment Information) */}
            {activeTab === "projects" && (
              <div className="space-y-6">
                
                {/* Vercel Sub-Tab Bar Navigation */}
                <div className="flex items-center gap-1.5 border-b border-neutral-900 pb-3 mb-6 font-mono text-[11px] overflow-x-auto no-scrollbar">
                  {[
                    { id: "overview", label: "Project Overview", icon: <FolderOpen className="h-3.5 w-3.5" /> },
                    { id: "edge-middleware", label: "Edge Middleware", icon: <Cpu className="h-3.5 w-3.5" /> },
                    { id: "speed-insights", label: "Speed Insights", icon: <Activity className="h-3.5 w-3.5" /> },
                    { id: "domains", label: "Domains & DNS", icon: <Globe className="h-3.5 w-3.5" /> }
                  ].map((st) => (
                    <button
                      key={st.id}
                      onClick={() => setActiveVercelSubTab(st.id as any)}
                      className={`h-8 px-3 rounded-lg flex items-center gap-1.5 font-bold transition duration-150 border uppercase cursor-pointer ${
                        activeVercelSubTab === st.id
                          ? "bg-neutral-100 border-neutral-300 text-neutral-950 font-black shadow-sm"
                          : "bg-neutral-950/40 border-transparent text-neutral-500 hover:text-neutral-300 hover:border-neutral-850"
                      }`}
                    >
                      {st.icon}
                      <span>{st.label}</span>
                    </button>
                  ))}
                </div>

                {activeVercelSubTab === "overview" && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    {/* Visual statistics micro cluster */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-center text-neutral-500 font-mono text-xs italic">
                        Detailed statistics will be loaded when a project is deployed.
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left Column: Interactive sandbox iframe */}
                      <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 font-mono">
                            Active Sandbox Frame
                          </h3>
                          {activeDeployment && (
                            <div className="text-xs text-neutral-500 font-mono">
                              Commit: <span className="text-neutral-300 font-bold">{activeDeployment.commitHash}</span>
                            </div>
                          )}
                        </div>

                        {activeDeployment ? (
                          <InteractivePreviewFrame
                            deploymentId={activeDeployment.id}
                            projectName={currentProject.name}
                            previewUrl={`https://${currentProject.name}-${activeDeployment.id}.vortex.ml`}
                          />
                        ) : (
                          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center text-neutral-500 py-24 shadow-sm">
                            <AlertCircle className="h-8 w-8 text-neutral-700 mx-auto mb-2 animate-bounce" />
                            <span>No deployments finished. Generate/trigger a manual compiler sequence above.</span>
                          </div>
                        )}
                      </div>

                      {/* Right Column: Deployment details */}
                      <div className="space-y-6 lg:col-span-1">
                        <div className="space-y-4 bg-neutral-900 border border-neutral-800/80 rounded-xl p-5 shadow-sm">
                          <h4 className="text-xs font-semibold text-neutral-400 tracking-wider uppercase border-b border-neutral-800 pb-2.5">
                            Active Production Node
                          </h4>
                          
                          {activeDeployment ? (
                            <div className="space-y-4 font-mono text-xs">
                              <div className="space-y-1">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">Repository Branch</span>
                                <div className="text-xs font-mono font-semibold text-neutral-100 flex items-center gap-1.5">
                                  <GitBranch className="h-4 w-4 text-neutral-400" />
                                  <span>{currentProject.branch}</span>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">Deployment State</span>
                                <div className="flex items-center gap-2">
                                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                                  <span className="text-xs font-mono font-bold text-emerald-400 tracking-wide uppercase">READY / ACTIVE</span>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">Commit Message</span>
                                <p className="text-xs text-neutral-300 font-mono italic leading-relaxed bg-neutral-950 border border-neutral-850 p-2.5 rounded-lg">
                                  "{activeDeployment.commitMessage}"
                                </p>
                              </div>

                              <div className="space-y-1">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">DNS Routing aliases</span>
                                <div className="space-y-1 text-xs font-mono">
                                  {domainsList.map((dom) => (
                                    <a
                                      key={dom}
                                      href={`/api/preview/${activeDeployment.id}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-neutral-400 hover:text-white transition flex items-center gap-1 hover:underline text-[11px]"
                                    >
                                      🔗 {dom}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-neutral-600 text-xs py-4 text-center font-mono">
                              Ready telemetry missing. Run a trigger.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeVercelSubTab === "edge-middleware" && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400 font-mono flex items-center gap-2">
                        <Cpu className="h-4.5 w-4.5 text-neutral-400" />
                        Vercel Edge Middleware Sandbox
                      </h3>
                      <p className="text-xs text-neutral-505 leading-relaxed max-w-3xl font-mono">
                        Deploy light interceptor scripts running on Vortex global edge Anycast nodes. Inject response headers, trigger geolocation redirects, rewrite incoming paths, or block user scrapers at layer 7.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start font-mono text-xs">
                      {/* Left: Middleware rules list / Editor */}
                      <div className="lg:col-span-1 bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-6 shadow-sm">
                        <h4 className="text-xs font-bold text-white uppercase border-b border-neutral-800 pb-2">
                          ACTIVE MIDDLEWARE RULES
                        </h4>

                        <div className="space-y-3">
                          {middlewareRules.map(rule => (
                            <div key={rule.id} className="p-3 bg-neutral-950 border border-neutral-850 rounded-lg space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-300 font-bold">
                                  {rule.id.toUpperCase()}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleToggleMwRule(rule.id)}
                                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded cursor-pointer ${
                                      rule.active ? "bg-emerald-500/10 text-emerald-400" : "bg-neutral-800 text-neutral-500"
                                    }`}
                                  >
                                    {rule.active ? "ACTIVE" : "PAUSED"}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMwRule(rule.id)}
                                    className="text-neutral-605 hover:text-rose-450 p-0.5"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <p className="text-neutral-400 text-[11px] leading-relaxed">
                                  Match: <code className="text-indigo-400 font-bold">{rule.path}</code>
                                </p>
                                <p className="text-neutral-500 text-[10px]/relaxed uppercase">
                                  Action: <strong className="text-neutral-350 font-mono">{rule.action.replace("_", " ")}</strong>
                                </p>
                                <p className="text-neutral-505 text-[10px]/relaxed truncate">
                                  Target: <code className="text-emerald-400">{rule.target}</code>
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Add Rule Form */}
                        <form onSubmit={handleAddMwRule} className="space-y-3 border-t border-neutral-800 pt-4 text-xs font-mono">
                          <span className="text-[10px] font-black text-neutral-400 block uppercase mb-1">Add Intercept Rule</span>
                          
                          <div className="space-y-1">
                            <label className="text-[9px] text-neutral-500 uppercase font-black block">Matching incoming path</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. /old-blog/*"
                              value={newMwPath}
                              onChange={(e) => setNewMwPath(e.target.value)}
                              className="bg-neutral-950 border border-neutral-850 rounded h-8 px-2.5 outline-none text-neutral-200 w-full"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] text-neutral-500 uppercase font-black block">Filter Action</label>
                            <select
                              value={newMwAction}
                              onChange={(e) => setNewMwAction(e.target.value)}
                              className="bg-neutral-950 border border-neutral-850 text-neutral-300 rounded h-8 px-2 outline-none w-full cursor-pointer"
                            >
                              <option value="redirect">301 Permanent Redirect</option>
                              <option value="inject_header">Inject Geolocation Custom Header</option>
                              <option value="block_agent">Strict Block User Agent Robot</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] text-neutral-500 uppercase font-black block">Destination / Value target</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. /blog/$1 or custom value"
                              value={newMwTarget}
                              onChange={(e) => setNewMwTarget(e.target.value)}
                              className="bg-neutral-950 border border-neutral-850 rounded h-8 px-2.5 outline-none text-neutral-200 w-full"
                            />
                          </div>

                          <button
                            type="submit"
                            className="bg-neutral-100 hover:bg-neutral-200 text-neutral-950 font-bold h-8 rounded-lg outline-none w-full border border-neutral-300 shadow cursor-pointer uppercase transition"
                          >
                            Add Edge Rule
                          </button>
                        </form>
                      </div>

                      {/* Right: Edge simulation playground */}
                      <div className="lg:col-span-2 space-y-6">
                        <div className="text-center py-24 text-neutral-600 italic font-mono text-xs">
                          Edge Routing diagnostics and simulation tool has been removed.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeVercelSubTab === "speed-insights" && (() => {
                  const calculatedLcp = (0.5 + insightsDelay * 1.5).toFixed(1);
                  const calculatedInp = Math.floor(20 + insightsComplexity * 2.8);
                  const calculatedFcp = (0.3 + (insightsComplexity * 0.04)).toFixed(1);
                  const calculatedCls = insightsNoSize ? 0.22 : 0.01;

                  const lcpState = parseFloat(calculatedLcp) < 2.5 ? "good" : parseFloat(calculatedLcp) < 4.0 ? "needs-improvement" : "poor";
                  const inpState = calculatedInp < 200 ? "good" : calculatedInp < 500 ? "needs-improvement" : "poor";
                  const fcpState = parseFloat(calculatedFcp) < 1.8 ? "good" : parseFloat(calculatedFcp) < 3.0 ? "needs-improvement" : "poor";
                  const clsState = calculatedCls < 0.1 ? "good" : "poor";

                  return (
                    <div className="space-y-6 animate-in fade-in duration-200 font-mono text-xs">
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                          <Activity className="h-4.5 w-4.5 text-neutral-400" />
                          Vercel Analytics & Speed Insights
                        </h3>
                        <p className="text-xs text-neutral-505 leading-relaxed max-w-3xl">
                          Analyze real-user metrics captured over global Edge Edge Network endpoints. Adjust loading weight modifiers to view performance profiles.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        {/* Sliders Control Panel */}
                        <div className="lg:col-span-1 bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-6 shadow-sm">
                          <h4 className="text-xs font-bold text-white uppercase border-b border-neutral-800 pb-2">
                            SANDBOX WEIGHT WEAR
                          </h4>

                          <div className="space-y-4">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-neutral-400 uppercase font-bold">Unoptimized Hero Images size</span>
                                <span className="text-emerald-400 font-bold font-mono">{insightsDelay.toFixed(1)} MB</span>
                              </div>
                              <input
                                type="range"
                                min="0.2"
                                max="4.0"
                                step="0.2"
                                value={insightsDelay}
                                onChange={(e) => setInsightsDelay(parseFloat(e.target.value))}
                                className="w-full accent-emerald-400 h-1 bg-neutral-950 rounded-lg cursor-pointer"
                              />
                              <p className="text-[9px] text-neutral-500">Increases asset loading and Largest Contentful Paint (LCP) values.</p>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-neutral-400 uppercase font-bold">Main JS Bundle Weight</span>
                                <span className="text-emerald-400 font-bold font-mono">{insightsComplexity} KB</span>
                              </div>
                              <input
                                type="range"
                                min="10"
                                max="150"
                                step="5"
                                value={insightsComplexity}
                                onChange={(e) => setInsightsComplexity(parseInt(e.target.value, 10))}
                                className="w-full accent-emerald-450 h-1 bg-neutral-950 rounded-lg cursor-pointer"
                              />
                              <p className="text-[9px] text-neutral-505">Grows JavaScript parsing overhead and Interaction to Next Paint (INP) frames.</p>
                            </div>

                            <div className="flex items-start gap-2.5 bg-neutral-950 border border-neutral-850 p-3 rounded-lg">
                              <input
                                type="checkbox"
                                id="insightNoSizeOpt"
                                checked={insightsNoSize}
                                onChange={(e) => setInsightsNoSize(e.target.checked)}
                                className="mt-0.5 accent-indigo-400 rounded cursor-pointer"
                              />
                              <label htmlFor="insightNoSizeOpt" className="text-[10px] leading-relaxed text-neutral-400 cursor-pointer">
                                <strong className="text-neutral-200 uppercase block font-bold mb-0.5 font-sans text-[9px] tracking-wider">Skip Image Aspect-Ratio constraints</strong>
                                Simulates unconstrained text layout shifts and Cumulative Layout Shift (CLS) spikes.
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Speed Dial Gauges */}
                        <div className="lg:col-span-2 space-y-6">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {/* Dial LCP */}
                            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-3 shadow-sm">
                              <span className="text-[9px] text-neutral-500 font-black tracking-widest uppercase">LCP (Lrgst Paint)</span>
                              <div className="relative h-20 w-20 flex items-center justify-center">
                                <svg className="absolute inset-0 h-full w-full transform -rotate-90">
                                  <circle cx="40" cy="40" r="32" className="stroke-neutral-950 stroke-4 fill-none" />
                                  <circle cx="40" cy="40" r="32"
                                    className={`stroke-4 fill-none transition-all duration-300 ${
                                      lcpState === "good" ? "stroke-emerald-500" : lcpState === "needs-improvement" ? "stroke-yellow-500" : "stroke-rose-500"
                                    }`}
                                    strokeDasharray="201"
                                    strokeDashoffset={201 - (201 * (lcpState === "good" ? 95 : lcpState === "needs-improvement" ? 65 : 35)) / 100}
                                  />
                                </svg>
                                <span className="text-xs font-black text-white">{calculatedLcp}s</span>
                              </div>
                              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                                lcpState === "good" ? "bg-emerald-500/10 text-emerald-400" : lcpState === "needs-improvement" ? "bg-yellow-500/10 text-yellow-400" : "bg-rose-500/10 text-rose-400"
                              }`}>
                                {lcpState.replace("-", " ")}
                              </span>
                            </div>

                            {/* Dial INP */}
                            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-3 shadow-sm">
                              <span className="text-[9px] text-neutral-500 font-black tracking-widest uppercase">INP (Interact Paint)</span>
                              <div className="relative h-20 w-20 flex items-center justify-center">
                                <svg className="absolute inset-0 h-full w-full transform -rotate-90">
                                  <circle cx="40" cy="40" r="32" className="stroke-neutral-950 stroke-4 fill-none" />
                                  <circle cx="40" cy="40" r="32"
                                    className={`stroke-4 fill-none transition-all duration-300 ${
                                      inpState === "good" ? "stroke-emerald-500" : inpState === "needs-improvement" ? "stroke-yellow-500" : "stroke-rose-500"
                                    }`}
                                    strokeDasharray="201"
                                    strokeDashoffset={201 - (201 * (inpState === "good" ? 98 : inpState === "needs-improvement" ? 70 : 40)) / 100}
                                  />
                                </svg>
                                <span className="text-xs font-black text-white">{calculatedInp}ms</span>
                              </div>
                              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                                inpState === "good" ? "bg-emerald-500/10 text-emerald-400" : inpState === "needs-improvement" ? "bg-yellow-500/10 text-yellow-400" : "bg-rose-500/10 text-rose-400"
                              }`}>
                                {inpState.replace("-", " ")}
                              </span>
                            </div>

                            {/* Dial CLS */}
                            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-3 shadow-sm">
                              <span className="text-[9px] text-neutral-500 font-black tracking-widest uppercase">CLS (Layout Shift)</span>
                              <div className="relative h-20 w-20 flex items-center justify-center">
                                <svg className="absolute inset-0 h-full w-full transform -rotate-90">
                                  <circle cx="40" cy="40" r="32" className="stroke-neutral-950 stroke-4 fill-none" />
                                  <circle cx="40" cy="40" r="32"
                                    className={`stroke-4 fill-none transition-all duration-300 ${
                                      clsState === "good" ? "stroke-emerald-500" : "stroke-rose-500"
                                    }`}
                                    strokeDasharray="201"
                                    strokeDashoffset={201 - (201 * (clsState === "good" ? 96 : 30)) / 100}
                                  />
                                </svg>
                                <span className="text-xs font-black text-white">{calculatedCls}</span>
                              </div>
                              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                                clsState === "good" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                              }`}>
                                {clsState}
                              </span>
                            </div>

                            {/* Dial FCP */}
                            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-3 shadow-sm">
                              <span className="text-[9px] text-neutral-500 font-black tracking-widest uppercase">FCP (First Paint)</span>
                              <div className="relative h-20 w-20 flex items-center justify-center">
                                <svg className="absolute inset-0 h-full w-full transform -rotate-90">
                                  <circle cx="40" cy="40" r="32" className="stroke-neutral-950 stroke-4 fill-none" />
                                  <circle cx="40" cy="40" r="32"
                                    className={`stroke-4 fill-none transition-all duration-300 ${
                                      fcpState === "good" ? "stroke-emerald-500" : fcpState === "needs-improvement" ? "stroke-yellow-500" : "stroke-rose-500"
                                    }`}
                                    strokeDasharray="201"
                                    strokeDashoffset={201 - (201 * (fcpState === "good" ? 97 : fcpState === "needs-improvement" ? 64 : 38)) / 100}
                                  />
                                </svg>
                                <span className="text-xs font-black text-white">{calculatedFcp}s</span>
                              </div>
                              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                                fcpState === "good" ? "bg-emerald-500/10 text-emerald-400" : fcpState === "needs-improvement" ? "bg-yellow-500/10 text-yellow-400" : "bg-rose-500/10 text-rose-400"
                              }`}>
                                {fcpState.replace("-", " ")}
                              </span>
                            </div>
                          </div>

                          {/* Historical Analytics Chart component */}
                          <div className="p-5 bg-neutral-950 border border-neutral-850 rounded-xl space-y-4">
                            <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-black block">ANALYTICS ENGINE HISTORICAL STREAM</span>
                            
                            <div className="h-32 flex items-end gap-1 border-b border-l border-neutral-900 pb-1.5 pl-1.5 pt-4">
                              {[35, 42, 38, 55, 62, 59, 70, 85, 92, 102, 94, 110, 118, 122].map((height, index) => (
                                <div key={index} className="flex-1 bg-gradient-to-t from-indigo-500/30 to-indigo-500 hover:to-indigo-400 transition duration-150 rounded-t relative group cursor-pointer" style={{ height: `${height}%` }}>
                                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-neutral-900 text-[8px] text-neutral-300 font-bold px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition duration-100 whitespace-nowrap z-10 border border-neutral-800 font-mono">
                                    {(height * 1.5).toFixed(0)} reqs
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-between items-center text-[8px] text-neutral-500 uppercase font-bold px-1">
                              <span>19:00 (UTC-7)</span>
                              <span>20:00 (Active Traffic Nodes)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {activeVercelSubTab === "domains" && (
                  <div className="space-y-6 animate-in fade-in duration-200 font-mono text-xs">
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                        <Globe className="h-4.5 w-4.5 text-neutral-400" />
                        Custom Domain Mapping & Certificate Handshaking
                      </h3>
                      <p className="text-xs text-neutral-505 leading-relaxed max-w-3xl">
                        Map unique domain aliases to routing triggers on any deployment ID. Verify DNS record validation and handshakes automatically.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start font-mono text-xs">
                      {/* Form & List */}
                      <div className="lg:col-span-1 bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-6 shadow-sm">
                        <h4 className="text-xs font-bold text-white uppercase border-b border-neutral-800 pb-2">
                          ADD CUSTOM DOMAIN ALIAS
                        </h4>

                        <form onSubmit={handleAddDomain} className="space-y-3">
                          <input
                            type="text"
                            required
                            placeholder="e.g. staging.vortex-app.io"
                            value={newDomainName}
                            onChange={(e) => setNewDomainName(e.target.value)}
                            className="bg-neutral-950 border border-neutral-850 rounded h-9 px-3 outline-none text-neutral-100 w-full text-xs font-mono"
                          />
                          <button
                            type="submit"
                            className="bg-neutral-100 hover:bg-neutral-200 text-neutral-950 font-bold h-9 w-full rounded-lg shadow border border-neutral-300 uppercase cursor-pointer transition text-xs"
                          >
                            Add Domain Map
                          </button>
                        </form>

                        <div className="space-y-2.5">
                          <span className="text-[10px] text-neutral-500 uppercase tracking-divider block font-black">CURRENT ROUTED DOMAINS</span>
                          {domainsList.map(dom => (
                            <div key={dom} className="flex justify-between items-center p-2.5 bg-neutral-950 border border-neutral-850 rounded-lg">
                              <span className="text-neutral-300 font-semibold select-all font-mono truncate max-w-[150px]">{dom}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="bg-emerald-500/10 text-emerald-400 text-[8px] px-1.5 py-0.5 rounded font-black uppercase">VALID</span>
                                <button
                                  onClick={() => handleDeleteDomain(dom)}
                                  className="text-neutral-500 hover:text-rose-400 p-0.5 cursor-pointer"
                                  title="Delete domain"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Diagnostic Checker + Agent Deployment Hub */}
                      <div className="lg:col-span-2 space-y-6">
                        {/* AI Agent Autopilot Subdomain Deployer */}
                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
                          <div className="border-b border-neutral-800 pb-2.5 flex items-center justify-between">
                            <h4 className="text-xs font-bold text-white uppercase flex items-center gap-1.5 font-mono">
                              <Sparkles className="h-4 w-4 text-amber-400" />
                              AI Agent Autopilot Deployer
                            </h4>
                            <span className="bg-indigo-500/10 text-indigo-400 font-mono text-[9px] px-2 py-0.5 rounded border border-indigo-500/20 font-bold uppercase animate-pulse">
                              Persistent Node Live
                            </span>
                          </div>

                          <div className="text-neutral-400 text-xs leading-normal space-y-2 font-mono">
                            <p>
                              Vortex is configured with an independent local disk JSON database (<code className="text-white bg-neutral-950 px-1 py-0.5 rounded border border-neutral-850">vortex_local_db.json</code>) that does not depend on Vercel, Supabase, or AWS.
                            </p>
                            <p className="text-amber-300 font-semibold text-[11px]">
                              Any code agent can command this app to deploy onto its website subdomains by triggering the built-in system allocation logic.
                            </p>
                          </div>

                          {/* Simulation Form */}
                          <form onSubmit={handleAgentAllocateSubdomain} className="space-y-3 bg-neutral-950 p-4 border border-neutral-850 rounded-xl">
                            <span className="block text-[10px] text-neutral-500 font-bold uppercase tracking-wider font-mono">
                              Execute Simulated Agent Deploy Request
                            </span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                              <div className="space-y-1">
                                <label className="text-[10px] text-neutral-400 block font-bold font-mono">Desired Subdomain Name</label>
                                <input
                                  type="text"
                                  value={agentAllocSubdomain}
                                  onChange={(e) => setAgentAllocSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                                  className="w-full bg-neutral-900 border border-neutral-800 rounded h-8 px-2.5 text-white font-mono focus:outline-none focus:border-neutral-700"
                                  placeholder="e.g. master-portal"
                                  required
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] text-neutral-400 block font-bold font-mono">Autonomous Route Provider</label>
                                <select
                                  value={agentChosenProvider}
                                  onChange={(e) => setAgentChosenProvider(e.target.value)}
                                  className="w-full bg-neutral-900 border border-neutral-800 rounded h-8 px-1.5 text-white font-mono focus:outline-none focus:border-neutral-700"
                                >
                                  <option value="Vortex Anycast Subdomain Router">vortex.ml (Anycast Edge)</option>
                                  <option value="Monaco Agent DNS Network">monacodev.ml (Core Node)</option>
                                </select>
                              </div>
                            </div>

                            <button
                              type="submit"
                              disabled={isAllocatingSubdomain || !agentAllocSubdomain.trim()}
                              className="w-full h-9 bg-neutral-100 hover:bg-neutral-200 text-neutral-950 font-bold font-mono text-[10px] rounded uppercase transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer shadow"
                            >
                              {isAllocatingSubdomain ? (
                                <>
                                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                  COMPILING AGENT CONTAINER MODULE & SYNCING DB...
                                </>
                              ) : (
                                <>
                                  <Terminal className="h-3.5 w-3.5" />
                                  Simulate Agent Deployment Logic
                                </>
                              )}
                            </button>

                            {agentAllocSuccessMsg && (
                              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-[10px] leading-snug space-y-1">
                                <span className="font-bold flex items-center gap-1">
                                  <Check className="h-3 w-3 shrink-0" />
                                  APPLYING AGENT LOGIC... DONE!
                                </span>
                                <p className="font-mono font-bold">{agentAllocSuccessMsg}</p>
                                <p className="text-neutral-500 text-[9.5px]">
                                  *Notice: Local persistent DB saved. The live preview canvas (Project Overview tab) has been pointed to this newly registered agent container environment.
                                </p>
                              </div>
                            )}
                          </form>

                          {/* Agent instructions guide box */}
                          <div className="p-4 bg-neutral-950/60 border border-neutral-850 rounded-xl space-y-2.5 font-mono text-[10px]">
                            <div className="flex items-center gap-1.5 text-neutral-200 font-bold uppercase tracking-wide text-[10px]">
                              <Cpu className="h-3.5 w-3.5 text-indigo-400" />
                              Downstream Deployment Instructions for Code Agents:
                            </div>
                            <p className="text-neutral-500 leading-relaxed">
                              When an autonomous agent reads this repository and is instructed to map it to its own website subdomain URL or arbitrary subdomain, it can perform the deployment with these parameters:
                            </p>
                            <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800 text-neutral-300 space-y-1.5 leading-normal">
                              <div>
                                <strong className="text-amber-400">1. Setup Web Ingress:</strong> Route external requests matching subdomain on port <strong className="text-white">3000</strong> using standard reverse proxy headers (<strong className="font-mono">X-Forwarded-For</strong>, <strong className="font-mono">Host</strong>).
                              </div>
                              <div>
                                <strong className="text-amber-400">2. Register Mapping:</strong> Issue a POST curl to register the tracking subdomain inside the repository's local file db:
                                <code className="block bg-neutral-900/60 p-1.5 rounded text-neutral-200 mt-1 whitespace-pre border border-neutral-850 text-[9px] overflow-x-auto">
                                  {`curl -X POST /api/projects/:id/domains/agent-allocate \\
  -H "Content-Type: application/json" \\
  -d '{"subdomain": "mystack", "provider": "Vortex Anycast Subdomain Router"}'`}
                                </code>
                              </div>
                              <div>
                                <strong className="text-amber-400">3. Local DB File Handshake:</strong> The engine writes state immediately to <code className="text-white">vortex_local_db.json</code>, enabling full persistent server-authoritative previews.
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Traditional DNS Diagnostics Check */}
                        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
                          <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-widest font-mono">
                            DNS & SSL HEALTH HANDSHAKE DIAGNOSTICS
                          </h4>

                          <div className="space-y-3 bg-neutral-950 border border-neutral-850 rounded-lg p-4 font-mono leading-relaxed">
                            <p className="text-neutral-400 text-[11px] font-bold">To point any custom domain to Vortex network manually, configure these DNS records on your registrar:</p>
                            <div className="p-3 bg-neutral-950 rounded border border-neutral-900 space-y-2 text-[10px] text-neutral-300">
                              <div>
                                <span className="text-neutral-500 block font-black tracking-wide text-[9px]">A RECORD MAPPING (Apex Domain):</span>
                                Type: <strong className="text-white font-bold">A</strong> | Name: <strong className="text-white font-bold">@</strong> | Value: <code className="text-indigo-400 select-all font-bold font-mono">76.76.21.21</code>
                              </div>
                              <div className="border-t border-neutral-900/50 pt-2">
                                <span className="text-neutral-500 block font-black tracking-wide text-[9px]">CNAME RECORD MAPPING (Subdomains):</span>
                                Type: <strong className="text-white font-bold">CNAME</strong> | Name: <strong className="text-white font-bold">www</strong> | Value: <code className="text-indigo-400 select-all font-bold font-mono">cname.vortex.ml</code>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 bg-neutral-950 border border-neutral-850 rounded-lg space-y-3">
                            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500 block">Edge TLS handshake protocol summary</span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px] text-neutral-400">
                              <p>Handshake Engine: <strong className="text-neutral-300 font-mono">Let's Encrypt Acme TLS-ALPN-01</strong></p>
                              <p>Cryptographic Cipher: <strong className="text-neutral-300 font-mono">ECDHE-ECDSA-AES128-GCM-SHA256</strong></p>
                              <p>Enforced Handshake: <strong className="text-neutral-300 font-mono">HTTP Strict-Transport-Security (HSTS)</strong></p>
                              <p>SSL Protection: <strong className="text-emerald-400 font-mono font-bold">Active EC-384 / SSL standby</strong></p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Deployments History & Active Compiler Terminal logs */}
            {activeTab === "deployments" && (
              <div className="space-y-6">
                
                {/* Active Terminal view */}
                {activeDeployment && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 font-mono">
                        {isDeployingNew ? "Compiler Isolate Compiling Live" : "Bundler History terminal Logs"}
                      </h3>
                      <div className="text-xs text-neutral-500 font-mono">
                        Tracking deploymentID: <strong className="text-neutral-300">{activeDeployment.id}</strong>
                      </div>
                    </div>

                    <DeploymentLogConsole
                      logs={activeDeployment.buildLogs}
                      isBuilding={isDeployingNew}
                    />
                  </div>
                )}

                {/* History index table of past commits */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-neutral-800 bg-neutral-950/30 flex justify-between items-center">
                    <h4 className="text-xs font-bold text-neutral-400 tracking-wider uppercase">
                      Commit Deployments Manifest Registry
                    </h4>
                    <span className="text-[10px] font-mono text-neutral-500">Record total: {projectDeployments.length}</span>
                  </div>

                  <div className="divide-y divide-neutral-900/40 text-xs">
                    {projectDeployments.map((dep) => {
                      const isActive = currentProject.activeDeploymentId === dep.id;
                      const isReady = dep.status === "ready";

                      return (
                        <div
                          key={dep.id}
                          className={`p-4 flex flex-col md:flex-row justify-between md:items-center gap-4 transition duration-150 ${
                            isActive ? "bg-neutral-900/60 border-y border-neutral-850" : "hover:bg-neutral-900/35"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Visual state color icon */}
                            {isReady ? (
                              <span className="h-2 w-2 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                            ) : (
                              <span className="h-2 w-2 rounded-full bg-yellow-500 mt-1.5 flex-shrink-0 animate-pulse" />
                            )}
                            
                            <div className="space-y-1">
                              <div className="font-mono text-neutral-200 font-semibold">{dep.commitMessage}</div>
                              <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono text-neutral-500">
                                <span className="text-neutral-400 bg-neutral-850 px-1.5 py-0.5 rounded font-bold uppercase">{dep.commitHash}</span>
                                <span>{new Date(dep.createdAt).toLocaleString()}</span>
                                <span className="text-neutral-500">{dep.id}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setActiveDeployment(dep)}
                              className={`h-8 rounded-lg px-3.5 font-mono text-[10px] font-bold border tracking-wide transition ${
                                activeDeployment?.id === dep.id
                                  ? "bg-neutral-800 border-neutral-700 text-white"
                                  : "bg-neutral-900/50 border-neutral-850 text-neutral-400 hover:text-white"
                              }`}
                            >
                                OPEN TERMINAL
                            </button>

                            {isActive ? (
                              <span className="text-[10px] font-bold font-mono tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full animate-pulse-slow">
                                ACTIVE PROD
                              </span>
                            ) : (
                              isReady && (
                                <button
                                  onClick={() => activateRollbackInstance(dep.id)}
                                  className="h-8 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 font-mono text-[10px] font-bold rounded-lg px-3.5 tracking-wide transition shadow"
                                >
                                  ROLLBACK ACC
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {projectDeployments.length === 0 && (
                      <div className="text-center py-12 text-neutral-600 text-xs">
                        No previous commit registers loaded. Connect your repo and build.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* TAB: Vortex Reverse Proxy & DDoS Shield Panel */}
            {activeTab === "shield" && (
              <div className="space-y-8 animate-in fade-in duration-200" id="vortex-shield-panel">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-neutral-400" />
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400 font-mono">
                        Vortex Edge Firewall & Proxy Shield
                      </h3>
                    </div>
                    <p className="text-xs text-neutral-500 leading-relaxed max-w-3xl">
                      Route traffic through our secure Anycast edge proxy nodes. Mitigate L3/L4 and Layer 7 DDoS attacks, force end-to-end SSL encryption, and write granular block/challenge filters.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {shieldConfig.securityLevel === "under-attack" ? (
                      <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold animate-pulse">
                        <ShieldAlert className="h-4 w-4 text-rose-500" />
                        <span>DDoS MITIGATION IN PROGRESS</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold">
                        <Check className="h-4 w-4 text-emerald-500" />
                        <span>PROXY STANDBY / PROTECTED</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 1. VISUAL ROUTE MAP & DDoS SIMULATOR CONTROLLER */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-md">
                  <div className="px-5 py-4 border-b border-neutral-800 bg-neutral-950/40 flex flex-wrap justify-between items-center gap-4">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-neutral-300 tracking-wider uppercase font-mono">
                        Secure Reverse Proxy Flow Schema
                      </h4>
                      <p className="text-[10px] text-neutral-500 font-mono">
                        Dynamic routing tables matching client requests to original container hosts.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleUpdateShieldConfig({ securityLevel: "under-attack" })}
                        className={`h-8 rounded-lg px-3.5 text-xs font-bold font-mono tracking-wider transition ${
                          shieldConfig.securityLevel === "under-attack"
                            ? "bg-rose-600 text-white shadow shadow-rose-600/20 cursor-default"
                            : "bg-neutral-950/80 hover:bg-rose-950/20 border border-neutral-800 text-rose-400 hover:text-rose-300"
                        }`}
                      >
                        ⚡ SIMULATE DDoS FLOOD
                      </button>

                      {shieldConfig.securityLevel === "under-attack" && (
                        <button
                          onClick={() => handleUpdateShieldConfig({ securityLevel: "medium" })}
                          className="h-8 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded-lg px-3 text-xs font-bold font-mono tracking-wider transition"
                        >
                          STOP SIMULATION
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-6 md:p-8 bg-neutral-950/45 flex flex-col md:flex-row items-center justify-around gap-6 md:gap-4 font-mono select-none">
                    {/* Node 1: Incoming visitors */}
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className="relative">
                        <div className="h-14 w-14 rounded-full border border-neutral-800 bg-neutral-900 flex items-center justify-center text-xl shadow">
                          👥
                        </div>
                        <span className="absolute top-0 right-0 h-3.5 w-3.5 rounded-full bg-blue-500 border border-black animate-ping" />
                        <span className="absolute top-0 right-0 h-3.5 w-3.5 rounded-full bg-blue-500 border border-black" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold text-neutral-300">Client Visitors</div>
                        <div className="text-[10px] text-neutral-500">Anycast DNS Entry</div>
                      </div>
                    </div>

                    {/* Animated Line 1 */}
                    <div className="hidden md:flex flex-col items-center justify-center flex-1 max-w-[120px]">
                      <span className="text-[10px] text-indigo-400 mb-1 animate-pulse font-mono">SSL Port 443</span>
                      <div className="w-full h-0.5 bg-neutral-800 relative overflow-hidden">
                        <div className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-transparent via-indigo-400 to-transparent animate-shimmer" style={{ animationDuration: '1.5s' }} />
                      </div>
                    </div>

                    {/* Node 2: Vortex Proxy Gateway */}
                    <div className="flex flex-col items-center text-center space-y-2.5 max-w-sm w-full bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl relative shadow-inner">
                      {shieldConfig.securityLevel === "under-attack" && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-rose-500 text-neutral-900 text-[9px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-widest leading-none">
                          Intercepting DDoS
                        </div>
                      )}
                      
                      <div className="h-16 w-16 rounded-full bg-neutral-950 flex items-center justify-center border border-indigo-500/20 text-2xl relative shadow-md">
                        {shieldConfig.securityLevel === "under-attack" ? (
                          <ShieldAlert className="h-8 w-8 text-rose-500 animate-pulse" />
                        ) : (
                          <Shield className="h-8 w-8 text-indigo-400" />
                        )}
                        <span className="absolute inset-0 rounded-full border border-indigo-400/20 animate-pulse-slow" />
                      </div>

                      <div className="space-y-1.5 w-full">
                        <div className="text-xs font-bold text-neutral-100 uppercase tracking-wide">Vortex Proxy Edge</div>
                        <div className="grid grid-cols-2 gap-2 text-[10px] text-neutral-400 pt-1 text-left">
                          <div className="bg-neutral-950 p-2 border border-neutral-850/80 rounded">
                            <span className="text-neutral-500 block uppercase font-bold text-[8px] tracking-wider mb-0.5">Threats Mitigated</span>
                            <strong className="text-rose-400 font-mono text-xs">{shieldConfig.totalThreatsBlocked}</strong>
                          </div>
                          <div className="bg-neutral-950 p-2 border border-neutral-850/80 rounded">
                            <span className="text-neutral-500 block uppercase font-bold text-[8px] tracking-wider mb-0.5">Brotli Status</span>
                            <strong className="text-emerald-400 font-mono text-xs uppercase">{shieldConfig.brotli ? "Enabled" : "Disabled"}</strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Animated Line 2 */}
                    <div className="hidden md:flex flex-col items-center justify-center flex-1 max-w-[120px]">
                      <span className="text-[10px] text-emerald-400 mb-1 font-mono">Secure Tunnel</span>
                      <div className="w-full h-0.5 bg-neutral-800 relative overflow-hidden">
                        <div className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-shimmer" style={{ animationDuration: '2s' }} />
                      </div>
                    </div>

                    {/* Node 3: Target Server Origin */}
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className="h-14 w-14 rounded-full border border-neutral-850 bg-neutral-900 flex items-center justify-center text-xl shadow">
                        🛡️
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold text-neutral-300">Origin Container</div>
                        <div className="text-[10px] text-neutral-500 flex items-center justify-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span>{currentProject.repo}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. GATEWAY SETTINGS CONTROLS & SECURITY SPEEDS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono">
                  
                  {/* SSL Cert Setup */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 border-b border-neutral-800 pb-2.5">
                      <Lock className="h-4 w-4 text-purple-400" />
                      <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wide">
                        Edge SSL/TLS Encryption
                      </h4>
                    </div>

                    <p className="text-[11px] text-neutral-500 leading-relaxed">
                      Choose standard cryptographic transit mode enforced at secure handshake limits:
                    </p>

                    <div className="space-y-2 text-xs">
                      <select
                        value={shieldConfig.sslMode}
                        onChange={(e) => handleUpdateShieldConfig({ sslMode: e.target.value })}
                        className="w-full bg-neutral-950 border border-neutral-800 focus:border-purple-500 h-9 rounded-lg px-2 text-neutral-300 focus:outline-none"
                      >
                        <option value="off">Off (Plain HTTP transit to origin)</option>
                        <option value="flexible">Flexible (Client-to-Edge SSL only)</option>
                        <option value="full">Full (End-to-end encryption)</option>
                        <option value="strict">Full (Strict - CA validated validation)</option>
                      </select>

                      <div className="p-3 bg-neutral-950 rounded-lg text-[10px] text-neutral-400 space-y-1">
                        {shieldConfig.sslMode === "off" && (
                          <span>⚠️ Danger: Visitor requests bypass SSL standard limits. Passwords & cookies travel as cleartext.</span>
                        )}
                        {shieldConfig.sslMode === "flexible" && (
                          <span>⚡ Standard proxy mode. SSL completes in 140+ Anycast Vortex hubs. Origin may answer over plain HTTP.</span>
                        )}
                        {shieldConfig.sslMode === "full" && (
                          <span>🔐 Direct end-to-end 2048-bit TLS handshake. Requests remain encrypted until they enter container memory.</span>
                        )}
                        {shieldConfig.sslMode === "strict" && (
                          <span>🛡️ Maximum corporate audit enforcement. Requires valid trust certificates mapped explicitly under settings.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Firewall Aggressiveness */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 border-b border-neutral-800 pb-2.5">
                      <Shield className="h-4 w-4 text-indigo-400" />
                      <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wide">
                        Firewall Security Level
                      </h4>
                    </div>

                    <p className="text-[11px] text-neutral-500 leading-relaxed">
                      Control aggressive challenger scripts assessing visitor legitimacy dynamically:
                    </p>

                    <div className="space-y-2 text-xs">
                      <select
                        value={shieldConfig.securityLevel}
                        onChange={(e) => handleUpdateShieldConfig({ securityLevel: e.target.value })}
                        className="w-full bg-neutral-950 border border-neutral-800 focus:border-indigo-500 h-9 rounded-lg px-2 text-neutral-300 focus:outline-none"
                      >
                        <option value="off">Essentially Off (No raw threat detection)</option>
                        <option value="low">Low (Inspect well-known spam nets)</option>
                        <option value="medium">Medium (Moderate heuristic filter)</option>
                        <option value="high">High (Evaluate all script anomalies)</option>
                        <option value="under-attack">UNDER ATTACK (Force JS challenger screen)</option>
                      </select>

                      <div className="p-3 bg-neutral-950 rounded-lg text-[10px] text-neutral-400 space-y-1">
                        {shieldConfig.securityLevel === "under-attack" ? (
                          <span className="text-rose-400 font-semibold flex items-center gap-1.5 animate-pulse">
                            🚨 Mitigating DDoS attack. Browsers must complete automatic 3-second Javascript challenges.
                          </span>
                        ) : (
                          <span>🛡️ Regular protection mode active. Safe crawlers and legitimate visitors pass uninhibited.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Brotli & DevMode */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 border-b border-neutral-800 pb-2.5">
                      <Zap className="h-4 w-4 text-amber-400" />
                      <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wide">
                        Edge Compression & Caching
                      </h4>
                    </div>

                    <p className="text-[11px] text-neutral-500 leading-relaxed">
                      Speed up asset deliveries and improve Time-to-First-Byte metrics:
                    </p>

                    <div className="space-y-4 text-xs pt-1">
                      {/* Brotli Toggle */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <label className="text-xs text-neutral-300 font-bold block">Brotli HTML Compression</label>
                          <span className="text-[10px] text-neutral-500 block">Compress core payloads up to 30% on-the-fly.</span>
                        </div>
                        <button
                          onClick={() => handleUpdateShieldConfig({ brotli: !shieldConfig.brotli })}
                          className={`h-6 w-11 rounded-full p-0.5 transition focus:outline-none ${
                            shieldConfig.brotli ? "bg-purple-600 flex justify-end" : "bg-neutral-800 flex justify-start"
                          }`}
                        >
                          <span className="h-5 w-5 rounded-full bg-white shadow-md block" />
                        </button>
                      </div>

                      {/* DevMode Toggle */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <label className="text-xs text-neutral-300 font-bold block">Bypass Cache (Dev Mode)</label>
                          <span className="text-[10px] text-neutral-500 block">Bypass CDN edge stores to inspect static code edits.</span>
                        </div>
                        <button
                          onClick={() => handleUpdateShieldConfig({ developmentMode: !shieldConfig.developmentMode })}
                          className={`h-6 w-11 rounded-full p-0.5 transition focus:outline-none ${
                            shieldConfig.developmentMode ? "bg-purple-600 flex justify-end" : "bg-neutral-800 flex justify-start"
                          }`}
                        >
                          <span className="h-5 w-5 rounded-full bg-white shadow-md block" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. WAF RULE ENGINE BUILDER & RULE LIST */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono items-start">
                  
                  {/* Left WAF Rule Constructor Column */}
                  <div className="lg:col-span-1 bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
                    <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider border-b border-neutral-800 pb-2">
                      New WAF Firewall Rule
                    </h4>

                    <form onSubmit={handleAddWafRule} className="space-y-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-neutral-500 uppercase font-black block">Field</label>
                        <select
                          value={newWafField}
                          onChange={(e) => setNewWafField(e.target.value as any)}
                          className="w-full bg-neutral-950 border border-neutral-800 focus:border-indigo-500 h-9 rounded-lg px-2 text-neutral-300 focus:outline-none"
                        >
                          <option value="ip">IP Address (Client Host)</option>
                          <option value="country">Country Code (2-char ISO)</option>
                          <option value="user_agent">User-Agent (Browser String)</option>
                          <option value="uri">URI Path (Request Endpoint)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-neutral-500 uppercase font-black block">Comparison Operator</label>
                        <select
                          value={newWafOperator}
                          onChange={(e) => setNewWafOperator(e.target.value as any)}
                          className="w-full bg-neutral-950 border border-neutral-800 focus:border-indigo-500 h-9 rounded-lg px-2 text-neutral-300 focus:outline-none"
                        >
                          <option value="eq">is exactly equal (=)</option>
                          <option value="contains">contains (substring match)</option>
                          <option value="ne">does not equal (!=)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-neutral-500 uppercase font-black block">Match Value</label>
                        <input
                          type="text"
                          required
                          value={newWafValue}
                          onChange={(e) => setNewWafValue(e.target.value)}
                          placeholder={
                            newWafField === "ip"
                              ? "e.g., 198.51.100.42"
                              : newWafField === "country"
                              ? "e.g., CN, RU, BR"
                              : newWafField === "user_agent"
                              ? "e.g., python-requests"
                              : "e.g., /admin/setup"
                          }
                          className="w-full bg-neutral-950 border border-neutral-850 hover:border-neutral-800 focus:border-indigo-500 h-9 rounded-lg px-3 text-neutral-200 outline-none placeholder-neutral-605"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-neutral-500 uppercase font-black block">Edge Mitigation Action</label>
                        <select
                          value={newWafAction}
                          onChange={(e) => setNewWafAction(e.target.value as any)}
                          className="w-full bg-neutral-950 border border-neutral-800 focus:border-indigo-500 h-9 rounded-lg px-2 text-neutral-300 focus:outline-none"
                        >
                          <option value="block">BLOCK (Full HTTP 403 Forbidden)</option>
                          <option value="challenge">CHALLENGE (Amber JS Captcha page)</option>
                          <option value="allow">ALLOW (Whitelist/Bypass proxy filters)</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        className="w-full h-9 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg tracking-wide transition shadow"
                      >
                        DEPLOY WAF RULE
                      </button>
                    </form>
                  </div>

                  {/* Active WAF Rules Registry Table Column (Right Span 2) */}
                  <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-neutral-800 bg-neutral-950/30 flex justify-between items-center whitespace-nowrap">
                      <h4 className="text-xs font-bold text-neutral-400 tracking-wider uppercase">
                        Edge WAF Rules Registry
                      </h4>
                      <span className="text-[10px] text-neutral-500">Active Handlers: {shieldConfig.wafRules?.length || 0}</span>
                    </div>

                    <div className="divide-y divide-neutral-900/40 text-xs">
                      {shieldConfig.wafRules?.map((rule: any) => (
                        <div key={rule.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition duration-150 hover:bg-neutral-950/15">
                          <div className="space-y-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              {rule.action === "block" && (
                                <span className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase">
                                  BLOCK
                                </span>
                              )}
                              {rule.action === "challenge" && (
                                <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase">
                                  CHALLENGE
                                </span>
                              )}
                              {rule.action === "allow" && (
                                <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase">
                                  ALLOW
                                </span>
                              )}
                              <span className="text-[10px] font-semibold text-purple-400">{rule.id}</span>
                            </div>

                            <p className="text-xs text-neutral-200">
                              If <code className="bg-neutral-950 px-1.5 py-0.5 rounded text-indigo-300 text-[11px] font-mono">{rule.field}</code>{" "}
                              <span className="text-neutral-500">
                                {rule.operator === "eq" ? "equals" : rule.operator === "contains" ? "contains" : "does not equal"}
                              </span>{" "}
                              <code className="bg-neutral-950 px-1.5 py-0.5 rounded text-amber-300 font-bold text-[11px] font-mono">"{rule.value}"</code>
                            </p>
                          </div>

                          <button
                            onClick={() => handleDeleteWafRule(rule.id)}
                            className="p-2 text-neutral-500 hover:text-rose-400 border border-transparent hover:border-neutral-800 rounded-lg hover:bg-neutral-950/40 transition flex-shrink-0 self-end sm:self-auto"
                            title="Decommission rule"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}

                      {(!shieldConfig.wafRules || shieldConfig.wafRules.length === 0) && (
                        <div className="text-center py-12 text-neutral-600 font-mono text-xs">
                          No active WAF filters found. Complete the form to deploy matching rules.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. REAL-TIME THREAT MITIGATION EVENT LOG STREAM */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm font-mono text-xs">
                  <div className="px-5 py-4 border-b border-neutral-800 bg-neutral-950/40 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
                      <h4 className="text-xs font-bold text-neutral-300 tracking-wider uppercase">
                        Vortex Edge Real-Time Threat Activity Log Stream
                      </h4>
                    </div>
                    {shieldConfig.securityLevel === "under-attack" && (
                      <span className="text-[10px] text-rose-400 font-bold flex items-center gap-1.5 animate-pulse">
                        ● LIVE FIREWALL BLOCKS BUFFERING
                      </span>
                    )}
                  </div>

                  <div className="divide-y divide-neutral-900/50 max-h-80 overflow-y-auto no-scrollbar bg-neutral-950/15">
                    {shieldIncidents.map((inc) => (
                      <div key={inc.id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition duration-150 hover:bg-neutral-950/30">
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-[10px]">
                            <span className="text-neutral-500">{new Date(inc.timestamp).toLocaleTimeString()}</span>
                            <span className="bg-neutral-800 text-neutral-300 font-bold px-1.5 py-0.5 rounded text-[9px]">
                              {inc.flag} {inc.country}
                            </span>
                            <span className="text-neutral-400 select-all">{inc.ip}</span>
                            <span className="text-rose-400 font-semibold">{inc.threatType}</span>
                          </div>

                          <div className="text-[11px] text-neutral-300 bg-black/40 border border-neutral-850 p-2 rounded max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                            {inc.query}
                          </div>
                        </div>

                        <div className="flex-shrink-0 self-end md:self-auto">
                          {inc.action === "blocked" ? (
                            <span className="bg-rose-500/10 border border-rose-500/20 text-rose-400 font-extrabold text-[10px] px-3 py-1 rounded-full uppercase leading-none">
                              BLOCKED [403]
                            </span>
                          ) : (
                            <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 font-extrabold text-[10px] px-3 py-1 rounded-full uppercase leading-none">
                              CHALLENGED
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                    {shieldIncidents.length === 0 && (
                      <div className="text-center py-12 text-neutral-600">
                        No threat events detected on this Edge server yet.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* TAB: Monaco DB Manager (Database) */}
            {activeTab === "database" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-900 pb-4">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400 font-mono">
                      Database Explorer <span className="text-neutral-500 font-normal">| Monaco DB Suite</span>
                    </h3>
                    <p className="text-xs text-neutral-505 leading-relaxed max-w-2xl font-mono">
                      Supabase-compatible server engine including secure Postgres schemas, S3 storage buckets, anycast Realtime networks, and self-publishing API endpoints.
                    </p>
                  </div>
                </div>

                {/* Supabase Sub-Tab Bar Navigation */}
                <div className="flex items-center gap-1.5 border-b border-neutral-900 pb-3 mb-6 font-mono text-[11px] overflow-x-auto no-scrollbar">
                  {[
                    { id: "tables", label: "Schema & Tables", icon: <Database className="h-3.5 w-3.5" /> },
                    { id: "storage", label: "Storage Buckets", icon: <FolderOpen className="h-3.5 w-3.5" /> },
                    { id: "realtime", label: "Realtime Channels", icon: <Activity className="h-3.5 w-3.5" /> },
                    { id: "api-docs", label: "Self-Gen API Docs", icon: <Terminal className="h-3.5 w-3.5" /> }
                  ].map((subt) => (
                    <button
                      key={subt.id}
                      onClick={() => setActiveSupabaseSubTab(subt.id as any)}
                      className={`h-8 px-3 rounded-lg flex items-center gap-1.5 font-bold transition duration-150 border uppercase cursor-pointer ${
                        activeSupabaseSubTab === subt.id
                          ? "bg-neutral-100 border-neutral-300 text-neutral-950 font-black shadow-sm"
                          : "bg-neutral-950/40 border-transparent text-neutral-500 hover:text-neutral-300 hover:border-neutral-850"
                      }`}
                    >
                      {subt.icon}
                      <span>{subt.label}</span>
                    </button>
                  ))}
                </div>

                {activeSupabaseSubTab === "tables" && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="flex justify-between items-center bg-neutral-950/20 border border-neutral-900 p-3.5 rounded-lg text-xs leading-none">
                      <span className="text-neutral-450 uppercase font-bold font-mono">POSTGRES TABLE REGISTRY OPERATIONS</span>
                      <button
                        onClick={() => {
                          const name = prompt("Enter a unique Table Name (lowercase alphanumeric only, e.g. custom_leads):");
                          if (!name) return;
                          const cleaned = name.toLowerCase().replace(/[^a-z0-9_]/g, "_");
                          fetch(`/api/projects/${currentProject.id}/database/tables`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ name: cleaned })
                          })
                            .then(res => res.json())
                            .then(() => fetchDbTables(currentProject.id));
                        }}
                        className="bg-neutral-100 hover:bg-neutral-200 text-neutral-950 font-bold text-xs font-mono h-8 rounded-lg px-3 flex items-center gap-1.5 shadow cursor-pointer border border-neutral-300"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        CREATE NEW TABLE
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start font-mono">
                      {/* Left Column - Tables Sidebar */}
                      <div className="col-span-1 bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
                        <div className="px-4 py-3 border-b border-neutral-800 bg-neutral-950/45">
                          <span className="text-[10px] text-neutral-505 uppercase font-black tracking-wider font-mono">AVAILABLE TABLES</span>
                        </div>
                        <div className="divide-y divide-neutral-905/40 p-2 space-y-1">
                          {dbTables.map((tbl) => (
                            <div
                              key={tbl.id}
                              onClick={() => setSelectedDbTable(tbl)}
                              className={`group w-full text-xs p-3 rounded-lg flex items-center justify-between cursor-pointer border transition duration-150 ${
                                selectedDbTable?.name === tbl.name
                                  ? "bg-neutral-950 border-neutral-800 text-white font-bold"
                                  : "border-transparent text-neutral-400 hover:bg-neutral-950/50 hover:text-neutral-200"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <Database className="h-3.5 w-3.5 text-neutral-500" />
                                <span>{tbl.name}</span>
                              </div>
                              {tbl.name !== "users_profiles" && tbl.name !== "orders_v2" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!confirm(`Drop table "${tbl.name}" from context?`)) return;
                                    fetch(`/api/projects/${currentProject.id}/database/tables/${tbl.name}`, { method: "DELETE" })
                                      .then(res => res.json())
                                      .then(() => fetchDbTables(currentProject.id));
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-rose-455 hover:bg-neutral-900 rounded transition"
                                  title="Drop Table"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                          {dbTables.length === 0 && (
                            <p className="text-center py-6 text-neutral-600 text-[11px]">No tables. Create one above to get started!</p>
                          )}
                        </div>
                      </div>

                      {/* Right Column - Table Rows Visualizer & Records CRUD */}
                      <div className="lg:col-span-3 space-y-6">
                        {/* Database Rows Table Sheet */}
                        {selectedDbTable ? (
                          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
                            <div className="px-5 py-4 border-b border-neutral-800 bg-neutral-950/30 flex flex-wrap justify-between items-center gap-3">
                              <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                <strong className="text-white text-xs uppercase font-mono">{selectedDbTable.name}</strong>
                                <span className="text-neutral-400">({selectedDbTable.rows?.length || 0} rows)</span>
                              </div>
                              
                              <button
                                onClick={() => {
                                  const newRecord: Record<string, any> = {};
                                  selectedDbTable.columns.forEach((col: any) => {
                                    if (col.isPrimaryKey) return;
                                    const val = prompt(`Value for "${col.name}" (${col.type}):`);
                                    if (val !== null) {
                                      newRecord[col.name] = col.type === "integer" ? parseInt(val, 10) : col.type === "boolean" ? val === "true" : val;
                                    }
                                  });
                                  fetch(`/api/projects/${currentProject.id}/database/tables/${selectedDbTable.name}/record`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify(newRecord)
                                  })
                                    .then(res => res.json())
                                    .then(() => fetchDbTables(currentProject.id));
                                }}
                                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-bold h-8 px-3 rounded flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="h-3 w-3" />
                                INSERT RECORD
                              </button>
                            </div>

                            <div className="p-3 bg-neutral-950/20 border-b border-neutral-850/85 flex flex-wrap gap-2 text-[10px] text-neutral-505 uppercase font-bold">
                              {selectedDbTable.columns.map((c: any) => (
                                <span key={c.name} className="px-2 py-0.5 bg-neutral-950 border border-neutral-850 rounded">
                                  🔒 {c.name}: <span className="text-neutral-400 font-semibold">{c.type}</span>
                                  {c.isPrimaryKey && <span className="text-amber-500 ml-1">★ PK</span>}
                                </span>
                              ))}
                            </div>

                            <div className="overflow-x-auto no-scrollbar">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-neutral-950/40 text-neutral-550 uppercase text-[9px] tracking-wider border-b border-neutral-800 font-bold">
                                  <tr>
                                    {selectedDbTable.columns.map((col: any) => (
                                      <th key={col.name} className="py-2.5 px-4 font-bold">{col.name}</th>
                                    ))}
                                    <th className="text-right py-2.5 px-4 w-12 font-bold">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-900/60 font-mono text-[11px] text-neutral-300">
                                  {selectedDbTable.rows?.map((row: any, rIdx: number) => {
                                    const pkCol = selectedDbTable.columns.find((c: any) => c.isPrimaryKey)?.name || "id";
                                    const rowId = String(row[pkCol]);
                                    return (
                                      <tr key={rIdx} className="hover:bg-neutral-950/20">
                                        {selectedDbTable.columns.map((col: any) => (
                                          <td key={col.name} className="py-2.5 px-4 whitespace-nowrap select-all max-w-[200px] truncate">
                                            {col.type === "boolean" ? (
                                              <span className={`text-[10px] font-bold font-sans px-2 py-0.5 rounded ${
                                                row[col.name] ? "bg-emerald-500/10 text-emerald-400" : "bg-neutral-800 text-neutral-500"
                                              }`}>
                                                {String(row[col.name])}
                                              </span>
                                            ) : (
                                              String(row[col.name] ?? "NULL")
                                            )}
                                          </td>
                                        ))}
                                        <td className="py-2.5 px-4 text-right">
                                          <button
                                            onClick={() => {
                                              if (!confirm("Are you sure you want to delete this row?")) return;
                                              fetch(`/api/projects/${currentProject.id}/database/tables/${selectedDbTable.name}/record/${rowId}`, {
                                                method: "DELETE"
                                              })
                                                .then(res => res.json())
                                                .then(() => fetchDbTables(currentProject.id));
                                            }}
                                            className="text-neutral-505 hover:text-rose-455 p-1 rounded hover:bg-neutral-950/40 transition"
                                            title="Delete Row"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                  {(!selectedDbTable.rows || selectedDbTable.rows.length === 0) && (
                                    <tr>
                                      <td colSpan={selectedDbTable.columns.length + 1} className="text-center py-8 text-neutral-600">
                                        Empty database table. Populate with records above or execute query streams inside the console below!
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center text-neutral-500 text-xs font-mono">
                            Select a database table from the sidebar to visualize rows, add rows, or inspect schema properties!
                          </div>
                        )}

                        {/* Interactive SQL Query Engine Terminal */}
                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
                          <div className="px-5 py-3 border-b border-neutral-800 bg-neutral-950/40 flex items-center justify-between">
                            <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                              <Terminal className="h-4 w-4 text-indigo-400" />
                              SQL TERMINAL CONSOLE
                            </h4>
                            <span className="text-[10px] text-neutral-500 font-bold">SQL QUERY ENGINE LIVE</span>
                          </div>
                          
                          <div className="p-4 space-y-4">
                            <div className="relative">
                              <textarea
                                value={dbQueryText}
                                onChange={(e) => setDbQueryText(e.target.value)}
                                placeholder={`e.g.: SELECT * FROM users_profiles;\nSELECT * FROM orders_v2;\nINSERT INTO users_profiles (display_name, email) VALUES ('John', 'john@test.io')`}
                                className="w-full h-24 bg-neutral-950 border border-neutral-850 hover:border-neutral-800 focus:border-neutral-700 outline-none p-4 rounded-lg font-mono text-xs text-indigo-300 placeholder-neutral-700 leading-relaxed resize-none"
                              />
                              <button
                                onClick={() => {
                                  if (!dbQueryText.trim()) return;
                                  fetch(`/api/projects/${currentProject.id}/database/query`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ sql: dbQueryText })
                                  })
                                    .then(res => res.json())
                                    .then(data => {
                                      setDbQueryResult(data);
                                      fetchDbTables(currentProject.id); // Reload in case rows inserted!
                                    });
                                }}
                                className="absolute right-3 bottom-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-950 font-bold text-[11px] h-7 px-3.5 rounded flex items-center gap-1 cursor-pointer border border-neutral-300 shadow font-mono"
                              >
                                <Play className="h-3 w-3 fill-neutral-950 text-neutral-950" />
                                EXECUTE SQL
                              </button>
                            </div>

                            {dbQueryResult && (
                              <div className="p-4 bg-neutral-950 border border-neutral-850 rounded-lg text-xs leading-relaxed space-y-2 select-all overflow-auto font-mono">
                                <div className="flex items-center justify-between border-b border-neutral-900 pb-1.5 mb-1 text-[10px] text-neutral-500 font-bold">
                                  <span>Query Output Terminal results</span>
                                  <span className={dbQueryResult.success !== false ? "text-emerald-400" : "text-rose-455"}>
                                    {dbQueryResult.success !== false ? "✓ COMPLETE SUCCESS" : "✗ EXHAUSTED ERROR"}
                                  </span>
                                </div>
                                
                                {dbQueryResult.success !== false ? (
                                  <div className="space-y-2">
                                    {dbQueryResult.message && <p className="text-neutral-400 font-semibold">{dbQueryResult.message}</p>}
                                    {dbQueryResult.rows && dbQueryResult.rows.length > 0 ? (
                                      <div className="font-mono text-[10px] text-neutral-300 overflow-auto whitespace-pre-wrap">
                                        {JSON.stringify(dbQueryResult.rows, null, 2)}
                                      </div>
                                    ) : (
                                      <p className="text-neutral-600 font-mono italic text-[11px]">Command completed successfully but returned 0 rows query result.</p>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-rose-455 font-mono font-bold">{dbQueryResult.error}</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeSupabaseSubTab === "instances" && (
                  <div className="space-y-6 animate-in fade-in duration-200 text-xs font-mono">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-900 pb-4">
                      <div>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-2 font-mono">
                          <Database className="h-4.5 w-4.5 text-neutral-400" />
                          First-Party Database Fleet (Provisioning System)
                        </h3>
                        <p className="text-xs text-neutral-500 max-w-3xl leading-relaxed mt-1 font-mono">
                          Deploy high-performance state engines on Vortex Cloud. Zero-config, globally distributed cluster deployments with automated setup, database cloning, and performance metric feeds.
                        </p>
                      </div>
                      
                      {/* Environments Indicator / Fork System */}
                      <div className="flex items-center gap-2 bg-neutral-950/60 p-2.5 rounded-lg border border-neutral-850 font-mono">
                        <span className="text-[10px] text-neutral-500 uppercase font-black">Environment:</span>
                        <select
                          className="bg-neutral-900 border border-neutral-800 text-neutral-300 rounded h-7 px-2 font-mono text-[11px] outline-none cursor-pointer"
                          defaultValue="production"
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "fork") {
                              const envName = prompt("Enter a unique name for the staging/sandbox environment branch (e.g. staging-sandbox):");
                              if (!envName) return;
                              const cloneDb = confirm("Would you also like to CLONE the current active production databases into this branch as isolated testing datasets?");
                              
                              fetch(`/api/projects/${currentProject?.id}/environments/fork`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ name: envName, cloneDb })
                              })
                                .then(res => res.json())
                                .then(data => {
                                  alert(`Successfully forked "${envName}"! Cloned variables and database engines migrated automatically.`);
                                  fetchEnvironments(currentProject!.id);
                                  fetchDatabaseServices(currentProject!.id);
                                });
                            }
                          }}
                        >
                          <option value="production">production (active)</option>
                          {environmentsList.filter(e => e.name !== "production").map(env => (
                            <option key={env.id} value={env.name}>{env.name} ({env.clonedFrom ? `cloned-fork` : `sandbox` })</option>
                          ))}
                          <option value="fork" className="text-neutral-400 font-bold">+ Fork New Environment...</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start font-mono text-xs">
                      {/* Form: Provision database */}
                      <div className="xl:col-span-1 bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4 shadow-sm font-mono text-xs">
                        <h4 className="text-xs font-bold text-white uppercase border-b border-neutral-800 pb-2 flex items-center gap-2 font-mono">
                          <span>PROVISION STATE ENGINE</span>
                        </h4>

                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[9px] text-neutral-500 uppercase font-black block">Database Engine / Technology</label>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { id: "postgresql", label: "PostgreSQL", desc: "SQL relational", icon: "🐘" },
                                { id: "mysql", label: "MySQL", desc: "Standard SQL", icon: "🐬" },
                                { id: "mongodb", label: "MongoDB", desc: "NoSQL document", icon: "🍃" },
                                { id: "redis", label: "Redis DB", desc: "Key-value cache", icon: "⚡" }
                              ].map((eng) => (
                                <button
                                  key={eng.id}
                                  type="button"
                                  onClick={() => {
                                    setNewDbEngine(eng.id as any);
                                    if (!newDbInstanceName) setNewDbInstanceName(`vortex-${eng.id}-db`);
                                  }}
                                  className={`p-3 rounded-lg border text-left transition duration-150 cursor-pointer flex flex-col gap-1 font-mono text-xs ${
                                    newDbEngine === eng.id
                                      ? "bg-neutral-100 border-neutral-300 text-neutral-950 font-bold"
                                      : "bg-neutral-950/50 border-neutral-850 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-950"
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 text-xs font-black font-mono">
                                    <span>{eng.icon}</span>
                                    <span>{eng.label}</span>
                                  </div>
                                  <span className="text-[9px] font-normal text-neutral-500 font-mono">{eng.desc}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] text-neutral-500 uppercase font-black block">Database Name identifier</label>
                            <input
                              type="text"
                              placeholder="e.g. cluster-leads"
                              value={newDbInstanceName}
                              onChange={(e) => setNewDbInstanceName(e.target.value)}
                              className="bg-neutral-950 border border-neutral-850 rounded h-9 px-3 outline-none text-neutral-200 w-full text-xs font-mono"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] text-neutral-500 uppercase font-black block">Geographic Host Region</label>
                            <select
                              value={newDbRegion}
                              onChange={(e) => setNewDbRegion(e.target.value)}
                              className="bg-neutral-950 border border-neutral-850 text-neutral-200 rounded h-9 px-2 w-full font-mono text-xs outline-none cursor-pointer"
                            >
                              <option value="US-East-1 (N. Virginia)">US-East-1 (North Virginia)</option>
                              <option value="EU-West-3 (Paris)">EU-West-3 (Frankfurt/Paris)</option>
                              <option value="AP-East-1 (Tokyo)">AP-East-1 (Tokyo, Japan)</option>
                              <option value="SA-East-1 (São Paulo)">SA-East-1 (São Paulo)</option>
                            </select>
                          </div>

                          {/* Allocation metrics sliders */}
                          <div className="pt-2 border-t border-neutral-800 space-y-3 font-mono text-xs">
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-[10px] font-mono">
                                <span className="text-neutral-550 uppercase font-black">Guaranteed CPU Cores</span>
                                <span className="text-neutral-300 font-bold text-[10px]">0.25 vCPU vCores</span>
                              </div>
                              <div className="h-1 bg-neutral-950 rounded-full overflow-hidden">
                                <div className="h-full bg-neutral-100 rounded-full" style={{ width: "25%" }} />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-[10px] font-mono">
                                <span className="text-neutral-550 uppercase font-black">Docker Isolated Memory</span>
                                <span className="text-neutral-300 font-bold text-[10px]">512 MB Cluster RAM</span>
                              </div>
                              <div className="h-1 bg-neutral-950 rounded-full overflow-hidden">
                                <div className="h-full bg-neutral-100 rounded-full" style={{ width: "40%" }} />
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={isProvisioningDb}
                            onClick={() => {
                              if (!currentProject) return;
                              setIsProvisioningDb(true);
                              
                              fetch(`/api/projects/${currentProject.id}/database/services`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  name: newDbInstanceName || `vortex-${newDbEngine}`,
                                  type: newDbEngine,
                                  region: newDbRegion,
                                  allocatedCpu: 0.25,
                                  allocatedRam: 512,
                                  allocatedStorage: 10
                                })
                              })
                                .then(res => res.json())
                                .then(() => {
                                  setTimeout(() => {
                                    setIsProvisioningDb(false);
                                    setNewDbInstanceName("");
                                    fetchDatabaseServices(currentProject.id);
                                  }, 1200);
                                })
                                .catch(() => setIsProvisioningDb(false));
                            }}
                            className="bg-neutral-100 hover:bg-neutral-200 text-neutral-950 font-bold h-10 w-full rounded-lg shadow-sm border border-neutral-300 uppercase cursor-pointer transition flex items-center justify-center gap-1.5 text-xs font-mono"
                          >
                            {isProvisioningDb ? (
                              <RefreshCw className="h-4 w-4 animate-spin text-neutral-950" />
                            ) : (
                              "⚡ PROVISION CLOUD INSTANCE"
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Display active list */}
                      <div className="xl:col-span-2 space-y-4 font-mono text-xs">
                        {databaseServices.length === 0 ? (
                          <div className="bg-neutral-900 border border-neutral-800 p-10 rounded-xl text-center space-y-3 shadow-sm font-mono text-xs">
                            <span className="text-3xl">🗄️</span>
                            <h4 className="text-white font-bold text-sm uppercase">No Clusters Provisioned Yet</h4>
                            <p className="text-xs text-neutral-500 max-w-md mx-auto leading-relaxed mt-1 font-mono">
                              You have no databases running under this project environment. Select an engine, specify resource coordinates on the left column panel, and click provision to spin up an instant live cluster.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4 font-mono text-xs">
                            {databaseServices.map((srv: any) => (
                              <div key={srv.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700 transition duration-150 shadow-md font-mono text-xs">
                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-3 mb-4 font-mono">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">
                                      {srv.type === "postgresql" ? "🐘" : srv.type === "mysql" ? "🐬" : srv.type === "mongodb" ? "🍃" : "⚡"}
                                    </span>
                                    <div>
                                      <h4 className="font-bold text-white text-xs uppercase flex items-center gap-1.5 font-mono">
                                        <span>{srv.name}</span>
                                        <span className="bg-neutral-950 border border-neutral-850 text-[9px] text-neutral-400 px-1.5 py-0.5 rounded uppercase font-black font-mono">
                                          {srv.type}
                                        </span>
                                      </h4>
                                      <div className="text-[10px] text-neutral-500 flex items-center gap-1.5 mt-0.5 font-mono">
                                        <span>Region: {srv.region || "US-East-1"}</span>
                                        <span>•</span>
                                        <span>Allocations: {srv.allocatedCpu} vCPU / {srv.allocatedRam} MB RAM</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 font-mono">
                                    {/* CLONE DB ACTION */}
                                    <button
                                      onClick={() => {
                                        if (!confirm(`Fork and clone database structure/data of "${srv.name}" to create an isolated test cluster?`)) return;
                                        fetch(`/api/projects/${currentProject?.id}/database/services/${srv.id}/clone`, {
                                          method: "POST"
                                        })
                                          .then(res => res.json())
                                          .then(data => {
                                            if (data.success) {
                                              alert(`Testing dataset cloned automatically into isolated sandbox "${data.service.name}"!`);
                                              fetchDatabaseServices(currentProject!.id);
                                            }
                                          });
                                      }}
                                      title="Clone standard state dataset for isolated sandboxed logic matching"
                                      className="bg-neutral-950 border border-neutral-850 hover:bg-neutral-900 hover:border-neutral-700 text-neutral-400 h-7.5 px-2.5 rounded text-[10px] uppercase font-black transition duration-150 cursor-pointer flex items-center gap-1 font-mono"
                                    >
                                      🐑 Clone Cluster
                                    </button>

                                    <button
                                      onClick={() => {
                                        if (!confirm(`Are you sure you want to completely de-provision and wipe "${srv.name}"? This action is permanent.`)) return;
                                        fetch(`/api/projects/${currentProject?.id}/database/services/${srv.id}`, {
                                          method: "DELETE"
                                        })
                                          .then(res => res.json())
                                          .then(() => {
                                            fetchDatabaseServices(currentProject!.id);
                                          });
                                      }}
                                      className="bg-rose-950/20 border border-rose-900/10 hover:border-rose-900/40 text-rose-455 hover:bg-rose-950 h-7.5 w-7.5 rounded flex items-center justify-center transition duration-150 cursor-pointer"
                                      title="De-provision cluster"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>

                                <div className="space-y-3 font-mono text-xs">
                                  {/* Credentials Section */}
                                  <div className="space-y-1.5 bg-neutral-950/60 border border-neutral-850 p-3 rounded-lg font-mono">
                                    <div className="flex justify-between items-center border-b border-neutral-900 pb-1.5 mb-1.5 text-[9px] text-neutral-500 font-extrabold uppercase font-mono">
                                      <span>Database Connection String URI</span>
                                      <span className="text-emerald-400 font-black flex items-center gap-1 font-mono">
                                        <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-pulse font-mono" />
                                        ONLINE & ACTIVE
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="password"
                                        readOnly
                                        id={`conn-${srv.id}`}
                                        value={srv.connectionString}
                                        className="bg-transparent text-[11px] font-semibold text-neutral-300 w-full outline-none font-mono tracking-wide"
                                      />
                                      <button
                                        onClick={(e) => {
                                          const input = document.getElementById(`conn-${srv.id}`) as HTMLInputElement;
                                          if (input.type === "password") {
                                            input.type = "text";
                                            (e.currentTarget as HTMLButtonElement).innerText = "HIDE";
                                          } else {
                                            input.type = "password";
                                            (e.currentTarget as HTMLButtonElement).innerText = "REVEAL";
                                          }
                                        }}
                                        className="text-[9px] bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white px-2 py-0.5 rounded cursor-pointer leading-none h-5 font-mono"
                                      >
                                        REVEAL
                                      </button>
                                      <button
                                        onClick={() => {
                                          navigator.clipboard.writeText(srv.connectionString);
                                          alert("Connection URI string copied to clipboard successfully!");
                                        }}
                                        className="text-[9.5px] bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white px-2 py-0.5 rounded cursor-pointer leading-none h-5 flex items-center gap-0.5 font-mono"
                                      >
                                        <Copy className="h-2.5 w-2.5" />
                                        COPY
                                      </button>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px] font-mono">
                                    <div className="bg-neutral-950/30 p-2 rounded-lg border border-neutral-850">
                                      <span className="text-neutral-550 block font-bold uppercase text-[8.5px]">Host Endpoint</span>
                                      <span className="text-neutral-300 font-bold mt-0.5 block">{srv.host}</span>
                                    </div>
                                    <div className="bg-neutral-950/30 p-2 rounded-lg border border-neutral-850">
                                      <span className="text-neutral-550 block font-bold uppercase text-[8.5px]">Connection Port</span>
                                      <span className="text-neutral-300 font-bold mt-0.5 block">{srv.port}</span>
                                    </div>
                                    <div className="bg-neutral-950/30 p-2 rounded-lg border border-neutral-850">
                                      <span className="text-neutral-550 block font-bold uppercase text-[8.5px]">Cluster Database Name</span>
                                      <span className="text-neutral-300 font-bold mt-0.5 block truncate">{srv.databaseName}</span>
                                    </div>
                                    <div className="bg-neutral-950/30 p-2 rounded-lg border border-neutral-850">
                                      <span className="text-neutral-550 block font-bold uppercase text-[8.5px]">Swarm User Profile</span>
                                      <span className="text-neutral-300 font-bold mt-0.5 block">{srv.username || "default_auth"}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeSupabaseSubTab === "templates" && (
                  <div className="space-y-6 animate-in fade-in duration-200 font-mono text-xs">
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                        <Zap className="h-4.5 w-4.5 text-neutral-400" />
                        Vortex Template Marketplace (1-Click Application Deployments)
                      </h3>
                      <p className="text-xs text-neutral-500 max-w-3xl leading-relaxed mt-1 font-mono">
                        Spin up popular workspace topologies and AI architectures inside your project in one click. Deploy databases, frontends, APIs, and pipelines seamlessly configured to connect and auto-route.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 font-mono text-xs">
                      {[
                        {
                          title: "FastAPI & PostgreSQL Backend Server",
                          desc: "Python API framework with automated Swagger docs, fully hooked to an isolated Postgres cluster with automatic migrations.",
                          tech: "FastAPI, PostgreSQL",
                          engine: "postgresql",
                          label: "Deploy Python Cluster",
                          img: "🐍"
                        },
                        {
                          title: "Next.js AI Chatbot Stack (MongoDB + AI SDK)",
                          desc: "Full-stack client framework utilizing Vercel AI SDK and MongoDB. Includes prompt history and state management caches.",
                          tech: "Next.js, MongoDB, LLM",
                          engine: "mongodb",
                          label: "Deploy NextJS Hub",
                          img: "💬"
                        },
                        {
                          title: "Redis Realtime PubSub Node Engine",
                          desc: "Supercharged pub-sub node structure. Handle web socket events and global distributed cache entries under 2ms.",
                          tech: "Node.js, Redis Cache",
                          engine: "redis",
                          label: "Deploy Redis Gateway",
                          img: "⚡"
                        },
                        {
                          title: "Node Express REST microservice",
                          desc: "Clean scaffolding for RESTful API services, equipped with Drizzle ORM configurations and safe Postgres connectors.",
                          tech: "Express, PostgreSQL",
                          engine: "postgresql",
                          label: "Deploy API Service",
                          img: "🚀"
                        }
                      ].map((tpl) => (
                        <div key={tpl.title} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700 transition duration-155 flex flex-col justify-between shadow-sm">
                          <div className="space-y-3">
                            <span className="text-3xl block leading-none">{tpl.img}</span>
                            <h4 className="font-bold text-white text-xs leading-snug line-clamp-1 h-4 font-mono">{tpl.title}</h4>
                            <p className="text-neutral-500 text-[10.5px] leading-relaxed line-clamp-4 font-mono">{tpl.desc}</p>
                            <span className="bg-neutral-950 border border-neutral-850 text-[9px] text-indigo-400 px-2 py-0.5 rounded font-black uppercase inline-block font-mono leading-none">
                              {tpl.tech}
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              if (!currentProject) return;
                              const serviceName = prompt(`Enter a name identifier for this template database fleet (e.g. ${tpl.engine}-main):`);
                              if (!serviceName) return;

                              fetch(`/api/projects/${currentProject.id}/database/services`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  name: serviceName,
                                  type: tpl.engine,
                                  region: "US-East-1 (N. Virginia)",
                                  allocatedCpu: 0.25,
                                  allocatedRam: 512,
                                  allocatedStorage: 10
                                })
                              })
                                .then(res => res.json())
                                .then(() => {
                                  alert(`Successfully bootstrapped ${tpl.title}! Database engine spawned, code repository configured and environment variables set.`);
                                  fetchDatabaseServices(currentProject.id);
                                  setActiveSupabaseSubTab("instances");
                                });
                            }}
                            className="bg-neutral-950 border border-neutral-850 hover:bg-neutral-100 hover:text-neutral-950 text-neutral-350 text-[10px] uppercase font-black tracking-wider w-full h-8 px-3 rounded-lg transition duration-150 mt-5 cursor-pointer block leading-none font-mono"
                          >
                            {tpl.label}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeSupabaseSubTab === "scaling" && (
                  <div className="space-y-6 animate-in fade-in duration-200 font-mono text-xs">
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                        <Cpu className="h-4.5 w-4.5 text-neutral-400" />
                        Infrastructure Scaling & Regional Availability (Zero-Cold Starts)
                      </h3>
                      <p className="text-xs text-neutral-500 max-w-3xl leading-relaxed mt-1 font-mono">
                        Configure autoscaling triggers, execution priorities, and container resource sizes. Vortex automatically orchestrates clusters globally across multi-region nodes.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start font-mono text-xs font-mono">
                      {/* Left Column: Config Form */}
                      <div className="lg:col-span-1 bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4 shadow-sm">
                        <h4 className="text-xs font-bold text-white uppercase border-b border-neutral-800 pb-2 font-mono">
                          SCALING CONFIGURATION
                        </h4>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-neutral-500 uppercase font-black">Min VM Instances</span>
                              <span className="text-white font-bold">{scalingConfig?.minInstances || 1} instance</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="10"
                              value={scalingConfig?.minInstances || 1}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setScalingConfig((prev: any) => ({ ...prev, minInstances: val }));
                              }}
                              className="w-full accent-white cursor-pointer"
                            />
                            <p className="text-[9px] text-neutral-505 leading-relaxed font-mono">Minimum running docker instances. Set as 0 to enable scaling to zero (Free tier cost-saver!).</p>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-neutral-550 uppercase font-black">Max Autoscale limit</span>
                              <span className="text-white font-bold">{scalingConfig?.maxInstances || 5} VMs Max</span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="30"
                              value={scalingConfig?.maxInstances || 5}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setScalingConfig((prev: any) => ({ ...prev, maxInstances: val }));
                              }}
                              className="w-full accent-white cursor-pointer"
                            />
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-neutral-550 uppercase font-black font-mono">CPU Autoscaling Trigger</span>
                              <span className="text-white font-bold font-mono">{scalingConfig?.targetCpuPercent || 70}% CPU load</span>
                            </div>
                            <input
                              type="range"
                              min="30"
                              max="95"
                              value={scalingConfig?.targetCpuPercent || 70}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setScalingConfig((prev: any) => ({ ...prev, targetCpuPercent: val }));
                              }}
                              className="w-full accent-white cursor-pointer"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] text-neutral-505 uppercase font-black block font-mono">Docker Instance Container Size</label>
                            <select
                              value={scalingConfig?.maxMemoryOption || "512MB"}
                              onChange={(e) => {
                                const val = e.target.value;
                                setScalingConfig((prev: any) => ({ ...prev, maxMemoryOption: val }));
                              }}
                              className="bg-neutral-950 border border-neutral-850 text-neutral-200 rounded h-8 px-2 w-full font-mono text-[11px] outline-none cursor-pointer"
                            >
                              <option value="256MB">256MB Micro — Free Tier</option>
                              <option value="512MB">512MB Medium — Standard</option>
                              <option value="1GB">1GB Large — Professional Scale</option>
                              <option value="2GB">2GB Extreme — Production swarm</option>
                            </select>
                          </div>

                          <div className="flex items-center justify-between border-t border-neutral-800 pt-3 text-[11px] font-mono">
                            <span className="text-neutral-400 uppercase font-bold">Optimize tree-shaking</span>
                            <button
                              onClick={() => setScalingConfig((prev: any) => ({ ...prev, optimizeTreeShaking: !prev.optimizeTreeShaking }))}
                              className={`h-6 px-2.5 rounded font-bold uppercase transition border cursor-pointer ${
                                scalingConfig?.optimizeTreeShaking
                                  ? "bg-neutral-100 border-neutral-300 text-neutral-950 font-bold"
                                  : "bg-neutral-950 border-neutral-850 text-neutral-405"
                              }`}
                            >
                              {scalingConfig?.optimizeTreeShaking ? "ON" : "OFF"}
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (!currentProject) return;
                              fetch(`/api/projects/${currentProject.id}/scaling`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(scalingConfig)
                              })
                                .then(res => res.json())
                                .then(() => {
                                  alert("System scaling credentials optimized on edge clusters!");
                                  fetchScalingConfig(currentProject.id);
                                });
                            }}
                            className="bg-neutral-100 hover:bg-neutral-200 text-neutral-950 font-bold h-9 w-full rounded-lg shadow-sm border border-neutral-300 uppercase cursor-pointer transition flex items-center justify-center gap-1.5 text-xs font-mono"
                          >
                            Save Infrastructure Plan
                          </button>
                        </div>
                      </div>

                      {/* Right Column: Global regions map */}
                      <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4 shadow-sm font-mono text-xs">
                        <h4 className="text-xs font-bold text-white uppercase border-b border-neutral-800 pb-2 font-mono">
                          EDGE CLUSTER ENDPOINTS & STATUS
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                          {[
                            { name: "Americas Node (New York)", pings: "12ms US-East", activePorts: "14 containers active", ip: "3.234.11.89", status: "online" },
                            { name: "Europe Node (Frankfurt)", pings: "38ms EU-West", activePorts: "32 containers active", ip: "18.196.220.104", status: "online" },
                            { name: "Asia-Pacific Node (Tokyo)", pings: "168ms AP-East", activePorts: "8 containers active", ip: "54.250.78.211", status: "online" }
                          ].map((reg) => (
                            <div key={reg.name} className="bg-neutral-950 p-4 border border-neutral-850 rounded-xl space-y-2 relative font-mono text-xs">
                              <span className="absolute top-3 right-3 text-[9px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded leading-none flex items-center gap-1 font-mono">
                                <span className="h-1 w-1 bg-emerald-400 rounded-full animate-ping font-mono text-xs" />
                                ONLINE
                              </span>
                              
                              <h5 className="font-bold text-white text-[11px] truncate uppercase font-mono">{reg.name}</h5>
                              <div className="space-y-1 text-[10px] text-neutral-505 mt-1 font-mono">
                                <div className="flex justify-between">
                                  <span>Latency metrics:</span>
                                  <span className="text-neutral-300 font-semibold">{reg.pings}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Node IP Address:</span>
                                  <span className="text-neutral-300 truncate select-all">{reg.ip}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Docker Workloads:</span>
                                  <span className="text-neutral-300 font-semibold">{reg.activePorts}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Interactive Load Simulator */}
                        <div className="p-4 bg-neutral-950 border border-neutral-850 rounded-xl space-y-3 font-mono">
                          <div className="flex justify-between items-center text-[10px] uppercase font-black text-neutral-450 font-mono">
                            <span>Platform Autoscaler Realtime Traffic Status Feed</span>
                            <span className="text-indigo-400 font-mono">Active Load Balancer: Round Robin</span>
                          </div>
                          
                          <div className="grid grid-cols-6 md:grid-cols-12 gap-2 font-mono">
                            {[7, 18, 14, 25, 42, 38, 29, 31, 15, 34, 52, 60].map((load, i) => (
                              <div key={i} className="flex flex-col items-center gap-1.5">
                                <div className="w-full bg-neutral-900 border border-neutral-850 rounded-md h-16 flex items-end">
                                  <div className={`w-full rounded-b-md ${load > 50 ? "bg-amber-400" : "bg-indigo-500"}`} style={{ height: `${load}%` }} />
                                </div>
                                <span className="text-[8px] text-neutral-600 font-mono">t - {12 - i}s</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeSupabaseSubTab === "api-docs" && (
                  <div className="space-y-6 animate-in fade-in duration-200 font-mono text-xs">
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                        <Terminal className="h-4.5 w-4.5 text-neutral-400" />
                        Autogenerated Edge RESTful API Documentation
                      </h3>
                      <p className="text-xs text-neutral-550 max-w-3xl leading-relaxed">
                        Vortex compiles OpenAPI parameters automatically direct from live table column definitions. Send HTTP inquiries with valid authorization headers.
                      </p>
                    </div>

                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm font-mono text-xs">
                      <div className="px-5 py-3 border-b border-neutral-800 bg-neutral-950/40">
                        <span className="text-[10px] text-neutral-505 uppercase tracking-widest block font-bold leading-none">SERVICE ADAPTER ENDPOINT DIRECTORY</span>
                      </div>

                      <div className="divide-y divide-neutral-950 p-4 space-y-6">
                        {dbTables.map(tbl => (
                          <div key={tbl.name} className="space-y-4 pt-4 first:pt-0 border-b border-neutral-900/40 pb-5 last:border-0">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="bg-blue-600 text-white text-[11px] font-bold px-2 py-0.5 rounded font-mono">GET</span>
                              <code className="text-xs font-semibold text-neutral-200 select-all font-mono">/api/v1/projects/{currentProject.id}/db/{tbl.name}</code>
                              <span className="text-[10px] text-neutral-500 italic">Query entire rows matching postgres constraints</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Curl code block */}
                              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-850 space-y-1.5">
                                <span className="text-[9px] text-neutral-500 uppercase font-black tracking-widest block font-sans">SHELL / CURL DIRECT INQUIRY</span>
                                <pre className="text-[10px] leading-relaxed text-indigo-300 overflow-x-auto whitespace-pre no-scrollbar select-all font-mono">
{`curl -X GET "https://api.monacolabs.io/v1/db/${tbl.name}" \\
  -H "Authorization: Bearer mcp_live_token_77a9b" \\
  -H "Content-Type: application/json"`}
                                </pre>
                              </div>

                              {/* JS sdk block */}
                              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-850 space-y-1.5 font-mono text-xs">
                                <span className="text-[9px] text-neutral-500 uppercase font-black tracking-widest block font-sans">JAVASCRIPT / SUPABASE ISOLATE CLIENT</span>
                                <pre className="text-[10px] leading-relaxed text-emerald-400 overflow-x-auto whitespace-pre no-scrollbar select-all font-mono">
{`const { data, error } = await supabase
  .from('${tbl.name}')
  .select('*')
  .order('created_at', { ascending: false });`}
                                </pre>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: Native Auth Controller (Auth) */}
            {activeTab === "auth" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-in fade-in duration-200 font-mono text-xs">
                {/* Left Column Auth Settings */}
                <div className="col-span-1 bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-5">
                  <div className="border-b border-neutral-850 pb-2.5">
                    <h4 className="text-xs font-bold text-neutral-200 uppercase tracking-widest flex items-center gap-1.5">
                      <Lock className="h-4 w-4 text-neutral-400" />
                      Sign-Up Policy Controller
                    </h4>
                    <span className="text-[10px] text-neutral-505 block mt-0.5">Control native client credentials access configuration.</span>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="flex justify-between items-center bg-neutral-950 p-3 rounded border border-neutral-850/70">
                      <div>
                        <strong className="text-neutral-300 block mb-0.5 text-[11px]">Allow Public Signup</strong>
                        <span className="text-[10px] text-neutral-600 block">Let guests complete client register forms.</span>
                      </div>
                      <button
                        onClick={() => {
                          const updated = { allowSignup: !authConfig.allowSignup };
                          fetch(`/api/projects/${currentProject.id}/auth/config`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(updated)
                          })
                            .then(res => res.json())
                            .then(data => setAuthConfig(data));
                        }}
                        className={`h-5 w-9 rounded-full p-0.5 transition ${
                          authConfig.allowSignup ? "bg-neutral-100 flex justify-end" : "bg-neutral-850 flex justify-start"
                        }`}
                      >
                        <span className="h-4 w-4 rounded-full bg-neutral-900 block" />
                      </button>
                    </div>

                    <div className="space-y-1 bg-neutral-950 p-3 rounded border border-neutral-850/70">
                      <div className="flex justify-between font-bold mb-1">
                        <span className="text-neutral-300 text-[11px]">Token lifespan (seconds)</span>
                        <span className="text-white text-xs">{authConfig.jwtLifespan}s</span>
                      </div>
                      <input
                        type="range"
                        min="300"
                        max="86400"
                        step="300"
                        value={authConfig.jwtLifespan}
                        onChange={(e) => {
                          const updated = { jwtLifespan: parseInt(e.target.value, 10) };
                          fetch(`/api/projects/${currentProject.id}/auth/config`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(updated)
                          })
                            .then(res => res.json())
                            .then(data => setAuthConfig(data));
                        }}
                        className="w-full accent-neutral-200"
                      />
                    </div>

                    <div className="space-y-1.5 font-mono">
                      <span className="text-[10px] text-neutral-505 uppercase font-black block">Active Handshake Providers</span>
                      <div className="space-y-1 bg-neutral-950/45 border border-neutral-850/80 rounded-lg p-2.5">
                        <div className="flex items-center gap-2 justify-between py-1 border-b border-neutral-900">
                          <label className="text-[11px] text-neutral-300">Email & Password credentials</label>
                          <span className="text-emerald-400 font-bold text-[9px] uppercase tracking-wide">ALWAYS ON</span>
                        </div>
                        <div className="flex items-center gap-2 justify-between py-1 border-b border-neutral-900">
                          <label className="text-[11px] text-neutral-350">Magic Link Sign-In URL</label>
                          <button
                            onClick={() => {
                              const updated = { providers: { ...authConfig.providers, magicLink: !authConfig.providers?.magicLink } };
                              fetch(`/api/projects/${currentProject.id}/auth/config`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(updated)
                              })
                                .then(res => res.json())
                                .then(data => setAuthConfig(data));
                            }}
                            className={`h-4.5 w-8 rounded-full p-0.5 transition ${
                              authConfig.providers?.magicLink ? "bg-neutral-200 flex justify-end" : "bg-neutral-850 flex justify-start"
                            }`}
                          >
                            <span className="h-3.5 w-3.5 rounded-full bg-neutral-900 block" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 justify-between py-1">
                          <label className="text-[11px] text-neutral-350">Two-Factor OTP Verification</label>
                          <button
                            onClick={() => {
                              const updated = { providers: { ...authConfig.providers, otp: !authConfig.providers?.otp } };
                              fetch(`/api/projects/${currentProject.id}/auth/config`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(updated)
                              })
                                .then(res => res.json())
                                .then(data => setAuthConfig(data));
                            }}
                            className={`h-4.5 w-8 rounded-full p-0.5 transition ${
                              authConfig.providers?.otp ? "bg-neutral-200 flex justify-end" : "bg-neutral-850 flex justify-start"
                            }`}
                          >
                            <span className="h-3.5 w-3.5 rounded-full bg-neutral-900 block" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column Auth registry visual tab */}
                <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm font-mono text-xs">
                  <div className="px-5 py-4 border-b border-neutral-800 bg-neutral-950/40 flex flex-wrap justify-between items-center gap-4">
                    <h4 className="text-xs font-bold text-neutral-350 uppercase tracking-widest flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-indigo-400" />
                      AUTHENTICATED USERS REGISTRY TABLE
                    </h4>
                    <span className="text-[10px] text-neutral-500 font-bold">Total Auth Enrolls: {authUsersList.length}</span>
                  </div>

                  {/* Add user controller */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newAuthEmail.trim()) return;
                      fetch(`/api/projects/${currentProject.id}/auth/users`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: newAuthEmail, status: selectedUserStatus })
                      })
                        .then(res => res.json())
                        .then(() => {
                          setNewAuthEmail("");
                          fetchAuthConfig(currentProject.id);
                        });
                    }}
                    className="p-4 bg-neutral-950/35 border-b border-neutral-850/80 flex flex-wrap gap-2 text-xs"
                  >
                    <input
                      type="email"
                      required
                      placeholder="e.g. customer@domain.com"
                      value={newAuthEmail}
                      onChange={(e) => setNewAuthEmail(e.target.value)}
                      className="bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 flex-1 min-w-[200px] outline-none text-neutral-200 focus:border-neutral-705"
                    />
                    <select
                      value={selectedUserStatus}
                      onChange={(e) => setSelectedUserStatus(e.target.value as any)}
                      className="bg-neutral-950 border border-neutral-800 text-neutral-350 px-2 rounded outline-none h-8"
                    >
                      <option value="active">ACTIVE STATUS</option>
                      <option value="suspended">SUSPENDED PROFILE</option>
                    </select>
                    <button
                      type="submit"
                      className="bg-neutral-100 hover:bg-neutral-200 text-neutral-950 font-bold border border-neutral-300 shadow rounded h-8 px-4 cursor-pointer flex items-center gap-1 font-mono"
                    >
                      <Plus className="h-4 w-4" />
                      ADD AUTH USER
                    </button>
                  </form>

                  <div className="divide-y divide-neutral-900/60 max-h-96 overflow-y-auto pr-1 no-scrollbar text-xs">
                    {authUsersList.map((usr) => (
                      <div key={usr.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition hover:bg-neutral-950/15">
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="text-white font-mono font-bold select-all">{usr.email}</span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase ${
                              usr.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                            }`}>
                              {usr.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-neutral-500">
                            Registered: <span className="text-neutral-400">{new Date(usr.createdAt).toLocaleString()}</span> • Last Session: <span className="text-neutral-400">{new Date(usr.lastLogin).toLocaleString()}</span>
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            if (!confirm("Are you sure you want to delete this auth profile?")) return;
                            fetch(`/api/projects/${currentProject.id}/auth/users/${usr.id}`, { method: "DELETE" })
                              .then(res => res.json())
                              .then(() => fetchAuthConfig(currentProject.id));
                          }}
                          className="px-2.5 py-1 hover:border-neutral-850 hover:bg-neutral-900 text-neutral-550 hover:text-rose-455 rounded border border-transparent transition self-end sm:self-auto text-[11px] font-bold"
                          title="Revoke session"
                        >
                          DELETE PROFILE
                        </button>
                      </div>
                    ))}
                    {authUsersList.length === 0 && (
                      <div className="text-center py-12 text-neutral-600 font-mono">
                        No registered credential profiles detected in this enclave yet. Add one above!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: API Key Generator Dashboard (APIS) */}
            {activeTab === "apis" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-in fade-in duration-200 font-mono text-xs">
                {/* Key constructor panel (Left Span 1) */}
                <div className="col-span-1 bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
                  <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-widest border-b border-neutral-850 pb-2.5 flex items-center gap-1.5">
                    <Key className="h-4 w-4 text-neutral-450" />
                    REGISTER ACCESSIBILITY KEY
                  </h4>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newApiKeyName.trim()) return;
                      fetch(`/api/projects/${currentProject.id}/api-keys`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name: newApiKeyName, rateLimit: newApiKeyRateLimit, description: newApiKeyDesc })
                      })
                        .then(res => res.json())
                        .then(() => {
                          setNewApiKeyName("");
                          setNewApiKeyDesc("");
                          fetchApiKeys(currentProject.id);
                        });
                    }}
                    className="space-y-4 text-xs"
                  >
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-500 uppercase font-black block">Gateway Core Token Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. production-gateway-cli-auth"
                        value={newApiKeyName}
                        onChange={(e) => setNewApiKeyName(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 focus:border-neutral-705 h-9 rounded-lg px-3 text-neutral-200 outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-505 uppercase font-black block">Gateway Throttling Limiter (rpm)</label>
                      <input
                        type="number"
                        placeholder="60"
                        value={newApiKeyRateLimit}
                        onChange={(e) => setNewApiKeyRateLimit(parseInt(e.target.value, 10) || 60)}
                        className="w-full bg-neutral-950 border border-neutral-850 h-9 rounded-lg px-3 text-neutral-200 outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-505 uppercase font-black block">Integration Description Annotation</label>
                      <textarea
                        placeholder="Describe key scopes format e.g. External service calls log checker sync tools..."
                        value={newApiKeyDesc}
                        onChange={(e) => setNewApiKeyDesc(e.target.value)}
                        className="w-full h-16 bg-neutral-950 border border-neutral-850 p-2.5 rounded-lg outline-none text-neutral-300 resize-none h-20"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-950 font-bold border border-neutral-300 shadow leading-none h-9 rounded-lg tracking-wide transition cursor-pointer font-mono"
                    >
                      GENERATE SECRET KEY
                    </button>
                  </form>
                </div>

                {/* Main Keys visual list & custom live multi-languages code blocks (Right Span 2) */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm font-mono text-xs">
                    <div className="px-5 py-4 border-b border-neutral-800 bg-neutral-950/40">
                      <h4 className="text-xs font-bold text-neutral-305 uppercase tracking-widest">
                        MONACO GATEWAY REGISTRY KEYS
                      </h4>
                    </div>

                    <div className="divide-y divide-neutral-900/40">
                      {apiKeysList.map((k) => (
                        <div key={k.id} className="p-4 space-y-3 transition hover:bg-neutral-950/15">
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-xs">
                                <strong className="text-white font-mono text-xs">{k.name}</strong>
                                <span className="bg-neutral-950 border border-neutral-850 text-neutral-400 text-[9px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                                  {k.rateLimit} requests/min
                                </span>
                              </div>
                              <p className="text-[10px] text-neutral-500 truncate max-w-md">{k.description || "No annotation provided."}</p>
                            </div>
                            <button
                              onClick={() => {
                                if (!confirm("Are you sure you want to permanently revoke this gateway key?")) return;
                                fetch(`/api/projects/${currentProject.id}/api-keys/${k.id}`, { method: "DELETE" })
                                  .then(res => res.json())
                                  .then(() => fetchApiKeys(currentProject.id));
                              }}
                              className="text-[10px] font-bold text-rose-455 hover:text-rose-400 px-2 py-1 rounded border border-transparent hover:border-neutral-850 hover:bg-neutral-950/40 transition self-end sm:self-auto cursor-pointer"
                            >
                              REVOKE KEY
                            </button>
                          </div>

                          {/* Secret token value display */}
                          <div className="flex items-center gap-2 bg-neutral-950/50 border border-neutral-850 rounded p-2.5">
                            <code className="text-emerald-400 font-bold select-all flex-1 break-all text-[11px]">
                              {k.secret}
                            </code>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(k.secret);
                                alert("API Key secret copied to clipboard successfully!");
                              }}
                              className="text-neutral-500 hover:text-white p-1 rounded hover:bg-neutral-900 transition flex items-center justify-center cursor-pointer"
                              title="Copy key string"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {apiKeysList.length === 0 && (
                        <div className="text-center py-12 text-neutral-600 font-mono text-xs">
                          No active serverless keys declared. Build keys on the left panel to secure connection strings.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* API Snippets Generator Playground */}
                  {apiKeysList.length > 0 && (
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm font-mono text-xs">
                      <div className="px-5 py-3 border-b border-neutral-800 bg-neutral-950/40">
                        <span className="text-xs font-bold text-neutral-300 uppercase tracking-widest font-mono block">
                          CLI & INTEGRATION CODE BLOCK COMPOSER
                        </span>
                      </div>

                      <div className="p-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                          <div className="space-y-1">
                            <label className="text-[10px] text-neutral-500 font-bold block uppercase">Language SDK platform</label>
                            <select className="bg-neutral-950 border border-neutral-850 text-neutral-300 w-full rounded h-8 px-2 outline-none cursor-pointer">
                              <option value="curl">Shell CLI Environment (cURL)</option>
                              <option value="js">JavaScript client (Fetch SDK)</option>
                              <option value="node">Node.js server-side backend (AXIOS)</option>
                              <option value="py">Python integration script (Requests)</option>
                            </select>
                          </div>
                        </div>

                        {/* Interactive SDK snippets visual map */}
                        <div className="p-4 bg-neutral-950 border border-neutral-850 rounded-lg text-xs font-mono space-y-3 text-neutral-300 leading-relaxed max-w-full select-all overflow-auto">
                          <p className="text-[10px] font-bold text-neutral-600 block uppercase mb-1.5 border-b border-neutral-900 pb-1 font-mono">
                             Formatted curl gateway shell instructions
                          </p>
                          <span className="text-indigo-400 block break-all font-mono whitespace-pre">
                            {"curl -X POST \"https://" + (currentProject?.name || "app") + ".vortex.ml/api/v1/store\" \\\n" +
                             "  -H \"Authorization: Bearer " + (apiKeysList[0]?.secret || "SECRET") + "\" \\\n" +
                             "  -H \"Content-Type: application/json\" \\\n" +
                             "  -d '{\"command\": \"db_lookup\", \"payload\": {\"active\": true}}'"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: Organizations and Member contexts switcher (TEAMS) */}
            {activeTab === "teams" && (
              <div className="space-y-6 animate-in fade-in duration-200 font-mono text-xs">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-900 pb-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400">
                      Workspaces & Teams Organization
                    </h3>
                    <p className="text-xs text-neutral-500 leading-relaxed font-mono">
                      Maintain distinct boundaries. Switch organizational context, invite developers, and manage authorization levels.
                    </p>
                  </div>

                  {/* Create Workspace Button */}
                  <button
                    onClick={() => {
                      const name = prompt("Enter a unique name for the new Workspace:");
                      if (!name) return;
                      fetch("/api/workspaces", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name })
                      })
                        .then(res => res.json())
                        .then(() => fetchWorkspaces());
                    }}
                    className="bg-neutral-100 hover:bg-neutral-200 text-neutral-950 font-bold text-xs h-9 rounded-lg px-4 flex items-center border border-neutral-300 shadow cursor-pointer uppercase"
                  >
                    CREATE NEW WORKSPACE
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                  {/* Left Workspace Switcher Pane */}
                  <div className="col-span-1 bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-4 py-3 border-b border-neutral-800 bg-neutral-950/40">
                      <span className="text-[10px] text-neutral-500 font-black tracking-wider uppercase block">SELECT ACTIVE WORKSPACE</span>
                    </div>

                    <div className="divide-y divide-neutral-900/40 p-2 space-y-1">
                      {workspacesList.map((ws) => (
                        <div
                          key={ws.id}
                          onClick={() => setCurrentWorkspace(ws)}
                          className={`w-full text-xs p-3 rounded-lg flex items-center justify-between cursor-pointer border transition duration-150 ${
                            currentWorkspace?.id === ws.id
                              ? "bg-neutral-950 border-neutral-800 text-white font-bold"
                              : "border-transparent text-neutral-400 hover:bg-neutral-950/50 hover:text-neutral-200"
                          }`}
                        >
                          <span>📁 {ws.name}</span>
                          <span className="text-[9px] font-sans bg-neutral-800 px-2 py-0.5 rounded text-neutral-405 uppercase font-black">
                            {ws.members?.length || 1} members
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Workspace Members list */}
                  {currentWorkspace ? (
                    <div className="lg:col-span-2 space-y-6">
                      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
                        <div className="px-5 py-4 border-b border-neutral-800 bg-neutral-950/40">
                          <h4 className="text-xs font-bold text-neutral-305 uppercase tracking-widest">
                            WORKSPACE MEMBERS DIRECTORY
                          </h4>
                        </div>

                        {/* Invite members form */}
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (!inviteMemberEmail.trim()) return;
                            fetch(`/api/workspaces/${currentWorkspace.id}/members`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ email: inviteMemberEmail, role: inviteMemberRole })
                            })
                              .then(res => res.json())
                              .then(() => {
                                setInviteMemberEmail("");
                                fetchWorkspaces();
                              });
                          }}
                          className="p-4 bg-neutral-950/35 border-b border-neutral-850/80 flex flex-wrap gap-2 text-xs"
                        >
                          <input
                            type="email"
                            required
                            placeholder="e.g. engineer@domain.com"
                            value={inviteMemberEmail}
                            onChange={(e) => setInviteMemberEmail(e.target.value)}
                            className="bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 flex-1 min-w-[200px] outline-none text-neutral-200 focus:border-neutral-700"
                          />
                          <select
                            value={inviteMemberRole}
                            onChange={(e) => setInviteMemberRole(e.target.value)}
                            className="bg-neutral-950 border border-neutral-800 text-neutral-350 px-2 rounded outline-none h-8 cursor-pointer"
                          >
                            <option value="Member">ROLE: MEMBER</option>
                            <option value="Admin">ROLE: ADMIN</option>
                          </select>
                          <button
                            type="submit"
                            className="bg-neutral-100 hover:bg-neutral-200 text-neutral-950 font-bold border border-neutral-300 shadow rounded px-4 h-8 cursor-pointer flex items-center gap-1 leading-none text-xs text-nowrap font-mono"
                          >
                            <Plus className="h-4 w-4" />
                            INVITE USER
                          </button>
                        </form>

                        <div className="divide-y divide-neutral-900/60 text-xs text-gray-300">
                          {currentWorkspace.members?.map((mem: any, idx: number) => (
                            <div key={idx} className="p-4 flex justify-between items-center transition hover:bg-neutral-950/15">
                              <span className="text-white font-mono select-all font-bold">{mem.email}</span>
                              
                              <div className="flex items-center gap-3">
                                {mem.role === "Owner" ? (
                                  <span className="text-[9.5px] font-bold px-2 py-0.5 rounded font-mono uppercase bg-amber-500/10 text-amber-400">
                                    Owner
                                  </span>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <select
                                      value={mem.role}
                                      onChange={(e) => {
                                        const newRole = e.target.value;
                                        fetch(`/api/workspaces/${currentWorkspace.id}/members`, {
                                          method: "PUT",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ email: mem.email, role: newRole })
                                        })
                                          .then(res => res.json())
                                          .then(() => fetchWorkspaces(currentWorkspace.id))
                                          .catch(err => console.error("Update role error:", err));
                                      }}
                                      className="bg-neutral-950 border border-neutral-800 text-neutral-350 text-[10px] h-7 px-1.5 rounded outline-none cursor-pointer font-mono font-semibold"
                                    >
                                      <option value="Admin">Admin</option>
                                      <option value="Member">Member</option>
                                    </select>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!confirm(`Are you sure you want to remove ${mem.email} from this workspace?`)) return;
                                        fetch(`/api/workspaces/${currentWorkspace.id}/members`, {
                                          method: "DELETE",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ email: mem.email })
                                        })
                                          .then(res => res.json())
                                          .then(() => fetchWorkspaces(currentWorkspace.id))
                                          .catch(err => console.error("Remove member error:", err));
                                      }}
                                      className="p-1 px-1.5 text-neutral-500 hover:text-red-450 hover:bg-neutral-950 rounded transition duration-150 cursor-pointer"
                                      title="Remove Member"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="col-span-2 bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center text-neutral-500 text-xs">
                      Select a workspace from the list to display member access maps and organization permissions details.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: COMPOSIO INTEGRATIONS & MCP BRIDGE */}
            {activeTab === "composio" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-200">
                
                {/* Left Area (Span 7) - MCP Protocol & AI Agents Bridge */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Card 1: Composio MCP Configuration */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Workflow className="h-4 w-4" />
                          </span>
                          <h4 className="text-sm font-semibold tracking-wide text-neutral-100 uppercase">
                            Composio MCP Server Protocol
                          </h4>
                        </div>
                        <p className="text-xs text-neutral-500 font-sans">
                          Direct Model Context Protocol (MCP) server configurations.
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded font-mono text-[10px] uppercase font-semibold">
                        <span className="block h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        Active Bridge
                      </div>
                    </div>

                    {/* API Key Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500 font-mono">
                          X-Consumer-API-Key
                        </label>
                        <div className="relative">
                          <input
                            type={isMcpKeyVisible ? "text" : "password"}
                            value={mcpApiKey}
                            onChange={(e) => setMcpApiKey(e.target.value)}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-neutral-700 font-mono pr-12"
                          />
                          <button
                            type="button"
                            onClick={() => setIsMcpKeyVisible(!isMcpKeyVisible)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                          >
                            {isMcpKeyVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500 font-mono">
                          Composio MCP URL Endpoint
                        </label>
                        <input
                          type="text"
                          value={mcpEndpoint}
                          onChange={(e) => setMcpEndpoint(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-neutral-700 font-mono"
                        />
                      </div>
                    </div>

                    {/* JSON Display */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 bg-neutral-950 px-4 py-2 border border-neutral-850 rounded-t-lg">
                        <span>Config File: mcp-servers.json</span>
                        <button
                          onClick={() => {
                            const configText = JSON.stringify({
                              mcpServers: {
                                composio: {
                                  url: mcpEndpoint,
                                  headers: {
                                    "x-consumer-api-key": mcpApiKey
                                  }
                                }
                              }
                            }, null, 2);
                            navigator.clipboard.writeText(configText);
                            setIsCopiedConfig(true);
                            setTimeout(() => setIsCopiedConfig(false), 2000);
                          }}
                          className="flex items-center gap-1 hover:text-white transition"
                        >
                          {isCopiedConfig ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copy JSON</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="bg-neutral-950 border border-t-0 border-neutral-850 p-4 rounded-b-lg text-[11px] font-mono leading-relaxed text-blue-400 overflow-x-auto select-all">
                        <span className="text-neutral-500">{"{"}</span>{"\n"}
                        &nbsp;&nbsp;<span className="text-amber-400">"mcpServers"</span><span className="text-neutral-300">:</span> <span className="text-neutral-500">{"{"}</span>{"\n"}
                        &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-amber-400">"composio"</span><span className="text-neutral-300">:</span> <span className="text-neutral-500">{"{"}</span>{"\n"}
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-amber-400">"url"</span><span className="text-neutral-300">:</span> <span className="text-emerald-300">"{mcpEndpoint}"</span><span className="text-neutral-300">,</span>{"\n"}
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-amber-400">"headers"</span><span className="text-neutral-300">:</span> <span className="text-neutral-500">{"{"}</span>{"\n"}
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-amber-400">"x-consumer-api-key"</span><span className="text-neutral-300">:</span> <span className="text-emerald-300">"{mcpApiKey}"</span>{"\n"}
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-neutral-500">{"}"}</span>{"\n"}
                        &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-neutral-500">{"}"}</span>{"\n"}
                        &nbsp;&nbsp;<span className="text-neutral-500">{"}"}</span>{"\n"}
                        <span className="text-neutral-500">{"}"}</span>
                      </pre>
                    </div>
                  </div>

                  {/* Card 2: Interactive Autonomous Agent Playbook Simulator */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6 shadow-sm">
                    <div className="border-b border-neutral-800 pb-3 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Sparkles className="h-4 w-4" />
                        </span>
                        <h4 className="text-sm font-semibold tracking-wide text-neutral-100 uppercase">
                          AI Agent Connector Tunnel (Vortex OS, Vortex LLM, Vortex Router)
                        </h4>
                      </div>
                      <p className="text-xs text-neutral-500 font-sans">
                        Instruct and dispatch autonomous agent brains to execute tools via Composio's MCP server endpoints.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* Pick Model agent platform */}
                      <div className="space-y-2">
                        <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500 font-mono">
                          Target Agent Platform Controller
                        </label>
                        <div className="grid grid-cols-3 gap-2 col-span-3">
                          {(["VortexAutonomousOS", "VortexCoreLLM", "VortexAnycastRouting"] as const).map((agent) => (
                            <button
                              key={agent}
                              type="button"
                              onClick={() => setMcpAgentPlatform(agent)}
                              className={`py-2 px-3 rounded-lg border text-xs font-bold font-mono tracking-wider transition ${
                                mcpAgentPlatform === agent
                                  ? "bg-amber-500/10 border-amber-500 text-amber-400"
                                  : "bg-neutral-950 border-neutral-850 hover:bg-neutral-900 text-neutral-450"
                              }`}
                            >
                              {agent === "VortexAutonomousOS" ? "Vortex OS" : agent === "VortexCoreLLM" ? "Vortex LLM" : "Vortex Router"}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Prompt Instruction */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500 font-mono">
                          Goal Instruction for Agent Tool Calling
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={mcpAgentPrompt}
                            onChange={(e) => setMcpAgentPrompt(e.target.value)}
                            placeholder="e.g., Query database pings and trigger active environment deployments"
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-neutral-700 pr-12"
                          />
                        </div>
                      </div>

                      {/* Dispatch Trigger button */}
                      <button
                        type="button"
                        onClick={runAgentMcp}
                        disabled={isTestingMcp || !mcpAgentPrompt.trim()}
                        className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-neutral-950 font-bold text-xs font-mono h-10 rounded-lg transition tracking-wide shadow flex items-center justify-center gap-2 uppercase"
                      >
                        {isTestingMcp ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            AGENT AUTOPILOT BUSY...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 fill-current" />
                            Connect & Dispatch via {mcpAgentPlatform} agent
                          </>
                        )}
                      </button>

                      {/* MCP Console Live Feed */}
                      {mcpTestLogs.length > 0 && (
                        <div className="space-y-2 font-mono animate-in slide-in-from-top-2 duration-200">
                          <div className="flex items-center justify-between text-[10px] text-neutral-500 bg-neutral-950 px-3 py-1 pb-1.5 border border-b-0 border-neutral-850 rounded-t-lg">
                            <span>Live MCP handshakes / Tool dispatches</span>
                            <span className={mcpTestRunStatus === "success" ? "text-emerald-400 font-bold" : "text-amber-400 animate-pulse"}>
                              ● {mcpTestRunStatus.toUpperCase()}
                            </span>
                          </div>
                          <div className="bg-neutral-950 border border-neutral-850 p-4 rounded-b-lg h-[240px] overflow-y-auto space-y-1.5 text-[10px] leading-relaxed text-neutral-300 custom-scrollbar select-text text-left">
                            {mcpTestLogs.map((log, index) => {
                              let logColor = "text-neutral-400";
                              if (log.includes("[VALID]") || log.includes("[AUTHORIZED]") || log.includes("[SUCCESS]") || log.includes("SUCCESS")) logColor = "text-emerald-400";
                              if (log.includes("AGENT-SYSTEM") || log.includes("AGENT-MODEL")) logColor = "text-amber-400";
                              if (log.includes("[MCP-INVOKE]")) logColor = "text-sky-400";
                              return (
                                <div key={index} className={`${logColor} hover:bg-white/5 p-0.5 rounded transition`}>
                                  {log}
                                </div>
                              );
                            })}
                            {isTestingMcp && (
                              <div className="flex items-center gap-1.5 text-neutral-600 italic">
                                <span className="block h-1.5 w-1.5 bg-neutral-500 rounded-full animate-bounce"></span>
                                <span className="block h-1.5 w-1.5 bg-neutral-500 rounded-full animate-bounce delay-100"></span>
                                <span className="block h-1.5 w-1.5 bg-neutral-500 rounded-full animate-bounce delay-200"></span>
                                Wait, invoking remote tool schemas...
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Area (Span 5) - Active Connectors (Slack, GitHub, Notion) */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6 shadow-sm font-mono text-xs">
                    <div className="space-y-1.5 border-b border-neutral-800 pb-3">
                      <h4 className="text-sm font-semibold tracking-wide text-neutral-100 uppercase font-sans">
                        Composio Connected Services
                      </h4>
                      <p className="text-xs text-neutral-500 font-sans">
                        Allow workspace agents to call tools inside your favorite productivity systems securely.
                      </p>
                    </div>

                    <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1">
                      {composioConnectorsList.length === 0 ? (
                        <div className="text-center py-6 text-neutral-600 font-sans">
                          No active integrations available. Select or create a project to load core connections.
                        </div>
                      ) : (
                        composioConnectorsList.map((connector) => (
                          <div
                            key={connector.id}
                            className="bg-neutral-950 border border-neutral-850 rounded-xl p-4 space-y-3 transition hover:border-neutral-750"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-center text-neutral-100 font-sans select-none">
                                  {connector.logo === "slack" && "💬"}
                                  {connector.logo === "github" && "🐙"}
                                  {connector.logo === "discord" && "👾"}
                                  {connector.logo === "notion" && "📑"}
                                  {connector.logo === "stripe" && "💳"}
                                  {connector.logo === "hubspot" && "🎯"}
                                  {connector.logo === "gmail" && "✉️"}
                                  {connector.logo === "salesforce" && "☁️"}
                                </div>
                                <div>
                                  <span className="text-xs font-bold text-neutral-200 block uppercase tracking-wide font-sans">
                                    {connector.name}
                                  </span>
                                  <span className="text-[9.5px] text-neutral-500 uppercase font-black tracking-wider block">
                                    {connector.category}
                                  </span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleToggleConnector(connector.id)}
                                className={`text-[10px] font-bold px-3 py-1 rounded transition ${
                                  connector.isConnected
                                    ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 hover:bg-red-400/10 hover:text-red-400 hover:border-red-400/20"
                                    : "bg-neutral-900 border border-neutral-800 text-neutral-450 hover:bg-neutral-800"
                                }`}
                              >
                                {connector.isConnected ? "DISCONNECT" : "CONNECT"}
                              </button>
                            </div>

                            <p className="text-[11px] text-neutral-500 leading-normal font-sans">
                              {connector.description}
                            </p>

                            {connector.isConnected && (
                              <div className="flex items-center justify-between border-t border-neutral-900 pt-2 text-[10px] text-neutral-500 font-mono">
                                <span>Tool scopes: <strong className="text-neutral-300 font-bold">{connector.scopesCount} authorized</strong></span>
                                <span className="text-emerald-400 select-none">● READY</span>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: Environments & Domain Settings Settings */}
            {activeTab === "settings" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start animate-in fade-in">
                
                {/* Visual Settings Box 1: Env Vars */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6 shadow-sm">
                  <div className="space-y-1.5 border-b border-neutral-800 pb-3">
                    <h4 className="text-sm font-semibold tracking-wide text-neutral-100 uppercase">
                      Environment Variables
                    </h4>
                    <p className="text-xs text-neutral-500">
                      Configure custom environment secrets accessible server-side inside your build compiler environments.
                    </p>
                  </div>

                  {/* Add environment variables form */}
                  <form onSubmit={handleAddEnv} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="KEY_NAME"
                      value={newEnvKey}
                      onChange={(e) => setNewEnvKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
                      className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-neutral-700 uppercase"
                    />
                    <input
                      type="text"
                      required
                      placeholder="secret_token_val_104"
                      value={newEnvVal}
                      onChange={(e) => setNewEnvVal(e.target.value)}
                      className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-neutral-700"
                    />
                    <button
                      type="submit"
                      className="bg-neutral-100 hover:bg-neutral-200 text-neutral-950 font-bold text-xs font-mono h-9 rounded-lg px-3 transition tracking-wide border border-neutral-300 shadow"
                    >
                      ADD VARIABLE
                    </button>
                  </form>

                  {/* Environment variables index table */}
                  <div className="space-y-2 max-h-[220px] overflow-auto pr-1">
                    {envVarsList.map((env) => {
                      const isRevealed = showEnvs[env.id] || false;
                      return (
                        <div
                          key={env.id}
                          className="flex justify-between items-center bg-neutral-950 border border-neutral-850 p-3 rounded-lg"
                        >
                          <div className="space-y-1 font-mono text-xs">
                            <span className="text-neutral-400 font-bold">{env.key}</span>
                            <span className="text-neutral-600 select-none mx-2">=</span>
                            <span className="text-neutral-300 font-semibold select-all">
                              {isRevealed ? env.value : "••••••••••••••••••••"}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setShowEnvs((prev) => ({ ...prev, [env.id]: !isRevealed }));
                              }}
                              className="p-1 hover:text-white text-neutral-500 hover:bg-neutral-800 rounded transition"
                              title={isRevealed ? "Hide value" : "Reveal value"}
                            >
                              {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              onClick={() => handleDeleteEnv(env.id)}
                              className="p-1 text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 rounded transition"
                              title="Delete Variable"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {envVarsList.length === 0 && (
                      <div className="text-center py-6 text-neutral-600 text-xs">
                        No environment variables set inside compiler workspace.
                      </div>
                    )}
                  </div>
                </div>

                {/* Visual Settings Box 2: Custom Domains */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6 shadow-sm">
                  <div className="space-y-1.5 border-b border-neutral-800 pb-3">
                    <h4 className="text-sm font-semibold tracking-wide text-neutral-100 uppercase">
                      DNS Aliasing & Custom Domains
                    </h4>
                    <p className="text-xs text-neutral-500">
                      Configure custom target web domains that map dynamically to Vortex edge router preview builds.
                    </p>
                  </div>

                  {/* Add domain form */}
                  <form onSubmit={handleAddDomain} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="applet-sub.jayomer.dev"
                      value={newDomainName}
                      onChange={(e) => setNewDomainName(e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, ""))}
                      className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-neutral-700 lowercase md:col-span-2"
                    />
                    <button
                      type="submit"
                      className="bg-neutral-100 hover:bg-neutral-200 text-neutral-950 font-bold text-xs font-mono h-9 rounded-lg px-3 transition tracking-wide border border-neutral-300 shadow"
                    >
                      MAP DOMAIN
                    </button>
                  </form>

                  {/* Realtime DNS settings validation instructions mockup */}
                  <div className="p-3.5 bg-neutral-950 border border-neutral-850 rounded-xl text-xs space-y-2 leading-relaxed">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 block font-mono">DNS pointing requirements</span>
                    <p className="text-neutral-400">
                      Inside your hosting registrar zone file editor, add an <strong className="text-white">A Record</strong> pointing toward <code className="text-neutral-300 font-mono bg-neutral-900 px-1 py-0.5 rounded border border-neutral-800 font-semibold select-all">76.76.21.21</code> or a <strong className="text-white">CNAME record</strong> pointing to <code className="text-neutral-300 font-mono bg-neutral-900 px-1 py-0.5 rounded border border-neutral-800 font-semibold select-all">cname.vortex.ml</code>
                    </p>
                  </div>

                  {/* Domains checklist table */}
                  <div className="space-y-2 max-h-[160px] overflow-auto pr-1">
                    {domainsList.map((dom) => (
                      <div
                        key={dom}
                        className="flex justify-between items-center bg-neutral-950 border border-neutral-855 p-3 rounded-lg"
                      >
                        <span className="text-xs font-mono text-neutral-300 select-all">{dom}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono font-bold uppercase select-none">
                            Valid DNS
                          </span>
                          {/* Protect standard default preview domains from total deletion */}
                          {!dom.endsWith(".vortex.ml") && (
                            <button
                              onClick={() => handleDeleteDomain(dom)}
                              className="p-1 text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 rounded transition"
                              title="Delete Variable"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {domainsList.length === 0 && (
                      <div className="text-center py-6 text-neutral-600 text-xs">
                        No custom domains mapped yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Visual Settings Box 3: Subdomain Extension Provisioner */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6 shadow-sm">
                  <div className="space-y-1.5 border-b border-neutral-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Globe className="h-4 w-4" />
                      </span>
                      <h4 className="text-sm font-semibold tracking-wide text-neutral-100 uppercase">
                        Quick Subdomain Provisioner
                      </h4>
                    </div>
                    <p className="text-xs text-neutral-500">
                      Instantly map and spin up an active routing subdomain suffix on our high-speed zone network.
                    </p>
                  </div>

                  <form onSubmit={handleProvisionSubdomain} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Pick Base Zone */}
                      <div className="space-y-1">
                        <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                          1. Select Domain Suffix Target
                        </label>
                        <select
                          value={selectedBaseDomain}
                          onChange={(e) => setSelectedBaseDomain(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-neutral-700 font-mono"
                        >
                          <option value="vortex.ml">vortex.ml (Preferred Zone)</option>
                          <option value="jayomer.dev">jayomer.dev (Dev Sandbox)</option>
                          <option value="monacodev.ml">monacodev.ml (Live Platform)</option>
                        </select>
                      </div>

                      {/* Prefix text */}
                      <div className="space-y-1">
                        <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                          2. Input Subdomain Prefix
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            placeholder="my-cool-sub"
                            value={subdomainPrefix}
                            onChange={(e) => setSubdomainPrefix(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-neutral-700 font-mono pr-20"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-neutral-500 font-mono pointer-events-none">
                            .{selectedBaseDomain}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!subdomainPrefix}
                      className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-neutral-950 font-bold text-xs font-mono h-10 rounded-lg transition tracking-wide shadow flex items-center justify-center gap-1.5 uppercase"
                    >
                      <Zap className="h-4 w-4" />
                      Provision .{selectedBaseDomain} Subdomain
                    </button>
                  </form>

                  {/* High Fidelity Active Subdomain status overview */}
                  <div className="bg-neutral-950 border border-neutral-850 rounded-xl p-4 space-y-3.5 text-xs">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 block font-mono">
                      Subdomain Live Diagnostics
                    </span>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between font-mono bg-neutral-900 border border-neutral-850 p-2 rounded text-neutral-300">
                        <span className="truncate">*.{selectedBaseDomain} Routing Base</span>
                        <span className="text-emerald-400 text-[10px] bg-emerald-400/10 border border-emerald-400/20 px-1.5 py-0.5 rounded font-bold">
                          ACTIVE CDN
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 leading-relaxed">
                        Subdomains provisioned on <strong className="text-neutral-300 font-mono font-normal">example.ml</strong> are served instantly using high-capacity edge instances, bypassing any cold start.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Visual Settings Box 4: Advanced Engine / Build Settings */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6 shadow-sm">
                  <div className="space-y-1.5 border-b border-neutral-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        <Cpu className="h-4 w-4" />
                      </span>
                      <h4 className="text-sm font-semibold tracking-wide text-neutral-100 uppercase">
                        Vortex Compiler & Build Settings
                      </h4>
                    </div>
                    <p className="text-xs text-neutral-500">
                      Configure base execution environments, continuous integration compilers, and routing features.
                    </p>
                  </div>

                  <form onSubmit={handleSaveAdvancedSettings} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Node Runtime version picker */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                          Node.js Container Runtime
                        </label>
                        <select
                          value={nodeVersion}
                          onChange={(e) => setNodeVersion(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-neutral-700 font-mono"
                        >
                          <option value="Node 22.x (Current)">Node 22.x (Current)</option>
                          <option value="Node 20.x (LTS)">Node 20.x (LTS - Recommended)</option>
                          <option value="Node 18.x (LTS)">Node 18.x (Active LTS)</option>
                          <option value="Node 16.x (Legacy)">Node 16.x (Legacy Node)</option>
                        </select>
                      </div>

                      {/* Root working directory config input */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                          Workspace Build Root Directory
                        </label>
                        <input
                          type="text"
                          required
                          value={buildRootDir}
                          onChange={(e) => setBuildRootDir(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-neutral-700 font-mono"
                        />
                      </div>
                    </div>

                    {/* Checkbox settings / Toggles */}
                    <div className="space-y-3.5 border-t border-neutral-800 pt-4">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={bypassCache}
                          onChange={(e) => setBypassCache(e.target.checked)}
                          className="mt-0.5 rounded border-neutral-800 bg-neutral-950 accent-sky-500 text-neutral-950 h-3.5 w-3.5"
                        />
                        <div className="space-y-0.5">
                          <span className="text-xs font-semibold text-neutral-200">
                            Bypass Edge-Router Compiler Cache
                          </span>
                          <span className="block text-[11px] text-neutral-500 leading-normal">
                            Force fresh bundle compiles for each deployment trigger run, avoiding stale edge manifests.
                          </span>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={previewComments}
                          onChange={(e) => setPreviewComments(e.target.checked)}
                          className="mt-0.5 rounded border-neutral-800 bg-neutral-950 accent-sky-500 text-neutral-950 h-3.5 w-3.5"
                        />
                        <div className="space-y-0.5">
                          <span className="text-xs font-semibold text-neutral-200">
                            Automatic Frame Comments overlay
                          </span>
                          <span className="block text-[11px] text-neutral-500 leading-normal">
                            Enable real-time feedback toolbar injection inside live-preview and domain alias frames.
                          </span>
                        </div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-3">
                      <div className="h-5">
                        {showSaveMessage && (
                          <span className="text-xs text-emerald-400 font-mono font-medium flex items-center gap-1 animate-pulse">
                            <span className="block h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                            Settings Saved Successfully!
                          </span>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={isSavingAdvancedSettings}
                        className="bg-neutral-100 hover:bg-neutral-200 text-neutral-950 font-bold text-xs font-mono h-9 px-4 rounded-lg transition tracking-wide border border-neutral-300 shadow flex items-center gap-1.5 uppercase"
                      >
                        {isSavingAdvancedSettings ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            SAVING...
                          </>
                        ) : (
                          <>
                            SAVE CONFIGURATIONS
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Visual Settings Box 5: Advanced API Gateway Key Builder */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6 shadow-sm">
                  <div className="space-y-1.5 border-b border-neutral-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <Key className="h-4 w-4" />
                      </span>
                      <h4 className="text-sm font-semibold tracking-wide text-neutral-100 uppercase">
                        Advanced API Key Constructor
                      </h4>
                    </div>
                    <p className="text-xs text-neutral-500">
                      Generate granular authorization tokens with custom credentials lifetime, rate-throttling limits, and prefixing.
                    </p>
                  </div>

                  <form onSubmit={handleGenerateAdvancedKey} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Name in Key */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500 font-mono">
                          Key Identifier Tag
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. workspace-edge-listener"
                          value={genKeyName}
                          onChange={(e) => setGenKeyName(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-neutral-700 font-mono"
                        />
                      </div>

                      {/* Prefix type */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500 font-mono">
                          Token Custom Prefix
                        </label>
                        <select
                          value={genKeyPrefix}
                          onChange={(e) => setGenKeyPrefix(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-neutral-700 font-mono"
                        >
                          <option value="vx_live">vx_live_ (Production Mode)</option>
                          <option value="vx_test">vx_test_ (Development Mode)</option>
                          <option value="sk_prod">sk_prod_ (Secured Root Mode)</option>
                          <option value="composio">composio_ (MCP Router Mode)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Rate limiter */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500 font-mono">
                          Rate Limit Threshold (rpm)
                        </label>
                        <input
                          type="number"
                          value={genKeyRateLimit}
                          onChange={(e) => setGenKeyRateLimit(parseInt(e.target.value, 10) || 120)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-neutral-700 font-mono"
                        />
                      </div>

                      {/* Expiry selection */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500 font-mono">
                          Credentials Expiry Duration
                        </label>
                        <select
                          value={genKeyExpiry}
                          onChange={(e) => setGenKeyExpiry(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-neutral-700 font-mono"
                        >
                          <option value="7">7 Days (Ephemeral sandbox)</option>
                          <option value="30">30 Days (Standard cycle)</option>
                          <option value="90">90 Days (Quarterly rotation)</option>
                          <option value="infinite">Never Expire (Static backend)</option>
                        </select>
                      </div>
                    </div>

                    {/* Permissions selection list checkboxes */}
                    <div className="space-y-2.5 border-t border-neutral-800 pt-3">
                      <span className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500 font-mono">
                        Target Scope Authorization Permissions
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono select-none">
                        {[
                          { id: "read_db", label: "Read Monaco DB Tables" },
                          { id: "write_db", label: "Write/Insert DB Rows" },
                          { id: "trigger_deploy", label: "Trigger Global Deployments" },
                          { id: "mcp_tool_exec", label: "Execute Composio MCP Tools" }
                        ].map((perm) => {
                          const isChecked = genKeyPermissions.includes(perm.id);
                          return (
                            <label key={perm.id} className="flex items-center gap-2 cursor-pointer text-neutral-350 hover:text-white transition">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setGenKeyPermissions(prev => prev.filter(p => p !== perm.id));
                                  } else {
                                    setGenKeyPermissions(prev => [...prev, perm.id]);
                                  }
                                }}
                                className="rounded border-neutral-800 bg-neutral-950 accent-indigo-500 text-neutral-950 h-3.5 w-3.5"
                              />
                              <span>{perm.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!genKeyName.trim()}
                      className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-950 font-bold text-xs font-mono h-10 rounded-lg transition tracking-wide border border-neutral-300 shadow flex items-center justify-center gap-1.5 uppercase"
                    >
                      <Plus className="h-4 w-4" />
                      BUILD ADVANCED GATEWAY KEY
                    </button>

                    {/* Show created credentials token box */}
                    {generatedTokenResult && (
                      <div className="mt-3 bg-neutral-950 border border-neutral-850 p-4 rounded-xl space-y-2 animate-in zoom-in-95 font-mono">
                        <div className="flex items-center justify-between text-[10px] text-neutral-505 uppercase">
                          <span className="text-emerald-400 font-bold">Key Constructed Successfully!</span>
                          <span className="text-neutral-500">Copy to credentials vault</span>
                        </div>
                        <div className="flex items-center justify-between bg-neutral-900 border border-neutral-800 p-2 text-xs rounded text-neutral-200">
                          <code className="select-all font-bold select-text breaking-all break-all overflow-hidden text-neutral-100 mr-2">
                            {generatedTokenResult}
                          </code>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(generatedTokenResult);
                            }}
                            className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-2 py-1 rounded text-[10px] border border-neutral-700 ml-auto flex items-center gap-1 shrink-0"
                          >
                            <Copy className="h-3 w-3" />
                            COPY
                          </button>
                        </div>
                        <span className="block text-[9.5px] text-red-400 leading-normal font-sans">
                          *Warning: For security, this complete credential string is only visible to you once. Do not lose it!
                        </span>
                      </div>
                    )}
                  </form>
                </div>

                {/* Visual Settings Box 6: Model Router & AI Platforms Key Configs */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6 shadow-sm">
                  <div className="space-y-1.5 border-b border-neutral-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Sparkles className="h-4 w-4" />
                      </span>
                      <h4 className="text-sm font-semibold tracking-wide text-neutral-100 uppercase">
                        AI Model Router & Agent Vault Settings
                      </h4>
                    </div>
                    <p className="text-xs text-neutral-500 font-sans">
                      Establish default workspace foundation models and bind secret key connectors for connected high-capacity autonomous agents.
                    </p>
                  </div>

                  <form onSubmit={handleSaveAdvancedModelSettings} className="space-y-5">
                    {/* Model Picker */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                        Default Foundation Router Model
                      </label>
                      <select
                        value={selectedDefaultModel}
                        onChange={(e) => setSelectedDefaultModel(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-neutral-700 font-mono"
                      >
                        <option value="vortex-2">Vortex 2.0 (Realtime Web Search - Preferred)</option>
                        <option value="vortex-3-concept">Vortex 3 (Next-Gen Reasoning - Beta)</option>
                        <option value="gemini-2.5-pro">Gemini 2.5 Pro (Multimodal Agent Engine)</option>
                        <option value="gpt-4o">GPT-4o Omniclass (Broad Compatibility)</option>
                        <option value="vortex-router-edge">Vortex Edge Router (Ultra-low latency routing)</option>
                      </select>
                    </div>

                    {/* Temperature Slider & max tokens */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                          <span>Model Temperature</span>
                          <span className="font-mono text-neutral-300">{modelTemperature.toFixed(1)}</span>
                        </div>
                        <input
                          type="range"
                          min="0.0"
                          max="2.0"
                          step="0.1"
                          value={modelTemperature}
                          onChange={(e) => setModelTemperature(parseFloat(e.target.value))}
                          className="w-full bg-neutral-950 h-1.5 rounded-lg appearance-none cursor-pointer accent-amber-500 mt-2"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                          Max Generation Tokens
                        </label>
                        <input
                          type="number"
                          value={modelMaxTokens}
                          onChange={(e) => setModelMaxTokens(parseInt(e.target.value, 10) || 4096)}
                          className="w-full bg-neutral-950 border border-neutral-850 h-9 rounded-lg px-3 text-xs font-mono text-neutral-200 focus:outline-none focus:border-neutral-700"
                        />
                      </div>
                    </div>

                    {/* Connected model redundancy fallback checkbox */}
                    <div className="border-t border-neutral-855 pt-3">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={modelEngineFallback}
                          onChange={(e) => setModelEngineFallback(e.target.checked)}
                          className="mt-0.5 rounded border-neutral-800 bg-neutral-950 accent-amber-500 text-neutral-950 h-3.5 w-3.5"
                        />
                        <div className="space-y-0.5">
                          <span className="text-xs font-semibold text-neutral-200">
                            Auto-Routing Redundancy Backup
                          </span>
                          <span className="block text-[11px] text-neutral-500 leading-normal">
                            If primary Vortex/Gemini connection spikes in latency, automatically failover schema validation prompts onto auxiliary edge endpoints.
                          </span>
                        </div>
                      </label>
                    </div>

                    {/* Connected Agents Credentials Securing Keys */}
                    <div className="space-y-3.5 border-t border-neutral-800 pt-4 font-mono text-xs">
                      <span className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500 font-sans">
                        Autonomous Agents Credentials Vault
                      </span>

                      <div className="grid grid-cols-1 gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[9.5px] uppercase text-neutral-450 font-bold block">Vortex Autonomous OS API Token</label>
                            <span className="text-[9px] text-emerald-400">● SECURED VAULT</span>
                          </div>
                          <input
                            type="password"
                            value={workspaceSureThingApiKey}
                            onChange={(e) => setWorkspaceSureThingApiKey(e.target.value)}
                            className="w-full bg-neutral-950 border border-neutral-855 h-9 rounded-lg px-3 text-neutral-200 focus:outline-none focus:border-neutral-700"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[9.5px] uppercase text-neutral-450 font-bold block">Vortex LLM Gateway Secret Key</label>
                            <span className="text-[9px] text-emerald-400">● SECURED VAULT</span>
                          </div>
                          <input
                            type="password"
                            value={workspaceGrokApiKey}
                            onChange={(e) => setWorkspaceGrokApiKey(e.target.value)}
                            className="w-full bg-neutral-950 border border-neutral-855 h-9 rounded-lg px-3 text-neutral-200 focus:outline-none focus:border-neutral-700"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[9.5px] uppercase text-neutral-450 font-bold block">Vortex Edge Router Credentials Key</label>
                            <span className="text-[9px] text-emerald-400">● SECURED VAULT</span>
                          </div>
                          <input
                            type="password"
                            value={workspaceBase44ApiKey}
                            onChange={(e) => setWorkspaceBase44ApiKey(e.target.value)}
                            className="w-full bg-neutral-950 border border-neutral-855 h-9 rounded-lg px-3 text-neutral-200 focus:outline-none focus:border-neutral-700"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between gap-4 pt-3">
                      <div className="h-5">
                        {showAdvancedModelSaveMsg && (
                          <span className="text-xs text-emerald-400 font-mono font-medium flex items-center gap-1 animate-pulse">
                            <span className="block h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                            AI Configurations Saved!
                          </span>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={isSavingAdvancedModelSettings}
                        className="bg-neutral-100 hover:bg-neutral-200 text-neutral-950 font-bold text-xs font-mono h-9 px-4 rounded-lg transition tracking-wide border border-neutral-300 shadow flex items-center gap-1.5 uppercase"
                      >
                        {isSavingAdvancedModelSettings ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            SAVING INTEGRATIONS...
                          </>
                        ) : (
                          <>
                            SAVE WORKSPACE MODEL ROUTING
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
      {isNewProjectModelOpen && (
        <div id="import-model" className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-bold text-neutral-100 uppercase tracking-widest font-mono flex items-center gap-2">
                <Github className="h-5 w-5 text-neutral-400" />
                Import Git Repository
              </h3>
              <button
                onClick={() => setIsNewProjectModelOpen(false)}
                className="text-neutral-500 hover:text-white transition-all text-xs font-mono hover:bg-neutral-800 p-1 rounded"
              >
                CLOSE
              </button>
            </div>

            <form onSubmit={handleDeployNew} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                    Project Title Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="my-personal-app"
                    value={newProjName}
                    onChange={(e) => {
                      setNewProjName(e.target.value);
                      if (!newProjRepo) {
                        setNewProjRepo(`jayomer1234/${e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "-")}`);
                      }
                    }}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-neutral-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                    Git Repository Destination
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="jayomer1234/my-personal-app"
                    value={newProjRepo}
                    onChange={(e) => setNewProjRepo(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-neutral-700 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                    Compilation Web Framework
                  </label>
                  <select
                    value={newProjFramework}
                    onChange={(e) => setNewProjFramework(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-neutral-700"
                  >
                    <option value="react">Vite React framework (SPA)</option>
                    <option value="nextjs">Next.js framework (App Router)</option>
                    <option value="serverless">Serverless Edge Node Node.js</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                    Target Deploy Branch
                  </label>
                  <input
                    type="text"
                    placeholder="main"
                    value={newProjBranch}
                    onChange={(e) => setNewProjBranch(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-neutral-700 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                  AI Build Direction / Prompt (Optional)
                </label>
                <textarea
                  placeholder="Set custom instructions if you want Gemini to scaffold or configure starter application logic dynamically."
                  value={newProjPrompt}
                  onChange={(e) => setNewProjPrompt(e.target.value)}
                  className="w-full h-20 bg-neutral-950 border border-neutral-800 focus:border-neutral-700 rounded-lg p-2.5 text-xs text-white focus:outline-none resize-none"
                />
              </div>

              {/* Fast import templates shortcut */}
              <div className="space-y-1.5 border-t border-neutral-800 pt-3">
                <span className="block text-[9px] uppercase font-bold tracking-wider text-neutral-500">
                  Quick Select Connected templates
                </span>
                <div className="flex flex-wrap gap-2">
                  {gitTemplates.map((tmpl) => (
                    <button
                      key={tmpl.repo}
                      type="button"
                      onClick={() => {
                        const name = tmpl.repo.split("/")[1];
                        setNewProjName(name);
                        setNewProjRepo(tmpl.repo);
                        setNewProjFramework(tmpl.framework);
                      }}
                      className="text-[10px] font-mono bg-neutral-950 hover:bg-neutral-850 text-neutral-300 border border-neutral-800 rounded px-2.5 py-1.5 flex items-center gap-1.5 transition select-none"
                    >
                      <span>{tmpl.repo}</span>
                      <ArrowRight className="h-3 w-3 text-neutral-500" />
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-950 text-xs font-pixel font-bold py-2.5 rounded-lg transition-all border border-neutral-300 shadow-md font-mono tracking-wider text-center cursor-pointer"
              >
                PROVISION AND DEPLOY EDGE
              </button>
            </form>
          </div>
        </div>
      )}
      </div>
    )}
      </main>
    </div>
  );
}
