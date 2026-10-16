import { Lock } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { SignUpForm } from '@/components/auth/sign-up-form'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { findValidInvitation, getSignupsEnabled } from '@/lib/app-settings'
import { countUsers } from '@/lib/db/sqlite'
import { getSession } from '@/lib/session'

export const metadata: Metadata = { title: 'Create account' }

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>
}) {
  const session = await getSession()
  if (session) redirect('/dashboard')

  const { invite } = await searchParams
  const isFirstUser = countUsers() === 0
  const invitation = invite ? findValidInvitation(invite) : null

  if (invite && !invitation) {
    return (
      <Closed
        title="Invitation not valid"
        description="This invitation link has expired or was already used. Ask the administrator to send a new one."
      />
    )
  }

  if (!isFirstUser && !invitation && !getSignupsEnabled()) {
    return (
      <Closed
        title="Sign-ups are closed"
        description="New accounts are currently invite-only. Ask the administrator for an invitation."
      />
    )
  }

  return (
    <SignUpForm
      isFirstUser={isFirstUser}
      inviteToken={invitation ? invite : undefined}
      invitedEmail={invitation?.email}
    />
  )
}

function Closed({ title, description }: { title: string; description: string }) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Lock aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" nativeButton={false} render={<Link href="/sign-in" />}>
          Back to sign in
        </Button>
      </EmptyContent>
    </Empty>
  )
}
