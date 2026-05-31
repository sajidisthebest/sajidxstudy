import { useState } from "react"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core"
import { useDroppable } from "@dnd-kit/core"
import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"

export interface KanbanItem {
  id: string
  title: string
  subtitle?: string
  badges?: { label: string; color: string }[]
  metadata?: Record<string, string>
}

export interface KanbanColumn {
  id: string
  title: string
  color?: string
  items: KanbanItem[]
}

export interface KanbanBoardProps {
  columns: KanbanColumn[]
  onDragEnd: (itemId: string, fromColumn: string, toColumn: string) => void
  renderCard?: (item: KanbanItem) => React.ReactNode
}

function DraggableCard({
  item,
  columnId,
  renderCard,
}: {
  item: KanbanItem
  columnId: string
  renderCard?: (item: KanbanItem) => React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { columnId },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "rounded-lg border bg-card p-3 shadow-sm cursor-grab active:cursor-grabbing transition-opacity",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      {renderCard ? (
        renderCard(item)
      ) : (
        <DefaultCard item={item} />
      )}
    </div>
  )
}

function DefaultCard({ item }: { item: KanbanItem }) {
  return (
    <div className="space-y-1.5">
      <p className="font-medium text-sm leading-tight">{item.title}</p>
      {item.subtitle && (
        <p className="text-xs text-muted-foreground">{item.subtitle}</p>
      )}
      {item.badges && item.badges.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {item.badges.map((badge, i) => (
            <span
              key={i}
              className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", badge.color)}
            >
              {badge.label}
            </span>
          ))}
        </div>
      )}
      {item.metadata && Object.keys(item.metadata).length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {Object.entries(item.metadata).map(([key, value]) => (
            <span key={key}>{value}</span>
          ))}
        </div>
      )}
    </div>
  )
}

function DroppableColumn({
  column,
  children,
  isOver,
}: {
  column: KanbanColumn
  children: React.ReactNode
  isOver: boolean
}) {
  const { setNodeRef } = useDroppable({ id: column.id })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col min-w-[240px] w-[240px] md:w-[280px] rounded-lg border bg-muted/30 transition-colors touch-manipulation",
        isOver && "ring-2 ring-primary/50 bg-primary/5"
      )}
    >
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          {column.color && (
            <span className={cn("h-2.5 w-2.5 rounded-full", `bg-${column.color}-500`)} style={{ backgroundColor: column.color }} />
          )}
          <h3 className="font-semibold text-sm">{column.title}</h3>
        </div>
        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
          {column.items.length}
        </span>
      </div>
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[60vh] min-h-[100px]">
        {children}
      </div>
    </div>
  )
}

export function KanbanBoard({ columns, onDragEnd, renderCard }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overColumnId, setOverColumnId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

  const activeItem = activeId
    ? columns.flatMap((c) => c.items).find((item) => item.id === activeId)
    : null

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: { over: { id: string | number } | null }) => {
    if (event.over) {
      const overId = String(event.over.id)
      // Check if over a column directly
      const colId = columns.find((c) => c.id === overId)?.id
      if (colId) {
        setOverColumnId(colId)
      } else {
        // Over an item - find its column
        for (const col of columns) {
          if (col.items.some((item) => item.id === overId)) {
            setOverColumnId(col.id)
            break
          }
        }
      }
    } else {
      setOverColumnId(null)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setOverColumnId(null)

    if (!over) return

    const itemId = active.id as string
    const fromColumnId = (active.data.current as { columnId: string })?.columnId

    // Determine target column
    let toColumnId: string | null = null
    const directCol = columns.find((c) => c.id === over.id)
    if (directCol) {
      toColumnId = directCol.id
    } else {
      for (const col of columns) {
        if (col.items.some((item) => item.id === over.id)) {
          toColumnId = col.id
          break
        }
      }
    }

    if (toColumnId && fromColumnId !== toColumnId) {
      onDragEnd(itemId, fromColumnId, toColumnId)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4 scroll-smooth touch-pan-x">
        {columns.map((column) => (
          <DroppableColumn
            key={column.id}
            column={column}
            isOver={overColumnId === column.id}
          >
            {column.items.map((item) => (
              <DraggableCard
                key={item.id}
                item={item}
                columnId={column.id}
                renderCard={renderCard}
              />
            ))}
          </DroppableColumn>
        ))}
      </div>
      <DragOverlay>
        {activeItem ? (
          <div className="rounded-lg border bg-card p-3 shadow-xl opacity-90 w-[240px] md:w-[280px]">
            {renderCard ? renderCard(activeItem) : <DefaultCard item={activeItem} />}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
