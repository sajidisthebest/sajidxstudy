import { format, addDays, subDays, isBefore, isToday, isAfter, startOfDay, startOfWeek, endOfWeek, isWithinInterval, differenceInDays, isFriday, isSaturday } from "date-fns"
import type { AppSettings, AppData, StudyTask, Topic, DailyLog } from "@/types"

/**
 * Calculate the next revision date based on mastery level and settings intervals.
 */
export function calculateNextRevisionDate(mastery: number, settings: AppSettings): string {
  const intervals = settings.revisionIntervals
  const days = intervals[mastery] ?? 7
  return format(addDays(new Date(), days), "yyyy-MM-dd")
}

/**
 * Generate today's task list from logs, pending topics, and revision items.
 */
export function generateTodaysTasks(data: AppData): StudyTask[] {
  const todayStr = format(new Date(), "yyyy-MM-dd")
  const existingTasks = data.studyTasks.filter((t) => t.date === todayStr)
  return existingTasks
}

/**
 * Calculate daily completion score as a percentage.
 */
export function calculateDailyCompletionScore(tasks: StudyTask[]): number {
  if (tasks.length === 0) return 0
  const completed = tasks.filter((t) => t.status === "completed").length
  return Math.round((completed / tasks.length) * 100)
}

/**
 * Get topics that are past their revision date.
 */
export function getOverdueTopics(topics: Topic[]): Topic[] {
  const today = startOfDay(new Date())
  return topics.filter((t) => {
    if (!t.nextRevisionAt) return false
    const revDate = startOfDay(new Date(t.nextRevisionAt))
    return isBefore(revDate, today) && t.status !== "completed"
  })
}

/**
 * Get all pending topics sorted by priority.
 */
export function getPendingTopics(topics: Topic[]): Topic[] {
  const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
  return topics
    .filter((t) => t.isPending)
    .sort((a, b) => (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3))
}

/**
 * Get topics due for revision today.
 */
export function getRevisionDueToday(topics: Topic[]): Topic[] {
  return topics.filter((t) => {
    if (!t.nextRevisionAt) return false
    return isToday(new Date(t.nextRevisionAt))
  })
}

/**
 * Get topics due for revision this week (from today to end of week).
 */
export function getRevisionDueThisWeek(topics: Topic[]): Topic[] {
  const today = startOfDay(new Date())
  const weekEnd = endOfWeek(today, { weekStartsOn: 0 })
  return topics.filter((t) => {
    if (!t.nextRevisionAt) return false
    const revDate = startOfDay(new Date(t.nextRevisionAt))
    return isWithinInterval(revDate, { start: today, end: weekEnd })
  })
}

/**
 * Get today's logs.
 */
export function getTodayLogs(dailyLogs: DailyLog[]): DailyLog[] {
  const todayStr = format(new Date(), "yyyy-MM-dd")
  return dailyLogs.filter((l) => l.date === todayStr)
}

/**
 * Generate a unique ID.
 */
export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Determine the pending reason for a topic based on auto-detection logic.
 * Returns the reason string or null if the topic is not considered pending.
 */
export function detectPendingReason(topic: Topic, dailyLogs: DailyLog[]): string | null {
  if (topic.isPending) return topic.pendingReason || "Marked as pending"
  if (topic.understanding === "no") return "Not understood"
  if (topic.status === "pending") return "Status is pending"

  // Taught today but not completed
  const todayStr = format(new Date(), "yyyy-MM-dd")
  const todayLogs = dailyLogs.filter(
    (l) => l.date === todayStr && l.topicId === topic.id && l.status !== "completed"
  )
  if (todayLogs.length > 0) return "Taught today but not completed"

  // Low mastery and has been studied before
  if (topic.masteryLevel <= 2 && topic.masteryLevel > 0 && topic.lastStudiedAt) {
    return "Low mastery (needs more practice)"
  }

  // Missed revision date
  if (topic.nextRevisionAt) {
    const revDate = startOfDay(new Date(topic.nextRevisionAt))
    if (isBefore(revDate, startOfDay(new Date()))) {
      return "Missed revision date"
    }
  }

  return null
}

