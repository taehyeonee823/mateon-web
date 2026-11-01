import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import EventCard from './EventCard'
import { searchAllEvents, bookmarkEvent, unbookmarkEvent, type EventItem } from '../api/event'
import { dDayInfo } from '../utils/dday'

const VISIBLE_COUNT = 6

// 랜딩: 공모전 + 대외활동 중 마감이 가장 임박한 활동 6개 (3x2)
export default function DeadlineEvents() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    // 검색 API에 정렬 옵션이 없어서 전체를 받아 마감 안 된 것만 마감일 순으로 자른다
    searchAllEvents({}, controller.signal)
      .then((list) =>
        setEvents(
          list
            .filter((e) => !dDayInfo(e.endDate).closed)
            .sort((a, b) => a.endDate.localeCompare(b.endDate))
            .slice(0, VISIBLE_COUNT),
        ),
      )
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : '활동 목록을 불러오지 못했어요.')
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [])

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

  return (
    <section className="bg-white px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h1 className="mt-3 text-3xl font-bold text-black sm:text-4xl">마감 임박 활동</h1>
          <p className="mt-2 text-sm text-[#6F7095]">놓치기 전에 지금 바로 확인해보세요.</p>
        </div>

        <div className="mt-10">
          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: VISIBLE_COUNT }).map((_, i) => (
                <div key={i} className="aspect-[16/13] animate-pulse rounded-2xl bg-[#F3F3FA]" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-dashed border-[#ECECF5] py-16 text-center text-sm text-[#8C8DAE]">
              {error}
            </div>
          ) : events.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <EventCard key={event.id} event={event} onToggleBookmark={handleToggleBookmark} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#ECECF5] py-16 text-center text-sm text-[#8C8DAE]">
              마감 임박한 활동이 아직 없어요.
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Link
            to="/contest"
            className="flex items-center gap-1.5 text-sm font-semibold text-[#4D4DF1] transition-opacity hover:opacity-80"
          >
            더 보러가기 <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
