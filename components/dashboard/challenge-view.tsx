'use client'

import { Download, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'
import { CompletionPanel } from '@/components/dashboard/completion-panel'
import { DayTable } from '@/components/dashboard/day-table'
import { ProgressOverview } from '@/components/dashboard/progress-overview'
import { StartChallengeForm } from '@/components/dashboard/start-challenge-form'
import { ConfirmButton } from '@/components/confirm-button'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { summarize } from '@/lib/challenge'
import type { ActiveChallenge } from '@/lib/challenge-store'
import { downloadFile, fetcher, fetchJson } from '@/lib/fetcher'
import { reportFilenameFor } from '@/lib/report-filename'

type ChallengeResponse = { challenge: ActiveChallenge | null }

export function ChallengeView({
  initialChallenge,
  notificationChannels,
  todayUtc,
}: {
  initialChallenge: ActiveChallenge | null
  notificationChannels: string[]
  todayUtc: string
}) {
  const { data, mutate } = useSWR<ChallengeResponse>('/api/challenge', fetcher, {
    fallbackData: { challenge: initialChallenge },
    revalidateOnMount: false,
  })
  const [downloading, setDownloading] = useState(false)
  const challenge = data?.challenge ?? null

  if (!challenge) {
    return (
      <StartChallengeForm
        todayUtc={todayUtc}
        onStarted={(started) => mutate({ challenge: started }, { revalidate: false })}
      />
    )
  }

  const summary = summarize(challenge.config, challenge.rows)

  async function updateDay(day: number, sessions: number | null) {
    const result = await fetchJson<{ challenge: ActiveChallenge; justCompleted: boolean }>(
      `/api/challenge/days/${day}`,
      sessions === null
        ? { method: 'DELETE' }
        : { method: 'PATCH', body: JSON.stringify({ sessions }) },
    )
    await mutate({ challenge: result.challenge }, { revalidate: false })
    if (result.justCompleted) {
      toast.success('Challenge complete! See your results below.', {
        description:
          notificationChannels.length > 0
            ? `Your report is being sent via ${notificationChannels.join(' and ')}.`
            : undefined,
      })
    }
  }

  async function handleDownload() {
    setDownloading(true)
    try {
      await downloadFile('/api/challenge/report', reportFilenameFor(challenge!.config))
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setDownloading(false)
    }
  }

  async function handleAbandon() {
    try {
      await fetchJson('/api/challenge', { method: 'DELETE' })
      await mutate({ challenge: null }, { revalidate: false })
      toast.success('Challenge discarded.')
    } catch (error) {
      toast.error((error as Error).message)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {summary.isComplete && (
        <CompletionPanel
          challenge={challenge}
          summary={summary}
          notificationChannels={notificationChannels}
          onFinished={() => mutate({ challenge: null }, { revalidate: false })}
        />
      )}
      <ProgressOverview challenge={challenge} summary={summary} />
      <DayTable challenge={challenge} onUpdateDay={updateDay} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" onClick={handleDownload} disabled={downloading}>
          {downloading ? <Spinner /> : <Download aria-hidden="true" />}
          Download PDF
        </Button>
        {!summary.isComplete && (
          <ConfirmButton
            variant="ghost"
            className="text-muted-foreground"
            title="Abandon this challenge?"
            description="All progress for the current 21 days will be permanently deleted. This cannot be undone."
            confirmLabel="Abandon challenge"
            onConfirm={handleAbandon}
          >
            <RotateCcw aria-hidden="true" />
            Abandon and start over
          </ConfirmButton>
        )}
      </div>
    </div>
  )
}
