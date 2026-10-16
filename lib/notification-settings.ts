import { z } from 'zod'
import type { NotificationSettings } from '@/lib/challenge-store'
import { NTFY_TOPIC_PATTERN } from '@/lib/notify'

export type PublicNotificationSettings = {
  emailEnabled: boolean
  ntfyEnabled: boolean
  ntfyServer: string
  ntfyTopic: string
  hasNtfyToken: boolean
}

export function toPublicNotificationSettings(
  settings: NotificationSettings,
): PublicNotificationSettings {
  return {
    emailEnabled: settings.emailEnabled,
    ntfyEnabled: settings.ntfyEnabled,
    ntfyServer: settings.ntfyServer,
    ntfyTopic: settings.ntfyTopic,
    hasNtfyToken: Boolean(settings.ntfyToken),
  }
}

export const notificationSettingsSchema = z
  .object({
    emailEnabled: z.boolean(),
    ntfyEnabled: z.boolean(),
    ntfyServer: z.string().trim().max(300),
    ntfyTopic: z
      .string()
      .trim()
      .refine((value) => value === '' || NTFY_TOPIC_PATTERN.test(value), {
        message: 'Topics may only contain letters, numbers, "-" and "_" (max 64).',
      }),
    // undefined keeps the stored token, null removes it, a string replaces it.
    ntfyToken: z.string().trim().max(500).nullable().optional(),
  })
  .refine((value) => !value.ntfyEnabled || value.ntfyTopic !== '', {
    message: 'Set an ntfy topic to enable ntfy notifications.',
    path: ['ntfyTopic'],
  })
