import type { Metadata } from 'next'
import { HistoryList } from '@/components/history/history-list'
import { listHistory } from '@/lib/challenge-store'
import { requireSession } from '@/lib/session'

export const metadata: Metadata = { title: 'History' }

export default async function HistoryPage() {
  const session = await requireSession()
  const entries = await listHistory(session.user.id)

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">History</h1>
        <p className="text-sm text-muted-foreground">
          Read-only records of your completed challenges.
        </p>
      </div>
      <HistoryList initialEntries={entries} />
    </>
  )
}
