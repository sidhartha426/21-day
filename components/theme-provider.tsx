'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ComponentProps } from 'react'

// next-themes injects an inline <script> to set the theme before paint. It only needs to
// run from the server HTML; on client renders React 19 warns about script tags, so mark it
// as an inert data block there (the element has suppressHydrationWarning).
const clientScriptProps = typeof window === 'undefined' ? undefined : { type: 'application/json' }

export function ThemeProvider(props: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider scriptProps={clientScriptProps} {...props} />
}
