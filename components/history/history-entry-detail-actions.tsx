'use client'

import { useRouter } from 'next/navigation'
import { HistoryEntryActions } from '@/components/history/history-entry-actions'
import type { ChallengeConfig } from '@/lib/challenge'

export function HistoryEntryDetailActions({
  historyId,
  config,
}: {
  historyId: string
  config: ChallengeConfig
}) {
  const router = useRouter()
  return (
    <HistoryEntryActions
      historyId={historyId}
      config={config}
      onDeleted={() => {
        router.push('/history')
        router.refresh()
      }}
    />
  )
}
