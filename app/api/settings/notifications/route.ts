import { NextResponse } from 'next/server'
import { apiError } from '@/lib/api'
import { getNotificationSettings, saveNotificationSettings } from '@/lib/challenge-store'
import { isMailConfigured } from '@/lib/mailer'
import {
  notificationSettingsSchema,
  toPublicNotificationSettings,
} from '@/lib/notification-settings'
import { normalizeNtfyServer } from '@/lib/notify'
import { getApiSession } from '@/lib/session'

export async function GET() {
  const { session, unauthorized } = await getApiSession()
  if (unauthorized) return unauthorized
  try {
    const settings = await getNotificationSettings(session.user.id)
    return NextResponse.json({
      settings: toPublicNotificationSettings(settings),
      mailConfigured: isMailConfigured(),
    })
  } catch (error) {
    return apiError(error)
  }
}

export async function PUT(request: Request) {
  const { session, unauthorized } = await getApiSession()
  if (unauthorized) return unauthorized

  const parsed = notificationSettingsSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid settings.' },
      { status: 400 },
    )
  }

  const { ntfyToken, ...rest } = parsed.data
  let ntfyServer: string
  try {
    ntfyServer = normalizeNtfyServer(rest.ntfyServer || 'https://ntfy.sh')
  } catch {
    return NextResponse.json({ error: 'Enter a valid http(s) ntfy server URL.' }, { status: 400 })
  }

  if (rest.emailEnabled && !isMailConfigured()) {
    return NextResponse.json(
      { error: 'Email notifications are unavailable because SMTP is not configured on the server.' },
      { status: 400 },
    )
  }

  try {
    const saved = await saveNotificationSettings(session.user.id, {
      ...rest,
      ntfyServer,
      ...(ntfyToken === undefined ? {} : { ntfyToken: ntfyToken ?? '' }),
    })
    return NextResponse.json({ settings: toPublicNotificationSettings(saved) })
  } catch (error) {
    return apiError(error)
  }
}
