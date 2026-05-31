import { useEffect } from "react"
import { format, startOfWeek, endOfWeek } from "date-fns"
import { useData } from "@/context/DataContext"
import { checkEndOfDayPending, checkWeeklyReset, collectWeeklyCatchUpItems, buildWeekendPlan, generateId } from "@/lib/studyLogic"

const LAST_EOD_CHECK_KEY = "study-cc-last-eod-check"
const LAST_WEEKLY_CHECK_KEY = "study-cc-last-weekly-check"

/**
 * AutoChecks runs on app initialization to perform:
 * 1. End-of-day auto-pending check (marks yesterday's incomplete topics as pending)
 * 2. Weekly reset logic (creates a WeeklyCatchUpPlan on Friday/Saturday)
 */
export function AutoChecks() {
  const { data, updateTopic, addWeeklyCatchUpPlan, getSubjects } = useData()
  const subjects = getSubjects()

  useEffect(() => {
    const todayStr = format(new Date(), "yyyy-MM-dd")

    // End-of-day pending check - run once per day
    const lastEodCheck = localStorage.getItem(LAST_EOD_CHECK_KEY)
    if (lastEodCheck !== todayStr) {
      const newlyPending = checkEndOfDayPending(data)
      for (const topic of newlyPending) {
        updateTopic(topic.id, {
          isPending: true,
          pendingReason: "Not completed same day",
        })
      }
      localStorage.setItem(LAST_EOD_CHECK_KEY, todayStr)
    }

    // Weekly reset check - run once per day
    const lastWeeklyCheck = localStorage.getItem(LAST_WEEKLY_CHECK_KEY)
    if (lastWeeklyCheck !== todayStr) {
      const needsPlan = checkWeeklyReset(data)
      if (needsPlan) {
        const items = collectWeeklyCatchUpItems(data)
        const plan = buildWeekendPlan(items, subjects)
        const today = new Date()
        const weekStart = format(startOfWeek(today, { weekStartsOn: 0 }), "yyyy-MM-dd")
        const weekEnd = format(endOfWeek(today, { weekStartsOn: 0 }), "yyyy-MM-dd")

        addWeeklyCatchUpPlan({
          id: generateId("wcp"),
          weekStartDate: weekStart,
          weekEndDate: weekEnd,
          fridayTasks: plan.friday.map((t) => t.id),
          saturdayTasks: plan.saturday.map((t) => t.id),
          completedTasks: [],
          createdAt: new Date().toISOString(),
        })
      }
      localStorage.setItem(LAST_WEEKLY_CHECK_KEY, todayStr)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
