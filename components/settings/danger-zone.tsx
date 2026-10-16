'use client'

import { Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { authClient } from '@/lib/auth-client'

const CONFIRM_PHRASE = 'delete my account'

export function DangerZone({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [phrase, setPhrase] = useState('')
  const [pending, setPending] = useState(false)

  async function handleDelete(event: FormEvent) {
    event.preventDefault()
    if (phrase.trim().toLowerCase() !== CONFIRM_PHRASE) return
    setPending(true)
    const { error } = await authClient.deleteUser({ password })
    if (error) {
      setPending(false)
      toast.error(error.message ?? 'Could not delete your account.')
      return
    }
    window.location.assign('/sign-in')
  }

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle>Delete account</CardTitle>
        <CardDescription>
          Permanently delete your account, your active challenge, your history, and your notification
          settings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isAdmin ? (
          <Alert>
            <AlertTitle>The admin account can&apos;t be deleted</AlertTitle>
            <AlertDescription>
              This app has exactly one administrator, so this account is protected from deletion.
            </AlertDescription>
          </Alert>
        ) : (
          <Dialog
            open={open}
            onOpenChange={(next) => {
              if (pending) return
              setOpen(next)
              if (!next) {
                setPassword('')
                setPhrase('')
              }
            }}
          >
            <DialogTrigger render={<Button variant="destructive" />}>
              <Trash2 aria-hidden="true" />
              Delete my account
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <form onSubmit={handleDelete} className="flex flex-col gap-4">
                <DialogHeader>
                  <DialogTitle>Delete your account?</DialogTitle>
                  <DialogDescription>
                    All of your data is erased immediately. This cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <Field>
                  <FieldLabel htmlFor="delete-password">Password</FieldLabel>
                  <Input
                    id="delete-password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="delete-phrase">Confirmation</FieldLabel>
                  <Input
                    id="delete-phrase"
                    autoComplete="off"
                    required
                    value={phrase}
                    onChange={(event) => setPhrase(event.target.value)}
                  />
                  <FieldDescription>
                    Type <span className="font-mono text-foreground">{CONFIRM_PHRASE}</span> to confirm.
                  </FieldDescription>
                </Field>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={pending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="destructive"
                    disabled={pending || phrase.trim().toLowerCase() !== CONFIRM_PHRASE}
                  >
                    {pending && <Spinner />}
                    Delete forever
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  )
}
