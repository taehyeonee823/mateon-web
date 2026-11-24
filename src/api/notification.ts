import { requestJson } from '../lib/apiClient'

export type NotificationType = 'APPROVE' | 'REJECT' | 'INFO'

export type NotificationResponseDTO = {
  id: number
  title: string
  content: string
  type: NotificationType
  isRead: boolean
  createdAt: string
}

export async function getMyNotifications(): Promise<NotificationResponseDTO[]> {
  const result = await requestJson<NotificationResponseDTO[]>('/api/notifications', {
    fallbackMessage: '알림 조회 실패',
  })
  if (!result.success || !result.data) throw new Error(result.message)
  return result.data
}
