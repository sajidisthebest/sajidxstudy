import { useState, useMemo } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  eachDayOfInterval,
} from "date-fns"
import { ChevronLeft, ChevronRight, BookOpen, GraduationCap, Pen, RotateCcw, AlertCircle, Calendar as CalendarIcon, CheckCircle2, Plus, Pencil, Trash2 } from "lucide-react"
import { useData } from "@/context/DataContext"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { CalendarEvent, CalendarEventType } from "@/types"

interface DerivedEvent {
  id: string
  title: string
  date: string
  type: CalendarEventType
  subjectId?: string | null
  linkedTopicId?: string | null
  isManual: boolean
  status?: 'scheduled' | 'completed' | 'missed'
  note?: string
}

const eventTypeConfig: Record<CalendarEventType, { color: string; icon: typeof BookOpen; label: string }> = {
  college: { color: "bg-blue-500", icon: GraduationCap, label: "College" },
  tuition: { color: "bg-purple-500", icon: BookOpen, label: "Tuition" },
  "self-study": { color: "bg-teal-500", icon: Pen, label: "Self-Study" },
  revision: { color: "bg-orange-500", icon: RotateCcw, label: "Revision Due" },
  assignment: { color: "bg-red-500", icon: AlertCircle, label: "Assignment" },
  "catch-up": { color: "bg-yellow-500", icon: CalendarIcon, label: "Catch-Up" },
  completed: { color: "bg-green-500", icon: CheckCircle2, label: "Completed" },
}

const eventTypes: CalendarEventType[] = ["college", "tuition", "self-study", "revision", "assignment", "catch-up", "completed"]
const statusOptions: Array<'scheduled' | 'completed' | 'missed'> = ["scheduled", "completed", "missed"]

interface EventFormData {
  title: string
  date: string
  type: CalendarEventType
  subjectId: string
  status: 'scheduled' | 'completed' | 'missed'
  note: string
}

const defaultFormData: EventFormData = {
  title: "",
  date: format(new Date(), "yyyy-MM-dd"),
  type: "college",
  subjectId: "",
  status: "scheduled",
  note: "",
}

