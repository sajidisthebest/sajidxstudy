import { useData } from "@/context/DataContext"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

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

interface SubjectFilterProps {
  value: string
  onChange: (value: string) => void
  className?: string
  includeAll?: boolean
  filterTuition?: boolean
}

export function SubjectFilter({
  value,
  onChange,
  className,
  includeAll = true,
  filterTuition,
}: SubjectFilterProps) {
  const { getSubjects } = useData()
  let subjects = getSubjects()

  if (filterTuition !== undefined) {
    subjects = subjects.filter((s) => s.isTuitionSubject === filterTuition)
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn("w-[180px]", className)}>
        <SelectValue placeholder="Subject" />
      </SelectTrigger>
      <SelectContent>
        {includeAll && <SelectItem value="all">All Subjects</SelectItem>}
        {subjects.map((subject) => (
          <SelectItem key={subject.id} value={subject.id}>
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  dotColorMap[subject.color] ?? "bg-gray-500"
                )}
              />
              {subject.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
