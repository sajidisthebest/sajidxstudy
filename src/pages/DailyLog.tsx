import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useData } from "@/context/DataContext"
import { generateId, calculateNextRevisionDate } from "@/lib/studyLogic"
import { MasteryStars } from "@/components/MasteryStars"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CheckCircle2, Plus } from "lucide-react"
import type { Understanding, LogStatus, StudySource, Priority } from "@/types"

export default function DailyLog() {
  const { data, addDailyLog, addTopic, addStudyTask, updateTopic, getSettings } = useData()
  const settings = getSettings()

  const [advancedMode, setAdvancedMode] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Simple fields
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [subjectId, setSubjectId] = useState("")
  const [chapterId, setChapterId] = useState("")
  const [topicTitle, setTopicTitle] = useState("")
  const [source, setSource] = useState<StudySource>("college")
  const [understood, setUnderstood] = useState<Understanding>("yes")
  const [status, setStatus] = useState<LogStatus>("completed")
  const [quickNote, setQuickNote] = useState("")

  // Advanced fields
  const [teacher, setTeacher] = useState("")
  const [pageNumber, setPageNumber] = useState("")
  const [lectureNumber, setLectureNumber] = useState("")
  const [difficulty, setDifficulty] = useState(3)
  const [priority, setPriority] = useState<Priority>("medium")
  const [estimatedMinutes, setEstimatedMinutes] = useState("")
  const [actualMinutes, setActualMinutes] = useState("")
  const [reasonPending, setReasonPending] = useState("")
  const [confusionDetails, setConfusionDetails] = useState("")
  const [resourcesNeeded, setResourcesNeeded] = useState("")
  const [assignmentDeadline, setAssignmentDeadline] = useState("")
  const [examImportance, setExamImportance] = useState(3)
  const [masteryLevel, setMasteryLevel] = useState(3)
  const [nextRevisionDate, setNextRevisionDate] = useState("")
  const [attachedLink, setAttachedLink] = useState("")
  const [tagsInput, setTagsInput] = useState("")

  const filteredChapters = useMemo(
    () => data.chapters.filter((c) => c.subjectId === subjectId),
    [data.chapters, subjectId]
  )

  const selectedSubject = data.subjects.find((s) => s.id === subjectId)
  const showTuition = selectedSubject?.isTuitionSubject ?? false

  // Existing topics for the selected chapter (for suggestions)
  const existingTopics = useMemo(
    () => data.topics.filter((t) => t.chapterId === chapterId),
    [data.topics, chapterId]
  )

  const resetForm = () => {
    setSubjectId("")
    setChapterId("")
    setTopicTitle("")
    setSource("college")
    setUnderstood("yes")
    setStatus("completed")
    setQuickNote("")
    setTeacher("")
    setPageNumber("")
    setLectureNumber("")
    setDifficulty(3)
    setPriority("medium")
    setEstimatedMinutes("")
    setActualMinutes("")
    setReasonPending("")
    setConfusionDetails("")
    setResourcesNeeded("")
    setAssignmentDeadline("")
    setExamImportance(3)
    setMasteryLevel(3)
    setNextRevisionDate("")
    setAttachedLink("")
    setTagsInput("")
  }

  const handleSave = (addAnother: boolean = false) => {
    if (!subjectId || !chapterId || !topicTitle.trim()) return

    const nowStr = new Date().toISOString()
    const tags = tagsInput ? tagsInput.split(",").map((t) => t.trim()).filter(Boolean) : []

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
        masteryLevel: status === "completed" ? masteryLevel : 0,
        priority,
        collegeStatus: source === "college" ? (status === "completed" ? "completed" as const : "learning" as const) : "not-started" as const,
        tuitionStatus: source === "tuition" ? (status === "completed" ? "completed" as const : "learning" as const) : "not-started" as const,
        selfStudyStatus: source === "self-study" ? (status === "completed" ? "completed" as const : "learning" as const) : "not-started" as const,
        dateTaughtCollege: source === "college" ? date : null,
        dateTaughtTuition: source === "tuition" ? date : null,
        dateStudiedSelf: source === "self-study" ? date : null,
        lastStudiedAt: date,
        lastRevisedAt: null,
        nextRevisionAt: status === "completed" 
          ? (nextRevisionDate || calculateNextRevisionDate(masteryLevel, settings))
          : null,
        isPending: understood === "no" || status === "pending",
        pendingReason: understood === "no" ? "Not understood" : (status === "pending" ? (reasonPending || "Pending") : null),
        confusionNote: confusionDetails || null,
        estimatedMinutes: parseInt(estimatedMinutes) || 30,
        actualMinutes: parseInt(actualMinutes) || 0,
        tags,
        createdAt: nowStr,
        updatedAt: nowStr,
      }
      addTopic(newTopic)
      existingTopic = newTopic
    } else {
      // Update existing topic
      const updates: Record<string, unknown> = {
        understanding: understood,
        lastStudiedAt: date,
        updatedAt: nowStr,
      }
      if (understood === "no") {
        updates.isPending = true
        updates.pendingReason = "Not understood"
        if (confusionDetails) updates.confusionNote = confusionDetails
      }
      if (status === "completed") {
        updates.status = "completed"
        updates.masteryLevel = masteryLevel
        updates.nextRevisionAt = nextRevisionDate || calculateNextRevisionDate(masteryLevel, settings)
      }
      if (status === "pending") {
        updates.isPending = true
        updates.pendingReason = reasonPending || "Pending"
      }
      updateTopic(existingTopic.id, updates)
    }

    // Create daily log
    const advancedData = advancedMode ? {
      teacher: teacher || undefined,
      pageNumber: pageNumber || undefined,
      lectureNumber: lectureNumber || undefined,
      difficulty,
      priority,
      estimatedMinutes: parseInt(estimatedMinutes) || undefined,
      actualMinutes: parseInt(actualMinutes) || undefined,
      reasonPending: reasonPending || undefined,
      confusionDetails: confusionDetails || undefined,
      resourcesNeeded: resourcesNeeded || undefined,
      assignmentDeadline: assignmentDeadline || undefined,
      examImportance,
      masteryLevel,
      nextRevisionDate: nextRevisionDate || undefined,
      attachedLink: attachedLink || undefined,
      tags: tags.length > 0 ? tags : undefined,
    } : undefined

    addDailyLog({
      id: generateId("log"),
      date,
      subjectId,
      chapterId,
      topicId: existingTopic.id,
      topicTitle: topicTitle.trim(),
      source,
      understood,
      status,
      quickNote,
      advancedData,
      createdAt: nowStr,
    })

    // Auto-create study task if need-to-study-tonight
    if (status === "need-to-study-tonight") {
      const taskType = source === "college" ? "college-topic" : source === "tuition" ? "tuition-topic" : "self-study"
      addStudyTask({
        id: generateId("task"),
        date,
        topicId: existingTopic.id,
        topicTitle: topicTitle.trim(),
        subjectId,
        chapterId,
        source,
        taskType,
        status: "not-started",
        priority: priority || "high",
        estimatedMinutes: parseInt(estimatedMinutes) || existingTopic.estimatedMinutes || 30,
        completedAt: null,
        createdAt: nowStr,
      })
    }

    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)

    if (addAnother) {
      setTopicTitle("")
      setQuickNote("")
      setConfusionDetails("")
    } else {
      resetForm()
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Daily Log</h1>
          <p className="text-muted-foreground">Log what you studied today.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Advanced</span>
          <Switch checked={advancedMode} onCheckedChange={setAdvancedMode} />
        </div>
      </div>

      {/* Success notification */}
      {showSuccess && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span className="text-sm text-green-800 dark:text-green-200">Log entry saved successfully!</span>
        </div>
      )}

      {/* Quick subject buttons */}
      <div className="flex flex-wrap gap-2">
        {data.subjects.map((s) => (
          <Button
            key={s.id}
            variant={subjectId === s.id ? "default" : "outline"}
            size="sm"
            onClick={() => { setSubjectId(s.id); setChapterId("") }}
            className="text-xs"
          >
            {s.name}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {advancedMode ? "Advanced Log Entry" : "Simple Log Entry"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Date</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

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
              placeholder="Enter topic title or select existing"
              list="topic-suggestions"
            />
            {existingTopics.length > 0 && (
              <datalist id="topic-suggestions">
                {existingTopics.map((t) => (
                  <option key={t.id} value={t.title} />
                ))}
              </datalist>
            )}
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
                Need to Study Tonight
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
            <textarea
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
              placeholder="Any notes about this session..."
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          {/* Advanced fields */}
          {advancedMode && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-semibold text-muted-foreground">Advanced Details</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Teacher / Class</label>
                  <Input value={teacher} onChange={(e) => setTeacher(e.target.value)} placeholder="Teacher name" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Page Number</label>
                  <Input value={pageNumber} onChange={(e) => setPageNumber(e.target.value)} placeholder="e.g. 45-52" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Lecture Number</label>
                  <Input value={lectureNumber} onChange={(e) => setLectureNumber(e.target.value)} placeholder="e.g. Lecture 5" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Difficulty (1-5)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={difficulty}
                      onChange={(e) => setDifficulty(parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-4">{difficulty}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Priority</label>
                <div className="flex gap-2">
                  {(["low", "medium", "high", "urgent"] as Priority[]).map((p) => (
                    <Button
                      key={p}
                      type="button"
                      variant={priority === p ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPriority(p)}
                      className="capitalize"
                    >
                      {p}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Estimated Time (min)</label>
                  <Input type="number" value={estimatedMinutes} onChange={(e) => setEstimatedMinutes(e.target.value)} placeholder="30" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Actual Time (min)</label>
                  <Input type="number" value={actualMinutes} onChange={(e) => setActualMinutes(e.target.value)} placeholder="25" />
                </div>
              </div>

              {(status === "pending" || understood === "no") && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Reason Pending</label>
                    <Select value={reasonPending} onValueChange={setReasonPending}>
                      <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Not understood">Not understood</SelectItem>
                        <SelectItem value="No time">No time to study</SelectItem>
                        <SelectItem value="Need resources">Need more resources</SelectItem>
                        <SelectItem value="Too difficult">Too difficult</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Confusion Details</label>
                    <textarea
                      value={confusionDetails}
                      onChange={(e) => setConfusionDetails(e.target.value)}
                      placeholder="What specifically confused you?"
                      className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Resources Needed</label>
                <Input value={resourcesNeeded} onChange={(e) => setResourcesNeeded(e.target.value)} placeholder="Books, videos, etc." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Assignment Deadline</label>
                  <Input type="date" value={assignmentDeadline} onChange={(e) => setAssignmentDeadline(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Exam Importance (1-5)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={examImportance}
                      onChange={(e) => setExamImportance(parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-4">{examImportance}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Mastery Level</label>
                <MasteryStars value={masteryLevel} onChange={setMasteryLevel} />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Next Revision Date</label>
                <Input type="date" value={nextRevisionDate} onChange={(e) => setNextRevisionDate(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Attach Link</label>
                <Input value={attachedLink} onChange={(e) => setAttachedLink(e.target.value)} placeholder="https://..." />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Tags (comma separated)</label>
                <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="math, formulas, important" />
              </div>
            </div>
          )}

          {/* Save buttons */}
          <div className="flex flex-col gap-2 pt-4">
            <Button
              onClick={() => handleSave(false)}
              className="w-full"
              size="lg"
              disabled={!subjectId || !chapterId || !topicTitle.trim()}
            >
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Save Log
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleSave(true)}
              className="w-full"
              disabled={!subjectId || !chapterId || !topicTitle.trim()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Save & Add Another
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent logs for today */}
      {data.dailyLogs.filter((l) => l.date === date).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Logs for {date}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.dailyLogs.filter((l) => l.date === date).map((log) => {
              const subject = data.subjects.find((s) => s.id === log.subjectId)
              return (
                <div key={log.id} className="flex items-center gap-2 p-2 rounded border text-sm">
                  <Badge variant="outline" className="text-xs">{subject?.name}</Badge>
                  <span className="flex-1 truncate">{log.topicTitle}</span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs",
                      log.status === "completed" && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                      log.status === "need-to-study-tonight" && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
                      log.status === "pending" && "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    )}
                  >
                    {log.status === "need-to-study-tonight" ? "Tonight" : log.status}
                  </Badge>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
