import { useCallback, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Image, X, Send } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useCreateComment } from '@/hooks/useComments'
import { MAX_IMAGE_SIZE_BYTES } from '@/utils/consts'

interface CommentFormProps {
  taskId: string
}

export function CommentForm({ taskId }: CommentFormProps) {
  const [content, setContent] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { mutateAsync: createComment, isPending } = useCreateComment()

  const onDrop = useCallback((accepted: File[]) => {
    const valid = accepted.filter((f) => f.size <= MAX_IMAGE_SIZE_BYTES)
    setImages((prev) => [...prev, ...valid])
    const newPreviews = valid.map((f) => URL.createObjectURL(f))
    setPreviews((prev) => [...prev, ...newPreviews])
  }, [])

  const { getInputProps, open } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    noClick: true,
    noKeyboard: true,
  })

  function removeImage(idx: number) {
    URL.revokeObjectURL(previews[idx])
    setImages((prev) => prev.filter((_, i) => i !== idx))
    setPreviews((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() && images.length === 0) return
    await createComment({ taskId, content: content.trim(), images })
    setContent('')
    previews.forEach((p) => URL.revokeObjectURL(p))
    setImages([])
    setPreviews([])
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <input {...getInputProps()} />
      <div className="relative rounded-lg border border-gray-200 focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-transparent transition">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a comment… (⌘↵ to submit)"
          rows={3}
          className="w-full px-3 pt-3 pb-1 text-sm resize-none focus:outline-none rounded-t-lg"
        />
        {previews.length > 0 && (
          <div className="flex flex-wrap gap-2 px-3 py-2">
            {previews.map((src, i) => (
              <div key={i} className="relative group">
                <img src={src} alt="" className="h-16 w-16 object-cover rounded-md border border-gray-200" />
                <button type="button" onClick={() => removeImage(i)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100">
          <button type="button" onClick={open} className="text-gray-400 hover:text-gray-600 transition" title="Attach image">
            <Image className="h-4 w-4" />
          </button>
          <Button type="submit" size="sm" loading={isPending} disabled={!content.trim() && images.length === 0}>
            <Send className="h-3.5 w-3.5" /> Post
          </Button>
        </div>
      </div>
    </form>
  )
}
