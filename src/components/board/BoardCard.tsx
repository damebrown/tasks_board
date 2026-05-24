import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { MessageSquare, Calendar, GripVertical } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { PriorityBadge } from '@/components/tasks/PriorityBadge'
import { formatDate } from '@/utils/format'
import type { Task } from '@/types'

interface BoardCardProps {
  task: Task
  onClick: () => void
}

export function BoardCard({ task, onClick }: BoardCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 p-0.5 text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition cursor-grab active:cursor-grabbing flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 leading-snug mb-2 line-clamp-2">{task.title}</p>

          {task.epic && (
            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium text-white mb-2" style={{ backgroundColor: task.epic.color }}>
              {task.epic.title}
            </div>
          )}

          <div className="flex items-center justify-between gap-2 mt-1">
            <PriorityBadge priority={task.priority} />
            <div className="flex items-center gap-2">
              {task.due_date && (
                <span className="flex items-center gap-0.5 text-xs text-gray-400">
                  <Calendar className="h-3 w-3" /> {formatDate(task.due_date)}
                </span>
              )}
              {(task.comment_count ?? 0) > 0 && (
                <span className="flex items-center gap-0.5 text-xs text-gray-400">
                  <MessageSquare className="h-3 w-3" /> {task.comment_count}
                </span>
              )}
              {task.assignee && <Avatar profile={task.assignee} size="xs" />}
            </div>
          </div>

          {task.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {task.labels.map((l) => (
                <span key={l} className="px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs">{l}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
