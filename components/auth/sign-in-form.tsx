'use client'

import { KeyRound } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel, FieldSeparator } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { authClient } from '@/lib/auth-client'

export function SignInForm({ signupsEnabled }: { signupsEnabled: boolean }) {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<'password' | 'passkey' | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending('password')
    const value = identifier.trim()
    const { data, error } = value.includes('@')
      ? await authClient.signIn.email({ email: value, password })
      : await authClient.signIn.username({ username: value, password })
    if (error) {
      setPending(null)
      setError(error.message ?? 'Sign in failed.')
      return
    }
    // twoFactorClient navigates to /two-factor when a second factor is required.
    if (data && 'twoFactorRedirect' in data && data.twoFactorRedirect) return
    router.push('/dashboard')
    router.refresh()
  }

  async function handlePasskey() {
    setError(null)
    setPending('passkey')
    const result = await authClient.signIn.passkey()
    if (result?.error) {
      setPending(null)
      setError(result.error.message ?? 'Passkey sign-in failed.')
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to continue your challenge.</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="identifier">Email or username</FieldLabel>
            <Input
              id="identifier"
              autoComplete="username webauthn"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </Field>
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Link href="/forgot-password" className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Button type="submit" size="lg" disabled={pending !== null}>
            {pending === 'password' && <Spinner />}
            Sign in
          </Button>
          <FieldSeparator>or</FieldSeparator>
          <Button type="button" variant="outline" size="lg" onClick={handlePasskey} disabled={pending !== null}>
            {pending === 'passkey' ? <Spinner /> : <KeyRound aria-hidden="true" />}
            Sign in with a passkey
          </Button>
        </FieldGroup>
      </form>

      {signupsEnabled && (
        <p className="text-center text-sm text-muted-foreground">
          {"Don't have an account? "}
          <Link href="/sign-up" className="font-medium text-foreground underline-offset-4 hover:underline">
            Create one
          </Link>
        </p>
      )}
    </div>
  )
}
