import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Navbar } from '@/components/layout/Navbar'
import { Login } from '@/pages/Login'
import { AllTasks } from '@/pages/AllTasks'
import { SprintBoard } from '@/pages/SprintBoard'
import { Spinner } from '@/components/ui/Spinner'
import { SprintsManager } from '@/components/sprints/SprintsManager'
import type { Profile } from '@/types'

function AppInner() {
  const { user, loading, signOut } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [sprintsOpen, setSprintsOpen] = useState(false)

  useEffect(() => {
    if (!user) { setProfile(null); return }
    supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
      setProfile(data as Profile | null)
    })
  }, [user])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>
  }

  if (!user) return <Login />

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      <Navbar profile={profile} onSignOut={signOut} />
      <main className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<AllTasks currentUserId={user.id} />} />
          <Route path="/board" element={<SprintBoard currentUserId={user.id} onOpenSprints={() => setSprintsOpen(true)} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <SprintsManager open={sprintsOpen} onClose={() => setSprintsOpen(false)} />
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename="/tasks_board">
        <AppInner />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
