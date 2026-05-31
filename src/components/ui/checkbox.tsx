import * as React from "react"
import { cn } from "@/lib/utils"

export interface CheckboxProps {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  className?: string
  disabled?: boolean
  id?: string
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ checked = false, onCheckedChange, className, disabled, id }, ref) => {
    return (
      <input
        ref={ref}
        type="checkbox"
        id={id}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        className={cn(
          "h-4 w-4 shrink-0 rounded border border-primary shadow-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "accent-primary cursor-pointer",
          className
        )}
      />
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
