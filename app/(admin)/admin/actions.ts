'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { z } from 'zod'
import { createInvitation, deleteInvitation, setSignupsEnabled } from '@/lib/app-settings'
import { auth, baseURL } from '@/lib/auth'
import { purgeUserData } from '@/lib/challenge-store'
import { sqlite } from '@/lib/db/sqlite'
import { isMailConfigured, renderEmail, sendMail } from '@/lib/mailer'
import { assertStrongAdmin } from '@/lib/session'

export type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: string }

const userIdSchema = z.string().min(1).max(100)

function failure(error: unknown): { ok: false; error: string } {
  return { ok: false, error: error instanceof Error ? error.message : 'Something went wrong.' }
}

async function assertManageableUser(userId: string) {
  const session = await assertStrongAdmin()
  const id = userIdSchema.parse(userId)
  if (id === session.user.id) throw new Error('You cannot perform this action on your own account.')
  const target = sqlite.prepare(`SELECT role FROM user WHERE id = ?`).get(id) as
    | { role: string | null }
    | undefined
  if (!target) throw new Error('User not found.')
  if (target.role === 'admin') throw new Error('The administrator account is protected.')
  return id
}

export async function setSignupsEnabledAction(enabled: boolean): Promise<ActionResult> {
  try {
    await assertStrongAdmin()
    setSignupsEnabled(z.boolean().parse(enabled))
    revalidatePath('/admin')
    return { ok: true }
  } catch (error) {
    return failure(error)
  }
}

export async function inviteUserAction(
  rawEmail: string,
): Promise<ActionResult<{ link: string; emailed: boolean }>> {
  try {
    const session = await assertStrongAdmin()
    const parsed = z.email().max(254).safeParse(rawEmail.trim().toLowerCase())
    if (!parsed.success) throw new Error('Enter a valid email address.')
    const email = parsed.data

    const existing = sqlite.prepare(`SELECT 1 FROM user WHERE lower(email) = ?`).get(email)
    if (existing) throw new Error('A user with this email already exists.')

    const { token } = createInvitation(email, session.user.id)
    const link = `${baseURL}/sign-up?invite=${encodeURIComponent(token)}`

    let emailed = false
    if (isMailConfigured()) {
      await sendMail({
        to: email,
        subject: "You're invited to 21-day",
        text: `${session.user.name} invited you to join 21-day. Create your account: ${link}\n\nThis link expires in 7 days.`,
        html: renderEmail({
          heading: "You're invited",
          body: `${session.user.name} invited you to track a 21-day challenge. This link expires in 7 days.`,
          action: { label: 'Accept invite', url: link },
        }),
      })
      emailed = true
    }

    revalidatePath('/admin')
    return { ok: true, link, emailed }
  } catch (error) {
    return failure(error)
  }
}

export async function revokeInvitationAction(id: string): Promise<ActionResult> {
  try {
    await assertStrongAdmin()
    deleteInvitation(z.string().min(1).max(100).parse(id))
    revalidatePath('/admin')
    return { ok: true }
  } catch (error) {
    return failure(error)
  }
}

export async function banUserAction(userId: string, reason: string): Promise<ActionResult> {
  try {
    const id = await assertManageableUser(userId)
    await auth.api.banUser({
      body: { userId: id, banReason: reason.trim().slice(0, 200) || undefined },
      headers: await headers(),
    })
    revalidatePath('/admin')
    return { ok: true }
  } catch (error) {
    return failure(error)
  }
}

export async function unbanUserAction(userId: string): Promise<ActionResult> {
  try {
    const id = await assertManageableUser(userId)
    await auth.api.unbanUser({ body: { userId: id }, headers: await headers() })
    revalidatePath('/admin')
    return { ok: true }
  } catch (error) {
    return failure(error)
  }
}

export async function revokeSessionsAction(userId: string): Promise<ActionResult> {
  try {
    const id = await assertManageableUser(userId)
    await auth.api.revokeUserSessions({ body: { userId: id }, headers: await headers() })
    return { ok: true }
  } catch (error) {
    return failure(error)
  }
}

export async function removeUserAction(userId: string): Promise<ActionResult> {
  try {
    const id = await assertManageableUser(userId)
    await auth.api.removeUser({ body: { userId: id }, headers: await headers() })
    await purgeUserData(id)
    revalidatePath('/admin')
    return { ok: true }
  } catch (error) {
    return failure(error)
  }
}
