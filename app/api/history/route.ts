import { NextResponse } from 'next/server'
import { apiError } from '@/lib/api'
import { deleteAllHistory, listHistory } from '@/lib/challenge-store'
import { getApiSession } from '@/lib/session'

export async function GET() {
  const { session, unauthorized } = await getApiSession()
  if (unauthorized) return unauthorized
  try {
    const entries = await listHistory(session.user.id)
    return NextResponse.json({ entries })
  } catch (error) {
    return apiError(error)
  }
}

export async function DELETE() {
  const { session, unauthorized } = await getApiSession()
  if (unauthorized) return unauthorized
  try {
    const removed = await deleteAllHistory(session.user.id)
    return NextResponse.json({ removed })
  } catch (error) {
    return apiError(error)
  }
}
