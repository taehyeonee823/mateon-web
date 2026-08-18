import { UsersIcon } from './icons'

export default function MyTeams() {
  return (
    <section className="px-8 pb-16">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-brand-900">내 팀 현황</h2>
        <a href="#top" className="text-xs font-medium text-brand-500 hover:text-brand-700">
          전체 팀 보기 &gt;
        </a>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-6 rounded-2xl border border-brand-100 bg-white p-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <UsersIcon className="h-5 w-5" />
        </span>

        <div className="min-w-[180px]">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-brand-900">JunctionX Korea 2026</h3>
            <span className="rounded-full bg-brand-100 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
              모집 중
            </span>
          </div>
          <p className="mt-1 text-xs text-brand-500">1 / 3명 · FE 개발자 모집 중 · 마감 D-12</p>
        </div>

        <div className="flex flex-1 items-center gap-3">
          <span className="shrink-0 text-xs font-medium text-brand-500">팀 충원율</span>
          <div className="h-2 w-full max-w-[220px] overflow-hidden rounded-full bg-brand-100">
            <div className="h-full w-1/3 rounded-full bg-brand-600" />
          </div>
          <span className="shrink-0 text-xs font-semibold text-brand-700">33%</span>
        </div>

        <div className="flex -space-x-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-brand-100 text-xs"
            >
              🙂
            </span>
          ))}
        </div>

        <button
          type="button"
          className="ml-auto shrink-0 rounded-full border border-brand-200 bg-white px-5 py-2.5 text-sm font-semibold text-brand-800 transition-colors hover:bg-brand-50"
        >
          팀 관리하기 &gt;
        </button>
      </div>
    </section>
  )
}
