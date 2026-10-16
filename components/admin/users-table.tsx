'use client'

import { Ban, LogOut, MoreHorizontal, Search, ShieldCheck, Trash2, UserCheck } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import {
  banUserAction,
  removeUserAction,
  revokeSessionsAction,
  unbanUserAction,
} from '@/app/(admin)/admin/actions'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatUtcDate } from '@/lib/dates'

export type AdminUserRow = {
  id: string
  name: string
  email: string
  username: string | null
  role: string
  banned: boolean
  banReason: string | null
  twoFactorEnabled: boolean
  createdAt: string
}

type PendingAction = { kind: 'ban' | 'unban' | 'revoke' | 'remove'; user: AdminUserRow } | null

const ACTION_COPY = {
  ban: {
    title: 'Ban this user?',
    description: 'They will be signed out everywhere and blocked from signing in.',
    confirm: 'Ban user',
    destructive: true,
  },
  unban: {
    title: 'Unban this user?',
    description: 'They will be able to sign in again.',
    confirm: 'Unban user',
    destructive: false,
  },
  revoke: {
    title: 'Sign out all sessions?',
    description: 'Every active session for this user will be ended.',
    confirm: 'Sign out everywhere',
    destructive: false,
  },
  remove: {
    title: 'Delete this user?',
    description:
      'Their account, active challenge, history, and settings are permanently deleted. This cannot be undone.',
    confirm: 'Delete user',
    destructive: true,
  },
} as const

export function UsersTable({
  users,
  currentUserId,
}: {
  users: AdminUserRow[]
  currentUserId: string
}) {
  const [query, setQuery] = useState('')
  const [action, setAction] = useState<PendingAction>(null)
  const [banReason, setBanReason] = useState('')
  const [pending, setPending] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter((user) =>
      [user.name, user.email, user.username ?? ''].some((value) => value.toLowerCase().includes(q)),
    )
  }, [users, query])

  async function handleConfirm(event: FormEvent) {
    event.preventDefault()
    if (!action) return
    setPending(true)
    const { kind, user } = action
    const result =
      kind === 'ban'
        ? await banUserAction(user.id, banReason)
        : kind === 'unban'
          ? await unbanUserAction(user.id)
          : kind === 'revoke'
            ? await revokeSessionsAction(user.id)
            : await removeUserAction(user.id)
    setPending(false)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success(
      {
        ban: `${user.name} was banned.`,
        unban: `${user.name} was unbanned.`,
        revoke: `${user.name} was signed out everywhere.`,
        remove: `${user.name} was deleted.`,
      }[kind],
    )
    setAction(null)
    setBanReason('')
  }

  const copy = action ? ACTION_COPY[action.kind] : null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>Ban, sign out, or delete accounts. The admin account is protected.</CardDescription>
        <CardAction>
          <Badge variant="secondary" className="font-mono tabular-nums">
            {users.length}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <label htmlFor="user-search" className="sr-only">
            Search users
          </label>
          <Input
            id="user-search"
            type="search"
            placeholder="Search by name, email, or username"
            className="pl-8"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="-mx-(--card-spacing) overflow-x-auto sm:mx-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="hidden lg:table-cell">Joined</TableHead>
                <TableHead className="text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    No users match your search.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((user) => {
                const protectedRow = user.id === currentUserId || user.role === 'admin'
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex min-w-0 flex-col">
                        <span className="flex items-center gap-2 font-medium">
                          {user.name}
                          {user.role === 'admin' && (
                            <Badge variant="default" className="gap-1">
                              <ShieldCheck aria-hidden="true" />
                              Admin
                            </Badge>
                          )}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {user.email}
                          {user.username ? ` - @${user.username}` : ''}
                        </span>
                        <span className="mt-1 flex gap-1 md:hidden">
                          {user.banned && <Badge variant="destructive">Banned</Badge>}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {user.banned ? (
                          <Badge variant="destructive" title={user.banReason ?? undefined}>
                            Banned
                          </Badge>
                        ) : (
                          <Badge variant="outline">Active</Badge>
                        )}
                        {user.twoFactorEnabled && <Badge variant="secondary">2FA</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">
                      {formatUtcDate(user.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      {protectedRow ? (
                        <span className="text-xs text-muted-foreground">
                          {user.id === currentUserId ? 'You' : 'Protected'}
                        </span>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                            <MoreHorizontal aria-hidden="true" />
                            <span className="sr-only">Actions for {user.name}</span>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {user.banned ? (
                              <DropdownMenuItem onClick={() => setAction({ kind: 'unban', user })}>
                                <UserCheck aria-hidden="true" />
                                Unban
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => setAction({ kind: 'ban', user })}>
                                <Ban aria-hidden="true" />
                                Ban
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => setAction({ kind: 'revoke', user })}>
                              <LogOut aria-hidden="true" />
                              Sign out everywhere
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setAction({ kind: 'remove', user })}
                            >
                              <Trash2 aria-hidden="true" />
                              Delete user
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <AlertDialog
        open={action !== null}
        onOpenChange={(open) => {
          if (!open && !pending) {
            setAction(null)
            setBanReason('')
          }
        }}
      >
        <AlertDialogContent>
          {action && copy && (
            <form onSubmit={handleConfirm} className="flex flex-col gap-4">
              <AlertDialogHeader>
                <AlertDialogTitle>{copy.title}</AlertDialogTitle>
                <AlertDialogDescription>
                  <span className="font-medium text-foreground">{action.user.name}</span> (
                  {action.user.email}). {copy.description}
                </AlertDialogDescription>
              </AlertDialogHeader>
              {action.kind === 'ban' && (
                <Field>
                  <FieldLabel htmlFor="ban-reason">Reason (optional)</FieldLabel>
                  <Input
                    id="ban-reason"
                    maxLength={200}
                    value={banReason}
                    onChange={(event) => setBanReason(event.target.value)}
                  />
                </Field>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel type="button" disabled={pending}>
                  Cancel
                </AlertDialogCancel>
                <Button
                  type="submit"
                  variant={copy.destructive ? 'destructive' : 'default'}
                  disabled={pending}
                >
                  {pending && <Spinner />}
                  {copy.confirm}
                </Button>
              </AlertDialogFooter>
            </form>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
