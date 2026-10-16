import { NextResponse } from 'next/server'
import { apiError, pdfResponse } from '@/lib/api'
import { summarize } from '@/lib/challenge'
import { getActiveChallenge, markCompletionNotified } from '@/lib/challenge-store'
import { sendChallengeReport } from '@/lib/notify'
import { renderChallengePdf, reportFilename } from '@/lib/pdf'
import { getApiSession } from '@/lib/session'

export async function GET() {
  const { session, unauthorized } = await getApiSession()
  if (unauthorized) return unauthorized
  try {
    const challenge = await getActiveChallenge(session.user.id)
    if (!challenge) return NextResponse.json({ error: 'No active challenge.' }, { status: 404 })
    const pdf = await renderChallengePdf({
      config: challenge.config,
      rows: challenge.rows,
      ownerName: session.user.name,
    })
    return pdfResponse(pdf, reportFilename(challenge.config))
  } catch (error) {
    return apiError(error)
  }
}

export async function POST() {
  const { session, unauthorized } = await getApiSession()
  if (unauthorized) return unauthorized
  try {
    const challenge = await getActiveChallenge(session.user.id)
    if (!challenge || !summarize(challenge.config, challenge.rows).isComplete) {
      return NextResponse.json({ error: 'Finish the challenge first.' }, { status: 400 })
    }
    const result = await sendChallengeReport(session.user, challenge)
    if (result.email === 'sent' || result.ntfy === 'sent') {
      await markCompletionNotified(session.user.id)
    }
    return NextResponse.json({ result })
  } catch (error) {
    return apiError(error)
  }
}
