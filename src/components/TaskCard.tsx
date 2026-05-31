import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SubjectBadge } from "@/components/SubjectBadge"
import { cn } from "@/lib/utils"
import { Clock, Play, CheckCircle2, AlertCircle, MessageSquare, Trash2 } from "lucide-react"
import type { StudyTask, Subject, Chapter } from "@/types"

interface TaskCardProps {
  task: StudyTask
  subject?: Subject
  chapter?: Chapter
  onStartStudy?: () => void
  onMarkComplete?: () => void
  onMarkPending?: () => void
  onAddNote?: () => void
  onDelete?: () => void
  compact?: boolean
}

const sourceBadgeColors: Record<string, string> = {
  college: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  tuition: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  "self-study": "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
}

const priorityBadgeColors: Record<string, string> = {
  urgent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  low: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
}

const statusIndicator: Record<string, { color: string; label: string }> = {
  "not-started": { color: "bg-gray-400", label: "Not Started" },
  studying: { color: "bg-blue-400", label: "Studying" },
  "need-help": { color: "bg-orange-400", label: "Need Help" },
  pending: { color: "bg-yellow-400", label: "Pending" },
  completed: { color: "bg-green-400", label: "Completed" },
}

export function TaskCard({
  task,
  subject,
  chapter,
  onStartStudy,
  onMarkComplete,
  onMarkPending,
  onAddNote,
  onDelete,
  compact = false,
}: TaskCardProps) {
  const status = statusIndicator[task.status] ?? statusIndicator["not-started"]

  return (
    <Card className={cn("transition-shadow hover:shadow-md", task.status === "completed" && "opacity-60")}>
      <CardContent className={cn("space-y-3", compact ? "p-3" : "p-4")}>
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm leading-tight truncate">{task.topicTitle}</h4>
            {chapter && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{chapter.title}</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <span className={cn("h-2 w-2 rounded-full", status.color)} />
            <span className="text-xs text-muted-foreground">{status.label}</span>
            {onDelete && (
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-600" onClick={onDelete}>
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap gap-1.5">
          {subject && <SubjectBadge name={subject.name} color={subject.color} />}
          <Badge variant="secondary" className={cn(sourceBadgeColors[task.source])}>
            {task.source}
          </Badge>
          <Badge variant="secondary" className={cn(priorityBadgeColors[task.priority])}>
            {task.priority}
          </Badge>
          {task.estimatedMinutes > 0 && (
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              {task.estimatedMinutes}m
            </Badge>
          )}
        </div>

        {/* Actions */}
        {task.status !== "completed" && (
          <div className="flex flex-wrap gap-2 pt-1">
            {task.status === "not-started" && onStartStudy && (
              <Button variant="outline" size="sm" onClick={onStartStudy} className="h-7 text-xs">
                <Play className="h-3 w-3 mr-1" />
                Start
              </Button>
            )}
            {onMarkComplete && (
              <Button variant="outline" size="sm" onClick={onMarkComplete} className="h-7 text-xs text-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Complete
              </Button>
            )}
            {onMarkPending && (
              <Button variant="outline" size="sm" onClick={onMarkPending} className="h-7 text-xs text-yellow-600">
                <AlertCircle className="h-3 w-3 mr-1" />
                Pending
              </Button>
            )}
            {onAddNote && (
              <Button variant="ghost" size="sm" onClick={onAddNote} className="h-7 text-xs">
                <MessageSquare className="h-3 w-3 mr-1" />
                Note
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
