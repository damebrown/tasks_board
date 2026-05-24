import { Badge } from '@/components/ui/Badge'
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS, TASK_STATUS_DOT_COLORS } from '@/utils/consts'
import type { TaskStatus } from '@/types'

interface StatusBadgeProps {
  status: TaskStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge className={TASK_STATUS_COLORS[status]}>
      <span className={`w-1.5 h-1.5 rounded-full ${TASK_STATUS_DOT_COLORS[status]}`} />
      {TASK_STATUS_LABELS[status]}
    </Badge>
  )
}
