import type { TaskStatus, TaskPriority } from '@/types'

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  done: 'Done',
}

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  not_started: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-100 text-blue-700',
  blocked: 'bg-red-100 text-red-700',
  done: 'bg-green-100 text-green-700',
}

export const TASK_STATUS_DOT_COLORS: Record<TaskStatus, string> = {
  not_started: 'bg-gray-400',
  in_progress: 'bg-blue-500',
  blocked: 'bg-red-500',
  done: 'bg-green-500',
}

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
}

export const TASK_STATUSES: TaskStatus[] = ['not_started', 'in_progress', 'blocked', 'done']
export const TASK_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'critical']

export const EPIC_COLORS = [
  '#4263eb', '#7950f2', '#f03e3e', '#e67700',
  '#2f9e44', '#0c8599', '#1971c2', '#c2255c',
]

export const COMMENT_IMAGE_BUCKET = 'comment-images'

// Maximum file size for comment images: 5MB
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

export const BOARD_COLUMN_ORDER: TaskStatus[] = ['not_started', 'in_progress', 'blocked', 'done']
