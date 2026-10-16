import { ArrowRight } from "lucide-react"
import { Brand } from "@/components/brand"
import { GitHubIcon } from "@/components/github-icon"
import { StarRating } from "@/components/star-rating"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CONTEXT_URL, ISSUES_URL, LICENSE_URL, README_URL, REPO_URL } from "@/lib/site"

const FOOTER_LINKS = [
  { href: REPO_URL, label: "GitHub" },
  { href: README_URL, label: "Documentation" },
  { href: CONTEXT_URL, label: "Architecture" },
  { href: ISSUES_URL, label: "Issues" },
  { href: LICENSE_URL, label: "MIT License" },
]

export function SiteFooter() {
  return (
    <footer>
      <div className="mx-auto w-full max-w-6xl px-4 pb-16 md:px-6">
        <Card className="ring-primary/30">
          <CardContent className="flex flex-col items-center gap-6 px-6 py-10 text-center md:py-14">
            <StarRating scorePct={100} size="lg" />
            <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-balance md:text-4xl">
              Your next 21 days start on your own server.
            </h2>
            <p className="max-w-lg text-pretty text-muted-foreground">
              Free and open source under the MIT license. Bring a domain and Docker; 21-day handles the rest.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="px-4">
                <a href="#self-host">
                  Get started
                  <ArrowRight data-icon="inline-end" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="px-4">
                <a href={REPO_URL} target="_blank" rel="noreferrer">
                  <GitHubIcon data-icon="inline-start" />
                  Star on GitHub
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="flex flex-col gap-2">
            <Brand />
            <p className="text-sm text-muted-foreground">
              {"© 2026 Sidhartha Sankar Swain. Self-hosted habit tracking, no telemetry."}
            </p>
          </div>
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {FOOTER_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  )
}
