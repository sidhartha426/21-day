import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'

const databasePath =
  process.env.DATABASE_PATH ?? path.join(process.cwd(), 'data', 'auth.db')

fs.mkdirSync(path.dirname(databasePath), { recursive: true })

// Reuse one connection across hot reloads in development.
const globalForSqlite = globalThis as unknown as {
  sqlite?: Database.Database
}

function openDatabase() {
  const db = new Database(databasePath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_setting (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS invitation (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      invited_by TEXT,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      accepted_at INTEGER,
      accepted_user_id TEXT
    );
  `)
  return db
}

export const sqlite = globalForSqlite.sqlite ?? openDatabase()

if (process.env.NODE_ENV !== 'production') globalForSqlite.sqlite = sqlite

function tableExists(name: string) {
  const row = sqlite
    .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`)
    .get(name)
  return Boolean(row)
}

export function countUsers(): number {
  if (!tableExists('user')) return 0
  const row = sqlite.prepare(`SELECT COUNT(*) AS count FROM "user"`).get() as {
    count: number
  }
  return row.count
}

export function countAdmins(): number {
  if (!tableExists('user')) return 0
  const row = sqlite
    .prepare(`SELECT COUNT(*) AS count FROM "user" WHERE role = 'admin'`)
    .get() as { count: number }
  return row.count
}
