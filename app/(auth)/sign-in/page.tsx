import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { SignInForm } from '@/components/auth/sign-in-form'
import { getSignupsEnabled } from '@/lib/app-settings'
import { countUsers } from '@/lib/db/sqlite'
import { getSession } from '@/lib/session'

export const metadata: Metadata = { title: 'Sign in' }

export default async function SignInPage() {
  const session = await getSession()
  if (session) redirect('/dashboard')
  if (countUsers() === 0) redirect('/sign-up')

  return <SignInForm signupsEnabled={getSignupsEnabled()} />
}
