import { randomBytes } from 'node:crypto'
import {
  buildRows,
  MAX_SESSIONS_PER_DAY,
  summarize,
  type ChallengeConfig,
  type DayRow,
} from '@/lib/challenge'
import { store, type Doc } from '@/lib/db/couch'

export type ActiveChallenge = {
  type: 'active'
  userId: string
  config: ChallengeConfig
  rows: DayRow[]
  createdAt: string
  updatedAt: string
  completionNotifiedAt?: string | null
}

export type HistoryEntry = {
  type: 'history'
  userId: string
  historyId: string
  config: ChallengeConfig
  rows: DayRow[]
  scorePct: number
  stars: number
  totalSessions: number
  createdAt: string
  completedAt: string
}

export type NotificationSettings = {
  type: 'settings'
  userId: string
  emailEnabled: boolean
  ntfyEnabled: boolean
  ntfyServer: string
  ntfyTopic: string
  ntfyToken: string
}

export class ChallengeError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message)
  }
}

const userPrefix = (userId: string) => `user:${userId}:`
const activeId = (userId: string) => `${userPrefix(userId)}active`
const settingsId = (userId: string) => `${userPrefix(userId)}settings`
const historyPrefix = (userId: string) => `${userPrefix(userId)}history:`
const historyDocId = (userId: string, historyId: string) =>
  `${historyPrefix(userId)}${historyId}`

export function getActiveChallenge(userId: string) {
  return store.get<ActiveChallenge>(activeId(userId))
}

export async function startChallenge(userId: string, config: ChallengeConfig) {
  const existing = await getActiveChallenge(userId)
  if (existing) {
    throw new ChallengeError('You already have an active challenge.', 409)
  }
  const now = new Date().toISOString()
  return store.put<ActiveChallenge>({
    _id: activeId(userId),
    type: 'active',
    userId,
    config,
    rows: buildRows(config.startDate),
    createdAt: now,
    updatedAt: now,
    completionNotifiedAt: null,
  })
}

export type DayUpdate =
  | { action: 'set'; day: number; sessions: number }
  | { action: 'clear'; day: number }

export async function updateDay(userId: string, update: DayUpdate) {
  const challenge = await getActiveChallenge(userId)
  if (!challenge) throw new ChallengeError('No active challenge found.', 404)

  const index = update.day - 1
  const row = challenge.rows[index]
  if (!row) throw new ChallengeError('That day does not exist.')

  const wasComplete = summarize(challenge.config, challenge.rows).isComplete

  if (update.action === 'set') {
    if (
      !Number.isInteger(update.sessions) ||
      update.sessions < 0 ||
      update.sessions > MAX_SESSIONS_PER_DAY
    ) {
      throw new ChallengeError('Sessions must be a whole number between 0 and 10000.')
    }
    const nextIndex = challenge.rows.findIndex((r) => !r.dayCompleted)
    if (!row.dayCompleted && index !== nextIndex) {
      throw new ChallengeError('Complete the days in order. Finish the next pending day first.')
    }
    challenge.rows[index] = { ...row, sessionsCompleted: update.sessions, dayCompleted: true }
  } else {
    if (!row.dayCompleted) throw new ChallengeError('That day is not completed yet.')
    challenge.rows[index] = { ...row, sessionsCompleted: 0, dayCompleted: false }
  }

  const isComplete = summarize(challenge.config, challenge.rows).isComplete
  // Re-arm the completion notification if the challenge was re-opened.
  if (!isComplete) challenge.completionNotifiedAt = null
  challenge.updatedAt = new Date().toISOString()

  const saved = await store.put<ActiveChallenge>(challenge)
  return { challenge: saved, justCompleted: isComplete && !wasComplete }
}

export async function markCompletionNotified(userId: string) {
  await store.update<ActiveChallenge>(activeId(userId), (challenge) => ({
    ...challenge,
    completionNotifiedAt: new Date().toISOString(),
  }))
}

export async function discardActiveChallenge(userId: string) {
  await store.remove(activeId(userId))
}

export async function archiveActiveChallenge(userId: string) {
  const challenge = await getActiveChallenge(userId)
  if (!challenge) throw new ChallengeError('No active challenge found.', 404)
  const summary = summarize(challenge.config, challenge.rows)
  if (!summary.isComplete) {
    throw new ChallengeError('Finish all 21 days before saving the challenge.')
  }

  const completedAt = new Date().toISOString()
  // Time-ordered id keeps CouchDB's _all_docs prefix listing chronological.
  const historyId = `${Date.now().toString(36).padStart(9, '0')}-${randomBytes(3).toString('hex')}`
  const entry = await store.put<HistoryEntry>({
    _id: historyDocId(userId, historyId),
    type: 'history',
    userId,
    historyId,
    config: challenge.config,
    rows: challenge.rows,
    scorePct: summary.scorePct,
    stars: summary.stars,
    totalSessions: summary.totalSessions,
    createdAt: challenge.createdAt,
    completedAt,
  })
  await store.remove(challenge._id)
  return entry
}

export async function listHistory(userId: string) {
  const entries = await store.listByPrefix<HistoryEntry>(historyPrefix(userId))
  return entries.reverse()
}

export function getHistoryEntry(userId: string, historyId: string) {
  if (!/^[a-z0-9-]+$/.test(historyId)) return Promise.resolve(null)
  return store.get<HistoryEntry>(historyDocId(userId, historyId))
}

export async function deleteHistoryEntry(userId: string, historyId: string) {
  if (!/^[a-z0-9-]+$/.test(historyId)) return
  await store.remove(historyDocId(userId, historyId))
}

export function deleteAllHistory(userId: string) {
  return store.removeByPrefix(historyPrefix(userId))
}

export function purgeUserData(userId: string) {
  return store.removeByPrefix(userPrefix(userId))
}

export const DEFAULT_NTFY_SERVER = process.env.NTFY_DEFAULT_SERVER ?? 'https://ntfy.sh'

export async function getNotificationSettings(
  userId: string,
): Promise<Doc<NotificationSettings>> {
  const existing = await store.get<NotificationSettings>(settingsId(userId))
  return (
    existing ?? {
      _id: settingsId(userId),
      type: 'settings',
      userId,
      emailEnabled: false,
      ntfyEnabled: false,
      ntfyServer: DEFAULT_NTFY_SERVER,
      ntfyTopic: '',
      ntfyToken: '',
    }
  )
}

export async function saveNotificationSettings(
  userId: string,
  update: Partial<Omit<NotificationSettings, 'type' | 'userId'>>,
) {
  const current = await getNotificationSettings(userId)
  return store.put<NotificationSettings>({ ...current, ...update })
}
