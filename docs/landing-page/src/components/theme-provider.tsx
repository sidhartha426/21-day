import * as React from "react"

export type Theme = "dark" | "light"

const STORAGE_KEY = "21-day-landing-theme"
const THEME_COLORS: Record<Theme, string> = { dark: "#0d1716", light: "#f9fbfa" }

type ThemeContextValue = {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined)

function readInitialTheme(): Theme {
  // index.html applies the stored theme before paint; read it back from the DOM.
  return document.documentElement.classList.contains("light") ? "light" : "dark"
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  const style = document.createElement("style")
  style.textContent = "*,*::before,*::after{transition:none!important}"
  document.head.appendChild(style)

  root.classList.remove("light", "dark")
  root.classList.add(theme)
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[theme])

  window.getComputedStyle(document.body)
  requestAnimationFrame(() => requestAnimationFrame(() => style.remove()))
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>(readInitialTheme)

  const setTheme = React.useCallback((next: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Storage can be unavailable (private mode); the choice still applies for this visit.
    }
    applyTheme(next)
    setThemeState(next)
  }, [])

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme(theme === "dark" ? "light" : "dark"),
    }),
    [theme, setTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = React.useContext(ThemeContext)
  if (!context) throw new Error("useTheme must be used within ThemeProvider")
  return context
}
