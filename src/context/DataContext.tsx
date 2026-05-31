import { createContext, useContext, useCallback, type ReactNode } from "react"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { seedData } from "@/data/seedData"
import type {
  AppData,
  AppSettings,
  Subject,
  Chapter,
  Topic,
  DailyLog,
  StudyTask,
  RevisionRecord,
  CalendarEvent,
  WeeklyCatchUpPlan,
  Todo,
} from "@/types"

interface DataContextType {
  data: AppData
  // Subjects
  getSubjects: () => Subject[]
  addSubject: (subject: Subject) => void
  updateSubject: (id: string, updates: Partial<Subject>) => void
  deleteSubject: (id: string) => void
  // Chapters
  getChapters: (subjectId?: string) => Chapter[]
  addChapter: (chapter: Chapter) => void
  updateChapter: (id: string, updates: Partial<Chapter>) => void
  deleteChapter: (id: string) => void
  // Topics
  getTopics: (chapterId?: string) => Topic[]
  addTopic: (topic: Topic) => void
  updateTopic: (id: string, updates: Partial<Topic>) => void
  deleteTopic: (id: string) => void
  // Daily Logs
  getDailyLogs: (date?: string) => DailyLog[]
  addDailyLog: (log: DailyLog) => void
  updateDailyLog: (id: string, updates: Partial<DailyLog>) => void
  deleteDailyLog: (id: string) => void
  // Study Tasks
  getStudyTasks: (date?: string) => StudyTask[]
  addStudyTask: (task: StudyTask) => void
  updateStudyTask: (id: string, updates: Partial<StudyTask>) => void
  deleteStudyTask: (id: string) => void
  // Revision Records
  getRevisionRecords: (topicId?: string) => RevisionRecord[]
  addRevisionRecord: (record: RevisionRecord) => void
  // Calendar Events
  getCalendarEvents: (date?: string) => CalendarEvent[]
  addCalendarEvent: (event: CalendarEvent) => void
  updateCalendarEvent: (id: string, updates: Partial<CalendarEvent>) => void
  deleteCalendarEvent: (id: string) => void
  // Weekly Catch-Up Plans
  getWeeklyCatchUpPlans: () => WeeklyCatchUpPlan[]
  addWeeklyCatchUpPlan: (plan: WeeklyCatchUpPlan) => void
  updateWeeklyCatchUpPlan: (id: string, updates: Partial<WeeklyCatchUpPlan>) => void
  // Todos
  getTodos: () => Todo[]
  addTodo: (todo: Todo) => void
  updateTodo: (id: string, updates: Partial<Todo>) => void
  deleteTodo: (id: string) => void
  toggleTodo: (id: string) => void
  // Settings
  getSettings: () => AppSettings
  updateSettings: (updates: Partial<AppSettings>) => void
}

