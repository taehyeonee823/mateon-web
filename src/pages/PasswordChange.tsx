import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import Footer from '../components/Footer'
import { changePassword } from '../api/user'
import { useAuth } from '../context/AuthContext'

export default function PasswordChange() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isSubmitEnabled =
    !!currentPassword &&
    newPassword.length >= 10 &&
    newPassword.length <= 20 &&
    newPassword === newPasswordConfirm

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!isSubmitEnabled || isSubmitting) return

    setError(null)
    setIsSubmitting(true)
    try {
      await changePassword(currentPassword, newPassword, newPasswordConfirm)
      window.alert('비밀번호가 변경되었습니다.\n재로그인 해주세요.')
      logout()
      navigate('/login')
    } catch (err) {
      setError(err instanceof Error ? err.message : '잠시 후 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Sidebar />
      <div className="md:pl-60">
        <Topbar />

        <main className="flex min-h-[70vh] items-center justify-center px-6 py-16">
          <div className="w-full max-w-sm">
            <div className="mb-8 flex flex-col items-center text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border border-[#DCE4FE]">
                <img src="/landing_img/myPage/lock.svg" alt="" className="h-10 w-10" />
              </div>
              <h1 className="mt-4 text-2xl font-bold text-brand-900">비밀번호 변경</h1>
              <p className="mt-3 text-sm leading-relaxed text-brand-500">
                새 비밀번호는 10~20자 사이로
                <br />
                영문, 숫자, 특수문자를 모두 포함해주세요.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="현재 비밀번호"
                autoComplete="current-password"
                className="h-12 border-b border-brand-100 text-sm text-brand-900 placeholder:text-brand-400 focus:border-brand-300 focus:outline-none"
              />

              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="변경할 비밀번호"
                autoComplete="new-password"
                className="h-12 border-b border-brand-100 text-sm text-brand-900 placeholder:text-brand-400 focus:border-brand-300 focus:outline-none"
              />

              <input
                type="password"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                placeholder="변경할 비밀번호 재입력"
                autoComplete="new-password"
                className="h-12 border-b border-brand-100 text-sm text-brand-900 placeholder:text-brand-400 focus:border-brand-300 focus:outline-none"
              />

              {error && <p className="text-sm font-medium text-rose-500">{error}</p>}

              <button
                type="submit"
                disabled={!isSubmitEnabled || isSubmitting}
                className="mt-4 h-14 rounded-xl bg-[#2554F0] text-lg font-semibold text-white transition-opacity disabled:opacity-40"
              >
                {isSubmitting ? '변경 중...' : '변경하기'}
              </button>
            </form>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  )
}
