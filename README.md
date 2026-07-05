# 🌪️ Vortex Cloud Platform & MCP Server

🌤 **Live Demo**: https://monico-labs.onrender.com

Vortex is a self-contained, high-performance developer platform, integrated cloud orchestration infrastructure, and native database engine. It contains a fully functional **Model Context Protocol (MCP) Server** running natively on its backend that allows automated AI agents (like Grok, Claude, or Gemini) to programmatically deploy full-stack applications, register custom domains, query databases, audit firewall logs, and scale system resources instantly.

---

## ⚙️ Environment Variables & Configuration

Copy `.env.example` to `.env` and set these before running the server:

| Variable | Default | Description |
| :--- | :--- | :--- |
| `VORTEX_HOST` | `localhost` | The hostname or LAN IP the server binds to. Set to your device's LAN IP (e.g. `192.168.1.5`) so other devices on the same network can reach it. Leave as `localhost` for local-only access. |
| `VORTEX_PORT` | `3000` | Port the HTTP server listens on. Android/Termux requires a port > 1024 without root. |
| `VORTEX_LIVE_API_KEY` | — | Live API key for outbound integrations. |
| `SUPABASE_URL` | — | *(Optional)* Your Supabase project URL. When set alongside `SUPABASE_SERVICE_ROLE_KEY`, the `query_database` MCP tool will delegate SQL to Supabase first (requires an `execute_sql` stored function in your Supabase project). If unset, queries run against the local `vortex_local_db.json` file database. |
| `SUPABASE_SERVICE_ROLE_KEY` | — | *(Optional)* Supabase service-role key. Pair with `SUPABASE_URL` to enable Supabase SQL delegation. |
| `VRX_MCP_AUTH_TOKEN` | `vrx_agent_sk_live_999` | Bearer token agents must supply in the `Authorization` header to access MCP endpoints. Override in `.env` to set your own secret. |

> **Connection strings** (Redis, MongoDB, PostgreSQL) are also derived from `VORTEX_HOST`, so a single env var change redirects all services at once.

---

## 🤖 MCP Server Connection Guide for AI Agents

Vortex exposes its MCP capabilities over **Server-Sent Events (SSE)**. AI agents can connect and execute commands programmatically.

### 1. Connecting via SSE
* **SSE Endpoint:** `GET http://<VORTEX_HOST>:<VORTEX_PORT>/api/monico-labs.mcp/sse`
* **Message Posting Endpoint:** `POST http://<VORTEX_HOST>:<VORTEX_PORT>/api/monico-labs.mcp`
* **Authentication Header:**
  ```http
  Authorization: Bearer <VRX_MCP_AUTH_TOKEN>
  ```
  *(Alternatively, use the header `x-api-key: <token>` or query parameter `?key=<token>`)*

**Default values** (when running locally without env overrides):
- Host: `localhost`, Port: `3000`, Token: `vrx_agent_sk_live_999`

### 2. SSE Connection Flow
1. Open an EventSource connection to `GET http://<VORTEX_HOST>:<VORTEX_PORT>/api/monico-labs.mcp/sse`.
2. The server will respond with an SSE connection stream and a custom connection URI for sending messages, or you can POST JSON-RPC payloads directly to `/api/monico-labs.mcp?sessionId=<session-id>`.
3. Provide your auth token in the authorization headers of all requests.

---

## 🍳 AI Agent Cookbook: How to Build & Host a Custom Website (e.g., `monico-labs`)

If you are an AI agent tasked with building or launching a website, follow this direct autopilot recipe:

### Step 1: Create a Project
Call the `create_project` command to establish an isolated workspace container for the website.
* **Command:** `create_project`
* **Arguments:**
  ```json
  {
    "name": "monico-labs",
    "framework": "React"
  }
  ```
* **Expected Result:** `Project created successfully with ID: prj-xxxxxx`

