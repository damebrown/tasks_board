import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Task } from '@/types'

const BLOCKER_SELECT = `
  id,
  blocking_task_id,
  created_at,
  blocking_task:tasks!task_blockers_blocking_task_id_fkey(id, title, status, priority)
`

export interface BlockerRelation {
  id: string
  blocking_task_id: string
  created_at: string
  blocking_task: Pick<Task, 'id' | 'title' | 'status' | 'priority'>
}

export function useBlockers(taskId: string | undefined) {
  return useQuery({
    queryKey: ['blockers', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_blockers')
        .select(BLOCKER_SELECT)
        .eq('blocked_task_id', taskId!)
      if (error) throw error
      return data as BlockerRelation[]
    },
    enabled: !!taskId,
  })
}

export function useAddBlocker() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ blockedTaskId, blockingTaskId }: { blockedTaskId: string; blockingTaskId: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('task_blockers')
        .insert({ blocked_task_id: blockedTaskId, blocking_task_id: blockingTaskId, created_by: user!.id })
        .select(BLOCKER_SELECT)
        .single()
      if (error) throw error
      return data as BlockerRelation
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['blockers', vars.blockedTaskId] })
    },
  })
}

export function useRemoveBlocker() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ relationId, blockedTaskId }: { relationId: string; blockedTaskId: string }) => {
      const { error } = await supabase.from('task_blockers').delete().eq('id', relationId)
      if (error) throw error
      return blockedTaskId
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['blockers', vars.blockedTaskId] })
    },
  })
}
