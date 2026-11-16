import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loginWithEmail } from '../api/auth'
import { redirectToKakaoLogin } from '../lib/kakao'
import { useAuth } from '../context/AuthContext'

function EyeIcon({ off = false, className = '' }: { off?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="M4 4l16 16" />}
    </svg>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const { refresh } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [keepLoggedIn, setKeepLoggedIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.')
      return
    }
    if (isLoggingIn) return

    setError(null)
    setIsLoggingIn(true)
    try {
      await loginWithEmail(email, password, { keepLoggedIn })
      await refresh()
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : '잠시 후 다시 시도해주세요.')
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleKakaoLogin = () => {
    setError(null)
    try {
      redirectToKakaoLogin(`${window.location.origin}/oauth/kakao/callback`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '잠시 후 다시 시도해주세요.')
    }
  }

  const inputClassName =
    'h-12 w-full rounded-lg border border-[#E1E2EA] bg-white px-4 text-sm text-[#1B1B33] placeholder:text-[#B4B5C6] focus:border-[#4D4DF1] focus:outline-none'

  return (
    <div className="flex min-h-screen flex-col items-center bg-[#F7F7F9] px-4 py-16 sm:py-20">
      <Link to="/" aria-label="MateOn 홈" className="shrink-0">
        <img src="/landing_img/logo.svg" alt="" className="h-20 w-auto sm:h-24" />
      </Link>

      <div className="mt-14 w-full max-w-[428px] rounded-xl border border-[#E8E8EF] bg-white px-6 py-10 sm:px-10">
        <div className="text-center">
          <h1 className="text-[26px] font-bold text-[#1B1B33]">MateOn</h1>
          <p className="mt-2 text-sm text-[#6F7095]">함께할 최고의 팀원을 만나보세요</p>
        </div>

        <button
          type="button"
          onClick={handleKakaoLogin}
          className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#FEE500] text-sm font-semibold text-[#1B1B33] transition-opacity hover:opacity-90"
        >
          <img src="/landing_img/KakaoLogo.svg" alt="" className="h-4 w-4" />
          카카오 로그인
        </button>

        <div className="my-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-[#E8E8EF]" />
          <span className="text-xs text-[#8B8CA3]">또는 이메일로 로그인</span>
          <div className="h-px flex-1 bg-[#E8E8EF]" />
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
          <div>
            <label htmlFor="login-email" className="text-[15px] font-semibold text-[#1B1B33]">
              이메일
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className={`mt-2.5 ${inputClassName}`}
            />
          </div>

          <div>
            <label htmlFor="login-password" className="text-[15px] font-semibold text-[#1B1B33]">
              비밀번호
            </label>
            <div className="relative mt-2.5">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className={`${inputClassName} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                aria-pressed={showPassword}
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[#8B8CA3] transition-colors hover:bg-[#F5F5F9] hover:text-[#1B1B33]"
              >
                <EyeIcon off={showPassword} className="h-[18px] w-[18px]" />
              </button>
            </div>
          </div>

          <label className="-mt-2 flex w-fit cursor-pointer items-center gap-2.5 text-sm text-[#45465C]">
            <input
              type="checkbox"
              checked={keepLoggedIn}
              onChange={(e) => setKeepLoggedIn(e.target.checked)}
              className="h-[18px] w-[18px] rounded border-[#C9CAD6] accent-[#4D4DF1]"
            />
            로그인 상태 유지
          </label>

          {error && (
            <p role="alert" className="-mt-2 text-sm font-medium text-rose-500">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoggingIn}
            className="h-12 rounded-lg bg-[#4D4DF1] text-base font-semibold text-white transition-colors hover:bg-[#3D3DD9] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoggingIn ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>

      <p className="mt-10 flex items-center gap-2 text-sm text-[#45465C]">
        아직 계정이 없나요?
        <Link to="/signup" className="font-medium text-[#4D4DF1] underline underline-offset-2 hover:text-[#3D3DD9]">
          회원가입 하기
        </Link>
      </p>
    </div>
  )
}
