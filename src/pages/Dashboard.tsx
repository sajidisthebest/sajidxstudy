import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { SubjectBadge } from "@/components/SubjectBadge"
import { MasteryStars } from "@/components/MasteryStars"
import { RecoveryBanner } from "@/components/RecoveryBanner"
import { useData } from "@/context/DataContext"
import {
  calculateDailyCompletionScore,
  getOverdueTopics,
  getPendingTopics,
  getRevisionDueToday,
  getRevisionDueThisWeek,
  getTodayLogs,
} from "@/lib/studyLogic"
import { format, differenceInDays } from "date-fns"
import {
  BookOpen,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  Clock,
  TrendingUp,
  Calendar,
} from "lucide-react"

export default function Dashboard() {
  const { data } = useData()

  const todayStr = format(new Date(), "yyyy-MM-dd")

  // Today's tasks
  const todayTasks = useMemo(
    () => data.studyTasks.filter((t) => t.date === todayStr),
    [data.studyTasks, todayStr]
  )

  // Today's logs
  const todayLogs = useMemo(() => getTodayLogs(data.dailyLogs), [data.dailyLogs])

  // Completion score
  const completionScore = useMemo(
    () => calculateDailyCompletionScore(todayTasks),
    [todayTasks]
  )

  // Pending topics
  const pendingTopics = useMemo(() => getPendingTopics(data.topics), [data.topics])

  // Overdue topics
  const overdueTopics = useMemo(() => getOverdueTopics(data.topics), [data.topics])

  // Revision due today
  const revisionDueToday = useMemo(() => getRevisionDueToday(data.topics), [data.topics])

  // Revision due this week
  const revisionDueThisWeek = useMemo(() => getRevisionDueThisWeek(data.topics), [data.topics])

  // Pending by source
  const pendingBySource = useMemo(() => {
    const college = pendingTopics.filter((t) => t.collegeStatus === "pending" || t.collegeStatus === "not-started")
    const tuition = pendingTopics.filter((t) => t.tuitionStatus === "pending" || t.tuitionStatus === "not-started")
    const selfStudy = pendingTopics.filter((t) => t.selfStudyStatus === "pending" || t.selfStudyStatus === "not-started")
    return { college: college.length, tuition: tuition.length, selfStudy: selfStudy.length }
  }, [pendingTopics])

  // Urgent pending (>14 days old)
  const urgentPending = useMemo(() => {
    return pendingTopics.filter((t) => {
      const days = differenceInDays(new Date(), new Date(t.createdAt))
      return days > 14
    })
  }, [pendingTopics])

  // Old pending (>7 days)
  const oldPending = useMemo(() => {
    return pendingTopics.filter((t) => {
      const days = differenceInDays(new Date(), new Date(t.createdAt))
      return days > 7 && days <= 14
    })
  }, [pendingTopics])

  // Subject progress data
  const subjectProgress = useMemo(() => {
    return data.subjects.map((subject) => {
      const chapters = data.chapters.filter((c) => c.subjectId === subject.id)
      const topics = data.topics.filter((t) => t.subjectId === subject.id)
      const completedChapters = chapters.filter((c) => c.status === "completed")
      const avgMastery =
        chapters.length > 0
          ? chapters.reduce((sum, c) => sum + c.masteryLevel, 0) / chapters.length
          : 0
      const overallCompletion =
        chapters.length > 0
          ? Math.round(chapters.reduce((sum, c) => sum + c.completionPercentage, 0) / chapters.length)
          : 0
      const nextRevision = chapters
        .filter((c) => c.nextRevisionAt)
        .sort((a, b) => new Date(a.nextRevisionAt!).getTime() - new Date(b.nextRevisionAt!).getTime())[0]

      return {
        subject,
        chapters,
        topics,
        completedChapters: completedChapters.length,
        pendingChapters: chapters.length - completedChapters.length,
        avgMastery: Math.round(avgMastery * 10) / 10,
        overallCompletion,
        nextRevision: nextRevision?.nextRevisionAt ?? null,
      }
    })
  }, [data.subjects, data.chapters, data.topics])

  // Today's Focus: topics logged today
  const collegeTodayLogs = todayLogs.filter((l) => l.source === "college")
  const tuitionTodayLogs = todayLogs.filter((l) => l.source === "tuition")
  const selfStudyTasks = todayTasks.filter((t) => t.taskType === "self-study")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your study progress and upcoming tasks.
        </p>
      </div>

      {/* Recovery Mode Banner */}
      <RecoveryBanner />

      {/* Top stats row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Topics</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.topics.length}</div>
            <p className="text-xs text-muted-foreground">across {data.subjects.length} subjects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {todayTasks.filter((t) => t.status === "completed").length}/{todayTasks.length}
            </div>
            <p className="text-xs text-muted-foreground">tasks done</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTopics.length}</div>
            <p className="text-xs text-muted-foreground">{urgentPending.length} urgent (&gt;14d)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revision Due</CardTitle>
            <RotateCcw className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{revisionDueToday.length + overdueTopics.length}</div>
            <p className="text-xs text-muted-foreground">{overdueTopics.length} overdue</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Completion Score */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Daily Completion Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Progress value={completionScore} className="flex-1" />
            <span className="text-lg font-bold min-w-[3rem] text-right">{completionScore}%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {todayTasks.filter((t) => t.status === "completed").length} of {todayTasks.length} tasks completed today
          </p>
        </CardContent>
      </Card>

      {/* Today's Focus */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Today&apos;s Focus
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {collegeTodayLogs.length > 0 && (
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
                College ({collegeTodayLogs.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {collegeTodayLogs.map((log) => (
                  <Badge key={log.id} variant="outline" className="text-xs">
                    {log.topicTitle}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {tuitionTodayLogs.length > 0 && (
            <div>
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-1">
                Tuition ({tuitionTodayLogs.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {tuitionTodayLogs.map((log) => (
                  <Badge key={log.id} variant="outline" className="text-xs">
                    {log.topicTitle}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {selfStudyTasks.length > 0 && (
            <div>
              <p className="text-sm font-medium text-teal-600 dark:text-teal-400 mb-1">
                Self-Study ({selfStudyTasks.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selfStudyTasks.map((task) => (
                  <Badge key={task.id} variant="outline" className="text-xs">
                    {task.topicTitle}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {revisionDueToday.length > 0 && (
            <div>
              <p className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-1">
                Revision Due Today ({revisionDueToday.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {revisionDueToday.map((topic) => (
                  <Badge key={topic.id} variant="outline" className="text-xs">
                    {topic.title}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {overdueTopics.length > 0 && (
            <div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">
                Overdue Pending ({overdueTopics.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {overdueTopics.map((topic) => (
                  <Badge key={topic.id} variant="outline" className="text-xs text-red-600">
                    {topic.title}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {collegeTodayLogs.length === 0 && tuitionTodayLogs.length === 0 && selfStudyTasks.length === 0 &&
           revisionDueToday.length === 0 && overdueTopics.length === 0 && (
            <p className="text-sm text-muted-foreground">No focus items for today yet. Log something to get started!</p>
          )}
        </CardContent>
      </Card>

      {/* Pending Topics Summary & Revision Due */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Pending Topics Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Pending</span>
              <span className="font-medium">{pendingTopics.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">College</span>
              <span className="font-medium">{pendingBySource.college}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tuition</span>
              <span className="font-medium">{pendingBySource.tuition}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Self-Study</span>
              <span className="font-medium">{pendingBySource.selfStudy}</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between text-sm">
              <span className="text-red-600 dark:text-red-400">Urgent (&gt;14 days)</span>
              <Badge variant="destructive" className="text-xs">{urgentPending.length}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-orange-600 dark:text-orange-400">Old (&gt;7 days)</span>
              <Badge variant="outline" className="text-xs text-orange-600">{oldPending.length}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Revision Due
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Due Today</span>
              <span className="font-medium">{revisionDueToday.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Overdue</span>
              <Badge variant="destructive" className="text-xs">{overdueTopics.length}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Due This Week</span>
              <span className="font-medium">{revisionDueThisWeek.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject Progress Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Subject Progress
        </h2>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {subjectProgress.map(({ subject, completedChapters, pendingChapters, avgMastery, overallCompletion, nextRevision }) => (
            <Card key={subject.id}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <SubjectBadge name={subject.name} color={subject.color} />
                  <span className="text-sm font-bold">{overallCompletion}%</span>
                </div>
                <Progress value={overallCompletion} className="h-2" />
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    {completedChapters} complete
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-yellow-500" />
                    {pendingChapters} pending
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">Mastery:</span>
                    <MasteryStars value={Math.round(avgMastery)} size="sm" />
                  </div>
                </div>
                {nextRevision && (
                  <p className="text-xs text-muted-foreground">
                    Next revision: {format(new Date(nextRevision), "MMM d")}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Weekly Catch-Up Preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Weekly Catch-Up Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingTopics.length > 0 || overdueTopics.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Queued for weekend catch-up:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[...overdueTopics.slice(0, 3), ...pendingTopics.filter((t) => t.priority === "high").slice(0, 3)].map((topic) => (
                  <Badge key={topic.id} variant="outline" className="text-xs">
                    {topic.title}
                  </Badge>
                ))}
                {(overdueTopics.length + pendingTopics.filter((t) => t.priority === "high").length) > 6 && (
                  <Badge variant="secondary" className="text-xs">
                    +{(overdueTopics.length + pendingTopics.filter((t) => t.priority === "high").length) - 6} more
                  </Badge>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              All caught up! No pending or overdue items for weekend study.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
