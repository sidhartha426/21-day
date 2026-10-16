import { ArrowRight, Server, ShieldCheck } from "lucide-react"
import dashboardDark from "@screenshots/dashboard.png"
import dashboardLight from "@screenshots/dashboard-light.png"
import { BrowserFrame } from "@/components/browser-frame"
import { CommandLine } from "@/components/copy-button"
import { GitHubIcon } from "@/components/github-icon"
import { useTheme } from "@/components/theme-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { INSTALL_COMMAND, REPO_URL } from "@/lib/site"

export function Hero() {
  const { theme } = useTheme()

  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-12 px-4 pt-16 pb-16 md:px-6 md:pt-24 md:pb-24">
        <div className="flex w-full max-w-3xl flex-col items-center gap-6 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge variant="secondary">
              <ShieldCheck data-icon="inline-start" />
              Open source, MIT
            </Badge>
            <Badge variant="outline">
              <Server data-icon="inline-start" />
              Self-hosted with Docker
            </Badge>
          </div>

          <h1
            id="hero-title"
            className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl"
          >
            Twenty-one days.
            <br />
            <span className="text-primary">One honest score.</span>
          </h1>

          <p className="max-w-2xl text-lg leading-relaxed text-pretty text-muted-foreground">
            A self-hostable, multi-user tracker for 21-day practice challenges. Pick a daily target,
            log what you actually did, and get a fractional star rating and a PDF report at the end.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="px-4">
              <a href="#self-host">
                Self-host it
                <ArrowRight data-icon="inline-end" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="px-4">
              <a href={REPO_URL} target="_blank" rel="noreferrer">
                <GitHubIcon data-icon="inline-start" />
                View on GitHub
              </a>
            </Button>
          </div>

          <div className="w-full max-w-lg">
            <CommandLine command={INSTALL_COMMAND} />
          </div>
        </div>

        <div className="relative w-full max-w-5xl">
          <div
            className="pointer-events-none absolute inset-x-[10%] top-[10%] -z-10 h-3/4 rounded-full bg-primary/20 blur-3xl"
            aria-hidden="true"
          />
          <BrowserFrame url="21-day.example.com/dashboard">
            <img
              src={theme === "dark" ? dashboardDark : dashboardLight}
              alt="21-day dashboard showing 14 of 21 days completed, a 65.5% score, a star rating and the streak map"
              width={1440}
              height={900}
              className="block h-auto w-full"
              fetchPriority="high"
            />
          </BrowserFrame>
        </div>
      </div>
    </section>
  )
}
