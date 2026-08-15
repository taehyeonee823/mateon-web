import { useState } from 'react'

const CATEGORIES = [
  { label: '공모전', href: '#contest' },
  { label: '대외활동', href: '#external' },
  { label: '스터디', href: '#study' },
  { label: '동아리', href: '#club' },
]

export default function Sidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-brand-100/60 bg-white/80 px-6 backdrop-blur-md md:hidden">
        <a href="#top" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-400 text-sm font-bold text-white">
            M
          </span>
          <span className="text-lg font-bold text-brand-900">MateOn</span>
        </a>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-brand-900"
          aria-label="메뉴 열기"
          aria-expanded={open}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="fixed inset-x-0 top-16 z-40 border-b border-brand-100 bg-white px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-4">
            {CATEGORIES.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-brand-700"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#cta"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full bg-brand-400 px-5 py-2.5 text-center text-sm font-semibold text-white"
            >
              지금 시작하기
            </a>
          </nav>
        </div>
      )}

      <aside className="fixed inset-y-0 left-0 z-50 hidden w-60 flex-col border-r border-brand-100/60 bg-white/80 backdrop-blur-md md:flex">
        <a href="#top" className="flex items-center gap-2 px-6 py-6">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-400 text-sm font-bold text-white">
            M
          </span>
          <span className="text-lg font-bold text-brand-900">MateOn</span>
        </a>

        <nav className="flex flex-1 flex-col gap-1 px-4">
          {CATEGORIES.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-xl px-4 py-3 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50 hover:text-brand-900"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="px-4 pb-6">
          <a
            href="#cta"
            className="block rounded-full bg-brand-400 px-5 py-3 text-center text-sm font-semibold text-white shadow-sm shadow-brand-400/30 transition-transform hover:-translate-y-0.5 hover:bg-brand-500"
          >
            지금 시작하기
          </a>
        </div>
      </aside>
    </>
  )
}
