import type { ApiResponse } from './auth'
import { getAccessToken } from './tokenStorage'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

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
  const accessToken = getAccessToken()

  if (!accessToken) {
    throw new Error('로그인이 필요합니다.')
  }

  const response = await fetch(`${API_BASE_URL}/api/notifications`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  const text = await response.text()
  const result: ApiResponse<NotificationResponseDTO[]> | null = text ? JSON.parse(text) : null

  if (!response.ok || !result?.success) {
    throw new Error(result?.message || `알림 조회 실패: ${response.status}`)
  }

  return result.data
}
