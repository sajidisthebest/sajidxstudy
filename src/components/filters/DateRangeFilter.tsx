import { format, subDays, startOfWeek, endOfWeek, startOfMonth } from "date-fns"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export type DatePreset = "today" | "this-week" | "last-week" | "this-month" | "all"

interface DateRangeFilterProps {
  value: DatePreset
  onChange: (value: DatePreset) => void
  className?: string
}

export function getDateRange(preset: DatePreset): { start: string; end: string } | null {
  const today = new Date()
  const fmt = (d: Date) => format(d, "yyyy-MM-dd")

  switch (preset) {
    case "today":
      return { start: fmt(today), end: fmt(today) }
    case "this-week": {
      const start = startOfWeek(today, { weekStartsOn: 0 })
      const end = endOfWeek(today, { weekStartsOn: 0 })
      return { start: fmt(start), end: fmt(end) }
    }
    case "last-week": {
      const lastWeekStart = startOfWeek(subDays(today, 7), { weekStartsOn: 0 })
      const lastWeekEnd = endOfWeek(subDays(today, 7), { weekStartsOn: 0 })
      return { start: fmt(lastWeekStart), end: fmt(lastWeekEnd) }
    }
    case "this-month": {
      const monthStart = startOfMonth(today)
      return { start: fmt(monthStart), end: fmt(today) }
    }
    case "all":
      return null
  }
}

export function DateRangeFilter({ value, onChange, className }: DateRangeFilterProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as DatePreset)}>
      <SelectTrigger className={cn("w-[150px]", className)}>
        <SelectValue placeholder="Date range" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Time</SelectItem>
        <SelectItem value="today">Today</SelectItem>
        <SelectItem value="this-week">This Week</SelectItem>
        <SelectItem value="last-week">Last Week</SelectItem>
        <SelectItem value="this-month">This Month</SelectItem>
      </SelectContent>
    </Select>
  )
}
