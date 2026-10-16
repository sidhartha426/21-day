import { Faq } from "@/components/faq"
import { Features } from "@/components/features"
import { Hero } from "@/components/hero"
import { ProductTour } from "@/components/product-tour"
import { ScoringDemo } from "@/components/scoring-demo"
import { SelfHost } from "@/components/self-host"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export function App() {
  return (
    <div id="top" className="flex min-h-svh flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="flex-1">
        <Hero />
        <Features />
        <ScoringDemo />
        <ProductTour />
        <SelfHost />
        <Faq />
      </main>
      <SiteFooter />
    </div>
  )
}
