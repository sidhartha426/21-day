'use client'

import { Copy, MailPlus, X } from 'lucide-react'
import { useState, useTransition, type FormEvent } from 'react'
import { toast } from 'sonner'
import { inviteUserAction, revokeInvitationAction } from '@/app/(admin)/admin/actions'
import { ConfirmButton } from '@/components/confirm-button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from '@/components/ui/item'
import { Spinner } from '@/components/ui/spinner'
import { formatUtcDayMonth } from '@/lib/dates'

type PendingInvite = { id: string; email: string; createdAt: string; expiresAt: string }

export function InvitationsCard({
  invitations,
  mailConfigured,
}: {
  invitations: PendingInvite[]
  mailConfigured: boolean
}) {
  const [email, setEmail] = useState('')
  const [lastLink, setLastLink] = useState<{ email: string; link: string } | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const target = email
    startTransition(async () => {
      const result = await inviteUserAction(target)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setEmail('')
      if (result.emailed) {
        setLastLink(null)
        toast.success(`Invitation sent to ${target}.`)
      } else {
        setLastLink({ email: target, link: result.link })
        toast.success('Invitation created. Copy the link to share it.')
      }
    })
  }

  async function handleRevoke(id: string) {
    const result = await revokeInvitationAction(id)
    if (!result.ok) toast.error(result.error)
    else toast.success('Invitation revoked.')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invitations</CardTitle>
        <CardDescription>
          {mailConfigured
            ? 'Invite someone by email. Links expire after 7 days and work even when sign-ups are off.'
            : 'SMTP is not configured, so you will get a link to share manually. Links expire after 7 days.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form onSubmit={handleSubmit}>
          <Field>
            <FieldLabel htmlFor="invite-email" className="sr-only">
              Email address
            </FieldLabel>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="invite-email"
                type="email"
                required
                autoComplete="off"
                placeholder="friend@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <Button type="submit" disabled={pending} className="shrink-0">
                {pending ? <Spinner /> : <MailPlus aria-hidden="true" />}
                {mailConfigured ? 'Send invite' : 'Create invite'}
              </Button>
            </div>
          </Field>
        </form>

        {lastLink && (
          <Alert>
            <AlertTitle>Invite link for {lastLink.email}</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <code className="block w-full rounded-md bg-muted px-2 py-1.5 font-mono text-xs break-all text-foreground">
                {lastLink.link}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await navigator.clipboard.writeText(lastLink.link)
                  toast.success('Link copied.')
                }}
              >
                <Copy aria-hidden="true" />
                Copy link
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {invitations.length > 0 ? (
          <ItemGroup className="gap-2">
            {invitations.map((invite) => (
              <Item key={invite.id} variant="outline" size="sm">
                <ItemContent>
                  <ItemTitle className="break-all">{invite.email}</ItemTitle>
                  <ItemDescription>
                    Sent {formatUtcDayMonth(invite.createdAt)} - expires{' '}
                    {formatUtcDayMonth(invite.expiresAt)}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <ConfirmButton
                    size="icon-sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive"
                    title="Revoke this invitation?"
                    description={`The link sent to ${invite.email} will stop working.`}
                    confirmLabel="Revoke"
                    onConfirm={() => handleRevoke(invite.id)}
                  >
                    <X aria-hidden="true" />
                    <span className="sr-only">Revoke invitation for {invite.email}</span>
                  </ConfirmButton>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        ) : (
          <FieldDescription>No pending invitations.</FieldDescription>
        )}
      </CardContent>
    </Card>
  )
}
