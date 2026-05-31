import { useMemo } from "react"
import { format, subDays, startOfWeek } from "date-fns"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts"
import { useData } from "@/context/DataContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getOverdueTopics, getRevisionDueThisWeek } from "@/lib/studyLogic"
import {
  TrendingUp,
  Brain,
  Target,
  Flame,
  BookOpen,
  AlertTriangle,
  Trophy,
} from "lucide-react"

function HealthScoreRing({ score }: { score: number }) {
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  let color = "text-red-500"
  let bgColor = "stroke-red-100"
  let label = "Recovery Needed"
  if (score >= 90) {
    color = "text-green-500"
    bgColor = "stroke-green-100"
    label = "Excellent"
  } else if (score >= 75) {
    color = "text-blue-500"
    bgColor = "stroke-blue-100"
    label = "Good"
  } else if (score >= 50) {
    color = "text-orange-500"
    bgColor = "stroke-orange-100"
    label = "Needs Attention"
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg width="180" height="180" className="transform -rotate-90">
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            strokeWidth="12"
            className={bgColor}
          />
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`${color} transition-all duration-700`}
            style={{ stroke: "currentColor" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-bold ${color}`}>{score}</span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>
      <Badge variant="outline" className="text-sm">{label}</Badge>
    </div>
  )
}

export default function Analytics() {
  const { data } = useData()
  const todayStr = format(new Date(), "yyyy-MM-dd")

  // Daily completion for last 7 days
  const dailyCompletionData = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const dateStr = format(date, "yyyy-MM-dd")
      const tasks = data.studyTasks.filter((t) => t.date === dateStr)
      const completed = tasks.filter((t) => t.status === "completed").length
      const total = tasks.length
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0
      days.push({
        day: format(date, "EEE"),
        completion: pct,
        completed,
        total,
      })
    }
    return days
  }, [data.studyTasks])

  // Subject progress
  const subjectProgressData = useMemo(() => {
    return data.subjects.map((subject) => {
      const chapters = data.chapters.filter((c) => c.subjectId === subject.id)
      const avgCompletion = chapters.length > 0
        ? Math.round(chapters.reduce((sum, c) => sum + c.completionPercentage, 0) / chapters.length)
        : 0
      return {
        name: subject.name.length > 12 ? subject.name.substring(0, 12) + "..." : subject.name,
        fullName: subject.name,
        progress: avgCompletion,
      }
    })
  }, [data.subjects, data.chapters])

  // Mastery by subject (for radar)
  const masteryBySubject = useMemo(() => {
    return data.subjects.map((subject) => {
      const topics = data.topics.filter((t) => t.subjectId === subject.id && t.masteryLevel > 0)
      const avgMastery = topics.length > 0
        ? Math.round((topics.reduce((sum, t) => sum + t.masteryLevel, 0) / topics.length) * 10) / 10
        : 0
      return {
        subject: subject.name.length > 10 ? subject.name.substring(0, 10) + ".." : subject.name,
        mastery: avgMastery,
      }
    }).filter((s) => s.mastery > 0)
  }, [data.subjects, data.topics])

  // Weekly topics (last 4 weeks)
  const weeklyTopicsData = useMemo(() => {
    const weeks = []
    for (let i = 3; i >= 0; i--) {
      const weekStart = startOfWeek(subDays(new Date(), i * 7), { weekStartsOn: 0 })
      const weekEnd = subDays(startOfWeek(subDays(new Date(), (i - 1) * 7), { weekStartsOn: 0 }), 1)
      const weekStartStr = format(weekStart, "yyyy-MM-dd")
      const weekEndStr = format(weekEnd, "yyyy-MM-dd")

      const completed = data.studyTasks.filter(
        (t) => t.status === "completed" && t.date >= weekStartStr && t.date <= weekEndStr
      ).length
      const added = data.dailyLogs.filter(
        (l) => l.date >= weekStartStr && l.date <= weekEndStr
      ).length

      weeks.push({
        week: `W${4 - i}`,
        completed,
        added,
      })
    }
    return weeks
  }, [data.studyTasks, data.dailyLogs])

  // Stats calculations
  const stats = useMemo(() => {
    const overdue = getOverdueTopics(data.topics)
    const pendingTopics = data.topics.filter((t) => t.isPending)

    // Most pending subject
    const pendingBySubject: Record<string, number> = {}
    for (const t of pendingTopics) {
      pendingBySubject[t.subjectId] = (pendingBySubject[t.subjectId] || 0) + 1
    }
    const mostPendingSubjectId = Object.entries(pendingBySubject).sort((a, b) => b[1] - a[1])[0]
    const mostPendingSubject = mostPendingSubjectId
      ? data.subjects.find((s) => s.id === mostPendingSubjectId[0])
      : null

    // Weakest / Strongest subject by avg mastery
    const subjectMastery = data.subjects.map((subject) => {
      const topics = data.topics.filter((t) => t.subjectId === subject.id && t.masteryLevel > 0)
      const avg = topics.length > 0 ? topics.reduce((s, t) => s + t.masteryLevel, 0) / topics.length : 0
      return { subject, avg }
    }).filter((s) => s.avg > 0)

    const weakest = subjectMastery.length > 0
      ? subjectMastery.sort((a, b) => a.avg - b.avg)[0]
      : null
    const strongest = subjectMastery.length > 0
      ? subjectMastery.sort((a, b) => b.avg - a.avg)[0]
      : null

    // Topics completed this week
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 0 }), "yyyy-MM-dd")
    const completedThisWeek = data.studyTasks.filter(
      (t) => t.status === "completed" && t.date >= weekStart
    ).length

    // Topics added this week
    const addedThisWeek = data.dailyLogs.filter((l) => l.date >= weekStart).length

    // Revisions completed this week
    const revisionsThisWeek = data.revisionRecords.filter((r) => r.revisedAt >= weekStart).length

    // Study streak
    let streak = 0
    let checkDate = new Date()
    while (true) {
      const dateStr = format(checkDate, "yyyy-MM-dd")
      const hasCompletion = data.studyTasks.some(
        (t) => t.date === dateStr && t.status === "completed"
      )
      if (hasCompletion) {
        streak++
        checkDate = subDays(checkDate, 1)
      } else {
        break
      }
    }

    return {
      overdue,
      pendingTopics,
      mostPendingSubject: mostPendingSubject ? { name: mostPendingSubject.name, count: mostPendingSubjectId![1] } : null,
      weakest: weakest ? { name: weakest.subject.name, avg: Math.round(weakest.avg * 10) / 10 } : null,
      strongest: strongest ? { name: strongest.subject.name, avg: Math.round(strongest.avg * 10) / 10 } : null,
      completedThisWeek,
      addedThisWeek,
      revisionsThisWeek,
      streak,
    }
  }, [data])

  // Study Health Score
  const healthScore = useMemo(() => {
    // Daily completion rate (30%)
    const todayTasks = data.studyTasks.filter((t) => t.date === todayStr)
    const dailyRate = todayTasks.length > 0
      ? (todayTasks.filter((t) => t.status === "completed").length / todayTasks.length) * 100
      : 50 // default if no tasks

    // Pending topic count (20%): 0 = 100, >20 = 0
    const pendingCount = data.topics.filter((t) => t.isPending).length
    const pendingScore = Math.max(0, 100 - (pendingCount / 20) * 100)

    // Revision completion rate (20%)
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 0 }), "yyyy-MM-dd")
    const revisionsDue = getRevisionDueThisWeek(data.topics).length + stats.overdue.length
    const revisionsCompleted = data.revisionRecords.filter((r) => r.revisedAt >= weekStart).length
    const revisionRate = revisionsDue > 0
      ? Math.min(100, (revisionsCompleted / revisionsDue) * 100)
      : 100

    // Mastery average (15%)
    const topicsWithMastery = data.topics.filter((t) => t.masteryLevel > 0)
    const avgMastery = topicsWithMastery.length > 0
      ? topicsWithMastery.reduce((s, t) => s + t.masteryLevel, 0) / topicsWithMastery.length
      : 0
    const masteryScore = (avgMastery / 5) * 100

    // Overdue count (15%): 0 = 100, >10 = 0
    const overdueCount = stats.overdue.length
    const overdueScore = Math.max(0, 100 - (overdueCount / 10) * 100)

    const total = Math.round(
      dailyRate * 0.3 + pendingScore * 0.2 + revisionRate * 0.2 + masteryScore * 0.15 + overdueScore * 0.15
    )

    return Math.min(100, Math.max(0, total))
  }, [data, todayStr, stats.overdue])

  // College vs Tuition comparison (for tuition subjects)
  const collegeVsTuition = useMemo(() => {
    const tuitionSubjects = data.subjects.filter((s) => s.isTuitionSubject)
    return tuitionSubjects.map((subject) => {
      const topics = data.topics.filter((t) => t.subjectId === subject.id)
      const total = topics.length
      if (total === 0) return { name: subject.name, college: 0, tuition: 0 }
      const collegeCompleted = topics.filter((t) => t.collegeStatus === "completed").length
      const tuitionCompleted = topics.filter((t) => t.tuitionStatus === "completed").length
      return {
        name: subject.name,
        college: Math.round((collegeCompleted / total) * 100),
        tuition: Math.round((tuitionCompleted / total) * 100),
      }
    })
  }, [data.subjects, data.topics])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Insights and charts about your study patterns and progress.</p>
      </div>

      {/* Study Health Score */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Study Health Score
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-4">
          <HealthScoreRing score={healthScore} />
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <p className="text-xs text-muted-foreground">Most Pending</p>
            </div>
            <p className="font-bold text-sm">{stats.mostPendingSubject?.name ?? "None"}</p>
            {stats.mostPendingSubject && (
              <p className="text-xs text-muted-foreground">{stats.mostPendingSubject.count} topics</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-red-500" />
              <p className="text-xs text-muted-foreground">Weakest Subject</p>
            </div>
            <p className="font-bold text-sm">{stats.weakest?.name ?? "None"}</p>
            {stats.weakest && (
              <p className="text-xs text-muted-foreground">Avg mastery: {stats.weakest.avg}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="h-4 w-4 text-green-500" />
              <p className="text-xs text-muted-foreground">Strongest Subject</p>
            </div>
            <p className="font-bold text-sm">{stats.strongest?.name ?? "None"}</p>
            {stats.strongest && (
              <p className="text-xs text-muted-foreground">Avg mastery: {stats.strongest.avg}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="h-4 w-4 text-orange-500" />
              <p className="text-xs text-muted-foreground">Study Streak</p>
            </div>
            <p className="font-bold text-sm">{stats.streak} days</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-green-500" />
              <p className="text-xs text-muted-foreground">Completed This Week</p>
            </div>
            <p className="font-bold text-lg">{stats.completedThisWeek}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="h-4 w-4 text-blue-500" />
              <p className="text-xs text-muted-foreground">Added This Week</p>
            </div>
            <p className="font-bold text-lg">{stats.addedThisWeek}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <p className="text-xs text-muted-foreground">Revisions This Week</p>
            </div>
            <p className="font-bold text-lg">{stats.revisionsThisWeek}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <p className="text-xs text-muted-foreground">Overdue</p>
            </div>
            <p className="font-bold text-lg text-red-600">{stats.overdue.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Completion Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Daily Completion (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyCompletionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" fontSize={12} />
                <YAxis domain={[0, 100]} fontSize={12} />
                <Tooltip formatter={(value) => [`${value}%`, "Completion"]} />
                <Bar dataKey="completion" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Subject Progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Subject Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectProgressData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} fontSize={12} />
                <YAxis type="category" dataKey="name" width={100} fontSize={11} />
                <Tooltip formatter={(value) => [`${value}%`, "Progress"]} />
                <Bar dataKey="progress" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Mastery by Subject (Radar) */}
      {masteryBySubject.length > 2 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Mastery by Subject</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={masteryBySubject}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" fontSize={11} />
                  <Radar
                    name="Mastery"
                    dataKey="mastery"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.3}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly Topics Trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Weekly Topics (Last 4 Weeks)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyTopicsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} name="Completed" />
                <Line type="monotone" dataKey="added" stroke="#3b82f6" strokeWidth={2} name="Added" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* College vs Tuition */}
      {collegeVsTuition.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">College vs Tuition Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {collegeVsTuition.map((item) => (
                <div key={item.name} className="space-y-2">
                  <p className="text-sm font-medium">{item.name}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs w-16 text-blue-600">College</span>
                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${item.college}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium w-10 text-right">{item.college}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs w-16 text-purple-600">Tuition</span>
                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all"
                        style={{ width: `${item.tuition}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium w-10 text-right">{item.tuition}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
