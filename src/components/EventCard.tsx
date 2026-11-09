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
      className={`group flex flex-col overflow-hidden rounded-xl border border-[#ECECF5] bg-white shadow-sm shadow-black/[0.03] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/[0.08] ${className}`}
      style={style}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#E4E4EA]">
        {showImage && (
          <img
            src={event.imageUrl!}
            alt=""
            loading="lazy"
            onError={() => setImageError(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        )}

        <span
          className={`absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[11px] font-semibold shadow-sm ${
            d.urgent ? 'text-[#E5484D]' : d.closed ? 'text-[#8C8DAE]' : 'text-black'
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
          className={`absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-md shadow-sm transition-colors ${
            event.bookmarked ? 'bg-[#3F4FDB] text-white' : 'bg-white text-black hover:bg-slate-100'
          }`}
        >
          <BookmarkIcon className="h-3.5 w-3.5" filled={event.bookmarked} />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col px-3.5 pb-3.5 pt-4">
        <span className="self-start rounded bg-[#EEF1FD] px-1.5 py-0.5 text-[11px] font-semibold text-[#3F4FDB]">
          {event.fieldLabel ?? '기타'}
        </span>
        <h3 className="mt-2 line-clamp-2 text-[15px] font-bold leading-snug text-black group-hover:text-[#3F4FDB]">
          {event.title}
        </h3>
        <p className="mt-1.5 truncate text-xs text-[#6F7095]">{event.organizer}</p>

        <p className="mt-auto pt-6 text-xs text-[#6F7095]">{event.endDate.replaceAll('-', '.')} 마감</p>
      </div>
    </Link>
  )
}