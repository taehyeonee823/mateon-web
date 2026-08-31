import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import { getMyTeams, type TeamPost } from '../api/activity'

export default function MyTeams() {
  const { isLoggedIn } = useAuth()
  const [teams, setTeams] = useState<TeamPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoggedIn) return
    setLoading(true)
    setError(null)

    getMyTeams()
      .then((data) =>
        setTeams(
          [...data].sort((a, b) => b.recruitmentStartDate.localeCompare(a.recruitmentStartDate)),
        ),
      )
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : '모집한 팀 목록을 불러오지 못했어요.')
      })
      .finally(() => setLoading(false))
  }, [isLoggedIn])

  return (
    <div className="min-h-screen bg-white">
      <Sidebar />
      <div className="md:pl-64">
        <Topbar />

        <main className="mx-auto max-w-3xl px-6 py-12">
          <div className="mb-8 flex items-center gap-2 text-sm text-brand-400">
            <Link to="/my" className="hover:text-brand-600">
              내 활동
            </Link>
            <span>/</span>
            <span className="text-brand-700">모집한 팀</span>
          </div>

          <h1 className="mb-8 text-2xl font-bold text-brand-900">모집한 팀</h1>

          {!isLoggedIn ? (
            <p className="py-16 text-center text-sm text-brand-400">로그인이 필요해요.</p>
          ) : loading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-brand-50" />
              ))}
            </div>
          ) : error ? (
            <p className="py-16 text-center text-sm text-rose-500">{error}</p>
          ) : teams.length > 0 ? (
            <div className="flex flex-col gap-3">
              {teams.map((t) => (
                <div key={t.id} className="rounded-2xl border border-brand-100 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-brand-900">{t.title}</p>
                      {t.connectedActivityTitle && (
                        <p className="mt-0.5 truncate text-xs text-brand-400">
                          {t.connectedActivityTitle}
                        </p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        t.recruiting ? 'bg-emerald-50 text-emerald-600' : 'bg-brand-50 text-brand-300'
                      }`}
                    >
                      {t.recruiting ? '모집중' : '모집완료'}
                    </span>
                  </div>

                  {t.promotionText && <p className="mt-2 text-sm text-brand-600">{t.promotionText}</p>}

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {t.role.map((r) => (
                      <span
                        key={r}
                        className="rounded-md bg-brand-50 px-2 py-1 text-[11px] font-medium text-brand-600"
                      >
                        {r}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-brand-400">
                    <span>
                      {t.currentMemberCount}/{t.capacity}명
                    </span>
                    <span>
                      {t.recruitmentStartDate.replaceAll('-', '.')} ~{' '}
                      {t.recruitmentEndDate.replaceAll('-', '.')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-brand-100 py-16 text-center text-sm text-brand-400">
              모집한 팀이 없어요.
            </p>
          )}
        </main>

        <Footer />
      </div>
    </div>
  )
}
