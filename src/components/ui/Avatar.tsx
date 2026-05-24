import { getInitials } from '@/utils/format'
import type { Profile } from '@/types'

interface AvatarProps {
  profile: Pick<Profile, 'display_name' | 'email' | 'avatar_url'> | null | undefined
  size?: 'xs' | 'sm' | 'md'
  className?: string
}

const sizes = { xs: 'h-5 w-5 text-[10px]', sm: 'h-7 w-7 text-xs', md: 'h-9 w-9 text-sm' }

export function Avatar({ profile, size = 'sm', className = '' }: AvatarProps) {
  if (!profile) {
    return <div className={`${sizes[size]} rounded-full bg-gray-200 flex items-center justify-center text-gray-400 font-medium flex-shrink-0 ${className}`}>?</div>
  }
  if (profile.avatar_url) {
    return <img src={profile.avatar_url} alt={profile.display_name ?? profile.email} className={`${sizes[size]} rounded-full object-cover flex-shrink-0 ${className}`} />
  }
  return (
    <div className={`${sizes[size]} rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-semibold flex-shrink-0 ${className}`}>
      {getInitials(profile.display_name, profile.email)}
    </div>
  )
}
