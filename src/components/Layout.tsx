import { useState, useEffect } from "react"
import { Link, useLocation, Outlet } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { QuickAddDialog } from "@/components/QuickAddDialog"
import { useData } from "@/context/DataContext"
import {
  LayoutDashboard,
  CalendarDays,
  PenLine,
  BookOpen,
  FileText,
  GraduationCap,
  School,
  BookMarked,
  AlertCircle,
  RotateCcw,
  CalendarCheck,
  Calendar,
  BarChart3,
  Settings,
  Menu,
  Plus,
  Moon,
  Sun,
  CheckSquare,
  ChevronDown,
} from "lucide-react"

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
  highlight?: boolean
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", path: "/", icon: <LayoutDashboard className="h-5 w-5" /> },
      { label: "Today's Study", path: "/today", icon: <CalendarDays className="h-5 w-5" /> },
      { label: "Daily Log", path: "/log", icon: <PenLine className="h-5 w-5" /> },
      { label: "Todo List", path: "/todos", icon: <CheckSquare className="h-5 w-5" /> },
    ],
  },
  {
    label: "Curriculum",
    items: [
      { label: "Subjects & Chapters", path: "/subjects", icon: <BookOpen className="h-5 w-5" /> },
      { label: "Topics", path: "/topics", icon: <FileText className="h-5 w-5" /> },
    ],
  },
  {
    label: "Learning Tracks",
    items: [
      { label: "College Tracker", path: "/college", icon: <GraduationCap className="h-5 w-5" /> },
      { label: "Tuition Tracker", path: "/tuition", icon: <School className="h-5 w-5" />, highlight: true },
      { label: "Self-Study", path: "/self-study", icon: <BookMarked className="h-5 w-5" /> },
    ],
  },
  {
    label: "Review & Progress",
    items: [
      { label: "Pending Topics", path: "/pending", icon: <AlertCircle className="h-5 w-5" /> },
      { label: "Revision Queue", path: "/revision", icon: <RotateCcw className="h-5 w-5" /> },
      { label: "Weekly Catch-Up", path: "/weekly", icon: <CalendarCheck className="h-5 w-5" /> },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Calendar", path: "/calendar", icon: <Calendar className="h-5 w-5" /> },
      { label: "Analytics", path: "/analytics", icon: <BarChart3 className="h-5 w-5" /> },
    ],
  },
]

const settingsItem: NavItem = {
  label: "Settings",
  path: "/settings",
  icon: <Settings className="h-5 w-5" />,
}

const mobileBottomNavItems: NavItem[] = [
  navGroups[0].items[0], // Dashboard
  navGroups[0].items[1], // Today's Study
  navGroups[0].items[2], // Daily Log
  navGroups[3].items[0], // Pending Topics
  navGroups[3].items[1], // Revision Queue
]

function getPageTitle(pathname: string): string {
  for (const group of navGroups) {
    const item = group.items.find((n) => n.path === pathname)
    if (item) return item.label
  }
  if (settingsItem.path === pathname) return settingsItem.label
  return "Study Command Center"
}

function SidebarNav({
  pathname,
  collapsedGroups,
  onToggleGroup,
  onLinkClick,
}: {
  pathname: string
  collapsedGroups: Set<string>
  onToggleGroup: (label: string) => void
  onLinkClick?: () => void
}) {
  return (
    <div className="flex flex-col gap-1">
      {navGroups.map((group, groupIndex) => {
        const isCollapsed = collapsedGroups.has(group.label)
        return (
          <div key={group.label}>
            {groupIndex > 0 && <div className="border-t my-2 mx-2" />}
            <button
              type="button"
              onClick={() => onToggleGroup(group.label)}
              className="flex items-center justify-between w-full px-3 py-2 text-xs uppercase font-semibold text-muted-foreground tracking-wider hover:text-foreground transition-colors"
            >
              <span>{group.label}</span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform duration-200",
                  isCollapsed && "-rotate-90"
                )}
              />
            </button>
            {!isCollapsed && (
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={onLinkClick}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                        pathname === item.path
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                      {item.highlight && (
                        <span className="w-2 h-2 rounded-full bg-primary ml-auto" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
      {/* Settings - separated by a divider, no group header */}
      <div className="border-t my-2 mx-2" />
      <ul className="space-y-1">
        <li>
          <Link
            to={settingsItem.path}
            onClick={onLinkClick}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
              pathname === settingsItem.path
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground"
            )}
          >
            {settingsItem.icon}
            {settingsItem.label}
          </Link>
        </li>
      </ul>
    </div>
  )
}

export default function Layout() {
  const location = useLocation()
  const { getSettings, updateSettings } = useData()
  const settings = getSettings()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  // Auto-expand any group containing the active route
  useEffect(() => {
    setCollapsedGroups((prev) => {
      const activeGroup = navGroups.find((g) =>
        g.items.some((item) => item.path === location.pathname)
      )
      if (activeGroup && prev.has(activeGroup.label)) {
        const next = new Set(prev)
        next.delete(activeGroup.label)
        return next
      }
      return prev
    })
  }, [location.pathname])

  useEffect(() => {
    if (settings.theme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [settings.theme])

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === "dark" ? "light" : "dark" })
  }

  const toggleGroup = (label: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(label)) {
        next.delete(label)
      } else {
        next.add(label)
      }
      return next
    })
  }

  const pageTitle = getPageTitle(location.pathname)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 border-r bg-card">
        <div className="flex h-14 items-center border-b px-4">
          <Link to="/" className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Study Center</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <SidebarNav
            pathname={location.pathname}
            collapsedGroups={collapsedGroups}
            onToggleGroup={toggleGroup}
          />
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col md:pl-60">
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-card px-4 md:px-6">
          {/* Mobile menu trigger */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-60 p-0">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <div className="flex h-14 items-center border-b px-4">
                <Link to="/" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
                  <BookOpen className="h-6 w-6 text-primary" />
                  <span className="font-bold text-lg">Study Center</span>
                </Link>
              </div>
              <nav className="flex-1 overflow-y-auto py-4 px-3">
                <SidebarNav
                  pathname={location.pathname}
                  collapsedGroups={collapsedGroups}
                  onToggleGroup={toggleGroup}
                  onLinkClick={() => setSidebarOpen(false)}
                />
              </nav>
            </SheetContent>
          </Sheet>

          <h1 className="text-lg font-semibold flex-1">{pageTitle}</h1>

          {/* Quick Add Button */}
          <Button size="icon" className="rounded-full h-9 w-9" onClick={() => setQuickAddOpen(true)}>
            <Plus className="h-5 w-5" />
            <span className="sr-only">Quick Add</span>
          </Button>

          {/* Theme Toggle */}
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {settings.theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t bg-card md:hidden">
          {mobileBottomNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-1 text-xs transition-colors",
                location.pathname === item.path
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              {item.icon}
              <span className="truncate max-w-[60px]">{item.label.split(" ")[0]}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Quick Add Dialog */}
      <QuickAddDialog open={quickAddOpen} onOpenChange={setQuickAddOpen} />
    </div>
  )
}
