// Enums
export type StudySource = 'college' | 'tuition' | 'self-study';
export type ChapterStatus = 'not-started' | 'learning' | 'partially-done' | 'completed' | 'needs-revision' | 'weak';
export type TopicStatus = 'not-started' | 'learning' | 'completed' | 'pending' | 'needs-revision';
export type Understanding = 'yes' | 'somewhat' | 'no';
export type LogStatus = 'completed' | 'need-to-study-tonight' | 'pending';
export type TaskStatus = 'not-started' | 'studying' | 'need-help' | 'pending' | 'completed';
export type TaskType = 'college-topic' | 'tuition-topic' | 'self-study' | 'revision' | 'homework' | 'overdue-pending';
export type RevisionResult = 'easy' | 'medium' | 'hard' | 'forgot';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type CalendarEventType = 'college' | 'tuition' | 'self-study' | 'revision' | 'assignment' | 'catch-up' | 'completed';

// Data models
export interface Subject {
  id: string;
  name: string;
  color: string;
  category: 'commerce';
  isTuitionSubject: boolean;
  createdAt: string;
}

export interface Chapter {
  id: string;
  subjectId: string;
  title: string;
  status: ChapterStatus;
  completionPercentage: number;
  masteryLevel: number;
  lastStudiedAt: string | null;
  nextRevisionAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Topic {
  id: string;
  subjectId: string;
  chapterId: string;
  title: string;
  status: TopicStatus;
  understanding: Understanding | null;
  masteryLevel: number;
  priority: Priority;
  collegeStatus: TopicStatus;
  tuitionStatus: TopicStatus;
  selfStudyStatus: TopicStatus;
  dateTaughtCollege: string | null;
  dateTaughtTuition: string | null;
  dateStudiedSelf: string | null;
  lastStudiedAt: string | null;
  lastRevisedAt: string | null;
  nextRevisionAt: string | null;
  isPending: boolean;
  pendingReason: string | null;
  confusionNote: string | null;
  estimatedMinutes: number;
  actualMinutes: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DailyLog {
  id: string;
  date: string;
  subjectId: string;
  chapterId: string;
  topicId: string | null;
  topicTitle: string;
  source: StudySource;
  understood: Understanding;
  status: LogStatus;
  quickNote: string;
  advancedData?: {
    teacher?: string;
    pageNumber?: string;
    lectureNumber?: string;
    difficulty?: number;
    priority?: Priority;
    estimatedMinutes?: number;
    actualMinutes?: number;
    reasonPending?: string;
    confusionDetails?: string;
    resourcesNeeded?: string;
    assignmentDeadline?: string;
    examImportance?: number;
    masteryLevel?: number;
    nextRevisionDate?: string;
    attachedLink?: string;
    tags?: string[];
  };
  createdAt: string;
}

export interface StudyTask {
  id: string;
  date: string;
  topicId: string | null;
  topicTitle: string;
  subjectId: string;
  chapterId: string;
  source: StudySource;
  taskType: TaskType;
  status: TaskStatus;
  priority: Priority;
  estimatedMinutes: number;
  completedAt: string | null;
  createdAt: string;
}

export interface RevisionRecord {
  id: string;
  topicId: string;
  revisedAt: string;
  result: RevisionResult;
  previousMastery: number;
  newMastery: number;
  nextRevisionAt: string;
  note: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: CalendarEventType;
  linkedTopicId: string | null;
  linkedTaskId: string | null;
  subjectId: string | null;
  status: 'scheduled' | 'completed' | 'missed';
  note: string;
}

export interface WeeklyCatchUpPlan {
  id: string;
  weekStartDate: string;
  weekEndDate: string;
  fridayTasks: string[];
  saturdayTasks: string[];
  completedTasks: string[];
  createdAt: string;
}

export interface AppData {
  subjects: Subject[];
  chapters: Chapter[];
  topics: Topic[];
  dailyLogs: DailyLog[];
  studyTasks: StudyTask[];
  revisionRecords: RevisionRecord[];
  calendarEvents: CalendarEvent[];
  weeklyCatchUpPlans: WeeklyCatchUpPlan[];
  settings: AppSettings;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  revisionIntervals: Record<number, number>;
  weeklyCatchUpDays: string[];
  dailyStudyTargetHours: number;
  viewPreferences: Record<string, 'list' | 'board'>;
}
