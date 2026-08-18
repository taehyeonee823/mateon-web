import { useState } from 'react'
import { ChevronDownIcon, HomeIcon, SearchIcon, UsersIcon } from './icons'

const ACTIVITY_TABS = [
  { label: '공모전', href: '#contest' },
  { label: '대외활동', href: '#external' },
  { label: '스터디', href: '#study' },
  { label: '동아리', href: '#club' },
]

export default function Sidebar() {
  const [activityOpen, setActivityOpen] = useState(true)

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-brand-100/60 bg-white md:flex">
      <a href="#top" className="flex items-center gap-2 px-6 py-6">
        <img src="/logo.svg" alt="" className="h-8 w-auto" />
        <span className="text-xl font-extrabold tracking-tight text-brand-700">MateOn</span>
      </a>

      <nav className="flex flex-1 flex-col gap-1 px-4">
        <a
          href="#top"
          className="flex items-center gap-3 rounded-xl bg-brand-50 px-4 py-2.5 text-base font-bold text-[#4D4DF1]"
        >
          <HomeIcon className="h-5 w-5 shrink-0 text-[#6F7095]" />
          홈
        </a>

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
            {ACTIVITY_TABS.map((tab) => (
              <a
                key={tab.href}
                href={tab.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-[#4D4DF1] transition-colors hover:bg-brand-50/60"
              >
                {tab.label}
              </a>
            ))}
          </div>
        )}

        <a
          href="#top"
          className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-base font-bold text-[#4D4DF1] transition-colors hover:bg-brand-50/60"
        >
          <UsersIcon className="h-5 w-5 shrink-0 text-[#6F7095]" />
          마이페이지
        </a>
      </nav>

      <div className="mx-4 mb-6 rounded-2xl bg-brand-50 p-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-sm shadow-brand-900/5">
          🤖
        </div>
        <p className="mt-3 text-xs font-semibold text-brand-900">AI 드림이</p>
        <p className="mt-1 text-[11px] leading-relaxed text-brand-600">
          더 정확한 추천을 받고
          <br />
          싶다면?
        </p>
        <a
          href="#top"
          className="mt-3 block rounded-full bg-white px-3 py-2 text-xs font-semibold text-brand-700 shadow-sm shadow-brand-900/5 transition-colors hover:bg-brand-100"
        >
          프로필 완성하기 →
        </a>
      </div>
    </aside>
  )
}
