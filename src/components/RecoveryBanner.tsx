import { useMemo } from "react"
import { AlertTriangle } from "lucide-react"
import { useData } from "@/context/DataContext"
import { getOverdueTopics } from "@/lib/studyLogic"
import { Badge } from "@/components/ui/badge"
import { SubjectBadge } from "@/components/SubjectBadge"
import { differenceInDays } from "date-fns"

export function RecoveryBanner() {
  const { data } = useData()

  const overdueTopics = useMemo(() => getOverdueTopics(data.topics), [data.topics])

  const top5 = useMemo(() => {
    if (overdueTopics.length <= 10) return []
    const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
    return [...overdueTopics]
      .sort((a, b) => {
        // Priority first
        const pDiff = (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3)
        if (pDiff !== 0) return pDiff
        // Days overdue
        const aDays = a.nextRevisionAt ? differenceInDays(new Date(), new Date(a.nextRevisionAt)) : 0
        const bDays = b.nextRevisionAt ? differenceInDays(new Date(), new Date(b.nextRevisionAt)) : 0
        if (aDays !== bDays) return bDays - aDays
        // Weakest mastery first
        return a.masteryLevel - b.masteryLevel
      })
      .slice(0, 5)
  }, [overdueTopics])

  if (overdueTopics.length <= 10) return null

  return (
    <div className="rounded-lg border-2 border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-red-600" />
        <h2 className="font-bold text-red-800 dark:text-red-400">Recovery Mode</h2>
        <Badge variant="destructive" className="text-xs">{overdueTopics.length} overdue</Badge>
      </div>
      <p className="text-sm text-red-700 dark:text-red-300">
        You have many overdue items. Focus on these 5 most important ones today:
      </p>
      <div className="space-y-2">
        {top5.map((topic) => {
          const subject = data.subjects.find((s) => s.id === topic.subjectId)
          const daysOverdue = topic.nextRevisionAt
            ? differenceInDays(new Date(), new Date(topic.nextRevisionAt))
            : 0
          return (
            <div key={topic.id} className="flex items-center gap-3 p-2 rounded bg-white dark:bg-gray-900 border">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  {subject && <SubjectBadge name={subject.name} color={subject.color} />}
                  <Badge variant="outline" className="text-xs">{topic.priority}</Badge>
                </div>
                <p className="font-medium text-sm truncate">{topic.title}</p>
              </div>
              <span className="text-xs text-red-600 font-medium shrink-0">{daysOverdue}d overdue</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
