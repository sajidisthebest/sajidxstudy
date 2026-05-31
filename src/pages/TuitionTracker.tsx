import { useState, useMemo } from "react"
import { format } from "date-fns"
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
import { cn } from "@/lib/utils"
import type { Topic, TopicStatus } from "@/types"

type GapLabel =
  | "college-ahead"
  | "tuition-ahead"
  | "both-aligned"
  | "self-study-needed"
  | "revision-needed"

const gapLabelColors: Record<GapLabel, string> = {
  "college-ahead": "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  "tuition-ahead": "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  "both-aligned": "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  "self-study-needed": "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",
  "revision-needed": "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
}

const gapLabelText: Record<GapLabel, string> = {
  "college-ahead": "College Ahead",
  "tuition-ahead": "Tuition Ahead",
  "both-aligned": "Both Aligned",
  "self-study-needed": "Self-Study Needed",
  "revision-needed": "Revision Needed",
}

function statusToScore(status: TopicStatus): number {
  switch (status) {
    case "completed":
      return 100
    case "learning":
      return 50
    case "pending":
      return 25
    case "needs-revision":
      return 30
    case "not-started":
    default:
      return 0
  }
}

function calculateGap(
  collegeScore: number,
  tuitionScore: number,
  selfStudyScore: number
): GapLabel {
  const diff = Math.abs(collegeScore - tuitionScore)
  if (diff <= 10 && collegeScore > 0 && tuitionScore > 0) {
    if (selfStudyScore < Math.min(collegeScore, tuitionScore) - 20) {
      return "self-study-needed"
    }
    return "both-aligned"
  }
  if (collegeScore > tuitionScore + 20) return "college-ahead"
  if (tuitionScore > collegeScore + 20) return "tuition-ahead"
  if (selfStudyScore < 30 && (collegeScore > 50 || tuitionScore > 50)) {
    return "self-study-needed"
  }
  if (collegeScore >= 80 || tuitionScore >= 80) {
    if (selfStudyScore < 50) return "revision-needed"
  }
  return "both-aligned"
}

function generateAction(gap: GapLabel, chapterTitle: string): string {
  switch (gap) {
    case "college-ahead":
      return `Catch up in tuition for ${chapterTitle}`
    case "tuition-ahead":
      return `Review college notes for ${chapterTitle}`
    case "self-study-needed":
      return `Start self-study practice for ${chapterTitle}`
    case "revision-needed":
      return `Schedule revision session for ${chapterTitle}`
    case "both-aligned":
      return "On track - continue studying"
  }
}

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

