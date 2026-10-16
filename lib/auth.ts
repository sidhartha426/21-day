import { passkey } from '@better-auth/passkey'
import { betterAuth } from 'better-auth'
import { APIError, createAuthMiddleware, getSessionFromCtx } from 'better-auth/api'
import { nextCookies } from 'better-auth/next-js'
import { admin, twoFactor, username } from 'better-auth/plugins'
import {
  findValidInvitation,
  getSignupsEnabled,
  markInvitationAccepted,
} from '@/lib/app-settings'
import { purgeUserData } from '@/lib/challenge-store'
import { countAdmins, countUsers, sqlite } from '@/lib/db/sqlite'
import { renderEmail, sendMail } from '@/lib/mailer'
import { APP_NAME } from '@/lib/app-config'

export { APP_NAME }
export const INVITE_HEADER = 'x-invite-token'

export const baseURL =
  process.env.BETTER_AUTH_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : (process.env.V0_RUNTIME_URL ?? 'http://localhost:3000'))

const trustedOrigins = [
  ...(process.env.NODE_ENV === 'development'
    ? [
        'http://localhost:3000',
        ...(process.env.V0_RUNTIME_URL ? [process.env.V0_RUNTIME_URL] : []),
        ...(process.env.V0_DEV_APP_URL ? [process.env.V0_DEV_APP_URL] : []),
        ...(process.env.V0_BUILD_URL ? [process.env.V0_BUILD_URL] : []),
        ...(process.env.V0_SANDBOX_URL ? [process.env.V0_SANDBOX_URL] : []),
      ]
    : []),
  ...(process.env.NODE_ENV === 'production'
    ? [
        ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
        ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
        ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
          ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
          : []),
      ]
    : []),
]

const passkeyOrigins = [...new Set([new URL(baseURL).origin, ...trustedOrigins])]

/** How the current session was established. Admin access requires a strong method. */
export type AuthMethod = 'password' | '2fa' | 'passkey'

// Admin-plugin endpoints that would break the single-admin model or bypass invites.
const BLOCKED_ADMIN_PATHS = new Set([
  '/admin/set-role',
  '/admin/create-user',
  '/admin/update-user',
  '/admin/impersonate-user',
  '/admin/set-user-password',
])

function resolveAuthMethod(path: string, previous: unknown): AuthMethod {
  const prior = typeof previous === 'string' ? (previous as AuthMethod) : undefined
  if (path.startsWith('/passkey/')) return 'passkey'
  if (path.startsWith('/two-factor/verify')) return '2fa'
  if (path === '/two-factor/disable') return prior === 'passkey' ? 'passkey' : 'password'
  if (path.startsWith('/sign-in/') || path.startsWith('/sign-up/')) return 'password'
  return prior ?? 'password'
}

export const auth = betterAuth({
  appName: APP_NAME,
  database: sqlite,
  baseURL,
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendMail({
        to: user.email,
        subject: `Reset your ${APP_NAME} password`,
        text: `Reset your password using this link (valid for 1 hour): ${url}`,
        html: renderEmail({
          heading: 'Reset your password',
          body: 'Someone requested a password reset for your account. If this was you, use the button below. The link expires in 1 hour.',
          action: { label: 'Reset password', url },
        }),
      })
    },
  },
  user: {
    deleteUser: { enabled: true },
    additionalFields: {
      // Account-level theme ('light' | 'dark' | 'system'), applied on every sign-in.
      // Written only through PUT /api/settings/theme, which validates the value.
      theme: { type: 'string', required: false, input: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    additionalFields: {
      // No default value on purpose: Better Auth applies defaults after copying
      // an existing session, which would erase the method on 2FA enable/disable.
      authMethod: { type: 'string', required: false, input: false },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // The very first account becomes the single administrator.
          const role = countAdmins() === 0 ? 'admin' : 'user'
          return { data: { ...user, role } }
        },
        after: async (user, ctx) => {
          const token = ctx?.headers?.get(INVITE_HEADER)
          if (token) markInvitationAccepted(token, user.id)
        },
      },
      delete: {
        before: async (user) => {
          if ((user as { role?: string }).role === 'admin') {
            throw new APIError('FORBIDDEN', {
              message: 'The administrator account cannot be deleted.',
            })
          }
        },
        after: async (user) => {
          try {
            await purgeUserData(user.id)
          } catch (error) {
            console.error('[auth] Failed to purge progress data for deleted user', error)
          }
        },
      },
    },
    session: {
      create: {
        before: async (session, ctx) => {
          const authMethod = resolveAuthMethod(
            ctx?.path ?? '',
            (session as { authMethod?: unknown }).authMethod,
          )
          return { data: { ...session, authMethod } }
        },
      },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === '/sign-up/email') {
        if (countUsers() === 0) return

        const token = ctx.headers?.get(INVITE_HEADER)
        if (token) {
          const invitation = findValidInvitation(token)
          const email = String(ctx.body?.email ?? '').trim().toLowerCase()
          if (!invitation || invitation.email !== email) {
            throw new APIError('FORBIDDEN', {
              message: 'This invitation is invalid, expired, or for a different email.',
            })
          }
          return
        }

        if (!getSignupsEnabled()) {
          throw new APIError('FORBIDDEN', {
            message: 'New sign-ups are disabled. Ask the administrator for an invitation.',
          })
        }
        return
      }

      if (ctx.path.startsWith('/admin/')) {
        if (BLOCKED_ADMIN_PATHS.has(ctx.path)) {
          throw new APIError('FORBIDDEN', { message: 'This admin action is disabled.' })
        }
        const session = await getSessionFromCtx(ctx)
        const method = (session?.session as { authMethod?: string } | undefined)?.authMethod
        if (session?.user.role === 'admin' && method !== '2fa' && method !== 'passkey') {
          throw new APIError('FORBIDDEN', {
            message: 'Admin actions require a session verified with 2FA or a passkey.',
          })
        }
      }
    }),
  },
  plugins: [
    username({ minUsernameLength: 3, maxUsernameLength: 30 }),
    twoFactor({ issuer: APP_NAME }),
    passkey({
      rpID: process.env.PASSKEY_RP_ID || new URL(baseURL).hostname,
      rpName: APP_NAME,
      origin: passkeyOrigins,
    }),
    admin({ defaultRole: 'user', adminRoles: ['admin'] }),
    nextCookies(),
  ],
  ...(process.env.NODE_ENV === 'development'
    ? {
        advanced: {
          // Required by the cross-site v0 preview iframe. Without these
          // attributes, login succeeds but the next request appears signed out.
          defaultCookieAttributes: {
            sameSite: 'none' as const,
            secure: true,
          },
        },
      }
    : {}),
})

export type Session = typeof auth.$Infer.Session
