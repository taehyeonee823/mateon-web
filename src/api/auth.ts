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
