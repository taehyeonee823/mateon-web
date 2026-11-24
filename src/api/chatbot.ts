import { requestJson } from '../lib/apiClient'

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
  const result = await requestJson<MatchingIntentData>('/api/matching/intents/messages', {
    method: 'POST',
    json: { message },
    fallbackMessage: '챗봇 응답 실패',
  })
  if (!result.success || !result.data) throw new Error(result.message)
  return result.data
}
