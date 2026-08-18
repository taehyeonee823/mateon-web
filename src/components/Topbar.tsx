import { BellIcon, ChevronDownIcon, SearchIcon } from './icons'

export default function Topbar() {
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

      <button type="button" className="flex shrink-0 items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm">
          🙂
        </span>
        <span className="text-sm font-semibold text-brand-900">로그인</span>
        <ChevronDownIcon className="h-4 w-4 text-brand-500" />
      </button>

      <button
        type="button"
        className="flex shrink-0 items-center gap-2 rounded-full bg-gray-200 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-500"
      >
        <span className="text-sm font-semibold text-brand-900">무료로 회원가입하기</span>
      </button>
    </div>
  )
}
