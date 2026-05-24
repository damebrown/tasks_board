import { MessageSquare } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
import { CommentItem } from './CommentItem'
import { CommentForm } from './CommentForm'
import { useComments } from '@/hooks/useComments'

interface CommentListProps {
  taskId: string
  currentUserId: string
}

export function CommentList({ taskId, currentUserId }: CommentListProps) {
  const { data: comments, isLoading } = useComments(taskId)

  return (
    <div className="flex flex-col gap-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <MessageSquare className="h-4 w-4" />
        Comments {comments && comments.length > 0 && <span className="text-gray-400 font-normal">({comments.length})</span>}
      </h3>

      {isLoading && <div className="flex justify-center py-4"><Spinner /></div>}

      {!isLoading && comments && comments.length === 0 && (
        <p className="text-sm text-gray-400 py-2">No comments yet.</p>
      )}

      <div className="flex flex-col gap-4">
        {comments?.map((c) => <CommentItem key={c.id} comment={c} currentUserId={currentUserId} />)}
      </div>

      <CommentForm taskId={taskId} />
    </div>
  )
}
