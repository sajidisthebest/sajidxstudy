import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const colorMap: Record<string, string> = {
  emerald: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  lime: "bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200",
  sky: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
  cyan: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  violet: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
  pink: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  purple: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
}

const dotColorMap: Record<string, string> = {
  emerald: "bg-emerald-500",
  lime: "bg-lime-500",
  sky: "bg-sky-500",
  cyan: "bg-cyan-500",
  blue: "bg-blue-500",
  violet: "bg-violet-500",
  pink: "bg-pink-500",
  purple: "bg-purple-500",
  amber: "bg-amber-500",
}

interface SubjectBadgeProps {
  name: string
  color: string
  className?: string
  showDot?: boolean
}

export function SubjectBadge({ name, color, className, showDot = true }: SubjectBadgeProps) {
  return (
    <Badge variant="secondary" className={cn(colorMap[color] ?? "bg-gray-100 text-gray-800", "gap-1.5", className)}>
      {showDot && <span className={cn("h-2 w-2 rounded-full", dotColorMap[color] ?? "bg-gray-500")} />}
      {name}
    </Badge>
  )
}
