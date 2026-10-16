import { NextResponse } from 'next/server'
import { z } from 'zod'
import { apiError } from '@/lib/api'
import { isValidIsoDate } from '@/lib/challenge'
import {
  discardActiveChallenge,
  getActiveChallenge,
  startChallenge,
} from '@/lib/challenge-store'
import { getApiSession } from '@/lib/session'

const startSchema = z.object({
  startDate: z.string().refine(isValidIsoDate, 'Pick a valid start date.'),
  idealPerDay: z.number().int().min(1).max(1000),
})

export async function GET() {
  const { session, unauthorized } = await getApiSession()
  if (unauthorized) return unauthorized
  try {
    const challenge = await getActiveChallenge(session.user.id)
    return NextResponse.json({ challenge })
  } catch (error) {
    return apiError(error)
  }
}

export async function POST(request: Request) {
  const { session, unauthorized } = await getApiSession()
  if (unauthorized) return unauthorized
  const parsed = startSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input.' },
      { status: 400 },
    )
  }
  try {
    const challenge = await startChallenge(session.user.id, parsed.data)
    return NextResponse.json({ challenge }, { status: 201 })
  } catch (error) {
    return apiError(error)
  }
}

export async function DELETE() {
  const { session, unauthorized } = await getApiSession()
  if (unauthorized) return unauthorized
  try {
    await discardActiveChallenge(session.user.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return apiError(error)
  }
}