/**
 * Get all effectively pending topics (using auto-detection logic).
 */
export function getEffectivePendingTopics(topics: Topic[], dailyLogs: DailyLog[]): (Topic & { detectedReason: string })[] {
  const results: (Topic & { detectedReason: string })[] = []
  const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }

  for (const topic of topics) {
    const reason = detectPendingReason(topic, dailyLogs)
    if (reason) {
      results.push({ ...topic, detectedReason: reason })
    }
  }

  return results.sort((a, b) => (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3))
}

/**
 * Calculate how many days a topic has been pending.
 */
export function getDaysPending(topic: Topic): number {
  const dateRef = topic.dateTaughtCollege || topic.dateTaughtTuition || topic.dateStudiedSelf || topic.createdAt
  if (!dateRef) return 0
  return differenceInDays(new Date(), new Date(dateRef))
}

/**
 * Get the primary source of a topic.
 */
export function getTopicSource(topic: Topic): "college" | "tuition" | "self-study" {
  if (topic.dateTaughtTuition) return "tuition"
  if (topic.dateTaughtCollege) return "college"
  return "self-study"
}

/**
 * Get the date a topic was taught/studied.
 */
export function getTopicDate(topic: Topic): string | null {
  return topic.dateTaughtCollege || topic.dateTaughtTuition || topic.dateStudiedSelf || null
}

/**
 * Check end-of-day pending: finds topics from yesterday that were logged but not completed.
 * Auto-marks them as pending with reason "Not completed same day".
 */
export function checkEndOfDayPending(data: AppData): Topic[] {
  const yesterdayStr = format(subDays(new Date(), 1), "yyyy-MM-dd")
  const yesterdayLogs = data.dailyLogs.filter(
    (l) => l.date === yesterdayStr && l.status !== "completed"
  )

  const newlyPending: Topic[] = []
  for (const log of yesterdayLogs) {
    if (!log.topicId) continue
    const topic = data.topics.find((t) => t.id === log.topicId)
    if (topic && !topic.isPending && topic.status !== "completed") {
      newlyPending.push(topic)
    }
  }

  return newlyPending
}

/**
 * Check if today is Friday or Saturday and if a WeeklyCatchUpPlan needs to be created.
 * Returns the items that should be collected for the plan, or null if not needed.
 */
export function checkWeeklyReset(data: AppData): boolean {
  const today = new Date()
  if (!isFriday(today) && !isSaturday(today)) return false

  const weekStart = format(startOfWeek(today, { weekStartsOn: 0 }), "yyyy-MM-dd")
  const existingPlan = data.weeklyCatchUpPlans.find((p) => p.weekStartDate === weekStart)

  return !existingPlan
}

/**
 * Collect items for the weekly catch-up plan.
 */
export function collectWeeklyCatchUpItems(data: AppData): Topic[] {
  const today = startOfDay(new Date())
  const weekStart = startOfWeek(today, { weekStartsOn: 0 })

  const items: Topic[] = []
  const seen = new Set<string>()

  for (const topic of data.topics) {
    if (seen.has(topic.id)) continue

    // Pending topics from this week
    if (topic.isPending) {
      seen.add(topic.id)
      items.push(topic)
      continue
    }

    // Not understood
    if (topic.understanding === "no") {
      seen.add(topic.id)
      items.push(topic)
      continue
    }

    // Overdue revisions
    if (topic.nextRevisionAt) {
      const revDate = startOfDay(new Date(topic.nextRevisionAt))
      if (isBefore(revDate, today) && topic.status !== "completed") {
        seen.add(topic.id)
        items.push(topic)
        continue
      }
    }

    // Low mastery topics
    if (topic.masteryLevel > 0 && topic.masteryLevel <= 2 && topic.lastStudiedAt) {
      seen.add(topic.id)
      items.push(topic)
      continue
    }

    // Topics logged this week that are not completed
    const weekLogs = data.dailyLogs.filter(
      (l) => l.topicId === topic.id && !isBefore(new Date(l.date), weekStart) && l.status !== "completed"
    )
    if (weekLogs.length > 0 && topic.status !== "completed") {
      seen.add(topic.id)
      items.push(topic)
    }
  }

  return items
}

