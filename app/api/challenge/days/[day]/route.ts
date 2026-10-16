import { after, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiError } from '@/lib/api'
import { CHALLENGE_DAYS, MAX_SESSIONS_PER_DAY } from '@/lib/challenge'
import { markCompletionNotified, updateDay, type DayUpdate } from '@/lib/challenge-store'
import { sendChallengeReport } from '@/lib/notify'
import { getApiSession } from '@/lib/session'

const daySchema = z.coerce.number().int().min(1).max(CHALLENGE_DAYS)
const setSchema = z.object({
  sessions: z.number().int().min(0).max(MAX_SESSIONS_PER_DAY),
})

async function applyUpdate(params: Promise<{ day: string }>, build: (day: number) => DayUpdate | Response) {
  const { session, unauthorized } = await getApiSession()
  if (unauthorized) return unauthorized

  const day = daySchema.safeParse((await params).day)
  if (!day.success) return NextResponse.json({ error: 'Invalid day.' }, { status: 400 })

  const update = build(day.data)
  if (update instanceof Response) return update

  try {
    const { challenge, justCompleted } = await updateDay(session.user.id, update)
    if (justCompleted && !challenge.completionNotifiedAt) {
      const user = session.user
      // Deliver the report after responding so the table stays snappy.
      after(async () => {
        const result = await sendChallengeReport(user, challenge)
        if (result.email === 'sent' || result.ntfy === 'sent') {
          await markCompletionNotified(user.id)
        }
      })
    }
    return NextResponse.json({ challenge, justCompleted })
  } catch (error) {
    return apiError(error)
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ day: string }> }) {
  const body = setSchema.safeParse(await request.json().catch(() => null))
  return applyUpdate(params, (day) =>
    body.success
      ? { action: 'set', day, sessions: body.data.sessions }
      : NextResponse.json(
          { error: 'Sessions must be a whole number between 0 and 10000.' },
          { status: 400 },
        ),
  )
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ day: string }> }) {
  return applyUpdate(params, (day) => ({ action: 'clear', day }))
}
