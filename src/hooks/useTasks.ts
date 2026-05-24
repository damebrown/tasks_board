import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Task, TaskStatus, TaskFilters } from '@/types'

const TASK_SELECT = `
  *,
  epic:epics(*),
  sprint:sprints(id, name, is_active),
  assignee:profiles!tasks_assignee_id_fkey(id, email, display_name, avatar_url),
  comment_count:comments(count)
`

async function fetchTasks(filters?: Partial<TaskFilters>): Promise<Task[]> {
  let query = supabase.from('tasks').select(TASK_SELECT).order('order', { ascending: true })

  if (filters?.search) {
    query = query.ilike('title', `%${filters.search}%`)
  }
  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.priority) query = query.eq('priority', filters.priority)
  if (filters?.epic_id) query = query.eq('epic_id', filters.epic_id)
  if (filters?.assignee_id) query = query.eq('assignee_id', filters.assignee_id)
  if (filters?.sprint_id === 'none') {
    query = query.is('sprint_id', null)
  } else if (filters?.sprint_id) {
    query = query.eq('sprint_id', filters.sprint_id)
  }
  if (filters?.label) query = query.contains('labels', [filters.label])

  const { data, error } = await query
  if (error) throw error
  return (data as unknown[]).map((t) => {
    const task = t as Record<string, unknown>
    const rawCount = task.comment_count
    const count = Array.isArray(rawCount) && rawCount.length > 0
      ? (rawCount[0] as { count: number }).count
      : 0
    return { ...task, comment_count: count } as Task
  })
}

async function fetchSprintTasks(sprintId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_SELECT)
    .eq('sprint_id', sprintId)
    .order('order', { ascending: true })
  if (error) throw error
  return (data as unknown[]).map((t) => {
    const task = t as Record<string, unknown>
    const rawCount = task.comment_count
    const count = Array.isArray(rawCount) && rawCount.length > 0
      ? (rawCount[0] as { count: number }).count
      : 0
    return { ...task, comment_count: count } as Task
  })
}

export function useTasks(filters?: Partial<TaskFilters>) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => fetchTasks(filters),
    placeholderData: (prev) => prev,
  })
}

export function useSprintTasks(sprintId: string | undefined) {
  return useQuery({
    queryKey: ['tasks', 'sprint', sprintId],
    queryFn: () => fetchSprintTasks(sprintId!),
    enabled: !!sprintId,
    placeholderData: (prev) => prev,
  })
}

export function useTask(id: string | undefined) {
  return useQuery({
    queryKey: ['task', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('tasks').select(TASK_SELECT).eq('id', id!).single()
      if (error) throw error
      const task = data as Record<string, unknown>
      const rawCount = task.comment_count
      const count = Array.isArray(rawCount) && rawCount.length > 0
        ? (rawCount[0] as { count: number }).count
        : 0
      return { ...task, comment_count: count } as Task
    },
    enabled: !!id,
  })
}

type CreateTaskPayload = Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'sprint_id' | 'epic_id' | 'assignee_id' | 'due_date' | 'labels'>

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateTaskPayload) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { count } = await supabase.from('tasks').select('*', { count: 'exact', head: true })
      const { data, error } = await supabase
        .from('tasks')
        .insert({ ...payload, created_by: user!.id, order: (count ?? 0) + 1 })
        .select(TASK_SELECT)
        .single()
      if (error) throw error
      return data as Task
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Task> & { id: string }) => {
      const { data, error } = await supabase.from('tasks').update(patch).eq('id', id).select(TASK_SELECT).single()
      if (error) throw error
      return data as Task
    },
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['task', task.id] })
    },
  })
}

export function useUpdateTaskStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      const { data, error } = await supabase.from('tasks').update({ status }).eq('id', id).select('id, status').single()
      if (error) throw error
      return data as Pick<Task, 'id' | 'status'>
    },
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ['tasks'] })
      const prevAll = qc.getQueriesData<Task[]>({ queryKey: ['tasks'] })
      qc.setQueriesData<Task[]>({ queryKey: ['tasks'] }, (old) =>
        old?.map((t) => (t.id === id ? { ...t, status } : t))
      )
      return { prevAll }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevAll) {
        ctx.prevAll.forEach(([key, val]) => qc.setQueryData(key, val))
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}
