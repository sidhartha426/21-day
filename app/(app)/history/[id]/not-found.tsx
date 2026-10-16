import { SearchX } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

export default function HistoryEntryNotFound() {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchX aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>Challenge not found</EmptyTitle>
        <EmptyDescription>This challenge doesn&apos;t exist in your history, or it was deleted.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button nativeButton={false} render={<Link href="/history" />}>
          Back to history
        </Button>
      </EmptyContent>
    </Empty>
  )
}
