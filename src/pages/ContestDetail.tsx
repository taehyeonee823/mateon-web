import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { BookmarkIcon, ChevronRightIcon, ClockIcon } from '../components/icons'
import EventCard from '../components/EventCard'
import SimilarityMap from '../components/SimilarityMap'
import { getTeams } from '../api/team'
import type { TeamPost } from '../types/team'
import { useAuth } from '../context/AuthContext'
import { dDayInfo } from '../utils/dday'
import {
  fetchEventDetail,
  bookmarkEvent,
  unbookmarkEvent,
  computeDDay,
  searchEvents,
  type EventItem,
} from '../api/event'

const CONTAINER = 'mx-auto w-full max-w-[1160px] px-4 sm:px-6'

function ArrowLeftIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M19 12H5M11 18l-6-6 6-6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SparkleIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9z" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
    </svg>
  )
}

function GridIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
    </svg>
  )
}

function MapIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="2" />
      <circle cx="5" cy="6" r="1.5" />
      <circle cx="19" cy="7" r="1.5" />
      <circle cx="6" cy="18" r="1.5" />
      <circle cx="18" cy="18" r="1.5" />
      <path d="M10.5 10.8 6.2 7M13.6 11l4.2-3M10.6 13.2 7.2 17M13.4 13.3l3.6 3.6" />
    </svg>
  )
}

/* ────────────────────────────────────────────────────────────────
 * Helpers
 * ──────────────────────────────────────────────────────────────── */
