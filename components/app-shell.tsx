import { ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { AccountThemeSync } from '@/components/account-theme-sync'
import { AppHeader } from '@/components/app-header'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { Session } from '@/lib/auth'
import { hasStrongAuth, isAdmin } from '@/lib/session'

export function AppShell({ session, children }: { session: Session; children: React.ReactNode }) {
  const admin = isAdmin(session)
  const needsStrongAuth = admin && !hasStrongAuth(session)

  return (
    <div className="flex min-h-dvh flex-col">
      <AccountThemeSync savedTheme={session.user.theme ?? null} />
      <AppHeader
        user={{
          name: session.user.name,
          email: session.user.email,
          username: session.user.username ?? null,
        }}
        isAdmin={admin}
      />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 md:px-6 md:py-10">
        {needsStrongAuth && (
          <Alert>
            <ShieldAlert aria-hidden="true" />
            <AlertTitle>Secure your admin session</AlertTitle>
            <AlertDescription>
              <p>
                The admin panel requires a session verified with two-factor authentication or a passkey.{' '}
                <Link href="/settings?tab=security" className="font-medium text-foreground underline underline-offset-4">
                  Set up 2FA or a passkey
                </Link>
                , then sign in again.
              </p>
            </AlertDescription>
          </Alert>
        )}
        {children}
      </main>
    </div>
  )
}
