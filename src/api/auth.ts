import { saveTokens } from './tokenStorage'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
}

type AuthTokens = {
  accessToken: string
  refreshToken: string
}

export async function requestEmailCode(email: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/email/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })

  const result: ApiResponse<null> = await response.json()

  if (!response.ok || !result.success) {
    throw new Error(result.message || `이메일 인증코드 발송 실패: ${response.status}`)
  }

  return result
}

export async function verifyEmailCode(email: string, code: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/email/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  })

  const result: ApiResponse<{ verificationToken: string }> = await response.json()

  if (!response.ok || !result.success) {
    throw new Error(result.message || `이메일 인증코드 검증 실패: ${response.status}`)
  }

  return result.data.verificationToken
}

export type SignUpPayload = {
  email: string
  password?: string
  passwordConfirm?: string
  verificationToken?: string
  provider: 'LOCAL' | 'KAKAO'
  providerId: string | null
  schoolEmail: string | null
  school?: string
  name: string
  college: string
  major: string
  interestJobPrimary: string
  interestJobSecondary: string
  interestJobTertiary: string
  tagline: string | null
}

export async function signUp(payload: SignUpPayload) {
  const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const result: ApiResponse<AuthTokens> = await response.json()

  if (!response.ok || !result.success) {
    throw new Error(result.message || `회원가입 실패: ${response.status}`)
  }

  saveTokens(result.data.accessToken, result.data.refreshToken)

  return result.data
}

export async function loginWithEmail(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const result: ApiResponse<AuthTokens> = await response.json()

  if (!response.ok || !result.success) {
    throw new Error(result.message || `로그인 실패: ${response.status}`)
  }

  saveTokens(result.data.accessToken, result.data.refreshToken)

  return result.data
}

export async function loginWithKakao(kakaoAccessToken: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/social/kakao`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken: kakaoAccessToken }),
  })

  const result: ApiResponse<AuthTokens> = await response.json()

  if (!response.ok || !result.success) {
    throw new Error(result.message || `카카오 로그인 실패: ${response.status}`)
  }

  saveTokens(result.data.accessToken, result.data.refreshToken)

  return result.data
}
