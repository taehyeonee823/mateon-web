import type { NotificationResponseDTO, NotificationType } from '../api/notification'

const NOTIFICATION_ICON: Record<NotificationType, { icon: string; bg: string }> = {
  APPROVE: { icon: '/noti/rocket_fill.svg', bg: 'bg-emerald-50' },
  REJECT: { icon: '/noti/rocket_fill.svg', bg: 'bg-rose-50' },
  INFO: { icon: '/noti/message_fill.svg', bg: 'bg-[#2554F0]/10' },
}

export type GroupedNotification = NotificationResponseDTO & { count: number }

// 팀/활동 알림은 하나하나 내용이 다 달라서 묶지 않고, 메시지(채팅) 알림만
// 같은 상대와 연달아 왔을 때 한 줄로 묶어 "+N"으로 나머지 개수를 표시한다.
function isMessageNotification(n: NotificationResponseDTO) {
  const isTeamRelated = n.title.includes('팀') || n.content.includes('팀')
  return !isTeamRelated && n.type === 'INFO'
}

export function groupConsecutiveNotifications(list: NotificationResponseDTO[]): GroupedNotification[] {
  const grouped: GroupedNotification[] = []

  for (const n of list) {
    const last = grouped[grouped.length - 1]
    if (
      last &&
      isMessageNotification(n) &&
      isMessageNotification(last) &&
      last.title === n.title &&
      last.type === n.type
    ) {
      last.count += 1
    } else {
      grouped.push({ ...n, count: 1 })
    }
  }

  return grouped
}

export function getNotificationIcon(n: NotificationResponseDTO) {
  const isTeamRelated = n.title.includes('팀') || n.content.includes('팀')

  if (isTeamRelated) {
    return { icon: '/noti/rocket_fill.svg', bg: n.type === 'REJECT' ? 'bg-rose-50' : 'bg-emerald-50' }
  }

  return NOTIFICATION_ICON[n.type]
}

export function formatRelativeTime(dateString: string) {
  const diffMs = Date.now() - new Date(dateString).getTime()
  const minutes = Math.floor(diffMs / (1000 * 60))

  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}일 전`

  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}주 전`

  const months = Math.floor(days / 30)
  if (months < 12) return `${months}개월 전`

  return `${Math.floor(days / 365)}년 전`
}
