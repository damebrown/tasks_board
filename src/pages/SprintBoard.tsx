import { useState, useMemo } from 'react'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { Plus, GitBranch, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { BoardColumn } from '@/components/board/BoardColumn'
import { BoardCard } from '@/components/board/BoardCard'
import { TaskForm } from '@/components/tasks/TaskForm'
import { TaskModal } from '@/components/tasks/TaskModal'
import { Spinner } from '@/components/ui/Spinner'
import { useSprintTasks, useCreateTask, useUpdateTaskStatus } from '@/hooks/useTasks'
import { useActiveSprint } from '@/hooks/useSprints'
import { BOARD_COLUMN_ORDER } from '@/utils/consts'
import type { Task, TaskStatus } from '@/types'

interface SprintBoardProps {
  currentUserId: string
  onOpenSprints: () => void
}

export function SprintBoard({ currentUserId, onOpenSprints }: SprintBoardProps) {
  const activeSprint = useActiveSprint()
  const { data: tasks, isLoading } = useSprintTasks(activeSprint?.id)
  const { mutateAsync: createTask, isPending: creating } = useCreateTask()
  const { mutateAsync: updateStatus } = useUpdateTaskStatus()

  const [createOpen, setCreateOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [localTasks, setLocalTasks] = useState<Task[] | null>(null)

  const displayTasks = localTasks ?? tasks ?? []

  const columns = useMemo(() => {
    return BOARD_COLUMN_ORDER.reduce<Record<TaskStatus, Task[]>>((acc, status) => {
      acc[status] = displayTasks.filter((t) => t.status === status)
      return acc
    }, { tbd: [], not_started: [], in_progress: [], in_review: [], blocked: [], done: [] })
  }, [displayTasks])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))
  const activeTask = activeId ? displayTasks.find((t) => t.id === activeId) : null

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string)
    setLocalTasks(tasks ?? [])
  }

  async function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null)
    if (!over) { setLocalTasks(null); return }

    const activeTask = displayTasks.find((t) => t.id === active.id)
    if (!activeTask) { setLocalTasks(null); return }

    const overIsColumn = BOARD_COLUMN_ORDER.includes(over.id as TaskStatus)
    const targetStatus: TaskStatus = overIsColumn
      ? (over.id as TaskStatus)
      : (displayTasks.find((t) => t.id === over.id)?.status ?? activeTask.status)

    if (activeTask.status !== targetStatus) {
      setLocalTasks((prev) => (prev ?? []).map((t) => t.id === activeTask.id ? { ...t, status: targetStatus } : t))
      await updateStatus({ id: activeTask.id, status: targetStatus })
    } else if (!overIsColumn && active.id !== over.id) {
      setLocalTasks((prev) => {
        if (!prev) return prev
        const oldIdx = prev.findIndex((t) => t.id === active.id)
        const newIdx = prev.findIndex((t) => t.id === over.id)
        return arrayMove(prev, oldIdx, newIdx)
      })
    }

    setTimeout(() => setLocalTasks(null), 300)
  }

  async function handleCreate(data: Parameters<typeof createTask>[0]) {
    await createTask({ ...data, sprint_id: activeSprint?.id ?? null })
    setCreateOpen(false)
  }

  if (!activeSprint) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
          <AlertCircle className="h-6 w-6 text-gray-400" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-700 mb-1">No active sprint</h2>
          <p className="text-sm text-gray-400">Set a sprint as active to see its board.</p>
        </div>
        <Button variant="secondary" onClick={onOpenSprints}><GitBranch className="h-4 w-4" /> Manage sprints</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">{activeSprint.name}</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Active sprint</span>
          </div>
          {tasks && <p className="text-sm text-gray-500">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>}
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> New task</Button>
      </div>

      {isLoading && <div className="flex-1 flex items-center justify-center"><Spinner size="lg" /></div>}

      {!isLoading && (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex-1 overflow-x-auto overflow-y-hidden">
            <div className="flex gap-4 h-full p-6 min-w-max">
              {BOARD_COLUMN_ORDER.map((status) => (
                <div key={status} className="w-72 flex flex-col">
                  <BoardColumn status={status} tasks={columns[status]} onTaskClick={setSelectedTaskId} />
                </div>
              ))}
            </div>
          </div>
          <DragOverlay>
            {activeTask && <BoardCard task={activeTask} onClick={() => {}} />}
          </DragOverlay>
        </DndContext>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New task" size="lg">
        <TaskForm
          initial={{ sprint_id: activeSprint.id }}
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
          submitLabel={creating ? 'Creating…' : 'Create task'}
        />
      </Modal>

      <TaskModal taskId={selectedTaskId} currentUserId={currentUserId} onClose={() => setSelectedTaskId(null)} />
    </div>
  )
}
