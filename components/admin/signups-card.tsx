'use client'

import { useOptimistic, useTransition } from 'react'
import { toast } from 'sonner'
import { setSignupsEnabledAction } from '@/app/(admin)/admin/actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldContent, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Switch } from '@/components/ui/switch'

export function SignupsCard({ enabled, userCount }: { enabled: boolean; userCount: number }) {
  const [optimisticEnabled, setOptimisticEnabled] = useOptimistic(enabled)
  const [pending, startTransition] = useTransition()

  function handleChange(next: boolean) {
    startTransition(async () => {
      setOptimisticEnabled(next)
      const result = await setSignupsEnabledAction(next)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(next ? 'Public sign-ups enabled.' : 'Public sign-ups disabled.')
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registration</CardTitle>
        <CardDescription>
          <span className="font-mono tabular-nums">{userCount}</span>{' '}
          {userCount === 1 ? 'account' : 'accounts'} registered.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor="signups-enabled">Allow public sign-ups</FieldLabel>
            <FieldDescription>
              When off, new accounts can only be created through an invitation link.
            </FieldDescription>
          </FieldContent>
          <Switch
            id="signups-enabled"
            checked={optimisticEnabled}
            onCheckedChange={handleChange}
            disabled={pending}
          />
        </Field>
      </CardContent>
    </Card>
  )
}
