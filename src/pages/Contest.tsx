import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useSearchParams } from 'react-router-dom'
import { ClockIcon, BookmarkIcon, ChevronDownIcon } from '../components/icons'
import {
  searchAllEvents,
  bookmarkEvent,
  unbookmarkEvent,
  computeDDay,
  EVENT_FIELD_LABELS,
  type EventItem,
} from '../api/event'

/* ────────────────────────────────────────────────────────────────
 * Types & constants
 * ──────────────────────────────────────────────────────────────── */
type PeriodPreset = 'today' | 'week' | 'month'
type PeriodFilter =
  | { type: 'preset'; preset: PeriodPreset }
  | { type: 'custom'; start: string; end: string }
  | null

const PRESET_LABEL: Record<PeriodPreset, string> = {
  today: '오늘 마감',
  week: '이번주 마감',
  month: '이번달 마감',
}

const CATEGORIES = ['전체', ...Object.values(EVENT_FIELD_LABELS)] as const

const INITIAL_VISIBLE_COUNT = 6
const PAGE_SIZE = 24

/* ────────────────────────────────────────────────────────────────
 * Helpers
 * ──────────────────────────────────────────────────────────────── */
function presetRange(preset: PeriodPreset): { start: Date; end: Date } {
  const start = new Date()
  const end = new Date()
  if (preset === 'week') {
    end.setDate(end.getDate() + (7 - end.getDay()))
  } else if (preset === 'month') {
    end.setMonth(end.getMonth() + 1, 0)
  }
  return { start, end }
}

function isWithinPeriod(endDate: string, filter: PeriodFilter) {
  if (!filter) return true
  const target = new Date(endDate)
  const range =
    filter.type === 'preset' ? presetRange(filter.preset) : { start: new Date(filter.start), end: new Date(filter.end) }
  return target >= range.start && target <= range.end
}

