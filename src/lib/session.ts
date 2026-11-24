import { clearTokens, getRefreshToken, isPersistentSession, saveTokens } from '../api/tokenStorage'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export type SessionEvent = 'refreshed' | 'cleared'

type SessionListener = (event: SessionEvent) => void

const listeners = new Set<SessionListener>()

export function onSessionChange(listener: SessionListener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function emit(event: SessionEvent) {
  listeners.forEach((listener) => listener(event))
}

export function expireSession() {
  clearTokens()
  emit('cleared')
}

export type RefreshResult = 'ok' | 'invalid' | 'unavailable'

let inflight: Promise<RefreshResult> | null = null

// 액세스 토큰이 만료되면 저장해 둔 리프레시 토큰으로 한 번만 재발급한다.
// 동시에 여러 요청이 401을 받아도 갱신 요청은 하나로 합친다.
export function refreshAccessToken() {
  if (!inflight) {
    inflight = runRefresh().finally(() => {
      inflight = null
    })
  }
  return inflight
}

async function runRefresh(): Promise<RefreshResult> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    expireSession()
    return 'invalid'
  }

  const persistent = isPersistentSession()

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })

    const text = await response.text()
    let result: {
      success?: boolean
      data?: { accessToken?: string; refreshToken?: string }
    } | null = null
    if (text) {
      try {
        result = JSON.parse(text)
      } catch {
        result = null
      }
    }

    const accessToken = result?.data?.accessToken
    const nextRefreshToken = result?.data?.refreshToken
    if (!response.ok || !result?.success || !accessToken || !nextRefreshToken) {
      if (response.status === 401 || response.status === 403) expireSession()
      return 'invalid'
    }

    saveTokens(accessToken, nextRefreshToken, persistent)
    emit('refreshed')
    return 'ok'
  } catch {
    // 네트워크가 잠깐 끊긴 경우에는 저장해 둔 로그인 정보를 지우지 않는다.
    return 'unavailable'
  }
}
