import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useData } from "@/context/DataContext"
import { generateId, calculateNextRevisionDate } from "@/lib/studyLogic"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { Understanding, LogStatus, StudySource } from "@/types"

interface QuickAddDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuickAddDialog({ open, onOpenChange }: QuickAddDialogProps) {
  const { data, addDailyLog, addTopic, addStudyTask, updateTopic, getSettings } = useData()
  const settings = getSettings()

  const [subjectId, setSubjectId] = useState("")
  const [chapterId, setChapterId] = useState("")
  const [topicTitle, setTopicTitle] = useState("")
  const [source, setSource] = useState<StudySource>("college")
  const [understood, setUnderstood] = useState<Understanding>("yes")
  const [status, setStatus] = useState<LogStatus>("completed")
  const [quickNote, setQuickNote] = useState("")

  const filteredChapters = data.chapters.filter((c) => c.subjectId === subjectId)
  const selectedSubject = data.subjects.find((s) => s.id === subjectId)
  const showTuition = selectedSubject?.isTuitionSubject ?? false

  const resetForm = () => {
    setSubjectId("")
    setChapterId("")
    setTopicTitle("")
    setSource("college")
    setUnderstood("yes")
    setStatus("completed")
    setQuickNote("")
  }

  const handleSave = () => {
    if (!subjectId || !chapterId || !topicTitle.trim()) return

    const todayStr = format(new Date(), "yyyy-MM-dd")
    const nowStr = new Date().toISOString()

    // Find or create topic
    let existingTopic = data.topics.find(
      (t) => t.chapterId === chapterId && t.title.toLowerCase() === topicTitle.trim().toLowerCase()
    )

    if (!existingTopic) {
      const newTopic = {
        id: generateId("top"),
        subjectId,
        chapterId,
        title: topicTitle.trim(),
        status: status === "completed" ? "completed" as const : "learning" as const,
        understanding: understood,
        masteryLevel: 0,
        priority: "medium" as const,
        collegeStatus: source === "college" ? (status === "completed" ? "completed" as const : "learning" as const) : "not-started" as const,
        tuitionStatus: source === "tuition" ? (status === "completed" ? "completed" as const : "learning" as const) : "not-started" as const,
        selfStudyStatus: source === "self-study" ? (status === "completed" ? "completed" as const : "learning" as const) : "not-started" as const,
        dateTaughtCollege: source === "college" ? todayStr : null,
        dateTaughtTuition: source === "tuition" ? todayStr : null,
        dateStudiedSelf: source === "self-study" ? todayStr : null,
        lastStudiedAt: todayStr,
        lastRevisedAt: null,
        nextRevisionAt: null,
        isPending: understood === "no",
        pendingReason: understood === "no" ? "Not understood" : null,
        confusionNote: null,
        estimatedMinutes: 30,
        actualMinutes: 0,
        tags: [],
        createdAt: nowStr,
        updatedAt: nowStr,
      }
      addTopic(newTopic)
      existingTopic = newTopic
    } else {
      // Update existing topic
      const updates: Record<string, unknown> = {
        understanding: understood,
        lastStudiedAt: todayStr,
        updatedAt: nowStr,
      }
      if (understood === "no") {
        updates.isPending = true
        updates.pendingReason = "Not understood"
      }
      if (status === "completed") {
        updates.status = "completed"
        updates.nextRevisionAt = calculateNextRevisionDate(3, settings)
      }
      updateTopic(existingTopic.id, updates)
    }

    // Create daily log
    addDailyLog({
      id: generateId("log"),
      date: todayStr,
      subjectId,
      chapterId,
      topicId: existingTopic.id,
      topicTitle: topicTitle.trim(),
      source,
      understood,
      status,
      quickNote,
      createdAt: nowStr,
    })

    // Auto-create study task if need-to-study-tonight
    if (status === "need-to-study-tonight") {
      const taskType = source === "college" ? "college-topic" : source === "tuition" ? "tuition-topic" : "self-study"
      addStudyTask({
        id: generateId("task"),
        date: todayStr,
        topicId: existingTopic.id,
        topicTitle: topicTitle.trim(),
        subjectId,
        chapterId,
        source,
        taskType,
        status: "not-started",
        priority: "high",
        estimatedMinutes: existingTopic.estimatedMinutes || 30,
        completedAt: null,
        createdAt: nowStr,
      })
    }

    resetForm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quick Add Log Entry</DialogTitle>
          <DialogDescription>Quickly log what you studied.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Subject */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Subject</label>
            <Select value={subjectId} onValueChange={(v) => { setSubjectId(v); setChapterId("") }}>
              <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
              <SelectContent>
                {data.subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Chapter */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Chapter</label>
            <Select value={chapterId} onValueChange={setChapterId} disabled={!subjectId}>
              <SelectTrigger><SelectValue placeholder="Select chapter" /></SelectTrigger>
              <SelectContent>
                {filteredChapters.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Topic */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Topic</label>
            <Input
              value={topicTitle}
              onChange={(e) => setTopicTitle(e.target.value)}
              placeholder="Enter topic title"
            />
          </div>

          {/* Source */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Source</label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={source === "college" ? "default" : "outline"}
                size="sm"
                onClick={() => setSource("college")}
              >
                College
              </Button>
              {showTuition && (
                <Button
                  type="button"
                  variant={source === "tuition" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSource("tuition")}
                >
                  Tuition
                </Button>
              )}
              <Button
                type="button"
                variant={source === "self-study" ? "default" : "outline"}
                size="sm"
                onClick={() => setSource("self-study")}
              >
                Self-Study
              </Button>
            </div>
          </div>

          {/* Understanding */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Did you understand?</label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setUnderstood("yes")}
                className={cn(understood === "yes" && "ring-2 ring-green-500 bg-green-50 dark:bg-green-950")}
              >
                Yes
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setUnderstood("somewhat")}
                className={cn(understood === "somewhat" && "ring-2 ring-yellow-500 bg-yellow-50 dark:bg-yellow-950")}
              >
                Somewhat
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setUnderstood("no")}
                className={cn(understood === "no" && "ring-2 ring-red-500 bg-red-50 dark:bg-red-950")}
              >
                No
              </Button>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Status</label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={status === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatus("completed")}
              >
                Completed
              </Button>
              <Button
                type="button"
                variant={status === "need-to-study-tonight" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatus("need-to-study-tonight")}
              >
                Study Tonight
              </Button>
              <Button
                type="button"
                variant={status === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatus("pending")}
              >
                Pending
              </Button>
            </div>
          </div>

          {/* Quick Note */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Quick Note</label>
            <Input
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
              placeholder="Optional note..."
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} className="flex-1" disabled={!subjectId || !chapterId || !topicTitle.trim()}>
            Save Log
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
