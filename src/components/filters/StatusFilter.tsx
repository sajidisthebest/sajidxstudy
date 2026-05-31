import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface StatusFilterProps {
  value: string
  onChange: (value: string) => void
  className?: string
  options?: { value: string; label: string }[]
}

const defaultOptions = [
  { value: "all", label: "All Statuses" },
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "learning", label: "Learning" },
  { value: "not-started", label: "Not Started" },
  { value: "needs-revision", label: "Needs Revision" },
]

export function StatusFilter({
  value,
  onChange,
  className,
  options = defaultOptions,
}: StatusFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn("w-[160px]", className)}>
        <SelectValue placeholder="Status" />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
