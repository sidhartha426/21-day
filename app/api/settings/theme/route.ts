import { NextResponse } from 'next/server'
import { apiError } from '@/lib/api'
import { auth } from '@/lib/auth'
import { getApiSession } from '@/lib/session'
import { themePreferenceSchema } from '@/lib/theme'

export async function PUT(request: Request) {
  const { session, unauthorized } = await getApiSession()
  if (unauthorized) return unauthorized

  const parsed = themePreferenceSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Choose light, dark, or system.' }, { status: 400 })
  }

  try {
    // `theme` is a server-only user field (input: false), so it is written through the
    // internal adapter instead of the public updateUser endpoint.
    const ctx = await auth.$context
    await ctx.internalAdapter.updateUser(session.user.id, { theme: parsed.data.theme })
    return NextResponse.json({ theme: parsed.data.theme })
  } catch (error) {
    return apiError(error)
  }
}
