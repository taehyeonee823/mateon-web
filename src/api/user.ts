import { requestJson } from '../lib/apiClient'

export type ParticipatedActivity = {
  id: number
  title: string
  category: string
}

export type UserProfile = {
  id: number
  email: string
  schoolEmail: string | null
  schoolVerified: boolean
  name: string
  campus: string | null
  college: string | null
  major: string | null
  grade: string | null
  interestJobPrimary: string | null
  interestJobSecondary: string | null
  interestJobTertiary: string | null
  tagline: string | null
  portfolio: string | null
  profileImageUrl: string | null
  collaborationTemperature: number | null
  collaborationReviewCount: number
  participatedActivities: ParticipatedActivity[]
  // 팀 추천 시 프로필/포트폴리오를 쓸지 (오래된 계정은 내려오지 않을 수 있어 optional)
  matchIncludeProfile?: boolean
  matchIncludePortfolio?: boolean
}

export async function getMyProfile() {
  const result = await requestJson<UserProfile>('/api/users/me', {
    cache: 'no-store',
    fallbackMessage: '내 정보 조회 실패',
  })
  if (!result.success || !result.data) throw new Error(result.message)
  return result.data
}

export type UpdateProfilePayload = {
  name: string
  college: string
  major: string
  interestJobPrimary: string
  interestJobSecondary: string
  interestJobTertiary: string
  schoolEmail?: string | null
  schoolVerified?: boolean
  profileImageUrl?: string | null
  tagline?: string | null
  portfolio?: string | null
  campus?: string | null
  grade?: string | null
  matchIncludeProfile?: boolean
  matchIncludePortfolio?: boolean
  verificationToken?: string
}

// PUT /api/users/me가 빠진 필드를 유지한다는 보장이 없어서, 한두 필드만 바꿀 때도
// 현재 프로필 값을 전부 실어 보낸다. 바꿀 필드만 spread로 덮어쓰면 된다.
export function profileToUpdatePayload(profile: UserProfile): UpdateProfilePayload {
  return {
    name: profile.name,
    college: profile.college ?? '',
    major: profile.major ?? '',
    interestJobPrimary: profile.interestJobPrimary ?? '',
    interestJobSecondary: profile.interestJobSecondary ?? '',
    interestJobTertiary: profile.interestJobTertiary ?? '',
    schoolEmail: profile.schoolEmail,
    schoolVerified: profile.schoolVerified,
    profileImageUrl: profile.profileImageUrl,
    tagline: profile.tagline,
    portfolio: profile.portfolio,
    campus: profile.campus,
    grade: profile.grade,
    matchIncludeProfile: profile.matchIncludeProfile ?? true,
    matchIncludePortfolio: profile.matchIncludePortfolio ?? true,
  }
}

export async function updateProfile(payload: UpdateProfilePayload) {
  const result = await requestJson<UserProfile>('/api/users/me', {
    method: 'PUT',
    json: payload,
    cache: 'no-store',
    fallbackMessage: '회원정보 수정 실패',
  })
  if (!result.success || !result.data) throw new Error(result.message)
  return result.data
}

export async function uploadProfileImage(file: File) {
  const formData = new FormData()
  formData.append('image', file)

  const result = await requestJson<null>('/api/users/me/profile-image', {
    method: 'POST',
    body: formData,
    fallbackMessage: '프로필 사진 업로드 실패',
  })
  if (!result.success) throw new Error(result.message)
}

export async function deleteProfileImage() {
  const result = await requestJson<null>('/api/users/me/profile-image', {
    method: 'DELETE',
    fallbackMessage: '프로필 사진 삭제 실패',
  })
  if (!result.success) throw new Error(result.message)
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
  newPasswordConfirm: string,
) {
  const result = await requestJson<unknown>('/api/users/password/change', {
    method: 'POST',
    json: { currentPassword, newPassword, newPasswordConfirm },
    fallbackMessage: '비밀번호 변경 실패',
  })
  if (!result.success) throw new Error(result.message)
}

export type PublicUserProfile = {
  userId: number
  name: string
  profileImageUrl: string | null
  activityStyle: string | null
  campus: string | null
  collaborationReviewCount: number
  collaborationTemperature: number | null
  college: string | null
  desiredRoles: string[]
  experienceLevel: string | null
  grade: string | null
  interestJobPrimary: string | null
  interestJobSecondary: string | null
  interestJobTertiary: string | null
  isMe: boolean
  major: string | null
  me: boolean
  participatedActivities: { category: string; id: number; title: string }[]
  portfolio: string | null
  school: string | null
  schoolVerified: boolean
  skills: string[]
  tagline: string | null
}

// 타인의 공개 프로필 조회 (DM 상대방 사진 등에 사용). 본인 이메일 등 민감 정보는 내려오지 않음
export async function getPublicUserProfile(userId: number): Promise<PublicUserProfile> {
  const result = await requestJson<PublicUserProfile>(`/api/users/${userId}`, {
    fallbackMessage: '사용자 정보 조회 실패',
  })
  if (!result.success || !result.data) throw new Error(result.message)
  return result.data
}
