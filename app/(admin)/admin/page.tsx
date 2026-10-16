import { ShieldAlert } from 'lucide-react'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { InvitationsCard } from '@/components/admin/invitations-card'
import { SignupsCard } from '@/components/admin/signups-card'
import { UsersTable, type AdminUserRow } from '@/components/admin/users-table'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { getSignupsEnabled, listInvitations } from '@/lib/app-settings'
import { auth } from '@/lib/auth'
import { isMailConfigured } from '@/lib/mailer'
import { hasStrongAuth, isAdmin, requireSession } from '@/lib/session'

export const metadata: Metadata = { title: 'Admin' }

function toIso(value: Date | string | number | null | undefined) {
  return value ? new Date(value).toISOString() : null
}

export default async function AdminPage() {
  const session = await requireSession()
  if (!isAdmin(session)) notFound()

  if (!hasStrongAuth(session)) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ShieldAlert aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>Verify your session to continue</EmptyTitle>
          <EmptyDescription>
            {session.user.twoFactorEnabled
              ? 'The admin panel requires a session verified with 2FA or a passkey. Sign out and sign back in to verify.'
              : 'The admin panel requires a session verified with 2FA or a passkey. Set one up, then sign in again with it.'}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button nativeButton={false} render={<Link href="/settings?tab=security" />}>Open security settings</Button>
        </EmptyContent>
      </Empty>
    )
  }

  const { users } = await auth.api.listUsers({
    query: { limit: 500, sortBy: 'createdAt', sortDirection: 'desc' },
    headers: await headers(),
  })

  const rows: AdminUserRow[] = users.map((user) => {
    const extended = user as typeof user & { username?: string | null; twoFactorEnabled?: boolean | null }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      username: extended.username ?? null,
      role: user.role ?? 'user',
      banned: Boolean(user.banned),
      banReason: user.banReason ?? null,
      twoFactorEnabled: Boolean(extended.twoFactorEnabled),
      createdAt: toIso(user.createdAt) ?? new Date().toISOString(),
    }
  })

  const now = Date.now()
  const pendingInvites = listInvitations()
    .filter((invite) => !invite.acceptedAt && invite.expiresAt > now)
    .map((invite) => ({
      id: invite.id,
      email: invite.email,
      createdAt: new Date(invite.createdAt).toISOString(),
      expiresAt: new Date(invite.expiresAt).toISOString(),
    }))

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">Admin</h1>
        <p className="text-sm text-muted-foreground">
          Manage accounts, control sign-ups, and invite new people.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <SignupsCard enabled={getSignupsEnabled()} userCount={rows.length} />
        <InvitationsCard invitations={pendingInvites} mailConfigured={isMailConfigured()} />
      </div>
      <UsersTable users={rows} currentUserId={session.user.id} />
    </>
  )
}
