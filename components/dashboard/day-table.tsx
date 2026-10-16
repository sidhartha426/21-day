'use client'

import { Check, Lock, Pencil, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { toast } from 'sonner'
import { ConfirmButton } from '@/components/confirm-button'
import { NumberInput } from '@/components/number-input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  computeRows,
  formatDay,
  MAX_SESSIONS_PER_DAY,
  summarize,
  type ChallengeConfig,
  type ComputedRow,
  type DayRow,
} from '@/lib/challenge'
import { formatUtcWeekdayDay } from '@/lib/dates'
import { cn } from '@/lib/utils'

type DayTableProps = {
  challenge: { config: ChallengeConfig; rows: DayRow[] }
  onUpdateDay?: (day: number, sessions: number | null) => Promise<void>
  title?: string
  description?: string
}

export const formatIsoDate = formatUtcWeekdayDay

function parseSessions(value: string) {
  if (!/^\d+$/.test(value.trim())) return null
  const n = Number(value)
  return Number.isSafeInteger(n) && n >= 0 && n <= MAX_SESSIONS_PER_DAY ? n : null
}

function isComposing(event: KeyboardEvent<HTMLInputElement>) {
  return event.nativeEvent.isComposing || event.keyCode === 229
}

function SessionsInput({
  day,
  initialValue,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  day: number
  initialValue: string
  submitLabel: string
  onSubmit: (sessions: number) => Promise<void>
  onCancel?: () => void
}) {
  const [value, setValue] = useState(initialValue)
  const [pending, setPending] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Each input mounts when its day becomes the next pending day (on load and after
  // logging the previous day) or when editing starts, so focusing on mount moves the
  // cursor straight to the field that needs input.
  useEffect(() => {
    const input = inputRef.current
    if (!input) return
    input.focus()
    input.select()
  }, [])

  async function submit() {
    const sessions = parseSessions(value)
    if (sessions === null) {
      toast.error(`Enter a whole number between 0 and ${MAX_SESSIONS_PER_DAY}.`)
      return
    }
    setPending(true)
    try {
      await onSubmit(sessions)
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setPending(false)
    }
  }

  return (
    <form
      className="flex items-center gap-1.5"
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
      <label htmlFor={`sessions-${day}`} className="sr-only">
        Sessions for {formatDay(day)}
      </label>
      <NumberInput
        ref={inputRef}
        id={`sessions-${day}`}
        inputMode="numeric"
        min={0}
        max={MAX_SESSIONS_PER_DAY}
        step={1}
        value={value}
        disabled={pending}
        onValueChange={setValue}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && isComposing(event)) event.preventDefault()
          if (event.key === 'Escape' && onCancel) onCancel()
        }}
        className="w-20"
        inputClassName="h-8 font-mono tabular-nums"
        placeholder="0"
      />
      <Button type="submit" size="sm" disabled={pending || value === ''}>
        {pending ? <Spinner /> : <Check aria-hidden="true" />}
        {submitLabel}
      </Button>
      {onCancel && (
        <Button type="button" size="icon-sm" variant="ghost" onClick={onCancel} disabled={pending}>
          <X aria-hidden="true" />
          <span className="sr-only">Cancel editing</span>
        </Button>
      )}
    </form>
  )
}

