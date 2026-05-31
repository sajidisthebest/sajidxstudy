import { useState } from "react"
import { useData } from "@/context/DataContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { SubjectBadge } from "@/components/SubjectBadge"
import { generateId } from "@/lib/studyLogic"
import { seedData } from "@/data/seedData"
import {
  Palette,
  Plus,
  Pencil,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  Save,
  Sun,
  Moon,
  Monitor,
} from "lucide-react"
import type { Subject } from "@/types"

const PRESET_COLORS = [
  "red", "orange", "amber", "yellow", "lime", "green", "emerald", "teal",
  "cyan", "sky", "blue", "indigo", "violet", "purple", "fuchsia", "pink", "rose",
]

const DAYS_OF_WEEK = [
  { key: "monday", label: "Mon" },
  { key: "tuesday", label: "Tue" },
  { key: "wednesday", label: "Wed" },
  { key: "thursday", label: "Thu" },
  { key: "friday", label: "Fri" },
  { key: "saturday", label: "Sat" },
  { key: "sunday", label: "Sun" },
]

export default function Settings() {
  const { data, getSettings, updateSettings, addSubject, updateSubject, deleteSubject, getSubjects, getChapters, getTopics, clearAllStudyTasks } = useData()
  const settings = getSettings()
  const subjects = getSubjects()
  const chapters = getChapters()
  const topics = getTopics()

  // Subject management
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [subjectName, setSubjectName] = useState("")
  const [subjectColor, setSubjectColor] = useState("blue")
  const [subjectIsTuition, setSubjectIsTuition] = useState(false)

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null)

  // Reset confirmation
  const [resetDialogOpen, setResetDialogOpen] = useState(false)

  // Revision intervals
  const [intervals, setIntervals] = useState(settings.revisionIntervals)

  // Daily target
  const [dailyTarget, setDailyTarget] = useState(settings.dailyStudyTargetHours)

  // Catch-up days
  const [catchUpDays, setCatchUpDays] = useState(settings.weeklyCatchUpDays)

  const openAddSubject = () => {
    setEditingSubject(null)
    setSubjectName("")
    setSubjectColor("blue")
    setSubjectIsTuition(false)
    setSubjectDialogOpen(true)
  }

  const openEditSubject = (subject: Subject) => {
    setEditingSubject(subject)
    setSubjectName(subject.name)
    setSubjectColor(subject.color)
    setSubjectIsTuition(subject.isTuitionSubject)
    setSubjectDialogOpen(true)
  }

  const handleSaveSubject = () => {
    if (!subjectName.trim()) return

    if (editingSubject) {
      updateSubject(editingSubject.id, {
        name: subjectName.trim(),
        color: subjectColor,
        isTuitionSubject: subjectIsTuition,
      })
    } else {
      addSubject({
        id: generateId("sub"),
        name: subjectName.trim(),
        color: subjectColor,
        category: "commerce",
        isTuitionSubject: subjectIsTuition,
        createdAt: new Date().toISOString(),
      })
    }
    setSubjectDialogOpen(false)
  }

  const handleDeleteSubject = () => {
    if (subjectToDelete) {
      deleteSubject(subjectToDelete.id)
      setDeleteDialogOpen(false)
      setSubjectToDelete(null)
    }
  }

  const confirmDelete = (subject: Subject) => {
    setSubjectToDelete(subject)
    setDeleteDialogOpen(true)
  }

  const getSubjectDependencyCount = (subjectId: string) => {
    const chapterCount = chapters.filter((c) => c.subjectId === subjectId).length
    const topicCount = topics.filter((t) => t.subjectId === subjectId).length
    return { chapterCount, topicCount }
  }

  const handleSaveIntervals = () => {
    updateSettings({ revisionIntervals: intervals })
  }

  const handleSaveDailyTarget = () => {
    updateSettings({ dailyStudyTargetHours: dailyTarget })
  }

  const handleSaveCatchUpDays = () => {
    updateSettings({ weeklyCatchUpDays: catchUpDays })
  }

  const toggleCatchUpDay = (day: string) => {
    setCatchUpDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const handleThemeChange = (theme: "light" | "dark" | "system") => {
    updateSettings({ theme: theme === "system" ? "light" : theme })
    if (theme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  const handleExportData = () => {
    const jsonStr = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonStr], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `study-command-center-backup-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportData = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (evt) => {
        try {
          const imported = JSON.parse(evt.target?.result as string)
          localStorage.setItem("study-command-center-data", JSON.stringify(imported))
          window.location.reload()
        } catch {
          alert("Invalid JSON file")
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const handleResetData = () => {
    // Clear ALL localStorage keys used by the app
    localStorage.clear()
    // Re-seed the main data store with fresh demo data
    localStorage.setItem("study-command-center-data", JSON.stringify(seedData))
    window.location.reload()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure app preferences, revision intervals, and more.</p>
      </div>

      {/* Subjects Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Subjects Management
            </CardTitle>
            <Button size="sm" onClick={openAddSubject}>
              <Plus className="h-4 w-4 mr-1" />
              Add Subject
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {subjects.map((subject) => (
              <div key={subject.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <SubjectBadge name={subject.name} color={subject.color} />
                  {subject.isTuitionSubject && (
                    <Badge variant="secondary" className="text-xs">Tuition</Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditSubject(subject)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => confirmDelete(subject)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revision Intervals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revision Intervals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((level) => (
              <div key={level} className="flex items-center gap-3">
                <span className="text-sm font-medium w-24">Mastery {level}:</span>
                <Input
                  type="number"
                  min={1}
                  value={intervals[level] ?? 7}
                  onChange={(e) => setIntervals({ ...intervals, [level]: parseInt(e.target.value) || 1 })}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
            ))}
            <Button size="sm" onClick={handleSaveIntervals}>
              <Save className="h-4 w-4 mr-1" />
              Save Intervals
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Catch-Up Days */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Weekly Catch-Up Days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <Button
                  key={day.key}
                  variant={catchUpDays.includes(day.key) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleCatchUpDay(day.key)}
                >
                  {day.label}
                </Button>
              ))}
            </div>
            <Button size="sm" onClick={handleSaveCatchUpDays}>
              <Save className="h-4 w-4 mr-1" />
              Save Days
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Daily Study Target */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily Study Target</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={1}
              max={16}
              value={dailyTarget}
              onChange={(e) => setDailyTarget(parseInt(e.target.value) || 4)}
              className="w-20"
            />
            <span className="text-sm text-muted-foreground">hours per day</span>
            <Button size="sm" onClick={handleSaveDailyTarget}>
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={settings.theme === "light" ? "default" : "outline"}
              size="sm"
              onClick={() => handleThemeChange("light")}
            >
              <Sun className="h-4 w-4 mr-1" />
              Light
            </Button>
            <Button
              variant={settings.theme === "dark" ? "default" : "outline"}
              size="sm"
              onClick={() => handleThemeChange("dark")}
            >
              <Moon className="h-4 w-4 mr-1" />
              Dark
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleThemeChange("system")}
            >
              <Monitor className="h-4 w-4 mr-1" />
              System
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleExportData}>
              <Download className="h-4 w-4 mr-1" />
              Export Data
            </Button>
            <Button variant="outline" size="sm" onClick={handleImportData}>
              <Upload className="h-4 w-4 mr-1" />
              Import Data
            </Button>
            <Button variant="outline" size="sm" onClick={clearAllStudyTasks}>
              <Trash2 className="h-4 w-4 mr-1" />
              Clear All Study Tasks
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setResetDialogOpen(true)}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset to Demo Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subject Add/Edit Dialog */}
      <Dialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSubject ? "Edit Subject" : "Add Subject"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="Subject name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Color</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSubjectColor(color)}
                    className={`h-7 w-7 rounded-full border-2 transition-all ${
                      subjectColor === color ? "border-foreground scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: `var(--color-${color}-500, ${color})` }}
                    title={color}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={subjectIsTuition} onCheckedChange={setSubjectIsTuition} />
              <label className="text-sm">This is a tuition subject</label>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveSubject}>{editingSubject ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Subject</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {subjectToDelete?.name}?
              {subjectToDelete && (() => {
                const deps = getSubjectDependencyCount(subjectToDelete.id)
                if (deps.chapterCount > 0 || deps.topicCount > 0) {
                  return ` This subject has ${deps.chapterCount} chapters and ${deps.topicCount} topics.`
                }
                return ""
              })()}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteSubject}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset All Data</DialogTitle>
            <DialogDescription>
              This will clear all your data, settings, and study plans, then reload with fresh demo data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleResetData}>Reset Everything</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
