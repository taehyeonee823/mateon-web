import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClockIcon, BookmarkIcon } from './icons'
import { dDayInfo } from '../utils/dday'
import type { EventItem } from '../api/event'

export default function EventCard({
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
  const cardRef = useRef<HTMLAnchorElement>(null)
  const detailPath = event.category === 'EXTERNAL' ? '/external' : '/contest'
  const [imageError, setImageError] = useState(false)

  // 애니메이션이 끝나면 rise-in 클래스를 제거해서 GPU 컴포지팅 레이어를
  // 해제한다. 그대로 두면 스크롤/페이지 전환 시 해당 카드가
  // 흰 화면으로 리페인트되지 않는 브라우저 버그가 발생한다.
  useEffect(() => {
    const el = cardRef.current
    if (!el) return
    function handleAnimEnd(e: AnimationEvent) {
      if (e.animationName === 'riseIn') {
        el!.classList.remove('rise-in')
      }
    }
    el.addEventListener('animationend', handleAnimEnd)
    return () => el.removeEventListener('animationend', handleAnimEnd)
  }, [])

  function handleBookmarkClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    onToggleBookmark(event)
  }

  const showImage = event.imageUrl && !imageError

  return (
    <Link
      ref={cardRef}
      to={`${detailPath}/${event.id}`}
      state={{ event }}
      className={`group flex flex-col overflow-hidden rounded-2xl border border-[#ECECF5] bg-white shadow-sm shadow-black/[0.03] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/[0.08] ${className}`}
      style={style}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#F3F3FA]">
        {showImage ? (
          <img
            src={event.imageUrl!}
            alt=""
            loading="lazy"
            onError={() => setImageError(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#1B1B33] to-[#1B1B33]" />
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