### Step 2: Deploy the Website Frontend HTML & Code
Deploy the complete website frontend. You can provide any styled, self-contained HTML/CSS/JS payload.
* **Command:** `deploy_project`
* **Arguments:**
  ```json
  {
    "html": "<!DOCTYPE html>\n<html>\n<head>\n  <title>Monico Labs</title>\n  <link href=\"https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css\" rel=\"stylesheet\">\n</head>\n<body class=\"bg-neutral-900 text-white min-h-screen flex flex-col justify-center items-center\">\n  <h1 class=\"text-5xl font-black tracking-tight text-indigo-400\">MONICO LABS</h1>\n  <p class=\"mt-4 text-neutral-400\">Automated Edge Hosting Live Node.</p>\n</body>\n</html>",
    "commitMessage": "Deploy Monico Labs official homepage"
  }
  ```
* **Expected Result:** `Deployment successful. Preview routing active for: dep-xxxxxx`

### Step 3: Bind a Custom Subdomain
Map the project deployment to a virtual domain path so it can handle traffic.
* **Command:** `add_domain`
* **Arguments:**
  ```json
  {
    "projectId": "prj-xxxxxx",
    "domainName": "monico-labs"
  }
  ```
* **Expected Result:** The project becomes reachable at `http://<VORTEX_HOST>:<VORTEX_PORT>/p/monico-labs`

---

## 📖 Exhaustive MCP Tool & Command Reference

Here is the complete catalog of all **70+ MCP commands** registered on the server. AI agents can invoke any of these tools with their respective parameters.

### 📦 1. App Deployments & Releases
Manage deployments, rollback codebases, or abort failing builds mid-flight.

| Tool Name | Description | Arguments Schema (Zod) |
| :--- | :--- | :--- |
| **`deploy_project`** | Deploys a raw HTML payload natively on the Vortex Edge. | `{ html?: string, commitMessage?: string }` |
| **`trigger_deployment`** | Triggers a fresh git-synchronized deployment build for a project. | `{ projectId: string, commitMessage?: string }` |
| **`rollback_deployment`** | Instantly reverts active release to the previous stable release commit. | `{ projectId: string, environment: string }` |
| **`abort_deployment`** | Stops a currently building deployment sequence mid-flight. | `{ projectId: string, deploymentId: string }` |
| **`list_deployments`** | Lists all deployment histories for a project. | `{ projectId: string }` |
| **`list_deployments_errors`** | Gets lists of failed deployment history runs. | `{ projectId: string }` |

---

### 📂 2. Project & Repository Administration
Manage the high-level virtual containers, repositories, and workspaces.

| Tool Name | Description | Arguments Schema (Zod) |
| :--- | :--- | :--- |
| **`create_project`** | Creates a new high-level project natively. | `{ name: string, framework: string }` |
| **`list_projects`** | Lists all available projects in the vortex workspace. | `(none)` |
| **`edit_project`** | Edits project properties (name, repo source, etc.). | `{ projectId: string, name?: string, repo?: string }` |
| **`delete_project`** | Deletes a project and its historical instances. | `{ projectId: string }` |
| **`archive_stale_projects`** | Moves inactive repos/branches into read-only archives. | `{ projectId: string }` |

---

### 🗄️ 3. Database & Services Management
Vortex keeps its own local file database (`vortex_local_db.json`) with no external dependencies. Optionally delegate SQL queries to Supabase by setting `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (see [Environment Variables](#️-environment-variables--configuration)).

| Tool Name | Description | Arguments Schema (Zod) |
| :--- | :--- | :--- |
| **`list_database_tables`** | Lists database tables configured in the project. | `{ projectId: string }` |
| **`create_database_table`** | Creates a fresh database table schema. | `{ projectId: string, name: string }` |
| **`insert_database_record`**| Inserts a structured data record. | `{ projectId: string, tableName: string, data: string }` *(data must be stringified JSON)* |
| **`query_database`** | Runs a SQL query against the local `vortex_local_db.json` file DB. If `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set, delegates to Supabase instead (requires an `execute_sql` stored function). | `{ projectId: string, sql: string }` |
| **`list_database_services`**| Lists database backend server deployments. | `(none)` |
| **`create_database_service`**| Provisions a new isolated SQL database service instance. | `{ projectId: string, serviceName: string, type: string }` |

---

### 🌐 4. Domain & API Gateways Routing
Bind domains, configure reverse-proxy ingress, and deploy API Routing Proxies.

> **Domain routing:** Projects are served at `http://<VORTEX_HOST>:<VORTEX_PORT>/p/<name>`. Set `VORTEX_HOST` to your LAN IP to expose them across your network.

