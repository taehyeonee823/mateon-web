import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// 로그인이 필요한 라우트를 감싼다.
// - 첫 프로필 조회 중에는 대기 화면을 보여 준다 (새로고침 직후 튕김 방지).
// - 조회가 끝났는데 로그인되어 있지 않으면 /login으로 보내고, 원래 경로를 state.from에 남긴다.
export default function RequireAuth({ children }: { children: ReactNode }) {
  const { isLoggedIn, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center text-sm text-slate-400">
        불러오는 중이에요…
      </main>
    )
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}