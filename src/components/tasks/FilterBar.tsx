import { Search, X } from 'lucide-react'
import { useEpics } from '@/hooks/useEpics'
import { useSprints } from '@/hooks/useSprints'
import { useProfiles } from '@/hooks/useProfiles'
import { TASK_STATUSES, TASK_PRIORITIES, TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '@/utils/consts'
import type { TaskFilters } from '@/types'

interface FilterBarProps {
  filters: TaskFilters
  onChange: (filters: TaskFilters) => void
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const { data: epics } = useEpics()
  const { data: sprints } = useSprints()
  const { data: profiles } = useProfiles()

  function set(key: keyof TaskFilters, value: string) {
    onChange({ ...filters, [key]: value })
  }

  const hasActiveFilters = filters.status || filters.priority || filters.epic_id || filters.assignee_id || filters.sprint_id || filters.label || filters.search

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          value={filters.search}
          onChange={(e) => set('search', e.target.value)}
          placeholder="Search tasks…"
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
      </div>

      <select value={filters.status} onChange={(e) => set('status', e.target.value)} className="py-2 pl-3 pr-7 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
        <option value="">All statuses</option>
        {TASK_STATUSES.map((s) => <option key={s} value={s}>{TASK_STATUS_LABELS[s]}</option>)}
      </select>

      <select value={filters.priority} onChange={(e) => set('priority', e.target.value)} className="py-2 pl-3 pr-7 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
        <option value="">All priorities</option>
        {TASK_PRIORITIES.map((p) => <option key={p} value={p}>{TASK_PRIORITY_LABELS[p]}</option>)}
      </select>

      {epics && epics.length > 0 && (
        <select value={filters.epic_id} onChange={(e) => set('epic_id', e.target.value)} className="py-2 pl-3 pr-7 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
          <option value="">All epics</option>
          {epics.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
      )}

      {sprints && sprints.length > 0 && (
        <select value={filters.sprint_id} onChange={(e) => set('sprint_id', e.target.value)} className="py-2 pl-3 pr-7 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
          <option value="">All sprints</option>
          <option value="none">No sprint</option>
          {sprints.map((s) => <option key={s.id} value={s.id}>{s.name}{s.is_active ? ' (active)' : ''}</option>)}
        </select>
      )}

      {profiles && profiles.length > 0 && (
        <select value={filters.assignee_id} onChange={(e) => set('assignee_id', e.target.value)} className="py-2 pl-3 pr-7 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
          <option value="">All assignees</option>
          {profiles.map((p) => <option key={p.id} value={p.id}>{p.display_name ?? p.email}</option>)}
        </select>
      )}

      {hasActiveFilters && (
        <button onClick={() => onChange({ search: '', status: '', priority: '', epic_id: '', assignee_id: '', sprint_id: '', label: '' })} className="flex items-center gap-1 py-2 px-3 text-sm text-gray-500 hover:text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
          <X className="h-3.5 w-3.5" /> Clear
        </button>
      )}
    </div>
  )
}
