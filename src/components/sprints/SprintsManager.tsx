import { useState } from 'react'
import { Plus, Play, Square, Pencil, Trash2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useSprints, useCreateSprint, useUpdateSprint, useDeleteSprint, useSetActiveSprint } from '@/hooks/useSprints'
import { formatDate } from '@/utils/format'
import type { Sprint } from '@/types'

interface SprintsManagerProps {
  open: boolean
  onClose: () => void
}

export function SprintsManager({ open, onClose }: SprintsManagerProps) {
  const { data: sprints } = useSprints()
  const { mutateAsync: createSprint, isPending: creating } = useCreateSprint()
  const { mutateAsync: updateSprint } = useUpdateSprint()
  const { mutateAsync: deleteSprint } = useDeleteSprint()
  const { mutateAsync: setActive, isPending: activating } = useSetActiveSprint()

  const [newName, setNewName] = useState('')
  const [newStart, setNewStart] = useState('')
  const [newEnd, setNewEnd] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editStart, setEditStart] = useState('')
  const [editEnd, setEditEnd] = useState('')

  async function handleCreate() {
    if (!newName.trim()) return
    await createSprint({ name: newName.trim(), start_date: newStart || null, end_date: newEnd || null })
    setNewName('')
    setNewStart('')
    setNewEnd('')
  }

  function startEdit(sprint: Sprint) {
    setEditingId(sprint.id)
    setEditName(sprint.name)
    setEditStart(sprint.start_date ?? '')
    setEditEnd(sprint.end_date ?? '')
  }

  async function saveEdit(id: string) {
    await updateSprint({ id, name: editName.trim(), start_date: editStart || null, end_date: editEnd || null })
    setEditingId(null)
  }

  const activeSprint = sprints?.find((s) => s.is_active)

  return (
    <Modal open={open} onClose={onClose} title="Manage Sprints" size="md">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
          <h3 className="text-sm font-medium text-gray-700">New sprint</h3>
          <Input placeholder="Sprint name (e.g. Sprint 1)" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }} />
          <div className="grid grid-cols-2 gap-2">
            <Input label="Start date" type="date" value={newStart} onChange={(e) => setNewStart(e.target.value)} />
            <Input label="End date" type="date" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} />
          </div>
          <Button size="sm" onClick={handleCreate} loading={creating} disabled={!newName.trim()}>
            <Plus className="h-4 w-4" /> Create sprint
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          {sprints?.map((sprint) => (
            <div key={sprint.id} className={`flex items-center gap-3 p-3 rounded-lg border group ${sprint.is_active ? 'border-green-200 bg-green-50' : 'border-gray-100 hover:bg-gray-50'}`}>
              {editingId === sprint.id ? (
                <div className="flex-1 flex flex-col gap-2">
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} className="text-sm px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" value={editStart} onChange={(e) => setEditStart(e.target.value)} className="text-sm px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                    <input type="date" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} className="text-sm px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(sprint.id)} className="text-xs text-brand-600 hover:text-brand-800 flex items-center gap-1"><Check className="h-3 w-3" /> Save</button>
                    <button onClick={() => setEditingId(null)} className="text-xs text-gray-500 flex items-center gap-1"><X className="h-3 w-3" /> Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-800">{sprint.name}</p>
                      {sprint.is_active && <span className="px-1.5 py-0.5 rounded text-xs bg-green-200 text-green-800 font-medium">Active</span>}
                    </div>
                    {(sprint.start_date || sprint.end_date) && (
                      <p className="text-xs text-gray-500">{formatDate(sprint.start_date)} – {formatDate(sprint.end_date)}</p>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    {sprint.is_active ? (
                      <button onClick={() => setActive(null)} disabled={activating} className="p-1 rounded text-green-600 hover:bg-green-100" title="Deactivate sprint">
                        <Square className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <button onClick={() => { if (!activeSprint || confirm(`This will deactivate "${activeSprint.name}". Continue?`)) setActive(sprint.id) }} disabled={activating} className="p-1 rounded text-gray-400 hover:text-green-600 hover:bg-green-50" title="Set as active sprint">
                        <Play className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button onClick={() => startEdit(sprint)} className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => confirm('Delete this sprint? Tasks will be unassigned.') && deleteSprint(sprint.id)} className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </>
              )}
            </div>
          ))}
          {sprints?.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No sprints yet.</p>}
        </div>
      </div>
    </Modal>
  )
}
