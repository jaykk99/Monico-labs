export interface EnvVar {
  id: string;
  key: string;
  value: string;
}

export interface Project {
  id: string;
  name: string;
  framework: string; // 'nextjs' | 'react' | 'svelte' | 'serverless' | 'static'
  repo: string;
  branch: string;
  createdAt: string;
  activeDeploymentId: string;
  domains: string[];
  env: EnvVar[];
}

export interface Deployment {
  id: string;
  projectId: string;
  status: 'building' | 'ready' | 'failed';
  previewUrl: string;
  createdAt: string;
  commitMessage: string;
  commitHash: string;
  buildLogs: string[];
  deployedHtml?: string; // High-fidelity visual mockup layout
}

export interface ServerlessFunction {
  id: string;
  projectId: string;
  name: string; // e.g. "analyze-sentiment", "generate-image", "hello"
  route: string; // e.g. "/api/analyze-sentiment"
  code: string;  // JS/TS representation
  description: string;
}

export interface FunctionExecutionLog {
  id: string;
  functionId: string;
  timestamp: string;
  status: number;
  durationMs: number;
  memoryMb: number;
  stdout: string[];
  responseBody: string;
}

export interface AnalyticsMetric {
  timestamp: string;
  requests: number;
  bandwidth: number; // in MB
  errors: number; // count
  latency: number; // in ms
}

export interface CoreWebVitals {
  lcp: { value: number; rating: 'good' | 'needs-improvement' | 'poor' | 'measuring' };
  fid: { value: number; rating: 'good' | 'needs-improvement' | 'poor' | 'measuring' };
  cls: { value: number; rating: 'good' | 'needs-improvement' | 'poor' | 'measuring' };
}

export interface ShieldConfig {
  sslMode: 'flexible' | 'strict' | 'full' | 'off';
  developmentMode: boolean;
  brotli: boolean;
  securityLevel: 'off' | 'low' | 'medium' | 'high' | 'under-attack';
  totalThreatsBlocked: number;
  wafRules: WafRule[];
}

export interface WafRule {
  id: string;
  field: 'ip' | 'country' | 'user_agent' | 'uri';
  operator: 'eq' | 'ne' | 'contains' | 'starts_with';
  value: string;
  action: 'block' | 'challenge' | 'allow';
  isEnabled: boolean;
}

export interface ThreatIncident {
  id: string;
  timestamp: string;
  ip: string;
  country: string;
  flag: string;
  threatType: string;
  action: 'blocked' | 'challenged' | 'allowed';
  query: string;
}

export interface DbColumn {
  name: string;
  type: 'text' | 'integer' | 'uuid' | 'boolean' | 'timestamp';
  isNullable: boolean;
  isPrimaryKey: boolean;
  defaultValue?: string;
}

export interface DbTable {
  id: string;
  name: string;
  columns: DbColumn[];
  rows: Record<string, any>[];
}

export interface AuthConfig {
  jwtLifespan: number;
  allowSignup: boolean;
  passwordMinLength: number;
  providers: {
    emailPassword: boolean;
    magicLink: boolean;
    otp: boolean;
  };
  redirectUrls: string[];
}

export interface AuthUser {
  id: string;
  email: string;
  createdAt: string;
  lastLogin: string;
  status: 'active' | 'suspended';
}

export interface ApiKey {
  id: string;
  name: string;
  secret: string;
  createdAt: string;
  rateLimit: number;
  description: string;
}

export interface ComposioConnector {
  id: string;
  name: string;
  category: string;
  description: string;
  logo: string;
  isConnected: boolean;
  scopesCount: number;
}

export interface WorkspaceMember {
  email: string;
  role: 'Owner' | 'Admin' | 'Member';
}

export interface Workspace {
  id: string;
  name: string;
  owner: string;
  members: WorkspaceMember[];
}

export interface DatabaseService {
  id: string;
  projectId: string;
  name: string;
  type: 'postgresql' | 'mysql' | 'mongodb' | 'redis';
  status: 'provisioning' | 'active' | 'suspended' | 'scaling';
  connectionString: string;
  host: string;
  port: number;
  username?: string;
  password?: string;
  databaseName?: string;
  allocatedCpu: number;
  allocatedRam: number;
  allocatedStorage: number;
  metrics: {
    cpuUsage: number[];
    ramUsage: number[];
  };
  region: string;
  createdAt: string;
}

export interface CloudTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  databasesNeeded: ('postgresql' | 'mysql' | 'mongodb' | 'redis')[];
  envKeys: string[];
  avatarText: string;
  color: string;
}

export interface ScalingConfig {
  minInstances: number;
  maxInstances: number;
  targetCpuPercent: number;
  maxMemoryOption: string;
  concurrencyLimit: number;
  optimizeTreeShaking: boolean;
}

export interface ProjectEnvironment {
  id: string;
  projectId: string;
  name: string; // e.g. "production", "staging"
  isActive: boolean;
  variablesCount: number;
  clonedFrom?: string;
}

