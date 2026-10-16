import { Section, SectionHeading } from "@/components/section"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ISSUES_URL } from "@/lib/site"

const FAQS = [
  {
    question: "Can I deploy it on Vercel, Netlify or Lambda?",
    answer:
      "No. Accounts live in a local SQLite file, and serverless disks are ephemeral and not shared between instances. Use Docker or any long-running Node.js host with a persistent disk.",
  },
  {
    question: "Does it collect any data about me?",
    answer:
      "No analytics, no telemetry and no third-party calls. The only outbound traffic is the SMTP server or ntfy topic you configure yourself.",
  },
  {
    question: "What happens if I miss a day?",
    answer:
      "Log it with 0 sessions. It still counts as a completed day, and your score reflects the shortfall honestly. You can correct or clear any completed day later; only future days are locked.",
  },
  {
    question: "Do I need an email provider?",
    answer:
      "No. Without SMTP, the admin gets a copyable invite link instead of an email, and reports can still be pushed with ntfy. Add SMTP later to enable email reports, invitations and password resets.",
  },
  {
    question: "My DNS isn't hosted at deSEC. Does HTTPS still work?",
    answer:
      "Yes. Remove one line from the Caddyfile to use standard ACME on port 443, swap in a Caddy build with your provider's DNS module, or drop Caddy and put your own reverse proxy in front of the app.",
  },
  {
    question: "How do I back up and update?",
    answer:
      "Stop the stack and tar the 21-day folder; that is the whole backup. To update, run docker compose pull and docker compose up -d. Database migrations run automatically on startup.",
  },
  {
    question: "Who can create an account?",
    answer:
      "The first account becomes the single administrator. From the admin panel you can close public sign-ups and invite people instead. Invitations are single-use, bound to one email and expire after 7 days.",
  },
]

export function Faq() {
  return (
    <Section id="faq" aria-labelledby="faq-title" className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <SectionHeading
        id="faq-title"
        eyebrow="FAQ"
        title="Questions, answered."
        description={
          <>
            Something else on your mind?{" "}
            <a
              href={ISSUES_URL}
              target="_blank"
              rel="noreferrer"
              className="text-foreground underline underline-offset-4 hover:text-primary"
            >
              Open an issue on GitHub
            </a>
            .
          </>
        }
      />
      <Accordion type="single" collapsible defaultValue="item-0" className="rounded-xl border px-4">
        {FAQS.map((faq, index) => (
          <AccordionItem key={faq.question} value={`item-${index}`}>
            <AccordionTrigger className="py-4 text-base">{faq.question}</AccordionTrigger>
            <AccordionContent className="leading-relaxed text-muted-foreground">{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Section>
  )
}
