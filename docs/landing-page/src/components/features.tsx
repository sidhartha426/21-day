import {
  CalendarCheck,
  FileText,
  History,
  KeyRound,
  MonitorSmartphone,
  Star,
  UserCog,
  Server,
  type LucideIcon,
} from "lucide-react"
import { Section, SectionHeading } from "@/components/section"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type Feature = { icon: LucideIcon; title: string; description: string }

const FEATURES: Feature[] = [
  {
    icon: CalendarCheck,
    title: "Daily logging",
    description:
      "A 21-row table with running totals. Press Enter to log a day and the next one is focused. Fix any past entry; future days stay locked.",
  },
  {
    icon: Star,
    title: "Honest scoring",
    description:
      "Your score is total sessions over 21 × your daily ideal. Stars are fractional: 72.9% earns 3.64 stars, not a rounded 4.",
  },
  {
    icon: FileText,
    title: "PDF reports",
    description:
      "Every finished challenge produces a clean, printable report, delivered by email (SMTP) and/or ntfy push with the PDF attached.",
  },
  {
    icon: History,
    title: "History",
    description:
      "Save finished challenges, view them read-only, download them again, or discard them. Delete one at a time or all at once.",
  },
  {
    icon: KeyRound,
    title: "Real authentication",
    description:
      "Email or username plus password, optional TOTP two-factor and passkeys. Powered by Better Auth, with per-user data isolation.",
  },
  {
    icon: UserCog,
    title: "Admin panel",
    description:
      "The first account is the admin. Close sign-ups, invite by email or link, ban or remove users. Unlocks only for 2FA or passkey sessions.",
  },
  {
    icon: Server,
    title: "Your data, your server",
    description:
      "One Docker Compose stack with automatic HTTPS. All data lives in one folder. No analytics, no telemetry, no third-party calls.",
  },
  {
    icon: MonitorSmartphone,
    title: "Polished on every screen",
    description:
      "Responsive and keyboard friendly, with light, dark and system themes. Your theme choice follows your account across devices.",
  },
]

export function Features() {
  return (
    <Section id="features" aria-labelledby="features-title" className="flex flex-col gap-10">
      <SectionHeading
        id="features-title"
        eyebrow="Features"
        title="Everything a 21-day challenge needs. Nothing it doesn't."
        description="Built for people who want to build a habit and be told the truth about how it went, on infrastructure they control."
      />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((feature) => (
          <li key={feature.title} className="flex">
            <Card className="w-full">
              <CardHeader className="gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="size-4" aria-hidden="true" />
                </span>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription className="leading-relaxed">{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          </li>
        ))}
      </ul>
    </Section>
  )
}
