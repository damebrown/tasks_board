import { useState } from 'react'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { useUpdateComment, useDeleteComment, useDeleteCommentImage } from '@/hooks/useComments'
import { formatRelativeTime, mentionify, linkify } from '@/utils/format'
import type { Comment } from '@/types'

interface CommentItemProps {
  comment: Comment
  currentUserId: string
}

export function CommentItem({ comment, currentUserId }: CommentItemProps) {
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const { mutateAsync: updateComment, isPending: updating } = useUpdateComment()
  const { mutateAsync: deleteComment, isPending: deleting } = useDeleteComment()
  const { mutateAsync: deleteImage } = useDeleteCommentImage()

  const isOwner = comment.created_by === currentUserId

  async function handleSaveEdit() {
    if (!editContent.trim()) return
    await updateComment({ id: comment.id, content: editContent.trim(), taskId: comment.task_id })
    setEditing(false)
  }

  function renderContent(text: string) {
    let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>')
    html = mentionify(html)
    html = linkify(html)
    return html
  }

  return (
    <div className="flex gap-3 group">
      <Avatar profile={comment.author} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-900">
            {comment.author?.display_name ?? comment.author?.email ?? 'Unknown'}
          </span>
          <span className="text-xs text-gray-400">{formatRelativeTime(comment.created_at)}</span>
        </div>

        {editing ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
              autoFocus
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
            <div className="flex gap-2">
              <button onClick={handleSaveEdit} disabled={updating} className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 font-medium">
                <Check className="h-3.5 w-3.5" /> Save
              </button>
              <button onClick={() => { setEditing(false); setEditContent(comment.content) }} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
                <X className="h-3.5 w-3.5" /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            className="text-sm text-gray-700 leading-relaxed [&_.mention]:text-brand-600 [&_.mention]:font-medium [&_a]:text-brand-600 [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: renderContent(comment.content) }}
          />
        )}

        {comment.images && comment.images.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {comment.images.map((img) => (
              <div key={img.id} className="relative group/img">
                <a href={img.url} target="_blank" rel="noopener noreferrer">
                  <img src={img.url} alt="" className="h-20 max-w-xs rounded-lg border border-gray-200 object-cover hover:opacity-90 transition" />
                </a>
                {isOwner && (
                  <button
                    onClick={() => deleteImage({ imageId: img.id, storagePath: img.storage_path, taskId: comment.task_id })}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/img:opacity-100 transition"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {isOwner && !editing && (
        <div className="flex items-start gap-1 opacity-0 group-hover:opacity-100 transition mt-0.5 flex-shrink-0">
          <button onClick={() => setEditing(true)} className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => deleteComment({ id: comment.id, taskId: comment.task_id })} disabled={deleting} className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
