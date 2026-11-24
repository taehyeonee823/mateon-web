import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getMyProfile, type UserProfile } from '../api/user'
import { clearTokens, getAccessToken } from '../api/tokenStorage'

type AuthContextValue = {
  profile: UserProfile | null
  isLoggedIn: boolean
  // 첫 프로필 조회가 끝나기 전에는 true. 가드는 이 값이 false일 때만 로그인 화면으로 보낸다.
  loading: boolean
  refresh: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  // 토큰이 있을 때만 첫 조회를 기다리므로, 토큰이 없으면 바로 false로 시작한다
  const [loading, setLoading] = useState<boolean>(() => !!getAccessToken())

  const refresh = async () => {
    if (!getAccessToken()) {
      setProfile(null)
      setLoading(false)
      return
    }
    try {
      const data = await getMyProfile()
      setProfile(data)
    } catch {
      clearTokens()
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    clearTokens()
    setProfile(null)
  }

  useEffect(() => {
    refresh()
  }, [])

  return (
    <AuthContext.Provider value={{ profile, isLoggedIn: !!profile, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
