'use client'

import { ArrowRight, History, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import useSWR from 'swr'
import { ConfirmButton } from '@/components/confirm-button'
import { formatUtcDate } from '@/lib/dates'
import { HistoryEntryActions } from '@/components/history/history-entry-actions'
import { StarRating } from '@/components/star-rating'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import type { HistoryEntry } from '@/lib/challenge-store'
import { fetcher, fetchJson } from '@/lib/fetcher'

type HistoryResponse = { entries: HistoryEntry[] }

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-mono text-sm font-medium tabular-nums">{value}</dd>
    </div>
  )
}

export function HistoryList({ initialEntries }: { initialEntries: HistoryEntry[] }) {
  const { data, mutate } = useSWR<HistoryResponse>('/api/history', fetcher, {
    fallbackData: { entries: initialEntries },
    revalidateOnMount: false,
  })
  const entries = data?.entries ?? []

  async function handleDeleteAll() {
    try {
      const { removed } = await fetchJson<{ removed: number }>('/api/history', { method: 'DELETE' })
      await mutate({ entries: [] }, { revalidate: false })
      toast.success(`Deleted ${removed} ${removed === 1 ? 'entry' : 'entries'}.`)
    } catch (error) {
      toast.error((error as Error).message)
    }
  }

  if (entries.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <History aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>No saved challenges yet</EmptyTitle>
          <EmptyDescription>
            Finish a 21-day challenge and choose &quot;Save to history&quot; to keep a read-only record here.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button nativeButton={false} render={<Link href="/dashboard" />}>
            Go to dashboard
            <ArrowRight aria-hidden="true" />
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-mono tabular-nums">{entries.length}</span> saved{' '}
          {entries.length === 1 ? 'challenge' : 'challenges'}
        </p>
        <ConfirmButton
          size="sm"
          variant="outline"
          className="text-destructive hover:text-destructive"
          title="Delete all history?"
          description="Every saved challenge will be permanently deleted. This cannot be undone."
          confirmLabel="Delete all"
          onConfirm={handleDeleteAll}
        >
          <Trash2 aria-hidden="true" />
          Delete all history
        </ConfirmButton>
      </div>

      <ul className="flex flex-col gap-3">
        {entries.map((entry) => {
          const endDate = entry.rows[entry.rows.length - 1]?.date ?? entry.config.startDate
          return (
            <li key={entry.historyId}>
              <Card size="sm">
                <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-8">
                    <div className="flex flex-col gap-1.5">
                      <Link
                        href={`/history/${entry.historyId}`}
                        className="font-medium hover:underline hover:underline-offset-4"
                      >
                        {formatUtcDate(entry.config.startDate)} - {formatUtcDate(endDate)}
                      </Link>
                      <StarRating scorePct={entry.scorePct} size="sm" />
                    </div>
                    <dl className="grid grid-cols-3 gap-6">
                      <Stat label="Score" value={`${entry.scorePct.toFixed(1)}%`} />
                      <Stat label="Sessions" value={String(entry.totalSessions)} />
                      <Stat label="Ideal / day" value={String(entry.config.idealPerDay)} />
                    </dl>
                  </div>
                  <HistoryEntryActions
                    historyId={entry.historyId}
                    config={entry.config}
                    showView
                    onDeleted={() =>
                      mutate(
                        { entries: entries.filter((e) => e.historyId !== entry.historyId) },
                        { revalidate: false },
                      )
                    }
                  />
                </CardContent>
              </Card>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
