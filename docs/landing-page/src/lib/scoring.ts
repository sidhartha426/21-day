// Mirrors lib/challenge.ts in the app so the demo shows exactly what users get.
export const CHALLENGE_DAYS = 21

export type Verdict = {
  tone: "celebrate" | "encourage" | "reprimand"
  title: string
  message: string
}

export function scorePercent(totalSessions: number, idealPerDay: number) {
  const idealTotal = idealPerDay * CHALLENGE_DAYS
  return idealTotal > 0 ? (totalSessions / idealTotal) * 100 : 0
}

export function starsFor(scorePct: number) {
  return Math.round((Math.min(Math.max(scorePct, 0), 100) / 20) * 100) / 100
}

export function verdictFor(stars: number): Verdict {
  if (stars >= 5) {
    return {
      tone: "celebrate",
      title: "Flawless streak!",
      message:
        "You hit or beat your ideal target across all 21 days. That is elite consistency - keep this standard.",
    }
  }
  if (stars >= 4) {
    return {
      tone: "celebrate",
      title: "Outstanding work!",
      message:
        "You came very close to your ideal target. A few more sessions and you will have a perfect run.",
    }
  }
  if (stars >= 3) {
    return {
      tone: "encourage",
      title: "Solid effort",
      message:
        "You showed up for most of it. Tighten up the weaker days and the next challenge will shine.",
    }
  }
  if (stars >= 2) {
    return {
      tone: "reprimand",
      title: "You can do better",
      message:
        "You finished, but you left a lot on the table. Set a realistic target and hold yourself to it.",
    }
  }
  if (stars >= 1) {
    return {
      tone: "reprimand",
      title: "Not good enough",
      message:
        "Most of your sessions were skipped. Commitment is a choice - make a better one next round.",
    }
  }
  return {
    tone: "reprimand",
    title: "This was not a real attempt",
    message:
      "You barely engaged with the challenge. Reset, lower the target if needed, and actually show up.",
  }
}

/**
 * Spreads a total across 21 days so the demo streak map looks like a plausible run:
 * shortfalls land on a deterministic, scattered set of days instead of all at the end.
 */
export function distributeSessions(totalSessions: number, idealPerDay: number) {
  const days = Array.from({ length: CHALLENGE_DAYS }, () => 0)
  const order = Array.from({ length: CHALLENGE_DAYS }, (_, i) => (i * 8) % CHALLENGE_DAYS)
  let remaining = Math.max(0, Math.round(totalSessions))

  for (const day of order) {
    const give = Math.min(idealPerDay, remaining)
    days[day] = give
    remaining -= give
  }
  for (let i = 0; remaining > 0; i = (i + 1) % CHALLENGE_DAYS) {
    days[order[i]] += 1
    remaining -= 1
  }
  return days
}
