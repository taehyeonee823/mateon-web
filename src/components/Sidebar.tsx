import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronDownIcon, HomeIcon, SearchIcon, UsersIcon, ChatIcon, PencilIcon } from './icons'

const ACTIVITY_TABS = [
  { label: '공모전', href: '/contest', comingSoon: false },
  { label: '대외활동', href: '/external', comingSoon: false },
  { label: '스터디', href: '#study', comingSoon: true },
  { label: '동아리', href: '#club', comingSoon: true },
]

export default function Sidebar() {
  const [activityOpen, setActivityOpen] = useState(true)
  const location = useLocation()

  const activeClass =
    'flex items-center gap-3 rounded-xl bg-brand-50 px-4 py-2.5 text-base font-bold text-[#4D4DF1]'
  const inactiveClass =
    'flex items-center gap-3 rounded-xl px-4 py-2.5 text-base font-bold text-[#4D4DF1] transition-colors hover:bg-brand-50/60'

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-brand-100/60 bg-white md:flex">
      <Link to="/" className="flex items-center gap-2 px-6 py-8">
        <img src="/landing_img/logo.svg" alt="" className="h-10 w-auto" />
        <span className="text-2xl font-extrabold font-pretendard tracking-tight text-black ml-2">MateOn</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 px-4">
        <Link to="/" className={location.pathname === '/' ? activeClass : inactiveClass}>
          <HomeIcon className="h-5 w-5 shrink-0 text-[#6F7095]" />
          홈
        </Link>

        <button
          type="button"
          onClick={() => setActivityOpen((v) => !v)}
          aria-expanded={activityOpen}
          className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-base font-bold text-[#4D4DF1] transition-colors hover:bg-brand-50/60"
        >
          <SearchIcon className="h-5 w-5 shrink-0 text-[#6F7095]" />
          활동
          <ChevronDownIcon
            className={`ml-auto h-4 w-4 text-[#6F7095] transition-transform ${activityOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {activityOpen && (
          <div className="ml-[22px] flex flex-col gap-1 border-l border-brand-100 pl-4">
            {ACTIVITY_TABS.map((tab) =>
              tab.comingSoon ? (
                <span
                  key={tab.href}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-[#4D4DF1]"
                >
                  {tab.label}
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-400">
                    준비중
                  </span>
                </span>
              ) : (
                <a
                  key={tab.href}
                  href={tab.href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-[#4D4DF1] transition-colors hover:bg-brand-50/60"
                >
                  {tab.label}
                </a>
              ),
            )}
          </div>
        )}

        <Link to="/teams/new" className={location.pathname === '/teams/new' ? activeClass : inactiveClass}>
          <PencilIcon className="h-5 w-5 shrink-0 text-[#6F7095]" />
          팀 만들기
        </Link>

        <Link to="/chat" className={location.pathname === '/chat' ? activeClass : inactiveClass}>
          <ChatIcon className="h-5 w-5 shrink-0 text-[#6F7095]" />
          채팅
        </Link>

        <Link to="/my" className={location.pathname === '/my' ? activeClass : inactiveClass}>
          <UsersIcon className="h-5 w-5 shrink-0 text-[#6F7095]" />
          마이페이지
        </Link>
      </nav>
    </aside>
  )
}