| Tool Name | Description | Arguments Schema (Zod) |
| :--- | :--- | :--- |
| **`add_domain`** | Allocates or adds a custom domain routing target to a project. | `{ projectId: string, domainName: string }` |
| **`configure_ssl_cert`** | Binds custom SSL/TLS certificates for safe custom domains. | `{ projectId: string, domain: string }` |
| **`create_api_gateway`** | Deploys a new reverse proxy routing API layer. | `{ projectId: string, route: string }` |
| **`update_gateway_route`** | Maps fresh endpoints on API Gateway to backend endpoints. | `{ projectId: string, route: string, target: string }` |
| **`delete_api_gateway`** | Tears down routing gateway rules. | `{ projectId: string, route: string }` |
| **`list_api_gateways`** | Lists all proxy/routing rules. | `(none)` |

---

### 🛡️ 5. WAF Security & Firewall Shield
Audit incidents, adjust firewall strictness, and configure IP blockage filters.

| Tool Name | Description | Arguments Schema (Zod) |
| :--- | :--- | :--- |
| **`list_waf_rules`** | Lists WAF Shield rules for a project. | `{ projectId: string }` |
| **`add_waf_rule`** | Adds a firewall/IP blockage rule. | `{ projectId: string, ipRange: string, action: string }` *(actions: 'block', 'challenge', etc.)* |
| **`remove_waf_rule`** | Deletes an active firewall rule. | `{ projectId: string, ruleId: string }` |
| **`update_waf_rule`** | Modifies rule priorities or target actions. | `{ projectId: string, ruleId: string, action: string }` |
| **`toggle_waf_mode`** | Switches between 'Block' mode and audit-only 'Count' mode. | `{ projectId: string, mode: string }` |
| **`get_waf_logs`** | Streams security perimeter firewall logs. | `{ projectId: string }` |
| **`list_shield_incidents`**| Lists active security threats and blocked attacks. | `{ projectId: string }` |

---

### 🔑 6. Authentication & User Management
Configure native client authentication providers, add users, and update security roles.

| Tool Name | Description | Arguments Schema (Zod) |
| :--- | :--- | :--- |
| **`configure_auth`** | Configures native auth (Email, Magic Links, OTP, etc.). | `{ projectId: string, provider: string }` |
| **`list_auth_users`** | Lists registered self-hosted authentication users. | `{ projectId: string }` |
| **`update_auth_user`** | Changes user roles or metadata attributes. | `{ projectId: string, userId: string, role: string }` |
| **`delete_auth_user`** | Revokes user access and deletes accounts. | `{ projectId: string, userId: string }` |
| **`create_api_key`** | Creates programmatic API credentials for clients. | `{ projectId: string, name: string }` |
| **`list_api_keys`** | Lists all generated client API keys. | `{ projectId: string }` |
| **`delete_api_key`** | Deletes a client API key. | `{ projectId: string, keyId: string }` |
| **`generate_api_key`** | Alternate command to create API access tokens. | `{ projectId: string, name: string }` |
| **`revoke_api_key`** | Alternate command to invalidate credentials. | `{ projectId: string, keyId: string }` |

---

### 🔌 7. Integrations & Connectors (Composio)
Synchronize external API plugins, authorize OAuth modules, and execute synthetic integration functions.

| Tool Name | Description | Arguments Schema (Zod) |
| :--- | :--- | :--- |
| **`list_composio_connectors`** | Lists active integrations (Composio, Zapier, etc.). | `{ projectId: string }` |
| **`toggle_composio_connector`** | Connects or disconnects an integration plugin. | `{ projectId: string, connectorId: string }` |
| **`get_connector_status`** | Audits connection health status. | `{ projectId: string, connectorId: string }` |
| **`configure_connector_auth`**| Injects OAuth tokens or API credentials. | `{ projectId: string, connectorId: string, keys: string }` |
| **`trigger_connector_action`** | Triggers an API invocation on an integration tool. | `{ projectId: string, connectorId: string, action: string }` |

---

### 🏢 8. Workspace Administration & Team RBAC
Create organizational groups and invite collaborators with fine-grained Roles (Owner, Administrator, Developer, Read-Only).

