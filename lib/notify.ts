import {
  formatStars,
  summarize,
  verdictFor,
  type ChallengeConfig,
  type DayRow,
} from '@/lib/challenge'
import { getNotificationSettings, type NotificationSettings } from '@/lib/challenge-store'
import { isMailConfigured, renderEmail, sendMail } from '@/lib/mailer'
import { renderChallengePdf, reportFilename } from '@/lib/pdf'

export type ChannelResult = 'sent' | 'disabled' | 'failed' | 'unconfigured'
export type NotifyResult = { email: ChannelResult; ntfy: ChannelResult }

type ReportUser = { id: string; email: string; name: string }

export const NTFY_TOPIC_PATTERN = /^[A-Za-z0-9_-]{1,64}$/

export function normalizeNtfyServer(value: string) {
  const url = new URL(value.trim())
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('The ntfy server must be an http(s) URL.')
  }
  return url.origin + url.pathname.replace(/\/$/, '')
}

// ntfy reads these from HTTP headers, which must be plain ASCII.
function asciiHeader(value: string) {
  return value.replace(/[^\x20-\x7E]/g, '').slice(0, 250)
}

async function publishToNtfy(
  settings: Pick<NotificationSettings, 'ntfyServer' | 'ntfyTopic' | 'ntfyToken'>,
  message: { title: string; body: string; tags?: string; attachment?: { filename: string; data: Buffer } },
) {
  if (!NTFY_TOPIC_PATTERN.test(settings.ntfyTopic)) throw new Error('Invalid ntfy topic.')
  const endpoint = `${normalizeNtfyServer(settings.ntfyServer)}/${settings.ntfyTopic}`
  const headers: Record<string, string> = {
    Title: asciiHeader(message.title),
    ...(message.tags ? { Tags: message.tags } : {}),
  }
  if (settings.ntfyToken) headers.Authorization = `Bearer ${settings.ntfyToken}`

  let body: BodyInit
  if (message.attachment) {
    // With a binary body, ntfy takes the text from the Message header.
    headers.Filename = message.attachment.filename
    headers.Message = asciiHeader(message.body)
    body = new Uint8Array(message.attachment.data)
  } else {
    body = message.body
  }

  const res = await fetch(endpoint, {
    method: 'PUT',
    headers,
    body,
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`ntfy responded with ${res.status}`)
}

export async function sendChallengeReport(
  user: ReportUser,
  challenge: { config: ChallengeConfig; rows: DayRow[]; completedAt?: string | null },
): Promise<NotifyResult> {
  const settings = await getNotificationSettings(user.id)
  const result: NotifyResult = { email: 'disabled', ntfy: 'disabled' }
  if (!settings.emailEnabled && !settings.ntfyEnabled) return result

  const summary = summarize(challenge.config, challenge.rows)
  const verdict = verdictFor(summary.stars)
  const pdf = await renderChallengePdf({
    config: challenge.config,
    rows: challenge.rows,
    ownerName: user.name,
    completedAt: challenge.completedAt,
  })
  const filename = reportFilename(challenge.config)
  const headline = `${formatStars(summary.stars)} stars - ${summary.scorePct.toFixed(1)}% of your ideal target`

  if (settings.emailEnabled) {
    if (!isMailConfigured()) {
      result.email = 'unconfigured'
    } else {
      try {
        await sendMail({
          to: user.email,
          subject: `Your 21-day report: ${verdict.title}`,
          text: `${verdict.title}\n${headline}\n\n${verdict.message}\n\nYour full report is attached.`,
          html: renderEmail({
            heading: verdict.title,
            body: `${headline}. ${verdict.message} Your full report is attached as a PDF.`,
          }),
          attachments: [{ filename, content: pdf, contentType: 'application/pdf' }],
        })
        result.email = 'sent'
      } catch (error) {
        console.error('[notify] Email delivery failed', error)
        result.email = 'failed'
      }
    }
  }

  if (settings.ntfyEnabled) {
    if (!settings.ntfyTopic) {
      result.ntfy = 'unconfigured'
    } else {
      try {
        await publishToNtfy(settings, {
          title: `21-day: ${verdict.title}`,
          body: headline,
          tags: summary.stars >= 4 ? 'trophy' : summary.stars >= 3 ? 'muscle' : 'warning',
          attachment: { filename, data: pdf },
        })
        result.ntfy = 'sent'
      } catch (error) {
        console.error('[notify] ntfy delivery failed', error)
        result.ntfy = 'failed'
      }
    }
  }

  return result
}

export async function sendTestNotification(
  user: ReportUser,
  channel: 'email' | 'ntfy',
  settings: NotificationSettings,
) {
  if (channel === 'email') {
    if (!isMailConfigured()) throw new Error('SMTP is not configured on the server.')
    await sendMail({
      to: user.email,
      subject: '21-day test email',
      text: 'Email notifications are working. Your reports will arrive here.',
      html: renderEmail({
        heading: 'Email notifications are working',
        body: 'Your challenge reports will be delivered to this address.',
      }),
    })
    return
  }
  if (!settings.ntfyTopic) throw new Error('Set an ntfy topic first.')
  await publishToNtfy(settings, {
    title: '21-day',
    body: 'ntfy notifications are working. Your reports will arrive here.',
    tags: 'white_check_mark',
  })
}
