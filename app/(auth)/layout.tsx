import { Brand } from '@/components/brand'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'

const PREVIEW_FILLED = [1, 1, 1, 1, 0.6, 1, 1, 1, 0.3, 1, 1, 1, 1, 0.8, 1, 1, 0, 0, 0, 0, 0]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col">
        <header className="flex items-center justify-between p-4 md:p-6">
          <Brand />
          <ThemeToggle />
        </header>
        <main className="flex flex-1 items-center justify-center px-4 pb-12 md:px-6">
          <div className="w-full max-w-sm">{children}</div>
        </main>
      </div>
      <aside className="relative hidden flex-col justify-between overflow-hidden border-l bg-muted/40 p-10 lg:flex">
        <div className="max-w-md">
          <p className="text-sm font-medium text-primary">21-day sessions challenge</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight">
            Small daily reps. A streak you can actually see.
          </h2>
          <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
            Set your ideal sessions per day, log your progress, fix mistakes, and walk away with a PDF report and an honest score.
          </p>
        </div>
        <div aria-hidden="true" className="grid w-fit grid-cols-7 gap-2">
          {PREVIEW_FILLED.map((value, index) => (
            <div
              key={index}
              className={cn(
                'size-11 rounded-lg border',
                value === 0 ? 'bg-background' : 'border-transparent bg-primary',
              )}
              style={value > 0 ? { opacity: 0.35 + value * 0.65 } : undefined}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Your data stays on your server.</p>
      </aside>
    </div>
  )
}
