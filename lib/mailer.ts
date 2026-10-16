import nodemailer, { type Transporter } from 'nodemailer'
import { APP_NAME } from '@/lib/app-config'

type MailAttachment = { filename: string; content: Buffer; contentType?: string }

type MailInput = {
  to: string
  subject: string
  text: string
  html?: string
  attachments?: MailAttachment[]
}

export function isMailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM)
}

/**
 * SMTP_FROM is the sender address; SMTP_FROM_NAME is the display name (defaults to the app name).
 * A legacy `Name <address>` value in SMTP_FROM still works; SMTP_FROM_NAME overrides its name.
 */
function getSender() {
  const raw = (process.env.SMTP_FROM ?? '').trim()
  const match = raw.match(/^(.*)<([^>]+)>$/)
  const address = (match ? match[2] : raw).trim()
  const legacyName = match ? match[1].trim().replace(/^"|"$/g, '') : ''
  const name = process.env.SMTP_FROM_NAME?.trim() || legacyName || APP_NAME
  return { name, address }
}

const globalForMail = globalThis as unknown as { mailTransport?: Transporter }

function getTransport() {
  if (globalForMail.mailTransport) return globalForMail.mailTransport
  const port = Number(process.env.SMTP_PORT || 587)
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  })
  globalForMail.mailTransport = transport
  return transport
}

export async function sendMail(input: MailInput) {
  if (!isMailConfigured()) {
    // Without SMTP, surface the message in the server log so local flows still work.
    console.info(
      `[mail] SMTP not configured. Would send "${input.subject}" to ${input.to}:\n${input.text}`,
    )
    return { delivered: false }
  }
  await getTransport().sendMail({
    from: getSender(),
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
    attachments: input.attachments,
  })
  return { delivered: true }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function renderEmail({
  heading,
  body,
  action,
}: {
  heading: string
  body: string
  action?: { label: string; url: string }
}) {
  const button = action
    ? `<p style="margin:24px 0"><a href="${escapeHtml(action.url)}" style="background:#0f766e;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">${escapeHtml(action.label)}</a></p>
       <p style="color:#6b7280;font-size:12px">If the button does not work, copy this link:<br>${escapeHtml(action.url)}</p>`
    : ''
  return `<!doctype html><html><body style="font-family:system-ui,-apple-system,sans-serif;background:#f5f5f4;padding:24px">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;color:#1c1917">
      <h1 style="font-size:20px;margin:0 0 16px">${escapeHtml(heading)}</h1>
      <p style="line-height:1.6;margin:0">${escapeHtml(body)}</p>
      ${button}
    </div></body></html>`
}
