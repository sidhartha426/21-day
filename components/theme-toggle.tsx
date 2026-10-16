'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { fetchJson } from '@/lib/fetcher'
import { DEFAULT_THEME, isThemePreference } from '@/lib/theme'

/** `persist` saves the choice to the signed-in user's account so it follows them across logins. */
export function ThemeToggle({ persist = false }: { persist?: boolean }) {
  const { theme, setTheme } = useTheme()

  async function handleChange(value: unknown) {
    if (!isThemePreference(value)) return
    setTheme(value)
    if (!persist) return
    try {
      await fetchJson('/api/settings/theme', { method: 'PUT', body: JSON.stringify({ theme: value }) })
    } catch (error) {
      toast.error(`Couldn't save your theme: ${(error as Error).message}`)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label="Change theme" />}>
        <Sun className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
        <Moon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuRadioGroup value={theme ?? DEFAULT_THEME} onValueChange={handleChange}>
          <DropdownMenuRadioItem value="light">
            <Sun aria-hidden="true" />
            Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Moon aria-hidden="true" />
            Dark
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <Monitor aria-hidden="true" />
            System
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
