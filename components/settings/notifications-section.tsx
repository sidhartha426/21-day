'use client'

import { Mail, Send, TriangleAlert } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { fetchJson } from '@/lib/fetcher'
import type { PublicNotificationSettings } from '@/lib/notification-settings'

type Channel = 'email' | 'ntfy'

function TestButton({
  channel,
  disabled,
  dirty,
}: {
  channel: Channel
  disabled: boolean
  dirty: boolean
}) {
  const [pending, setPending] = useState(false)

  async function handleTest() {
    setPending(true)
    try {
      await fetchJson('/api/settings/notifications/test', {
        method: 'POST',
        body: JSON.stringify({ channel }),
      })
      toast.success(`Test ${channel === 'email' ? 'email' : 'ntfy notification'} sent.`)
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setPending(false)
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={handleTest}
      disabled={disabled || dirty || pending}
      title={dirty ? 'Save your changes before sending a test.' : undefined}
    >
      {pending ? <Spinner /> : <Send aria-hidden="true" />}
      Send test
    </Button>
  )
}

export function NotificationsSection({
  email,
  initialSettings,
  mailConfigured,
}: {
  email: string
  initialSettings: PublicNotificationSettings
  mailConfigured: boolean
}) {
  const [saved, setSaved] = useState(initialSettings)
  const [emailEnabled, setEmailEnabled] = useState(initialSettings.emailEnabled)
  const [ntfyEnabled, setNtfyEnabled] = useState(initialSettings.ntfyEnabled)
  const [ntfyServer, setNtfyServer] = useState(initialSettings.ntfyServer)
  const [ntfyTopic, setNtfyTopic] = useState(initialSettings.ntfyTopic)
  const [ntfyToken, setNtfyToken] = useState('')
  const [removeToken, setRemoveToken] = useState(false)
  const [pending, setPending] = useState(false)

  const dirty =
    emailEnabled !== saved.emailEnabled ||
    ntfyEnabled !== saved.ntfyEnabled ||
    ntfyServer !== saved.ntfyServer ||
    ntfyTopic !== saved.ntfyTopic ||
    ntfyToken !== '' ||
    removeToken

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    try {
      const { settings } = await fetchJson<{ settings: PublicNotificationSettings }>(
        '/api/settings/notifications',
        {
          method: 'PUT',
          body: JSON.stringify({
            emailEnabled,
            ntfyEnabled,
            ntfyServer,
            ntfyTopic,
            ...(removeToken ? { ntfyToken: null } : ntfyToken ? { ntfyToken } : {}),
          }),
        },
      )
      setSaved(settings)
      setNtfyServer(settings.ntfyServer)
      setNtfyTopic(settings.ntfyTopic)
      setNtfyToken('')
      setRemoveToken(false)
      toast.success('Notification settings saved.')
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Email</CardTitle>
          <CardDescription>
            Receive your PDF report at <span className="font-medium text-foreground">{email}</span>{' '}
            when a challenge is complete.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!mailConfigured && (
            <Alert>
              <TriangleAlert aria-hidden="true" />
              <AlertDescription>
                SMTP isn&apos;t configured on the server, so email notifications are unavailable. Set
                the SMTP_* environment variables to enable them.
              </AlertDescription>
            </Alert>
          )}
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel htmlFor="email-enabled">
                <Mail aria-hidden="true" className="size-4" />
                Email reports
              </FieldLabel>
              <FieldDescription>Sent as a PDF attachment.</FieldDescription>
            </FieldContent>
            <Switch
              id="email-enabled"
              checked={emailEnabled}
              onCheckedChange={setEmailEnabled}
              disabled={!mailConfigured && !emailEnabled}
            />
          </Field>
          <TestButton channel="email" disabled={!mailConfigured || !saved.emailEnabled} dirty={dirty} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ntfy</CardTitle>
          <CardDescription>
            Push your report to any device subscribed to an{' '}
            <a
              href="https://ntfy.sh"
              target="_blank"
              rel="noreferrer"
              className="text-foreground underline underline-offset-4"
            >
              ntfy
            </a>{' '}
            topic.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field orientation="horizontal">
              <FieldContent>
                <FieldLabel htmlFor="ntfy-enabled">ntfy reports</FieldLabel>
                <FieldDescription>The PDF is attached to the notification.</FieldDescription>
              </FieldContent>
              <Switch id="ntfy-enabled" checked={ntfyEnabled} onCheckedChange={setNtfyEnabled} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="ntfy-server">Server</FieldLabel>
                <Input
                  id="ntfy-server"
                  type="url"
                  inputMode="url"
                  placeholder="https://ntfy.sh"
                  value={ntfyServer}
                  onChange={(event) => setNtfyServer(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="ntfy-topic">Topic</FieldLabel>
                <Input
                  id="ntfy-topic"
                  placeholder="my-private-topic"
                  pattern="[A-Za-z0-9_\-]{1,64}"
                  maxLength={64}
                  required={ntfyEnabled}
                  value={ntfyTopic}
                  onChange={(event) => setNtfyTopic(event.target.value)}
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="ntfy-token">Access token</FieldLabel>
              <Input
                id="ntfy-token"
                type="password"
                autoComplete="off"
                placeholder={saved.hasNtfyToken && !removeToken ? 'Saved - leave blank to keep' : 'tk_...'}
                value={ntfyToken}
                disabled={removeToken}
                onChange={(event) => setNtfyToken(event.target.value)}
              />
              <FieldDescription>
                Only needed for protected topics or self-hosted servers with auth.
                {saved.hasNtfyToken && (
                  <>
                    {' '}
                    <button
                      type="button"
                      className="text-foreground underline underline-offset-4"
                      onClick={() => {
                        setRemoveToken((value) => !value)
                        setNtfyToken('')
                      }}
                    >
                      {removeToken ? 'Keep saved token' : 'Remove saved token'}
                    </button>
                  </>
                )}
              </FieldDescription>
            </Field>
            <TestButton
              channel="ntfy"
              disabled={!saved.ntfyEnabled || !saved.ntfyTopic}
              dirty={dirty}
            />
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={!dirty || pending}>
          {pending && <Spinner />}
          Save notification settings
        </Button>
        {dirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
      </div>
    </form>
  )
}
