'use client'

import { useTheme } from 'next-themes'
import { useEffect, useRef } from 'react'
import { isThemePreference } from '@/lib/theme'

/**
 * Applies the theme saved on the user's account once per signed-in app mount, so a
 * new browser or device picks up the user's choice right after sign-in. Later changes
 * come from the header toggle, which updates both next-themes and the account.
 */
export function AccountThemeSync({ savedTheme }: { savedTheme: string | null }) {
  const { theme, setTheme } = useTheme()
  const applied = useRef(false)

  useEffect(() => {
    if (applied.current || theme === undefined) return
    applied.current = true
    if (isThemePreference(savedTheme) && savedTheme !== theme) setTheme(savedTheme)
  }, [savedTheme, theme, setTheme])

  return null
}
