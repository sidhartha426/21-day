'use client'

import { KeyRound, Plus, ShieldCheck, ShieldOff, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { ConfirmButton } from '@/components/confirm-button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'
import { Spinner } from '@/components/ui/spinner'
import type { AuthMethod } from '@/lib/auth'
import { authClient } from '@/lib/auth-client'
import { formatUtcDate } from '@/lib/dates'

export type PasskeySummary = {
  id: string
  name: string | null
  deviceType: string
  backedUp: boolean
  createdAt: string
}

const METHOD_LABELS: Record<AuthMethod, string> = {
  password: 'Password only',
  '2fa': 'Password + 2FA',
  passkey: 'Passkey',
}


type TwoFactorStep =
  | { kind: 'closed' }
  | { kind: 'password'; purpose: 'enable' | 'disable' | 'backup' }
  | { kind: 'verify'; totpURI: string; backupCodes: string[] }
  | { kind: 'codes'; backupCodes: string[] }

function secretFromUri(uri: string) {
  try {
    return new URL(uri).searchParams.get('secret') ?? ''
  } catch {
    return ''
  }
}

function BackupCodes({ codes }: { codes: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      <ul className="grid grid-cols-2 gap-1.5 rounded-lg border bg-muted/40 p-3 font-mono text-sm">
        {codes.map((code) => (
          <li key={code}>{code}</li>
        ))}
      </ul>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="self-start"
        onClick={async () => {
          await navigator.clipboard.writeText(codes.join('\n'))
          toast.success('Backup codes copied.')
        }}
      >
        Copy codes
      </Button>
    </div>
  )
}

function TwoFactorCard({ enabled }: { enabled: boolean }) {
  const router = useRouter()
  const [step, setStep] = useState<TwoFactorStep>({ kind: 'closed' })
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [pending, setPending] = useState(false)

  function close() {
    setStep({ kind: 'closed' })
    setPassword('')
    setCode('')
  }

  async function handlePassword(event: FormEvent) {
    event.preventDefault()
    if (step.kind !== 'password') return
    setPending(true)
    try {
      if (step.purpose === 'enable') {
        const { data, error } = await authClient.twoFactor.enable({ password })
        if (error || !data || data.method !== 'totp') {
          throw new Error(error?.message ?? 'Could not start 2FA setup.')
        }
        setStep({ kind: 'verify', totpURI: data.totpURI, backupCodes: data.backupCodes })
      } else if (step.purpose === 'disable') {
        const { error } = await authClient.twoFactor.disable({ password })
        if (error) throw new Error(error.message ?? 'Could not disable 2FA.')
        toast.success('Two-factor authentication disabled.')
        close()
        router.refresh()
      } else {
        const { data, error } = await authClient.twoFactor.generateBackupCodes({ password })
        if (error || !data) throw new Error(error?.message ?? 'Could not generate backup codes.')
        setStep({ kind: 'codes', backupCodes: data.backupCodes })
      }
      setPassword('')
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setPending(false)
    }
  }

  async function handleVerify(event: FormEvent) {
    event.preventDefault()
    if (step.kind !== 'verify' || code.length !== 6) return
    setPending(true)
    const { error } = await authClient.twoFactor.verifyTotp({ code })
    setPending(false)
    if (error) {
      toast.error(error.message ?? 'That code is not valid. Try again.')
      setCode('')
      return
    }
    toast.success('Two-factor authentication is on.')
    setStep({ kind: 'codes', backupCodes: step.backupCodes })
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Two-factor authentication</CardTitle>
        <CardDescription>
          Require a code from an authenticator app after your password. Signing in with a passkey skips
          this step.
        </CardDescription>
        <CardAction>
          <Badge variant={enabled ? 'default' : 'outline'}>{enabled ? 'On' : 'Off'}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {enabled ? (
          <>
            <Button
              variant="outline"
              onClick={() => setStep({ kind: 'password', purpose: 'backup' })}
            >
              Regenerate backup codes
            </Button>
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => setStep({ kind: 'password', purpose: 'disable' })}
            >
              <ShieldOff aria-hidden="true" />
              Disable 2FA
            </Button>
          </>
        ) : (
          <Button onClick={() => setStep({ kind: 'password', purpose: 'enable' })}>
            <ShieldCheck aria-hidden="true" />
            Enable 2FA
          </Button>
        )}
      </CardContent>

      <Dialog open={step.kind !== 'closed'} onOpenChange={(open) => !open && !pending && close()}>
        <DialogContent className="sm:max-w-md">
          {step.kind === 'password' && (
            <form onSubmit={handlePassword} className="flex flex-col gap-4">
              <DialogHeader>
                <DialogTitle>
                  {step.purpose === 'enable'
                    ? 'Set up two-factor authentication'
                    : step.purpose === 'disable'
                      ? 'Disable two-factor authentication'
                      : 'Regenerate backup codes'}
                </DialogTitle>
                <DialogDescription>Confirm your password to continue.</DialogDescription>
              </DialogHeader>
              <Field>
                <FieldLabel htmlFor="twofa-password">Password</FieldLabel>
                <Input
                  id="twofa-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  autoFocus
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </Field>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={close} disabled={pending}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant={step.purpose === 'disable' ? 'destructive' : 'default'}
                  disabled={pending}
                >
                  {pending && <Spinner />}
                  Continue
                </Button>
              </DialogFooter>
            </form>
          )}

          {step.kind === 'verify' && (
            <form onSubmit={handleVerify} className="flex flex-col gap-4">
              <DialogHeader>
                <DialogTitle>Scan the QR code</DialogTitle>
                <DialogDescription>
                  Scan this with your authenticator app, then enter the 6-digit code it shows.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center gap-3">
                <div className="rounded-xl bg-white p-3">
                  <QRCodeSVG value={step.totpURI} size={176} aria-label="Two-factor setup QR code" />
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  Can&apos;t scan? Enter this key manually:
                  <span className="mt-1 block font-mono text-sm break-all text-foreground select-all">
                    {secretFromUri(step.totpURI)}
                  </span>
                </p>
              </div>
              <Field className="items-center">
                <FieldLabel htmlFor="twofa-code" className="sr-only">
                  Verification code
                </FieldLabel>
                <InputOTP
                  id="twofa-code"
                  maxLength={6}
                  value={code}
                  onChange={setCode}
                  autoFocus
                  inputMode="numeric"
                >
                  <InputOTPGroup>
                    {Array.from({ length: 6 }, (_, index) => (
                      <InputOTPSlot key={index} index={index} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </Field>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={close} disabled={pending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={pending || code.length !== 6}>
                  {pending && <Spinner />}
                  Verify and enable
                </Button>
              </DialogFooter>
            </form>
          )}

          {step.kind === 'codes' && (
            <div className="flex flex-col gap-4">
              <DialogHeader>
                <DialogTitle>Save your backup codes</DialogTitle>
                <DialogDescription>
                  Each code works once if you lose access to your authenticator. They won&apos;t be shown
                  again.
                </DialogDescription>
              </DialogHeader>
              <BackupCodes codes={step.backupCodes} />
              <DialogFooter>
                <Button onClick={close}>Done</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}

function PasskeysCard({ passkeys }: { passkeys: PasskeySummary[] }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [adding, setAdding] = useState(false)

  async function handleAdd(event: FormEvent) {
    event.preventDefault()
    setAdding(true)
    try {
      const result = await authClient.passkey.addPasskey({
        name: name.trim() || undefined,
      })
      if (result?.error) throw new Error(result.error.message ?? 'Could not add the passkey.')
      setName('')
      toast.success('Passkey added.')
      router.refresh()
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(id: string) {
    const { error } = await authClient.passkey.deletePasskey({ id })
    if (error) {
      toast.error(error.message ?? 'Could not delete the passkey.')
      return
    }
    toast.success('Passkey removed.')
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Passkeys</CardTitle>
        <CardDescription>
          Sign in with your fingerprint, face, or a security key. Passkey sign-ins count as strongly
          verified.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {passkeys.length > 0 && (
          <ItemGroup className="gap-2">
            {passkeys.map((passkey) => (
              <Item key={passkey.id} variant="outline" size="sm">
                <ItemMedia variant="icon">
                  <KeyRound aria-hidden="true" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{passkey.name || 'Unnamed passkey'}</ItemTitle>
                  <ItemDescription>
                    Added {formatUtcDate(passkey.createdAt)}
                    {passkey.backedUp ? ' - synced' : ''}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <ConfirmButton
                    size="icon-sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive"
                    title="Remove this passkey?"
                    description="You won't be able to sign in with it anymore."
                    confirmLabel="Remove"
                    onConfirm={() => handleDelete(passkey.id)}
                  >
                    <Trash2 aria-hidden="true" />
                    <span className="sr-only">Remove {passkey.name || 'passkey'}</span>
                  </ConfirmButton>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        )}
        <form onSubmit={handleAdd}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="passkey-name">Passkey name</FieldLabel>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="passkey-name"
                  placeholder="e.g. MacBook Touch ID"
                  maxLength={60}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
                <Button type="submit" disabled={adding} className="shrink-0">
                  {adding ? <Spinner /> : <Plus aria-hidden="true" />}
                  Add passkey
                </Button>
              </div>
              <FieldDescription>Optional. Helps you tell your passkeys apart.</FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}

export function SecuritySection({
  twoFactorEnabled,
  authMethod,
  isAdmin,
  passkeys,
}: {
  twoFactorEnabled: boolean
  authMethod: AuthMethod
  isAdmin: boolean
  passkeys: PasskeySummary[]
}) {
  const strong = authMethod === '2fa' || authMethod === 'passkey'
  return (
    <div className="flex flex-col gap-6">
      <Alert variant={isAdmin && !strong ? 'destructive' : 'default'}>
        <ShieldCheck aria-hidden="true" />
        <AlertTitle>This session: {METHOD_LABELS[authMethod]}</AlertTitle>
        <AlertDescription>
          {isAdmin && !strong
            ? 'The admin panel requires a session verified with 2FA or a passkey. Enable one below, then sign out and sign back in with it.'
            : strong
              ? 'This session is strongly verified.'
              : 'Add 2FA or a passkey to better protect your account.'}
        </AlertDescription>
      </Alert>
      <TwoFactorCard enabled={twoFactorEnabled} />
      <PasskeysCard passkeys={passkeys} />
    </div>
  )
}
