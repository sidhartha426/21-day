'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { authClient } from '@/lib/auth-client'

export function ResetPasswordForm({ token, linkError }: { token?: string; linkError?: string }) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(
    linkError || !token ? 'This reset link is invalid or has expired.' : null,
  )

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) return
    setPending(true)
    setError(null)
    const { error } = await authClient.resetPassword({ newPassword: password, token })
    setPending(false)
    if (error) {
      setError(error.message ?? 'Could not reset password.')
      return
    }
    toast.success('Password updated. Sign in with your new password.')
    router.push('/sign-in')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Choose a new password</h1>
        <p className="text-sm text-muted-foreground">All other sessions will be signed out.</p>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {token && !linkError && (
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="password">New password</FieldLabel>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <Button type="submit" size="lg" disabled={pending}>
              {pending && <Spinner />}
              Update password
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
