import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { sqlite } from '@/lib/db/sqlite'

const INVITE_TTL_MS = 1000 * 60 * 60 * 24 * 7

function getSetting(key: string): string | null {
  const row = sqlite
    .prepare(`SELECT value FROM app_setting WHERE key = ?`)
    .get(key) as { value: string } | undefined
  return row?.value ?? null
}

function setSetting(key: string, value: string) {
  sqlite
    .prepare(
      `INSERT INTO app_setting (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    )
    .run(key, value)
}

export function getSignupsEnabled(): boolean {
  return getSetting('signups_enabled') !== 'false'
}

export function setSignupsEnabled(enabled: boolean) {
  setSetting('signups_enabled', enabled ? 'true' : 'false')
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export type Invitation = {
  id: string
  email: string
  invitedBy: string | null
  createdAt: number
  expiresAt: number
  acceptedAt: number | null
}

type InvitationRow = {
  id: string
  email: string
  invited_by: string | null
  created_at: number
  expires_at: number
  accepted_at: number | null
}

function toInvitation(row: InvitationRow): Invitation {
  return {
    id: row.id,
    email: row.email,
    invitedBy: row.invited_by,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at,
  }
}

export function createInvitation(email: string, invitedBy: string) {
  const token = randomBytes(32).toString('base64url')
  const now = Date.now()
  const id = randomUUID()
  const normalizedEmail = email.trim().toLowerCase()

  // A fresh invite replaces any pending one for the same address.
  sqlite
    .prepare(`DELETE FROM invitation WHERE email = ? AND accepted_at IS NULL`)
    .run(normalizedEmail)
  sqlite
    .prepare(
      `INSERT INTO invitation (id, email, token_hash, invited_by, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(id, normalizedEmail, hashToken(token), invitedBy, now, now + INVITE_TTL_MS)

  return { id, token, expiresAt: now + INVITE_TTL_MS }
}

export function findValidInvitation(token: string): Invitation | null {
  const row = sqlite
    .prepare(
      `SELECT * FROM invitation
       WHERE token_hash = ? AND accepted_at IS NULL AND expires_at > ?`,
    )
    .get(hashToken(token), Date.now()) as InvitationRow | undefined
  return row ? toInvitation(row) : null
}

export function markInvitationAccepted(token: string, userId: string) {
  sqlite
    .prepare(
      `UPDATE invitation SET accepted_at = ?, accepted_user_id = ?
       WHERE token_hash = ? AND accepted_at IS NULL`,
    )
    .run(Date.now(), userId, hashToken(token))
}

export function listInvitations(): Invitation[] {
  const rows = sqlite
    .prepare(`SELECT * FROM invitation ORDER BY created_at DESC LIMIT 100`)
    .all() as InvitationRow[]
  return rows.map(toInvitation)
}

export function deleteInvitation(id: string) {
  sqlite.prepare(`DELETE FROM invitation WHERE id = ?`).run(id)
}
