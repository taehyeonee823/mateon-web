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

export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type Application = {
  applicationId: number
  teamId: number
  teamTitle: string
  introduction: string
  message: string
  contactNumber: string
  portfolioUrl: string
  isMine: boolean
  status: ApplicationStatus
  createdAt: string
}

export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELED'

export type TeamOffer = {
  offerId: number
  teamId: number
  teamTitle: string
  promotionText: string
  role: string[]
  requiredSkills: string[]
  capacity: number
  eventId: number | null
  leaderId: number
  leaderName: string | null
  targetUserId: number
  targetUserName: string
  targetUserSchool: string
  targetUserMajor: string
  message: string | null
  aiScore: number | null
  aiLabel: string | null
  status: OfferStatus
  createdAt: string
  respondedAt: string | null
}

export type TeamPost = {
  id: number
  title: string
  role: string[]
  requiredSkills: string[]
  promotionText: string
  characteristic: string
  capacity: number
  currentMemberCount: number
  eventId: number | null
  connectedActivityTitle: string | null
  recruiting: boolean
  recruitmentStartDate: string
  recruitmentEndDate: string
}

export type TeamReviewTarget = {
  userId: number
  name: string
  major: string
  alreadyReviewed: boolean
}

export type TeamReviewTargets = {
  teamId: number
  teamTitle: string
  endedAt: string
  reviewDeadline: string
  targets: TeamReviewTarget[]
}

export function getMyApplications() {
  return authedGet<Application[]>('/api/teams/applications/me')
}

export function getReceivedOffers() {
  return authedGet<TeamOffer[]>('/api/teams/offers/me')
}

export function getMyTeams() {
  return authedGet<TeamPost[]>('/api/teams?myPosts=true')
}

async function authedMutate<T>(path: string, method: string, body?: unknown): Promise<T> {
  const accessToken = getAccessToken()
  if (!accessToken) throw new Error('로그인이 필요합니다.')

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const text = await response.text()
  const result: ApiResponse<T> | null = text ? JSON.parse(text) : null

  if (!response.ok || !result?.success) {
    throw new Error(result?.message || `요청 실패: ${response.status}`)
  }

  return result.data
}

export function respondToOffer(offerId: number, accepted: boolean) {
  return authedMutate<TeamOffer>(`/api/teams/offers/${offerId}`, 'PATCH', { accepted })
}

export function cancelApplication(applicationId: number) {
  return authedMutate<null>(`/api/teams/applications/${applicationId}`, 'DELETE')
}

export function getTeamReviewTargets(teamId: number) {
  return authedGet<TeamReviewTargets>(`/api/teams/${teamId}/reviews/targets`)
}

export type TeamReviewSubmission = {
  revieweeId: number
  rating: number
}

export async function submitTeamReviews(teamId: number, reviews: TeamReviewSubmission[]) {
  const accessToken = getAccessToken()
  if (!accessToken) throw new Error('로그인이 필요합니다.')

  const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ reviews }),
  })

  const text = await response.text()
  const result: ApiResponse<null> | null = text ? JSON.parse(text) : null

  if (!response.ok || !result?.success) {
    throw new Error(result?.message || `평가 제출 실패: ${response.status}`)
  }
}

export function fetchBookmarkedEventIds() {
  return authedGet<number[]>('/api/bookmarks/events/ids')
}

export async function getContestCount(): Promise<number> {
  const response = await fetch(`${API_BASE_URL}/api/teams`)
  const result: ApiResponse<{ id: number }[]> = await response.json()

  if (!response.ok || !result.success) {
    throw new Error(result.message || `조회 실패: ${response.status}`)
  }

  return result.data.length
}

// 평가 가능한(종료된) 팀만 골라서 팀별 평가 대상 목록을 모아준다.
// 리더로 모집한 팀 + 승인되어 참여한 팀을 후보로 모으고, 각각 reviews/targets를
// 호출해 성공(= 종료돼서 평가 가능)한 것만 남긴다.
export async function getReviewableTeams(): Promise<TeamReviewTargets[]> {
  const [applications, myTeams] = await Promise.all([
    getMyApplications().catch(() => [] as Application[]),
    getMyTeams().catch(() => [] as TeamPost[]),
  ])

  const teamIds = Array.from(
    new Set([
      ...applications.filter((a) => a.status === 'APPROVED').map((a) => a.teamId),
      ...myTeams.map((t) => t.id),
    ]),
  )

  const results = await Promise.all(
    teamIds.map((id) => getTeamReviewTargets(id).catch(() => null)),
  )

  return results.filter((r): r is TeamReviewTargets => r !== null)
}

export async function getReviewableTeamCount(): Promise<number> {
  const teams = await getReviewableTeams()
  return teams.filter((t) => t.targets.some((target) => !target.alreadyReviewed)).length
}
