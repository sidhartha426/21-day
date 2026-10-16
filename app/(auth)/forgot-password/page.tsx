'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { authClient } from '@/lib/auth-client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [pending, setPending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)
    const { error } = await authClient.requestPasswordReset({
      email: email.trim(),
      redirectTo: '/reset-password',
    })
    setPending(false)
    if (error) {
      setError(error.message ?? 'Could not send reset email.')
      return
    }
    setSent(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
        <p className="text-sm text-muted-foreground">{"We'll email you a link to choose a new password."}</p>
      </div>

      {sent ? (
        <Alert>
          <AlertDescription>
            If an account exists for that email, a reset link is on its way. It expires in 1 hour.
          </AlertDescription>
        </Alert>
      ) : (
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Button type="submit" size="lg" disabled={pending}>
              {pending && <Spinner />}
              Send reset link
            </Button>
          </FieldGroup>
        </form>
      )}

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/sign-in" className="underline-offset-4 hover:text-foreground hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
