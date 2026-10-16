import { Flame } from "lucide-react"
import { cn } from "@/lib/utils"

export function Brand({ className, href = "#top" }: { className?: string; href?: string }) {
  return (
    <a
      href={href}
      className={cn("flex items-center gap-2 font-semibold tracking-tight", className)}
      aria-label="21-day home"
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Flame className="size-4" aria-hidden="true" />
      </span>
      <span>
        21<span className="text-muted-foreground">-</span>day
      </span>
    </a>
  )
}
