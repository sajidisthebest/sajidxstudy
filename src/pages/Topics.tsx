import { useState, useMemo } from "react"
import { useData } from "@/context/DataContext"
import type { TopicStatus } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Trash2, Search, FileText, SlidersHorizontal } from "lucide-react"
import { MasteryStars } from "@/components/MasteryStars"

const STATUS_OPTIONS: { value: TopicStatus | "all"; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "not-started", label: "Not Started" },
  { value: "learning", label: "Learning" },
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "needs-revision", label: "Needs Revision" },
]

const SORT_OPTIONS = [
  { value: "name", label: "By Name" },
  { value: "subject", label: "By Subject" },
  { value: "status", label: "By Status" },
  { value: "date", label: "By Date Created" },
]

const STATUS_COLORS: Record<TopicStatus, string> = {
  "not-started": "bg-gray-100 text-gray-800 dark:bg-gray-800/40 dark:text-gray-300",
  learning: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  pending: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  "needs-revision": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  low: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
}

export default function Topics() {
  const { getTopics, deleteTopic, getSubjects, getChapters } = useData()
  const topics = getTopics()
  const subjects = getSubjects()
  const chapters = getChapters()

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<TopicStatus | "all">("all")
  const [subjectFilter, setSubjectFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState("name")
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const filteredAndSortedTopics = useMemo(() => {
    let result = [...topics]

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          subjects.find((s) => s.id === t.subjectId)?.name.toLowerCase().includes(q) ||
          chapters.find((c) => c.id === t.chapterId)?.title.toLowerCase().includes(q)
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter)
    }

    // Subject filter
    if (subjectFilter !== "all") {
      result = result.filter((t) => t.subjectId === subjectFilter)
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.title.localeCompare(b.title)
        case "subject": {
          const subA = subjects.find((s) => s.id === a.subjectId)?.name ?? ""
          const subB = subjects.find((s) => s.id === b.subjectId)?.name ?? ""
          return subA.localeCompare(subB)
        }
        case "status":
          return a.status.localeCompare(b.status)
        case "date":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        default:
          return 0
      }
    })

    return result
  }, [topics, searchQuery, statusFilter, subjectFilter, sortBy, subjects, chapters])

  const handleDelete = (topicId: string) => {
    deleteTopic(topicId)
    setDeleteConfirmId(null)
  }

  const topicToDelete = deleteConfirmId ? topics.find((t) => t.id === deleteConfirmId) : null

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Topics</h1>
          <p className="text-sm text-muted-foreground">
            {topics.length} total topics &bull; {topics.filter((t) => t.status === "completed").length} completed
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, subject, or chapter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filters row */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filters:</span>
            </div>
            <div className="flex flex-1 flex-wrap gap-2">
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="w-[160px] h-8 text-xs">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TopicStatus | "all")}>
                <SelectTrigger className="w-[160px] h-8 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[150px] h-8 text-xs">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="text-sm text-muted-foreground px-1">
        Showing {filteredAndSortedTopics.length} of {topics.length} topics
      </div>

      {/* Topics List */}
      {filteredAndSortedTopics.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-primary/40 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No topics found</h3>
            <p className="text-muted-foreground text-sm">
              {searchQuery || statusFilter !== "all" || subjectFilter !== "all"
                ? "Try adjusting your filters or search query."
                : "Log topics via the Daily Log to see them here."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 divide-y">
            {filteredAndSortedTopics.map((topic) => {
              const subject = subjects.find((s) => s.id === topic.subjectId)
              const chapter = chapters.find((c) => c.id === topic.chapterId)
              return (
                <div
                  key={topic.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{topic.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {subject?.name ?? "Unknown Subject"} &bull; {chapter?.title ?? "Unknown Chapter"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 border-0 ${STATUS_COLORS[topic.status]}`}
                      >
                        {topic.status.replace("-", " ")}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 border-0 ${PRIORITY_COLORS[topic.priority] ?? ""}`}
                      >
                        {topic.priority}
                      </Badge>
                      <span className="inline-flex items-center">
                        <MasteryStars value={topic.masteryLevel} size="sm" />
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                    onClick={() => setDeleteConfirmId(topic.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Topic</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{topicToDelete?.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
