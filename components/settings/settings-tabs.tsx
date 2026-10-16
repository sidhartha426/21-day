'use client'

import { Bell, ShieldCheck, TriangleAlert, UserRound } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { DangerZone } from '@/components/settings/danger-zone'
import { NotificationsSection } from '@/components/settings/notifications-section'
import { ProfileSection } from '@/components/settings/profile-section'
import { SecuritySection, type PasskeySummary } from '@/components/settings/security-section'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { AuthMethod } from '@/lib/auth'
import type { PublicNotificationSettings } from '@/lib/notification-settings'

export type SettingsTab = 'profile' | 'security' | 'notifications' | 'danger'

export type SettingsUser = {
  name: string
  email: string
  username: string
  twoFactorEnabled: boolean
}

export function SettingsTabs({
  initialTab,
  user,
  authMethod,
  isAdmin,
  passkeys,
  notificationSettings,
  mailConfigured,
}: {
  initialTab: SettingsTab
  user: SettingsUser
  authMethod: AuthMethod
  isAdmin: boolean
  passkeys: PasskeySummary[]
  notificationSettings: PublicNotificationSettings
  mailConfigured: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [tab, setTab] = useState<SettingsTab>(initialTab)

  function handleTabChange(value: unknown) {
    const next = value as SettingsTab
    setTab(next)
    router.replace(`${pathname}?tab=${next}`, { scroll: false })
  }

  return (
    <Tabs value={tab} onValueChange={handleTabChange} className="gap-6">
      <div className="no-scrollbar overflow-x-auto overflow-y-hidden">
        <TabsList>
          <TabsTrigger value="profile">
            <UserRound aria-hidden="true" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security">
            <ShieldCheck aria-hidden="true" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell aria-hidden="true" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="danger">
            <TriangleAlert aria-hidden="true" />
            Danger zone
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="profile">
        <ProfileSection user={user} />
      </TabsContent>
      <TabsContent value="security">
        <SecuritySection
          twoFactorEnabled={user.twoFactorEnabled}
          authMethod={authMethod}
          isAdmin={isAdmin}
          passkeys={passkeys}
        />
      </TabsContent>
      <TabsContent value="notifications">
        <NotificationsSection
          email={user.email}
          initialSettings={notificationSettings}
          mailConfigured={mailConfigured}
        />
      </TabsContent>
      <TabsContent value="danger">
        <DangerZone isAdmin={isAdmin} />
      </TabsContent>
    </Tabs>
  )
}
