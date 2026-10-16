import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getNotificationSettings } from '@/lib/challenge-store'
import { sendTestNotification } from '@/lib/notify'
import { getApiSession } from '@/lib/session'

const testSchema = z.object({ channel: z.enum(['email', 'ntfy']) })

export async function POST(request: Request) {
  const { session, unauthorized } = await getApiSession()
  if (unauthorized) return unauthorized

  const parsed = testSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid channel.' }, { status: 400 })

  try {
    const settings = await getNotificationSettings(session.user.id)
    await sendTestNotification(session.user, parsed.data.channel, settings)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sending the test failed.'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
