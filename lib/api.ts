import { NextResponse } from 'next/server'
import { ChallengeError } from '@/lib/challenge-store'
import { StoreUnavailableError } from '@/lib/db/couch'

export function apiError(error: unknown) {
  if (error instanceof ChallengeError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }
  if (error instanceof StoreUnavailableError) {
    console.error('[api]', error.message)
    return NextResponse.json(
      { error: 'The progress database is unavailable. Please try again shortly.' },
      { status: 503 },
    )
  }
  console.error('[api] Unexpected error', error)
  return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
}

export function pdfResponse(pdf: Buffer, filename: string) {
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
