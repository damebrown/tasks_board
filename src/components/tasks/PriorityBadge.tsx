import { Badge } from '@/components/ui/Badge'
import { TASK_PRIORITY_LABELS, TASK_PRIORITY_COLORS } from '@/utils/consts'
import type { TaskPriority } from '@/types'

interface PriorityBadgeProps {
  priority: TaskPriority
}

const priorityIcons: Record<TaskPriority, string> = {
  low: '↓',
  medium: '→',
  high: '↑',
  critical: '⚡',
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <Badge className={TASK_PRIORITY_COLORS[priority]}>
      <span>{priorityIcons[priority]}</span>
      {TASK_PRIORITY_LABELS[priority]}
    </Badge>
  )
}