// 백엔드 computeDDay('마감' | 'D-DAY' | 'D-n')를 카드 스타일 결정에 필요한 형태로 감싼 헬퍼
function dDayInfo(endDate: string) {
  const label = computeDDay(endDate)
  if (label === '마감') return { label, urgent: false, closed: true }
  if (label === 'D-DAY') return { label, urgent: true, closed: false }
  const diff = Number(label.slice(2))
  return { label, urgent: diff <= 7, closed: false }
}

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
      .rise-in { animation: riseIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
      @media (prefers-reduced-motion: reduce) {
        .rise-in { animation: none; }
      }
    `}</style>
  )
}

/* ────────────────────────────────────────────────────────────────
 * Contest card
 * ──────────────────────────────────────────────────────────────── */
function ContestCard({
  event,
  onToggleBookmark,
  className = '',
  style,
}: {
  event: EventItem
  onToggleBookmark: (event: EventItem) => void
  className?: string
  style?: React.CSSProperties
}) {
  const d = dDayInfo(event.endDate)

  function handleBookmarkClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    onToggleBookmark(event)
  }

  return (
    <Link
      to={`/contest/${event.id}`}
      className={`group flex flex-col overflow-hidden rounded-2xl border border-[#ECECF5] bg-white shadow-sm shadow-black/[0.03] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/[0.08] ${className}`}
      style={style}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#F3F3FA]">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#F3F3FA] to-[#E9E9FB]" />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-black/0" />

        {/* Field chip, top-left */}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-[#4D4DF1] backdrop-blur-sm">
          {event.fieldLabel ?? '기타'}
        </span>

        {/* D-day badge + bookmark, top-right */}
        <div className="absolute right-3 top-3 flex items-center gap-1.5">
          <span
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm ${
              d.closed ? 'bg-black/40' : d.urgent ? 'bg-[#FF6B57]' : 'bg-black/55'
            }`}
          >
            <ClockIcon className="h-3 w-3" />
            {d.label}
          </span>
          <button
            type="button"
            onClick={handleBookmarkClick}
            aria-pressed={event.bookmarked}
            aria-label={event.bookmarked ? '북마크 해제' : '북마크 등록'}
            className={`flex h-6 w-6 items-center justify-center rounded-full backdrop-blur-sm transition-colors ${
              event.bookmarked ? 'bg-[#4D4DF1] text-white' : 'bg-black/40 text-white hover:bg-black/55'
            }`}
          >
            <BookmarkIcon className="h-3.5 w-3.5" filled={event.bookmarked} />
          </button>
        </div>

        {/* Organizer, bottom-left over gradient */}
        <span className="absolute bottom-2.5 left-3 text-[12px] font-medium text-white/90 drop-shadow">
          {event.organizer}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 px-4 py-4">
        <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-[#1B1B33] group-hover:text-[#4D4DF1]">
          {event.title}
        </h3>

        {event.summarizedDescription && (
          <p className="line-clamp-2 text-[12px] leading-relaxed text-[#6F7095]">{event.summarizedDescription}</p>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-[#F0F0F7] pt-2.5 text-[11px] text-[#8C8DAE]">
          <span>{event.endDate.replaceAll('-', '.')} 마감</span>
          <span className="font-semibold text-[#4D4DF1] opacity-0 transition-opacity group-hover:opacity-100">
            자세히 보기 →
          </span>
        </div>
      </div>
    </Link>
  )
}

/* ────────────────────────────────────────────────────────────────
 * Pagination
 * ──────────────────────────────────────────────────────────────── */
function Pagination({
  currentPage,
  totalPages,
  onChange,
}: {
  currentPage: number
  totalPages: number
  onChange: (page: number) => void
}) {
  if (totalPages <= 1) return null

  // 페이지가 많아질 때를 대비해 현재 페이지 주변만 보여주고 나머지는 '...' 처리
  const pages: (number | 'ellipsis')[] = []
  const windowStart = Math.max(2, currentPage - 1)
  const windowEnd = Math.min(totalPages - 1, currentPage + 1)

  pages.push(1)
  if (windowStart > 2) pages.push('ellipsis')
  for (let p = windowStart; p <= windowEnd; p++) pages.push(p)
  if (windowEnd < totalPages - 1) pages.push('ellipsis')
  if (totalPages > 1) pages.push(totalPages)

  return (
    <nav className="mt-8 flex items-center justify-center gap-1" aria-label="페이지네이션">
      <button
        type="button"
        onClick={() => onChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-[#6F7095] transition-colors hover:bg-[#F3F3FA] disabled:opacity-30"
        aria-label="이전 페이지"
      >
        ‹
      </button>

      {pages.map((p, idx) =>
        p === 'ellipsis' ? (
          <span key={`e-${idx}`} className="flex h-8 w-8 items-center justify-center text-sm text-[#8C8DAE]">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === currentPage ? 'page' : undefined}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
              p === currentPage ? 'bg-[#4D4DF1] text-white' : 'text-[#6F7095] hover:bg-[#F3F3FA]'
            }`}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-[#6F7095] transition-colors hover:bg-[#F3F3FA] disabled:opacity-30"
        aria-label="다음 페이지"
      >
        ›
      </button>
    </nav>
  )
}

/* ────────────────────────────────────────────────────────────────
 * Page
 * ──────────────────────────────────────────────────────────────── */
export default function ContestPage() {
  const [searchParams] = useSearchParams()
  const keyword = searchParams.get('keyword') ?? ''

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

  // Recompute the panel's screen position whenever it opens, and keep it
  // pinned while the page scrolls/resizes. Rendering via a portal + fixed
  // position means no ancestor's overflow/z-index/transform can clip or
  // bury this dropdown behind the card grid.
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
    list = list.filter((e) => isWithinPeriod(e.endDate, periodFilter))
    return sortByDeadline ? [...list].sort((a, b) => a.endDate.localeCompare(b.endDate)) : list
  }, [events, activeCategory, sortByDeadline, periodFilter])

  // 필터/정렬이 바뀌면 결과 페이지 수도 바뀌니 1페이지로 리셋
  useEffect(() => {
    setCurrentPage(1)
  }, [activeCategory, sortByDeadline, periodFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function handlePageChange(page: number) {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="mx-auto max-w-5xl px-6 pb-10 pt-4">
      <EntranceStyles />

      <header className="rise-in mb-8">
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#1B1B33]">공모전</h1>
        <p className="mt-1.5 text-sm text-[#6F7095]">전국의 다양한 공모전을 한눈에 확인하고 도전해보세요!</p>
      </header>

      {/* Filter bar */}
      <div className="rise-in mb-6 flex flex-wrap items-start justify-between gap-3" style={{ animationDelay: '90ms' }}>
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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {paged.map((event, idx) => (
              <ContestCard
                key={event.id}
                event={event}
                onToggleBookmark={handleToggleBookmark}
                className="rise-in"
                style={{ animationDelay: `${160 + Math.min(idx, 6) * 60}ms` }}
              />
            ))}
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onChange={handlePageChange} />
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#ECECF5] py-16 text-center text-sm text-[#8C8DAE]">
          이 분야에 등록된 공모전이 아직 없어요.
        </div>
      )}
    </div>
  )
}