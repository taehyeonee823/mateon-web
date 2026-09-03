import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { BookmarkIcon, CalendarIcon, UsersIcon } from '../components/icons'
import SimilarityMap from '../components/SimilarityMap'
import {
  fetchEventDetail,
  bookmarkEvent,
  unbookmarkEvent,
  computeDDay,
  type EventItem,
} from '../api/event'


function ArrowLeftIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M19 12H5M11 18l-6-6 6-6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ────────────────────────────────────────────────────────────────
 * Helpers
 * ──────────────────────────────────────────────────────────────── */
function dDayInfo(endDate: string) {
  const label = computeDDay(endDate)
  if (label === '마감') return { label, urgent: false, closed: true }
  if (label === 'D-DAY') return { label, urgent: true, closed: false }
  const diff = Number(label.slice(2))
  return { label, urgent: diff <= 7, closed: false }
}

function formatDate(date: string) {
  const d = new Date(date)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}


type DescriptionBlock = { heading: string | null; body: string }

// description은 백엔드에서 구조화된 필드가 아니라 순수 텍스트라,
// '■ 소제목' 컨벤션을 쓰는 글은 소제목처럼 보여주고 아니면 그냥 문단으로 렌더링한다.
function parseDescription(text: string): DescriptionBlock[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((paragraph) => {
      const lines = paragraph.split('\n')
      const headingMatch = lines[0].match(/^■\s*(.+)/)
      if (headingMatch) {
        return { heading: headingMatch[1], body: lines.slice(1).join('\n').trim() }
      }
      return { heading: null, body: paragraph }
    })
}

/* ────────────────────────────────────────────────────────────────
 * Page
 * ──────────────────────────────────────────────────────────────── */
export default function ContestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const onBack = () => navigate(-1)

  // 목록 카드를 눌러서 들어온 경우 이미 갖고 있는 데이터를 즉시 사용.
  // URL 직접 진입/새로고침처럼 넘겨받은 게 없을 때만 상세 API를 호출한다.
  const stateEvent = (location.state as { event?: EventItem } | null)?.event

  const [event, setEvent] = useState<EventItem | null>(stateEvent ?? null)
  const [loading, setLoading] = useState(!stateEvent)
  const [error, setError] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    if (stateEvent) return 
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
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [id])

  const d = useMemo(() => (event ? dDayInfo(event.endDate) : null), [event])
  const descriptionBlocks = useMemo(
    () => (event?.description ? parseDescription(event.description) : []),
    [event],
  )

  async function handleToggleBookmark() {
    if (!event) return
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

  return (
    <div className="pb-28 lg:pb-16">
      {/* Hero */}
      <div className="relative h-[42vh] min-h-[280px] w-full overflow-hidden bg-[#141A33] sm:h-[46vh]">
        {showImage ? (
          <img 
            src={event.imageUrl!} 
            alt="" 
            onError={() => setImageError(true)}
            className="h-full w-full object-cover opacity-90" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#1B1B33] to-[#2A2A4D]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />

        <button
          type="button"
          onClick={onBack}
          className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-2 text-sm font-semibold text-[#1B1B33] backdrop-blur-sm transition-colors hover:bg-white sm:left-6 sm:top-6"
        >
          <ArrowLeftIcon className="h-4 w-4" /> 목록
        </button>

        <div className="absolute right-4 top-4 flex gap-2 sm:right-6 sm:top-6">
          <button
            type="button"
            onClick={handleToggleBookmark}
            aria-pressed={event.bookmarked}
            aria-label={event.bookmarked ? '북마크 해제' : '북마크 등록'}
            className={`flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm transition-colors ${
              event.bookmarked ? 'bg-[#4D4DF1] text-white' : 'bg-white/90 text-[#1B1B33] hover:bg-white'
            }`}
          >
            <BookmarkIcon className="h-4 w-4" filled={event.bookmarked} />
          </button>
        </div>

        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-5xl px-6 pb-6 sm:pb-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-[#4D4DF1]">
              {event.fieldLabel ?? '기타'}
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold text-white ${
                d?.closed ? 'bg-white/25' : d?.urgent ? 'bg-[#FF6B57]' : 'bg-white/25'
              }`}
            >
              {d?.label}
            </span>
          </div>
          <h1 className="mt-3 max-w-2xl text-2xl font-extrabold leading-snug text-white sm:text-3xl">
            {event.title}
          </h1>
          <p className="mt-1.5 text-sm font-medium text-white/80">{event.organizer}</p>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-6 pt-8 lg:grid-cols-[1fr_320px]">
        {/* Main content */}
        <div className="flex flex-col gap-8">
          {descriptionBlocks.length > 0 && (
            <section className="flex flex-col gap-5">
              {descriptionBlocks.map((block, i) => (
                <div key={i}>
                  {block.heading && (
                    <h2 className="mb-2 text-[15px] font-bold text-[#1B1B33]">{block.heading}</h2>
                  )}
                  <p className="whitespace-pre-line text-[14px] leading-relaxed text-[#4A4B63]">{block.body}</p>
                </div>
              ))}
            </section>
          )}
          <section className="flex flex-col gap-4 rounded-2xl border border-[#ECECF5] bg-[#F5F5F9] p-5"> 
          <h2 className="text-[15px] font-bold text-[#1B1B33]">비슷한 공모전 둘러보기</h2>
          <SimilarityMap eventId={event.id} />
          </section>
        </div>

        {/* Sticky info card (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-6 flex flex-col gap-4 rounded-2xl border border-[#ECECF5] bg-white p-5 shadow-sm shadow-black/[0.03]">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EEF0FF] text-[#4D4DF1]">
                <CalendarIcon className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-[#8C8DAE]">접수 기간</p>
                <p className="text-[14px] font-bold text-[#1B1B33]">
                  {formatDate(event.startDate)} ~ {formatDate(event.endDate)}
                </p>
              </div>
            </div>

            {event.recommendedTargets && (
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EEF7F0] text-[#3FAE68]">
                  <UsersIcon className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-[#8C8DAE]">추천 대상</p>
                  <p className="line-clamp-2 text-[14px] font-bold text-[#1B1B33]">{event.recommendedTargets}</p>
                </div>
              </div>
            )}

            <a
              href={event.detailUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-1 rounded-xl bg-[#4D4DF1] py-3 text-center text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              지원하러 가기
            </a>
          </div>
        </aside>
      </div>

      {/* Sticky CTA (mobile) */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#ECECF5] bg-white/95 px-5 py-3 backdrop-blur-sm lg:hidden">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-medium text-[#8C8DAE]">{formatDate(event.endDate)} 마감</p>
            <p className="truncate text-[13px] font-bold text-[#1B1B33]">{event.organizer}</p>
          </div>
          <a
            href={event.detailUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="shrink-0 rounded-xl bg-[#4D4DF1] px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            지원하러 가기
          </a>
        </div>
      </div>
    </div>
  )
}