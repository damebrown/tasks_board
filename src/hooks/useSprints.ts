import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Sprint } from '@/types'

async function fetchSprints(): Promise<Sprint[]> {
  const { data, error } = await supabase.from('sprints').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data as Sprint[]
}

export function useSprints() {
  return useQuery({ queryKey: ['sprints'], queryFn: fetchSprints })
}

export function useActiveSprint() {
  const { data: sprints } = useSprints()
  return sprints?.find((s) => s.is_active) ?? null
}

export function useCreateSprint() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Pick<Sprint, 'name' | 'start_date' | 'end_date'>) => {
      const { data, error } = await supabase.from('sprints').insert({ ...payload, is_active: false }).select().single()
      if (error) throw error
      return data as Sprint
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sprints'] }),
  })
}

export function useUpdateSprint() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Sprint> & { id: string }) => {
      const { data, error } = await supabase.from('sprints').update(patch).eq('id', id).select().single()
      if (error) throw error
      return data as Sprint
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sprints'] }),
  })
}

export function useSetActiveSprint() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string | null) => {
      // Deactivate all, then activate chosen one — done in two calls since no transactions in Supabase JS
      const { error: e1 } = await supabase.from('sprints').update({ is_active: false }).neq('id', '')
      if (e1) throw e1
      if (id) {
        const { error: e2 } = await supabase.from('sprints').update({ is_active: true }).eq('id', id)
        if (e2) throw e2
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sprints'] }),
  })
}

export function useDeleteSprint() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sprints').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sprints'] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
