import { requestJson } from '../lib/apiClient'
import { saveTokens } from './tokenStorage'
import type { ConsentPayload } from '../lib/consent'

export type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
}

type AuthTokens = {
  accessToken: string
  refreshToken: string
}

async function postPublic<T>(path: string, body: unknown, fallbackMessage: string): Promise<T> {
  const result = await requestJson<T>(path, {
    method: 'POST',
    json: body,
    auth: 'none',
    fallbackMessage,
  })

  if (!result.success) {
    throw new Error(result.message || fallbackMessage)
  }

  return result.data as T
}

export async function requestEmailCode(email: string) {
  await postPublic<null>('/api/auth/email/request', { email }, '이메일 인증코드 발송 실패')
}

export async function verifyEmailCode(email: string, code: string) {
  const data = await postPublic<{ verificationToken: string }>(
    '/api/auth/email/verify',
    { email, code },
    '이메일 인증코드 검증 실패',
  )
  return data.verificationToken
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
} & ConsentPayload

export async function signUp(payload: SignUpPayload) {
  const data = await postPublic<AuthTokens>('/api/auth/signup', payload, '회원가입 실패')
  saveTokens(data.accessToken, data.refreshToken)
  return data
}

// keepLoggedIn=false면 토큰을 sessionStorage에 저장해 브라우저를 닫으면 로그아웃된다.
export async function loginWithEmail(
  email: string,
  password: string,
  options: { keepLoggedIn?: boolean } = {},
) {
  const data = await postPublic<AuthTokens>(
    '/api/auth/login',
    { email, password },
    '로그인 실패',
  )
  saveTokens(data.accessToken, data.refreshToken, options.keepLoggedIn ?? true)
  return data
}

// consent: 회원가입 화면에서 동의한 경우에만 전달. 신규 회원 생성 시 백엔드가 저장한다.
export async function loginWithKakao(kakaoAccessToken: string, consent?: ConsentPayload | null) {
  const data = await postPublic<AuthTokens>(
    '/api/auth/social/kakao',
    { accessToken: kakaoAccessToken, ...(consent ?? {}) },
    '카카오 로그인 실패',
  )
  saveTokens(data.accessToken, data.refreshToken)
  return data
}
