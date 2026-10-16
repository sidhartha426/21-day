import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
import { auth, type AuthMethod, type Session } from '@/lib/auth'

export async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}

export async function requireSession() {
  const session = await getSession()
  if (!session) redirect('/sign-in')
  return session
}

export function getAuthMethod(session: Session): AuthMethod {
  return ((session.session as { authMethod?: string }).authMethod as AuthMethod) ?? 'password'
}

export function hasStrongAuth(session: Session) {
  const method = getAuthMethod(session)
  return method === '2fa' || method === 'passkey'
}

export function isAdmin(session: Session) {
  return session.user.role === 'admin'
}

/** For server actions: throws instead of redirecting so callers can show an error. */
export async function assertStrongAdmin() {
  const session = await getSession()
  if (!session || !isAdmin(session)) throw new Error('Not authorized.')
  if (!hasStrongAuth(session)) {
    throw new Error('Admin actions require a session verified with 2FA or a passkey.')
  }
  return session
}

export async function getApiSession() {
  const session = await getSession()
  if (!session) {
    return {
      session: null,
      unauthorized: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    } as const
  }
  return { session, unauthorized: null } as const
}
