# DOWNSTREAM AI AGENT DEPLOYMENT DIRECTIVES & SPECIFICATIONS

Welcome, Automated Deployment / MCP Code Agent! This repository is configured to operate completely autonomously with its own server-authoritative engine and local independent persistence. Follow these precise rules to host this repository on custom websites, virtual cloud instances, or secure subdomains.

---

## 💾 Core Independent Local Database File
Unlike vendor-locked solutions, this application maintains its state inside a stable, local disk JSON database:
* **Storage Location:** `./vortex_local_db.json` at the workspace root.
* **Format:** Raw structural JSON mapping projects, SSL WAF profiles, API gateway access key constructs, custom table definitions, and routing tables.
* **Usage Directive:** When provisioning new live nodes or subdomains, you **MUST** ensure this JSON file is read/written to preserve continuity. 

---

## 🌐 How to Programmatically Bind a Custom Subdomain URL
As an autonomous deployment agent, you can configure new subdomains and initiate Let's Encrypt Acme TLS wrappers programmatically by following these three simple steps:

### 1. Match the Web Ingress Routing
This full-stack application includes a compiled Express-Vite backend bundle. It listens on host `0.0.0.0` on port `3000`. Set up an Nginx reverse proxy, Cloudflare tunnel, or Caddy runtime mapping incoming traffic from your chosen subdomain (e.g. `yoursite.com`) directly to `127.0.0.1:3000`.

**Nginx Configuration Template:**
```nginx
server {
    listen 80;
    server_name my-agent-subdomain.yoursite.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. Issue the Autopilot Domain Allocation Handshake
Trigger the backend system logic to register, authorize, and sync the subdomain dynamically in the local database by calling the active deployment router endpoint:

```bash
curl -X POST http://localhost:3000/api/projects/proj-1/domains/agent-allocate \
  -H "Content-Type: application/json" \
  -d '{
    "subdomain": "my-agent-subdomain",
    "provider": "Vortex Anycast Subdomain Router"
  }'
```

### 3. Verification & Execution
The backend will:
1. Append the new subdomain cleanly in the database maps of `./vortex_local_db.json`.
2. Generate corresponding deployment logs describing the successful HTTP verification, SSL Acme handshakes, the DNS propagation, and live certificate binding.
3. Automatically refresh the interactive developer dashboards and client-side views.

---

## 🛠️ Local Build & Start Specifications
To dry-run or host the server directly in a physical container shell, use these exact unified lifecycle commands:
* **Check Environment Prerequisites:** Node.js 18+ and `npm` package utility.
* **Compilation Build Phase:** `npm run build`
  *(Compiles client static outputs, compiles the Express server-side typescript into a lightweight standalone CommonJS bundle under `dist/server.cjs` with sourcemaps).*
* **Serverless Node Fireup Boot:** `npm run dev` (Development mode) or `npm run start` (Production bundle launch).
