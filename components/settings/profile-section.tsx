'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import type { SettingsUser } from '@/components/settings/settings-tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { authClient } from '@/lib/auth-client'

function ProfileForm({ user }: { user: SettingsUser }) {
  const router = useRouter()
  const [name, setName] = useState(user.name)
  const [username, setUsername] = useState(user.username)
  const [pending, setPending] = useState(false)
  const dirty = name.trim() !== user.name || username.trim().toLowerCase() !== user.username

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    const { error } = await authClient.updateUser({
      name: name.trim(),
      ...(username.trim().toLowerCase() !== user.username ? { username: username.trim() } : {}),
    })
    setPending(false)
    if (error) {
      toast.error(error.message ?? 'Could not update your profile.')
      return
    }
    toast.success('Profile updated.')
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Your display name and the username you can sign in with.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="profile-name">Name</FieldLabel>
              <Input
                id="profile-name"
                autoComplete="name"
                required
                maxLength={100}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="profile-username">Username</FieldLabel>
              <Input
                id="profile-username"
                autoComplete="username"
                required
                minLength={3}
                maxLength={30}
                pattern="[A-Za-z0-9_.]+"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
              <FieldDescription>3-30 characters: letters, numbers, dots and underscores.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="profile-email">Email</FieldLabel>
              <Input id="profile-email" type="email" value={user.email} readOnly disabled />
            </Field>
            <Button type="submit" className="self-start" disabled={!dirty || pending}>
              {pending && <Spinner />}
              Save profile
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}

function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('The new passwords do not match.')
      return
    }
    setPending(true)
    const { error } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    })
    setPending(false)
    if (error) {
      toast.error(error.message ?? 'Could not change your password.')
      return
    }
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    toast.success('Password changed. Other sessions were signed out.')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password</CardTitle>
        <CardDescription>Changing your password signs out all your other sessions.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="current-password">Current password</FieldLabel>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="new-password">New password</FieldLabel>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="confirm-password">Confirm new password</FieldLabel>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </Field>
            </div>
            <Button type="submit" className="self-start" disabled={pending}>
              {pending && <Spinner />}
              Change password
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}

export function ProfileSection({ user }: { user: SettingsUser }) {
  return (
    <div className="flex flex-col gap-6">
      <ProfileForm user={user} />
      <PasswordForm />
    </div>
  )
}
