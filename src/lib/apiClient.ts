import { getAccessToken } from '../api/tokenStorage'
import { NetworkError, UnauthorizedError } from './error'
import { safeFetch } from './apiErrorHandler'
import { refreshAccessToken } from './session'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export type JsonResult<T> = {
  success: boolean
  status: number
  message: string
  data: T | null
  code?: string
}

type RequestJsonOptions = {
  method?: string
  json?: unknown
  body?: BodyInit
  headers?: HeadersInit
  auth?: 'required' | 'optional' | 'none'
  signal?: AbortSignal
  cache?: RequestCache
  fallbackMessage: string
}

// 인증이 필요한 요청은 액세스 토큰을 붙이고, 401이면 한 번 갱신한 뒤 다시 보낸다.
export async function requestJson<T>(path: string, options: RequestJsonOptions): Promise<JsonResult<T>> {
  const auth = options.auth ?? 'required'
  return execute<T>(path, options, auth, false)
}

async function execute<T>(
  path: string,
  options: RequestJsonOptions,
  auth: NonNullable<RequestJsonOptions['auth']>,
  retried: boolean,
): Promise<JsonResult<T>> {
  const token = auth === 'none' ? null : getAccessToken()
  if (auth === 'required' && !token) {
    throw new UnauthorizedError('로그인이 필요합니다.')
  }

  const headers = new Headers(options.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let body = options.body
  if (options.json !== undefined) {
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
    body = JSON.stringify(options.json)
  }

  const response = await safeFetch(`${API_BASE_URL}${path}`, {
    method: options.method,
    headers,
    body,
    signal: options.signal,
    cache: options.cache,
  })

  // 공개 조회(optional)는 토큰이 만료됐어도 비로그인으로 한 번 더 받을 수 있어야 한다.
  if (response.status === 401 && auth === 'optional' && token && !retried && !options.signal?.aborted) {
    return execute<T>(path, options, 'none', true)
  }

  if (response.status === 401 && auth !== 'none' && token && !retried && !options.signal?.aborted) {
    const refreshed = await refreshAccessToken()
    if (options.signal?.aborted) {
      throw new DOMException('The operation was aborted.', 'AbortError')
    }
    if (refreshed === 'ok') return execute(path, options, auth, true)
    if (refreshed === 'unavailable') throw new NetworkError()
    throw new UnauthorizedError()
  }

  return readBody<T>(response, options.fallbackMessage)
}

async function readBody<T>(response: Response, fallbackMessage: string): Promise<JsonResult<T>> {
  const text = await response.text()
  let parsed: { success?: boolean; message?: string; data?: T; code?: string } | null = null

  if (text) {
    try {
      parsed = JSON.parse(text)
    } catch {
      return {
        success: false,
        status: response.status,
        message: `${fallbackMessage}: 응답 형식 오류 (${response.status})`,
        data: null,
      }
    }
  }

  const message = parsed?.message || `${fallbackMessage}: ${response.status}`
  const success = response.ok && parsed?.success === true

  return {
    success,
    status: response.status,
    message,
    data: success ? (parsed?.data ?? null) : null,
    code: parsed?.code,
  }
}

export function failureMessage(result: JsonResult<unknown>, fallback: string) {
  return result.message || fallback
}
