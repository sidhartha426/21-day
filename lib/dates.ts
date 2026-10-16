// All dates in the app are stored and rendered in UTC. Formatting is done by hand
// instead of Intl so the server (Node ICU) and every browser produce identical
// strings, regardless of their locale or timezone. This keeps SSR hydration stable.

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

type DateInput = Date | string | number

function toDate(value: DateInput) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00Z`)
  }
  return value instanceof Date ? value : new Date(value)
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

/** Current calendar date in UTC as `YYYY-MM-DD`. */
export function todayUtcIso(now: DateInput = Date.now()) {
  return toDate(now).toISOString().slice(0, 10)
}

/** Current instant as an ISO 8601 UTC string, e.g. `2026-10-13T08:15:00.000Z`. */
export function nowUtcIso() {
  return new Date().toISOString()
}

/** `Mon, 12 Oct` */
export function formatUtcWeekdayDay(value: DateInput) {
  const date = toDate(value)
  return `${WEEKDAYS[date.getUTCDay()]}, ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`
}

/** `12 Oct` */
export function formatUtcDayMonth(value: DateInput) {
  const date = toDate(value)
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`
}

/** `12 Oct 2026` */
export function formatUtcDate(value: DateInput) {
  const date = toDate(value)
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`
}

/** `2026-10-12 08:15 UTC` */
export function formatUtcDateTime(value: DateInput) {
  const date = toDate(value)
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())} UTC`
}
