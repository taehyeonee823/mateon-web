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
    </aside>
  )
}
