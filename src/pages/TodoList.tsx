import { useState, useMemo } from "react"
import { useData } from "@/context/DataContext"
import type { Todo, Priority } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CheckCircle2,
  Circle,
  Trash2,
  Pencil,
  Plus,
  Sparkles,
  Clock,
  AlertTriangle,
  Tag,
  LayoutGrid,
  List,
  RotateCcw,
  BookOpen,
} from "lucide-react"
import { format, isToday, isTomorrow, isPast, isThisWeek, differenceInDays, parseISO, startOfDay } from "date-fns"

type ViewMode = "list" | "board"

const CATEGORIES = ["Study", "Personal", "Assignment", "Errand", "Health", "Work", "Other"]

const CATEGORY_COLORS: Record<string, string> = {
  Study: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  Personal: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  Assignment: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  Errand: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  Health: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  Work: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  Other: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
}

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; dot: string; order: number }> = {
  urgent: { label: "Urgent", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300", dot: "bg-red-500", order: 0 },
  high: { label: "High", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300", dot: "bg-orange-500", order: 1 },
  medium: { label: "Medium", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300", dot: "bg-yellow-500", order: 2 },
  low: { label: "Low", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300", dot: "bg-green-500", order: 3 },
}

interface TodoGroup {
  key: string
  label: string
  sublabel?: string
  todos: Todo[]
  isOverdue?: boolean
}

function getDateLabel(dateStr: string): string {
  const date = parseISO(dateStr)
  const today = startOfDay(new Date())
  const diff = differenceInDays(startOfDay(date), today)

  if (diff < -1) return `${Math.abs(diff)} days overdue`
  if (diff === -1) return "1 day overdue"
  if (diff === 0) return "Today"
  if (diff === 1) return "Tomorrow"
  return format(date, "EEE, MMM d")
}

function groupTodos(todos: Todo[]): TodoGroup[] {
  const groups: Record<string, Todo[]> = {
    overdue: [],
    today: [],
    tomorrow: [],
    thisWeek: [],
    later: [],
  }

  todos.forEach((todo) => {
    const dueDate = startOfDay(parseISO(todo.dueDate))
    if (isPast(dueDate) && !isToday(dueDate)) {
      groups.overdue.push(todo)
    } else if (isToday(dueDate)) {
      groups.today.push(todo)
    } else if (isTomorrow(dueDate)) {
      groups.tomorrow.push(todo)
    } else if (isThisWeek(dueDate, { weekStartsOn: 1 })) {
      groups.thisWeek.push(todo)
    } else {
      groups.later.push(todo)
    }
  })

  // Sort each group by priority
  const sortByPriority = (a: Todo, b: Todo) =>
    PRIORITY_CONFIG[a.priority].order - PRIORITY_CONFIG[b.priority].order

  Object.values(groups).forEach((g) => g.sort(sortByPriority))

  const result: TodoGroup[] = []
  if (groups.overdue.length > 0) {
    result.push({ key: "overdue", label: "Overdue", sublabel: `${groups.overdue.length} task${groups.overdue.length > 1 ? "s" : ""}`, todos: groups.overdue, isOverdue: true })
  }
  if (groups.today.length > 0) {
    const completed = groups.today.filter((t) => t.completed).length
    result.push({ key: "today", label: "Today", sublabel: `${completed}/${groups.today.length} done`, todos: groups.today })
  }
  if (groups.tomorrow.length > 0) {
    result.push({ key: "tomorrow", label: "Tomorrow", sublabel: `${groups.tomorrow.length} task${groups.tomorrow.length > 1 ? "s" : ""}`, todos: groups.tomorrow })
  }
  if (groups.thisWeek.length > 0) {
    result.push({ key: "thisWeek", label: "This Week", sublabel: `${groups.thisWeek.length} task${groups.thisWeek.length > 1 ? "s" : ""}`, todos: groups.thisWeek })
  }
  if (groups.later.length > 0) {
    result.push({ key: "later", label: "Later", sublabel: `${groups.later.length} task${groups.later.length > 1 ? "s" : ""}`, todos: groups.later })
  }

  return result
}

export default function TodoList() {
  const { getTodos, addTodo, updateTodo, deleteTodo, toggleTodo, getTopics, getSubjects } = useData()
  const todos = getTodos()
  const topics = getTopics()
  const subjects = getSubjects()

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      return (localStorage.getItem("todo-view-mode") as ViewMode) || "board"
    } catch { return "board" }
  })
  // Quick add state
  const [quickAddTitle, setQuickAddTitle] = useState("")
  // Edit dialog state
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  // Add form state
  const [addFormOpen, setAddFormOpen] = useState(false)
  const [newTodo, setNewTodo] = useState({
    title: "",
    description: "",
    dueDate: new Date().toISOString().split("T")[0],
    priority: "medium" as Priority,
    category: "Study",
  })
  // Filter state
  const [showCompleted, setShowCompleted] = useState(true)

  const filteredTodos = useMemo(() => {
    if (showCompleted) return todos
    return todos.filter((t) => !t.completed)
  }, [todos, showCompleted])

  const todoGroups = useMemo(() => groupTodos(filteredTodos), [filteredTodos])

  const todayStats = useMemo(() => {
    const todayTodos = todos.filter((t) => isToday(parseISO(t.dueDate)))
    const completed = todayTodos.filter((t) => t.completed).length
    return { total: todayTodos.length, completed }
  }, [todos])

  const completedCount = useMemo(() => todos.filter((t) => t.completed).length, [todos])

  // Auto-generated tasks from revision due and pending topics
  const autoTasks = useMemo(() => {
    const today = new Date().toISOString().split("T")[0]
    const items: { id: string; title: string; type: "revision" | "pending"; subject: string }[] = []

    topics.forEach((topic) => {
      // Revision due today or overdue
      if (topic.nextRevisionAt) {
        const revDate = topic.nextRevisionAt.split("T")[0]
        if (revDate <= today && topic.status !== "completed") {
          const subject = subjects.find((s) => s.id === topic.subjectId)
          items.push({
            id: `auto-rev-${topic.id}`,
            title: `Revise: ${topic.title}`,
            type: "revision",
            subject: subject?.name ?? "Unknown",
          })
        }
      }
      // Pending topics
      if (topic.isPending || topic.status === "pending") {
        const subject = subjects.find((s) => s.id === topic.subjectId)
        // Avoid duplicates with revision
        if (!items.find((i) => i.id === `auto-rev-${topic.id}`)) {
          items.push({
            id: `auto-pend-${topic.id}`,
            title: `Pending: ${topic.title}`,
            type: "pending",
            subject: subject?.name ?? "Unknown",
          })
        }
      }
    })

    return items
  }, [topics, subjects])

  const toggleViewMode = (mode: ViewMode) => {
    setViewMode(mode)
    try { localStorage.setItem("todo-view-mode", mode) } catch {}
  }

  // Board columns for board view
  const boardColumns = useMemo(() => {
    const todayTodos = filteredTodos.filter((t) => isToday(parseISO(t.dueDate)))
    const notStarted = todayTodos.filter((t) => !t.completed)
    const completed = todayTodos.filter((t) => t.completed)
    const overdueTodos = filteredTodos.filter((t) => {
      const dueDate = startOfDay(parseISO(t.dueDate))
      return isPast(dueDate) && !isToday(dueDate) && !t.completed
    })
    const upcomingTodos = filteredTodos.filter((t) => {
      const dueDate = startOfDay(parseISO(t.dueDate))
      return !isPast(dueDate) && !isToday(dueDate)
    })

    return [
      { key: "overdue", label: "Overdue", color: "border-t-red-500", todos: overdueTodos },
      { key: "today", label: "Today", color: "border-t-blue-500", todos: notStarted },
      { key: "upcoming", label: "Upcoming", color: "border-t-yellow-500", todos: upcomingTodos },
      { key: "done", label: "Done", color: "border-t-green-500", todos: completed },
    ]
  }, [filteredTodos])

  const handleQuickAdd = () => {
    if (!quickAddTitle.trim()) return
    const now = new Date().toISOString()
    const todo: Todo = {
      id: `todo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: quickAddTitle.trim(),
      description: "",
      dueDate: new Date().toISOString().split("T")[0],
      priority: "medium",
      category: "Study",
      completed: false,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    }
    addTodo(todo)
    setQuickAddTitle("")
  }

  const handleAddTodo = () => {
    if (!newTodo.title.trim()) return
    const now = new Date().toISOString()
    const todo: Todo = {
      id: `todo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: newTodo.title.trim(),
      description: newTodo.description.trim(),
      dueDate: newTodo.dueDate,
      priority: newTodo.priority,
      category: newTodo.category,
      completed: false,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    }
    addTodo(todo)
    setNewTodo({ title: "", description: "", dueDate: new Date().toISOString().split("T")[0], priority: "medium", category: "Study" })
    setAddFormOpen(false)
  }

  const handleEditSave = () => {
    if (!editingTodo) return
    updateTodo(editingTodo.id, {
      title: editingTodo.title,
      description: editingTodo.description,
      dueDate: editingTodo.dueDate,
      priority: editingTodo.priority,
      category: editingTodo.category,
    })
    setEditDialogOpen(false)
    setEditingTodo(null)
  }

  const handleClearCompleted = () => {
    todos.filter((t) => t.completed).forEach((t) => deleteTodo(t.id))
  }

  const progressPercentage = todayStats.total > 0 ? Math.round((todayStats.completed / todayStats.total) * 100) : 0

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12">
              <svg className="h-12 w-12 -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-muted/20"
                />
                <path
                  d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={`${progressPercentage}, 100`}
                  className="text-primary transition-all duration-500"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                {progressPercentage}%
              </span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Today&apos;s progress</p>
              <p className="font-semibold">{todayStats.completed}/{todayStats.total} tasks done</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex border rounded-md overflow-hidden">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              className="rounded-none h-8 px-2"
              onClick={() => toggleViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "board" ? "default" : "ghost"}
              size="sm"
              className="rounded-none h-8 px-2"
              onClick={() => toggleViewMode("board")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCompleted(!showCompleted)}
          >
            {showCompleted ? "Hide completed" : "Show completed"}
          </Button>
          {completedCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleClearCompleted} className="text-destructive hover:text-destructive">
              Clear completed ({completedCount})
            </Button>
          )}
        </div>
      </div>

      {/* Quick Add */}
      <Card>
        <CardContent className="p-3">
          <div className="flex gap-2">
            <Input
              placeholder="Quick add a todo... (press Enter)"
              value={quickAddTitle}
              onChange={(e) => setQuickAddTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleQuickAdd()
              }}
              className="flex-1"
            />
            <Button size="sm" onClick={() => setAddFormOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Detailed
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Auto-generated Study Tasks */}
      {autoTasks.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <BookOpen className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">
              Today&apos;s Study Tasks
            </h2>
            <span className="text-xs text-muted-foreground">{autoTasks.length} items from your topics</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {autoTasks.slice(0, 10).map((task) => (
              <Card key={task.id} className={`${task.type === "revision" ? "border-l-4 border-l-orange-400" : "border-l-4 border-l-red-400"}`}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    {task.type === "revision" ? (
                      <RotateCcw className="h-4 w-4 text-orange-500 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <p className="text-xs text-muted-foreground">{task.subject}</p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] shrink-0 ${task.type === "revision" ? "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"}`}>
                      {task.type}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {autoTasks.length > 10 && (
            <p className="text-xs text-muted-foreground px-1">+ {autoTasks.length - 10} more tasks</p>
          )}
        </div>
      )}

      {/* Board View */}
      {viewMode === "board" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {boardColumns.map((col) => (
            <div key={col.key} className={`rounded-lg border border-t-4 ${col.color} bg-card p-3 space-y-2`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">{col.label}</h3>
                <Badge variant="secondary" className="text-xs">{col.todos.length}</Badge>
              </div>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {col.todos.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No tasks</p>
                )}
                {col.todos.map((todo) => (
                  <BoardCard
                    key={todo.id}
                    todo={todo}
                    onToggle={() => toggleTodo(todo.id)}
                    onEdit={() => {
                      setEditingTodo({ ...todo })
                      setEditDialogOpen(true)
                    }}
                    onDelete={() => deleteTodo(todo.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View - Todo Groups */}
      {viewMode === "list" && todoGroups.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Sparkles className="h-12 w-12 mx-auto text-primary/40 mb-4" />
            <h3 className="text-lg font-semibold mb-2">All clear!</h3>
            <p className="text-muted-foreground">
              You have no todos right now. Add one above to get started.
            </p>
          </CardContent>
        </Card>
      )}

      {viewMode === "list" && todoGroups.map((group) => (
        <div key={group.key} className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            {group.isOverdue && <AlertTriangle className="h-4 w-4 text-red-500" />}
            <h2 className={`text-sm font-semibold uppercase tracking-wider ${group.isOverdue ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
              {group.label}
            </h2>
            <span className="text-xs text-muted-foreground">{group.sublabel}</span>
          </div>
          <div className="space-y-1.5">
            {group.todos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                isOverdue={group.isOverdue}
                onToggle={() => toggleTodo(todo.id)}
                onEdit={() => {
                  setEditingTodo({ ...todo })
                  setEditDialogOpen(true)
                }}
                onDelete={() => deleteTodo(todo.id)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Add Todo Dialog */}
      <Dialog open={addFormOpen} onOpenChange={setAddFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Todo</DialogTitle>
            <DialogDescription>Create a new todo with details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="What needs to be done?"
              value={newTodo.title}
              onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newTodo.title.trim()) handleAddTodo()
              }}
            />
            <Textarea
              placeholder="Description (optional)"
              value={newTodo.description}
              onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
              rows={2}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Due Date</label>
                <Input
                  type="date"
                  value={newTodo.dueDate}
                  onChange={(e) => setNewTodo({ ...newTodo, dueDate: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Priority</label>
                <Select value={newTodo.priority} onValueChange={(v) => setNewTodo({ ...newTodo, priority: v as Priority })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
              <Select value={newTodo.category} onValueChange={(v) => setNewTodo({ ...newTodo, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddFormOpen(false)}>Cancel</Button>
            <Button onClick={handleAddTodo} disabled={!newTodo.title.trim()}>Add Todo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Todo Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Todo</DialogTitle>
            <DialogDescription>Update your todo details.</DialogDescription>
          </DialogHeader>
          {editingTodo && (
            <div className="space-y-4">
              <Input
                placeholder="Title"
                value={editingTodo.title}
                onChange={(e) => setEditingTodo({ ...editingTodo, title: e.target.value })}
              />
              <Textarea
                placeholder="Description (optional)"
                value={editingTodo.description}
                onChange={(e) => setEditingTodo({ ...editingTodo, description: e.target.value })}
                rows={2}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Due Date</label>
                  <Input
                    type="date"
                    value={editingTodo.dueDate}
                    onChange={(e) => setEditingTodo({ ...editingTodo, dueDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Priority</label>
                  <Select value={editingTodo.priority} onValueChange={(v) => setEditingTodo({ ...editingTodo, priority: v as Priority })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
                <Select value={editingTodo.category} onValueChange={(v) => setEditingTodo({ ...editingTodo, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSave} disabled={!editingTodo?.title.trim()}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Individual Todo Item component
function TodoItem({
  todo,
  isOverdue,
  onToggle,
  onEdit,
  onDelete,
}: {
  todo: Todo
  isOverdue?: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const priorityConfig = PRIORITY_CONFIG[todo.priority]
  const categoryColor = CATEGORY_COLORS[todo.category] ?? CATEGORY_COLORS.Other

  return (
    <Card className={`transition-all duration-300 ${todo.completed ? "opacity-60" : ""} ${isOverdue && !todo.completed ? "border-red-200 dark:border-red-800/50 bg-red-50/30 dark:bg-red-950/10" : ""}`}>
      <CardContent className="p-3 flex items-start gap-3">
        {/* Toggle */}
        <button
          onClick={onToggle}
          className="mt-0.5 flex-shrink-0 transition-transform duration-200 hover:scale-110"
        >
          {todo.completed ? (
            <CheckCircle2 className="h-5 w-5 text-green-500 transition-colors" />
          ) : (
            <Circle className={`h-5 w-5 transition-colors ${isOverdue ? "text-red-400" : "text-muted-foreground hover:text-primary"}`} />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-medium ${todo.completed ? "line-through text-muted-foreground" : ""}`}>
              {todo.title}
            </span>
            {/* Priority dot */}
            <span className={`h-2 w-2 rounded-full ${priorityConfig.dot} shrink-0`} />
          </div>
          {todo.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {todo.description}
            </p>
          )}
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${categoryColor} border-0`}>
              <Tag className="h-2.5 w-2.5 mr-0.5" />
              {todo.category}
            </Badge>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${priorityConfig.color} border-0`}>
              {priorityConfig.label}
            </Badge>
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" />
              {getDateLabel(todo.dueDate)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Board Card component for board view
function BoardCard({
  todo,
  onToggle,
  onEdit,
  onDelete,
}: {
  todo: Todo
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const priorityConfig = PRIORITY_CONFIG[todo.priority]
  const categoryColor = CATEGORY_COLORS[todo.category] ?? CATEGORY_COLORS.Other

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${todo.completed ? "opacity-60" : ""}`}>
      <CardContent className="p-2.5 space-y-1.5">
        <div className="flex items-start gap-2">
          <button onClick={onToggle} className="mt-0.5 shrink-0">
            {todo.completed ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground hover:text-primary" />
            )}
          </button>
          <span className={`text-xs font-medium flex-1 ${todo.completed ? "line-through text-muted-foreground" : ""}`}>
            {todo.title}
          </span>
          <span className={`h-2 w-2 rounded-full ${priorityConfig.dot} shrink-0 mt-1`} />
        </div>
        <div className="flex items-center gap-1 flex-wrap pl-6">
          <Badge variant="outline" className={`text-[9px] px-1 py-0 ${categoryColor} border-0`}>
            {todo.category}
          </Badge>
          <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
            <Clock className="h-2 w-2" />
            {getDateLabel(todo.dueDate)}
          </span>
        </div>
        <div className="flex items-center gap-0.5 justify-end">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onEdit}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={onDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
