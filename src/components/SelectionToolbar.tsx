import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectionToolbarProps {
  selectedCount: number
  onClearSelection: () => void
  children: ReactNode
  className?: string
}

export function SelectionToolbar({
  selectedCount,
  onClearSelection,
  children,
  className,
}: SelectionToolbarProps) {
  if (selectedCount === 0) return null

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t bg-background shadow-lg",
        "animate-in slide-in-from-bottom-2 duration-200",
        className
      )}
    >
      <div className="flex items-center justify-between px-4 py-3 max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">
            {selectedCount} item{selectedCount !== 1 ? "s" : ""} selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-7 px-2 text-xs"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        </div>
        <div className="flex items-center gap-2">{children}</div>
      </div>
    </div>
  )
}
