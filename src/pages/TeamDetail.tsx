import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import Footer from '../components/Footer'
import { getMyTeams, type TeamPost } from '../api/activity'

export default function TeamDetail() {
  const { id } = useParams<{ id: string }>()

  const [team, setTeam] = useState<TeamPost | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    getMyTeams()
      .then((data) => {
        const found = data.find((item) => String(item.id) === id)
        setTeam(found ?? null)
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Sidebar />

        <div className="md:pl-64">
          <Topbar />

          <main className="mx-auto max-w-3xl px-6 py-12">
            <div className="h-5 w-24 animate-pulse rounded bg-brand-50" />
            <div className="mt-8 h-10 w-2/3 animate-pulse rounded bg-brand-50" />
            <div className="mt-3 h-5 w-1/2 animate-pulse rounded bg-brand-50" />

            <div className="mt-10 space-y-4">
              <div className="h-40 animate-pulse rounded-2xl bg-brand-50" />
              <div className="h-56 animate-pulse rounded-2xl bg-brand-50" />
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-white">
        <Sidebar />

        <div className="md:pl-64">
          <Topbar />

          <main className="mx-auto max-w-3xl px-6 py-20 text-center">
            <p className="text-sm text-brand-400">
              팀 정보를 찾을 수 없어요.
            </p>

            <Link
              to="/my/teams"
              className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:text-brand-800"
            >
              모집한 팀으로 돌아가기
            </Link>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Sidebar />

      <div className="md:pl-64">
        <Topbar />

        <main className="mx-auto max-w-3xl px-6 py-10">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-brand-400">
            <Link
              to="/my"
              className="hover:text-brand-600"
            >
              내 활동
            </Link>

            <span>/</span>

            <Link
              to="/my/teams"
              className="hover:text-brand-600"
            >
              모집한 팀
            </Link>

            <span>/</span>

            <span className="text-brand-700">
              팀 상세
            </span>
          </div>

          {/* Header */}
          <section className="mt-8">
            <div className="flex items-start justify-between gap-4">

              <div className="min-w-0">
                <h1 className="text-3xl font-bold tracking-tight text-brand-900">
                  {team.title}
                </h1>

                {team.connectedActivityTitle && (
                  <p className="mt-2 text-sm text-brand-400">
                    {team.connectedActivityTitle}
                  </p>
                )}
              </div>

              <span
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                  team.recruiting
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-brand-50 text-brand-400'
                }`}
              >
                {team.recruiting ? '모집중' : '모집완료'}
              </span>
            </div>

            {team.promotionText && (
              <p className="mt-5 text-base leading-7 text-brand-600">
                {team.promotionText}
              </p>
            )}
          </section>

          {/* Recruitment summary */}
          <section className="mt-8 rounded-2xl border border-brand-100 bg-brand-50/40 p-5">
            <div className="grid grid-cols-2 gap-y-5 sm:grid-cols-4">

              <InfoItem
                label="현재 인원"
                value={`${team.currentMemberCount}명`}
              />

              <InfoItem
                label="모집 인원"
                value={`${team.capacity}명`}
              />

              <InfoItem
                label="모집 시작"
                value={team.recruitmentStartDate.replaceAll('-', '.')}
              />

              <InfoItem
                label="모집 마감"
                value={team.recruitmentEndDate.replaceAll('-', '.')}
              />

            </div>
          </section>

          {/* Roles */}
          <section className="mt-8">
            <SectionTitle
              title="모집 역할"
              description="팀에서 함께 활동할 역할이에요."
            />

            <div className="mt-4 flex flex-wrap gap-2">
              {team.role.map((role) => (
                <span
                  key={role}
                  className="rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700"
                >
                  {role}
                </span>
              ))}
            </div>
          </section>

          {/* Team introduction */}
          <section className="mt-10">
            <SectionTitle
              title="팀 소개"
              description="팀 모집에 작성한 내용을 확인할 수 있어요."
            />

            <div className="mt-4 rounded-2xl border border-brand-100 p-5">
              <p className="whitespace-pre-wrap text-sm leading-7 text-brand-700">
                {team.promotionText || '작성된 팀 소개가 없어요.'}
              </p>
            </div>
          </section>

          {/* Members */}
          <section className="mt-10">
            <SectionTitle
              title="팀원"
              description={`${team.currentMemberCount}/${team.capacity}명 참여 중`}
            />

            <div className="mt-4 divide-y divide-brand-100 rounded-2xl border border-brand-100">

              {/* 임시 팀장 */}
              <div className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-600">
                  나
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-brand-900">
                    팀장
                  </p>

                  <p className="mt-0.5 text-xs text-brand-400">
                    팀 생성자
                  </p>
                </div>

                <span className="ml-auto rounded-md bg-brand-50 px-2 py-1 text-[11px] font-medium text-brand-500">
                  팀장
                </span>
              </div>

              {/* 실제 팀원 데이터가 생기면 map */}
              {Array.from({
                length: Math.max(team.currentMemberCount - 1, 0),
              }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-4"
                >
                  <div className="h-10 w-10 rounded-full bg-brand-50" />

                  <div>
                    <p className="text-sm font-medium text-brand-800">
                      팀원 {index + 1}
                    </p>

                    <p className="mt-0.5 text-xs text-brand-400">
                      참여 멤버
                    </p>
                  </div>
                </div>
              ))}

            </div>
          </section>

          {/* Bottom actions */}
          <section className="mt-10 flex gap-3 border-t border-brand-100 pt-6">

            <Link
              to="/my/teams"
              className="flex-1 rounded-xl border border-brand-200 py-3 text-center text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
            >
              목록으로
            </Link>

            {team.recruiting && (
              <button
                className="flex-1 rounded-xl bg-brand-900 py-3 text-sm font-semibold text-white transition hover:bg-brand-800"
              >
                모집 관리
              </button>
            )}

          </section>

        </main>

        <Footer />
      </div>
    </div>
  )
}


/* -----------------------------
   작은 UI 컴포넌트
----------------------------- */

function InfoItem({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div>
      <p className="text-xs text-brand-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-brand-800">
        {value}
      </p>
    </div>
  )
}


function SectionTitle({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div>
      <h2 className="text-lg font-bold text-brand-900">
        {title}
      </h2>

      {description && (
        <p className="mt-1 text-xs text-brand-400">
          {description}
        </p>
      )}
    </div>
  )
}