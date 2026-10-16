'use client'

import { Download, Eye, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { ConfirmButton } from '@/components/confirm-button'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import type { ChallengeConfig } from '@/lib/challenge'
import { downloadFile, fetchJson } from '@/lib/fetcher'
import { reportFilenameFor } from '@/lib/report-filename'

export function HistoryEntryActions({
  historyId,
  config,
  showView = false,
  onDeleted,
}: {
  historyId: string
  config: ChallengeConfig
  showView?: boolean
  onDeleted: () => unknown
}) {
  const [downloading, setDownloading] = useState(false)

  async function handleDownload() {
    setDownloading(true)
    try {
      await downloadFile(`/api/history/${historyId}/report`, reportFilenameFor(config))
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setDownloading(false)
    }
  }

  async function handleDelete() {
    try {
      await fetchJson(`/api/history/${historyId}`, { method: 'DELETE' })
      toast.success('History entry deleted.')
      await onDeleted()
    } catch (error) {
      toast.error((error as Error).message)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {showView && (
        <Button size="sm" variant="outline" nativeButton={false} render={<Link href={`/history/${historyId}`} />}>
          <Eye aria-hidden="true" />
          View
        </Button>
      )}
      <Button size="sm" variant="outline" onClick={handleDownload} disabled={downloading}>
        {downloading ? <Spinner /> : <Download aria-hidden="true" />}
        PDF
      </Button>
      <ConfirmButton
        size="sm"
        variant="ghost"
        className="text-muted-foreground hover:text-destructive"
        title="Delete this entry?"
        description="This saved challenge will be permanently removed from your history."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      >
        <Trash2 aria-hidden="true" />
        Delete
      </ConfirmButton>
    </div>
  )
}
