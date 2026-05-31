import { useState, useMemo, useEffect } from "react"
import { format } from "date-fns"
import { AlertCircle, BookOpen, Clock, CheckCircle2 } from "lucide-react"
import { useData } from "@/context/DataContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DateRangeFilter,
  getDateRange,
  type DatePreset,
} from "@/components/filters/DateRangeFilter"
import { SubjectFilter } from "@/components/filters/SubjectFilter"
import { StatusFilter } from "@/components/filters/StatusFilter"
import { SearchInput } from "@/components/filters/SearchInput"
import { SubjectBadge } from "@/components/SubjectBadge"
import { Checkbox } from "@/components/ui/checkbox"
import { SelectionToolbar } from "@/components/SelectionToolbar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

const understandingOptions = [
  { value: "all", label: "All" },
  { value: "yes", label: "Understood" },
  { value: "somewhat", label: "Somewhat" },
  { value: "no", label: "Not Understood" },
]

const logStatusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "need-to-study-tonight", label: "Study Tonight" },
]

export default function CollegeTracker() {
  const { getSubjects, getChapters, getTopics, getDailyLogs, deleteDailyLog, updateDailyLog } = useData()

  const subjects = getSubjects()
  const allChapters = getChapters()
  const allTopics = getTopics()
  const allLogs = getDailyLogs()

  // Filter state
  const [dateRange, setDateRange] = useState<DatePreset>("all")
  const [subjectFilter, setSubjectFilter] = useState("all")
  const [understandingFilter, setUnderstandingFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [selectedLogIds, setSelectedLogIds] = useState<Set<string>>(new Set())
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false)

  // Clear selection when filters change to avoid stale selections
  useEffect(() => {
    setSelectedLogIds(new Set())
  }, [dateRange, subjectFilter, understandingFilter, statusFilter, search])

  // Filter logs by source=college
  const collegeLogs = useMemo(() => {
    let logs = allLogs.filter((l) => l.source === "college")

    // Date range
    const range = getDateRange(dateRange)
    if (range) {
      logs = logs.filter((l) => l.date >= range.start && l.date <= range.end)
    }

    // Subject
    if (subjectFilter !== "all") {
      logs = logs.filter((l) => l.subjectId === subjectFilter)
    }

    // Understanding
    if (understandingFilter !== "all") {
      logs = logs.filter((l) => l.understood === understandingFilter)
    }

    // Status
    if (statusFilter !== "all") {
      logs = logs.filter((l) => l.status === statusFilter)
    }

    // Search
    if (search) {
      const q = search.toLowerCase()
      logs = logs.filter((l) => l.topicTitle.toLowerCase().includes(q))
    }

    return logs.sort((a, b) => b.date.localeCompare(a.date))
  }, [allLogs, dateRange, subjectFilter, understandingFilter, statusFilter, search])

  // Subject-wise progress
  const subjectProgress = useMemo(() => {
    return subjects.map((subject) => {
      const topics = allTopics.filter((t) => t.subjectId === subject.id)
      const collegeTopics = topics.filter(
        (t) => t.collegeStatus !== "not-started"
      )
      const completedCollege = collegeTopics.filter(
        (t) => t.collegeStatus === "completed"
      )
      const pct =
        collegeTopics.length > 0
          ? Math.round((completedCollege.length / collegeTopics.length) * 100)
          : 0
      return {
        subject,
        total: collegeTopics.length,
        completed: completedCollege.length,
        pct,
      }
    }).filter((s) => s.total > 0)
  }, [subjects, allTopics])

  // Topics not understood
  const notUnderstood = useMemo(() => {
    return allTopics.filter(
      (t) =>
        t.understanding === "no" &&
        t.collegeStatus !== "not-started"
    )
  }, [allTopics])

  // Pending college topics
  const pendingCollegeTopics = useMemo(() => {
    return allTopics
      .filter(
        (t) =>
          t.isPending &&
          t.collegeStatus !== "not-started" &&
          t.collegeStatus !== "completed"
      )
      .sort((a, b) => {
        const dateA = a.dateTaughtCollege ?? ""
        const dateB = b.dateTaughtCollege ?? ""
        return dateA.localeCompare(dateB)
      })
  }, [allTopics])

  // Today's incomplete
  const todayStr = format(new Date(), "yyyy-MM-dd")
  const todayIncomplete = useMemo(() => {
    return allLogs.filter(
      (l) =>
        l.date === todayStr &&
        l.source === "college" &&
        l.status !== "completed"
    )
  }, [allLogs, todayStr])

  // Chapters currently being taught (recent college activity)
  const activeChapters = useMemo(() => {
    const recentLogs = allLogs.filter(
      (l) => l.source === "college" && l.date >= format(new Date(Date.now() - 604800000), "yyyy-MM-dd")
    )
    const chapterIds = [...new Set(recentLogs.map((l) => l.chapterId))]
    return allChapters.filter((c) => chapterIds.includes(c.id))
  }, [allLogs, allChapters])

  function toggleSelectLog(id: string) {
    setSelectedLogIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAllLogs() {
    const visibleIds = collegeLogs.map((l) => l.id)
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedLogIds.has(id))
    if (allSelected) {
      setSelectedLogIds(new Set())
    } else {
      setSelectedLogIds(new Set(visibleIds))
    }
  }

  function handleBulkDeleteLogs() {
    selectedLogIds.forEach((id) => deleteDailyLog(id))
    setSelectedLogIds(new Set())
    setBulkDeleteConfirmOpen(false)
  }

  function handleBulkCompleteLogs() {
    selectedLogIds.forEach((id) => updateDailyLog(id, { status: "completed" }))
    setSelectedLogIds(new Set())
  }

  function getSubject(id: string) {
    return subjects.find((s) => s.id === id)
  }

  function getChapter(id: string) {
    return allChapters.find((c) => c.id === id)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">College Tracker</h1>
        <p className="text-muted-foreground">
          Track topics taught in college lectures.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
        <SubjectFilter value={subjectFilter} onChange={setSubjectFilter} />
        <StatusFilter
          value={understandingFilter}
          onChange={setUnderstandingFilter}
          options={understandingOptions}
          className="w-[160px]"
        />
        <StatusFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={logStatusOptions}
          className="w-[160px]"
        />
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search topics..."
          className="w-[200px]"
        />
      </div>

      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">Topics by Date</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-3">
          {collegeLogs.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No college logs found with current filters.
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-3 text-left font-medium w-10">
                      <Checkbox
                        checked={collegeLogs.length > 0 && collegeLogs.every((l) => selectedLogIds.has(l.id))}
                        onCheckedChange={toggleSelectAllLogs}
                      />
                    </th>
                    <th className="p-3 text-left font-medium">Date</th>
                    <th className="p-3 text-left font-medium">Subject</th>
                    <th className="p-3 text-left font-medium">Chapter</th>
                    <th className="p-3 text-left font-medium">Topic</th>
                    <th className="p-3 text-left font-medium">Understood?</th>
                    <th className="p-3 text-left font-medium">Status</th>
                    <th className="p-3 text-left font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {collegeLogs.map((log) => {
                    const subject = getSubject(log.subjectId)
                    const chapter = getChapter(log.chapterId)
                    return (
                      <tr
                        key={log.id}
                        className={cn(
                          "border-t",
                          log.understood === "no" && "bg-red-50 dark:bg-red-950/20",
                          log.status === "pending" && "bg-orange-50 dark:bg-orange-950/20"
                        )}
                      >
                        <td className="p-3">
                          <Checkbox
                            checked={selectedLogIds.has(log.id)}
                            onCheckedChange={() => toggleSelectLog(log.id)}
                          />
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {format(new Date(log.date), "MMM d")}
                        </td>
                        <td className="p-3">
                          {subject && (
                            <SubjectBadge
                              name={subject.name}
                              color={subject.color}
                            />
                          )}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {chapter?.title}
                        </td>
                        <td className="p-3 font-medium">{log.topicTitle}</td>
                        <td className="p-3">
                          <span
                            className={cn(
                              "text-xs px-2 py-0.5 rounded-full",
                              log.understood === "yes"
                                ? "bg-green-100 text-green-700"
                                : log.understood === "somewhat"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            )}
                          >
                            {log.understood === "yes"
                              ? "Yes"
                              : log.understood === "somewhat"
                              ? "Partial"
                              : "No"}
                          </span>
                        </td>
                        <td className="p-3">
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-xs",
                              log.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : log.status === "pending"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-blue-100 text-blue-700"
                            )}
                          >
                            {log.status === "need-to-study-tonight"
                              ? "Study Tonight"
                              : log.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-xs text-muted-foreground max-w-[200px] truncate">
                          {log.quickNote}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="summary" className="space-y-6">
          {/* Subject-wise progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Subject-wise Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {subjectProgress.map(({ subject, total, completed, pct }) => (
                <div key={subject.id} className="flex items-center gap-3">
                  <SubjectBadge
                    name={subject.name}
                    color={subject.color}
                    className="w-[140px] justify-start"
                  />
                  <Progress value={pct} className="flex-1 h-2" />
                  <span className="text-xs text-muted-foreground w-16 text-right">
                    {completed}/{total} ({pct}%)
                  </span>
                </div>
              ))}
              {subjectProgress.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No college topics tracked yet.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Currently being taught */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> Chapters Currently Being Taught
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {activeChapters.map((ch) => {
                  const subject = getSubject(ch.subjectId)
                  return (
                    <Badge key={ch.id} variant="secondary">
                      {subject?.name}: {ch.title}
                    </Badge>
                  )
                })}
                {activeChapters.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No recent college activity.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Topics not understood */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" /> Topics Not
                Understood
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {notUnderstood.map((topic) => {
                const subject = getSubject(topic.subjectId)
                return (
                  <div
                    key={topic.id}
                    className="flex items-center gap-3 p-2 rounded bg-red-50 dark:bg-red-950/20"
                  >
                    {subject && (
                      <SubjectBadge
                        name={subject.name}
                        color={subject.color}
                      />
                    )}
                    <span className="text-sm font-medium">{topic.title}</span>
                    {topic.confusionNote && (
                      <span className="text-xs text-muted-foreground">
                        - {topic.confusionNote}
                      </span>
                    )}
                  </div>
                )
              })}
              {notUnderstood.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  All topics understood!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Complete tonight */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" /> Complete Tonight
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {todayIncomplete.map((log) => {
                const subject = getSubject(log.subjectId)
                return (
                  <div
                    key={log.id}
                    className="flex items-center gap-3 p-2 rounded bg-blue-50 dark:bg-blue-950/20"
                  >
                    {subject && (
                      <SubjectBadge
                        name={subject.name}
                        color={subject.color}
                      />
                    )}
                    <span className="text-sm font-medium">
                      {log.topicTitle}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {log.status === "need-to-study-tonight"
                        ? "Study Tonight"
                        : log.status}
                    </Badge>
                  </div>
                )
              })}
              {todayIncomplete.length === 0 && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> All done
                  for today!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Pending backlog */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" /> Pending
                Backlog
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pendingCollegeTopics.map((topic) => {
                const subject = getSubject(topic.subjectId)
                return (
                  <div
                    key={topic.id}
                    className="flex items-center gap-3 p-2 rounded bg-orange-50 dark:bg-orange-950/20"
                  >
                    {subject && (
                      <SubjectBadge
                        name={subject.name}
                        color={subject.color}
                      />
                    )}
                    <span className="text-sm font-medium">{topic.title}</span>
                    {topic.dateTaughtCollege && (
                      <span className="text-xs text-muted-foreground">
                        Taught:{" "}
                        {format(
                          new Date(topic.dateTaughtCollege),
                          "MMM d"
                        )}
                      </span>
                    )}
                    {topic.pendingReason && (
                      <span className="text-xs text-muted-foreground">
                        - {topic.pendingReason}
                      </span>
                    )}
                  </div>
                )
              })}
              {pendingCollegeTopics.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No pending backlog.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Selection Toolbar */}
      <SelectionToolbar
        selectedCount={selectedLogIds.size}
        onClearSelection={() => setSelectedLogIds(new Set())}
      >
        <Button variant="outline" size="sm" onClick={handleBulkCompleteLogs}>
          Mark Completed
        </Button>
        <Button variant="destructive" size="sm" onClick={() => setBulkDeleteConfirmOpen(true)}>
          Delete Selected
        </Button>
      </SelectionToolbar>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteConfirmOpen} onOpenChange={setBulkDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedLogIds.size} Log{selectedLogIds.size !== 1 ? "s" : ""}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedLogIds.size} selected log entr{selectedLogIds.size !== 1 ? "ies" : "y"}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkDeleteLogs}>
              Delete {selectedLogIds.size} Log{selectedLogIds.size !== 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
