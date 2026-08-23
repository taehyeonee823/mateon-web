import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import Footer from '../components/Footer'
import { loginWithKakao } from '../api/auth'
import { useAuth } from '../context/AuthContext'

const KAKAO_JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY as string | undefined

async function exchangeCodeForKakaoAccessToken(code: string, redirectUri: string) {
  const response = await fetch('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: KAKAO_JS_KEY ?? '',
      redirect_uri: redirectUri,
      code,
    }),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error_description || '카카오 토큰 발급에 실패했어요.')
  }

  return result.access_token as string
}

export default function KakaoCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { refresh } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    const code = searchParams.get('code')
    const errorParam = searchParams.get('error')

    if (errorParam) {
      setError(searchParams.get('error_description') || '카카오 로그인이 취소됐어요.')
      return
    }

    if (!code) {
      setError('카카오 인가 코드를 받지 못했어요.')
      return
    }

    const redirectUri = `${window.location.origin}/oauth/kakao/callback`

    exchangeCodeForKakaoAccessToken(code, redirectUri)
      .then((kakaoAccessToken) => loginWithKakao(kakaoAccessToken))
      .then(() => refresh())
      .then(() => navigate('/'))
      .catch((err) => {
        setError(err instanceof Error ? err.message : '잠시 후 다시 시도해주세요.')
      })
  }, [searchParams, navigate, refresh])

  return (
    <div className="min-h-screen bg-white">
      <Sidebar />
      <div className="md:pl-60">
        <Topbar />

        <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
          {error ? (
            <>
              <p className="text-lg font-semibold text-rose-500">{error}</p>
              <Link
                to="/login"
                className="rounded-full bg-[#2554F0] px-6 py-3 text-sm font-semibold text-white"
              >
                로그인으로 돌아가기
              </Link>
            </>
          ) : (
            <p className="text-sm text-brand-400">카카오 로그인 처리 중...</p>
          )}
        </main>

        <Footer />
      </div>
    </div>
  )
}
