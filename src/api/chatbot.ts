import type { ApiResponse } from './auth'
import { getAccessToken } from './tokenStorage'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export type MatchingIntentExtracted = {
  desiredRoles: string[]
  skills: string[]
  interests: string[]
  activityGoal: string | null
  activityStyle: string | null
  experienceLevel: string | null
}

export type MatchingIntentData = {
  sessionId: number
  slotId: number | null
  completed: boolean
  missingFields: string[]
  extracted: MatchingIntentExtracted
  assistantMessage: string
}

export async function sendChatbotMessage(message: string): Promise<MatchingIntentData> {
  const accessToken = getAccessToken()
  if (!accessToken) throw new Error('로그인이 필요합니다.')

  const response = await fetch(`${API_BASE_URL}/api/matching/intents/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ message }),
  })

  const text = await response.text()
  const result: ApiResponse<MatchingIntentData> | null = text ? JSON.parse(text) : null

  if (!response.ok || !result?.success) {
    throw new Error(result?.message || `챗봇 응답 실패: ${response.status}`)
  }

  return result.data
}
