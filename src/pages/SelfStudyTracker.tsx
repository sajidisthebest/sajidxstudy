import { useState, useMemo } from "react"
import { format } from "date-fns"
import {
  Plus,
  BookOpen,
  Calendar,
  Target,
  CheckCircle2,
  ExternalLink,
  Trash2,
  CheckSquare,
} from "lucide-react"
import { useData } from "@/context/DataContext"
import { generateId } from "@/lib/studyLogic"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SubjectBadge } from "@/components/SubjectBadge"
import { Checkbox } from "@/components/ui/checkbox"
import { SelectionToolbar } from "@/components/SelectionToolbar"
import { cn } from "@/lib/utils"
import type { Topic } from "@/types"

interface SelfStudyPlan {
  id: string
  subjectId: string
  chapterId: string
  goal: string
  startDate: string
  targetDate: string
  topicIds: string[]
  notes: string
  resources: string[]
  createdAt: string
}

export default function SelfStudyTracker() {
  const {
    getSubjects,
    getChapters,
    getTopics,
    updateTopic,
  } = useData()

  const subjects = getSubjects()
  const allChapters = getChapters()
  const allTopics = getTopics()

  // Self-study plans stored in component state backed by localStorage
  const [plans, setPlans] = useState<SelfStudyPlan[]>(() => {
    const stored = localStorage.getItem("self-study-plans")
    return stored ? JSON.parse(stored) : []
  })

  const [selectedTopicIds, setSelectedTopicIds] = useState<Set<string>>(new Set())

  function savePlans(newPlans: SelfStudyPlan[]) {
    setPlans(newPlans)
    localStorage.setItem("self-study-plans", JSON.stringify(newPlans))
  }

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [planSubjectId, setPlanSubjectId] = useState("")
  const [planChapterId, setPlanChapterId] = useState("")
  const [planGoal, setPlanGoal] = useState("")
  const [planTargetDate, setPlanTargetDate] = useState("")
  const [planNotes, setPlanNotes] = useState("")
  const [planResource, setPlanResource] = useState("")
  const [planResources, setPlanResources] = useState<string[]>([])

  const chaptersForSubject = useMemo(() => {
    if (!planSubjectId) return []
    return allChapters.filter((c) => c.subjectId === planSubjectId)
  }, [planSubjectId, allChapters])

  // Self-study topics overall
  const selfStudyTopics = useMemo(() => {
    return allTopics.filter(
      (t) => t.selfStudyStatus !== "not-started" || t.dateStudiedSelf !== null
    )
  }, [allTopics])

  function openCreatePlan() {
    setPlanSubjectId("")
    setPlanChapterId("")
    setPlanGoal("")
    setPlanTargetDate("")
    setPlanNotes("")
    setPlanResources([])
    setPlanResource("")
    setDialogOpen(true)
  }

  function addResource() {
    if (planResource.trim()) {
      setPlanResources([...planResources, planResource.trim()])
      setPlanResource("")
    }
  }

  function removeResource(index: number) {
    setPlanResources(planResources.filter((_, i) => i !== index))
  }

  function createPlan() {
    if (!planSubjectId || !planChapterId || !planGoal.trim()) return
    const topics = allTopics.filter((t) => t.chapterId === planChapterId)
    const newPlan: SelfStudyPlan = {
      id: generateId("plan"),
      subjectId: planSubjectId,
      chapterId: planChapterId,
      goal: planGoal.trim(),
      startDate: format(new Date(), "yyyy-MM-dd"),
      targetDate: planTargetDate || format(new Date(Date.now() + 604800000), "yyyy-MM-dd"),
      topicIds: topics.map((t) => t.id),
      notes: planNotes,
      resources: planResources,
      createdAt: new Date().toISOString(),
    }
    savePlans([...plans, newPlan])
    setDialogOpen(false)
  }

  function deletePlan(planId: string) {
    savePlans(plans.filter((p) => p.id !== planId))
  }

  function toggleTopicComplete(topicId: string, topic: Topic) {
    const now = new Date().toISOString()
    const newStatus = topic.selfStudyStatus === "completed" ? "not-started" : "completed"
    updateTopic(topicId, {
      selfStudyStatus: newStatus,
      dateStudiedSelf: newStatus === "completed" ? format(new Date(), "yyyy-MM-dd") : null,
      updatedAt: now,
    })
  }

  // Selection helpers for Recent Self-Study Activity section
  function toggleSelectTopic(id: string) {
    setSelectedTopicIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAllTopics() {
    const visibleIds = selfStudyTopics.slice(0, 10).map((t) => t.id)
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedTopicIds.has(id))
    if (allSelected) {
      setSelectedTopicIds(new Set())
    } else {
      setSelectedTopicIds(new Set(visibleIds))
    }
  }

  function handleBulkComplete() {
    const now = new Date().toISOString()
    selectedTopicIds.forEach((id) =>
      updateTopic(id, {
        selfStudyStatus: "completed",
        dateStudiedSelf: format(new Date(), "yyyy-MM-dd"),
        updatedAt: now,
      })
    )
    setSelectedTopicIds(new Set())
  }

  function handleBulkReset() {
    const now = new Date().toISOString()
    selectedTopicIds.forEach((id) =>
      updateTopic(id, {
        selfStudyStatus: "not-started",
        dateStudiedSelf: null,
        updatedAt: now,
      })
    )
    setSelectedTopicIds(new Set())
  }

  function getSubject(id: string) {
    return subjects.find((s) => s.id === id)
  }

  function getChapter(id: string) {
    return allChapters.find((c) => c.id === id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Self-Study Tracker
          </h1>
          <p className="text-muted-foreground">
            Plan and track your independent study sessions.
          </p>
        </div>
        <Button onClick={openCreatePlan}>
          <Plus className="mr-2 h-4 w-4" /> Create Study Plan
        </Button>
      </div>

      {/* Active Plans */}
      {plans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Study Plans Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create a self-study plan to track your independent learning.
            </p>
            <Button onClick={openCreatePlan}>
              <Plus className="mr-2 h-4 w-4" /> Create Your First Plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((plan) => {
            const subject = getSubject(plan.subjectId)
            const chapter = getChapter(plan.chapterId)
            const topics = allTopics.filter((t) =>
              plan.topicIds.includes(t.id)
            )
            const completedTopics = topics.filter(
              (t) => t.selfStudyStatus === "completed"
            )
            const progressPct =
              topics.length > 0
                ? Math.round((completedTopics.length / topics.length) * 100)
                : 0
            const isOverdue = plan.targetDate < format(new Date(), "yyyy-MM-dd")

            return (
              <Card key={plan.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      {subject && (
                        <SubjectBadge
                          name={subject.name}
                          color={subject.color}
                        />
                      )}
                      <CardTitle className="text-base mt-1">
                        {chapter?.title}
                      </CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deletePlan(plan.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Goal */}
                  <div className="flex items-start gap-2">
                    <Target className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="text-sm">{plan.goal}</span>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Start: {format(new Date(plan.startDate), "MMM d")}
                    </span>
                    <span
                      className={cn(
                        "flex items-center gap-1",
                        isOverdue && "text-red-500"
                      )}
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      Target: {format(new Date(plan.targetDate), "MMM d")}
                      {isOverdue && " (Overdue)"}
                    </span>
                  </div>

                  {/* Progress */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">
                        {completedTopics.length}/{topics.length} topics (
                        {progressPct}%)
                      </span>
                    </div>
                    <Progress value={progressPct} className="h-2" />
                  </div>

                  {/* Topics checklist */}
                  <div className="space-y-1">
                    {topics.map((topic) => (
                      <label
                        key={topic.id}
                        className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={topic.selfStudyStatus === "completed"}
                          onChange={() => toggleTopicComplete(topic.id, topic)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <span
                          className={cn(
                            "text-sm",
                            topic.selfStudyStatus === "completed" &&
                              "line-through text-muted-foreground"
                          )}
                        >
                          {topic.title}
                        </span>
                        {topic.selfStudyStatus === "completed" && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 ml-auto" />
                        )}
                      </label>
                    ))}
                    {topics.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        No topics in this chapter yet.
                      </p>
                    )}
                  </div>

                  {/* Notes */}
                  {plan.notes && (
                    <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                      {plan.notes}
                    </div>
                  )}

                  {/* Resources */}
                  {plan.resources.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        Resources:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {plan.resources.map((r, i) => (
                          <a
                            key={i}
                            href={r.startsWith("http") ? r : `https://${r}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {r.length > 30 ? r.slice(0, 30) + "..." : r}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Practice status */}
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs",
                        progressPct >= 100
                          ? "bg-green-100 text-green-700"
                          : progressPct >= 50
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      )}
                    >
                      {progressPct >= 100
                        ? "Completed"
                        : progressPct >= 50
                        ? "In Progress"
                        : "Just Started"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Self-study activity summary */}
      {selfStudyTopics.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Self-Study Activity</CardTitle>
              <Button variant="outline" size="sm" onClick={toggleSelectAllTopics} className="h-7 text-xs">
                <CheckSquare className="h-3.5 w-3.5 mr-1" />
                {selfStudyTopics.slice(0, 10).every((t) => selectedTopicIds.has(t.id))
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selfStudyTopics.slice(0, 10).map((topic) => {
                const subject = getSubject(topic.subjectId)
                return (
                  <div
                    key={topic.id}
                    className="flex items-center gap-3 p-2 rounded hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={selectedTopicIds.has(topic.id)}
                      onCheckedChange={() => toggleSelectTopic(topic.id)}
                    />
                    {subject && (
                      <SubjectBadge
                        name={subject.name}
                        color={subject.color}
                      />
                    )}
                    <span className="text-sm font-medium flex-1">
                      {topic.title}
                    </span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs",
                        topic.selfStudyStatus === "completed"
                          ? "bg-green-100 text-green-700"
                          : topic.selfStudyStatus === "learning"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      )}
                    >
                      {topic.selfStudyStatus}
                    </Badge>
                    {topic.dateStudiedSelf && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(topic.dateStudiedSelf), "MMM d")}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selection Toolbar */}
      <SelectionToolbar
        selectedCount={selectedTopicIds.size}
        onClearSelection={() => setSelectedTopicIds(new Set())}
      >
        <Button variant="outline" size="sm" onClick={handleBulkComplete}>
          Mark Completed
        </Button>
        <Button variant="outline" size="sm" onClick={handleBulkReset}>
          Reset to Not Started
        </Button>
      </SelectionToolbar>

      {/* Create Plan Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Self-Study Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Select value={planSubjectId} onValueChange={setPlanSubjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Chapter</label>
              <Select value={planChapterId} onValueChange={setPlanChapterId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select chapter" />
                </SelectTrigger>
                <SelectContent>
                  {chaptersForSubject.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Goal</label>
              <Input
                value={planGoal}
                onChange={(e) => setPlanGoal(e.target.value)}
                placeholder="What do you want to achieve?"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Target Date</label>
              <Input
                type="date"
                value={planTargetDate}
                onChange={(e) => setPlanTargetDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Input
                value={planNotes}
                onChange={(e) => setPlanNotes(e.target.value)}
                placeholder="Additional notes..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Resources</label>
              <div className="flex gap-2">
                <Input
                  value={planResource}
                  onChange={(e) => setPlanResource(e.target.value)}
                  placeholder="Add a link or resource"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addResource())}
                />
                <Button type="button" variant="outline" size="sm" onClick={addResource}>
                  Add
                </Button>
              </div>
              {planResources.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {planResources.map((r, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="text-xs cursor-pointer"
                      onClick={() => removeResource(i)}
                    >
                      {r.length > 25 ? r.slice(0, 25) + "..." : r} x
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createPlan}>Create Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