function formatDate(date: string) {
  const d = new Date(date)
  return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, '0')}. ${String(d.getDate()).padStart(2, '0')}`
}

type DescriptionLine = { type: 'bullet' | 'text'; text: string }
type DescriptionBlock = { heading: string | null; lines: DescriptionLine[] }

const HEADING_PATTERN = /^(?:■|□|○|●|◆|◇|▶|▣|\[)\s*(.+?)\]?\s*$/
const BULLET_PATTERN = /^(?:[-·•*▪︎◦]|\d+[.)])\s*(.+)$/

// description은 백엔드에서 구조화된 필드가 아니라 순수 텍스트라,
// '■ 소제목' / '○ 소제목' 같은 컨벤션은 소제목으로, '- 항목'은 불릿으로 보여준다.
function parseDescription(text: string): DescriptionBlock[] {
  const blocks: DescriptionBlock[] = []
  let current: DescriptionBlock = { heading: null, lines: [] }

  const flush = () => {
    if (current.heading || current.lines.length > 0) blocks.push(current)
  }

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue

    const headingMatch = line.match(HEADING_PATTERN)
    if (headingMatch && line.length <= 40) {
      flush()
      current = { heading: headingMatch[1].trim(), lines: [] }
      continue
    }

    const bulletMatch = line.match(BULLET_PATTERN)
    current.lines.push(bulletMatch ? { type: 'bullet', text: bulletMatch[1] } : { type: 'text', text: line })
  }
  flush()

  return blocks
}

function todayString() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

/* ────────────────────────────────────────────────────────────────
 * Page
 * ──────────────────────────────────────────────────────────────── */
export default function ContestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { isLoggedIn } = useAuth()
  const onBack = () => navigate(-1)

  // 목록 카드를 눌러서 들어온 경우 이미 갖고 있는 데이터를 즉시 사용.
  // URL 직접 진입/새로고침처럼 넘겨받은 게 없을 때만 상세 API를 호출한다.
  const stateEvent = (location.state as { event?: EventItem } | null)?.event
  const usableStateEvent = stateEvent && String(stateEvent.id) === id ? stateEvent : undefined

  const [event, setEvent] = useState<EventItem | null>(usableStateEvent ?? null)
  const [loading, setLoading] = useState(!usableStateEvent)
  const [error, setError] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)
  const [teams, setTeams] = useState<TeamPost[]>([])
  const [teamsLoading, setTeamsLoading] = useState(false)
  const [teamsError, setTeamsError] = useState<string | null>(null)
  const [showAllTeams, setShowAllTeams] = useState(false)
  const [similarView, setSimilarView] = useState<'card' | 'map'>('card')
  const [similarEvents, setSimilarEvents] = useState<EventItem[]>([])
  const [similarLoading, setSimilarLoading] = useState(false)

  // 상세 → 비슷한 공모전 카드로 이동하면 같은 컴포넌트가 재사용되므로 id 변경마다 다시 맞춘다.
  useEffect(() => {
    window.scrollTo({ top: 0 })
    setImageError(false)
    setShowAllTeams(false)

    if (usableStateEvent) {
      setEvent(usableStateEvent)
      setLoading(false)
      setError(null)
      return
    }
    if (!id) {
      setLoading(false)
      return
    }
    const controller = new AbortController()
    setLoading(true)
    setError(null)

    fetchEventDetail(Number(id), controller.signal)
      .then(setEvent)
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : '공모전 정보를 불러오지 못했어요.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (!event) return

    const controller = new AbortController()
    setTeamsLoading(true)
    setTeamsError(null)

    getTeams({ eventId: event.id }, controller.signal)
      .then(setTeams)
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setTeamsError(err instanceof Error ? err.message : '모집 중인 팀을 불러오지 못했어요.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setTeamsLoading(false)
      })

    return () => controller.abort()
  }, [event?.id])

  // 카드 보기: 같은 분야·같은 카테고리에서 아직 마감 안 된 활동을 마감 임박 순으로 4개.
  useEffect(() => {
    if (!event) return

    const controller = new AbortController()
    setSimilarLoading(true)
    setSimilarEvents([])

    searchEvents(
      { field: event.field ?? undefined, category: event.category, size: 20 },
      controller.signal,
    )
      .then((items) => {
        const today = todayString()
        setSimilarEvents(
          items
            .filter((item) => item.id !== event.id && item.endDate >= today)
            .sort((a, b) => a.endDate.localeCompare(b.endDate))
            .slice(0, 4),
        )
      })
      .catch(() => {
        // 추천 영역은 부가 정보라 실패해도 조용히 비워둔다.
      })
      .finally(() => {
        if (!controller.signal.aborted) setSimilarLoading(false)
      })

    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.id])

  const d = useMemo(() => (event ? dDayInfo(event.endDate) : null), [event])
  const descriptionBlocks = useMemo(
    () => (event?.description ? parseDescription(event.description) : []),
    [event],
  )
  const recruitingTeams = useMemo(() => {
    const today = todayString()
    return teams
      .filter((team) => team.eventId === event?.id && team.recruiting && team.recruitmentEndDate >= today)
      .sort((a, b) => a.recruitmentEndDate.localeCompare(b.recruitmentEndDate))
  }, [event?.id, teams])
  const visibleTeams = showAllTeams ? recruitingTeams : recruitingTeams.slice(0, 3)

  async function handleToggleBookmark() {
    if (!event) return
    if (!isLoggedIn) {
      navigate('/login')
      return
    }
    const nextBookmarked = !event.bookmarked
    setEvent({ ...event, bookmarked: nextBookmarked })

    try {
      if (nextBookmarked) {
        await bookmarkEvent(event.id)
      } else {
        await unbookmarkEvent(event.id)
      }
    } catch {
      setEvent((prev) => (prev ? { ...prev, bookmarked: !nextBookmarked } : prev))
    }
  }

  async function handleToggleSimilarBookmark(target: EventItem) {
    if (!isLoggedIn) {
      navigate('/login')
      return
    }
    const nextBookmarked = !target.bookmarked
    const apply = (value: boolean) =>
      setSimilarEvents((prev) => prev.map((item) => (item.id === target.id ? { ...item, bookmarked: value } : item)))

    apply(nextBookmarked)
    try {
      if (nextBookmarked) await bookmarkEvent(target.id)
      else await unbookmarkEvent(target.id)
    } catch {
      apply(!nextBookmarked)
    }
  }

  const goCreateTeam = () => navigate('/teams/new', { state: { event } })

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center text-sm text-[#8C8DAE]">
        불러오는 중이에요…
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="text-sm font-medium text-[#8C8DAE]">{error ?? '해당 공모전 정보를 찾을 수 없어요.'}</p>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#F3F3FA] px-4 py-2 text-sm font-semibold text-[#6F7095] hover:bg-[#E9E9FB]"
        >
          <ArrowLeftIcon className="h-4 w-4" /> 목록으로
        </button>
      </div>
    )
  }

  const showImage = event.imageUrl && !imageError
  const eventName = event.category === 'EXTERNAL' ? '대외활동' : '공모전'

  const infoItems = [
    { label: '접수 기간', value: `${formatDate(event.startDate)} ~ ${formatDate(event.endDate)}` },
    { label: '지원 대상', value: event.targetSchool ? `${event.targetSchool} 학생` : '전국 대학생' },
    ...(event.recommendedTargets ? [{ label: '추천 대상', value: event.recommendedTargets }] : []),
  ]

  return (
    <div className="pb-28 lg:pb-0">
      {/* ── Hero ── */}
      <section className="bg-[#F7F7F9]">
        <div className={`${CONTAINER} flex flex-col gap-8 py-10 sm:flex-row sm:gap-12 lg:py-20`}>
          <div className="aspect-[2/3] w-48 shrink-0 self-center overflow-hidden rounded-lg bg-[#D9D9D9] sm:w-[250px] sm:self-start">
            {showImage && (
              <img
                src={event.imageUrl!}
                alt={`${event.title} 포스터`}
                onError={() => setImageError(true)}
                className="h-full w-full object-cover"
              />
            )}
          </div>

          <div className="min-w-0 flex-1 pt-1">
            <span
              className={`inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold ${
                d?.urgent ? 'text-[#E5484D]' : d?.closed ? 'text-[#8C8DAE]' : 'text-[#1B1B33]'
              }`}
            >
              <ClockIcon className="h-3 w-3" />
              {d?.label}
            </span>
            <h1 className="mt-4 text-[26px] font-bold leading-snug tracking-tight text-[#1B1B33] sm:text-[36px]">
              {event.title}
            </h1>
            {event.organizer && <p className="mt-3 text-sm text-[#45465C]">{event.organizer}</p>}

            <dl className="mt-7 grid grid-cols-1 border-t border-[#E4E4EA] pt-6 sm:grid-cols-[auto_auto_1fr]">
              {infoItems.map((item, index) => (
                <div
                  key={item.label}
                  className={`min-w-0 py-2 sm:py-0 sm:px-6 sm:first:pl-6 ${index > 0 ? 'sm:border-l sm:border-[#E4E4EA]' : ''}`}
                >
                  <dt className="text-[13px] text-[#6F7095]">{item.label}</dt>
                  <dd className="mt-2.5 text-base font-semibold text-[#1B1B33] sm:line-clamp-2">{item.value}</dd>
                </div>
              ))}
            </dl>

            <button
              type="button"
              onClick={handleToggleBookmark}
              aria-pressed={event.bookmarked}
              className={`mt-8 inline-flex h-11 items-center gap-2 rounded-lg border px-4 text-[15px] font-semibold transition-colors ${
                event.bookmarked
                  ? 'border-[#4D4DF1] bg-[#4D4DF1] text-white'
                  : 'border-[#D5D6E0] bg-white text-[#1B1B33] hover:bg-[#F5F5F9]'
              }`}
            >
              <BookmarkIcon className="h-4 w-4" filled={event.bookmarked} />
              {event.bookmarked ? '북마크됨' : '북마크'}
            </button>
          </div>
        </div>
      </section>

      {/* ── Body ── */}
      <div className="bg-white">
        <div className={`${CONTAINER} grid grid-cols-1 gap-10 pt-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16 lg:pt-12`}>
          {/* 공고 내용 */}
          <article className="min-w-0">
            <h2 className="text-2xl font-bold text-[#1B1B33]">공고 내용</h2>

            {event.summarizedDescription && (
              <div className="mt-4 rounded-lg bg-[#F5F6FB] px-5 py-5">
                <p className="flex items-center gap-1 text-xs font-semibold text-[#4D4DF1]">
                  <SparkleIcon className="h-3.5 w-3.5" /> AI 요약
                </p>
                <p className="mt-2 text-sm leading-[1.75] text-[#1B1B33]">{event.summarizedDescription}</p>
                <p className="mt-2.5 text-[11px] text-[#8C8DAE]">
                  공고 원문을 바탕으로 AI가 정리했어요. 정확한 내용은 원문을 확인해 주세요.
                </p>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-6">
              {descriptionBlocks.map((block, i) => (
                <section key={i}>
                  {block.heading && <h3 className="mb-3 text-lg font-bold text-[#1B1B33]">{block.heading}</h3>}
                  <ul className="flex flex-col gap-1.5">
                    {block.lines.map((line, j) =>
                      line.type === 'bullet' ? (
                        <li key={j} className="flex gap-2 text-[15px] leading-relaxed text-[#1B1B33]">
                          <span className="mt-[10px] h-1 w-1 shrink-0 rounded-full bg-[#B4B5C6]" />
                          <span className="min-w-0 break-words">{line.text}</span>
                        </li>
                      ) : (
                        <li key={j} className="break-words text-[15px] leading-relaxed text-[#1B1B33]">
                          {line.text}
                        </li>
                      ),
                    )}
                  </ul>
                </section>
              ))}

              {event.detailUrl && (
                <section>
                  <h3 className="mb-3 text-lg font-bold text-[#1B1B33]">자세한 내용 및 신청</h3>
                  <a
                    href={event.detailUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-[15px] text-[#4D4DF1] underline underline-offset-2 hover:text-[#3D3DD9]"
                  >
                    {event.detailUrl}
                  </a>
                </section>
              )}
            </div>
          </article>

          {/* 모집 중 팀 */}
          <aside className="lg:sticky lg:top-6 lg:mt-14 lg:self-start">
            <section className="rounded-xl border border-[#E8E8EF] bg-white p-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-[#1B1B33]">모집 중 팀</h2>
                {recruitingTeams.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setShowAllTeams((prev) => !prev)}
                    className="flex items-center gap-0.5 text-xs text-[#45465C] hover:text-[#1B1B33]"
                  >
                    {showAllTeams ? '접기' : '전체 보기'}
                    <ChevronRightIcon className={`h-3 w-3 transition-transform ${showAllTeams ? '-rotate-90' : ''}`} />
                  </button>
                )}
              </div>

              {teamsLoading ? (
                <p className="py-8 text-center text-xs text-[#8C8DAE]">불러오는 중이에요…</p>
              ) : teamsError ? (
                <p className="py-8 text-center text-xs text-rose-500">{teamsError}</p>
              ) : visibleTeams.length > 0 ? (
                <div className="mt-5 flex flex-col gap-3">
                  {visibleTeams.map((team) => (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => navigate(isLoggedIn ? `/my/teams/${team.id}` : '/login')}
                      className="rounded-lg bg-[#F5F6FB] p-4 text-left transition-colors hover:bg-[#ECEEFA]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate text-[11px] font-medium text-[#4D4DF1]">
                          {team.role.length > 0 ? team.role.join(' · ') : '포지션 무관'}
                        </span>
                        <span className="shrink-0 text-xs text-[#1B1B33]">{computeDDay(team.recruitmentEndDate)}</span>
                      </div>
                      <p className="mt-1.5 truncate text-sm font-bold text-[#1B1B33]">{team.title}</p>
                      {team.promotionText && (
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#45465C]">{team.promotionText}</p>
                      )}
                      <p className="mt-1.5 text-xs text-[#8C8DAE]">
                        {team.currentMemberCount}/{team.capacity}명 모집 중
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-xs text-[#8C8DAE]">아직 모집 중인 팀이 없어요.</p>
              )}

              <button
                type="button"
                onClick={goCreateTeam}
                className="mt-5 h-11 w-full rounded-lg bg-[#EEF0FC] text-xs font-semibold text-[#4D4DF1] transition-colors hover:bg-[#E3E5FC]"
              >
                + 이 {eventName}으로 팀 만들기
              </button>
            </section>
          </aside>
        </div>

        {/* 이런 공모전도 있어요 */}
        <section className={`${CONTAINER} pb-20 pt-16`}>
          <div className="border-t border-[#ECECF2] pt-10">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-[#1B1B33]">이런 {eventName}도 있어요</h2>
              <div role="tablist" aria-label="보기 방식" className="flex rounded-md bg-[#F0F0F5] p-0.5">
                {(
                  [
                    { key: 'card', label: '카드', Icon: GridIcon },
                    { key: 'map', label: '지도', Icon: MapIcon },
                  ] as const
                ).map(({ key, label, Icon }) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={similarView === key}
                    onClick={() => setSimilarView(key)}
                    className={`flex items-center gap-1 rounded px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      similarView === key ? 'bg-white text-[#1B1B33] shadow-sm' : 'text-[#8C8DAE] hover:text-[#45465C]'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              {similarView === 'card' ? (
                similarLoading ? (
                  <p className="py-16 text-center text-sm text-[#8C8DAE]">비슷한 {eventName}을 찾는 중이에요…</p>
                ) : similarEvents.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {similarEvents.map((item) => (
                      <EventCard key={item.id} event={item} onToggleBookmark={handleToggleSimilarBookmark} />
                    ))}
                  </div>
                ) : (
                  <p className="py-16 text-center text-sm text-[#8C8DAE]">비슷한 {eventName}이 아직 없어요.</p>
                )
              ) : (
                <div className="rounded-xl border border-[#ECECF5] bg-[#F7F7F9] p-5">
                  <SimilarityMap eventId={event.id} />
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Sticky CTA (mobile) */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#ECECF5] bg-white/95 px-5 py-3 backdrop-blur-sm lg:hidden">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-medium text-[#8C8DAE]">{formatDate(event.endDate)} 마감</p>
            <p className="truncate text-[13px] font-bold text-[#1B1B33]">{event.organizer}</p>
          </div>
          <button
            type="button"
            onClick={goCreateTeam}
            className="shrink-0 rounded-xl bg-[#4D4DF1] px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            팀 만들기
          </button>
        </div>
      </div>
    </div>
  )
}
