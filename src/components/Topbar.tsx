import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDownIcon, SearchIcon } from './icons'
import { useAuth } from '../context/AuthContext'
import {
  getMyNotifications,
  type NotificationResponseDTO,
  type NotificationType,
} from '../api/notification'

const CATEGORY_TABS = [
  { label: '공모전', path: '/contest', comingSoon: false },
  { label: '대외활동', path: '/external', comingSoon: false },
  { label: '스터디', path: null, comingSoon: true },
  { label: '동아리', path: null, comingSoon: true },
]

const NOTIFICATION_ICON: Record<NotificationType, { icon: string; bg: string }> = {
  APPROVE: { icon: '/noti/rocket_fill.svg', bg: 'bg-emerald-50' },
  REJECT: { icon: '/noti/rocket_fill.svg', bg: 'bg-rose-50' },
  INFO: { icon: '/noti/message_fill.svg', bg: 'bg-[#2554F0]/10' },
}

function getNotificationIcon(n: NotificationResponseDTO) {
  const isTeamRelated = n.title.includes('팀') || n.content.includes('팀')

  if (isTeamRelated) {
    return { icon: '/noti/rocket_fill.svg', bg: n.type === 'REJECT' ? 'bg-rose-50' : 'bg-emerald-50' }
  }

  return NOTIFICATION_ICON[n.type]
}

function formatRelativeTime(dateString: string) {
  const diffMs = Date.now() - new Date(dateString).getTime()
  const minutes = Math.floor(diffMs / (1000 * 60))

  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}일 전`

  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}주 전`

  const months = Math.floor(days / 30)
  if (months < 12) return `${months}개월 전`

  return `${Math.floor(days / 365)}년 전`
}

export default function Topbar() {
  const { isLoggedIn, profile, logout } = useAuth()
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState<NotificationResponseDTO[]>([])
  const [isBellHovered, setIsBellHovered] = useState(false)
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('전체')
  const [keyword, setKeyword] = useState('')
  const categoryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isCategoryOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setIsCategoryOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isCategoryOpen])

  useEffect(() => {
    if (!isLoggedIn) {
      setNotifications([])
      return
    }

    getMyNotifications()
      .then((list) => {
        const sorted = [...list].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        setNotifications(sorted.slice(0, 3))
      })
      .catch(() => setNotifications([]))
  }, [isLoggedIn])

  const hasUnread = notifications.some((n) => !n.isRead)

  const handleSelectCategory = (tab: (typeof CATEGORY_TABS)[number]) => {
    if (tab.comingSoon) return
    setSelectedCategory(tab.label)
    setIsCategoryOpen(false)
    if (tab.path) navigate(tab.path)
  }

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = keyword.trim()
    const query = trimmed ? `?keyword=${encodeURIComponent(trimmed)}` : ''
    navigate(`${selectedCategory === '대외활동' ? '/external' : '/contest'}${query}`)
  }

  const handleLogout = () => {
    const message = profile ? `${profile.name}님 로그아웃 하시겠어요?` : '로그아웃 하시겠어요?'
    if (!window.confirm(message)) return
    logout()
    navigate('/')
  }

  return (
    <div className="flex items-center gap-6 px-20 py-6">
      <div className="flex flex-1 justify-center">
        <form onSubmit={handleSearch} className="flex w-full max-w-2xl gap-2">
          <div className="relative shrink-0" ref={categoryRef}>
            <button
              type="button"
              onClick={() => setIsCategoryOpen((v) => !v)}
              aria-expanded={isCategoryOpen}
              className="flex h-full w-36 items-center justify-between rounded-xl border border-brand-100 bg-white px-4 py-3 text-sm font-semibold text-black transition-colors hover:border-brand-300"
            >
              {selectedCategory}
              <ChevronDownIcon
                className={`h-3.5 w-3.5 text-brand-400 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isCategoryOpen && (
              <div className="absolute left-0 top-full z-50 mt-2 w-36 rounded-2xl border border-brand-100 bg-white p-2 shadow-lg shadow-black/10">
                {CATEGORY_TABS.map((tab) => (
                  <button
                    key={tab.label}
                    type="button"
                    disabled={tab.comingSoon}
                    onClick={() => handleSelectCategory(tab)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors ${
                      tab.comingSoon
                        ? 'text-brand-300'
                        : 'text-brand-900 hover:bg-brand-50/60'
                    } ${selectedCategory === tab.label ? 'bg-brand-50/60' : ''}`}
                  >
                    {tab.label}
                    {tab.comingSoon && (
                      <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-400">
                        준비중
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative flex-1">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="공모전, 분야, 기술, 키워드를 검색해보세요"
              className="w-full rounded-full border border-brand-100 bg-brand-50/40 py-3 pl-4 pr-20 text-sm text-brand-900 placeholder:text-brand-400 focus:border-brand-300 focus:outline-none"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-full bg-[#2554F0] px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            >
              <SearchIcon className="h-3.5 w-3" />
            </button>
          </div>
        </form>
      </div>

      <div
        className="relative ml-auto shrink-0"
        onMouseEnter={() => setIsBellHovered(true)}
        onMouseLeave={() => setIsBellHovered(false)}
      >
        <button
          type="button"
          aria-label="알림"
          className="relative flex h-10 w-10 items-center justify-center rounded-full text-brand-500 transition-colors hover:bg-brand-50 hover:text-brand-700"
        >
          <img src="/noti/notification_line.svg" alt="" className="h-6 w-6" />
          {hasUnread && (
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-500" />
          )}
        </button>

        {isBellHovered && isLoggedIn && (
          <div className="absolute right-0 top-full z-50 w-80 rounded-2xl border border-brand-100 bg-white p-2 shadow-lg shadow-black/10">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-left hover:bg-brand-50/60"
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full p-1.5 ${getNotificationIcon(n).bg}`}
                  >
                    <img
                      src={getNotificationIcon(n).icon}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-brand-900">{n.title}</p>
                      <span className="flex shrink-0 items-center gap-1.5">
                        <span className="text-[10px] text-brand-400">
                          {formatRelativeTime(n.createdAt)}
                        </span>
                        {!n.isRead && <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-brand-500">{n.content}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="px-3 py-4 text-center text-sm text-brand-400">알림이 없어요.</p>
            )}

            <button
              type="button"
              className="mt-1 w-full rounded-xl py-2.5 text-center text-sm font-semibold text-brand-500 transition-colors hover:bg-brand-50/60"
            >
              전체 보기
            </button>
          </div>
        )}
      </div>

      {isLoggedIn && profile ? (
        <>
          <Link to="/my" className="flex shrink-0 items-center gap-2">
            {profile.profileImageUrl ? (
              <img
                src={profile.profileImageUrl}
                alt=""
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100">
                <img src="/landing_img/myPage/user.svg" alt="" className="h-5 w-5" />
              </span>
            )}
            <span className="text-sm font-semibold text-brand-900">{profile.name}</span>
          </Link>

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

          <Link
            to="/signup"
            className="flex shrink-0 items-center gap-2 rounded-full bg-gray-200 px-4 py-2 text-sm font-semibold text-brand-900 transition-colors hover:bg-brand-500 hover:text-white"
          >
            무료로 회원가입하기
          </Link>
        </>
      )}
    </div>
  )
}
