import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import { getReviewableTeams, submitTeamReviews, type TeamReviewTargets } from '../api/activity'

export default function TeamReview() {
  const { isLoggedIn } = useAuth()
  const [teams, setTeams] = useState<TeamReviewTargets[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ratings, setRatings] = useState<Record<number, Record<number, number>>>({})
  const [submittingTeamId, setSubmittingTeamId] = useState<number | null>(null)

  useEffect(() => {
    if (!isLoggedIn) return
    setLoading(true)
    setError(null)

    getReviewableTeams()
      .then(setTeams)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : '평가 대상을 불러오지 못했어요.')
      })
      .finally(() => setLoading(false))
  }, [isLoggedIn])

  function setRating(teamId: number, userId: number, rating: number) {
    setRatings((prev) => ({
      ...prev,
      [teamId]: { ...prev[teamId], [userId]: rating },
    }))
  }

  async function handleSubmit(team: TeamReviewTargets) {
    const pending = team.targets.filter((t) => !t.alreadyReviewed)
    const teamRatings = ratings[team.teamId] ?? {}
    const missing = pending.filter((t) => !teamRatings[t.userId])

    if (missing.length > 0) {
      window.alert('모든 팀원에게 별점을 매겨주세요.')
      return
    }

    setSubmittingTeamId(team.teamId)
    try {
      await submitTeamReviews(
        team.teamId,
        pending.map((t) => ({ revieweeId: t.userId, rating: teamRatings[t.userId] })),
      )
      setTeams((prev) => prev.filter((t) => t.teamId !== team.teamId))
    } catch (err) {
      window.alert(err instanceof Error ? err.message : '평가 제출에 실패했어요.')
    } finally {
      setSubmittingTeamId(null)
    }
  }

  const reviewableTeams = teams.filter((t) => t.targets.some((target) => !target.alreadyReviewed))

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
            <span className="text-brand-700">팀원 평가</span>
          </div>

          <h1 className="mb-2 text-2xl font-bold text-brand-900">팀원 평가</h1>
          <p className="mb-8 text-sm text-brand-500">
            함께 활동을 마친 팀원들에게 별점을 남겨주세요.
          </p>

          {!isLoggedIn ? (
            <p className="py-16 text-center text-sm text-brand-400">로그인이 필요해요.</p>
          ) : loading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-2xl bg-brand-50" />
              ))}
            </div>
          ) : error ? (
            <p className="py-16 text-center text-sm text-rose-500">{error}</p>
          ) : reviewableTeams.length > 0 ? (
            <div className="flex flex-col gap-4">
              {reviewableTeams.map((team) => {
                const pending = team.targets.filter((t) => !t.alreadyReviewed)
                return (
                  <div key={team.teamId} className="rounded-2xl border border-brand-100 p-5">
                    <p className="font-bold text-brand-900">{team.teamTitle}</p>
                    <p className="mt-0.5 text-xs text-brand-400">
                      평가 마감: {team.reviewDeadline.slice(0, 10).replaceAll('-', '.')}
                    </p>

                    <div className="mt-4 flex flex-col gap-3">
                      {pending.map((target) => (
                        <div
                          key={target.userId}
                          className="flex items-center justify-between rounded-xl border border-brand-100 px-4 py-3"
                        >
                          <div>
                            <p className="text-sm font-semibold text-brand-900">{target.name}</p>
                            <p className="text-xs text-brand-400">{target.major}</p>
                          </div>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => {
                              const current = ratings[team.teamId]?.[target.userId] ?? 0
                              return (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setRating(team.teamId, target.userId, star)}
                                  aria-label={`${star}점`}
                                  className={`text-xl transition-colors ${
                                    star <= current ? 'text-[#FFB800]' : 'text-brand-100'
                                  }`}
                                >
                                  ★
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSubmit(team)}
                      disabled={submittingTeamId === team.teamId}
                      className="mt-4 h-11 w-full rounded-xl bg-[#2554F0] text-sm font-semibold text-white transition-opacity disabled:opacity-40"
                    >
                      {submittingTeamId === team.teamId ? '제출 중...' : '평가 제출'}
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-brand-100 py-16 text-center text-sm text-brand-400">
              아직 평가할 팀원이 없어요.
            </p>
          )}
        </main>

        <Footer />
      </div>
    </div>
  )
}
