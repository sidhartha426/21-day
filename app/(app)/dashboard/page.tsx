import type { Metadata } from 'next'
import { ChallengeView } from '@/components/dashboard/challenge-view'
import { getActiveChallenge, getNotificationSettings } from '@/lib/challenge-store'
import { todayUtcIso } from '@/lib/dates'
import { requireSession } from '@/lib/session'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const session = await requireSession()
  const [challenge, settings] = await Promise.all([
    getActiveChallenge(session.user.id),
    getNotificationSettings(session.user.id),
  ])

  const channels = [
    ...(settings.emailEnabled ? ['email'] : []),
    ...(settings.ntfyEnabled && settings.ntfyTopic ? ['ntfy'] : []),
  ]

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          Hi {session.user.name.split(' ')[0]}, keep the streak going
        </h1>
        <p className="text-sm text-muted-foreground">Log each day, fix mistakes anytime, and finish all 21 days.</p>
      </div>
      <ChallengeView initialChallenge={challenge} notificationChannels={channels} todayUtc={todayUtcIso()} />
    </>
  )
}
