import { House } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Brand } from '@/components/brand'
import { GoBackButton } from '@/components/go-back-button'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Page not found' }

const STREAK = [1, 1, 0.8, 1, 1, 0.6, 1, 1, 1, 0.9, 1, 0.7, 1, 1, 1, 0.8, 1, 1, 0.5, 1, 1]

export default function NotFound() {
  return (
    <div className="relative isolate flex min-h-dvh flex-col overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 -z-10 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="flex justify-center p-6">
        <Brand />
      </div>

      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="flex w-full max-w-lg flex-col items-center gap-10 text-center">
          <div aria-hidden="true" className="flex items-end gap-3 sm:gap-4">
            <div className="grid grid-cols-7 gap-1.5">
              {STREAK.map((value, index) => (
                <span
                  key={index}
                  className="size-4 rounded-[5px] bg-primary sm:size-5"
                  style={{ opacity: 0.25 + value * 0.6 }}
                />
              ))}
            </div>
            <span className="flex size-12 items-center justify-center rounded-xl border-2 border-dashed border-destructive/60 font-mono text-xs font-semibold text-destructive sm:size-14 sm:text-sm">
              404
            </span>
          </div>

          <div className="flex flex-col items-center gap-4">
            <p className="font-mono text-sm font-medium uppercase tracking-widest text-primary">Error 404</p>
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              Day 404 isn&apos;t on the calendar
            </h1>
            <p className="max-w-md text-pretty leading-relaxed text-muted-foreground">
              A challenge only has 21 days, and this page isn&apos;t one of them. The link may be wrong, or the page
              may have moved.
            </p>
          </div>

          <div className="flex w-full flex-col-reverse gap-3 sm:w-auto sm:flex-row">
            <GoBackButton />
            <Button size="lg" nativeButton={false} render={<Link href="/" />}>
              <House data-icon="inline-start" aria-hidden="true" />
              Back to dashboard
            </Button>
          </div>
        </div>
      </main>

      <p className="pb-6 text-center font-mono text-xs text-muted-foreground">Keep the streak going.</p>
    </div>
  )
}
