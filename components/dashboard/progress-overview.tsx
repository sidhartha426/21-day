import { StarRating } from '@/components/star-rating'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { CHALLENGE_DAYS, formatDay, type ChallengeConfig, type ChallengeSummary, type DayRow } from '@/lib/challenge'
import { cn } from '@/lib/utils'

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="font-mono text-2xl font-semibold tabular-nums tracking-tight">{value}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </CardContent>
    </Card>
  )
}

export function StreakGrid({ config, rows }: { config: ChallengeConfig; rows: DayRow[] }) {
  return (
    <div className="grid grid-cols-7 gap-1.5 sm:gap-2" aria-label="Daily completion grid">
      {rows.map((row) => {
        const ratio = row.dayCompleted ? Math.min(row.sessionsCompleted / config.idealPerDay, 1) : 0
        return (
          <Tooltip key={row.day}>
            <TooltipTrigger
              render={
                <div
                  className={cn(
                    'aspect-square rounded-md border',
                    row.dayCompleted ? 'border-transparent bg-primary' : 'bg-muted/50',
                    row.dayCompleted && ratio === 0 && 'bg-destructive/60',
                  )}
                  style={row.dayCompleted && ratio > 0 ? { opacity: 0.3 + ratio * 0.7 } : undefined}
                />
              }
            />
            <TooltipContent>
              {formatDay(row.day)}: {row.dayCompleted ? `${row.sessionsCompleted} sessions` : 'pending'}
            </TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}

export function ProgressOverview({
  challenge,
  summary,
}: {
  challenge: { config: ChallengeConfig; rows: DayRow[] }
  summary: ChallengeSummary
}) {
  const last = challenge.rows[challenge.rows.length - 1]
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Days completed" value={`${summary.completedDays}/${CHALLENGE_DAYS}`} />
          <StatCard label="Total sessions" value={String(summary.totalSessions)} hint={`of ${summary.idealTotal} ideal`} />
          <StatCard label="Ideal per day" value={String(challenge.config.idealPerDay)} />
          <StatCard label="Score" value={`${summary.scorePct.toFixed(1)}%`} hint="of full 21-day target" />
        </div>
        <Card size="sm">
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">
                {challenge.config.startDate} to {last?.date}
              </span>
              <StarRating scorePct={summary.scorePct} size="sm" />
            </div>
            <Progress value={(summary.completedDays / CHALLENGE_DAYS) * 100} aria-label="Challenge progress" />
          </CardContent>
        </Card>
      </div>
      <Card size="sm" className="lg:w-64">
        <CardContent className="flex flex-col gap-3">
          <span className="text-xs font-medium text-muted-foreground">Streak map</span>
          <StreakGrid config={challenge.config} rows={challenge.rows} />
        </CardContent>
      </Card>
    </div>
  )
}
