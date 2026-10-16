import { z } from 'zod'

export const THEME_PREFERENCES = ['light', 'dark', 'system'] as const
export type ThemePreference = (typeof THEME_PREFERENCES)[number]

export const DEFAULT_THEME: ThemePreference = 'dark'

export const themePreferenceSchema = z.object({ theme: z.enum(THEME_PREFERENCES) })

export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === 'string' && (THEME_PREFERENCES as readonly string[]).includes(value)
}
