import { getMigrations } from 'better-auth/db/migration'
import { auth } from '@/lib/auth'

export async function runAuthMigrations() {
  const { toBeCreated, toBeAdded, runMigrations } = await getMigrations(auth.options)
  if (toBeCreated.length === 0 && toBeAdded.length === 0) return
  await runMigrations()
  console.info(
    `[auth] Migrated SQLite schema (${toBeCreated.length} tables created, ${toBeAdded.length} tables altered).`,
  )
}
