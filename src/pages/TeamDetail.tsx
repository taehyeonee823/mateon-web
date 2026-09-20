import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import Footer from '../components/Footer'
import { getTeamDetail } from '../api/team'
import type { TeamDetail as TeamDetailType } from '../types/team'

const TABS = [
  { key: 'info', label: '팀 정보' },
  { key: 'members', label: '지원자 관리' },
  { key: 'roles', label: '팀원 모으기' },
] as const

type TabKey = (typeof TABS)[number]['key']

export default function TeamDetail() {
  const { id } = useParams<{ id: string }>()

  const [team, setTeam] = useState<TeamDetailType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('info')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)

    getTeamDetail(Number(id))
      .then((data) => setTeam(data))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : '팀 정보를 불러오지 못했어요.')
        setTeam(null)
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Sidebar />
        <div className="md:pl-64">
          <Topbar />
          <main className="mx-auto max-w-4xl px-6 py-12">
            <div className="h-5 w-24 animate-pulse rounded bg-brand-50" />
            <div className="mt-6 h-40 animate-pulse rounded-2xl bg-brand-50" />
            <div className="mt-6 h-72 animate-pulse rounded-2xl bg-brand-50" />
          </main>
        </div>
      </div>
    )
  }

  if (!team || error) {
    return (
      <div className="min-h-screen bg-white">
        <Sidebar />
        <div className="md:pl-64">
          <Topbar />
          <main className="mx-auto max-w-4xl px-6 py-20 text-center">
            <p className="text-sm text-brand-400">
              {error || '팀 정보를 찾을 수 없어요.'}
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

        <main className="mx-auto max-w-4xl px-6 py-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-brand-400">
            <Link to="/my" className="hover:text-brand-600">내 활동</Link>
            <span>/</span>
            <Link to="/my/teams" className="hover:text-brand-600">모집한 팀</Link>
            <span>/</span>
            <span className="text-brand-700">팀 상세</span>
          </div>

          {/* Header card */}
          <section className="mt-6 rounded-2xl border border-brand-100 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <span
                  className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                    team.recruiting
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-brand-50 text-brand-400'
                  }`}
                >
                  {team.recruiting ? '모집중' : '모집완료'}
                </span>

                <h1 className="mt-2 text-2xl font-bold tracking-tight text-brand-900">
                  {team.title}
                </h1>

                {team.connectedActivityTitle && (
                  <p className="mt-1 text-sm text-brand-400">
                    {team.connectedActivityTitle}
                  </p>
                )}

                {team.promotionText && (
                  <p className="mt-3 text-sm leading-6 text-brand-600">
                    {team.promotionText}
                  </p>
                )}
              </div>

              {team.leader && (
                <Link
                  to={`/my/teams/${team.id}/edit`}
                  className="shrink-0 rounded-lg border border-brand-200 px-3 py-2 text-xs font-semibold text-brand-600 hover:bg-brand-50"
                >
                  팀 정보 수정
                </Link>
              )}
            </div>
          </section>

          {/* Tabs */}
          <div className="mt-6 flex gap-1 border-b border-brand-100">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 text-sm font-semibold transition ${
                  activeTab === tab.key
                    ? 'border-b-2 border-brand-900 text-brand-900'
                    : 'text-brand-400 hover:text-brand-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="mt-6">
            {activeTab === 'info' ? (
              <TeamInfoTab team={team} />
            ) : (
              <ComingSoon label={TABS.find((t) => t.key === activeTab)!.label} />
            )}
          </div>
        </main>

        <Footer />
      </div>
    </div>
  )
}

/* -----------------------------
   팀 정보 탭
----------------------------- */

function TeamInfoTab({ team }: { team: TeamDetailType }) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {/* 팀 기본 정보 */}
      <section className="rounded-2xl border border-brand-100 p-5">
        <h2 className="text-base font-bold text-brand-900">팀 기본 정보</h2>

        <dl className="mt-4 space-y-3 text-sm">
          <InfoRow label="팀 이름" value={team.title} />
          {team.connectedActivityTitle && (
            <InfoRow label="공모전" value={team.connectedActivityTitle} />
          )}
          <InfoRow label="팀 소개" value={team.promotionText || '작성된 소개가 없어요.'} />
          <InfoRow
            label="모집 기간"
            value={`${team.recruitmentStartDate.replaceAll('-', '.')} ~ ${team.recruitmentEndDate.replaceAll('-', '.')}`}
          />
          <InfoRow label="현재 인원" value={`${team.currentMemberCount} / ${team.capacity}명`} />
        </dl>

        {team.role.length > 0 && (
          <div className="mt-4 border-t border-brand-100 pt-4">
            <p className="text-xs text-brand-400">모집 포지션</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {team.role.map((r) => (
                <span
                  key={r}
                  className="rounded-md bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-600"
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
        )}

        {team.requiredSkills.length > 0 && (
          <div className="mt-4 border-t border-brand-100 pt-4">
            <p className="text-xs text-brand-400">요구 스킬</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {team.requiredSkills.map((s) => (
                <span
                  key={s}
                  className="rounded-md bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-600"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 팀 멤버 */}
      <section className="rounded-2xl border border-brand-100 p-5">
        <h2 className="text-base font-bold text-brand-900">
          팀 멤버 <span className="font-normal text-brand-400">({team.members.length}명)</span>
        </h2>

        <div className="mt-4 divide-y divide-brand-100">
          {team.members.map((member) => (
            <div key={member.userId} className="flex items-center gap-3 py-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-600">
                {member.name.slice(0, 1)}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-semibold text-brand-900">
                    {member.name}
                  </p>
                  {member.isLeader && <span title="팀장">👑</span>}
                </div>
                <p className="mt-0.5 text-xs text-brand-400">{member.major}</p>
              </div>

              {member.isLeader && (
                <span className="ml-auto shrink-0 rounded-md bg-brand-50 px-2 py-1 text-[11px] font-medium text-brand-500">
                  팀장
                </span>
              )}
            </div>
          ))}

          {team.members.length === 0 && (
            <p className="py-6 text-center text-sm text-brand-400">아직 팀원이 없어요.</p>
          )}
        </div>
      </section>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-brand-400">{label}</dt>
      <dd className="text-right font-medium text-brand-800">{value}</dd>
    </div>
  )
}

/* -----------------------------
   준비중 탭 placeholder
----------------------------- */

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-brand-100 py-24 text-center">
      <p className="text-sm font-semibold text-brand-500">{label} 기능은 준비 중이에요</p>
      <p className="mt-1 text-xs text-brand-300">곧 만나볼 수 있어요.</p>
    </div>
  )
}