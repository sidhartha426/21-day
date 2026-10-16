import type * as React from "react"
import { cn } from "@/lib/utils"

export function BrowserFrame({
  url,
  className,
  children,
}: {
  url: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("overflow-hidden rounded-xl bg-card shadow-2xl ring-1 ring-foreground/10", className)}>
      <div className="flex items-center gap-3 border-b px-3 py-2">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-muted-foreground/30" />
          <span className="size-2.5 rounded-full bg-muted-foreground/30" />
          <span className="size-2.5 rounded-full bg-muted-foreground/30" />
        </div>
        <div className="mx-auto w-full max-w-xs truncate rounded-md bg-muted px-3 py-0.5 text-center font-mono text-xs text-muted-foreground">
          {url}
        </div>
        <div className="w-10" aria-hidden="true" />
      </div>
      {children}
    </div>
  )
}
