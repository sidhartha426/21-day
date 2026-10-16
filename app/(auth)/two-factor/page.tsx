'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Spinner } from '@/components/ui/spinner'
import { authClient } from '@/lib/auth-client'

export default function TwoFactorPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'totp' | 'backup'>('totp')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function verify(value: string) {
    setError(null)
    setPending(true)
    const { error } =
      mode === 'totp'
        ? await authClient.twoFactor.verifyTotp({ code: value })
        : await authClient.twoFactor.verifyBackupCode({ code: value.trim() })
    if (error) {
      setPending(false)
      setCode('')
      setError(error.message ?? 'Verification failed.')
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Two-factor verification</h1>
        <p className="text-sm text-muted-foreground">
          {mode === 'totp'
            ? 'Enter the 6-digit code from your authenticator app.'
            : 'Enter one of your saved backup codes.'}
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          void verify(code)
        }}
      >
        <FieldGroup>
          {mode === 'totp' ? (
            <Field>
              <FieldLabel htmlFor="totp" className="sr-only">
                Authentication code
              </FieldLabel>
              <InputOTP
                id="totp"
                maxLength={6}
                value={code}
                onChange={setCode}
                onComplete={(value: string) => void verify(value)}
                autoFocus
                disabled={pending}
                containerClassName="justify-center"
              >
                <InputOTPGroup>
                  {Array.from({ length: 6 }, (_, i) => (
                    <InputOTPSlot key={i} index={i} className="size-11 text-base" />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </Field>
          ) : (
            <Field>
              <FieldLabel htmlFor="backup">Backup code</FieldLabel>
              <Input id="backup" autoComplete="one-time-code" required value={code} onChange={(e) => setCode(e.target.value)} />
              <FieldDescription>Each backup code works only once.</FieldDescription>
            </Field>
          )}
          <Button type="submit" size="lg" disabled={pending || code.length === 0}>
            {pending && <Spinner />}
            Verify
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setMode(mode === 'totp' ? 'backup' : 'totp')
              setCode('')
              setError(null)
            }}
          >
            {mode === 'totp' ? 'Use a backup code instead' : 'Use authenticator app instead'}
          </Button>
        </FieldGroup>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/sign-in" className="underline-offset-4 hover:text-foreground hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
