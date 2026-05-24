import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Epic } from '@/types'

async function fetchEpics(): Promise<Epic[]> {
  const { data, error } = await supabase.from('epics').select('*').order('created_at')
  if (error) throw error
  return data as Epic[]
}

export function useEpics() {
  return useQuery({ queryKey: ['epics'], queryFn: fetchEpics })
}

export function useCreateEpic() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Pick<Epic, 'title' | 'description' | 'color'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase.from('epics').insert({ ...payload, created_by: user!.id }).select().single()
      if (error) throw error
      return data as Epic
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['epics'] }),
  })
}

export function useUpdateEpic() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Epic> & { id: string }) => {
      const { data, error } = await supabase.from('epics').update(patch).eq('id', id).select().single()
      if (error) throw error
      return data as Epic
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['epics'] }),
  })
}

export function useDeleteEpic() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('epics').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['epics'] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
