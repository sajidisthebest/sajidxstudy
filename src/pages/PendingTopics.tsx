import { useState, useMemo } from "react"
import { format } from "date-fns"
import { AlertCircle, BookOpen, Check, X, Clock, Trash2 } from "lucide-react"
import { useData } from "@/context/DataContext"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { SubjectBadge } from "@/components/SubjectBadge"
import { MasteryStars } from "@/components/MasteryStars"
import { KanbanBoard, type KanbanColumn, type KanbanItem } from "@/components/KanbanBoard"
import { ViewToggle } from "@/components/ViewToggle"
import {
  getEffectivePendingTopics,
  getDaysPending,
  getTopicSource,
  getTopicDate,
  generateId,
  calculateNextRevisionDate,
} from "@/lib/studyLogic"
import type { Topic, Understanding } from "@/types"

type PendingTopic = Topic & { detectedReason: string }

const sourceBadgeColors: Record<string, string> = {
  college: "bg-blue-100 text-blue-800",
  tuition: "bg-purple-100 text-purple-800",
  "self-study": "bg-teal-100 text-teal-800",
}

const priorityBadgeColors: Record<string, string> = {
  urgent: "bg-red-100 text-red-800",
  high: "bg-orange-100 text-orange-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-gray-100 text-gray-800",
}

