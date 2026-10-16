import { NextResponse } from 'next/server'
import { apiError } from '@/lib/api'
import { deleteHistoryEntry, getHistoryEntry } from '@/lib/challenge-store'
import { getApiSession } from '@/lib/session'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { session, unauthorized } = await getApiSession()
  if (unauthorized) return unauthorized
  try {
    const entry = await getHistoryEntry(session.user.id, (await params).id)
    if (!entry) return NextResponse.json({ error: 'Not found.' }, { status: 404 })
    return NextResponse.json({ entry })
  } catch (error) {
    return apiError(error)
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { session, unauthorized } = await getApiSession()
  if (unauthorized) return unauthorized
  try {
    await deleteHistoryEntry(session.user.id, (await params).id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return apiError(error)
  }
}
