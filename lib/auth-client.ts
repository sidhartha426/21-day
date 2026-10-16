'use client'

import { passkeyClient } from '@better-auth/passkey/client'
import {
  adminClient,
  inferAdditionalFields,
  twoFactorClient,
  usernameClient,
} from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'
import type { auth } from '@/lib/auth'

export const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields<typeof auth>(),
    usernameClient(),
    twoFactorClient({
      onTwoFactorRedirect() {
        window.location.href = '/two-factor'
      },
    }),
    passkeyClient(),
    adminClient(),
  ],
})

export const { signIn, signUp, signOut, useSession } = authClient