const DataContext = createContext<DataContextType | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useLocalStorage<AppData>("study-command-center-data", seedData)

  // Subjects
  const getSubjects = useCallback(() => data.subjects, [data.subjects])
  const addSubject = useCallback((subject: Subject) => {
    setData((prev) => ({ ...prev, subjects: [...prev.subjects, subject] }))
  }, [setData])
  const updateSubject = useCallback((id: string, updates: Partial<Subject>) => {
    setData((prev) => ({
      ...prev,
      subjects: prev.subjects.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }))
  }, [setData])
  const deleteSubject = useCallback((id: string) => {
    setData((prev) => ({ ...prev, subjects: prev.subjects.filter((s) => s.id !== id) }))
  }, [setData])

  // Chapters
  const getChapters = useCallback((subjectId?: string) => {
    if (subjectId) return data.chapters.filter((c) => c.subjectId === subjectId)
    return data.chapters
  }, [data.chapters])
  const addChapter = useCallback((chapter: Chapter) => {
    setData((prev) => ({ ...prev, chapters: [...prev.chapters, chapter] }))
  }, [setData])
  const updateChapter = useCallback((id: string, updates: Partial<Chapter>) => {
    setData((prev) => ({
      ...prev,
      chapters: prev.chapters.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }))
  }, [setData])
  const deleteChapter = useCallback((id: string) => {
    setData((prev) => ({ ...prev, chapters: prev.chapters.filter((c) => c.id !== id) }))
  }, [setData])

  // Topics
  const getTopics = useCallback((chapterId?: string) => {
    if (chapterId) return data.topics.filter((t) => t.chapterId === chapterId)
    return data.topics
  }, [data.topics])
  const addTopic = useCallback((topic: Topic) => {
    setData((prev) => ({ ...prev, topics: [...prev.topics, topic] }))
  }, [setData])
  const updateTopic = useCallback((id: string, updates: Partial<Topic>) => {
    setData((prev) => ({
      ...prev,
      topics: prev.topics.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }))
  }, [setData])
  const deleteTopic = useCallback((id: string) => {
    setData((prev) => ({ ...prev, topics: prev.topics.filter((t) => t.id !== id) }))
  }, [setData])

  // Daily Logs
  const getDailyLogs = useCallback((date?: string) => {
    if (date) return data.dailyLogs.filter((l) => l.date === date)
    return data.dailyLogs
  }, [data.dailyLogs])
  const addDailyLog = useCallback((log: DailyLog) => {
    setData((prev) => ({ ...prev, dailyLogs: [...prev.dailyLogs, log] }))
  }, [setData])
  const updateDailyLog = useCallback((id: string, updates: Partial<DailyLog>) => {
    setData((prev) => ({
      ...prev,
      dailyLogs: prev.dailyLogs.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    }))
  }, [setData])
  const deleteDailyLog = useCallback((id: string) => {
    setData((prev) => ({ ...prev, dailyLogs: prev.dailyLogs.filter((l) => l.id !== id) }))
  }, [setData])

  // Study Tasks
  const getStudyTasks = useCallback((date?: string) => {
    if (date) return data.studyTasks.filter((t) => t.date === date)
    return data.studyTasks
  }, [data.studyTasks])
  const addStudyTask = useCallback((task: StudyTask) => {
    setData((prev) => ({ ...prev, studyTasks: [...prev.studyTasks, task] }))
  }, [setData])
  const updateStudyTask = useCallback((id: string, updates: Partial<StudyTask>) => {
    setData((prev) => ({
      ...prev,
      studyTasks: prev.studyTasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }))
  }, [setData])
  const deleteStudyTask = useCallback((id: string) => {
    setData((prev) => ({ ...prev, studyTasks: prev.studyTasks.filter((t) => t.id !== id) }))
  }, [setData])

  // Revision Records
  const getRevisionRecords = useCallback((topicId?: string) => {
    if (topicId) return data.revisionRecords.filter((r) => r.topicId === topicId)
    return data.revisionRecords
  }, [data.revisionRecords])
  const addRevisionRecord = useCallback((record: RevisionRecord) => {
    setData((prev) => ({ ...prev, revisionRecords: [...prev.revisionRecords, record] }))
  }, [setData])

  // Calendar Events
  const getCalendarEvents = useCallback((date?: string) => {
    if (date) return data.calendarEvents.filter((e) => e.date === date)
    return data.calendarEvents
  }, [data.calendarEvents])
  const addCalendarEvent = useCallback((event: CalendarEvent) => {
    setData((prev) => ({ ...prev, calendarEvents: [...prev.calendarEvents, event] }))
  }, [setData])
  const updateCalendarEvent = useCallback((id: string, updates: Partial<CalendarEvent>) => {
    setData((prev) => ({
      ...prev,
      calendarEvents: prev.calendarEvents.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }))
  }, [setData])
  const deleteCalendarEvent = useCallback((id: string) => {
    setData((prev) => ({ ...prev, calendarEvents: prev.calendarEvents.filter((e) => e.id !== id) }))
  }, [setData])

  // Weekly Catch-Up Plans
  const getWeeklyCatchUpPlans = useCallback(() => data.weeklyCatchUpPlans, [data.weeklyCatchUpPlans])
  const addWeeklyCatchUpPlan = useCallback((plan: WeeklyCatchUpPlan) => {
    setData((prev) => ({ ...prev, weeklyCatchUpPlans: [...prev.weeklyCatchUpPlans, plan] }))
  }, [setData])
  const updateWeeklyCatchUpPlan = useCallback((id: string, updates: Partial<WeeklyCatchUpPlan>) => {
    setData((prev) => ({
      ...prev,
      weeklyCatchUpPlans: prev.weeklyCatchUpPlans.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }))
  }, [setData])

  // Todos
  const getTodos = useCallback(() => data.todos ?? [], [data.todos])
  const addTodo = useCallback((todo: Todo) => {
    setData((prev) => ({ ...prev, todos: [...(prev.todos ?? []), todo] }))
  }, [setData])
  const updateTodo = useCallback((id: string, updates: Partial<Todo>) => {
    setData((prev) => ({
      ...prev,
      todos: (prev.todos ?? []).map((t) => (t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t)),
    }))
  }, [setData])
  const deleteTodo = useCallback((id: string) => {
    setData((prev) => ({ ...prev, todos: (prev.todos ?? []).filter((t) => t.id !== id) }))
  }, [setData])
  const toggleTodo = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      todos: (prev.todos ?? []).map((t) =>
        t.id === id
          ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : null, updatedAt: new Date().toISOString() }
          : t
      ),
    }))
  }, [setData])

  // Settings
  const getSettings = useCallback(() => data.settings, [data.settings])
  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setData((prev) => ({ ...prev, settings: { ...prev.settings, ...updates } }))
  }, [setData])

  const value: DataContextType = {
    data,
    getSubjects,
    addSubject,
    updateSubject,
    deleteSubject,
    getChapters,
    addChapter,
    updateChapter,
    deleteChapter,
    getTopics,
    addTopic,
    updateTopic,
    deleteTopic,
    getDailyLogs,
    addDailyLog,
    updateDailyLog,
    deleteDailyLog,
    getStudyTasks,
    addStudyTask,
    updateStudyTask,
    deleteStudyTask,
    getRevisionRecords,
    addRevisionRecord,
    getCalendarEvents,
    addCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    getWeeklyCatchUpPlans,
    addWeeklyCatchUpPlan,
    updateWeeklyCatchUpPlan,
    getTodos,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
    getSettings,
    updateSettings,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error("useData must be used within a DataProvider")
  }
  return context
}
