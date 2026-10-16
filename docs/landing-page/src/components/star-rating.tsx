import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

const STAR_COUNT = 5

// The lucide star spans x=2..22 inside its 24px viewBox, so a fill fraction is mapped
// onto that span to make "half a star" cover exactly half of the visible shape.
const STAR_LEFT = 2 / 24
const STAR_SPAN = 20 / 24

function clipPercent(fill: number) {
  if (fill <= 0) return 0
  if (fill >= 1) return 100
  return (STAR_LEFT + fill * STAR_SPAN) * 100
}

export function StarRating({
  scorePct,
  className,
  size = "md",
}: {
  scorePct: number
  className?: string
  size?: "sm" | "md" | "lg"
}) {
  const iconSize = size === "lg" ? "size-8" : size === "sm" ? "size-3.5" : "size-5"
  const safePct = Number.isFinite(scorePct) ? Math.min(Math.max(scorePct, 0), 100) : 0
  const value = (safePct / 100) * STAR_COUNT

  return (
    <div
      className={cn("flex items-center gap-1", className)}
      role="img"
      aria-label={`${Number(value.toFixed(2))} out of ${STAR_COUNT} stars`}
    >
      {Array.from({ length: STAR_COUNT }, (_, i) => {
        const width = clipPercent(value - i)
        return (
          <span key={i} className="relative inline-flex shrink-0" aria-hidden="true">
            <Star className={cn(iconSize, "fill-star-muted text-star-muted")} />
            {width > 0 && (
              <span
                className="absolute inset-y-0 left-0 overflow-hidden transition-[width] duration-300"
                style={{ width: `${width}%` }}
              >
                <Star className={cn(iconSize, "max-w-none fill-star text-star")} />
              </span>
            )}
          </span>
        )
      })}
    </div>
  )
}
