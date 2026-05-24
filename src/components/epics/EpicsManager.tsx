import { useState } from 'react'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useEpics, useCreateEpic, useUpdateEpic, useDeleteEpic } from '@/hooks/useEpics'
import { EPIC_COLORS } from '@/utils/consts'
import type { Epic } from '@/types'

interface EpicsManagerProps {
  open: boolean
  onClose: () => void
}

export function EpicsManager({ open, onClose }: EpicsManagerProps) {
  const { data: epics } = useEpics()
  const { mutateAsync: createEpic, isPending: creating } = useCreateEpic()
  const { mutateAsync: updateEpic } = useUpdateEpic()
  const { mutateAsync: deleteEpic } = useDeleteEpic()

  const [newTitle, setNewTitle] = useState('')
  const [newColor, setNewColor] = useState(EPIC_COLORS[0])
  const [newDesc, setNewDesc] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editColor, setEditColor] = useState('')
  const [editDesc, setEditDesc] = useState('')

  async function handleCreate() {
    if (!newTitle.trim()) return
    await createEpic({ title: newTitle.trim(), description: newDesc.trim() || null, color: newColor })
    setNewTitle('')
    setNewDesc('')
    setNewColor(EPIC_COLORS[0])
  }

  function startEdit(epic: Epic) {
    setEditingId(epic.id)
    setEditTitle(epic.title)
    setEditColor(epic.color)
    setEditDesc(epic.description ?? '')
  }

  async function saveEdit(id: string) {
    await updateEpic({ id, title: editTitle.trim(), color: editColor, description: editDesc.trim() || null })
    setEditingId(null)
  }

  return (
    <Modal open={open} onClose={onClose} title="Manage Epics" size="md">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
          <h3 className="text-sm font-medium text-gray-700">New epic</h3>
          <Input placeholder="Epic title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }} />
          <Input placeholder="Description (optional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500">Color:</span>
            {EPIC_COLORS.map((c) => (
              <button key={c} onClick={() => setNewColor(c)} className={`w-6 h-6 rounded-full transition ${newColor === c ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`} style={{ backgroundColor: c }} />
            ))}
          </div>
          <Button size="sm" onClick={handleCreate} loading={creating} disabled={!newTitle.trim()}>
            <Plus className="h-4 w-4" /> Create epic
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          {epics?.map((epic) => (
            <div key={epic.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 group">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: epic.color }} />
              {editingId === epic.id ? (
                <div className="flex-1 flex flex-col gap-2">
                  <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="flex-1 text-sm px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                  <input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Description" className="flex-1 text-sm px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                  <div className="flex gap-1.5 flex-wrap">
                    {EPIC_COLORS.map((c) => (
                      <button key={c} onClick={() => setEditColor(c)} className={`w-5 h-5 rounded-full ${editColor === c ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`} style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(epic.id)} className="text-xs text-brand-600 hover:text-brand-800 flex items-center gap-1"><Check className="h-3 w-3" /> Save</button>
                    <button onClick={() => setEditingId(null)} className="text-xs text-gray-500 flex items-center gap-1"><X className="h-3 w-3" /> Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{epic.title}</p>
                    {epic.description && <p className="text-xs text-gray-500 truncate">{epic.description}</p>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => startEdit(epic)} className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => confirm('Delete this epic?') && deleteEpic(epic.id)} className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </>
              )}
            </div>
          ))}
          {epics?.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No epics yet.</p>}
        </div>
      </div>
    </Modal>
  )
}