/**
 * Build a weekend plan by distributing items between Friday and Saturday.
 */
export function buildWeekendPlan(items: Topic[], subjects: { id: string; name: string; isTuitionSubject: boolean }[]): { friday: Topic[]; saturday: Topic[] } {
  const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }

  // Sort by urgency, days pending, mastery (weakest first), then time
  const sorted = [...items].sort((a, b) => {
    // Finance/Accounting get priority (tuition subjects)
    const aIsTuition = subjects.find((s) => s.id === a.subjectId)?.isTuitionSubject ? 0 : 1
    const bIsTuition = subjects.find((s) => s.id === b.subjectId)?.isTuitionSubject ? 0 : 1
    if (aIsTuition !== bIsTuition) return aIsTuition - bIsTuition

    // Priority
    const pDiff = (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3)
    if (pDiff !== 0) return pDiff

    // Days pending (oldest first)
    const aDays = getDaysPending(a)
    const bDays = getDaysPending(b)
    if (aDays !== bDays) return bDays - aDays

    // Mastery (weakest first)
    if (a.masteryLevel !== b.masteryLevel) return a.masteryLevel - b.masteryLevel

    // Time (shorter first for better distribution)
    return a.estimatedMinutes - b.estimatedMinutes
  })

  // Distribute roughly equally between Friday and Saturday
  const friday: Topic[] = []
  const saturday: Topic[] = []
  let fridayTime = 0
  let saturdayTime = 0

  for (const item of sorted) {
    if (fridayTime <= saturdayTime) {
      friday.push(item)
      fridayTime += item.estimatedMinutes || 30
    } else {
      saturday.push(item)
      saturdayTime += item.estimatedMinutes || 30
    }
  }

  return { friday, saturday }
}

/**
 * Get revision interval in days for a given mastery level.
 */
export function getRevisionInterval(mastery: number, settings: AppSettings): number {
  return settings.revisionIntervals[mastery] ?? 7
}

/**
 * Calculate next revision date after completing a revision with a given result.
 */
export function calculateRevisionAfterResult(
  currentMastery: number,
  result: "easy" | "medium" | "hard" | "forgot",
  settings: AppSettings
): { newMastery: number; nextRevisionAt: string } {
  let newMastery = currentMastery
  switch (result) {
    case "easy":
      newMastery = Math.min(5, currentMastery + 1)
      break
    case "medium":
      // stays the same
      break
    case "hard":
      newMastery = Math.max(1, currentMastery - 1)
      break
    case "forgot":
      newMastery = 1
      break
  }

  const nextRevisionAt = result === "forgot"
    ? format(addDays(new Date(), 1), "yyyy-MM-dd")
    : calculateNextRevisionDate(newMastery, settings)

  return { newMastery, nextRevisionAt }
}

/**
 * Get topics with future revision dates and high mastery (strong topics).
 */
export function getStrongTopics(topics: Topic[]): Topic[] {
  const today = startOfDay(new Date())
  return topics.filter((t) => {
    if (!t.nextRevisionAt) return false
    if (t.masteryLevel < 4) return false
    const revDate = startOfDay(new Date(t.nextRevisionAt))
    return isAfter(revDate, today)
  })
}

/**
 * Get weak topics (mastery 1-2 that have been studied).
 */
export function getWeakTopics(topics: Topic[]): Topic[] {
  return topics.filter((t) => t.masteryLevel >= 1 && t.masteryLevel <= 2 && t.lastStudiedAt)
}
