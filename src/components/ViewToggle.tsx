import { LayoutList, LayoutGrid } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useData } from "@/context/DataContext"

interface ViewToggleProps {
  pageKey: string
}

export function ViewToggle({ pageKey }: ViewToggleProps) {
  const { getSettings, updateSettings } = useData()
  const settings = getSettings()
  const currentView = settings.viewPreferences?.[pageKey] || "list"

  const toggle = () => {
    const newView = currentView === "list" ? "board" : "list"
    updateSettings({
      viewPreferences: { ...settings.viewPreferences, [pageKey]: newView },
    })
  }

  return (
    <Button variant="outline" size="sm" onClick={toggle} className="gap-2">
      {currentView === "list" ? (
        <>
          <LayoutGrid className="h-4 w-4" />
          <span className="hidden sm:inline">Board</span>
        </>
      ) : (
        <>
          <LayoutList className="h-4 w-4" />
          <span className="hidden sm:inline">List</span>
        </>
      )}
    </Button>
  )
}
