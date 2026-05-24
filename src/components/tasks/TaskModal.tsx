import { useState } from 'react'
import { Pencil, Trash2, Calendar, User, Tag, Zap, GitBranch } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from './StatusBadge'
import { PriorityBadge } from './PriorityBadge'
import { TaskForm } from './TaskForm'
import { CommentList } from '@/components/comments/CommentList'
import { useTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks'
import { formatDate } from '@/utils/format'
import type { Task } from '@/types'

interface TaskModalProps {
  taskId: string | null
  currentUserId: string
  onClose: () => void
}

export function TaskModal({ taskId, currentUserId, onClose }: TaskModalProps) {
  const [editMode, setEditMode] = useState(false)
  const { data: task, isLoading } = useTask(taskId ?? undefined)
  const { mutateAsync: updateTask } = useUpdateTask()
  const { mutateAsync: deleteTask, isPending: deleting } = useDeleteTask()

  async function handleUpdate(data: Omit<Task, 'id' | 'created_at' | 'created_by' | 'order' | 'epic' | 'sprint' | 'assignee' | 'comment_count'>) {
    if (!task) return
    await updateTask({ id: task.id, ...data })
    setEditMode(false)
  }

  async function handleDelete() {
    if (!task) return
    if (!confirm('Delete this task? This cannot be undone.')) return
    await deleteTask(task.id)
    onClose()
  }

  return (
    <Modal open={!!taskId} onClose={onClose} size="xl">
      {isLoading && (
        <div className="flex justify-center py-12 text-gray-400">Loading…</div>
      )}

      {!isLoading && task && !editMode && (
        <div className="flex flex-col gap-6">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-xl font-semibold text-gray-900 leading-snug flex-1">{task.title}</h1>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="ghost" size="sm" onClick={() => setEditMode(true)}>
                <Pencil className="h-4 w-4" /> Edit
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDelete} loading={deleting} className="text-red-500 hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
          </div>

          {task.description && (
            <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{task.description}</p>
          )}

          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            {task.epic && (
              <div className="flex items-center gap-2 text-gray-600">
                <Zap className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="font-medium text-gray-500">Epic</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: task.epic.color }}>
                  {task.epic.title}
                </span>
              </div>
            )}

            {task.sprint && (
              <div className="flex items-center gap-2 text-gray-600">
                <GitBranch className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="font-medium text-gray-500">Sprint</span>
                <span className="text-gray-700">{task.sprint.name}</span>
                {task.sprint.is_active && <span className="px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-700 font-medium">Active</span>}
              </div>
            )}

            {task.assignee && (
              <div className="flex items-center gap-2 text-gray-600">
                <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="font-medium text-gray-500">Assignee</span>
                <div className="flex items-center gap-1.5">
                  <Avatar profile={task.assignee} size="xs" />
                  <span className="text-gray-700">{task.assignee.display_name ?? task.assignee.email}</span>
                </div>
              </div>
            )}

            {task.due_date && (
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="font-medium text-gray-500">Due</span>
                <span className="text-gray-700">{formatDate(task.due_date)}</span>
              </div>
            )}
          </div>

          {task.labels.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="h-4 w-4 text-gray-400 flex-shrink-0" />
              {task.labels.map((l) => (
                <span key={l} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">{l}</span>
              ))}
            </div>
          )}

          <div className="border-t border-gray-100 pt-4">
            <CommentList taskId={task.id} currentUserId={currentUserId} />
          </div>
        </div>
      )}

      {!isLoading && task && editMode && (
        <TaskForm
          initial={task}
          onSubmit={handleUpdate}
          onCancel={() => setEditMode(false)}
          submitLabel="Save changes"
        />
      )}
    </Modal>
  )
}
