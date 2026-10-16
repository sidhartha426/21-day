import type { ChallengeConfig } from '@/lib/challenge'

export function reportFilenameFor(config: ChallengeConfig) {
  return `21-day-${config.startDate}.pdf`
}
