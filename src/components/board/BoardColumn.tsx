import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { BoardCard } from './BoardCard'
import { TASK_STATUS_LABELS, TASK_STATUS_DOT_COLORS } from '@/utils/consts'
import type { Task, TaskStatus } from '@/types'

interface BoardColumnProps {
  status: TaskStatus
  tasks: Task[]
  onTaskClick: (id: string) => void
}

export function BoardColumn({ status, tasks, onTaskClick }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div className="flex flex-col min-w-0 flex-1">
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${TASK_STATUS_DOT_COLORS[status]}`} />
        <h3 className="text-sm font-semibold text-gray-700">{TASK_STATUS_LABELS[status]}</h3>
        <span className="ml-auto text-xs font-medium text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{tasks.length}</span>
      </div>

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`flex flex-col gap-2 flex-1 min-h-24 rounded-xl p-2 transition-colors ${isOver ? 'bg-brand-50 ring-2 ring-brand-200' : 'bg-gray-50'}`}
        >
          {tasks.map((task) => (
            <BoardCard key={task.id} task={task} onClick={() => onTaskClick(task.id)} />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}
