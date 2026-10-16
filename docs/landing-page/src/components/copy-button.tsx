import * as React from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function CopyButton({ value, label = "Copy to clipboard" }: { value: string; label?: string }) {
  const [copied, setCopied] = React.useState(false)
  const timeout = React.useRef<number | undefined>(undefined)

  React.useEffect(() => () => window.clearTimeout(timeout.current), [])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.clearTimeout(timeout.current)
      timeout.current = window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm" onClick={handleCopy} aria-label={copied ? "Copied" : label}>
          {copied ? <Check className="text-primary" /> : <Copy />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{copied ? "Copied" : "Copy"}</TooltipContent>
    </Tooltip>
  )
}

export function CommandLine({ command }: { command: string }) {
  return (
    <div className="flex w-full items-center gap-2 rounded-lg border bg-card py-1.5 pr-1.5 pl-3 text-left">
      <span className="font-mono text-sm text-primary select-none" aria-hidden="true">
        $
      </span>
      <code className="min-w-0 flex-1 truncate font-mono text-sm">{command}</code>
      <CopyButton value={command} label="Copy install command" />
    </div>
  )
}

export function CodeBlock({ code, title }: { code: string; title: string }) {
  return (
    <figure className="overflow-hidden rounded-lg border bg-card">
      <figcaption className="flex items-center justify-between gap-2 border-b py-1 pr-1 pl-3">
        <span className="font-mono text-xs text-muted-foreground">{title}</span>
        <CopyButton value={code} label={`Copy ${title}`} />
      </figcaption>
      <pre className="overflow-x-auto p-3 font-mono text-[0.8rem] leading-relaxed">
        <code>{code}</code>
      </pre>
    </figure>
  )
}
