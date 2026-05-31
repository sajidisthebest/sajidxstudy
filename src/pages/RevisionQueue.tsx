import { useState, useMemo } from "react"
import { format, differenceInDays, isToday, startOfDay, isBefore, endOfWeek, isWithinInterval } from "date-fns"
import { RotateCcw, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react"
import { useData } from "@/context/DataContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { SubjectBadge } from "@/components/SubjectBadge"
import { MasteryStars } from "@/components/MasteryStars"
import { KanbanBoard, type KanbanColumn, type KanbanItem } from "@/components/KanbanBoard"
import { ViewToggle } from "@/components/ViewToggle"
import {
  getOverdueTopics,
  getRevisionDueToday,
  getStrongTopics,
  getWeakTopics,
  calculateRevisionAfterResult,
  generateId,
} from "@/lib/studyLogic"
import type { Topic, RevisionResult } from "@/types"

export default function RevisionQueue() {
  const { data, updateTopic, addRevisionRecord, getSubjects, getChapters } = useData()
  const subjects = getSubjects()
  const chapters = getChapters()
  const settings = data.settings
  const viewPref = settings.viewPreferences?.["revision-queue"] || "list"

  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)

  const dueToday = useMemo(() => getRevisionDueToday(data.topics), [data.topics])
  const overdue = useMemo(() => getOverdueTopics(data.topics), [data.topics])
  const strong = useMemo(() => getStrongTopics(data.topics), [data.topics])
  const weak = useMemo(() => getWeakTopics(data.topics), [data.topics])

  const thisWeek = useMemo(() => {
    const today = startOfDay(new Date())
    const weekEnd = endOfWeek(today, { weekStartsOn: 0 })
    return data.topics.filter((t) => {
      if (!t.nextRevisionAt) return false
      const revDate = startOfDay(new Date(t.nextRevisionAt))
      // This week but not today and not overdue
      return isWithinInterval(revDate, { start: today, end: weekEnd }) && !isToday(revDate) && !isBefore(revDate, today)
    })
  }, [data.topics])

  // Summary stats
  const todayCompleted = useMemo(() => {
    const todayStr = format(new Date(), "yyyy-MM-dd")
    return data.revisionRecords.filter((r) => r.revisedAt === todayStr).length
  }, [data.revisionRecords])

  const avgMastery = useMemo(() => {
    const topicsWithMastery = data.topics.filter((t) => t.masteryLevel > 0)
    if (topicsWithMastery.length === 0) return 0
    const sum = topicsWithMastery.reduce((acc, t) => acc + t.masteryLevel, 0)
    return Math.round((sum / topicsWithMastery.length) * 10) / 10
  }, [data.topics])

  const getSubjectById = (id: string) => subjects.find((s) => s.id === id)
  const getChapterById = (id: string) => chapters.find((c) => c.id === id)

  const openRevisionDialog = (topic: Topic) => {
    setSelectedTopic(topic)
    setRevisionDialogOpen(true)
  }

  const handleRevisionResult = (result: RevisionResult) => {
    if (!selectedTopic) return

    const { newMastery, nextRevisionAt } = calculateRevisionAfterResult(
      selectedTopic.masteryLevel,
      result,
      settings
    )

    const updates: Partial<Topic> = {
      masteryLevel: newMastery,
      nextRevisionAt,
      lastRevisedAt: format(new Date(), "yyyy-MM-dd"),
      lastStudiedAt: format(new Date(), "yyyy-MM-dd"),
    }

    if (result === "forgot") {
      updates.isPending = true
      updates.pendingReason = "Forgot during revision"
    }

    updateTopic(selectedTopic.id, updates)

    addRevisionRecord({
      id: generateId("rev"),
      topicId: selectedTopic.id,
      revisedAt: format(new Date(), "yyyy-MM-dd"),
      result,
      previousMastery: selectedTopic.masteryLevel,
      newMastery,
      nextRevisionAt,
      note: `Revision result: ${result}`,
    })

    setRevisionDialogOpen(false)
    setSelectedTopic(null)
  }

  const renderRevisionCard = (topic: Topic, showOverdue = false) => {
    const subject = getSubjectById(topic.subjectId)
    const chapter = getChapterById(topic.chapterId)
    const daysSinceRevision = topic.lastRevisedAt
      ? differenceInDays(new Date(), new Date(topic.lastRevisedAt))
      : topic.lastStudiedAt
        ? differenceInDays(new Date(), new Date(topic.lastStudiedAt))
        : null

    const daysOverdue = topic.nextRevisionAt
      ? differenceInDays(new Date(), new Date(topic.nextRevisionAt))
      : 0

    return (
      <Card key={topic.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  {subject && <SubjectBadge name={subject.name} color={subject.color} />}
                </div>
                {chapter && (
                  <p className="text-xs text-muted-foreground">{chapter.title}</p>
                )}
                <h4 className="font-bold text-sm mt-1">{topic.title}</h4>
              </div>
              <div className="text-right shrink-0">
                <MasteryStars value={topic.masteryLevel} size="sm" />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex gap-3">
                {topic.lastRevisedAt && (
                  <span>Last revised: {format(new Date(topic.lastRevisedAt), "MMM d")}</span>
                )}
                {daysSinceRevision !== null && (
                  <span>{daysSinceRevision}d since last revision</span>
                )}
              </div>
              {showOverdue && daysOverdue > 0 && (
                <span className="text-red-600 font-medium">{daysOverdue}d overdue</span>
              )}
            </div>

            <Button
              size="sm"
              className="w-fit text-xs h-7 mt-1"
              onClick={() => openRevisionDialog(topic)}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Start Revision
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Kanban columns for revision board
  const revisionKanbanColumns = useMemo((): KanbanColumn[] => {
    const later = data.topics.filter((t) => {
      if (!t.nextRevisionAt) return false
      const revDate = startOfDay(new Date(t.nextRevisionAt))
      const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 })
      return !isToday(revDate) && !isBefore(revDate, startOfDay(new Date())) && !isWithinInterval(revDate, { start: startOfDay(new Date()), end: weekEnd })
    })

    const toKanbanItem = (topic: Topic): KanbanItem => {
      const subject = getSubjectById(topic.subjectId)
      return {
        id: topic.id,
        title: topic.title,
        subtitle: subject?.name,
        badges: [
          { label: `Mastery ${topic.masteryLevel}`, color: topic.masteryLevel >= 4 ? "bg-green-100 text-green-800" : topic.masteryLevel >= 2 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800" },
        ],
      }
    }

    return [
      { id: "due-today", title: "Due Today", color: "#3b82f6", items: dueToday.map(toKanbanItem) },
      { id: "overdue", title: "Overdue", color: "#ef4444", items: overdue.map(toKanbanItem) },
      { id: "this-week", title: "This Week", color: "#f59e0b", items: thisWeek.map(toKanbanItem) },
      { id: "later", title: "Later", color: "#6b7280", items: later.map(toKanbanItem) },
      { id: "revised", title: "Revised", color: "#10b981", items: [] },
    ]
  }, [dueToday, overdue, thisWeek, data.topics])

  const handleRevisionDragEnd = (itemId: string, _fromColumn: string, toColumn: string) => {
    if (toColumn === "revised") {
      const topic = data.topics.find((t) => t.id === itemId)
      if (topic) openRevisionDialog(topic)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Revision Queue</h1>
          <p className="text-muted-foreground">
            Topics scheduled for revision based on spaced repetition.
          </p>
        </div>
        <ViewToggle pageKey="revision-queue" />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Due Today</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold">{dueToday.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold text-red-600">{overdue.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed Today</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold text-green-600">{todayCompleted}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Mastery</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold">{avgMastery}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      {viewPref === "board" ? (
        <KanbanBoard columns={revisionKanbanColumns} onDragEnd={handleRevisionDragEnd} />
      ) : (
      <Tabs defaultValue="due-today">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="due-today">Due Today ({dueToday.length})</TabsTrigger>
          <TabsTrigger value="overdue">Overdue ({overdue.length})</TabsTrigger>
          <TabsTrigger value="this-week">This Week ({thisWeek.length})</TabsTrigger>
          <TabsTrigger value="strong">Strong ({strong.length})</TabsTrigger>
          <TabsTrigger value="weak">Weak ({weak.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="due-today">
          {dueToday.length === 0 ? (
            <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
              No revisions due today. Great job staying on track!
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {dueToday.map((t) => renderRevisionCard(t))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="overdue">
          {overdue.length === 0 ? (
            <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
              No overdue revisions. You are up to date!
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {overdue
                .sort((a, b) => {
                  const aDate = a.nextRevisionAt ? new Date(a.nextRevisionAt).getTime() : 0
                  const bDate = b.nextRevisionAt ? new Date(b.nextRevisionAt).getTime() : 0
                  return aDate - bDate
                })
                .map((t) => renderRevisionCard(t, true))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="this-week">
          {thisWeek.length === 0 ? (
            <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
              No more revisions scheduled this week.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {thisWeek.map((t) => renderRevisionCard(t))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="strong">
          {strong.length === 0 ? (
            <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
              No strong topics yet. Keep revising to build mastery!
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {strong.map((t) => renderRevisionCard(t))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="weak">
          {weak.length === 0 ? (
            <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
              No weak topics. All topics have good mastery!
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {weak.map((t) => renderRevisionCard(t))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      )}

      {/* Revision Completion Dialog */}
      <Dialog open={revisionDialogOpen} onOpenChange={setRevisionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Revision</DialogTitle>
            <DialogDescription>
              {selectedTopic?.title}
            </DialogDescription>
          </DialogHeader>

          {selectedTopic && (
            <div className="space-y-4">
              <div className="text-sm space-y-1">
                <p><span className="text-muted-foreground">Current mastery:</span></p>
                <MasteryStars value={selectedTopic.masteryLevel} size="md" />
              </div>

              <p className="font-medium">How well did you remember this?</p>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="border-green-300 hover:bg-green-50 text-green-700 flex flex-col h-auto py-3"
                  onClick={() => handleRevisionResult("easy")}
                >
                  <TrendingUp className="h-5 w-5 mb-1" />
                  <span className="font-medium">Easy</span>
                  <span className="text-xs">Mastery +1</span>
                </Button>
                <Button
                  variant="outline"
                  className="border-blue-300 hover:bg-blue-50 text-blue-700 flex flex-col h-auto py-3"
                  onClick={() => handleRevisionResult("medium")}
                >
                  <RotateCcw className="h-5 w-5 mb-1" />
                  <span className="font-medium">Medium</span>
                  <span className="text-xs">Mastery stays</span>
                </Button>
                <Button
                  variant="outline"
                  className="border-orange-300 hover:bg-orange-50 text-orange-700 flex flex-col h-auto py-3"
                  onClick={() => handleRevisionResult("hard")}
                >
                  <TrendingDown className="h-5 w-5 mb-1" />
                  <span className="font-medium">Hard</span>
                  <span className="text-xs">Mastery -1</span>
                </Button>
                <Button
                  variant="outline"
                  className="border-red-300 hover:bg-red-50 text-red-700 flex flex-col h-auto py-3"
                  onClick={() => handleRevisionResult("forgot")}
                >
                  <AlertTriangle className="h-5 w-5 mb-1" />
                  <span className="font-medium">Forgot</span>
                  <span className="text-xs">Reset + Pending</span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
