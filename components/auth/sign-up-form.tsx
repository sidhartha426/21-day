'use client'

import { ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { authClient } from '@/lib/auth-client'

export function SignUpForm({
  isFirstUser,
  inviteToken,
  invitedEmail,
}: {
  isFirstUser: boolean
  inviteToken?: string
  invitedEmail?: string
}) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState(invitedEmail ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)
    const { error } = await authClient.signUp.email(
      { name: name.trim(), username: username.trim(), email: email.trim(), password },
      inviteToken ? { headers: { 'x-invite-token': inviteToken } } : undefined,
    )
    if (error) {
      setPending(false)
      setError(error.message ?? 'Could not create your account.')
      return
    }
    router.push(isFirstUser ? '/settings?tab=security' : '/dashboard')
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">
          {isFirstUser ? 'Create the admin account' : 'Create your account'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {inviteToken ? "You've been invited. Set up your login below." : 'Start tracking your 21-day challenge.'}
        </p>
      </div>

      {isFirstUser && (
        <Alert>
          <ShieldCheck aria-hidden="true" />
          <AlertTitle>First account becomes the administrator</AlertTitle>
          <AlertDescription>
            {"You'll need to enable 2FA or add a passkey before using the admin panel."}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input id="name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="username">Username</FieldLabel>
            <Input
              id="username"
              autoComplete="username"
              required
              minLength={3}
              maxLength={30}
              pattern="[A-Za-z0-9_.]+"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <FieldDescription>Letters, numbers, dots and underscores.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              readOnly={Boolean(invitedEmail)}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <FieldDescription>At least 8 characters.</FieldDescription>
          </Field>
          <Button type="submit" size="lg" disabled={pending}>
            {pending && <Spinner />}
            Create account
          </Button>
        </FieldGroup>
      </form>

      {!isFirstUser && (
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/sign-in" className="font-medium text-foreground underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      )}
    </div>
  )
}