export default function PendingTopics() {
  const { data, updateTopic, deleteTopic, addRevisionRecord, getSubjects, getChapters } = useData()
  const subjects = getSubjects()
  const chapters = getChapters()
  const settings = data.settings
  const viewPref = settings.viewPreferences?.["pending-topics"] || "list"

  const [clearDialogOpen, setClearDialogOpen] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState<PendingTopic | null>(null)
  const [dialogStep, setDialogStep] = useState(1)
  const [understood, setUnderstood] = useState<Understanding | null>(null)
  const [confidence, setConfidence] = useState(3)
  const [needsRevision, setNeedsRevision] = useState<boolean | null>(null)
  const [revisionDate, setRevisionDate] = useState("")

  // Delete topic confirmation state
  const [deleteTopicDialogOpen, setDeleteTopicDialogOpen] = useState(false)
  const [topicToDelete, setTopicToDelete] = useState<PendingTopic | null>(null)

  const pendingTopics = useMemo(
    () => getEffectivePendingTopics(data.topics, data.dailyLogs),
    [data.topics, data.dailyLogs]
  )

  const confusionTopics = useMemo(
    () => pendingTopics.filter((t) => t.understanding === "no"),
    [pendingTopics]
  )

  const filterTopics = (tab: string): PendingTopic[] => {
    switch (tab) {
      case "this-week":
        return pendingTopics.filter((t) => getDaysPending(t) <= 7)
      case "older":
        return pendingTopics.filter((t) => getDaysPending(t) > 7)
      case "urgent":
        return pendingTopics.filter(
          (t) => getDaysPending(t) > 14 || t.priority === "urgent" || t.priority === "high"
        )
      case "college":
        return pendingTopics.filter((t) => getTopicSource(t) === "college")
      case "tuition":
        return pendingTopics.filter((t) => getTopicSource(t) === "tuition")
      case "self-study":
        return pendingTopics.filter((t) => getTopicSource(t) === "self-study")
      case "weak":
        return pendingTopics.filter((t) => t.masteryLevel <= 2 && t.masteryLevel > 0)
      default:
        return pendingTopics
    }
  }

  const getSubjectById = (id: string) => subjects.find((s) => s.id === id)
  const getChapterById = (id: string) => chapters.find((c) => c.id === id)

  const openClearDialog = (topic: PendingTopic) => {
    setSelectedTopic(topic)
    setDialogStep(1)
    setUnderstood(null)
    setConfidence(3)
    setNeedsRevision(null)
    setRevisionDate("")
    setClearDialogOpen(true)
  }

  const handleDismiss = (topic: PendingTopic) => {
    updateTopic(topic.id, { isPending: false, pendingReason: null })
  }

  const confirmDeleteTopic = (topic: PendingTopic) => {
    setTopicToDelete(topic)
    setDeleteTopicDialogOpen(true)
  }

  const handleDeleteTopic = () => {
    if (topicToDelete) {
      deleteTopic(topicToDelete.id)
      setDeleteTopicDialogOpen(false)
      setTopicToDelete(null)
    }
  }

  const handleClearConfirm = () => {
    if (!selectedTopic) return

    const settings = data.settings
    const nextRevDate = needsRevision
      ? revisionDate || calculateNextRevisionDate(confidence, settings)
      : null

    updateTopic(selectedTopic.id, {
      understanding: understood,
      masteryLevel: confidence,
      isPending: false,
      pendingReason: null,
      nextRevisionAt: nextRevDate,
      lastStudiedAt: format(new Date(), "yyyy-MM-dd"),
      status: understood === "yes" ? "completed" : "learning",
    })

    if (needsRevision && nextRevDate) {
      addRevisionRecord({
        id: generateId("rev"),
        topicId: selectedTopic.id,
        revisedAt: format(new Date(), "yyyy-MM-dd"),
        result: understood === "yes" ? "easy" : understood === "somewhat" ? "medium" : "hard",
        previousMastery: selectedTopic.masteryLevel,
        newMastery: confidence,
        nextRevisionAt: nextRevDate,
        note: `Cleared from pending. Understanding: ${understood}`,
      })
    }

    setClearDialogOpen(false)
    setSelectedTopic(null)
  }

  const suggestedDate = useMemo(() => {
    if (!confidence) return ""
    const days = data.settings.revisionIntervals[confidence] ?? 7
    const date = new Date()
    date.setDate(date.getDate() + days)
    return format(date, "yyyy-MM-dd")
  }, [confidence, data.settings.revisionIntervals])

  const renderTopicCard = (topic: PendingTopic) => {
    const subject = getSubjectById(topic.subjectId)
    const chapter = getChapterById(topic.chapterId)
    const source = getTopicSource(topic)
    const topicDate = getTopicDate(topic)
    const daysPending = getDaysPending(topic)

    return (
      <Card key={topic.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  {subject && <SubjectBadge name={subject.name} color={subject.color} />}
                  <Badge variant="outline" className={sourceBadgeColors[source]}>
                    {source === "self-study" ? "Self-Study" : source.charAt(0).toUpperCase() + source.slice(1)}
                  </Badge>
                  <Badge variant="outline" className={priorityBadgeColors[topic.priority]}>
                    {topic.priority}
                  </Badge>
                </div>
                {chapter && (
                  <p className="text-xs text-muted-foreground">{chapter.title}</p>
                )}
                <h4 className="font-bold text-sm mt-1">{topic.title}</h4>
              </div>
              <div className="text-right text-xs shrink-0">
                {topicDate && (
                  <p className="text-muted-foreground">
                    {format(new Date(topicDate), "MMM d")}
                  </p>
                )}
                <p className="font-medium text-orange-600">{daysPending}d pending</p>
                {topic.estimatedMinutes > 0 && (
                  <p className="text-muted-foreground flex items-center gap-1 justify-end">
                    <Clock className="h-3 w-3" />
                    {topic.estimatedMinutes}m
                  </p>
                )}
              </div>
            </div>

            <p className="text-xs text-orange-600 font-medium">{topic.detectedReason}</p>

            {topic.confusionNote && (
              <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">
                {topic.confusionNote}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button size="sm" variant="default" className="text-xs h-7" onClick={() => openClearDialog(topic)}>
                <BookOpen className="h-3 w-3 mr-1" />
                Start Study
              </Button>
              <Button size="sm" variant="secondary" className="text-xs h-7" onClick={() => openClearDialog(topic)}>
                <Check className="h-3 w-3 mr-1" />
                Mark Complete
              </Button>
              <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => handleDismiss(topic)}>
                <X className="h-3 w-3 mr-1" />
                Dismiss
              </Button>
              <Button size="sm" variant="ghost" className="text-xs h-7 text-destructive hover:text-destructive" onClick={() => confirmDeleteTopic(topic)}>
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderTabContent = (tab: string) => {
    const topics = filterTopics(tab)
    if (topics.length === 0) {
      return (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          No pending topics in this category.
        </div>
      )
    }
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {topics.map(renderTopicCard)}
      </div>
    )
  }

  // Kanban columns for pending board
  const pendingKanbanColumns = useMemo((): KanbanColumn[] => {
    const newPending = pendingTopics.filter((t) => getDaysPending(t) <= 3)
    const thisWeek = pendingTopics.filter((t) => getDaysPending(t) > 3 && getDaysPending(t) <= 7)
    const urgent = pendingTopics.filter((t) => getDaysPending(t) > 14 || t.priority === "urgent" || t.priority === "high")
    const studying = pendingTopics.filter((t) => t.status === "learning")
    // Exclude topics that belong in other specific groups from "new" and "thisWeek" if urgent
    const toKanbanItem = (topic: PendingTopic): KanbanItem => {
      const subject = getSubjectById(topic.subjectId)
      return {
        id: topic.id,
        title: topic.title,
        subtitle: subject?.name,
        badges: [
          { label: topic.priority, color: priorityBadgeColors[topic.priority] || "bg-gray-100 text-gray-700" },
        ],
        metadata: { days: `${getDaysPending(topic)}d pending` },
      }
    }

    return [
      { id: "new-pending", title: "New Pending", color: "#6b7280", items: newPending.map(toKanbanItem) },
      { id: "this-week", title: "This Week", color: "#3b82f6", items: thisWeek.map(toKanbanItem) },
      { id: "urgent", title: "Urgent", color: "#ef4444", items: urgent.map(toKanbanItem) },
      { id: "studying", title: "Studying", color: "#f59e0b", items: studying.map(toKanbanItem) },
      { id: "cleared", title: "Cleared", color: "#10b981", items: [] },
    ]
  }, [pendingTopics])

  const handlePendingDragEnd = (itemId: string, _fromColumn: string, toColumn: string) => {
    const topic = pendingTopics.find((t) => t.id === itemId)
    if (!topic) return

    switch (toColumn) {
      case "cleared":
        openClearDialog(topic)
        break
      case "urgent":
        updateTopic(topic.id, { priority: "urgent" })
        break
      case "studying":
        updateTopic(topic.id, { status: "learning" })
        break
      case "new-pending":
      case "this-week": {
        const updates: Partial<Topic> = {}
        if (topic.priority === "urgent" || topic.priority === "high") {
          updates.priority = "medium"
        }
        if (topic.status === "learning") {
          updates.status = "not-started"
        }
        if (Object.keys(updates).length > 0) {
          updateTopic(topic.id, updates)
        }
        break
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pending Topics</h1>
          <p className="text-muted-foreground">
            Topics that need attention or are waiting to be studied. ({pendingTopics.length} total)
          </p>
        </div>
        <ViewToggle pageKey="pending-topics" />
      </div>

      {/* Confusion Inbox */}
      {confusionTopics.length > 0 && (
        <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <h2 className="font-bold text-red-800">Confusion Inbox ({confusionTopics.length})</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {confusionTopics.map((topic) => {
              const subject = getSubjectById(topic.subjectId)
              return (
                <Card key={`confusion-${topic.id}`} className="border-red-200">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      {subject && <SubjectBadge name={subject.name} color={subject.color} />}
                      <Badge variant="destructive" className="text-xs">Not Understood</Badge>
                    </div>
                    <h4 className="font-bold text-sm">{topic.title}</h4>
                    {topic.confusionNote && (
                      <p className="text-xs text-red-700 mt-1">{topic.confusionNote}</p>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 mt-2 border-red-300"
                      onClick={() => openClearDialog(topic)}
                    >
                      Resolve
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Board View */}
      {viewPref === "board" ? (
        <KanbanBoard columns={pendingKanbanColumns} onDragEnd={handlePendingDragEnd} />
      ) : (
      <>
      {/* Tabs for grouping */}
      <Tabs defaultValue="all">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="all">All ({pendingTopics.length})</TabsTrigger>
          <TabsTrigger value="this-week">This Week ({filterTopics("this-week").length})</TabsTrigger>
          <TabsTrigger value="older">Older ({filterTopics("older").length})</TabsTrigger>
          <TabsTrigger value="urgent">Urgent ({filterTopics("urgent").length})</TabsTrigger>
          <TabsTrigger value="college">College ({filterTopics("college").length})</TabsTrigger>
          <TabsTrigger value="tuition">Tuition ({filterTopics("tuition").length})</TabsTrigger>
          <TabsTrigger value="self-study">Self-Study ({filterTopics("self-study").length})</TabsTrigger>
          <TabsTrigger value="weak">Weak ({filterTopics("weak").length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all">{renderTabContent("all")}</TabsContent>
        <TabsContent value="this-week">{renderTabContent("this-week")}</TabsContent>
        <TabsContent value="older">{renderTabContent("older")}</TabsContent>
        <TabsContent value="urgent">{renderTabContent("urgent")}</TabsContent>
        <TabsContent value="college">{renderTabContent("college")}</TabsContent>
        <TabsContent value="tuition">{renderTabContent("tuition")}</TabsContent>
        <TabsContent value="self-study">{renderTabContent("self-study")}</TabsContent>
        <TabsContent value="weak">{renderTabContent("weak")}</TabsContent>
      </Tabs>
      </>
      )}

      {/* Clear Pending Dialog */}
      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Clear Pending Topic</DialogTitle>
            <DialogDescription>
              {selectedTopic?.title}
            </DialogDescription>
          </DialogHeader>

          {dialogStep === 1 && (
            <div className="space-y-4">
              <p className="font-medium">Did you understand this topic?</p>
              <div className="flex gap-2">
                <Button
                  variant={understood === "yes" ? "default" : "outline"}
                  onClick={() => { setUnderstood("yes"); setDialogStep(2) }}
                >
                  Yes
                </Button>
                <Button
                  variant={understood === "somewhat" ? "default" : "outline"}
                  onClick={() => { setUnderstood("somewhat"); setDialogStep(2) }}
                >
                  Somewhat
                </Button>
                <Button
                  variant={understood === "no" ? "default" : "outline"}
                  onClick={() => { setUnderstood("no"); setDialogStep(2) }}
                >
                  No
                </Button>
              </div>
            </div>
          )}

          {dialogStep === 2 && (
            <div className="space-y-4">
              <p className="font-medium">Confidence level (1-5)?</p>
              <MasteryStars value={confidence} onChange={(v) => setConfidence(v)} size="lg" />
              <Button onClick={() => setDialogStep(3)}>Next</Button>
            </div>
          )}

          {dialogStep === 3 && (
            <div className="space-y-4">
              <p className="font-medium">Do you need to revise this again?</p>
              <div className="flex gap-2">
                <Button
                  variant={needsRevision === true ? "default" : "outline"}
                  onClick={() => { setNeedsRevision(true); setDialogStep(4) }}
                >
                  Yes
                </Button>
                <Button
                  variant={needsRevision === false ? "default" : "outline"}
                  onClick={() => { setNeedsRevision(false); handleClearConfirm() }}
                >
                  No
                </Button>
              </div>
            </div>
          )}

          {dialogStep === 4 && (
            <div className="space-y-4">
              <p className="font-medium">When should we remind you?</p>
              <p className="text-xs text-muted-foreground">
                Suggested: {suggestedDate} (based on confidence level)
              </p>
              <input
                type="date"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={revisionDate || suggestedDate}
                onChange={(e) => setRevisionDate(e.target.value)}
              />
              <DialogFooter>
                <Button onClick={handleClearConfirm}>Confirm</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Topic Confirmation Dialog */}
      <Dialog open={deleteTopicDialogOpen} onOpenChange={setDeleteTopicDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Topic</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{topicToDelete?.title}&rdquo;? This will permanently remove the topic and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTopicDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTopic}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