| Tool Name | Description | Arguments Schema (Zod) |
| :--- | :--- | :--- |
| **`list_workspaces`** | Lists all virtual workspaces. | `(none)` |
| **`create_workspace`** | Creates a new organization workspace. | `{ name: string }` |
| **`delete_workspace`** | Deletes a workspace completely. | `{ workspaceId: string }` |
| **`add_workspace_member`**| Adds a team member directly. | `{ workspaceId: string, email: string, role: string }` |
| **`invite_team_member`** | Sends workspace invite email to a developer. | `{ workspaceId: string, email: string }` |
| **`update_member_role`** | Adjusts RBAC workspace permission policies. | `{ workspaceId: string, email: string, role: string }` |
| **`list_team_members`** | Lists all workspace contributors and roles. | `{ workspaceId: string }` |

---

### 🐙 9. Git Operations
Trigger branch operations, status outputs, and push git release tags.

| Tool Name | Description | Arguments Schema (Zod) |
| :--- | :--- | :--- |
| **`import_git_repo`** | Links an external git repository URL to a project. | `{ projectId: string, repoUrl: string }` |
| **`clone_git_repo`** | Force syncs/clones down project code files. | `{ projectId: string, repoUrl: string }` |
| **`create_git_branch`** | Spins up isolated branch versions. | `{ projectId: string, branchName: string }` |
| **`get_git_status`** | Audits modified or untracked local source files. | `{ projectId: string }` |
| **`view_git_commits`** | Lists commit history timeline. | `{ projectId: string }` |
| **`push_git_changes`** | Commits and deploys changes programmatically. | `{ projectId: string, message: string }` |

---

### 🪣 10. Bucket & File Storage
Deploy file buckets, upload static assets, and purge files from CDN edge nodes.

| Tool Name | Description | Arguments Schema (Zod) |
| :--- | :--- | :--- |
| **`create_storage_bucket`** | Deploys a new distributed asset storage bucket. | `{ projectId: string, name: string }` |
| **`list_storage_buckets`** | Lists all storage buckets in a project. | `{ projectId: string }` |
| **`delete_storage_bucket`** | Purges a storage bucket completely. | `{ projectId: string, bucketName: string }` |
| **`upload_storage_file`** | Uploads raw assets or assets maps. | `{ projectId: string, bucketName: string, fileName: string }` |
| **`delete_storage_file`** | Deletes a file from bucket storage. | `{ projectId: string, bucketName: string, fileName: string }` |

---

### 💾 11. Backups & Recovery
Trigger snapshots and restore configurations to previous points in time.

| Tool Name | Description | Arguments Schema (Zod) |
| :--- | :--- | :--- |
| **`create_backup`** | Triggers instantaneous system-wide database/asset backup. | `{ projectId: string }` |
| **`restore_backup`** | Restores state using an existing backup ID. | `{ projectId: string, backupId: string }` |
| **`list_backups`** | Lists historical backup recovery points. | `{ projectId: string }` |
| **`configure_backup_policy`**| Establishes retention policies and cron backup schedules. | `{ projectId: string, schedule: string }` *(e.g., cron string)* |

---

### 📊 12. Telemetry, Logging & Observability
Audit server vitals, compare environment drifts, print system health analytics, and trace gateway errors.

| Tool Name | Description | Arguments Schema (Zod) |
| :--- | :--- | :--- |
| **`get_metrics`** | Pulls real-time server metrics (CPU, RAM, latency). | `(none)` |
| **`stream_logs`** | Tail logs for active live nodes. | `{ projectId: string }` |
| **`query_historical_logs`**| Searches logs with custom filters. | `{ projectId: string, query: string }` |
| **`get_error_analytics`** | Counts system error codes or crashes. | `{ projectId: string }` |
| **`export_audit_trail`** | Exports full history audit log in compliance structures. | `{ projectId: string }` |
| **`run_health_check`** | Performs a latency/HTTP ping check against an endpoint. | `{ url: string }` |
| **`compare_environments`**| Highlights configuration differences/drifts between environments. | `{ projectId: string, envA: string, envB: string }` |
| **`generate_deployment_report`**| Creates an extensive Markdown audit report on release differences. | `{ projectId: string }` |
| **`create_environment`** | Provisions a new environment profile (Staging, Prod). | `{ projectId: string, name: string }` |
| **`promote_build`** | Promotes a build/codebase from staging to production. | `{ projectId: string, buildId: string }` |
| **`set_env_variable`** | Sets configuration parameters. | `{ projectId: string, key: string, value: string }` |
| **`list_env_variables`** | Lists environment variables with secrets masked. | `{ projectId: string }` |
| **`scale_service`** | Changes replica configuration properties. | `{ projectId: string, replicas: number }` |
| **`configure_autoscaling`**| Fine-tunes scaling bounds (min/max instances). | `{ projectId: string, maxReplicas: number }` |
| **`clear_cache`** | Invalidates API Gateways, CDN, and edge caches. | `{ projectId: string }` |
| **`clear_environment_resources`**| Tears down sub-services before delete commands. | `{ projectId: string, environment: string }` |

