-- Monico Labs hub - D1 schema (database name: monico-hub).
-- orders / meta / entitlements are the vendored paywatch checkout tables,
-- unchanged so the checkout core keeps working. access_codes / grants /
-- order_claims are the shared entitlement ledger every product trusts.
-- Amounts stay TEXT: wei and lamports exceed exact JS number range.
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  plan_id TEXT,
  price_usd REAL,
  payer_address TEXT,
  receive_address TEXT,
  expected_amount TEXT,
  created_at TEXT,
  status TEXT,
  buyer_ref TEXT DEFAULT '',
  seen_amount TEXT DEFAULT '0',
  seen_txid TEXT,
  txid TEXT,
  tx_received_amount TEXT DEFAULT '0',
  confirmations INTEGER DEFAULT 0,
  paid_at TEXT,
  expires_at TEXT,
  late_payment_note TEXT,
  asset TEXT DEFAULT 'btc',
  required_confirmations INTEGER DEFAULT 2,
  provider TEXT,
  provider_error TEXT,
  last_checked_at TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_txid ON orders(txid) WHERE txid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_asset_receive_status ON orders(asset, receive_address, status);
CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS entitlements (
  order_id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL,
  buyer_ref TEXT DEFAULT '',
  asset TEXT DEFAULT 'btc',
  txid TEXT,
  granted_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS access_codes (
  id TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL UNIQUE,
  label TEXT DEFAULT '',
  source TEXT NOT NULL,            -- purchase | owner
  created_at INTEGER NOT NULL,
  last_used_at INTEGER,
  revoked_at INTEGER
);
CREATE TABLE IF NOT EXISTS grants (
  id TEXT PRIMARY KEY,
  code_id TEXT,                    -- NULL until the buyer claims the order
  product TEXT NOT NULL,
  tier TEXT NOT NULL,
  source TEXT NOT NULL,            -- purchase | owner
  order_id TEXT UNIQUE,            -- one grant per paid order, never twice
  granted_at INTEGER NOT NULL,
  revoked_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_grants_code ON grants(code_id);
CREATE TABLE IF NOT EXISTS order_claims (
  order_id TEXT PRIMARY KEY,
  claim_hash TEXT NOT NULL,
  code_id TEXT,
  code_preexisting INTEGER NOT NULL DEFAULT 0,
  product TEXT NOT NULL,
  tier TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
