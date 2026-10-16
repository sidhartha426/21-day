'use client'

import { CalendarPlus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { NumberInput } from '@/components/number-input'
import type { ActiveChallenge } from '@/lib/challenge-store'
import { fetchJson } from '@/lib/fetcher'

export function StartChallengeForm({
  todayUtc,
  onStarted,
}: {
  todayUtc: string
  onStarted: (challenge: ActiveChallenge) => void
}) {
  const [startDate, setStartDate] = useState(todayUtc)
  const [idealPerDay, setIdealPerDay] = useState('10')
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    try {
      const { challenge } = await fetchJson<{ challenge: ActiveChallenge }>('/api/challenge', {
        method: 'POST',
        body: JSON.stringify({ startDate, idealPerDay: Number(idealPerDay) }),
      })
      onStarted(challenge)
      toast.success('Your 21-day challenge has started. Good luck!')
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setPending(false)
    }
  }

  return (
    <Card className="mx-auto w-full max-w-lg">
      <CardHeader>
        <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <CalendarPlus className="size-5" aria-hidden="true" />
        </div>
        <CardTitle>Start a new 21-day challenge</CardTitle>
        <CardDescription>Pick a start date and how many sessions you aim to do each day.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="startDate">Start date (UTC)</FieldLabel>
                <Input id="startDate" type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="idealPerDay">Ideal sessions / day</FieldLabel>
                <NumberInput
                  id="idealPerDay"
                  inputMode="numeric"
                  min={1}
                  max={1000}
                  step={1}
                  required
                  value={idealPerDay}
                  onValueChange={setIdealPerDay}
                />
              </Field>
            </div>
            <FieldDescription>Your score is total sessions as a share of 21 times your daily ideal.</FieldDescription>
            <Button type="submit" size="lg" disabled={pending}>
              {pending && <Spinner />}
              Build my 21-day table
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
