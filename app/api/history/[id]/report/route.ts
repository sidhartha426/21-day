import { NextResponse } from 'next/server'
import { apiError, pdfResponse } from '@/lib/api'
import { getHistoryEntry } from '@/lib/challenge-store'
import { renderChallengePdf, reportFilename } from '@/lib/pdf'
import { getApiSession } from '@/lib/session'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, unauthorized } = await getApiSession()
  if (unauthorized) return unauthorized
  try {
    const entry = await getHistoryEntry(session.user.id, (await params).id)
    if (!entry) return NextResponse.json({ error: 'Not found.' }, { status: 404 })
    const pdf = await renderChallengePdf({
      config: entry.config,
      rows: entry.rows,
      ownerName: session.user.name,
      completedAt: entry.completedAt,
    })
    return pdfResponse(pdf, reportFilename(entry.config))
  } catch (error) {
    return apiError(error)
  }
}
