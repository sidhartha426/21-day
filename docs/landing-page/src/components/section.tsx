import type * as React from "react"
import { cn } from "@/lib/utils"

export function Section({
  id,
  className,
  children,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      id={id}
      className={cn("mx-auto w-full max-w-6xl px-4 py-16 md:px-6 md:py-24", className)}
      {...props}
    >
      {children}
    </section>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  id,
}: {
  eyebrow: string
  title: string
  description?: React.ReactNode
  id?: string
}) {
  return (
    <div className="flex max-w-2xl flex-col gap-3">
      <span className="text-xs font-medium tracking-wider text-primary uppercase">{eyebrow}</span>
      <h2 id={id} className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="text-base leading-relaxed text-pretty text-muted-foreground">{description}</p>
      )}
    </div>
  )
}
