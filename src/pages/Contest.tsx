import { useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { Link, useSearchParams } from 'react-router-dom'
import EventCard from '../components/EventCard'
import Pagination from '../components/Pagination'
import { ChevronDownIcon, ChevronRightIcon, SearchIcon } from '../components/icons'
import { searchAllEvents, bookmarkEvent, unbookmarkEvent, EVENT_FIELD_LABELS, type EventItem } from '../api/event'
import { dDayInfo, isWithinPeriod, type PeriodFilter, type PeriodPreset } from '../utils/dday'

/* ────────────────────────────────────────────────────────────────
 * Constants
 * ──────────────────────────────────────────────────────────────── */
const PRESET_LABEL: Record<PeriodPreset, string> = {
  today: '오늘 마감',
  week: '이번주 마감',
  month: '이번달 마감',
}

const CATEGORIES = ['전체', ...Object.values(EVENT_FIELD_LABELS)] as const

const INITIAL_VISIBLE_COUNT = 6
const PAGE_SIZE = 12

/* ────────────────────────────────────────────────────────────────
 * Motion (respects prefers-reduced-motion)
 * ──────────────────────────────────────────────────────────────── */
function EntranceStyles() {
  return (
    <style>{`
      @keyframes riseIn {
        from { opacity: 0; transform: translateY(14px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .rise-in {
        animation: riseIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
        backface-visibility: hidden;
        transform-style: preserve-3d;
      }
      @media (prefers-reduced-motion: reduce) {
        .rise-in { animation: none; }
      }
    `}</style>
  )
}

/* ────────────────────────────────────────────────────────────────
 * Page
 * ──────────────────────────────────────────────────────────────── */
export default function ContestPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const keyword = searchParams.get('keyword') ?? ''
  const [searchInput, setSearchInput] = useState(keyword)

  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [activeCategory, setActiveCategory] = useState<(typeof CATEGORIES)[number]>('전체')
  const [sortByDeadline, setSortByDeadline] = useState(true)
  const [categoriesExpanded, setCategoriesExpanded] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>(null)
  const [periodOpen, setPeriodOpen] = useState(false)
  const [periodTab, setPeriodTab] = useState<'quick' | 'custom'>('quick')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const periodButtonRef = useRef<HTMLButtonElement>(null)
  const periodPanelRef = useRef<HTMLDivElement>(null)
  const [panelCoords, setPanelCoords] = useState<{ top: number; right: number } | null>(null)

  // 공모전(CONTEST) 목록 로드 — 검색창에서 넘어온 keyword가 있으면 함께 반영
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)

    searchAllEvents({ category: 'CONTEST', keyword: keyword || undefined }, controller.signal)
      .then(setEvents)
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : '공모전 목록을 불러오지 못했어요.')
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [keyword])

  // 북마크 토글 (optimistic update, 실패 시 롤백)
  async function handleToggleBookmark(target: EventItem) {
    const nextBookmarked = !target.bookmarked
    setEvents((prev) => prev.map((e) => (e.id === target.id ? { ...e, bookmarked: nextBookmarked } : e)))

    try {
      if (nextBookmarked) {
        await bookmarkEvent(target.id)
      } else {
        await unbookmarkEvent(target.id)
      }
    } catch {
      setEvents((prev) => prev.map((e) => (e.id === target.id ? { ...e, bookmarked: target.bookmarked } : e)))
    }
  }
  useLayoutEffect(() => {
    if (!periodOpen) return
    function updateCoords() {
      const btn = periodButtonRef.current
      if (!btn) return
      const rect = btn.getBoundingClientRect()
      setPanelCoords({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
    }
    updateCoords()
    window.addEventListener('scroll', updateCoords, true)
    window.addEventListener('resize', updateCoords)
    return () => {
      window.removeEventListener('scroll', updateCoords, true)
      window.removeEventListener('resize', updateCoords)
    }
  }, [periodOpen])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      const clickedButton = periodButtonRef.current?.contains(target)
      const clickedPanel = periodPanelRef.current?.contains(target)
      if (!clickedButton && !clickedPanel) {
        setPeriodOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const visibleCategories = categoriesExpanded ? CATEGORIES : CATEGORIES.slice(0, INITIAL_VISIBLE_COUNT)

  const periodLabel =
    periodFilter === null
      ? '기간'
      : periodFilter.type === 'preset'
        ? PRESET_LABEL[periodFilter.preset]
        : `${periodFilter.start.slice(5).replace('-', '.')}~${periodFilter.end.slice(5).replace('-', '.')}`

  const filtered = useMemo(() => {
    let list = activeCategory === '전체' ? events : events.filter((e) => e.fieldLabel === activeCategory)
    list = list.filter((e) => !dDayInfo(e.endDate).closed) // 마감된 공모전 제외
    list = list.filter((e) => isWithinPeriod(e.endDate, periodFilter))
    return sortByDeadline ? [...list].sort((a, b) => a.endDate.localeCompare(b.endDate)) : list
  }, [events, activeCategory, sortByDeadline, periodFilter])

  // 필터/정렬이 바뀌면 결과 페이지 수도 바뀌니 1페이지로 리셋
  useEffect(() => {
    setCurrentPage(1)
  }, [activeCategory, sortByDeadline, periodFilter, keyword])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  useEffect(() => {
    setSearchInput(keyword)
  }, [keyword])

  function handleSearch(e: FormEvent) {
    e.preventDefault()
    const trimmed = searchInput.trim()
    setSearchParams(trimmed ? { keyword: trimmed } : {})
  }

  function handlePageChange(page: number) {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="mx-auto max-w-[1160px] px-6 pb-16 pt-10">
      <EntranceStyles />

      <header className="rise-in mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">공모전</h1>
          <p className="mt-2 text-sm text-black">전국 학생을 위한 공모전을 한눈에 보고, 함께할 팀원도 찾아보세요.</p>
        </div>
        <p className="flex shrink-0 items-center gap-1.5 text-xs text-[#6F7095]">
          찾으시는 공모전이 없나요?
          <Link to="/contest/new" className="flex items-center font-medium text-[#3F4FDB]">
            등록하기
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </Link>
        </p>
      </header>

      {/* Filter bar */}
      <div className="rise-in mb-5 rounded-xl border border-[#ECECF5] p-4" style={{ animationDelay: '90ms' }}>
        <div className="flex flex-1 flex-wrap gap-2">
          {visibleCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                activeCategory === cat ? 'bg-[#4D4DF1] text-white' : 'bg-[#F3F3FA] text-[#6F7095] hover:bg-[#E9E9FB]'
              }`}
            >
              {cat}
            </button>
          ))}

          {CATEGORIES.length > INITIAL_VISIBLE_COUNT && (
            <button
              type="button"
              onClick={() => setCategoriesExpanded((v) => !v)}
              aria-expanded={categoriesExpanded}
              className="flex items-center gap-1 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-[#6F7095] ring-1 ring-inset ring-[#ECECF5] transition-colors hover:bg-[#F8F8FD]"
            >
              {categoriesExpanded ? '접기' : '더보기'}
              <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform ${categoriesExpanded ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>

        <form onSubmit={handleSearch} className="relative mt-4">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="공모전 이름, 주최 기관으로 검색"
            aria-label="공모전 검색"
            className="h-11 w-full rounded-lg border border-[#ECECF5] pl-10 pr-4 text-sm text-black placeholder:text-[#A8A9BD] focus:border-[#3F4FDB] focus:outline-none"
          />
        </form>
      </div>

      <div className="rise-in mb-6 flex items-center justify-between gap-3" style={{ animationDelay: '120ms' }}>
        <p className="min-w-0 truncate text-xs text-black">
          {keyword && <span className="font-bold">"{keyword}"</span>}
          {keyword && ' 검색 결과 · '}총 <span className="font-bold">{loading ? '-' : filtered.length}개</span> 공모전
        </p>

        <div className="flex shrink-0 items-center gap-3">
          <div className="relative">
            <button
              ref={periodButtonRef}
              type="button"
              onClick={() => setPeriodOpen((v) => !v)}
              aria-expanded={periodOpen}
              className={`flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                periodFilter ? 'bg-[#4D4DF1] text-white' : 'bg-[#F3F3FA] text-[#6F7095] hover:bg-[#E9E9FB]'
              }`}
            >
              {periodLabel}
              <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform ${periodOpen ? 'rotate-180' : ''}`} />
            </button>

            {periodOpen &&
              panelCoords &&
              createPortal(
                <div
                  ref={periodPanelRef}
                  style={{ position: 'fixed', top: panelCoords.top, right: panelCoords.right, zIndex: 9999 }}
                  className="w-72 rounded-2xl border border-[#ECECF5] bg-white p-4 shadow-lg shadow-black/10"
                >
                  <div className="mb-3 flex gap-1 rounded-full bg-[#F3F3FA] p-1">
                    <button
                      type="button"
                      onClick={() => setPeriodTab('quick')}
                      className={`flex-1 rounded-full py-1.5 text-xs font-semibold transition-colors ${
                        periodTab === 'quick' ? 'bg-white text-[#1B1B33] shadow-sm' : 'text-[#8C8DAE]'
                      }`}
                    >
                      빠른 선택
                    </button>
                    <button
                      type="button"
                      onClick={() => setPeriodTab('custom')}
                      className={`flex-1 rounded-full py-1.5 text-xs font-semibold transition-colors ${
                        periodTab === 'custom' ? 'bg-white text-[#1B1B33] shadow-sm' : 'text-[#8C8DAE]'
                      }`}
                    >
                      직접 설정
                    </button>
                  </div>

                  {periodTab === 'quick' ? (
                    <div className="flex flex-col gap-1.5">
                      {(['today', 'week', 'month'] as PeriodPreset[]).map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setPeriodFilter({ type: 'preset', preset })
                            setPeriodOpen(false)
                          }}
                          className="rounded-lg px-3 py-2 text-left text-sm font-medium text-[#1B1B33] transition-colors hover:bg-[#F3F3FA]"
                        >
                          {PRESET_LABEL[preset]}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setPeriodFilter(null)
                          setPeriodOpen(false)
                        }}
                        className="rounded-lg px-3 py-2 text-left text-sm font-medium text-[#8C8DAE] transition-colors hover:bg-[#F3F3FA]"
                      >
                        전체 기간
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      <label className="flex flex-col gap-1">
                        <span className="text-[11px] font-medium text-[#8C8DAE]">시작일</span>
                        <input
                          type="date"
                          value={customStart}
                          onChange={(e) => setCustomStart(e.target.value)}
                          className="w-full min-w-0 rounded-lg border border-[#ECECF5] px-2.5 py-1.5 text-sm text-[#1B1B33] focus:border-[#4D4DF1] focus:outline-none"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-[11px] font-medium text-[#8C8DAE]">종료일</span>
                        <input
                          type="date"
                          value={customEnd}
                          min={customStart || undefined}
                          onChange={(e) => setCustomEnd(e.target.value)}
                          className="w-full min-w-0 rounded-lg border border-[#ECECF5] px-2.5 py-1.5 text-sm text-[#1B1B33] focus:border-[#4D4DF1] focus:outline-none"
                        />
                      </label>
                      <button
                        type="button"
                        disabled={!customStart || !customEnd}
                        onClick={() => {
                          setPeriodFilter({ type: 'custom', start: customStart, end: customEnd })
                          setPeriodOpen(false)
                        }}
                        className="rounded-lg bg-[#4D4DF1] py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
                      >
                        적용
                      </button>
                    </div>
                  )}
                </div>,
                document.body,
              )}
          </div>

          <label className="flex items-center gap-1.5 text-xs font-medium text-[#6F7095]">
            <input
              type="checkbox"
              checked={sortByDeadline}
              onChange={(e) => setSortByDeadline(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-[#ECECF5] text-[#4D4DF1] focus:ring-[#4D4DF1]"
            />
            마감임박순
          </label>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[16/10] animate-pulse rounded-2xl bg-[#F3F3FA]" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-dashed border-[#ECECF5] py-16 text-center text-sm text-[#8C8DAE]">
          {error}
        </div>
      ) : filtered.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {paged.map((event, idx) => (
              <EventCard
                key={event.id}
                event={event}
                onToggleBookmark={handleToggleBookmark}
                className="rise-in"
                style={{ animationDelay: `${160 + Math.min(idx, 6) * 60}ms` }}
              />
            ))}
          </div>
          <div className="relative">
            <Pagination currentPage={currentPage} totalPages={totalPages} onChange={handlePageChange} />
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              aria-label="맨 위로"
              className="absolute right-0 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-[#F3F3FA] text-[#3F4FDB] transition-colors hover:bg-[#E9E9FB]"
            >
              ↑
            </button>
          </div>
        </>
      ) : (
        <div className="flex min-h-[560px] flex-col items-center justify-center rounded-xl border border-dashed border-[#ECECF5] text-center">
          <p className="text-base font-bold text-black">
            {keyword ? `"${keyword}"에 맞는 공모전이 없어요` : '이 분야에 등록된 공모전이 아직 없어요'}
          </p>
          <p className="mt-2 text-sm text-[#6F7095]">알고 있는 활동이라면 직접 등록하고 팀원을 모아보세요.</p>
          <Link
            to="/contest/new"
            className="mt-4 rounded-lg bg-[#3F4FDB] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            공모전 등록하기
          </Link>
        </div>
      )}
    </div>
  )
}