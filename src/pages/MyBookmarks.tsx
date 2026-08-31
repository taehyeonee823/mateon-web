import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import Footer from '../components/Footer'
import EventCard from '../components/EventCard'
import { useAuth } from '../context/AuthContext'
import { fetchBookmarkedEvents, bookmarkEvent, unbookmarkEvent, type EventItem } from '../api/event'

export default function MyBookmarks() {
  const { isLoggedIn } = useAuth()
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoggedIn) return
    const controller = new AbortController()
    setLoading(true)
    setError(null)

    fetchBookmarkedEvents(undefined, controller.signal)
      .then(setEvents)
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : '북마크 목록을 불러오지 못했어요.')
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [isLoggedIn])

  async function handleToggleBookmark(target: EventItem) {
    setEvents((prev) => prev.filter((e) => e.id !== target.id))

    try {
      if (target.bookmarked) {
        await unbookmarkEvent(target.id)
      } else {
        await bookmarkEvent(target.id)
      }
    } catch {
      setEvents((prev) => [...prev, target])
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Sidebar />
      <div className="md:pl-64">
        <Topbar />

        <main className="mx-auto max-w-5xl px-6 py-12">
          <div className="mb-8 flex items-center gap-2 text-sm text-brand-400">
            <Link to="/my" className="hover:text-brand-600">
              내 활동
            </Link>
            <span>/</span>
            <span className="text-brand-700">북마크</span>
          </div>

          <h1 className="mb-8 text-2xl font-bold text-brand-900">북마크</h1>

          {!isLoggedIn ? (
            <p className="py-16 text-center text-sm text-brand-400">로그인이 필요해요.</p>
          ) : loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[16/10] animate-pulse rounded-2xl bg-brand-50" />
              ))}
            </div>
          ) : error ? (
            <p className="py-16 text-center text-sm text-rose-500">{error}</p>
          ) : events.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <EventCard key={event.id} event={event} onToggleBookmark={handleToggleBookmark} />
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-brand-100 py-16 text-center text-sm text-brand-400">
              북마크한 활동이 없어요.
            </p>
          )}
        </main>

        <Footer />
      </div>
    </div>
  )
}
