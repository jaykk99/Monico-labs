# Monico Labs hub (Cloudflare Worker + D1)

The backend for the Monico Labs storefront. It is the **only** thing that
knows who paid. Product sites never check payments or codes; they verify a
short-lived token the hub signs.

- **Checkout**: vendored copy of the wholesale-stack checkout Worker
  (`src/vendor/`, a JS port of `jaykk99/crypto-payment-watcher`). Same rules:
  BTC / ETH / SOL, price pinned for 60 minutes, payer binding, 1% tolerance,
  single-use txid, `paid_late` never auto-unlocks, cron sweep every 5 min.
- **Ledger** (`src/ledger.js`): `access_codes` (SHA-256 hash only),
  `grants` (one per paid order, never twice), `order_claims`.
- **Access codes**: `ML-XXXX-XXXX-XXXX-XXXX`. Email isn't wired yet, so the
  code is handed over on the order screen once paid (plus a receipt
  download). The buyer's browser holds a claim secret; lost code → "Issue new
  code" rotates it and kills the old one. A buyer can add later purchases to
  the same code, so one code = everything they own.
- **Tokens**: `mh1.<payload>.<sig>`, Ed25519, 24 h, refreshable for 30 days.
  Revoking a code stops refresh, so it dies everywhere within 24 h.
- **Owner**: no shared password. TOTP from your authenticator app, plus one
  break-glass recovery code. Owner token passes every product's check.
  10 failed logins locks owner login for 15 minutes.

Catalog and prices come from `../catalog/products.json` (shared with the UI).

## Deploy (Cloudflare dashboard, no wrangler)

1. **Keys** — on any machine with Node 22: `node hub-worker/scripts/keygen.mjs`.
   Save the output in your password manager. Add the setup key to your
   authenticator app.
2. **D1** — Storage & Databases → D1 → Create → name `monico-hub`. Console tab →
   paste all of `dist-dashboard/migration.sql` → Execute.
3. **Worker** — Workers & Pages → Create → Worker → name `monico-hub` → Deploy →
   Edit code → replace everything with `dist-dashboard/worker.js` → Deploy.
4. **Binding** — Worker → Settings → Bindings → Add → D1 → variable `DB` →
   database `monico-hub`.
5. **Secrets** — Settings → Variables and Secrets → add as *Secret*:
   `HUB_SIGNING_KEY`, `OWNER_TOTP_SECRET`, `OWNER_RECOVERY_HASH`.
   Optional plain var `ALLOWED_ORIGINS` (comma list; default `*`).
6. **Cron** — Settings → Triggers → Cron → `*/5 * * * *`.
7. Open `https://monico-hub.<you>.workers.dev/health` → expect
   `db`, `signing`, `owner_login` all `true`.
8. **Storefront** — set `VITE_HUB_URL=https://monico-hub.<you>.workers.dev` in
   the Vercel project env and redeploy.

With wrangler instead: fill `database_id` in `wrangler.toml`, then
`wrangler secret put …` for the three secrets and `wrangler deploy`.

## Product sites

Copy `verify/monico-verify.js` into the product. It has no dependencies:
`signInWithCode()`, `verifyHubToken()`, `hasAccess(claims, "recon-anything", ["pro","agency"])`,
`refreshToken()`. Pin the public key from `/.well-known/monico-hub.json`.

## Checks

```bash
node --test hub-worker/tests/*.test.mjs        # full flow on real SQLite, mocked chain
ESBUILD=$(which esbuild) node hub-worker/dist-dashboard/build.mjs   # rebuild paste bundle
```

Receive addresses are your public pool from the paywatch defaults; override
with `PAYWATCH_ADDRESSES`. Changing a price = edit `catalog/products.json`,
rebuild the bundle, re-paste.
