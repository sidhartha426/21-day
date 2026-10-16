import { Brand } from "@/components/brand"
import { GitHubIcon } from "@/components/github-icon"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { NAV_LINKS, REPO_URL } from "@/lib/site"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4 md:px-6">
        <Brand />
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <Button asChild variant="outline" size="sm" className="ml-1">
            <a href={REPO_URL} target="_blank" rel="noreferrer">
              <GitHubIcon data-icon="inline-start" />
              <span className="hidden sm:inline">Star on GitHub</span>
              <span className="sm:hidden">GitHub</span>
            </a>
          </Button>
        </div>
      </div>
      <nav
        aria-label="Main mobile"
        className="no-scrollbar flex gap-1 overflow-x-auto border-t px-4 py-2 md:hidden"
      >
        {NAV_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="shrink-0 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {link.label}
          </a>
        ))}
      </nav>
    </header>
  )
}
