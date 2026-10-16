import { resolve } from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// GitHub Pages serves project sites from https://<owner>.github.io/<repo>/, so every
// asset URL needs the repo name as a prefix. The deploy workflow passes BASE_PATH from
// actions/configure-pages, which is "/<repo>" for project sites and "" for custom domains.
function normalizeBase(value: string | undefined) {
  if (value === undefined) return "/21-day/"
  const trimmed = value.replace(/^\/+|\/+$/g, "")
  return trimmed ? `/${trimmed}/` : "/"
}

export default defineConfig({
  base: normalizeBase(process.env.BASE_PATH),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
      // README screenshots are the single source of truth; reuse them instead of copying.
      "@screenshots": resolve(import.meta.dirname, "../screenshots"),
    },
  },
  server: {
    fs: {
      allow: [resolve(import.meta.dirname, "..")],
    },
  },
  build: {
    outDir: "dist",
    assetsInlineLimit: 0,
  },
})
