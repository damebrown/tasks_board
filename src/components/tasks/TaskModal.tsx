import { useState, useEffect } from 'react'
import { Pencil, Trash2, Calendar, User, Tag, Zap, GitBranch, X, Plus } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from './StatusBadge'
import { PriorityBadge } from './PriorityBadge'
import { TaskForm } from './TaskForm'
import { CommentList } from '@/components/comments/CommentList'
import { BlockersList } from './BlockersList'
import { useTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks'
import { useEpics } from '@/hooks/useEpics'
import { useSprints } from '@/hooks/useSprints'
import { useProfiles } from '@/hooks/useProfiles'
import { formatDate } from '@/utils/format'
import { TASK_STATUSES, TASK_PRIORITIES, TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '@/utils/consts'
import type { Task, TaskStatus, TaskPriority } from '@/types'

type EditableField = 'title' | 'description' | 'status' | 'priority' | 'epic_id' | 'sprint_id' | 'assignee_id' | 'due_date' | 'labels'

interface TaskModalProps {
  taskId: string | null
  currentUserId: string
  onClose: () => void
  onNavigate?: (taskId: string) => void
}

const FIELD_CLASS = 'cursor-pointer rounded px-1 -mx-1 hover:bg-gray-50 transition-colors'
const INLINE_SELECT_CLASS = 'rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white'

export function TaskModal({ taskId, currentUserId, onClose, onNavigate }: TaskModalProps) {
  const [editMode, setEditMode] = useState(false)
  const [editingField, setEditingField] = useState<EditableField | null>(null)
  const [titleDraft, setTitleDraft] = useState('')
  const [descDraft, setDescDraft] = useState('')
  const [localLabels, setLocalLabels] = useState<string[]>([])
  const [labelInput, setLabelInput] = useState('')

  const { data: task, isLoading } = useTask(taskId ?? undefined)
  const { mutateAsync: updateTask } = useUpdateTask()
  const { mutateAsync: deleteTask, isPending: deleting } = useDeleteTask()
  const { data: epics } = useEpics()
  const { data: sprints } = useSprints()
  const { data: profiles } = useProfiles()

  useEffect(() => {
    if (task) setLocalLabels(task.labels)
  }, [task?.id])

  async function saveField(field: string, value: unknown) {
    if (!task) return
    await updateTask({ id: task.id, [field]: value } as Partial<Task> & { id: string })
  }

  async function commitTitle() {
    const trimmed = titleDraft.trim()
    if (trimmed && trimmed !== task?.title) await saveField('title', trimmed)
    setEditingField(null)
  }

  async function commitDescription() {
    const val = descDraft.trim() || null
    if (val !== task?.description) await saveField('description', val)
    setEditingField(null)
  }

  async function addLabel() {
    const trimmed = labelInput.trim().toLowerCase()
    if (!trimmed || localLabels.includes(trimmed)) { setLabelInput(''); return }
    const next = [...localLabels, trimmed]
    setLocalLabels(next)
    setLabelInput('')
    await saveField('labels', next)
  }

  async function removeLabel(l: string) {
    const next = localLabels.filter((x) => x !== l)
    setLocalLabels(next)
    await saveField('labels', next)
  }

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
          {/* Title */}
          <div className="flex items-start justify-between gap-4">
            {editingField === 'title' ? (
              <input
                autoFocus
                className="flex-1 text-xl font-semibold text-gray-900 border-b-2 border-brand-500 outline-none bg-transparent leading-snug"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitTitle()
                  if (e.key === 'Escape') setEditingField(null)
                }}
              />
            ) : (
              <h1
                className={`text-xl font-semibold text-gray-900 leading-snug flex-1 ${FIELD_CLASS}`}
                onClick={() => { setTitleDraft(task.title); setEditingField('title') }}
                title="Click to edit"
              >
                {task.title}
              </h1>
            )}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="ghost" size="sm" onClick={() => setEditMode(true)}>
                <Pencil className="h-4 w-4" /> Edit
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDelete} loading={deleting} className="text-red-500 hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Status & Priority */}
          <div className="flex flex-wrap gap-2">
            {editingField === 'status' ? (
              <select
                autoFocus
                className={INLINE_SELECT_CLASS}
                value={task.status}
                onChange={async (e) => { await saveField('status', e.target.value as TaskStatus); setEditingField(null) }}
                onBlur={() => setEditingField(null)}
              >
                {TASK_STATUSES.map((s) => (
                  <option key={s} value={s}>{TASK_STATUS_LABELS[s]}</option>
                ))}
              </select>
            ) : (
              <div onClick={() => setEditingField('status')} className={FIELD_CLASS} title="Click to change status">
                <StatusBadge status={task.status} />
              </div>
            )}

            {editingField === 'priority' ? (
              <select
                autoFocus
                className={INLINE_SELECT_CLASS}
                value={task.priority}
                onChange={async (e) => { await saveField('priority', e.target.value as TaskPriority); setEditingField(null) }}
                onBlur={() => setEditingField(null)}
              >
                {TASK_PRIORITIES.map((p) => (
                  <option key={p} value={p}>{TASK_PRIORITY_LABELS[p]}</option>
                ))}
              </select>
            ) : (
              <div onClick={() => setEditingField('priority')} className={FIELD_CLASS} title="Click to change priority">
                <PriorityBadge priority={task.priority} />
              </div>
            )}
          </div>

          {/* Description */}
          {editingField === 'description' ? (
            <textarea
              autoFocus
              className="text-sm text-gray-600 leading-relaxed rounded-md border border-gray-300 px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={descDraft}
              rows={4}
              onChange={(e) => setDescDraft(e.target.value)}
              onBlur={commitDescription}
              onKeyDown={(e) => { if (e.key === 'Escape') setEditingField(null) }}
              placeholder="Add a description…"
            />
          ) : (
            <p
              className={`text-sm whitespace-pre-wrap leading-relaxed min-h-[1.5rem] ${FIELD_CLASS} ${task.description ? 'text-gray-600' : 'text-gray-400 italic'}`}
              onClick={() => { setDescDraft(task.description ?? ''); setEditingField('description') }}
              title="Click to edit description"
            >
              {task.description || 'Add a description…'}
            </p>
          )}

          {/* Metadata grid — always shows all 4 fields */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            {/* Epic */}
            <div className="flex items-center gap-2 text-gray-600 min-w-0">
              <Zap className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="font-medium text-gray-500 flex-shrink-0">Epic</span>
              {editingField === 'epic_id' ? (
                <select
                  autoFocus
                  className={INLINE_SELECT_CLASS}
                  value={task.epic_id ?? ''}
                  onChange={async (e) => { await saveField('epic_id', e.target.value || null); setEditingField(null) }}
                  onBlur={() => setEditingField(null)}
                >
                  <option value="">No epic</option>
                  {(epics ?? []).map((ep) => (
                    <option key={ep.id} value={ep.id}>{ep.title}</option>
                  ))}
                </select>
              ) : (
                <div onClick={() => setEditingField('epic_id')} className={FIELD_CLASS} title="Click to change epic">
                  {task.epic ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: task.epic.color }}>
                      {task.epic.title}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic text-xs">No epic</span>
                  )}
                </div>
              )}
            </div>

            {/* Sprint */}
            <div className="flex items-center gap-2 text-gray-600 min-w-0">
              <GitBranch className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="font-medium text-gray-500 flex-shrink-0">Sprint</span>
              {editingField === 'sprint_id' ? (
                <select
                  autoFocus
                  className={INLINE_SELECT_CLASS}
                  value={task.sprint_id ?? ''}
                  onChange={async (e) => { await saveField('sprint_id', e.target.value || null); setEditingField(null) }}
                  onBlur={() => setEditingField(null)}
                >
                  <option value="">No sprint</option>
                  {(sprints ?? []).map((sp) => (
                    <option key={sp.id} value={sp.id}>{sp.name}{sp.is_active ? ' (active)' : ''}</option>
                  ))}
                </select>
              ) : (
                <div onClick={() => setEditingField('sprint_id')} className={`${FIELD_CLASS} flex items-center gap-1`} title="Click to change sprint">
                  {task.sprint ? (
                    <>
                      <span className="text-gray-700">{task.sprint.name}</span>
                      {task.sprint.is_active && <span className="px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-700 font-medium">Active</span>}
                    </>
                  ) : (
                    <span className="text-gray-400 italic text-xs">No sprint</span>
                  )}
                </div>
              )}
            </div>

            {/* Assignee */}
            <div className="flex items-center gap-2 text-gray-600 min-w-0">
              <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="font-medium text-gray-500 flex-shrink-0">Assignee</span>
              {editingField === 'assignee_id' ? (
                <select
                  autoFocus
                  className={INLINE_SELECT_CLASS}
                  value={task.assignee_id ?? ''}
                  onChange={async (e) => { await saveField('assignee_id', e.target.value || null); setEditingField(null) }}
                  onBlur={() => setEditingField(null)}
                >
                  <option value="">Unassigned</option>
                  {(profiles ?? []).map((p) => (
                    <option key={p.id} value={p.id}>{p.display_name ?? p.email}</option>
                  ))}
                </select>
              ) : (
                <div onClick={() => setEditingField('assignee_id')} className={FIELD_CLASS} title="Click to change assignee">
                  {task.assignee ? (
                    <div className="flex items-center gap-1.5">
                      <Avatar profile={task.assignee} size="xs" />
                      <span className="text-gray-700">{task.assignee.display_name ?? task.assignee.email}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400 italic text-xs">Unassigned</span>
                  )}
                </div>
              )}
            </div>

            {/* Due date */}
            <div className="flex items-center gap-2 text-gray-600 min-w-0">
              <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="font-medium text-gray-500 flex-shrink-0">Due</span>
              {editingField === 'due_date' ? (
                <input
                  autoFocus
                  type="date"
                  className={INLINE_SELECT_CLASS}
                  defaultValue={task.due_date ?? ''}
                  onChange={async (e) => { await saveField('due_date', e.target.value || null); setEditingField(null) }}
                  onBlur={() => setEditingField(null)}
                />
              ) : (
                <div onClick={() => setEditingField('due_date')} className={FIELD_CLASS} title="Click to change due date">
                  {task.due_date ? (
                    <span className="text-gray-700">{formatDate(task.due_date)}</span>
                  ) : (
                    <span className="text-gray-400 italic text-xs">No due date</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Labels */}
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="h-4 w-4 text-gray-400 flex-shrink-0" />
            {localLabels.map((l) => (
              <span key={l} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                {l}
                <button type="button" onClick={() => removeLabel(l)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {editingField === 'labels' ? (
              <input
                autoFocus
                className="px-2 py-0.5 text-xs border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-brand-500 w-28"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); addLabel() }
                  if (e.key === 'Escape') setEditingField(null)
                }}
                onBlur={() => { if (labelInput.trim()) addLabel(); else setEditingField(null) }}
                placeholder="label…"
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditingField('labels')}
                className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-gray-50 border border-dashed border-gray-300 text-gray-400 hover:text-gray-600 hover:border-gray-400 text-xs transition-colors"
              >
                <Plus className="h-3 w-3" /> Add label
              </button>
            )}
          </div>

          {task.status === 'blocked' && (
            <div className="border-t border-red-100 pt-4">
              <BlockersList taskId={task.id} onNavigate={onNavigate} />
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
