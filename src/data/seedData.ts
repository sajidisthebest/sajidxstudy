import type { AppData } from "@/types"

const now = new Date().toISOString()
const today = new Date().toISOString().split("T")[0]
const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]
const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split("T")[0]
const threeDaysFromNow = new Date(Date.now() + 259200000).toISOString().split("T")[0]
const oneWeekFromNow = new Date(Date.now() + 604800000).toISOString().split("T")[0]
const twoWeeksFromNow = new Date(Date.now() + 1209600000).toISOString().split("T")[0]

export const seedData: AppData = {
  subjects: [
    { id: "sub-1", name: "Bangla 1st Paper", color: "emerald", category: "commerce", isTuitionSubject: false, createdAt: now },
    { id: "sub-2", name: "Bangla 2nd Paper", color: "lime", category: "commerce", isTuitionSubject: false, createdAt: now },
    { id: "sub-3", name: "English 1st Paper", color: "sky", category: "commerce", isTuitionSubject: false, createdAt: now },
    { id: "sub-4", name: "English 2nd Paper", color: "cyan", category: "commerce", isTuitionSubject: false, createdAt: now },
    { id: "sub-5", name: "Finance", color: "blue", category: "commerce", isTuitionSubject: true, createdAt: now },
    { id: "sub-6", name: "Management", color: "violet", category: "commerce", isTuitionSubject: false, createdAt: now },
    { id: "sub-7", name: "Marketing", color: "pink", category: "commerce", isTuitionSubject: false, createdAt: now },
    { id: "sub-8", name: "Accounting", color: "purple", category: "commerce", isTuitionSubject: true, createdAt: now },
    { id: "sub-9", name: "ICT", color: "amber", category: "commerce", isTuitionSubject: false, createdAt: now },
  ],
  chapters: [
    // Bangla 1st Paper
    { id: "ch-1", subjectId: "sub-1", title: "Golpo - Bohipeer", status: "learning", completionPercentage: 40, masteryLevel: 3, lastStudiedAt: yesterday, nextRevisionAt: threeDaysFromNow, createdAt: now, updatedAt: now },
    { id: "ch-2", subjectId: "sub-1", title: "Kobita - Sonar Tori", status: "not-started", completionPercentage: 0, masteryLevel: 0, lastStudiedAt: null, nextRevisionAt: null, createdAt: now, updatedAt: now },
    // Bangla 2nd Paper
    { id: "ch-3", subjectId: "sub-2", title: "Banan o Uddharon", status: "partially-done", completionPercentage: 60, masteryLevel: 4, lastStudiedAt: twoDaysAgo, nextRevisionAt: oneWeekFromNow, createdAt: now, updatedAt: now },
    { id: "ch-4", subjectId: "sub-2", title: "Rochona", status: "not-started", completionPercentage: 0, masteryLevel: 0, lastStudiedAt: null, nextRevisionAt: null, createdAt: now, updatedAt: now },
    // English 1st Paper
    { id: "ch-5", subjectId: "sub-3", title: "Reading Comprehension", status: "learning", completionPercentage: 50, masteryLevel: 4, lastStudiedAt: yesterday, nextRevisionAt: oneWeekFromNow, createdAt: now, updatedAt: now },
    { id: "ch-6", subjectId: "sub-3", title: "Cloze Test", status: "not-started", completionPercentage: 0, masteryLevel: 0, lastStudiedAt: null, nextRevisionAt: null, createdAt: now, updatedAt: now },
    // English 2nd Paper
    { id: "ch-7", subjectId: "sub-4", title: "Grammar - Tenses", status: "completed", completionPercentage: 100, masteryLevel: 5, lastStudiedAt: twoDaysAgo, nextRevisionAt: twoWeeksFromNow, createdAt: now, updatedAt: now },
    { id: "ch-8", subjectId: "sub-4", title: "Grammar - Voice Change", status: "learning", completionPercentage: 30, masteryLevel: 2, lastStudiedAt: yesterday, nextRevisionAt: threeDaysFromNow, createdAt: now, updatedAt: now },
    // Finance
    { id: "ch-9", subjectId: "sub-5", title: "Time Value of Money", status: "learning", completionPercentage: 70, masteryLevel: 4, lastStudiedAt: yesterday, nextRevisionAt: threeDaysFromNow, createdAt: now, updatedAt: now },
    { id: "ch-10", subjectId: "sub-5", title: "Capital Budgeting", status: "not-started", completionPercentage: 0, masteryLevel: 0, lastStudiedAt: null, nextRevisionAt: null, createdAt: now, updatedAt: now },
    { id: "ch-11", subjectId: "sub-5", title: "Risk and Return", status: "partially-done", completionPercentage: 45, masteryLevel: 3, lastStudiedAt: twoDaysAgo, nextRevisionAt: oneWeekFromNow, createdAt: now, updatedAt: now },
    // Management
    { id: "ch-12", subjectId: "sub-6", title: "Planning", status: "completed", completionPercentage: 100, masteryLevel: 5, lastStudiedAt: twoDaysAgo, nextRevisionAt: twoWeeksFromNow, createdAt: now, updatedAt: now },
    { id: "ch-13", subjectId: "sub-6", title: "Organizing", status: "learning", completionPercentage: 35, masteryLevel: 3, lastStudiedAt: yesterday, nextRevisionAt: oneWeekFromNow, createdAt: now, updatedAt: now },
    // Marketing
    { id: "ch-14", subjectId: "sub-7", title: "Marketing Mix (4Ps)", status: "partially-done", completionPercentage: 55, masteryLevel: 3, lastStudiedAt: twoDaysAgo, nextRevisionAt: oneWeekFromNow, createdAt: now, updatedAt: now },
    { id: "ch-15", subjectId: "sub-7", title: "Consumer Behavior", status: "not-started", completionPercentage: 0, masteryLevel: 0, lastStudiedAt: null, nextRevisionAt: null, createdAt: now, updatedAt: now },
    // Accounting
    { id: "ch-16", subjectId: "sub-8", title: "Journal Entries", status: "completed", completionPercentage: 100, masteryLevel: 5, lastStudiedAt: twoDaysAgo, nextRevisionAt: twoWeeksFromNow, createdAt: now, updatedAt: now },
    { id: "ch-17", subjectId: "sub-8", title: "Trial Balance", status: "learning", completionPercentage: 60, masteryLevel: 4, lastStudiedAt: yesterday, nextRevisionAt: threeDaysFromNow, createdAt: now, updatedAt: now },
    { id: "ch-18", subjectId: "sub-8", title: "Financial Statements", status: "not-started", completionPercentage: 0, masteryLevel: 0, lastStudiedAt: null, nextRevisionAt: null, createdAt: now, updatedAt: now },
    // ICT
    { id: "ch-19", subjectId: "sub-9", title: "Database Management", status: "learning", completionPercentage: 40, masteryLevel: 3, lastStudiedAt: yesterday, nextRevisionAt: oneWeekFromNow, createdAt: now, updatedAt: now },
    { id: "ch-20", subjectId: "sub-9", title: "Web Development", status: "not-started", completionPercentage: 0, masteryLevel: 0, lastStudiedAt: null, nextRevisionAt: null, createdAt: now, updatedAt: now },
  ],
  topics: [
    // Finance - Time Value of Money topics
    { id: "top-1", subjectId: "sub-5", chapterId: "ch-9", title: "Present Value Calculation", status: "completed", understanding: "yes", masteryLevel: 5, priority: "high", collegeStatus: "completed", tuitionStatus: "completed", selfStudyStatus: "completed", dateTaughtCollege: twoDaysAgo, dateTaughtTuition: twoDaysAgo, dateStudiedSelf: yesterday, lastStudiedAt: yesterday, lastRevisedAt: yesterday, nextRevisionAt: oneWeekFromNow, isPending: false, pendingReason: null, confusionNote: null, estimatedMinutes: 30, actualMinutes: 25, tags: ["math", "important"], createdAt: now, updatedAt: now },
    { id: "top-2", subjectId: "sub-5", chapterId: "ch-9", title: "Future Value and Compounding", status: "learning", understanding: "somewhat", masteryLevel: 3, priority: "high", collegeStatus: "completed", tuitionStatus: "learning", selfStudyStatus: "not-started", dateTaughtCollege: twoDaysAgo, dateTaughtTuition: yesterday, dateStudiedSelf: null, lastStudiedAt: yesterday, lastRevisedAt: null, nextRevisionAt: threeDaysFromNow, isPending: false, pendingReason: null, confusionNote: "Confused about continuous compounding formula", estimatedMinutes: 45, actualMinutes: 30, tags: ["math", "formulas"], createdAt: now, updatedAt: now },
    { id: "top-3", subjectId: "sub-5", chapterId: "ch-9", title: "Annuity Calculations", status: "pending", understanding: null, masteryLevel: 0, priority: "medium", collegeStatus: "not-started", tuitionStatus: "not-started", selfStudyStatus: "not-started", dateTaughtCollege: null, dateTaughtTuition: null, dateStudiedSelf: null, lastStudiedAt: null, lastRevisedAt: null, nextRevisionAt: null, isPending: true, pendingReason: "Not taught yet in college", confusionNote: null, estimatedMinutes: 60, actualMinutes: 0, tags: ["math"], createdAt: now, updatedAt: now },
    { id: "top-4", subjectId: "sub-5", chapterId: "ch-9", title: "Net Present Value (NPV)", status: "not-started", understanding: null, masteryLevel: 0, priority: "high", collegeStatus: "not-started", tuitionStatus: "not-started", selfStudyStatus: "not-started", dateTaughtCollege: null, dateTaughtTuition: null, dateStudiedSelf: null, lastStudiedAt: null, lastRevisedAt: null, nextRevisionAt: null, isPending: false, pendingReason: null, confusionNote: null, estimatedMinutes: 45, actualMinutes: 0, tags: ["important", "exam"], createdAt: now, updatedAt: now },
    // Accounting - Trial Balance topics
    { id: "top-5", subjectId: "sub-8", chapterId: "ch-17", title: "Preparing Trial Balance", status: "completed", understanding: "yes", masteryLevel: 5, priority: "high", collegeStatus: "completed", tuitionStatus: "completed", selfStudyStatus: "completed", dateTaughtCollege: twoDaysAgo, dateTaughtTuition: twoDaysAgo, dateStudiedSelf: yesterday, lastStudiedAt: yesterday, lastRevisedAt: yesterday, nextRevisionAt: oneWeekFromNow, isPending: false, pendingReason: null, confusionNote: null, estimatedMinutes: 40, actualMinutes: 35, tags: ["practical"], createdAt: now, updatedAt: now },
    { id: "top-6", subjectId: "sub-8", chapterId: "ch-17", title: "Error Detection in Trial Balance", status: "learning", understanding: "somewhat", masteryLevel: 3, priority: "medium", collegeStatus: "completed", tuitionStatus: "learning", selfStudyStatus: "not-started", dateTaughtCollege: yesterday, dateTaughtTuition: null, dateStudiedSelf: null, lastStudiedAt: yesterday, lastRevisedAt: null, nextRevisionAt: threeDaysFromNow, isPending: false, pendingReason: null, confusionNote: "Need to practice more examples of one-sided errors", estimatedMinutes: 50, actualMinutes: 20, tags: ["practical", "tricky"], createdAt: now, updatedAt: now },
    { id: "top-7", subjectId: "sub-8", chapterId: "ch-17", title: "Suspense Account", status: "pending", understanding: null, masteryLevel: 0, priority: "low", collegeStatus: "not-started", tuitionStatus: "not-started", selfStudyStatus: "not-started", dateTaughtCollege: null, dateTaughtTuition: null, dateStudiedSelf: null, lastStudiedAt: null, lastRevisedAt: null, nextRevisionAt: null, isPending: true, pendingReason: "Will be covered next week", confusionNote: null, estimatedMinutes: 30, actualMinutes: 0, tags: [], createdAt: now, updatedAt: now },
    // Management - Organizing topics
    { id: "top-8", subjectId: "sub-6", chapterId: "ch-13", title: "Organizational Structure Types", status: "completed", understanding: "yes", masteryLevel: 4, priority: "medium", collegeStatus: "completed", tuitionStatus: "not-started", selfStudyStatus: "completed", dateTaughtCollege: twoDaysAgo, dateTaughtTuition: null, dateStudiedSelf: yesterday, lastStudiedAt: yesterday, lastRevisedAt: null, nextRevisionAt: oneWeekFromNow, isPending: false, pendingReason: null, confusionNote: null, estimatedMinutes: 30, actualMinutes: 25, tags: ["theory"], createdAt: now, updatedAt: now },
    { id: "top-9", subjectId: "sub-6", chapterId: "ch-13", title: "Delegation of Authority", status: "learning", understanding: "somewhat", masteryLevel: 2, priority: "medium", collegeStatus: "learning", tuitionStatus: "not-started", selfStudyStatus: "not-started", dateTaughtCollege: yesterday, dateTaughtTuition: null, dateStudiedSelf: null, lastStudiedAt: yesterday, lastRevisedAt: null, nextRevisionAt: threeDaysFromNow, isPending: false, pendingReason: null, confusionNote: null, estimatedMinutes: 25, actualMinutes: 15, tags: ["theory"], createdAt: now, updatedAt: now },
    { id: "top-10", subjectId: "sub-6", chapterId: "ch-13", title: "Centralization vs Decentralization", status: "not-started", understanding: null, masteryLevel: 0, priority: "low", collegeStatus: "not-started", tuitionStatus: "not-started", selfStudyStatus: "not-started", dateTaughtCollege: null, dateTaughtTuition: null, dateStudiedSelf: null, lastStudiedAt: null, lastRevisedAt: null, nextRevisionAt: null, isPending: false, pendingReason: null, confusionNote: null, estimatedMinutes: 20, actualMinutes: 0, tags: ["theory"], createdAt: now, updatedAt: now },
    // English 2nd Paper - Voice Change topics
    { id: "top-11", subjectId: "sub-4", chapterId: "ch-8", title: "Active to Passive Voice", status: "learning", understanding: "somewhat", masteryLevel: 3, priority: "high", collegeStatus: "completed", tuitionStatus: "not-started", selfStudyStatus: "learning", dateTaughtCollege: twoDaysAgo, dateTaughtTuition: null, dateStudiedSelf: yesterday, lastStudiedAt: yesterday, lastRevisedAt: null, nextRevisionAt: threeDaysFromNow, isPending: false, pendingReason: null, confusionNote: "Complex sentences with modals", estimatedMinutes: 30, actualMinutes: 20, tags: ["grammar"], createdAt: now, updatedAt: now },
    { id: "top-12", subjectId: "sub-4", chapterId: "ch-8", title: "Passive to Active Voice", status: "not-started", understanding: null, masteryLevel: 0, priority: "medium", collegeStatus: "not-started", tuitionStatus: "not-started", selfStudyStatus: "not-started", dateTaughtCollege: null, dateTaughtTuition: null, dateStudiedSelf: null, lastStudiedAt: null, lastRevisedAt: null, nextRevisionAt: null, isPending: false, pendingReason: null, confusionNote: null, estimatedMinutes: 25, actualMinutes: 0, tags: ["grammar"], createdAt: now, updatedAt: now },
    // ICT - Database Management topics
    { id: "top-13", subjectId: "sub-9", chapterId: "ch-19", title: "SQL Basics", status: "learning", understanding: "yes", masteryLevel: 4, priority: "medium", collegeStatus: "completed", tuitionStatus: "not-started", selfStudyStatus: "learning", dateTaughtCollege: twoDaysAgo, dateTaughtTuition: null, dateStudiedSelf: yesterday, lastStudiedAt: yesterday, lastRevisedAt: null, nextRevisionAt: oneWeekFromNow, isPending: false, pendingReason: null, confusionNote: null, estimatedMinutes: 40, actualMinutes: 35, tags: ["practical", "coding"], createdAt: now, updatedAt: now },
    { id: "top-14", subjectId: "sub-9", chapterId: "ch-19", title: "Normalization", status: "pending", understanding: null, masteryLevel: 0, priority: "medium", collegeStatus: "not-started", tuitionStatus: "not-started", selfStudyStatus: "not-started", dateTaughtCollege: null, dateTaughtTuition: null, dateStudiedSelf: null, lastStudiedAt: null, lastRevisedAt: null, nextRevisionAt: null, isPending: true, pendingReason: "Need to understand ER diagrams first", confusionNote: null, estimatedMinutes: 50, actualMinutes: 0, tags: ["theory", "tricky"], createdAt: now, updatedAt: now },
    { id: "top-15", subjectId: "sub-9", chapterId: "ch-19", title: "ER Diagrams", status: "needs-revision", understanding: "somewhat", masteryLevel: 2, priority: "high", collegeStatus: "completed", tuitionStatus: "not-started", selfStudyStatus: "not-started", dateTaughtCollege: twoDaysAgo, dateTaughtTuition: null, dateStudiedSelf: null, lastStudiedAt: twoDaysAgo, lastRevisedAt: null, nextRevisionAt: today, isPending: false, pendingReason: null, confusionNote: "Confused about many-to-many relationships", estimatedMinutes: 35, actualMinutes: 15, tags: ["diagrams"], createdAt: now, updatedAt: now },
  ],
  dailyLogs: [
    { id: "log-1", date: yesterday, subjectId: "sub-5", chapterId: "ch-9", topicId: "top-1", topicTitle: "Present Value Calculation", source: "tuition", understood: "yes", status: "completed", quickNote: "Solved 5 practice problems", createdAt: now },
    { id: "log-2", date: yesterday, subjectId: "sub-5", chapterId: "ch-9", topicId: "top-2", topicTitle: "Future Value and Compounding", source: "tuition", understood: "somewhat", status: "need-to-study-tonight", quickNote: "Need to review continuous compounding", createdAt: now },
    { id: "log-3", date: yesterday, subjectId: "sub-8", chapterId: "ch-17", topicId: "top-5", topicTitle: "Preparing Trial Balance", source: "college", understood: "yes", status: "completed", quickNote: "Practiced full trial balance preparation", createdAt: now },
    { id: "log-4", date: yesterday, subjectId: "sub-6", chapterId: "ch-13", topicId: "top-9", topicTitle: "Delegation of Authority", source: "college", understood: "somewhat", status: "pending", quickNote: "Need to read textbook chapter again", createdAt: now },
    { id: "log-5", date: today, subjectId: "sub-4", chapterId: "ch-8", topicId: "top-11", topicTitle: "Active to Passive Voice", source: "self-study", understood: "somewhat", status: "need-to-study-tonight", quickNote: "Modal verbs in passive are tricky", createdAt: now },
  ],
  studyTasks: [
    { id: "task-1", date: today, topicId: "top-2", topicTitle: "Future Value and Compounding", subjectId: "sub-5", chapterId: "ch-9", source: "self-study", taskType: "revision", status: "not-started", priority: "high", estimatedMinutes: 30, completedAt: null, createdAt: now },
    { id: "task-2", date: today, topicId: "top-6", topicTitle: "Error Detection in Trial Balance", subjectId: "sub-8", chapterId: "ch-17", source: "tuition", taskType: "tuition-topic", status: "studying", priority: "medium", estimatedMinutes: 45, completedAt: null, createdAt: now },
    { id: "task-3", date: today, topicId: "top-11", topicTitle: "Active to Passive Voice", subjectId: "sub-4", chapterId: "ch-8", source: "self-study", taskType: "self-study", status: "not-started", priority: "high", estimatedMinutes: 30, completedAt: null, createdAt: now },
    { id: "task-4", date: today, topicId: "top-15", topicTitle: "ER Diagrams", subjectId: "sub-9", chapterId: "ch-19", source: "self-study", taskType: "revision", status: "not-started", priority: "high", estimatedMinutes: 35, completedAt: null, createdAt: now },
  ],
  revisionRecords: [
    { id: "rev-1", topicId: "top-1", revisedAt: yesterday, result: "easy", previousMastery: 4, newMastery: 5, nextRevisionAt: oneWeekFromNow, note: "Solid understanding now" },
    { id: "rev-2", topicId: "top-5", revisedAt: yesterday, result: "medium", previousMastery: 4, newMastery: 5, nextRevisionAt: oneWeekFromNow, note: "Good but need more practice with complex examples" },
  ],
  calendarEvents: [
    { id: "cal-1", title: "Finance - Annuity Calculations", date: threeDaysFromNow, type: "college", linkedTopicId: "top-3", linkedTaskId: null, subjectId: "sub-1", status: "scheduled", note: "" },
    { id: "cal-2", title: "Revision: Future Value", date: threeDaysFromNow, type: "revision", linkedTopicId: "top-2", linkedTaskId: null, subjectId: "sub-1", status: "scheduled", note: "" },
    { id: "cal-3", title: "Accounting Assignment Due", date: oneWeekFromNow, type: "assignment", linkedTopicId: null, linkedTaskId: null, subjectId: "sub-2", status: "scheduled", note: "Submit before 5pm" },
  ],
  weeklyCatchUpPlans: [],
  todos: [
    { id: "todo-1", title: "Review Finance chapter 9 notes", description: "Go through Time Value of Money examples", dueDate: today, priority: "high", category: "Study", completed: false, completedAt: null, createdAt: now, updatedAt: now },
    { id: "todo-2", title: "Submit Accounting assignment", description: "Trial Balance exercise from textbook page 145", dueDate: today, priority: "urgent", category: "Assignment", completed: false, completedAt: null, createdAt: now, updatedAt: now },
    { id: "todo-3", title: "Buy new notebook for ICT", description: "", dueDate: today, priority: "low", category: "Errand", completed: true, completedAt: now, createdAt: now, updatedAt: now },
    { id: "todo-4", title: "Practice SQL queries", description: "Complete exercises 1-10 from database chapter", dueDate: threeDaysFromNow, priority: "medium", category: "Study", completed: false, completedAt: null, createdAt: now, updatedAt: now },
    { id: "todo-5", title: "Read Marketing chapter on Consumer Behavior", description: "Prepare for next week class", dueDate: oneWeekFromNow, priority: "medium", category: "Study", completed: false, completedAt: null, createdAt: now, updatedAt: now },
    { id: "todo-6", title: "Call tuition teacher about schedule change", description: "", dueDate: yesterday, priority: "high", category: "Personal", completed: false, completedAt: null, createdAt: now, updatedAt: now },
  ],
  settings: {
    theme: "light",
    revisionIntervals: { 1: 1, 2: 3, 3: 7, 4: 14, 5: 30 },
    weeklyCatchUpDays: ["friday", "saturday"],
    dailyStudyTargetHours: 4,
    viewPreferences: {},
  },
}
