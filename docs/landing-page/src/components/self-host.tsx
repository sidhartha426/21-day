import { ArrowUpRight, Container, Database, Lock } from "lucide-react"
import { CodeBlock } from "@/components/copy-button"
import { Section, SectionHeading } from "@/components/section"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { IMAGE_URL, INSTALL_COMMAND, README_URL } from "@/lib/site"

const STEPS = [
  {
    title: "Set up the folder",
    description:
      "Creates a 21-day folder with the Compose file, Caddyfile, CouchDB config and an .env to fill in.",
    file: "terminal",
    code: INSTALL_COMMAND,
  },
  {
    title: "Fill in .env",
    description: "Set your domain, a session secret and a CouchDB password. SMTP is optional.",
    file: "21-day/.env",
    code: `BETTER_AUTH_SECRET=paste-output-of-openssl-rand-base64-32
BETTER_AUTH_URL=https://21-day.example.com
APP_DOMAIN=21-day.example.com
ACME_EMAIL=you@example.com
COUCHDB_PASSWORD=a-strong-password`,
  },
  {
    title: "Start the stack",
    description: "Open your URL and create the first account. It becomes the administrator.",
    file: "terminal",
    code: "cd 21-day && docker compose up -d",
  },
]

const SERVICES = [
  { icon: Container, name: "app", image: `${IMAGE_URL}:latest`, role: "Next.js server, non-root, with a healthcheck" },
  { icon: Database, name: "couchdb", image: "couchdb:3", role: "Progress data, internal network only" },
  { icon: Lock, name: "caddy", image: "caddy (deSEC build)", role: "Automatic HTTPS, headers, compression" },
]

const STACK = ["Next.js 16", "React 19", "Tailwind CSS v4", "shadcn/ui", "Better Auth", "SQLite", "CouchDB", "PDFKit", "Caddy"]

export function SelfHost() {
  return (
    <Section id="self-host" aria-labelledby="self-host-title" className="flex flex-col gap-10">
      <SectionHeading
        id="self-host-title"
        eyebrow="Self-hosting"
        title="Three commands to your own instance."
        description="Prebuilt images for linux/amd64 and linux/arm64, so there is nothing to build. Everything, including your data, lives in one folder."
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <ol className="flex flex-col gap-6">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-4">
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-mono text-sm font-semibold text-primary"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <h3 className="font-medium">
                    <span className="sr-only">Step {index + 1}: </span>
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
                <CodeBlock title={step.file} code={step.code} />
              </div>
            </li>
          ))}
        </ol>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>The stack</CardTitle>
              <CardDescription>Three containers, bind mounts, no named volumes.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-4">
                {SERVICES.map((service) => (
                  <li key={service.name} className="flex gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <service.icon className="size-4" aria-hidden="true" />
                    </span>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="font-mono text-sm font-medium">{service.name}</span>
                      <span className="truncate font-mono text-xs text-muted-foreground">{service.image}</span>
                      <span className="text-xs text-muted-foreground">{service.role}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Built with</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <ul className="flex flex-wrap gap-1.5">
                {STACK.map((item) => (
                  <li key={item}>
                    <Badge variant="secondary">{item}</Badge>
                  </li>
                ))}
              </ul>
              <Separator />
              <Button asChild variant="outline" className="w-fit">
                <a href={README_URL} target="_blank" rel="noreferrer">
                  Full self-hosting guide
                  <ArrowUpRight data-icon="inline-end" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Section>
  )
}
