import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LayoutList, Kanban, Zap, GitBranch, LogOut } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { EpicsManager } from '@/components/epics/EpicsManager'
import { SprintsManager } from '@/components/sprints/SprintsManager'
import { useActiveSprint } from '@/hooks/useSprints'
import type { Profile } from '@/types'

interface NavbarProps {
  profile: Profile | null
  onSignOut: () => void
}

export function Navbar({ profile, onSignOut }: NavbarProps) {
  const location = useLocation()
  const activeSprint = useActiveSprint()
  const [epicsOpen, setEpicsOpen] = useState(false)
  const [sprintsOpen, setSprintsOpen] = useState(false)

  return (
    <>
      <nav className="h-14 border-b border-gray-200 bg-white px-4 flex items-center gap-4 flex-shrink-0 z-20">
        <div className="flex items-center gap-1.5 mr-4">
          <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
            <Kanban className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-gray-900">Tasks Board</span>
        </div>

        <div className="flex items-center gap-1">
          <Link to="/" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${location.pathname === '/' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            <LayoutList className="h-4 w-4" /> All Tasks
          </Link>
          <Link to="/board" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${location.pathname === '/board' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            <Kanban className="h-4 w-4" />
            Sprint Board
            {activeSprint && <span className="ml-1 px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-700">{activeSprint.name}</span>}
          </Link>
        </div>

        <div className="flex items-center gap-1 ml-4">
          <button onClick={() => setEpicsOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">
            <Zap className="h-4 w-4" /> Epics
          </button>
          <button onClick={() => setSprintsOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">
            <GitBranch className="h-4 w-4" /> Sprints
          </button>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Avatar profile={profile} size="sm" />
            <span className="hidden sm:block">{profile?.display_name ?? profile?.email}</span>
          </div>
          <button onClick={onSignOut} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition" title="Sign out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </nav>

      <EpicsManager open={epicsOpen} onClose={() => setEpicsOpen(false)} />
      <SprintsManager open={sprintsOpen} onClose={() => setSprintsOpen(false)} />
    </>
  )
}
