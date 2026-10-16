import { notFound } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { isAdmin, requireSession } from '@/lib/session'

// The admin check lives in this layout (not the page) so a non-admin's 404 is thrown
// above the app shell and renders the standalone not-found page without the header.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession()
  if (!isAdmin(session)) notFound()
  return <AppShell session={session}>{children}</AppShell>
}
