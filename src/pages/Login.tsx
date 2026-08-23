import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import Footer from '../components/Footer'
import { loginWithEmail } from '../api/auth'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { refresh } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
      await loginWithEmail(email, password)
      await refresh()
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : '잠시 후 다시 시도해주세요.')
    } finally {
      setIsLoggingIn(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Sidebar />
      <div className="md:pl-60">
        <Topbar />

        <main className="flex min-h-[70vh] items-center justify-center px-6 py-16">
          <div className="w-full max-w-sm">
            <div className="mb-8 flex flex-col items-center">
              <img src="/logo.svg" alt="" className="h-12 w-auto" />
              <h1 className="mt-3 text-3xl font-bold text-brand-900">MateOn 로그인</h1>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일을 입력해주세요"
                autoComplete="email"
                className="h-14 rounded-xl border border-brand-100 bg-brand-50/40 px-4 text-sm text-brand-900 placeholder:text-brand-400 focus:border-brand-300 focus:outline-none"
              />

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력해주세요"
                autoComplete="current-password"
                className="h-14 rounded-xl border border-brand-100 bg-brand-50/40 px-4 text-sm text-brand-900 placeholder:text-brand-400 focus:border-brand-300 focus:outline-none"
              />

              {error && <p className="text-sm font-medium text-rose-500">{error}</p>}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="mt-2 h-14 rounded-xl bg-[#2554F0] text-lg font-semibold text-white transition-opacity disabled:opacity-60"
              >
                {isLoggingIn ? '로그인 중...' : '로그인'}
              </button>
            </form>

            <div className="mt-8 flex justify-center gap-2 text-sm text-brand-500">
              <span>아직 계정이 없으신가요?</span>
              <Link to="/" className="font-semibold text-brand-700 underline">
                홈으로 돌아가기
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  )
}
