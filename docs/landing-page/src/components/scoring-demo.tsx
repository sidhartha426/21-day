import * as React from "react"
import { ThumbsUp, TriangleAlert, Trophy } from "lucide-react"
import { Section, SectionHeading } from "@/components/section"
import { StarRating } from "@/components/star-rating"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  CHALLENGE_DAYS,
  distributeSessions,
  scorePercent,
  starsFor,
  verdictFor,
  type Verdict,
} from "@/lib/scoring"
import { cn } from "@/lib/utils"

const MAX_IDEAL = 20
const OVERSHOOT = 1.25

const TONE_ICON: Record<Verdict["tone"], typeof Trophy> = {
  celebrate: Trophy,
  encourage: ThumbsUp,
  reprimand: TriangleAlert,
}

function maxSessionsFor(ideal: number) {
  return Math.round(ideal * CHALLENGE_DAYS * OVERSHOOT)
}

function formatDay(day: number) {
  return `Day ${String(day).padStart(2, "0")}`
}

export function ScoringDemo() {
  const [ideal, setIdeal] = React.useState(8)
  const [total, setTotal] = React.useState(153)

  const idealTotal = ideal * CHALLENGE_DAYS
  const scorePct = scorePercent(total, ideal)
  const stars = starsFor(scorePct)
  const verdict = verdictFor(stars)
  const days = distributeSessions(total, ideal)
  const ToneIcon = TONE_ICON[verdict.tone]

  function handleIdealChange([next]: number[]) {
    // Keep the score steady while the target moves, so only one variable changes at a time.
    setTotal(Math.min(Math.round((scorePct / 100) * next * CHALLENGE_DAYS), maxSessionsFor(next)))
    setIdeal(next)
  }

  return (
    <Section id="scoring" aria-labelledby="scoring-title" className="flex flex-col gap-10">
      <SectionHeading
        id="scoring-title"
        eyebrow="How scoring works"
        title="No rounding up. No participation trophies."
        description="Drag the sliders to see exactly how 21-day grades a finished challenge. It is the same math the app runs, down to the verdict."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Try a challenge</CardTitle>
            <CardDescription>Set a daily ideal and how many sessions you logged in total.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium">
                  Ideal per day
                </span>
                <span className="font-mono text-sm tabular-nums">{ideal}</span>
              </div>
              <Slider
                aria-label="Ideal sessions per day"
                min={1}
                max={MAX_IDEAL}
                step={1}
                value={[ideal]}
                onValueChange={handleIdealChange}
              />
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium">Total sessions logged</span>
                <span className="font-mono text-sm tabular-nums">{total}</span>
              </div>
              <Slider
                aria-label="Total sessions logged"
                min={0}
                max={maxSessionsFor(ideal)}
                step={1}
                value={[total]}
                onValueChange={([next]) => setTotal(next)}
              />
            </div>

            <Separator />

            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-sm">
              <dt className="text-muted-foreground">Ideal total</dt>
              <dd className="text-right font-mono tabular-nums">
                {ideal} × {CHALLENGE_DAYS} = {idealTotal}
              </dd>
              <dt className="text-muted-foreground">Score</dt>
              <dd className="text-right font-mono tabular-nums">
                {total} ÷ {idealTotal} = {scorePct.toFixed(1)}%
              </dd>
              <dt className="text-muted-foreground">Stars</dt>
              <dd className="text-right font-mono tabular-nums">
                min({scorePct.toFixed(1)}, 100) ÷ 20 = {stars.toFixed(2)}
              </dd>
            </dl>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Scores can go above 100%, but stars cap at 5. Only completed days count, and a day logged
              with 0 sessions still counts as completed.
            </p>
          </CardContent>
        </Card>

        <Card
          className={cn(verdict.tone === "celebrate" && "ring-primary/40")}
          aria-live="polite"
          aria-atomic="true"
        >
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-4">
                <span
                  className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-xl",
                    verdict.tone === "reprimand"
                      ? "bg-destructive/15 text-destructive"
                      : "bg-primary text-primary-foreground"
                  )}
                >
                  <ToneIcon className="size-5" aria-hidden="true" />
                </span>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                    Challenge complete
                  </span>
                  <h3 className="text-lg font-semibold tracking-tight">{verdict.title}</h3>
                  <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
                    You earned {Number(stars.toFixed(2))}/5 stars. {verdict.message}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-1 sm:items-end">
                <StarRating scorePct={scorePct} size="lg" />
                <span className="font-mono text-3xl font-semibold tracking-tight tabular-nums">
                  {scorePct.toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground">
                  {total} of {idealTotal} ideal sessions
                </span>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-3">
              <span className="text-xs font-medium text-muted-foreground">Streak map</span>
              <div className="grid max-w-sm grid-cols-7 gap-1.5 sm:gap-2" aria-label="Daily completion grid">
                {days.map((sessions, index) => {
                  const ratio = Math.min(sessions / ideal, 1)
                  return (
                    <Tooltip key={index}>
                      <TooltipTrigger asChild>
                        <div
                          tabIndex={0}
                          aria-label={`${formatDay(index + 1)}: ${sessions} sessions`}
                          className={cn(
                            "aspect-square rounded-md border border-transparent bg-primary transition-opacity outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                            ratio === 0 && "bg-destructive/60"
                          )}
                          style={ratio > 0 ? { opacity: 0.3 + ratio * 0.7 } : undefined}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        {formatDay(index + 1)}: {sessions} sessions
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Section>
  )
}
