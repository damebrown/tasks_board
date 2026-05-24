import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useEpics } from '@/hooks/useEpics'
import { useSprints } from '@/hooks/useSprints'
import { useProfiles } from '@/hooks/useProfiles'
import { TASK_STATUSES, TASK_PRIORITIES, TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '@/utils/consts'
import type { Task, TaskStatus, TaskPriority } from '@/types'

interface TaskFormProps {
  initial?: Partial<Task>
  onSubmit: (data: Omit<Task, 'id' | 'created_at' | 'created_by' | 'order' | 'epic' | 'sprint' | 'assignee' | 'comment_count'>) => Promise<void>
  onCancel: () => void
  submitLabel?: string
}

export function TaskForm({ initial, onSubmit, onCancel, submitLabel = 'Create task' }: TaskFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [status, setStatus] = useState<TaskStatus>(initial?.status ?? 'not_started')
  const [priority, setPriority] = useState<TaskPriority>(initial?.priority ?? 'medium')
  const [epicId, setEpicId] = useState(initial?.epic_id ?? '')
  const [sprintId, setSprintId] = useState(initial?.sprint_id ?? '')
  const [assigneeId, setAssigneeId] = useState(initial?.assignee_id ?? '')
  const [dueDate, setDueDate] = useState(initial?.due_date ?? '')
  const [labelInput, setLabelInput] = useState('')
  const [labels, setLabels] = useState<string[]>(initial?.labels ?? [])
  const [loading, setLoading] = useState(false)

  const { data: epics } = useEpics()
  const { data: sprints } = useSprints()
  const { data: profiles } = useProfiles()

  function addLabel() {
    const trimmed = labelInput.trim().toLowerCase()
    if (trimmed && !labels.includes(trimmed)) setLabels([...labels, trimmed])
    setLabelInput('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
        epic_id: epicId || null,
        sprint_id: sprintId || null,
        assignee_id: assigneeId || null,
        due_date: dueDate || null,
        labels,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input label="Title *" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" autoFocus required />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description…"
          rows={3}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as TaskStatus)}
          options={TASK_STATUSES.map((s) => ({ value: s, label: TASK_STATUS_LABELS[s] }))}
        />
        <Select
          label="Priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value as TaskPriority)}
          options={TASK_PRIORITIES.map((p) => ({ value: p, label: TASK_PRIORITY_LABELS[p] }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Epic"
          value={epicId}
          onChange={(e) => setEpicId(e.target.value)}
          placeholder="No epic"
          options={(epics ?? []).map((e) => ({ value: e.id, label: e.title }))}
        />
        <Select
          label="Sprint"
          value={sprintId}
          onChange={(e) => setSprintId(e.target.value)}
          placeholder="No sprint"
          options={(sprints ?? []).map((s) => ({ value: s.id, label: s.name + (s.is_active ? ' (active)' : '') }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Assignee"
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
          placeholder="Unassigned"
          options={(profiles ?? []).map((p) => ({ value: p.id, label: p.display_name ?? p.email }))}
        />
        <Input label="Due date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Labels</label>
        <div className="flex gap-2">
          <input
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLabel() } }}
            placeholder="Add label and press Enter"
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <Button type="button" variant="secondary" size="sm" onClick={addLabel}>Add</Button>
        </div>
        {labels.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {labels.map((l) => (
              <span key={l} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                {l}
                <button type="button" onClick={() => setLabels(labels.filter((x) => x !== l))} className="text-gray-400 hover:text-gray-600">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>{submitLabel}</Button>
      </div>
    </form>
  )
}
