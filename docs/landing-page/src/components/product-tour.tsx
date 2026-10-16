import {
  Bell,
  CalendarCheck,
  FileText,
  History,
  KeyRound,
  Smartphone,
  Trophy,
  UserCog,
  type LucideIcon,
} from "lucide-react"
import admin from "@screenshots/admin.png"
import completion from "@screenshots/completion-celebrate.png"
import dailyLog from "@screenshots/daily-log.png"
import historyDetail from "@screenshots/history-detail.png"
import mobileDashboard from "@screenshots/mobile-dashboard.png"
import mobileHistory from "@screenshots/mobile-history.png"
import notifications from "@screenshots/settings-notifications.png"
import pdfReport from "@screenshots/pdf-report.png"
import security from "@screenshots/settings-security.png"
import { BrowserFrame } from "@/components/browser-frame"
import { Section, SectionHeading } from "@/components/section"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Shot = { src: string; alt: string; width: number; height: number }

type TourItem = {
  value: string
  label: string
  icon: LucideIcon
  caption: string
  layout: "browser" | "document" | "phones"
  url?: string
  shots: Shot[]
}

const TOUR: TourItem[] = [
  {
    value: "log",
    label: "Daily log",
    icon: CalendarCheck,
    caption: "Log each day with Enter. Edit or clear completed days at any time; future days stay locked.",
    layout: "browser",
    url: "21-day.example.com/dashboard",
    shots: [{ src: dailyLog, alt: "Daily log table with today's input focused", width: 1440, height: 900 }],
  },
  {
    value: "complete",
    label: "Completion",
    icon: Trophy,
    caption: "Finish strong and get celebrated, or get called out when you slacked off.",
    layout: "browser",
    url: "21-day.example.com/dashboard",
    shots: [{ src: completion, alt: "Challenge complete panel with 5 stars and a 105.4% score", width: 1440, height: 900 }],
  },
  {
    value: "pdf",
    label: "PDF report",
    icon: FileText,
    caption: "A clean, printable report for every finished challenge, sent by email and/or ntfy.",
    layout: "document",
    shots: [{ src: pdfReport, alt: "Printable PDF report with the summary and daily table", width: 910, height: 1287 }],
  },
  {
    value: "history",
    label: "History",
    icon: History,
    caption: "Every saved challenge stays available read-only, ready to download again.",
    layout: "browser",
    url: "21-day.example.com/history",
    shots: [{ src: historyDetail, alt: "Read-only detail of a past challenge", width: 1440, height: 900 }],
  },
  {
    value: "security",
    label: "Security",
    icon: KeyRound,
    caption: "TOTP two-factor authentication, backup codes and passkeys, per account.",
    layout: "browser",
    url: "21-day.example.com/settings",
    shots: [{ src: security, alt: "Security settings with two-factor and passkeys", width: 1440, height: 900 }],
  },
  {
    value: "notifications",
    label: "Notifications",
    icon: Bell,
    caption: "Each user picks email and/or ntfy, with a test button for each channel.",
    layout: "browser",
    url: "21-day.example.com/settings",
    shots: [{ src: notifications, alt: "Notification settings for email and ntfy", width: 1440, height: 900 }],
  },
  {
    value: "admin",
    label: "Admin",
    icon: UserCog,
    caption: "Toggle sign-ups, send invitations and manage users from one panel.",
    layout: "browser",
    url: "21-day.example.com/admin",
    shots: [{ src: admin, alt: "Admin panel with sign-up toggle, invitations and users", width: 1440, height: 999 }],
  },
  {
    value: "mobile",
    label: "Mobile",
    icon: Smartphone,
    caption: "The full app works on a phone, from logging a day to reviewing history.",
    layout: "phones",
    shots: [
      { src: mobileDashboard, alt: "Mobile dashboard", width: 390, height: 844 },
      { src: mobileHistory, alt: "Mobile history detail", width: 390, height: 844 },
    ],
  },
]

function TourMedia({ item }: { item: TourItem }) {
  if (item.layout === "phones") {
    return (
      <div className="flex justify-center gap-4 sm:gap-8">
        {item.shots.map((shot) => (
          <div
            key={shot.src}
            className="w-full max-w-[16rem] overflow-hidden rounded-[2rem] bg-card p-2 shadow-2xl ring-1 ring-foreground/10"
          >
            <img
              src={shot.src}
              alt={shot.alt}
              width={shot.width}
              height={shot.height}
              loading="lazy"
              className="block h-auto w-full rounded-[1.5rem]"
            />
          </div>
        ))}
      </div>
    )
  }

  const [shot] = item.shots
  if (item.layout === "document") {
    return (
      <div className="mx-auto w-full max-w-md overflow-hidden rounded-lg bg-white shadow-2xl ring-1 ring-foreground/10">
        <img
          src={shot.src}
          alt={shot.alt}
          width={shot.width}
          height={shot.height}
          loading="lazy"
          className="block h-auto w-full"
        />
      </div>
    )
  }

  return (
    <BrowserFrame url={item.url ?? "21-day.example.com"}>
      <img
        src={shot.src}
        alt={shot.alt}
        width={shot.width}
        height={shot.height}
        loading="lazy"
        className="block h-auto w-full"
      />
    </BrowserFrame>
  )
}

export function ProductTour() {
  return (
    <Section id="tour" aria-labelledby="tour-title" className="flex flex-col gap-10">
      <SectionHeading
        id="tour-title"
        eyebrow="Product tour"
        title="See the whole app before you install it."
        description="Real screenshots from a running instance. Dark is the default theme; light and system are one click away."
      />
      <Tabs defaultValue="log" className="gap-6">
        <div className="no-scrollbar -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <TabsList className="h-9">
            {TOUR.map((item) => (
              <TabsTrigger key={item.value} value={item.value} className="px-3">
                <item.icon data-icon="inline-start" />
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {TOUR.map((item) => (
          <TabsContent key={item.value} value={item.value} className="flex flex-col gap-6">
            <p className="text-sm text-muted-foreground">{item.caption}</p>
            <TourMedia item={item} />
          </TabsContent>
        ))}
      </Tabs>
    </Section>
  )
}
