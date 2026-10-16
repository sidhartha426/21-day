export const CHALLENGE_DAYS = 21
export const MAX_SESSIONS_PER_DAY = 10000

export type ChallengeConfig = {
  startDate: string
  idealPerDay: number
}

export type DayRow = {
  day: number
  date: string
  sessionsCompleted: number
  dayCompleted: boolean
}

export type ComputedRow = DayRow & {
  cumulative: number | null
  cumulativePct: number | null
}

export type ChallengeSummary = {
  completedDays: number
  totalSessions: number
  idealTotal: number
  scorePct: number
  stars: number
  isComplete: boolean
  nextDayIndex: number
}

export type Verdict = {
  tone: 'celebrate' | 'encourage' | 'reprimand'
  title: string
  message: string
}

function parseIsoDate(iso: string) {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

export function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = parseIsoDate(value)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function buildRows(startDate: string): DayRow[] {
  const start = parseIsoDate(startDate)
  return Array.from({ length: CHALLENGE_DAYS }, (_, index) => {
    const date = new Date(start)
    date.setUTCDate(start.getUTCDate() + index)
    return {
      day: index + 1,
      date: date.toISOString().slice(0, 10),
      sessionsCompleted: 0,
      dayCompleted: false,
    }
  })
}

export function computeRows(config: ChallengeConfig, rows: DayRow[]): ComputedRow[] {
  let cumulative = 0
  return rows.map((row, index) => {
    if (!row.dayCompleted) {
      return { ...row, cumulative: null, cumulativePct: null }
    }
    cumulative += row.sessionsCompleted
    const idealToDate = config.idealPerDay * (index + 1)
    return {
      ...row,
      cumulative,
      cumulativePct: idealToDate === 0 ? 0 : (cumulative / idealToDate) * 100,
    }
  })
}

export const MAX_STARS = 5

/** Fractional star rating: 100% = 5 stars, 20% = 1 star, 10% = 0.5 stars. */
export function starsForScore(scorePct: number) {
  if (!Number.isFinite(scorePct) || scorePct <= 0) return 0
  const clamped = Math.min(scorePct, 100)
  return Math.round((clamped / 100) * MAX_STARS * 100) / 100
}

export function formatStars(stars: number) {
  return `${Number(stars.toFixed(2))}/${MAX_STARS}`
}

export function summarize(config: ChallengeConfig, rows: DayRow[]): ChallengeSummary {
  const completed = rows.filter((row) => row.dayCompleted)
  const totalSessions = completed.reduce((sum, row) => sum + row.sessionsCompleted, 0)
  const idealTotal = config.idealPerDay * CHALLENGE_DAYS
  const scorePct = idealTotal === 0 ? 0 : (totalSessions / idealTotal) * 100
  return {
    completedDays: completed.length,
    totalSessions,
    idealTotal,
    scorePct,
    stars: starsForScore(scorePct),
    isComplete: rows.length === CHALLENGE_DAYS && completed.length === CHALLENGE_DAYS,
    nextDayIndex: rows.findIndex((row) => !row.dayCompleted),
  }
}

function baseVerdict(stars: number): Verdict {
  if (stars >= 5) {
    return {
      tone: 'celebrate',
      title: 'Flawless streak!',
      message:
        'You hit or beat your ideal target across all 21 days. That is elite consistency - keep this standard.',
    }
  }
  if (stars >= 4) {
    return {
      tone: 'celebrate',
      title: 'Outstanding work!',
      message:
        'You came very close to your ideal target. A few more sessions and you will have a perfect run.',
    }
  }
  if (stars >= 3) {
    return {
      tone: 'encourage',
      title: 'Solid effort',
      message:
        'You showed up for most of it. Tighten up the weaker days and the next challenge will shine.',
    }
  }
  if (stars >= 2) {
    return {
      tone: 'reprimand',
      title: 'You can do better',
      message:
        'You finished, but you left a lot on the table. Set a realistic target and hold yourself to it.',
    }
  }
  if (stars >= 1) {
    return {
      tone: 'reprimand',
      title: 'Not good enough',
      message:
        'Most of your sessions were skipped. Commitment is a choice - make a better one next round.',
    }
  }
  return {
    tone: 'reprimand',
    title: 'This was not a real attempt',
    message:
      'You barely engaged with the challenge. Reset, lower the target if needed, and actually show up.',
  }
}

/** Verdict for a fractional star rating; the message states the exact rating, e.g. "3.5/5 stars". */
export function verdictFor(stars: number): Verdict {
  const verdict = baseVerdict(stars)
  return { ...verdict, message: `You earned ${formatStars(stars)} stars. ${verdict.message}` }
}

export function formatDay(day: number) {
  return `Day ${String(day).padStart(2, '0')}`
}
