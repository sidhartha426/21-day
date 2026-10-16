import { Flame } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export function Brand({ className, href = '/' }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn('flex items-center gap-2 font-semibold tracking-tight', className)}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Flame className="size-4" aria-hidden="true" />
      </span>
      <span>
        21<span className="text-muted-foreground">-</span>day
      </span>
    </Link>
  )
}
