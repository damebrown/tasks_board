import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns'

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  if (isToday(date)) return formatDistanceToNow(date, { addSuffix: true })
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'MMM d, yyyy')
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return format(new Date(dateStr), 'MMM d, yyyy')
}

export function getInitials(name: string | null, email: string): string {
  if (name) {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  }
  return email.slice(0, 2).toUpperCase()
}

export function mentionify(content: string): string {
  return content.replace(/@([\w.+-]+@[\w-]+\.[\w.]+)/g, '<span class="mention">@$1</span>')
}

/** Linkify plain URLs that are not already wrapped in anchor tags. */
export function linkify(content: string): string {
  const urlRe = /(?<!href="|">)(https?:\/\/[^\s<"]+)/g
  return content.replace(urlRe, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-brand-600 underline">$1</a>')
}