export default function TuitionTracker() {
  const { getSubjects, getChapters, getTopics, getDailyLogs, deleteDailyLog, updateDailyLog } = useData()

  const subjects = getSubjects()
  const allChapters = getChapters()
  const allTopics = getTopics()
  const allLogs = getDailyLogs()

  const tuitionSubjects = subjects.filter((s) => s.isTuitionSubject)

  // Filter state
  const [dateRange, setDateRange] = useState<DatePreset>("all")
  const [subjectFilter, setSubjectFilter] = useState("all")
  const [understandingFilter, setUnderstandingFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [selectedLogIds, setSelectedLogIds] = useState<Set<string>>(new Set())

  // Tuition logs
  const tuitionLogs = useMemo(() => {
    let logs = allLogs.filter(
      (l) =>
        l.source === "tuition" &&
        tuitionSubjects.some((s) => s.id === l.subjectId)
    )

    const range = getDateRange(dateRange)
    if (range) {
      logs = logs.filter((l) => l.date >= range.start && l.date <= range.end)
    }
    if (subjectFilter !== "all") {
      logs = logs.filter((l) => l.subjectId === subjectFilter)
    }
    if (understandingFilter !== "all") {
      logs = logs.filter((l) => l.understood === understandingFilter)
    }
    if (statusFilter !== "all") {
      logs = logs.filter((l) => l.status === statusFilter)
    }
    if (search) {
      const q = search.toLowerCase()
      logs = logs.filter((l) => l.topicTitle.toLowerCase().includes(q))
    }

    return logs.sort((a, b) => b.date.localeCompare(a.date))
  }, [allLogs, tuitionSubjects, dateRange, subjectFilter, understandingFilter, statusFilter, search])

  // Subject progress for tuition subjects
  const subjectProgress = useMemo(() => {
    return tuitionSubjects.map((subject) => {
      const topics = allTopics.filter((t) => t.subjectId === subject.id)
      const tuitionTopics = topics.filter(
        (t) => t.tuitionStatus !== "not-started"
      )
      const completed = tuitionTopics.filter(
        (t) => t.tuitionStatus === "completed"
      )
      const pct =
        tuitionTopics.length > 0
          ? Math.round((completed.length / tuitionTopics.length) * 100)
          : 0
      return { subject, total: tuitionTopics.length, completed: completed.length, pct }
    })
  }, [tuitionSubjects, allTopics])

  // Gap view data
  const gapData = useMemo(() => {
    const rows: Array<{
      subject: typeof subjects[0]
      chapter: typeof allChapters[0]
      topics: Topic[]
      collegeScore: number
      tuitionScore: number
      selfStudyScore: number
      gap: GapLabel
      action: string
    }> = []

    for (const subject of tuitionSubjects) {
      const chapters = allChapters.filter((c) => c.subjectId === subject.id)
      for (const chapter of chapters) {
        const topics = allTopics.filter((t) => t.chapterId === chapter.id)
        if (topics.length === 0) {
          rows.push({
            subject,
            chapter,
            topics: [],
            collegeScore: 0,
            tuitionScore: 0,
            selfStudyScore: 0,
            gap: "self-study-needed",
            action: `Start studying ${chapter.title}`,
          })
          continue
        }

        const collegeScore = Math.round(
          topics.reduce((sum, t) => sum + statusToScore(t.collegeStatus), 0) /
            topics.length
        )
        const tuitionScore = Math.round(
          topics.reduce((sum, t) => sum + statusToScore(t.tuitionStatus), 0) /
            topics.length
        )
        const selfStudyScore = Math.round(
          topics.reduce(
            (sum, t) => sum + statusToScore(t.selfStudyStatus),
            0
          ) / topics.length
        )
        const gap = calculateGap(collegeScore, tuitionScore, selfStudyScore)
        const action = generateAction(gap, chapter.title)

        rows.push({
          subject,
          chapter,
          topics,
          collegeScore,
          tuitionScore,
          selfStudyScore,
          gap,
          action,
        })
      }
    }

    return rows
  }, [tuitionSubjects, allChapters, allTopics])

  function toggleSelectLog(id: string) {
    setSelectedLogIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAllLogs() {
    const visibleIds = tuitionLogs.map((l) => l.id)
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
        <h1 className="text-3xl font-bold tracking-tight">Tuition Tracker</h1>
        <p className="text-muted-foreground">
          Track Finance and Accounting tuition classes and compare with college progress.
        </p>
      </div>

      <Tabs defaultValue="tracking" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tracking">Tuition Tracking</TabsTrigger>
          <TabsTrigger value="gap">College vs Tuition Gap</TabsTrigger>
        </TabsList>

        <TabsContent value="tracking" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
            <SubjectFilter
              value={subjectFilter}
              onChange={setSubjectFilter}
              filterTuition={true}
            />
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

          {/* Progress bars */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tuition Progress</CardTitle>
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
            </CardContent>
          </Card>

          {/* Log table */}
          {tuitionLogs.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No tuition logs found with current filters.
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-3 text-left font-medium w-10">
                      <Checkbox
                        checked={tuitionLogs.length > 0 && tuitionLogs.every((l) => selectedLogIds.has(l.id))}
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
                  {tuitionLogs.map((log) => {
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
                            <SubjectBadge name={subject.name} color={subject.color} />
                          )}
                        </td>
                        <td className="p-3 text-muted-foreground">{chapter?.title}</td>
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

        <TabsContent value="gap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                College vs Tuition Gap Analysis
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Compare progress across college, tuition, and self-study for Finance and Accounting chapters.
              </p>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-3 text-left font-medium">Subject</th>
                      <th className="p-3 text-left font-medium">Chapter</th>
                      <th className="p-3 text-left font-medium">College</th>
                      <th className="p-3 text-left font-medium">Tuition</th>
                      <th className="p-3 text-left font-medium">Self-Study</th>
                      <th className="p-3 text-left font-medium">Gap</th>
                      <th className="p-3 text-left font-medium">Action Needed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gapData.map((row) => (
                      <tr key={row.chapter.id} className="border-t">
                        <td className="p-3">
                          <SubjectBadge
                            name={row.subject.name}
                            color={row.subject.color}
                          />
                        </td>
                        <td className="p-3 font-medium">{row.chapter.title}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Progress
                              value={row.collegeScore}
                              className="h-2 w-16"
                            />
                            <span className="text-xs">{row.collegeScore}%</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Progress
                              value={row.tuitionScore}
                              className="h-2 w-16"
                            />
                            <span className="text-xs">{row.tuitionScore}%</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Progress
                              value={row.selfStudyScore}
                              className="h-2 w-16"
                            />
                            <span className="text-xs">
                              {row.selfStudyScore}%
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge
                            className={cn(
                              "text-xs whitespace-nowrap",
                              gapLabelColors[row.gap]
                            )}
                          >
                            {gapLabelText[row.gap]}
                          </Badge>
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {row.action}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Legend */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-3">
                {Object.entries(gapLabelText).map(([key, label]) => (
                  <Badge
                    key={key}
                    className={cn(
                      "text-xs",
                      gapLabelColors[key as GapLabel]
                    )}
                  >
                    {label}
                  </Badge>
                ))}
              </div>
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
        <Button variant="destructive" size="sm" onClick={handleBulkDeleteLogs}>
          Delete Selected
        </Button>
      </SelectionToolbar>
    </div>
  )
}
