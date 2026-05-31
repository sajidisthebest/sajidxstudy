import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { TaskCard } from "@/components/TaskCard"
import { CompletionDialog } from "@/components/CompletionDialog"
import { KanbanBoard, type KanbanColumn, type KanbanItem } from "@/components/KanbanBoard"
import { ViewToggle } from "@/components/ViewToggle"
import { useData } from "@/context/DataContext"
import { generateId, calculateNextRevisionDate, getOverdueTopics, getRevisionDueToday } from "@/lib/studyLogic"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Moon, Sun, CheckCircle2, Clock, Trash2 } from "lucide-react"
import type { StudyTask } from "@/types"

export default function TodayStudy() {
  const { data, updateStudyTask, addStudyTask, deleteStudyTask, addRevisionRecord, updateTopic, getSettings } = useData()
  const settings = getSettings()
  const viewPref = settings.viewPreferences?.["today-study"] || "list"
  const todayStr = format(new Date(), "yyyy-MM-dd")

  const [nightMode, setNightMode] = useState(false)
  const [completionDialog, setCompletionDialog] = useState<{ open: boolean; task: StudyTask | null }>({
    open: false,
    task: null,
  })

  // Get today's tasks
  const todayTasks = useMemo(() => {
    return data.studyTasks.filter((t) => t.date === todayStr)
  }, [data.studyTasks, todayStr])

  // Get today's logs
  const todayLogs = useMemo(() => {
    return data.dailyLogs.filter((l) => l.date === todayStr)
  }, [data.dailyLogs, todayStr])

  // Revision topics due today
  const revisionDueToday = useMemo(() => getRevisionDueToday(data.topics), [data.topics])

  // Overdue high-priority pending
  const overdueHighPriority = useMemo(() => {
    const overdue = getOverdueTopics(data.topics)
    return overdue.filter((t) => t.priority === "high" || t.priority === "urgent")
  }, [data.topics])

  // Generate additional tasks from logs not already in tasks
  const allTasks = useMemo(() => {
    const existingTopicIds = new Set(todayTasks.map((t) => t.topicId))
    const additionalTasks: StudyTask[] = []

    // Add revision due today as tasks if not already present
    revisionDueToday.forEach((topic) => {
      if (!existingTopicIds.has(topic.id)) {
        additionalTasks.push({
          id: `gen-rev-${topic.id}`,
          date: todayStr,
          topicId: topic.id,
          topicTitle: topic.title,
          subjectId: topic.subjectId,
          chapterId: topic.chapterId,
          source: "self-study",
          taskType: "revision",
          status: "not-started",
          priority: "high",
          estimatedMinutes: topic.estimatedMinutes || 30,
          completedAt: null,
          createdAt: new Date().toISOString(),
        })
        existingTopicIds.add(topic.id)
      }
    })

    // Add overdue high priority as tasks if not already present
    overdueHighPriority.forEach((topic) => {
      if (!existingTopicIds.has(topic.id)) {
        additionalTasks.push({
          id: `gen-over-${topic.id}`,
          date: todayStr,
          topicId: topic.id,
          topicTitle: topic.title,
          subjectId: topic.subjectId,
          chapterId: topic.chapterId,
          source: "self-study",
          taskType: "overdue-pending",
          status: "not-started",
          priority: topic.priority,
          estimatedMinutes: topic.estimatedMinutes || 30,
          completedAt: null,
          createdAt: new Date().toISOString(),
        })
        existingTopicIds.add(topic.id)
      }
    })

    return [...todayTasks, ...additionalTasks]
  }, [todayTasks, revisionDueToday, overdueHighPriority, todayStr])

  const completedCount = allTasks.filter((t) => t.status === "completed").length
  const totalCount = allTasks.length
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const incompleteTasks = allTasks.filter((t) => t.status !== "completed")

  const handleStartStudy = (task: StudyTask) => {
    if (task.id.startsWith("gen-")) {
      // Create a real task from generated one
      const newTask = { ...task, id: generateId("task") }
      addStudyTask(newTask)
      updateStudyTask(newTask.id, { status: "studying" })
    } else {
      updateStudyTask(task.id, { status: "studying" })
    }
  }

  const handleMarkComplete = (task: StudyTask) => {
    setCompletionDialog({ open: true, task })
  }

  const handleConfirmCompletion = (mastery: number) => {
    const task = completionDialog.task
    if (!task) return

    const nowStr = new Date().toISOString()
    const nextRevision = calculateNextRevisionDate(mastery, settings)

    // Update or create the actual task
    if (task.id.startsWith("gen-")) {
      const newTask = { ...task, id: generateId("task"), status: "completed" as const, completedAt: nowStr }
      addStudyTask(newTask)
    } else {
      updateStudyTask(task.id, { status: "completed", completedAt: nowStr })
    }

    // Update topic mastery and next revision
    if (task.topicId) {
      updateTopic(task.topicId, {
        masteryLevel: mastery,
        status: "completed",
        lastRevisedAt: todayStr,
        nextRevisionAt: nextRevision,
        isPending: false,
        updatedAt: nowStr,
      })

      // Create revision record if this is a revision task
      if (task.taskType === "revision") {
        const existingTopic = data.topics.find((t) => t.id === task.topicId)
        addRevisionRecord({
          id: generateId("rev"),
          topicId: task.topicId,
          revisedAt: nowStr,
          result: mastery >= 4 ? "easy" : mastery >= 3 ? "medium" : "hard",
          previousMastery: existingTopic?.masteryLevel ?? 0,
          newMastery: mastery,
          nextRevisionAt: nextRevision,
          note: "",
        })
      }
    }
  }

  const handleMarkPending = (task: StudyTask) => {
    if (task.id.startsWith("gen-")) {
      const newTask = { ...task, id: generateId("task"), status: "pending" as const }
      addStudyTask(newTask)
    } else {
      updateStudyTask(task.id, { status: "pending" })
    }
    if (task.topicId) {
      updateTopic(task.topicId, { isPending: true, pendingReason: "Deferred from today" })
    }
  }

  // Group tasks by type
  const tasksByType = useMemo(() => {
    const groups: Record<string, StudyTask[]> = {
      college: [],
      tuition: [],
      "self-study": [],
      revision: [],
      overdue: [],
    }
    allTasks.forEach((task) => {
      if (task.taskType === "revision") groups.revision.push(task)
      else if (task.taskType === "overdue-pending") groups.overdue.push(task)
      else if (task.taskType === "college-topic") groups.college.push(task)
      else if (task.taskType === "tuition-topic") groups.tuition.push(task)
      else groups["self-study"].push(task)
    })
    return groups
  }, [allTasks])

  // Kanban columns
  const kanbanColumns = useMemo((): KanbanColumn[] => {
    const statusMap: Record<string, StudyTask[]> = {
      "not-started": [],
      "studying": [],
      "need-help": [],
      "pending": [],
      "completed": [],
    }
    allTasks.forEach((task) => {
      if (statusMap[task.status]) {
        statusMap[task.status].push(task)
      } else {
        statusMap["not-started"].push(task)
      }
    })

    const toKanbanItem = (task: StudyTask): KanbanItem => {
      const subject = data.subjects.find((s) => s.id === task.subjectId)
      return {
        id: task.id,
        title: task.topicTitle,
        subtitle: subject?.name,
        badges: [
          { label: task.source, color: task.source === "college" ? "bg-blue-100 text-blue-800" : task.source === "tuition" ? "bg-purple-100 text-purple-800" : "bg-teal-100 text-teal-800" },
          { label: task.priority, color: task.priority === "urgent" ? "bg-red-100 text-red-800" : task.priority === "high" ? "bg-orange-100 text-orange-800" : "bg-gray-100 text-gray-700" },
        ],
        metadata: { time: `${task.estimatedMinutes}m` },
      }
    }

    return [
      { id: "not-started", title: "Not Started", color: "#9ca3af", items: statusMap["not-started"].map(toKanbanItem) },
      { id: "studying", title: "Studying Now", color: "#3b82f6", items: statusMap["studying"].map(toKanbanItem) },
      { id: "need-help", title: "Need Help", color: "#f59e0b", items: statusMap["need-help"].map(toKanbanItem) },
      { id: "pending", title: "Pending", color: "#ef4444", items: statusMap["pending"].map(toKanbanItem) },
      { id: "completed", title: "Completed", color: "#10b981", items: statusMap["completed"].map(toKanbanItem) },
    ]
  }, [allTasks, data.subjects])

  const handleKanbanDragEnd = (itemId: string, _fromColumn: string, toColumn: string) => {
    const task = allTasks.find((t) => t.id === itemId)
    if (!task) return

    if (toColumn === "completed") {
      handleMarkComplete(task)
    } else if (toColumn === "pending") {
      handleMarkPending(task)
    } else {
      const newStatus = toColumn as StudyTask["status"]
      if (task.id.startsWith("gen-")) {
        const newTask = { ...task, id: generateId("task"), status: newStatus }
        addStudyTask(newTask)
      } else {
        updateStudyTask(task.id, { status: newStatus })
      }
    }
  }

  // Night mode view
  if (nightMode) {
    return (
      <div className="min-h-screen -m-4 md:-m-6 p-4 md:p-6 bg-gray-900 text-white">
        <div className="max-w-lg mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Moon className="h-5 w-5" />
              Night Mode
            </h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNightMode(false)}
              className="text-white border-gray-600 hover:bg-gray-800"
            >
              <Sun className="h-4 w-4 mr-1" />
              Exit
            </Button>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{completedCount} of {totalCount} done</span>
              <span>{completionPercent}%</span>
            </div>
            <Progress value={completionPercent} className="h-3" />
          </div>

          {/* Focused task list */}
          <div className="space-y-2">
            {incompleteTasks.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-400 mb-3" />
                <p className="text-lg">All done for today!</p>
              </div>
            ) : (
              incompleteTasks.map((task) => {
                const subject = data.subjects.find((s) => s.id === task.subjectId)
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-4 rounded-lg bg-gray-800 border border-gray-700"
                  >
                    <button
                      onClick={() => handleMarkComplete(task)}
                      className="h-6 w-6 rounded-full border-2 border-gray-500 hover:border-green-400 hover:bg-green-400/20 flex-shrink-0 transition-colors"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{task.topicTitle}</p>
                      <p className="text-xs text-gray-400">{subject?.name}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="h-3 w-3" />
                      {task.estimatedMinutes}m
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkPending(task)}
                      className="text-xs text-gray-400 hover:text-yellow-400"
                    >
                      Skip
                    </Button>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <CompletionDialog
          open={completionDialog.open}
          onOpenChange={(open) => setCompletionDialog({ open, task: completionDialog.task })}
          topicTitle={completionDialog.task?.topicTitle ?? ""}
          onConfirm={handleConfirmCompletion}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Today&apos;s Study</h1>
          <p className="text-muted-foreground">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {allTasks.length > 0 && (
            <Button variant="outline" size="sm" className="text-xs text-muted-foreground" onClick={() => { todayTasks.forEach(t => deleteStudyTask(t.id)) }}>
              <Trash2 className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          )}
          <ViewToggle pageKey="today-study" />
          <Moon className="h-4 w-4 text-muted-foreground" />
          <Switch checked={nightMode} onCheckedChange={setNightMode} />
          <span className="text-sm text-muted-foreground">Night Mode</span>
        </div>
      </div>

      {/* Progress overview */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              {completedCount} of {totalCount} tasks completed
            </span>
            <span className="text-sm font-bold">{completionPercent}%</span>
          </div>
          <Progress value={completionPercent} className="h-2" />
          <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              {completedCount} done
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              {allTasks.filter((t) => t.status === "studying").length} studying
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-gray-400" />
              {allTasks.filter((t) => t.status === "not-started").length} to do
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Board View */}
      {viewPref === "board" ? (
        <KanbanBoard columns={kanbanColumns} onDragEnd={handleKanbanDragEnd} />
      ) : (
      <>
      {/* Task sections */}
      {allTasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>No tasks for today. Log some study to generate tasks!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {tasksByType.college.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">College</Badge>
                <span>{tasksByType.college.length} topics</span>
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {tasksByType.college.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    subject={data.subjects.find((s) => s.id === task.subjectId)}
                    chapter={data.chapters.find((c) => c.id === task.chapterId)}
                    onStartStudy={() => handleStartStudy(task)}
                    onMarkComplete={() => handleMarkComplete(task)}
                    onMarkPending={() => handleMarkPending(task)}
                    onDelete={() => !task.id.startsWith("gen-") && deleteStudyTask(task.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {tasksByType.tuition.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-3 flex items-center gap-2">
                <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">Tuition</Badge>
                <span>{tasksByType.tuition.length} topics</span>
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {tasksByType.tuition.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    subject={data.subjects.find((s) => s.id === task.subjectId)}
                    chapter={data.chapters.find((c) => c.id === task.chapterId)}
                    onStartStudy={() => handleStartStudy(task)}
                    onMarkComplete={() => handleMarkComplete(task)}
                    onMarkPending={() => handleMarkPending(task)}
                    onDelete={() => !task.id.startsWith("gen-") && deleteStudyTask(task.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {tasksByType["self-study"].length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-teal-600 dark:text-teal-400 mb-3 flex items-center gap-2">
                <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200">Self-Study</Badge>
                <span>{tasksByType["self-study"].length} tasks</span>
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {tasksByType["self-study"].map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    subject={data.subjects.find((s) => s.id === task.subjectId)}
                    chapter={data.chapters.find((c) => c.id === task.chapterId)}
                    onStartStudy={() => handleStartStudy(task)}
                    onMarkComplete={() => handleMarkComplete(task)}
                    onMarkPending={() => handleMarkPending(task)}
                    onDelete={() => !task.id.startsWith("gen-") && deleteStudyTask(task.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {tasksByType.revision.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-3 flex items-center gap-2">
                <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">Revision</Badge>
                <span>{tasksByType.revision.length} topics</span>
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {tasksByType.revision.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    subject={data.subjects.find((s) => s.id === task.subjectId)}
                    chapter={data.chapters.find((c) => c.id === task.chapterId)}
                    onStartStudy={() => handleStartStudy(task)}
                    onMarkComplete={() => handleMarkComplete(task)}
                    onMarkPending={() => handleMarkPending(task)}
                    onDelete={() => !task.id.startsWith("gen-") && deleteStudyTask(task.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {tasksByType.overdue.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
                <Badge variant="destructive">Overdue</Badge>
                <span>{tasksByType.overdue.length} topics</span>
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {tasksByType.overdue.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    subject={data.subjects.find((s) => s.id === task.subjectId)}
                    chapter={data.chapters.find((c) => c.id === task.chapterId)}
                    onStartStudy={() => handleStartStudy(task)}
                    onMarkComplete={() => handleMarkComplete(task)}
                    onMarkPending={() => handleMarkPending(task)}
                    onDelete={() => !task.id.startsWith("gen-") && deleteStudyTask(task.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      </>
      )}

      {/* Today's log summary */}
      {todayLogs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Logged Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {todayLogs.map((log) => {
                const subject = data.subjects.find((s) => s.id === log.subjectId)
                return (
                  <Badge key={log.id} variant="outline" className="text-xs gap-1">
                    <span className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      log.status === "completed" && "bg-green-500",
                      log.status === "need-to-study-tonight" && "bg-yellow-500",
                      log.status === "pending" && "bg-red-500"
                    )} />
                    {subject?.name}: {log.topicTitle}
                  </Badge>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <CompletionDialog
        open={completionDialog.open}
        onOpenChange={(open) => setCompletionDialog({ open, task: completionDialog.task })}
        topicTitle={completionDialog.task?.topicTitle ?? ""}
        onConfirm={handleConfirmCompletion}
      />
    </div>
  )
}
