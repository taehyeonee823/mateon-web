import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'

/* ────────────────────────────────────────────────────────────────
 * Icons (inlined so this file has zero external icon dependency)
 * ──────────────────────────────────────────────────────────────── */
function ChevronDownIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ClockIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={2} />
      <path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

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

type Contest = {
  id: string
  title: string
  org: string
  category: string
  prize: string
  deadline: string
  tags: string[]
  imageUrl: string
}

const CATEGORIES = [
  '전체', '여행/호텔/항공', '언론/미디어', '문화/역사', '행사/페스티벌', '교육',
  '디자인/사진/예술/영상', '경제/금융', '경영/컨설팅/마케팅', '정치/사회/법률', '체육/헬스', '의료/보건',
  '뷰티/미용/화장품', '과학/공학/기술/IT', '요리/식품', '창업/자기계발', '환경/에너지', '콘텐츠', '사회공헌/교류',
  '유통/물류', '기획/아이디어', '기타',
] as const

const INITIAL_VISIBLE_COUNT = 6

// 🔧 더미 데이터 — 실제 연결 시 API 응답으로 교체
const CONTESTS: Contest[] = [
  {
    id: 'c1',
    title: '2026 대학생 AI 서비스 아이디어 공모전',
    org: '과학기술정보통신부',
    category: '과학/공학/기술/IT',
    prize: '총상금 2,000만원',
    deadline: '2026-09-05',
    tags: ['대상 500만원', '전국 대학생'],
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'c2',
    title: '브랜드 리뉴얼 디자인 챌린지',
    org: '한국디자인진흥원',
    category: '디자인/사진/예술/영상',
    prize: '총상금 800만원',
    deadline: '2026-08-28',
    tags: ['포트폴리오 인정', '개인/팀'],
    imageUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'c3',
    title: '지속가능 마케팅 캠페인 공모전',
    org: 'CJ제일제당',
    category: '경영/컨설팅/마케팅',
    prize: '인턴십 연계',
    deadline: '2026-09-20',
    tags: ['서류 면제', '4인 이내 팀'],
    imageUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'c4',
    title: '캠퍼스 문제해결 아이디어톤',
    org: '서울시청년허브',
    category: '기획/아이디어',
    prize: '총상금 500만원',
    deadline: '2026-08-24',
    tags: ['1박 2일', '숙식 제공'],
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'c5',
    title: '숏폼 콘텐츠 크리에이터 공모전',
    org: '한국콘텐츠진흥원',
    category: '콘텐츠',
    prize: '총상금 1,200만원',
    deadline: '2026-10-02',
    tags: ['개인 참가', '유튜브 연동'],
    imageUrl: 'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'c6',
    title: '오픈소스 해커톤: MateOn Build',
    org: 'MateOn',
    category: '과학/공학/기술/IT',
    prize: '총상금 600만원',
    deadline: '2026-08-30',
    tags: ['48시간', '온라인'],
    imageUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=800&auto=format&fit=crop',
  },
]

const TODAY = new Date('2026-08-18')

/* ────────────────────────────────────────────────────────────────
 * Helpers
 * ──────────────────────────────────────────────────────────────── */
function presetRange(preset: PeriodPreset): { start: Date; end: Date } {
  const start = new Date(TODAY)
  const end = new Date(TODAY)
  if (preset === 'week') {
    end.setDate(end.getDate() + (7 - end.getDay()))
  } else if (preset === 'month') {
    end.setMonth(end.getMonth() + 1, 0)
  }
  return { start, end }
}

function isWithinPeriod(deadline: string, filter: PeriodFilter) {
  if (!filter) return true
  const target = new Date(deadline)
  const range =
    filter.type === 'preset' ? presetRange(filter.preset) : { start: new Date(filter.start), end: new Date(filter.end) }
  return target >= range.start && target <= range.end
}

