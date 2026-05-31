import { useState, useMemo } from "react"
import { format } from "date-fns"
import {
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Clock,
  AlertCircle,
  CheckSquare,
} from "lucide-react"
import { useData } from "@/context/DataContext"
import { generateId } from "@/lib/studyLogic"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MasteryStars } from "@/components/MasteryStars"
import { Checkbox } from "@/components/ui/checkbox"
import { SelectionToolbar } from "@/components/SelectionToolbar"
import { cn } from "@/lib/utils"
import type { Subject, Chapter, Topic, ChapterStatus, TopicStatus } from "@/types"

const PRESET_COLORS = [
  "emerald",
  "lime",
  "sky",
  "cyan",
  "blue",
  "violet",
  "pink",
  "purple",
  "amber",
]

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

const chapterStatusColors: Record<ChapterStatus, string> = {
  "not-started": "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  learning: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  "partially-done": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  "needs-revision": "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  weak: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
}

const chapterStatusLabels: Record<ChapterStatus, string> = {
  "not-started": "Not Started",
  learning: "Learning",
  "partially-done": "Partially Done",
  completed: "Completed",
  "needs-revision": "Needs Revision",
  weak: "Weak",
}

const topicStatusColors: Record<TopicStatus, string> = {
  "not-started": "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  learning: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  pending: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  "needs-revision": "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
}