export default function Calendar() {
  const { data, addCalendarEvent, updateCalendarEvent, deleteCalendarEvent } = useData()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [formData, setFormData] = useState<EventFormData>(defaultFormData)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)

  // Derive events from existing data + manual calendar events
  const events = useMemo(() => {
    const derived: DerivedEvent[] = []

    // From manual calendar events
    for (const event of data.calendarEvents) {
      derived.push({
        id: event.id,
        title: event.title,
        date: event.date,
        type: event.type,
        subjectId: event.subjectId,
        linkedTopicId: event.linkedTopicId,
        isManual: true,
        status: event.status,
        note: event.note,
      })
    }

    // From daily logs
    for (const log of data.dailyLogs) {
      const type: CalendarEventType = log.status === "completed" ? "completed" : log.source
      derived.push({
        id: `log-${log.id}`,
        title: log.topicTitle,
        date: log.date,
        type,
        subjectId: log.subjectId,
        linkedTopicId: log.topicId,
        isManual: false,
      })
    }

    // From topics with nextRevisionAt (revision due)
    for (const topic of data.topics) {
      if (topic.nextRevisionAt) {
        derived.push({
          id: `rev-${topic.id}`,
          title: `Revise: ${topic.title}`,
          date: topic.nextRevisionAt,
          type: "revision",
          subjectId: topic.subjectId,
          linkedTopicId: topic.id,
          isManual: false,
        })
      }
    }

    // From study tasks with deadlines (assignment type)
    for (const task of data.studyTasks) {
      if (task.taskType === "homework") {
        derived.push({
          id: `task-${task.id}`,
          title: task.topicTitle,
          date: task.date,
          type: "assignment",
          subjectId: task.subjectId,
          linkedTopicId: task.topicId,
          isManual: false,
        })
      }
    }

    // From weekly catch-up plans
    for (const plan of data.weeklyCatchUpPlans) {
      derived.push({
        id: `wcp-${plan.id}`,
        title: "Weekly Catch-Up",
        date: plan.weekEndDate,
        type: "catch-up",
        isManual: false,
      })
    }

    return derived
  }, [data])

  // Calendar grid days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const start = startOfWeek(monthStart, { weekStartsOn: 0 })
    const end = endOfWeek(monthEnd, { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  // Events for a given date
  const getEventsForDate = (date: Date): DerivedEvent[] => {
    const dateStr = format(date, "yyyy-MM-dd")
    return events.filter((e) => e.date === dateStr)
  }

  // Unique event types for a date (for dots)
  const getEventTypesForDate = (date: Date): CalendarEventType[] => {
    const dayEvents = getEventsForDate(date)
    const types = new Set(dayEvents.map((e) => e.type))
    return Array.from(types)
  }

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : []

  // Open add dialog
  const openAddDialog = (date?: Date) => {
    setFormData({
      ...defaultFormData,
      date: format(date || new Date(), "yyyy-MM-dd"),
    })
    setAddDialogOpen(true)
  }

  // Open edit dialog
  const openEditDialog = (event: DerivedEvent) => {
    if (!event.isManual) return
    setEditingEventId(event.id)
    setFormData({
      title: event.title,
      date: event.date,
      type: event.type,
      subjectId: event.subjectId || "",
      status: event.status || "scheduled",
      note: event.note || "",
    })
    setEditDialogOpen(true)
  }

  // Open delete confirmation
  const openDeleteDialog = (event: DerivedEvent) => {
    if (!event.isManual) return
    setEditingEventId(event.id)
    setDeleteDialogOpen(true)
  }

  // Handle add event
  const handleAddEvent = () => {
    if (!formData.title.trim()) return

    const newEvent: CalendarEvent = {
      id: crypto.randomUUID(),
      title: formData.title.trim(),
      date: formData.date,
      type: formData.type,
      linkedTopicId: null,
      linkedTaskId: null,
      subjectId: formData.subjectId || null,
      status: formData.status,
      note: formData.note,
    }

    addCalendarEvent(newEvent)
    setAddDialogOpen(false)
    setFormData(defaultFormData)
  }

  // Handle edit event
  const handleEditEvent = () => {
    if (!editingEventId || !formData.title.trim()) return

    updateCalendarEvent(editingEventId, {
      title: formData.title.trim(),
      date: formData.date,
      type: formData.type,
      subjectId: formData.subjectId || null,
      status: formData.status,
      note: formData.note,
    })

    setEditDialogOpen(false)
    setEditingEventId(null)
    setFormData(defaultFormData)
  }

  // Handle delete event
  const handleDeleteEvent = () => {
    if (!editingEventId) return
    deleteCalendarEvent(editingEventId)
    setDeleteDialogOpen(false)
    setEditingEventId(null)
  }

  // Handle date cell click - select + open add dialog
  const handleDateClick = (day: Date) => {
    setSelectedDate(day)
  }

  const handleDateDoubleClick = (day: Date) => {
    openAddDialog(day)
  }

  // Event form component (shared between add and edit)
  const EventForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Title *</label>
        <Input
          placeholder="Event title"
          value={formData.title}
          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Date</label>
        <Input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Event Type</label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value as CalendarEventType }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select event type" />
          </SelectTrigger>
          <SelectContent>
            {eventTypes.map((type) => (
              <SelectItem key={type} value={type}>
                <div className="flex items-center gap-2">
                  <span className={cn("h-2.5 w-2.5 rounded-full", eventTypeConfig[type].color)} />
                  {eventTypeConfig[type].label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Subject (optional)</label>
        <Select
          value={formData.subjectId}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, subjectId: value === "__none__" ? "" : value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Link to subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">None</SelectItem>
            {data.subjects.map((subject) => (
              <SelectItem key={subject.id} value={subject.id}>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: subject.color }} />
                  {subject.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Status</label>
        <Select
          value={formData.status}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value as typeof formData.status }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((status) => (
              <SelectItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Notes (optional)</label>
        <Textarea
          placeholder="Add notes..."
          value={formData.note}
          onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
          rows={3}
        />
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">View your study schedule and events. Double-click a date to add an event.</p>
        </div>
        <Button onClick={() => openAddDialog(selectedDate || undefined)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Event
        </Button>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="border rounded-lg overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 bg-muted">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day) => {
            const eventTypes = getEventTypesForDate(day)
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
            const isTodayDate = isToday(day)

            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDateClick(day)}
                onDoubleClick={() => handleDateDoubleClick(day)}
                className={cn(
                  "relative min-h-[60px] md:min-h-[80px] p-1 border-t border-r text-left transition-colors hover:bg-muted/50",
                  !isCurrentMonth && "text-muted-foreground/40 bg-muted/10",
                  isSelected && "bg-primary/10 ring-2 ring-primary/50",
                  isTodayDate && !isSelected && "bg-blue-50 dark:bg-blue-950/20"
                )}
              >
                <span
                  className={cn(
                    "inline-flex items-center justify-center h-6 w-6 text-xs font-medium rounded-full",
                    isTodayDate && "bg-primary text-primary-foreground"
                  )}
                >
                  {format(day, "d")}
                </span>
                {eventTypes.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 mt-1">
                    {eventTypes.slice(0, 4).map((type) => (
                      <span
                        key={type}
                        className={cn("h-2 w-2 rounded-full", eventTypeConfig[type].color)}
                      />
                    ))}
                    {eventTypes.length > 4 && (
                      <span className="text-[9px] text-muted-foreground">+{eventTypes.length - 4}</span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {(Object.entries(eventTypeConfig) as [CalendarEventType, typeof eventTypeConfig[CalendarEventType]][]).map(([type, config]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span className={cn("h-2.5 w-2.5 rounded-full", config.color)} />
            <span className="text-muted-foreground">{config.label}</span>
          </div>
        ))}
      </div>

      {/* Selected date events */}
      {selectedDate && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">
                {format(selectedDate, "EEEE, MMMM d, yyyy")}
              </h3>
              <Button variant="outline" size="sm" className="gap-1" onClick={() => openAddDialog(selectedDate)}>
                <Plus className="h-3 w-3" />
                Add
              </Button>
            </div>
            {selectedDateEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events on this day. Click "Add" to create one.</p>
            ) : (
              <div className="space-y-2">
                {selectedDateEvents.map((event) => {
                  const config = eventTypeConfig[event.type]
                  const Icon = config.icon
                  const subject = event.subjectId ? data.subjects.find((s) => s.id === event.subjectId) : null
                  return (
                    <div
                      key={event.id}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg border",
                        event.isManual && "cursor-pointer hover:bg-muted/50"
                      )}
                      onClick={() => event.isManual && openEditDialog(event)}
                    >
                      <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0", config.color)}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{event.title}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{config.label}</Badge>
                          {subject && (
                            <span className="text-xs text-muted-foreground">{subject.name}</span>
                          )}
                          {event.isManual && event.status && (
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-xs",
                                event.status === "completed" && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                                event.status === "missed" && "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              )}
                            >
                              {event.status}
                            </Badge>
                          )}
                        </div>
                        {event.note && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">{event.note}</p>
                        )}
                      </div>
                      {event.isManual && (
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditDialog(event)
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              openDeleteDialog(event)
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Event Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Event</DialogTitle>
            <DialogDescription>Create a new calendar event.</DialogDescription>
          </DialogHeader>
          <EventForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddEvent} disabled={!formData.title.trim()}>
              Add Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>Modify the event details.</DialogDescription>
          </DialogHeader>
          <EventForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditEvent} disabled={!formData.title.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteEvent}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
