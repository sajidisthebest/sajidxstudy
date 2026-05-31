import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MasteryStars } from "@/components/MasteryStars"

interface CompletionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  topicTitle: string
  onConfirm: (mastery: number) => void
}

const masteryDescriptions: Record<number, string> = {
  1: "Barely remember - need to study again tomorrow",
  2: "Remember a little - revise in 3 days",
  3: "Understood basics - revise in 1 week",
  4: "Good understanding - revise in 2 weeks",
  5: "Mastered it - revise in 1 month",
}

export function CompletionDialog({ open, onOpenChange, topicTitle, onConfirm }: CompletionDialogProps) {
  const [mastery, setMastery] = useState(3)

  const handleConfirm = () => {
    onConfirm(mastery)
    onOpenChange(false)
    setMastery(3)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>How well did you learn this?</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {topicTitle}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex flex-col items-center gap-3">
            <MasteryStars value={mastery} onChange={setMastery} size="lg" />
            <p className="text-sm text-center text-muted-foreground">
              {masteryDescriptions[mastery]}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