export default function SubjectsChapters() {
  const {
    getSubjects,
    getChapters,
    getTopics,
    addSubject,
    updateSubject,
    deleteSubject,
    addChapter,
    updateChapter,
    deleteChapter,
    addTopic,
    updateTopic,
    deleteTopic,
  } = useData()

  const subjects = getSubjects()
  const allChapters = getChapters()
  const allTopics = getTopics()

  const [expandedSubject, setExpandedSubject] = useState<string | null>(null)
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null)
  const [selectedTopicIds, setSelectedTopicIds] = useState<Set<string>>(new Set())
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false)

  // Subject dialog state
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [subjectName, setSubjectName] = useState("")
  const [subjectColor, setSubjectColor] = useState("emerald")
  const [subjectIsTuition, setSubjectIsTuition] = useState(false)

  // Chapter dialog state
  const [chapterDialogOpen, setChapterDialogOpen] = useState(false)
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null)
  const [chapterTitle, setChapterTitle] = useState("")
  const [chapterSubjectId, setChapterSubjectId] = useState("")

  // Topic dialog state
  const [topicDialogOpen, setTopicDialogOpen] = useState(false)
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null)
  const [topicTitle, setTopicTitle] = useState("")
  const [topicChapterId, setTopicChapterId] = useState("")

  // Delete topic confirmation state
  const [deleteTopicDialogOpen, setDeleteTopicDialogOpen] = useState(false)
  const [topicToDelete, setTopicToDelete] = useState<Topic | null>(null)

  // Subject stats
  const subjectStats = useMemo(() => {
    const stats: Record<
      string,
      {
        totalChapters: number
        completedChapters: number
        completionPct: number
        avgMastery: number
        dueRevisions: number
        pendingTopics: number
      }
    > = {}
    for (const subject of subjects) {
      const chapters = allChapters.filter((c) => c.subjectId === subject.id)
      const topics = allTopics.filter((t) => t.subjectId === subject.id)
      const completedChapters = chapters.filter((c) => c.status === "completed").length
      const avgMastery =
        chapters.length > 0
          ? Math.round(
              chapters.reduce((sum, c) => sum + c.masteryLevel, 0) / chapters.length
            )
          : 0
      const today = format(new Date(), "yyyy-MM-dd")
      const dueRevisions = topics.filter(
        (t) => t.nextRevisionAt && t.nextRevisionAt <= today && t.status !== "completed"
      ).length
      const pendingTopics = topics.filter((t) => t.isPending).length
      const totalCompletion =
        chapters.length > 0
          ? Math.round(
              chapters.reduce((sum, c) => sum + c.completionPercentage, 0) / chapters.length
            )
          : 0

      stats[subject.id] = {
        totalChapters: chapters.length,
        completedChapters,
        completionPct: totalCompletion,
        avgMastery,
        dueRevisions,
        pendingTopics,
      }
    }
    return stats
  }, [subjects, allChapters, allTopics])

  // Subject CRUD
  function openAddSubject() {
    setEditingSubject(null)
    setSubjectName("")
    setSubjectColor("emerald")
    setSubjectIsTuition(false)
    setSubjectDialogOpen(true)
  }

  function openEditSubject(subject: Subject) {
    setEditingSubject(subject)
    setSubjectName(subject.name)
    setSubjectColor(subject.color)
    setSubjectIsTuition(subject.isTuitionSubject)
    setSubjectDialogOpen(true)
  }

  function saveSubject() {
    if (!subjectName.trim()) return
    if (editingSubject) {
      updateSubject(editingSubject.id, {
        name: subjectName.trim(),
        color: subjectColor,
        isTuitionSubject: subjectIsTuition,
      })
    } else {
      const newSubject: Subject = {
        id: generateId("sub"),
        name: subjectName.trim(),
        color: subjectColor,
        category: "commerce",
        isTuitionSubject: subjectIsTuition,
        createdAt: new Date().toISOString(),
      }
      addSubject(newSubject)
    }
    setSubjectDialogOpen(false)
  }

  function handleDeleteSubject(id: string) {
    deleteSubject(id)
    if (expandedSubject === id) setExpandedSubject(null)
  }

  // Chapter CRUD
  function openAddChapter(subjectId: string) {
    setEditingChapter(null)
    setChapterTitle("")
    setChapterSubjectId(subjectId)
    setChapterDialogOpen(true)
  }

  function openEditChapter(chapter: Chapter) {
    setEditingChapter(chapter)
    setChapterTitle(chapter.title)
    setChapterSubjectId(chapter.subjectId)
    setChapterDialogOpen(true)
  }

  function saveChapter() {
    if (!chapterTitle.trim()) return
    const now = new Date().toISOString()
    if (editingChapter) {
      updateChapter(editingChapter.id, { title: chapterTitle.trim(), updatedAt: now })
    } else {
      const newChapter: Chapter = {
        id: generateId("ch"),
        subjectId: chapterSubjectId,
        title: chapterTitle.trim(),
        status: "not-started",
        completionPercentage: 0,
        masteryLevel: 0,
        lastStudiedAt: null,
        nextRevisionAt: null,
        createdAt: now,
        updatedAt: now,
      }
      addChapter(newChapter)
    }
    setChapterDialogOpen(false)
  }

  function handleDeleteChapter(id: string) {
    deleteChapter(id)
    if (expandedChapter === id) setExpandedChapter(null)
  }

  function handleChapterStatusChange(chapterId: string, newStatus: ChapterStatus) {
    const now = new Date().toISOString()
    updateChapter(chapterId, { status: newStatus, updatedAt: now })
  }

  // Topic CRUD
  function openAddTopic(chapterId: string) {
    setEditingTopic(null)
    setTopicTitle("")
    setTopicChapterId(chapterId)
    setTopicDialogOpen(true)
  }

  function openEditTopic(topic: Topic) {
    setEditingTopic(topic)
    setTopicTitle(topic.title)
    setTopicChapterId(topic.chapterId)
    setTopicDialogOpen(true)
  }

  function saveTopic() {
    if (!topicTitle.trim()) return
    const now = new Date().toISOString()
    if (editingTopic) {
      updateTopic(editingTopic.id, { title: topicTitle.trim(), updatedAt: now })
    } else {
      const chapter = allChapters.find((c) => c.id === topicChapterId)
      const newTopic: Topic = {
        id: generateId("top"),
        subjectId: chapter?.subjectId ?? "",
        chapterId: topicChapterId,
        title: topicTitle.trim(),
        status: "not-started",
        understanding: null,
        masteryLevel: 0,
        priority: "medium",
        collegeStatus: "not-started",
        tuitionStatus: "not-started",
        selfStudyStatus: "not-started",
        dateTaughtCollege: null,
        dateTaughtTuition: null,
        dateStudiedSelf: null,
        lastStudiedAt: null,
        lastRevisedAt: null,
        nextRevisionAt: null,
        isPending: false,
        pendingReason: null,
        confusionNote: null,
        estimatedMinutes: 30,
        actualMinutes: 0,
        tags: [],
        createdAt: now,
        updatedAt: now,
      }
      addTopic(newTopic)
    }
    setTopicDialogOpen(false)
  }

  function confirmDeleteTopic(topic: Topic) {
    setTopicToDelete(topic)
    setDeleteTopicDialogOpen(true)
  }

  function handleDeleteTopic() {
    if (topicToDelete) {
      deleteTopic(topicToDelete.id)
      setDeleteTopicDialogOpen(false)
      setTopicToDelete(null)
    }
  }

  // Selection helpers
  function toggleSelectTopic(id: string) {
    setSelectedTopicIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAllVisibleTopics() {
    // Select all topics in expanded chapters
    const visibleTopicIds: string[] = []
    if (expandedSubject) {
      const chapters = allChapters.filter((c) => c.subjectId === expandedSubject)
      for (const chapter of chapters) {
        if (expandedChapter === chapter.id) {
          const topics = allTopics.filter((t) => t.chapterId === chapter.id)
          visibleTopicIds.push(...topics.map((t) => t.id))
        }
      }
    }
    const allSelected = visibleTopicIds.length > 0 && visibleTopicIds.every((id) => selectedTopicIds.has(id))
    if (allSelected) {
      setSelectedTopicIds(new Set())
    } else {
      setSelectedTopicIds(new Set(visibleTopicIds))
    }
  }

  function handleBulkDeleteTopics() {
    selectedTopicIds.forEach((id) => deleteTopic(id))
    setSelectedTopicIds(new Set())
    setBulkDeleteConfirmOpen(false)
  }

  function handleBulkCompleteTopics() {
    selectedTopicIds.forEach((id) => updateTopic(id, { status: "completed" }))
    setSelectedTopicIds(new Set())
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subjects & Chapters</h1>
          <p className="text-muted-foreground">
            Manage your subjects, chapters, and topics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {expandedChapter && (
            <Button variant="outline" size="sm" onClick={selectAllVisibleTopics}>
              <CheckSquare className="mr-1 h-4 w-4" /> Select All Topics
            </Button>
          )}
          <Button onClick={openAddSubject}>
            <Plus className="mr-2 h-4 w-4" /> Add Subject
          </Button>
        </div>
      </div>

      {/* Subjects List */}
      <div className="space-y-3">
        {subjects.map((subject) => {
          const stats = subjectStats[subject.id]
          const isExpanded = expandedSubject === subject.id
          const chapters = allChapters.filter((c) => c.subjectId === subject.id)

          return (
            <Card key={subject.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div
                    className="flex items-center gap-3 cursor-pointer flex-1"
                    onClick={() =>
                      setExpandedSubject(isExpanded ? null : subject.id)
                    }
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span
                      className={cn(
                        "h-3 w-3 rounded-full",
                        dotColorMap[subject.color] ?? "bg-gray-500"
                      )}
                    />
                    <CardTitle className="text-lg">{subject.name}</CardTitle>
                    {subject.isTuitionSubject && (
                      <Badge variant="secondary" className="text-xs">
                        Tuition
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditSubject(subject)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSubject(subject.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {/* Stats row */}
                <div className="ml-11 grid grid-cols-2 md:grid-cols-5 gap-3 mt-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Chapters:</span>{" "}
                    <span className="font-medium">
                      {stats?.completedChapters}/{stats?.totalChapters}
                    </span>
                  </div>
                  <div className="text-sm flex items-center gap-2">
                    <span className="text-muted-foreground">Progress:</span>
                    <Progress
                      value={stats?.completionPct ?? 0}
                      className="h-2 w-20"
                    />
                    <span className="text-xs font-medium">
                      {stats?.completionPct}%
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Mastery:</span>{" "}
                    <MasteryStars
                      value={stats?.avgMastery ?? 0}
                      size="sm"
                      className="inline-flex"
                    />
                  </div>
                  <div className="text-sm flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-orange-500" />
                    <span className="text-muted-foreground">Due:</span>{" "}
                    <span className="font-medium">{stats?.dueRevisions}</span>
                  </div>
                  <div className="text-sm flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5 text-yellow-500" />
                    <span className="text-muted-foreground">Pending:</span>{" "}
                    <span className="font-medium">{stats?.pendingTopics}</span>
                  </div>
                </div>
              </CardHeader>

              {/* Expanded: Chapters */}
              {isExpanded && (
                <CardContent className="pt-0">
                  <div className="ml-6 space-y-2 border-l-2 border-muted pl-4">
                    {chapters.map((chapter) => {
                      const isChapterExpanded = expandedChapter === chapter.id
                      const topics = allTopics.filter(
                        (t) => t.chapterId === chapter.id
                      )

                      return (
                        <div key={chapter.id} className="space-y-1">
                          <div className="flex items-center gap-2 py-2">
                            <div
                              className="flex items-center gap-2 cursor-pointer flex-1"
                              onClick={() =>
                                setExpandedChapter(
                                  isChapterExpanded ? null : chapter.id
                                )
                              }
                            >
                              {isChapterExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                              <BookOpen className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium text-sm">
                                {chapter.title}
                              </span>
                            </div>
                            <Badge
                              className={cn(
                                "text-xs",
                                chapterStatusColors[chapter.status]
                              )}
                            >
                              {chapterStatusLabels[chapter.status]}
                            </Badge>
                            <Select
                              value={chapter.status}
                              onValueChange={(v) =>
                                handleChapterStatusChange(
                                  chapter.id,
                                  v as ChapterStatus
                                )
                              }
                            >
                              <SelectTrigger className="h-7 w-[130px] text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(chapterStatusLabels).map(
                                  ([val, label]) => (
                                    <SelectItem key={val} value={val}>
                                      {label}
                                    </SelectItem>
                                  )
                                )}
                              </SelectContent>
                            </Select>
                            <div className="flex items-center gap-1">
                              <Progress
                                value={chapter.completionPercentage}
                                className="h-2 w-16"
                              />
                              <span className="text-xs text-muted-foreground">
                                {chapter.completionPercentage}%
                              </span>
                            </div>
                            <MasteryStars
                              value={chapter.masteryLevel}
                              size="sm"
                            />
                            <span className="text-xs text-muted-foreground">
                              {topics.length} topics
                            </span>
                            {chapter.lastStudiedAt && (
                              <span className="text-xs text-muted-foreground">
                                Last:{" "}
                                {format(
                                  new Date(chapter.lastStudiedAt),
                                  "MMM d"
                                )}
                              </span>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => openEditChapter(chapter)}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleDeleteChapter(chapter.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>

                          {/* Expanded: Topics */}
                          {isChapterExpanded && (
                            <div className="ml-6 space-y-1 border-l border-muted pl-3 pb-2">
                              {topics.map((topic) => (
                                <div
                                  key={topic.id}
                                  className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50"
                                >
                                  <Checkbox
                                    checked={selectedTopicIds.has(topic.id)}
                                    onCheckedChange={() => toggleSelectTopic(topic.id)}
                                  />
                                  <span className="text-sm flex-1">
                                    {topic.title}
                                  </span>
                                  <Badge
                                    className={cn(
                                      "text-xs",
                                      topicStatusColors[topic.status]
                                    )}
                                  >
                                    {topic.status}
                                  </Badge>
                                  {topic.understanding && (
                                    <span
                                      className={cn(
                                        "text-xs px-1.5 py-0.5 rounded",
                                        topic.understanding === "yes"
                                          ? "bg-green-100 text-green-700"
                                          : topic.understanding === "somewhat"
                                          ? "bg-yellow-100 text-yellow-700"
                                          : "bg-red-100 text-red-700"
                                      )}
                                    >
                                      {topic.understanding === "yes"
                                        ? "Understood"
                                        : topic.understanding === "somewhat"
                                        ? "Partial"
                                        : "Not Understood"}
                                    </span>
                                  )}
                                  <MasteryStars
                                    value={topic.masteryLevel}
                                    size="sm"
                                  />
                                  {topic.isPending && (
                                    <Badge variant="destructive" className="text-xs">
                                      Pending
                                    </Badge>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => openEditTopic(topic)}
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => confirmDeleteTopic(topic)}
                                  >
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-1"
                                onClick={() => openAddTopic(chapter.id)}
                              >
                                <Plus className="mr-1 h-3 w-3" /> Add Topic
                              </Button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openAddChapter(subject.id)}
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" /> Add Chapter
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {/* Selection Toolbar */}
      <SelectionToolbar
        selectedCount={selectedTopicIds.size}
        onClearSelection={() => setSelectedTopicIds(new Set())}
      >
        <Button variant="outline" size="sm" onClick={handleBulkCompleteTopics}>
          Mark Completed
        </Button>
        <Button variant="destructive" size="sm" onClick={() => setBulkDeleteConfirmOpen(true)}>
          Delete Selected
        </Button>
      </SelectionToolbar>

      {/* Subject Dialog */}
      <Dialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSubject ? "Edit Subject" : "Add Subject"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="Subject name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Color</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSubjectColor(color)}
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition-all",
                      dotColorMap[color],
                      subjectColor === color
                        ? "border-foreground scale-110"
                        : "border-transparent"
                    )}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={subjectIsTuition}
                onCheckedChange={setSubjectIsTuition}
              />
              <label className="text-sm font-medium">Tuition Subject</label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSubjectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={saveSubject}>
              {editingSubject ? "Save Changes" : "Add Subject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chapter Dialog */}
      <Dialog open={chapterDialogOpen} onOpenChange={setChapterDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingChapter ? "Edit Chapter" : "Add Chapter"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={chapterTitle}
                onChange={(e) => setChapterTitle(e.target.value)}
                placeholder="Chapter title"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setChapterDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={saveChapter}>
              {editingChapter ? "Save Changes" : "Add Chapter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Topic Dialog */}
      <Dialog open={topicDialogOpen} onOpenChange={setTopicDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTopic ? "Edit Topic" : "Add Topic"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={topicTitle}
                onChange={(e) => setTopicTitle(e.target.value)}
                placeholder="Topic title"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTopicDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={saveTopic}>
              {editingTopic ? "Save Changes" : "Add Topic"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Topic Confirmation Dialog */}
      <Dialog open={deleteTopicDialogOpen} onOpenChange={setDeleteTopicDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Topic</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{topicToDelete?.title}&rdquo;? This action cannot be undone.
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

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteConfirmOpen} onOpenChange={setBulkDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedTopicIds.size} Topic{selectedTopicIds.size !== 1 ? "s" : ""}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedTopicIds.size} selected topic{selectedTopicIds.size !== 1 ? "s" : ""}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkDeleteTopics}>
              Delete {selectedTopicIds.size} Topic{selectedTopicIds.size !== 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
