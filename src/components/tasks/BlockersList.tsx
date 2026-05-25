import { useState } from 'react'
import { X, Plus, Search } from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import { useBlockers, useAddBlocker, useRemoveBlocker } from '@/hooks/useBlockers'
import { useTasks } from '@/hooks/useTasks'

interface BlockersListProps {
  taskId: string
  onNavigate?: (taskId: string) => void
}

export function BlockersList({ taskId, onNavigate }: BlockersListProps) {
  const [adding, setAdding] = useState(false)
  const [search, setSearch] = useState('')

  const { data: blockers = [] } = useBlockers(taskId)
  const { data: allTasks = [] } = useTasks()
  const { mutateAsync: addBlocker } = useAddBlocker()
  const { mutateAsync: removeBlocker } = useRemoveBlocker()

  const blockerIds = new Set(blockers.map((b) => b.blocking_task_id))
  const candidates = allTasks.filter(
    (t) =>
      t.id !== taskId &&
      !blockerIds.has(t.id) &&
      (!search || t.title.toLowerCase().includes(search.toLowerCase())),
  )

  async function handleAdd(blockingTaskId: string) {
    await addBlocker({ blockedTaskId: taskId, blockingTaskId })
    setAdding(false)
    setSearch('')
  }

  async function handleRemove(relationId: string) {
    await removeBlocker({ relationId, blockedTaskId: taskId })
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Blocked by</span>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add blocker
        </button>
      </div>

      {blockers.length === 0 && !adding && (
        <p className="text-xs text-gray-400 italic">No blockers linked yet.</p>
      )}

      {blockers.map((b) => (
        <div key={b.id} className="flex items-center gap-2 py-1.5 px-2 rounded-md bg-red-50 border border-red-100 group">
          <StatusBadge status={b.blocking_task.status} />
          <button
            type="button"
            className="flex-1 text-sm text-left text-gray-800 hover:text-blue-600 truncate transition-colors"
            onClick={() => onNavigate?.(b.blocking_task_id)}
          >
            {b.blocking_task.title}
          </button>
          <button
            type="button"
            onClick={() => handleRemove(b.id)}
            className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            title="Remove blocker"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}

      {adding && (
        <div className="flex flex-col gap-1 border border-gray-200 rounded-md p-2 bg-white shadow-sm">
          <div className="flex items-center gap-1.5 px-2 py-1 border border-gray-200 rounded-md">
            <Search className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            <input
              autoFocus
              className="flex-1 text-sm outline-none placeholder:text-gray-400"
              placeholder="Search tickets…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-48 overflow-y-auto flex flex-col gap-0.5 mt-0.5">
            {candidates.length === 0 && (
              <p className="text-xs text-gray-400 px-2 py-1.5">No matching tickets.</p>
            )}
            {candidates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleAdd(t.id)}
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 text-left w-full"
              >
                <StatusBadge status={t.status} />
                <span className="text-sm text-gray-800 truncate">{t.title}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => { setAdding(false); setSearch('') }}
            className="text-xs text-gray-400 hover:text-gray-600 text-right mt-1 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