---

## ⚡ Alternative REST Agent Webhook (The Direct Way)

AI Agents can also deploy directly using standard HTTP webhooks without initiating SSE connections:

```bash
# Replace <VORTEX_HOST>, <VORTEX_PORT>, and <TOKEN> with your values
# Defaults: localhost, 3000, vrx_agent_sk_live_999
curl -X POST http://<VORTEX_HOST>:<VORTEX_PORT>/api/vortex/agent/deploy \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "html": "<div style=\"text-align:center;padding:3rem;\"><h1>Website Deployed!</h1></div>",
    "commitMessage": "Autopilot direct push"
  }'
```

This returns a JSON payload with a direct, working URL to preview your newly deployed website.

---

## 📱 Termux & Linux Hosting Guide (Hardware Optimized)

Vortex is designed to automatically adapt its resource footprint based on the available hardware. This allows you to host it reliably on low-end devices like Android phones via Termux, as well as high-end Linux servers.

### Hosting on Linux / VPS

1. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/jaykk99/Monico-labs.git
   cd Monico-labs
   npm install
   ```
2. Build the frontend and the bundled server (`npm run start` runs the compiled `dist/server.cjs`, so the build step is required):
   ```bash
   npm run build
   ```
3. Configure environment variables (copy `.env.example` to `.env` and edit as needed):
   ```bash
   cp .env.example .env
   # Set VORTEX_HOST to your server's IP or 0.0.0.0 to bind on all interfaces
   # Set VORTEX_PORT if you want a port other than 3000
   ```
4. Start the server:
   ```bash
   npm run start
   ```
   You can also map it to port `80`/`443` using a reverse proxy like Nginx, or specify a custom port directly:
   ```bash
   export VORTEX_PORT=8080
   npm run start
   ```

### Hosting on Termux (Android Mobile)

1. **Install Termux** from F-Droid (the Google Play Store version is deprecated).
2. Update packages and install Node.js and Git:
   ```bash
   pkg update -y && pkg upgrade -y
   pkg install nodejs-lts git -y
   ```
3. Clone the repo and install dependencies:
   ```bash
   git clone https://github.com/jaykk99/Monico-labs.git
   cd Monico-labs
   npm install
   ```
4. Set your environment variables. To make the server reachable from other devices on your Wi-Fi, set `VORTEX_HOST` to your phone's LAN IP:
   ```bash
   cp .env.example .env
   # Edit .env — set VORTEX_HOST=<your-phone-LAN-IP>  e.g. 192.168.1.5
   # Android requires ports > 1024 without root; default is 3000
   export VORTEX_PORT=8080   # optional override
   ```
5. Start the server. On low-end devices, run directly with `tsx` (the `dev` script) to skip the heavier `esbuild`/`vite` production build:
   ```bash
   npm run dev
   ```
   On a higher-spec device you can instead run `npm run build && npm run start` for the optimized production bundle.

> **Cross-device access:** Once `VORTEX_HOST` is set to your LAN IP, other devices on the same Wi-Fi can reach the MCP server at `http://<VORTEX_HOST>:<VORTEX_PORT>/api/monico-labs.mcp/sse`.

*Note: When running on a low-end environment (less than 3GB RAM or 2 CPU cores), Vortex automatically switches to the `bad` hardware optimization profile, reducing background metrics intervals to prevent Node.js event loop hangs.*
