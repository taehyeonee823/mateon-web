import type { ApiResponse } from './auth'
import { getAccessToken } from './tokenStorage'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

async function authedGet<T>(path: string): Promise<T> {
  const accessToken = getAccessToken()
  if (!accessToken) throw new Error('로그인이 필요합니다.')

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  const text = await response.text()
  const result: ApiResponse<T> | null = text ? JSON.parse(text) : null

  if (!response.ok || !result?.success) {
    throw new Error(result?.message || `조회 실패: ${response.status}`)
  }

  return result.data
}

type ApplicationSummary = { teamId: number; status: 'PENDING' | 'APPROVED' | 'REJECTED' }
type TeamSummary = { id: number }

export function getMyApplications() {
  return authedGet<ApplicationSummary[]>('/api/teams/applications/me')
}

export function getReceivedOffers() {
  return authedGet<unknown[]>('/api/teams/offers/me')
}

export function getMyTeams() {
  return authedGet<TeamSummary[]>('/api/teams?myPosts=true')
}

export function getTeamReviewTargets(teamId: number) {
  return authedGet<unknown>(`/api/teams/${teamId}/reviews/targets`)
}

export function fetchBookmarkedEventIds() {
  return authedGet<number[]>('/api/bookmarks/events/ids')
}

export async function getReviewableTeamCount(): Promise<number> {
  const [applications, myTeams] = await Promise.all([
    getMyApplications().catch(() => [] as ApplicationSummary[]),
    getMyTeams().catch(() => [] as TeamSummary[]),
  ])

  const teamIds = Array.from(
    new Set([
      ...applications.filter((a) => a.status === 'APPROVED').map((a) => a.teamId),
      ...myTeams.map((t) => t.id),
    ]),
  )

  const results = await Promise.all(
    teamIds.map((id) =>
      getTeamReviewTargets(id)
        .then(() => true)
        .catch(() => false),
    ),
  )

  return results.filter(Boolean).length
}
