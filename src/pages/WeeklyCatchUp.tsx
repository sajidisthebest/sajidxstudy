import { useState, useMemo, useCallback } from "react"
import { format, startOfWeek, endOfWeek } from "date-fns"
import { Calendar, Clock, ListChecks, Zap } from "lucide-react"
import { useData } from "@/context/DataContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { SubjectBadge } from "@/components/SubjectBadge"
import { MasteryStars } from "@/components/MasteryStars"
import { KanbanBoard, type KanbanColumn, type KanbanItem } from "@/components/KanbanBoard"
import { ViewToggle } from "@/components/ViewToggle"
import {
  collectWeeklyCatchUpItems,
  buildWeekendPlan,
  getDaysPending,
  getTopicSource,
  generateId,
} from "@/lib/studyLogic"
import type { Topic, WeeklyCatchUpPlan } from "@/types"

const priorityBadgeColors: Record<string, string> = {
  urgent: "bg-red-100 text-red-800",
  high: "bg-orange-100 text-orange-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-gray-100 text-gray-800",
}

export default function WeeklyCatchUp() {
  const { data, getSubjects, getChapters, addWeeklyCatchUpPlan, updateWeeklyCatchUpPlan } = useData()
  const subjects = getSubjects()
  const chapters = getChapters()
  const settings = data.settings
  const viewPref = settings.viewPreferences?.["weekly-catchup"] || "list"

  const today = new Date()
  const weekStart = format(startOfWeek(today, { weekStartsOn: 0 }), "yyyy-MM-dd")
  const weekEnd = format(endOfWeek(today, { weekStartsOn: 0 }), "yyyy-MM-dd")

  // Find existing plan for this week
  const existingPlan = useMemo(
    () => data.weeklyCatchUpPlans.find((p) => p.weekStartDate === weekStart),
    [data.weeklyCatchUpPlans, weekStart]
  )

  const [completedTasks, setCompletedTasks] = useState<string[]>(existingPlan?.completedTasks || [])
  const [weekendPlan, setWeekendPlan] = useState<{ friday: Topic[]; saturday: Topic[] } | null>(null)

  const collectedItems = useMemo(() => collectWeeklyCatchUpItems(data), [data])

  const totalEstimatedTime = useMemo(
    () => collectedItems.reduce((sum, t) => sum + (t.estimatedMinutes || 30), 0),
    [collectedItems]
  )

  const subjectBreakdown = useMemo(() => {
    const map: Record<string, { name: string; color: string; count: number }> = {}
    for (const item of collectedItems) {
      const subject = subjects.find((s) => s.id === item.subjectId)
      if (subject) {
        if (!map[subject.id]) map[subject.id] = { name: subject.name, color: subject.color, count: 0 }
        map[subject.id].count++
      }
    }
    return Object.values(map)
  }, [collectedItems, subjects])

  const priorityBreakdown = useMemo(() => {
    const map: Record<string, number> = { urgent: 0, high: 0, medium: 0, low: 0 }
    for (const item of collectedItems) {
      map[item.priority] = (map[item.priority] || 0) + 1
    }
    return map
  }, [collectedItems])

  const getSubjectById = (id: string) => subjects.find((s) => s.id === id)
  const getChapterById = (id: string) => chapters.find((c) => c.id === id)

  const handleBuildPlan = useCallback(() => {
    const plan = buildWeekendPlan(collectedItems, subjects)
    setWeekendPlan(plan)

    const newPlan: WeeklyCatchUpPlan = {
      id: generateId("wcp"),
      weekStartDate: weekStart,
      weekEndDate: weekEnd,
      fridayTasks: plan.friday.map((t) => t.id),
      saturdayTasks: plan.saturday.map((t) => t.id),
      completedTasks: [],
      createdAt: new Date().toISOString(),
    }

    if (existingPlan) {
      updateWeeklyCatchUpPlan(existingPlan.id, {
        fridayTasks: newPlan.fridayTasks,
        saturdayTasks: newPlan.saturdayTasks,
      })
    } else {
      addWeeklyCatchUpPlan(newPlan)
    }
  }, [collectedItems, subjects, weekStart, weekEnd, existingPlan, addWeeklyCatchUpPlan, updateWeeklyCatchUpPlan])

  const toggleTask = (topicId: string) => {
    setCompletedTasks((prev) => {
      const updated = prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId]

      if (existingPlan) {
        updateWeeklyCatchUpPlan(existingPlan.id, { completedTasks: updated })
      }
      return updated
    })
  }

  // Load weekend plan from existing plan if available
  const displayPlan = useMemo(() => {
    if (weekendPlan) return weekendPlan
    if (existingPlan) {
      const friday = existingPlan.fridayTasks
        .map((id) => data.topics.find((t) => t.id === id))
        .filter(Boolean) as Topic[]
      const saturday = existingPlan.saturdayTasks
        .map((id) => data.topics.find((t) => t.id === id))
        .filter(Boolean) as Topic[]
      return { friday, saturday }
    }
    return null
  }, [weekendPlan, existingPlan, data.topics])

  // Grouping functions
  const groupBySubject = useMemo(() => {
    const map: Record<string, Topic[]> = {}
    for (const item of collectedItems) {
      const subject = getSubjectById(item.subjectId)
      const key = subject?.name || "Unknown"
      if (!map[key]) map[key] = []
      map[key].push(item)
    }
    return map
  }, [collectedItems, subjects])

  const groupByPriority = useMemo(() => {
    const map: Record<string, Topic[]> = { urgent: [], high: [], medium: [], low: [] }
    for (const item of collectedItems) {
      map[item.priority]?.push(item)
    }
    return map
  }, [collectedItems])

  const groupBySource = useMemo(() => {
    const map: Record<string, Topic[]> = { college: [], tuition: [], "self-study": [] }
    for (const item of collectedItems) {
      const source = getTopicSource(item)
      map[source]?.push(item)
    }
    return map
  }, [collectedItems])

  const renderTopicItem = (topic: Topic, showCheckbox = false) => {
    const subject = getSubjectById(topic.subjectId)
    const chapter = getChapterById(topic.chapterId)
    const isCompleted = completedTasks.includes(topic.id)

    return (
      <div
        key={topic.id}
        className={`flex items-center gap-3 p-3 rounded-lg border ${isCompleted ? "bg-green-50 border-green-200" : "bg-card"}`}
      >
        {showCheckbox && (
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={() => toggleTask(topic.id)}
            className="h-4 w-4 rounded border-gray-300"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            {subject && <SubjectBadge name={subject.name} color={subject.color} />}
            <Badge variant="outline" className={priorityBadgeColors[topic.priority]}>
              {topic.priority}
            </Badge>
          </div>
          <p className={`text-sm font-medium ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
            {topic.title}
          </p>
          {chapter && <p className="text-xs text-muted-foreground">{chapter.title}</p>}
        </div>
        <div className="text-xs text-muted-foreground text-right shrink-0">
          <p>{topic.estimatedMinutes || 30}m</p>
          <MasteryStars value={topic.masteryLevel} size="sm" />
        </div>
      </div>
    )
  }

  const renderDayColumn = (title: string, topics: Topic[]) => {
    const totalTime = topics.reduce((sum, t) => sum + (t.estimatedMinutes || 30), 0)
    const completed = topics.filter((t) => completedTasks.includes(t.id)).length
    const progress = topics.length > 0 ? Math.round((completed / topics.length) * 100) : 0

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">{title}</h3>
          <span className="text-sm text-muted-foreground">{totalTime}m total</span>
        </div>
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground">{completed}/{topics.length} completed</p>
        <div className="space-y-2">
          {topics.map((t) => renderTopicItem(t, true))}
        </div>
      </div>
    )
  }

  // Kanban board columns for weekly catch-up
  const weeklyKanbanColumns = useMemo((): KanbanColumn[] => {
    const fridayItems = displayPlan?.friday ?? []
    const saturdayItems = displayPlan?.saturday ?? []
    const plannedIds = new Set([...fridayItems.map((t) => t.id), ...saturdayItems.map((t) => t.id)])
    const backlog = collectedItems.filter((t) => !plannedIds.has(t.id) && !completedTasks.includes(t.id))
    const done = collectedItems.filter((t) => completedTasks.includes(t.id))

    const toKanbanItem = (topic: Topic): KanbanItem => {
      const subject = getSubjectById(topic.subjectId)
      return {
        id: topic.id,
        title: topic.title,
        subtitle: subject?.name,
        metadata: { time: `${topic.estimatedMinutes || 30}m` },
      }
    }

    return [
      { id: "backlog", title: "Backlog", color: "#6b7280", items: backlog.map(toKanbanItem) },
      { id: "friday", title: "Friday Plan", color: "#3b82f6", items: fridayItems.filter((t) => !completedTasks.includes(t.id)).map(toKanbanItem) },
      { id: "saturday", title: "Saturday Plan", color: "#8b5cf6", items: saturdayItems.filter((t) => !completedTasks.includes(t.id)).map(toKanbanItem) },
      { id: "done", title: "Done", color: "#10b981", items: done.map(toKanbanItem) },
    ]
  }, [collectedItems, displayPlan, completedTasks])

  const handleWeeklyDragEnd = (itemId: string, _fromColumn: string, toColumn: string) => {
    if (toColumn === "done") {
      toggleTask(itemId)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Weekly Catch-Up</h1>
          <p className="text-muted-foreground">
            Plan your Friday/Saturday catch-up sessions. Week of {weekStart}
          </p>
        </div>
        <ViewToggle pageKey="weekly-catchup" />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <ListChecks className="h-4 w-4" />
              Total Items
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold">{collectedItems.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Est. Time
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold">{Math.round(totalEstimatedTime / 60)}h {totalEstimatedTime % 60}m</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Subjects
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold">{subjectBreakdown.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Zap className="h-4 w-4" />
              Urgent/High
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold text-orange-600">
              {(priorityBreakdown.urgent || 0) + (priorityBreakdown.high || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Build Weekend Plan Button */}
      <div className="flex items-center gap-4">
        <Button onClick={handleBuildPlan} size="lg">
          <Calendar className="h-4 w-4 mr-2" />
          {displayPlan ? "Rebuild Weekend Plan" : "Build Weekend Plan"}
        </Button>
        {displayPlan && (
          <p className="text-sm text-muted-foreground">
            Plan created. Check off items as you complete them.
          </p>
        )}
      </div>

      {/* Board View */}
      {viewPref === "board" ? (
        <KanbanBoard columns={weeklyKanbanColumns} onDragEnd={handleWeeklyDragEnd} />
      ) : (
      <>
      {/* Weekend Plan Display */}
      {displayPlan && (
        <div className="grid md:grid-cols-2 gap-6">
          {renderDayColumn("Friday", displayPlan.friday)}
          {renderDayColumn("Saturday", displayPlan.saturday)}
        </div>
      )}

      {/* Grouping Tabs */}
      <Tabs defaultValue="by-subject">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="by-subject">By Subject</TabsTrigger>
          <TabsTrigger value="by-priority">By Priority</TabsTrigger>
          <TabsTrigger value="by-source">By Source</TabsTrigger>
          <TabsTrigger value="by-days">By Days Pending</TabsTrigger>
        </TabsList>

        <TabsContent value="by-subject">
          <div className="space-y-4">
            {Object.entries(groupBySubject).map(([subjectName, topics]) => (
              <div key={subjectName} className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground">{subjectName} ({topics.length})</h3>
                <div className="space-y-2">
                  {topics.map((t) => renderTopicItem(t))}
                </div>
              </div>
            ))}
            {collectedItems.length === 0 && (
              <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
                No items to catch up on this week!
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="by-priority">
          <div className="space-y-4">
            {(["urgent", "high", "medium", "low"] as const).map((priority) => {
              const topics = groupByPriority[priority]
              if (!topics || topics.length === 0) return null
              return (
                <div key={priority} className="space-y-2">
                  <h3 className="font-medium text-sm">
                    <Badge variant="outline" className={priorityBadgeColors[priority]}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Badge>
                    <span className="ml-2 text-muted-foreground">({topics.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {topics.map((t) => renderTopicItem(t))}
                  </div>
                </div>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="by-source">
          <div className="space-y-4">
            {(["college", "tuition", "self-study"] as const).map((source) => {
              const topics = groupBySource[source]
              if (!topics || topics.length === 0) return null
              return (
                <div key={source} className="space-y-2">
                  <h3 className="font-medium text-sm text-muted-foreground">
                    {source === "self-study" ? "Self-Study" : source.charAt(0).toUpperCase() + source.slice(1)} ({topics.length})
                  </h3>
                  <div className="space-y-2">
                    {topics.map((t) => renderTopicItem(t))}
                  </div>
                </div>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="by-days">
          <div className="space-y-4">
            {[...collectedItems]
              .sort((a, b) => getDaysPending(b) - getDaysPending(a))
              .map((t) => renderTopicItem(t))}
            {collectedItems.length === 0 && (
              <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
                No items to catch up on this week!
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      </>
      )}
    </div>
  )
}
