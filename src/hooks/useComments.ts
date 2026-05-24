import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { COMMENT_IMAGE_BUCKET, MAX_IMAGE_SIZE_BYTES } from '@/utils/consts'
import type { Comment, CommentImage } from '@/types'

const COMMENT_SELECT = `*, author:profiles!comments_created_by_fkey(id, email, display_name, avatar_url), images:comment_images(*)`

async function fetchComments(taskId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select(COMMENT_SELECT)
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as Comment[]
}

export function useComments(taskId: string) {
  return useQuery({
    queryKey: ['comments', taskId],
    queryFn: () => fetchComments(taskId),
    enabled: !!taskId,
  })
}

async function uploadImage(file: File, commentId: string): Promise<CommentImage> {
  if (file.size > MAX_IMAGE_SIZE_BYTES) throw new Error('Image exceeds 5MB limit.')
  const ext = file.name.split('.').pop() ?? 'png'
  const path = `${commentId}/${Date.now()}.${ext}`
  const { error: uploadError } = await supabase.storage.from(COMMENT_IMAGE_BUCKET).upload(path, file)
  if (uploadError) throw uploadError
  const { data: urlData } = supabase.storage.from(COMMENT_IMAGE_BUCKET).getPublicUrl(path)
  const { data, error } = await supabase
    .from('comment_images')
    .insert({ comment_id: commentId, storage_path: path, url: urlData.publicUrl })
    .select()
    .single()
  if (error) throw error
  return data as CommentImage
}

export function useCreateComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ taskId, content, images }: { taskId: string; content: string; images: File[] }) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('comments')
        .insert({ task_id: taskId, content, created_by: user!.id })
        .select()
        .single()
      if (error) throw error
      const comment = data as Comment
      if (images.length > 0) {
        await Promise.all(images.map((f) => uploadImage(f, comment.id)))
      }
      return comment
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['comments', vars.taskId] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['task', vars.taskId] })
    },
  })
}

export function useUpdateComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, content, taskId }: { id: string; content: string; taskId: string }) => {
      const { data, error } = await supabase.from('comments').update({ content }).eq('id', id).select().single()
      if (error) throw error
      return { comment: data as Comment, taskId }
    },
    onSuccess: ({ taskId }) => qc.invalidateQueries({ queryKey: ['comments', taskId] }),
  })
}

export function useDeleteComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, taskId }: { id: string; taskId: string }) => {
      const { error } = await supabase.from('comments').delete().eq('id', id)
      if (error) throw error
      return taskId
    },
    onSuccess: (taskId) => {
      qc.invalidateQueries({ queryKey: ['comments', taskId] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useDeleteCommentImage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ imageId, storagePath, taskId }: { imageId: string; storagePath: string; taskId: string }) => {
      await supabase.storage.from(COMMENT_IMAGE_BUCKET).remove([storagePath])
      const { error } = await supabase.from('comment_images').delete().eq('id', imageId)
      if (error) throw error
      return taskId
    },
    onSuccess: (taskId) => qc.invalidateQueries({ queryKey: ['comments', taskId] }),
  })
}
