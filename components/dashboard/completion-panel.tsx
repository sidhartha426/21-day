'use client'

import { Archive, Download, Send, ThumbsUp, TriangleAlert, Trophy } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { ConfirmButton } from '@/components/confirm-button'
import { StarRating } from '@/components/star-rating'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { verdictFor, type ChallengeSummary } from '@/lib/challenge'
import type { ActiveChallenge } from '@/lib/challenge-store'
import { downloadFile, fetchJson } from '@/lib/fetcher'
import { reportFilenameFor } from '@/lib/report-filename'
import { cn } from '@/lib/utils'

type ChannelStatus = 'sent' | 'disabled' | 'failed' | 'unconfigured'

const toneStyles = {
  celebrate: {
    card: 'border-primary/40 bg-primary/5',
    icon: 'bg-primary text-primary-foreground',
    Icon: Trophy,
  },
  encourage: {
    card: 'border-chart-3/50 bg-chart-3/10',
    icon: 'bg-chart-3 text-foreground',
    Icon: ThumbsUp,
  },
  reprimand: {
    card: 'border-destructive/40 bg-destructive/5',
    icon: 'bg-destructive text-white',
    Icon: TriangleAlert,
  },
} as const

export function CompletionPanel({
  challenge,
  summary,
  notificationChannels,
  onFinished,
}: {
  challenge: ActiveChallenge
  summary: ChallengeSummary
  notificationChannels: string[]
  onFinished: () => void
}) {
  const verdict = verdictFor(summary.stars)
  const tone = toneStyles[verdict.tone]
  const [saving, setSaving] = useState(false)
  const [resending, setResending] = useState(false)
  const [notified, setNotified] = useState(Boolean(challenge.completionNotifiedAt))

  async function handleSave() {
    setSaving(true)
    try {
      await fetchJson('/api/challenge/finish', {
        method: 'POST',
        body: JSON.stringify({ mode: 'save' }),
      })
      toast.success('Challenge saved to history.', {
        action: { label: 'View history', onClick: () => window.location.assign('/history') },
      })
      onFinished()
    } catch (error) {
      toast.error((error as Error).message)
      setSaving(false)
    }
  }

  async function handleDiscard() {
    try {
      await downloadFile('/api/challenge/report', reportFilenameFor(challenge.config))
      await fetchJson('/api/challenge/finish', {
        method: 'POST',
        body: JSON.stringify({ mode: 'discard' }),
      })
      toast.success('PDF downloaded and challenge discarded.')
      onFinished()
    } catch (error) {
      toast.error((error as Error).message)
    }
  }

  async function handleResend() {
    setResending(true)
    try {
      const { result } = await fetchJson<{ result: { email: ChannelStatus; ntfy: ChannelStatus } }>(
        '/api/challenge/report',
        { method: 'POST' },
      )
      const sent = Object.entries(result)
        .filter(([, status]) => status === 'sent')
        .map(([channel]) => channel)
      const failed = Object.entries(result)
        .filter(([, status]) => status === 'failed')
        .map(([channel]) => channel)
      if (sent.length > 0) {
        setNotified(true)
        toast.success(`Report sent via ${sent.join(' and ')}.`)
      }
      if (failed.length > 0) toast.error(`Sending via ${failed.join(' and ')} failed.`)
      if (sent.length === 0 && failed.length === 0) toast.info('No notification channels are enabled.')
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setResending(false)
    }
  }

  return (
    <Card className={cn('border', tone.card)} aria-labelledby="completion-title">
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div
              className={cn('flex size-12 shrink-0 items-center justify-center rounded-xl', tone.icon)}
            >
              <tone.Icon className="size-6" aria-hidden="true" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Challenge complete
              </p>
              <h2 id="completion-title" className="text-xl font-semibold tracking-tight text-balance">
                {verdict.title}
              </h2>
              <p className="max-w-prose text-sm leading-relaxed text-muted-foreground text-pretty">
                {verdict.message}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-1 sm:items-end">
            <StarRating scorePct={summary.scorePct} size="lg" />
            <p className="font-mono text-3xl font-semibold tabular-nums tracking-tight">
              {summary.scorePct.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">
              <span className="font-mono tabular-nums">{summary.totalSessions}</span> of{' '}
              <span className="font-mono tabular-nums">{summary.idealTotal}</span> ideal sessions
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border bg-background/60 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground">
            {notificationChannels.length === 0 ? (
              <>
                No notifications configured.{' '}
                <Link href="/settings?tab=notifications" className="text-foreground underline underline-offset-4">
                  Set up email or ntfy
                </Link>{' '}
                to receive reports automatically.
              </>
            ) : notified ? (
              <>Your PDF report was sent via {notificationChannels.join(' and ')}.</>
            ) : (
              <>
                Your PDF report is on its way via {notificationChannels.join(' and ')}. Resend it if
                it doesn&apos;t arrive.
              </>
            )}
          </p>
          {notificationChannels.length > 0 && (
            <Button size="sm" variant="outline" onClick={handleResend} disabled={resending}>
              {resending ? <Spinner /> : <Send aria-hidden="true" />}
              Resend report
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Spinner /> : <Archive aria-hidden="true" />}
            Save to history
          </Button>
          <ConfirmButton
            variant="outline"
            title="Download and discard?"
            description="The PDF report will download, then this challenge is permanently deleted without saving it to your history."
            confirmLabel="Download and discard"
            onConfirm={handleDiscard}
          >
            <Download aria-hidden="true" />
            Download PDF and discard
          </ConfirmButton>
        </div>
      </CardContent>
    </Card>
  )
}