function DayRowView({
  row,
  idealPerDay,
  isNext,
  onUpdateDay,
}: {
  row: ComputedRow
  idealPerDay: number
  isNext: boolean
  onUpdateDay?: DayTableProps['onUpdateDay']
}) {
  const [editing, setEditing] = useState(false)
  const isFuture = !row.dayCompleted && !isNext
  const metIdeal = row.dayCompleted && row.sessionsCompleted >= idealPerDay
  const editable = Boolean(onUpdateDay)

  return (
    <TableRow
      data-state={isNext && editable ? 'selected' : undefined}
      className={cn(isFuture && 'text-muted-foreground', isNext && editable && 'bg-primary/5')}
    >
      <TableCell className="font-medium">
        <div className="flex flex-col">
          <span className="font-mono tabular-nums">{formatDay(row.day)}</span>
          <span className="text-xs font-normal text-muted-foreground sm:hidden">
            {formatIsoDate(row.date)}
          </span>
        </div>
      </TableCell>
      <TableCell className="hidden sm:table-cell">{formatIsoDate(row.date)}</TableCell>
      <TableCell>
        {editing && onUpdateDay ? (
          <SessionsInput
            day={row.day}
            initialValue={String(row.sessionsCompleted)}
            submitLabel="Save"
            onCancel={() => setEditing(false)}
            onSubmit={async (sessions) => {
              await onUpdateDay(row.day, sessions)
              setEditing(false)
              toast.success(`${formatDay(row.day)} updated.`)
            }}
          />
        ) : isNext && onUpdateDay ? (
          <SessionsInput
            key={row.day}
            day={row.day}
            initialValue=""
            submitLabel="Log"
            onSubmit={(sessions) => onUpdateDay(row.day, sessions)}
          />
        ) : row.dayCompleted ? (
          <span className="flex items-center gap-2">
            <span className="font-mono tabular-nums">{row.sessionsCompleted}</span>
            {metIdeal ? (
              <Badge variant="secondary" className="hidden sm:inline-flex">
                On target
              </Badge>
            ) : (
              <Badge variant="outline" className="hidden text-muted-foreground sm:inline-flex">
                {`-${idealPerDay - row.sessionsCompleted}`}
              </Badge>
            )}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs">
            <Lock className="size-3.5" aria-hidden="true" />
            {isNext ? 'Pending' : 'Locked'}
          </span>
        )}
      </TableCell>
      <TableCell className="hidden font-mono tabular-nums md:table-cell">
        {row.cumulative ?? '-'}
      </TableCell>
      <TableCell className="font-mono tabular-nums">
        {row.cumulativePct === null ? (
          '-'
        ) : (
          <span className={cn(row.cumulativePct >= 100 ? 'text-primary' : 'text-foreground')}>
            {row.cumulativePct.toFixed(1)}%
          </span>
        )}
      </TableCell>
      {editable && (
        <TableCell className="text-right">
          {row.dayCompleted && !editing && onUpdateDay && (
            <div className="flex justify-end gap-1">
              <Button size="icon-sm" variant="ghost" onClick={() => setEditing(true)}>
                <Pencil aria-hidden="true" />
                <span className="sr-only">Edit {formatDay(row.day)}</span>
              </Button>
              <ConfirmButton
                size="icon-sm"
                variant="ghost"
                className="text-muted-foreground hover:text-destructive"
                title={`Clear ${formatDay(row.day)}?`}
                description="This removes the logged sessions and marks the day as pending again."
                confirmLabel="Clear day"
                onConfirm={async () => {
                  try {
                    await onUpdateDay(row.day, null)
                    toast.success(`${formatDay(row.day)} cleared.`)
                  } catch (error) {
                    toast.error((error as Error).message)
                  }
                }}
              >
                <Trash2 aria-hidden="true" />
                <span className="sr-only">Clear {formatDay(row.day)}</span>
              </ConfirmButton>
            </div>
          )}
        </TableCell>
      )}
    </TableRow>
  )
}

export function DayTable({
  challenge,
  onUpdateDay,
  title = 'Daily log',
  description = 'Log the next pending day. Completed days can be edited or cleared at any time.',
}: DayTableProps) {
  const rows = computeRows(challenge.config, challenge.rows)
  const { nextDayIndex } = summarize(challenge.config, challenge.rows)
  const editable = Boolean(onUpdateDay)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="px-0 sm:px-(--card-spacing)">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Day</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead className="hidden md:table-cell">Cumulative</TableHead>
                <TableHead>
                  <span className="hidden sm:inline">Cumulative </span>%
                </TableHead>
                {editable && (
                  <TableHead className="text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => (
                <DayRowView
                  key={row.day}
                  row={row}
                  idealPerDay={challenge.config.idealPerDay}
                  isNext={index === nextDayIndex}
                  onUpdateDay={onUpdateDay}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