function dDay(deadline: string) {
  const target = new Date(deadline)
  const diff = Math.ceil((target.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return { label: '마감', urgent: false, closed: true }
  if (diff === 0) return { label: 'D-DAY', urgent: true, closed: false }
  return { label: `D-${diff}`, urgent: diff <= 7, closed: false }
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
  contest,
  className = '',
  style,
}: {
  contest: Contest
  className?: string
  style?: React.CSSProperties
}) {
  const d = dDay(contest.deadline)

  return (
    <Link
      to={`/contest/${contest.id}`}
      className={`group flex flex-col overflow-hidden rounded-2xl border border-[#ECECF5] bg-white shadow-sm shadow-black/[0.03] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/[0.08] ${className}`}
      style={style}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#F3F3FA]">
        <img
          src={contest.imageUrl}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-black/0" />

        {/* Category chip, top-left */}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-[#4D4DF1] backdrop-blur-sm">
          {contest.category}
        </span>

        {/* D-day badge, top-right */}
        <span
          className={`absolute right-3 top-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm ${
            d.closed ? 'bg-black/40' : d.urgent ? 'bg-[#FF6B57]' : 'bg-black/55'
          }`}
        >
          <ClockIcon className="h-3 w-3" />
          {d.label}
        </span>

        {/* Org name, bottom-left over gradient */}
        <span className="absolute bottom-2.5 left-3 text-[12px] font-medium text-white/90 drop-shadow">
          {contest.org}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 px-4 py-4">
        <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-[#1B1B33] group-hover:text-[#4D4DF1]">
          {contest.title}
        </h3>

        <div className="mt-auto flex flex-wrap items-center gap-1.5">
          <span className="rounded-md bg-[#FFF1EE] px-2 py-1 text-[11px] font-semibold text-[#FF6B57]">
            {contest.prize}
          </span>
          {contest.tags.map((tag) => (
            <span key={tag} className="rounded-md bg-[#F3F3FA] px-2 py-1 text-[11px] font-medium text-[#6F7095]">
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-[#F0F0F7] pt-2.5 text-[11px] text-[#8C8DAE]">
          <span>{contest.deadline.replaceAll('-', '.')} 마감</span>
          <span className="font-semibold text-[#4D4DF1] opacity-0 transition-opacity group-hover:opacity-100">
            자세히 보기 →
          </span>
        </div>
      </div>
    </Link>
  )
}

/* ────────────────────────────────────────────────────────────────
 * Page
 * ──────────────────────────────────────────────────────────────── */
export default function ContestPage() {
  const [activeCategory, setActiveCategory] = useState<(typeof CATEGORIES)[number]>('전체')
  const [sortByDeadline, setSortByDeadline] = useState(true)
  const [categoriesExpanded, setCategoriesExpanded] = useState(false)

  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>(null)
  const [periodOpen, setPeriodOpen] = useState(false)
  const [periodTab, setPeriodTab] = useState<'quick' | 'custom'>('quick')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const periodButtonRef = useRef<HTMLButtonElement>(null)
  const periodPanelRef = useRef<HTMLDivElement>(null)
  const [panelCoords, setPanelCoords] = useState<{ top: number; right: number } | null>(null)

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
    let list = activeCategory === '전체' ? CONTESTS : CONTESTS.filter((c) => c.category === activeCategory)
    list = list.filter((c) => isWithinPeriod(c.deadline, periodFilter))
    return sortByDeadline ? [...list].sort((a, b) => a.deadline.localeCompare(b.deadline)) : list
  }, [activeCategory, sortByDeadline, periodFilter])

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

      {/* Card grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c, idx) => (
            <ContestCard
              key={c.id}
              contest={c}
              className="rise-in"
              style={{ animationDelay: `${160 + Math.min(idx, 6) * 60}ms` }}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#ECECF5] py-16 text-center text-sm text-[#8C8DAE]">
          이 분야에 등록된 공모전이 아직 없어요.
        </div>
      )}
    </div>
  )
}