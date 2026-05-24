export type TaskStatus = 'tbd' | 'not_started' | 'in_progress' | 'in_review' | 'blocked' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'

export interface Profile {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface Epic {
  id: string
  title: string
  description: string | null
  color: string
  created_at: string
  created_by: string
}

export interface Sprint {
  id: string
  name: string
  start_date: string | null
  end_date: string | null
  is_active: boolean
  created_at: string
}

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  sprint_id: string | null
  epic_id: string | null
  assignee_id: string | null
  due_date: string | null
  labels: string[]
  order: number
  created_at: string
  created_by: string
  epic?: Epic
  sprint?: Sprint
  assignee?: Profile
  creator?: Profile
  comment_count?: number
}

export interface Comment {
  id: string
  task_id: string
  content: string
  created_at: string
  created_by: string
  author?: Profile
  images?: CommentImage[]
}

export interface CommentImage {
  id: string
  comment_id: string
  storage_path: string
  url: string
  created_at: string
}

export interface TaskFilters {
  search: string
  status: TaskStatus | ''
  priority: TaskPriority | ''
  epic_id: string
  assignee_id: string
  sprint_id: string
  label: string
}
