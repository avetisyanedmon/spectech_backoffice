const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const defaultDbPath = path.resolve(process.cwd(), "data", "app.db");
const configuredPath = process.env.DATABASE_PATH || defaultDbPath;
const absoluteDbPath = path.isAbsolute(configuredPath)
  ? configuredPath
  : path.resolve(process.cwd(), configuredPath);

fs.mkdirSync(path.dirname(absoluteDbPath), { recursive: true });

const db = new Database(absoluteDbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    creator_id TEXT NOT NULL,
    equipment_category TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    payment_types TEXT NOT NULL,
    pricing_unit TEXT NOT NULL,
    work_volume REAL NOT NULL,
    start_date_time TEXT NOT NULL,
    duration_hours INTEGER NOT NULL,
    expires_at TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL,
    bid_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_orders_creator_created_at
    ON orders (creator_id, created_at DESC);

  CREATE TABLE IF NOT EXISTS equipment (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    characteristics TEXT NOT NULL,
    additional_equipment TEXT,
    photos TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_equipment_owner_created_at
    ON equipment (owner_id, created_at DESC);

  CREATE TABLE IF NOT EXISTS bids (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    contractor_id TEXT NOT NULL,
    price REAL NOT NULL,
    delivery_price REAL NOT NULL DEFAULT 0,
    payment_type TEXT NOT NULL,
    comment TEXT,
    equipment_id TEXT,
    equipment_name TEXT,
    equipment_category TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );

  CREATE INDEX IF NOT EXISTS idx_bids_order_id
    ON bids (order_id);
`);

module.exports = { db, absoluteDbPath };
