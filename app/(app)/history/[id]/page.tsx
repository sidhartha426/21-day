import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DayTable } from '@/components/dashboard/day-table'
import { ProgressOverview } from '@/components/dashboard/progress-overview'
import { HistoryEntryDetailActions } from '@/components/history/history-entry-detail-actions'
import { Button } from '@/components/ui/button'
import { summarize, verdictFor } from '@/lib/challenge'
import { getHistoryEntry } from '@/lib/challenge-store'
import { formatUtcDateTime } from '@/lib/dates'
import { requireSession } from '@/lib/session'

export const metadata: Metadata = { title: 'Saved challenge' }

export default async function HistoryEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireSession()
  const entry = await getHistoryEntry(session.user.id, id)
  if (!entry) notFound()

  const summary = summarize(entry.config, entry.rows)
  const verdict = verdictFor(summary.stars)

  return (
    <>
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
            nativeButton={false}
            render={<Link href="/history" />}
        >
          <ArrowLeft aria-hidden="true" />
          All history
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight text-balance">{verdict.title}</h1>
            <p className="text-sm text-muted-foreground">
              Completed {formatUtcDateTime(entry.completedAt)}. This record is
              read-only.
            </p>
          </div>
          <HistoryEntryDetailActions historyId={entry.historyId} config={entry.config} />
        </div>
      </div>
      <ProgressOverview challenge={entry} summary={summary} />
      <DayTable
        challenge={entry}
        title="Daily log"
        description="Sessions logged for each day of this challenge."
      />
    </>
  )
}
