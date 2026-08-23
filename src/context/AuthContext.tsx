import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getMyProfile, type UserProfile } from '../api/user'
import { clearTokens, getAccessToken } from '../api/tokenStorage'

type AuthContextValue = {
  profile: UserProfile | null
  isLoggedIn: boolean
  refresh: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)

  const refresh = async () => {
    if (!getAccessToken()) {
      setProfile(null)
      return
    }
    try {
      const data = await getMyProfile()
      setProfile(data)
    } catch {
      clearTokens()
      setProfile(null)
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
    <AuthContext.Provider value={{ profile, isLoggedIn: !!profile, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
