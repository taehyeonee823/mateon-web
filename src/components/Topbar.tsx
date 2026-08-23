import { Link, useNavigate } from 'react-router-dom'
import { BellIcon, SearchIcon } from './icons'
import { useAuth } from '../context/AuthContext'

export default function Topbar() {
  const { isLoggedIn, profile, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    const message = profile ? `${profile.name}님 로그아웃 하시겠어요?` : '로그아웃 하시겠어요?'
    if (!window.confirm(message)) return
    logout()
    navigate('/')
  }

  return (
    <div className="flex items-center gap-6 px-24 py-6">
      <div className="relative flex-1 max-w-2xl">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400" />
        <input
          type="text"
          placeholder="공모전, 분야, 기술, 키워드를 검색해보세요"
          className="w-full rounded-full border border-brand-100 bg-brand-50/40 py-3 pl-11 pr-4 text-sm text-brand-900 placeholder:text-brand-400 focus:border-brand-300 focus:outline-none"
        />
      </div>

      <button
        type="button"
        aria-label="알림"
        className="relative ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-brand-500 transition-colors hover:bg-brand-50 hover:text-brand-700"
      >
        <BellIcon className="h-5 w-5" />
        <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-500" />
      </button>

      {isLoggedIn && profile ? (
        <>
          <div className="flex shrink-0 items-center gap-2">
            {profile.profileImageUrl ? (
              <img
                src={profile.profileImageUrl}
                alt=""
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm">
                🙂
              </span>
            )}
            <span className="text-sm font-semibold text-brand-900">{profile.name}</span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex shrink-0 items-center gap-2 rounded-full bg-gray-200 px-4 py-2 text-sm font-semibold text-brand-900 transition-colors hover:bg-brand-500 hover:text-white"
          >
            로그아웃
          </button>
        </>
      ) : (
        <>
          <Link
            to="/login"
            className="flex shrink-0 items-center gap-2 rounded-full bg-gray-200 px-4 py-2 text-sm font-semibold text-brand-900 transition-colors hover:bg-brand-500 hover:text-white"
          >
            로그인
          </Link>

          <button
            type="button"
            className="flex shrink-0 items-center gap-2 rounded-full bg-gray-200 px-4 py-2 text-sm font-semibold text-brand-900 transition-colors hover:bg-brand-500 hover:text-white"
          >
            무료로 회원가입하기
          </button>
        </>
      )}
    </div>
  )
}
