import { useState, useMemo, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'
import { Plus, MessageSquare, ChevronDown, ChevronUp, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/tasks/StatusBadge'
import { PriorityBadge } from '@/components/tasks/PriorityBadge'
import { FilterBar } from '@/components/tasks/FilterBar'
import { TaskForm } from '@/components/tasks/TaskForm'
import { TaskModal } from '@/components/tasks/TaskModal'
import { Spinner } from '@/components/ui/Spinner'
import { useTasks, useCreateTask } from '@/hooks/useTasks'
import { formatDate, formatRelativeTime } from '@/utils/format'
import type { Task, TaskFilters } from '@/types'

const EMPTY_FILTERS: TaskFilters = { search: '', status: '', priority: '', epic_id: '', assignee_id: '', sprint_id: '', label: '' }
const ROW_HEIGHT = 52

interface AllTasksProps {
  currentUserId: string
}

type SortKey = 'title' | 'status' | 'priority' | 'epic' | 'due_date' | 'created_at' | 'creator'
type SortDir = 'asc' | 'desc'

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 }
const STATUS_ORDER = { tbd: 0, not_started: 1, in_progress: 2, in_review: 3, blocked: 4, done: 5 }

export function AllTasks({ currentUserId }: AllTasksProps) {
  const [filters, setFilters] = useState<TaskFilters>(EMPTY_FILTERS)
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const { data: tasks, isLoading } = useTasks(filters)
  const { mutateAsync: createTask, isPending: creating } = useCreateTask()

  const sorted = useMemo(() => {
    if (!tasks) return []
    return [...tasks].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'status') cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
      else if (sortKey === 'priority') cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      else if (sortKey === 'epic') cmp = (a.epic?.title ?? '').localeCompare(b.epic?.title ?? '')
      else if (sortKey === 'creator') cmp = (a.creator?.display_name ?? a.creator?.email ?? '').localeCompare(b.creator?.display_name ?? b.creator?.email ?? '')
      else if (sortKey === 'due_date') cmp = (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999')
      else if (sortKey === 'title') cmp = a.title.localeCompare(b.title)
      else cmp = a.created_at.localeCompare(b.created_at)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [tasks, sortKey, sortDir])

  const parentRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: sorted.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => ROW_HEIGHT, []),
    overscan: 10,
  })

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return null
    return sortDir === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
  }

  async function handleCreate(data: Parameters<typeof createTask>[0]) {
    await createTask(data)
    setCreateOpen(false)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-100 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">All Tasks</h1>
            {tasks && <p className="text-sm text-gray-500">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>}
          </div>
          <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> New task</Button>
        </div>
        <FilterBar filters={filters} onChange={setFilters} />
      </div>

      <div className="flex-shrink-0 grid grid-cols-[2fr_1fr_1fr_1.25fr_1fr_0.75fr_0.9fr_1fr_auto] gap-2 px-6 py-2 border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
        <button onClick={() => toggleSort('title')} className="flex items-center gap-1 hover:text-gray-700 text-left">Title <SortIcon col="title" /></button>
        <button onClick={() => toggleSort('status')} className="flex items-center gap-1 hover:text-gray-700">Status <SortIcon col="status" /></button>
        <button onClick={() => toggleSort('priority')} className="flex items-center gap-1 hover:text-gray-700">Priority <SortIcon col="priority" /></button>
        <button onClick={() => toggleSort('epic')} className="flex items-center gap-1 hover:text-gray-700 text-left">Epic <SortIcon col="epic" /></button>
        <span>Assignee</span>
        <button onClick={() => toggleSort('due_date')} className="flex items-center gap-1 hover:text-gray-700">Due <SortIcon col="due_date" /></button>
        <button onClick={() => toggleSort('created_at')} className="flex items-center gap-1 hover:text-gray-700">Created <SortIcon col="created_at" /></button>
        <button onClick={() => toggleSort('creator')} className="flex items-center gap-1 hover:text-gray-700">By <SortIcon col="creator" /></button>
        <span>Comments</span>
      </div>

      {isLoading && (
        <div className="flex-1 flex items-center justify-center"><Spinner size="lg" /></div>
      )}

      {!isLoading && sorted.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
          <p className="text-gray-400 text-sm">No tasks found.</p>
          <Button variant="secondary" size="sm" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Create your first task</Button>
        </div>
      )}

      {!isLoading && sorted.length > 0 && (
        <div ref={parentRef} className="flex-1 overflow-y-auto">
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const task: Task = sorted[virtualRow.index]
              return (
                <div
                  key={task.id}
                  style={{ position: 'absolute', top: virtualRow.start, left: 0, right: 0, height: ROW_HEIGHT }}
                  className="grid grid-cols-[2fr_1fr_1fr_1.25fr_1fr_0.75fr_0.9fr_1fr_auto] gap-2 items-center px-6 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedTaskId(task.id)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {task.epic && (
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: task.epic.color }} title={task.epic.title} />
                    )}
                    <span className="text-sm font-medium text-gray-900 truncate">{task.title}</span>
                    {task.labels.length > 0 && (
                      <span className="hidden lg:inline-flex items-center gap-0.5 text-gray-400"><Zap className="h-3 w-3" />{task.labels[0]}{task.labels.length > 1 && ` +${task.labels.length - 1}`}</span>
                    )}
                  </div>
                  <div><StatusBadge status={task.status} /></div>
                  <div><PriorityBadge priority={task.priority} /></div>
                  <div>
                    {task.epic ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); setFilters((f) => ({ ...f, epic_id: f.epic_id === task.epic!.id ? '' : task.epic!.id })) }}
                        className="flex items-center gap-1.5 max-w-full group"
                        title={`Filter by: ${task.epic.title}`}
                      >
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: task.epic.color }} />
                        <span className="text-xs text-gray-600 truncate group-hover:text-gray-900 group-hover:underline">{task.epic.title}</span>
                      </button>
                    ) : <span className="text-xs text-gray-300">—</span>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {task.assignee ? (
                      <>
                        <Avatar profile={task.assignee} size="xs" />
                        <span className="text-xs text-gray-600 truncate">{task.assignee.display_name ?? task.assignee.email}</span>
                      </>
                    ) : <span className="text-xs text-gray-300">—</span>}
                  </div>
                  <span className="text-xs text-gray-500">{formatDate(task.due_date)}</span>
                  <span className="text-xs text-gray-500" title={new Date(task.created_at).toLocaleString()}>{formatRelativeTime(task.created_at)}</span>
                  <div className="flex items-center gap-1.5">
                    {task.creator ? (
                      <>
                        <Avatar profile={task.creator} size="xs" />
                        <span className="text-xs text-gray-600 truncate">{task.creator.display_name ?? task.creator.email}</span>
                      </>
                    ) : <span className="text-xs text-gray-300">—</span>}
                  </div>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    {(task.comment_count ?? 0) > 0 && <><MessageSquare className="h-3.5 w-3.5" />{task.comment_count}</>}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New task" size="lg">
        <TaskForm onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} submitLabel={creating ? 'Creating…' : 'Create task'} />
      </Modal>

      <TaskModal taskId={selectedTaskId} currentUserId={currentUserId} onClose={() => setSelectedTaskId(null)} onNavigate={setSelectedTaskId} />
    </div>
  )
}
