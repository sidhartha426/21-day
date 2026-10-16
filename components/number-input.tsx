'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import { useImperativeHandle, useRef, type ComponentProps, type Ref } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type NumberInputProps = Omit<ComponentProps<'input'>, 'type' | 'value' | 'onChange' | 'ref'> & {
  value: string
  onValueChange: (value: string) => void
  ref?: Ref<HTMLInputElement>
  /** Classes for the outer wrapper (width, margins). `inputClassName` styles the field. */
  inputClassName?: string
}

/**
 * Number field with consistent stepper chevrons in every browser. The native spin
 * buttons are hidden (they look very different in Chrome and Firefox); the custom ones
 * call the native stepUp/stepDown so min, max, and step behave exactly like arrow keys.
 */
export function NumberInput({
  value,
  onValueChange,
  ref,
  className,
  inputClassName,
  disabled,
  readOnly,
  ...props
}: NumberInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement, [])

  function step(direction: 1 | -1) {
    const input = inputRef.current
    if (!input) return
    if (direction === 1) input.stepUp()
    else input.stepDown()
    onValueChange(input.value)
    input.focus()
  }

  const stepperDisabled = disabled || readOnly

  return (
    <div data-slot="number-input" className={cn('relative', className)}>
      <Input
        ref={inputRef}
        type="number"
        value={value}
        disabled={disabled}
        readOnly={readOnly}
        onChange={(event) => onValueChange(event.target.value)}
        className={cn(
          'pr-7 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
          inputClassName,
        )}
        {...props}
      />
      <div className="absolute inset-y-0.5 right-0.5 flex w-5 flex-col">
        {([1, -1] as const).map((direction) => {
          const Icon = direction === 1 ? ChevronUp : ChevronDown
          return (
            <button
              key={direction}
              type="button"
              tabIndex={-1}
              aria-label={direction === 1 ? 'Increase' : 'Decrease'}
              disabled={stepperDisabled}
              // Keep focus (and the caret) in the input while clicking the stepper.
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => step(direction)}
              className="flex flex-1 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
            >
              <Icon className="size-3" aria-hidden="true" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
