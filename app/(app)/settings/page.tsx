import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { SettingsTabs, type SettingsTab } from '@/components/settings/settings-tabs'
import { auth } from '@/lib/auth'
import { getNotificationSettings } from '@/lib/challenge-store'
import { isMailConfigured } from '@/lib/mailer'
import { toPublicNotificationSettings } from '@/lib/notification-settings'
import { getAuthMethod, isAdmin, requireSession } from '@/lib/session'

export const metadata: Metadata = { title: 'Settings' }

const TABS: SettingsTab[] = ['profile', 'security', 'notifications', 'danger']

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const [{ tab }, session] = await Promise.all([searchParams, requireSession()])
  const [settings, passkeys] = await Promise.all([
    getNotificationSettings(session.user.id),
    auth.api.listPasskeys({ headers: await headers() }).catch(() => []),
  ])

  const initialTab = TABS.includes(tab as SettingsTab) ? (tab as SettingsTab) : 'profile'

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your profile, sign-in security, and report notifications.
        </p>
      </div>
      <SettingsTabs
        initialTab={initialTab}
        user={{
          name: session.user.name,
          email: session.user.email,
          username: session.user.username ?? '',
          twoFactorEnabled: Boolean(session.user.twoFactorEnabled),
        }}
        authMethod={getAuthMethod(session)}
        isAdmin={isAdmin(session)}
        passkeys={passkeys.map((passkey) => ({
          id: passkey.id,
          name: passkey.name ?? null,
          deviceType: passkey.deviceType,
          backedUp: passkey.backedUp,
          createdAt: new Date(passkey.createdAt).toISOString(),
        }))}
        notificationSettings={toPublicNotificationSettings(settings)}
        mailConfigured={isMailConfigured()}
      />
    </>
  )
}
