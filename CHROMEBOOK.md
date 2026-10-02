# Monico Labs on a Chromebook (self-hosted, no paid services)

Run the whole platform — app, database, deployments, MCP server — from a
Chromebook with zero API keys. Everything is embedded: SQLite for data,
`/sites/` for deployments, an ephemeral MCP Bearer <redacted> printed at boot.

## 1. Enable Linux (Crostini)

Settings → Advanced → Developers → **Linux development environment** → Turn on.
Give it at least 10 GB disk. This gives you a Debian container with a terminal.

## 2. Install Docker (or just Node)

**Option A — Docker (recommended, single image):**

```bash
# inside the Linux terminal
sudo apt-get update && sudo apt-get install -y docker.io
sudo usermod -aG docker $USER   # log out/in of the terminal after this
git clone https://github.com/jaykk99/Monico-labs.git
cd Monico-labs
docker build -t monico-labs .
docker run -d --name monico -p 3000:3000 \
  -v monico-data:/app/data \
  -v monico-sites:/app/sites \
  --restart unless-stopped \
  monico-labs
docker logs monico | grep "MCP Bearer <redacted>"   # copy the token
```

**Option B — plain Node (no Docker):**

```bash
sudo apt-get install -y nodejs npm
git clone https://github.com/jaykk99/Monico-labs.git
cd Monico-labs
npm install && npm run build && npm run start
```

No `.env` file needed. The server prints everything it needs at boot.

## 3. Keep it running 24/7

- Keep the Chromebook **plugged in**, lid open (or set "Sleep when lid is closed" to off while charging: Settings → Device → Power).
- `--restart unless-stopped` brings the container back after reboots.
- Data persists in the `monico-data` Docker volume (survives container restarts;
  back it up with `docker cp monico:/app/data/vortex.db ./backup.db`).

## 4. Reach it from outside your home (free)

```bash
# Cloudflare Tunnel — free, no port forwarding
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared
./cloudflared tunnel --url http://localhost:3000
```

You get a public `https://<random>.trycloudflare.com` URL. For a stable
subdomain, create a free Cloudflare account and route a domain to the tunnel.

## 5. Use it

- Dashboard: `http://<chromebook-ip>:3000` (find the IP with `hostname -I`)
- Health / what's degraded: `http://<chromebook-ip>:3000/api/health`
- MCP for AI agents: `http://<chromebook-ip>:3000/api/mcp/sse` with
  `Authorization: <redacted> <token from the boot log>`
- Deploy a site with zero keys: MCP tool `deploy_local` → served at `/sites/<name>/`

## Caveats (honest)

- The Chromebook must stay on and awake — if it sleeps, the sites sleep too.
- SQLite lives on local disk: fast and crash-safe, but back up `vortex.db`
  if you care about the data.
- `deploy_local` serves from this machine. For real public hosting without
  keeping a device on, use `deploy_project` with a `VERCEL_API_TOKEN`.
- AI features need `GOOGLE_API_KEY`/`GEMINI_API_KEY`; everything else works keyless.
