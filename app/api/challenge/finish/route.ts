import { NextResponse } from 'next/server'
import { z } from 'zod'
import { apiError } from '@/lib/api'
import { summarize } from '@/lib/challenge'
import {
  archiveActiveChallenge,
  discardActiveChallenge,
  getActiveChallenge,
} from '@/lib/challenge-store'
import { getApiSession } from '@/lib/session'

const finishSchema = z.object({ mode: z.enum(['save', 'discard']) })

export async function POST(request: Request) {
  const { session, unauthorized } = await getApiSession()
  if (unauthorized) return unauthorized
  const parsed = finishSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid mode.' }, { status: 400 })

  try {
    if (parsed.data.mode === 'save') {
      const entry = await archiveActiveChallenge(session.user.id)
      return NextResponse.json({ historyId: entry.historyId })
    }
    const challenge = await getActiveChallenge(session.user.id)
    if (!challenge || !summarize(challenge.config, challenge.rows).isComplete) {
      return NextResponse.json(
        { error: 'Only a completed challenge can be finished this way.' },
        { status: 400 },
      )
    }
    await discardActiveChallenge(session.user.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return apiError(error)
  }
}
