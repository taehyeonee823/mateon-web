import { Link, useLocation, useParams } from 'react-router-dom'
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import Footer from '../components/Footer'
import { draftProposalForTeam } from '../api/proposal'
import {
  getTeamApplications,
  getTeamDetail,
  respondToApplication,
  submitTeamApplication,
  type TeamApplicationRequest,
} from '../api/team'
import type { Application, TeamDetail as TeamDetailType } from '../types/team'
import Teammates, { OfferManagement } from '../components/Teammates'

const TABS = [
  { key: 'info', label: '팀 정보' },
  { key: 'members', label: '지원자 관리' },
  { key: 'roles', label: '팀원 모으기' },
  { key: 'offer', label: '제안 관리' },
] as const

type TabKey = (typeof TABS)[number]['key']

export default function TeamDetail() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const fromTeamRecommendations =
    (location.state as { fromTeamRecommendations?: boolean } | null)?.fromTeamRecommendations === true

  const [team, setTeam] = useState<TeamDetailType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('info')
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false)
  const visibleTabs = team?.leader ? TABS : TABS.filter((tab) => tab.key === 'info')

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

              {team.leader ? (
                <Link
                  to={`/my/teams/${team.id}/edit`}
                  className="shrink-0 rounded-lg border border-brand-200 px-3 py-2 text-xs font-semibold text-brand-600 hover:bg-brand-50"
                >
                  팀 정보 수정
                </Link>
              ) : team.recruiting ? (
                <button
                  type="button"
                  disabled={team.hasApplied}
                  onClick={() => setIsApplicationModalOpen(true)}
                  className="shrink-0 rounded-lg bg-brand-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {team.hasApplied
                    ? team.myApplicationStatus === 'APPROVED'
                      ? '합류 완료'
                      : team.myApplicationStatus === 'REJECTED'
                        ? '지원 거절됨'
                        : '지원 완료'
                    : '지원하기'}
                </button>
              ) : null}
            </div>
          </section>

          {/* Tabs */}
          <div className="mt-6 flex gap-1 border-b border-brand-100">
            {visibleTabs.map((tab) => (
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
            {!team.leader || activeTab === 'info' ? (
              <TeamInfoTab team={team} />
            ) : activeTab === 'members' ? (
              <ReceivedApplicationsTab
                teamId={team.id}
                isLeader={team.leader}
                onTeamRefresh={async () => {
                  const updatedTeam = await getTeamDetail(team.id)
                  setTeam(updatedTeam)
                }}
              />
            ) : activeTab === 'roles' ? (
              <Teammates teamId={team.id} isLeader={team.leader} />
            ) : activeTab === 'offer' ? (
              <OfferManagement teamId={team.id} isLeader={team.leader} />
            ) : (
              <TeamInfoTab team={team} />
            )}
          </div>
        </main>

        <Footer />
      </div>
      {isApplicationModalOpen && (
        <TeamApplicationModal
          team={team}
          generateAiDraft={fromTeamRecommendations}
          onClose={() => setIsApplicationModalOpen(false)}
          onSubmitted={() => {
            setTeam((current) =>
              current
                ? { ...current, hasApplied: true, myApplicationStatus: 'PENDING' }
                : current,
            )
            setIsApplicationModalOpen(false)
          }}
        />
      )}
    </div>
  )
}

function TeamApplicationModal({
  team,
  generateAiDraft: shouldGenerateAiDraft,
  onClose,
  onSubmitted,
}: {
  team: TeamDetailType
  generateAiDraft: boolean
  onClose: () => void
  onSubmitted: () => void
}) {
  const [introduction, setIntroduction] = useState('')
  const [message, setMessage] = useState('')
  const [draftLoading, setDraftLoading] = useState(false)
  const [draftError, setDraftError] = useState<string | null>(null)
  const [contactNumber, setContactNumber] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const draftRequestSeq = useRef(0)

  const loadDraft = useCallback(async () => {
    const requestSeq = ++draftRequestSeq.current
    setDraftLoading(true)
    setDraftError(null)
    try {
      const draft = await draftProposalForTeam({ teamId: team.id })
      if (requestSeq !== draftRequestSeq.current) return
      setIntroduction(draft.summary)
      setMessage(draft.message)
    } catch (err) {
      if (requestSeq !== draftRequestSeq.current) return
      setDraftError(err instanceof Error ? err.message : '지원 문구 초안을 불러오지 못했어요.')
    } finally {
      if (requestSeq === draftRequestSeq.current) setDraftLoading(false)
    }
  }, [team.id])

  useEffect(() => {
    if (!shouldGenerateAiDraft) return
    void loadDraft()
    return () => {
      draftRequestSeq.current++
    }
  }, [loadDraft, shouldGenerateAiDraft])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    const payload: TeamApplicationRequest = {
      introduction: introduction.trim(),
      message: message.trim(),
      contactNumber: contactNumber.trim(),
      ...(portfolioUrl.trim() ? { portfolioUrl: portfolioUrl.trim() } : {}),
    }

    setSubmitting(true)
    setError(null)
    try {
      await submitTeamApplication(team.id, payload)
      onSubmitted()
    } catch (err) {
      setError(err instanceof Error ? err.message : '지원서 제출에 실패했어요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="team-application-title"
        className="max-h-full w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="team-application-title" className="text-lg font-bold text-brand-900">
              {team.title} 지원하기
            </h2>
            <p className="mt-1 text-sm text-brand-400">팀장에게 전달할 지원서를 작성해주세요.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="지원서 작성 닫기"
            className="text-xl text-brand-400 hover:text-brand-700 disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          <label className="text-sm font-semibold text-brand-700">
            자기소개
            {shouldGenerateAiDraft && draftLoading && (
              <span className="mt-1 block text-xs font-normal text-brand-400">AI 초안을 불러오는 중이에요…</span>
            )}
            <textarea
              required
              value={introduction}
              onChange={(event) => setIntroduction(event.target.value)}
              disabled={submitting || (shouldGenerateAiDraft && draftLoading)}
              rows={3}
              className="mt-1.5 w-full resize-y rounded-xl border border-brand-100 px-3 py-2.5 text-sm font-normal leading-6 text-brand-900 outline-none focus:border-brand-300"
              placeholder="관련 경험이나 나를 소개해주세요."
            />
          </label>

          <label className="text-sm font-semibold text-brand-700">
            지원 메시지
            {shouldGenerateAiDraft && (
              <>
                <span className="mt-1.5 block rounded-xl bg-blue-50 p-3 text-xs font-normal leading-5 text-blue-600">
                  추천 정보를 바탕으로 AI가 작성한 초안이에요. 내용을 확인하고 자유롭게 수정해주세요.
                </span>
                {draftLoading && (
                  <div className="mt-2 space-y-2 rounded-xl border border-brand-100 p-3" aria-label="지원 문구 초안 생성 중">
                    <div className="h-3 w-full animate-pulse rounded bg-brand-50" />
                    <div className="h-3 w-full animate-pulse rounded bg-brand-50" />
                    <div className="h-3 w-2/3 animate-pulse rounded bg-brand-50" />
                  </div>
                )}
                {draftError && (
                  <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-rose-100 bg-rose-50 p-3">
                    <p role="alert" className="text-xs leading-5 text-rose-600">
                      AI 초안을 불러오지 못했어요. 직접 작성하거나 다시 시도할 수 있어요.
                    </p>
                    <button
                      type="button"
                      onClick={() => void loadDraft()}
                      disabled={draftLoading || submitting}
                      className="shrink-0 text-xs font-semibold text-brand-600 hover:underline disabled:opacity-50"
                    >
                      다시 시도
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => void loadDraft()}
                  disabled={draftLoading || submitting}
                  className="mt-2 text-xs font-semibold text-brand-500 hover:text-brand-700 disabled:opacity-50"
                >
                  {draftLoading ? '초안 생성 중...' : 'AI 초안 다시 생성'}
                </button>
              </>
            )}
            <textarea
              required
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              disabled={submitting || (shouldGenerateAiDraft && draftLoading)}
              rows={4}
              className="mt-1.5 w-full resize-y rounded-xl border border-brand-100 px-3 py-2.5 text-sm font-normal leading-6 text-brand-900 outline-none focus:border-brand-300"
              placeholder="지원 동기와 팀에 전하고 싶은 말을 작성해주세요."
            />
          </label>

          <label className="text-sm font-semibold text-brand-700">
            연락처 <span className="font-normal text-brand-400">(선택)</span>
            <input
              type="tel"
              value={contactNumber}
              onChange={(event) => setContactNumber(event.target.value)}
              disabled={submitting}
              className="mt-1.5 h-11 w-full rounded-xl border border-brand-100 px-3 text-sm font-normal text-brand-900 outline-none focus:border-brand-300"
              placeholder="연락 가능한 전화번호"
            />
          </label>

          <label className="text-sm font-semibold text-brand-700">
            포트폴리오 URL <span className="font-normal text-brand-400">(선택)</span>
            <input
              type="url"
              value={portfolioUrl}
              onChange={(event) => setPortfolioUrl(event.target.value)}
              disabled={submitting}
              className="mt-1.5 h-11 w-full rounded-xl border border-brand-100 px-3 text-sm font-normal text-brand-900 outline-none focus:border-brand-300"
              placeholder="https://"
            />
          </label>

          {error && <p role="alert" className="text-sm text-rose-500">{error}</p>}

          <div className="mt-1 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-brand-200 px-4 py-2.5 text-sm font-semibold text-brand-600 hover:bg-brand-50 disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting || (shouldGenerateAiDraft && draftLoading) || !message.trim()}
              className="rounded-lg bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-wait disabled:opacity-50"
            >
              {submitting ? '제출 중...' : '지원서 제출'}
            </button>
          </div>
        </form>
      </section>
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

const APPLICATION_STATUS: Record<Application['status'], { label: string; className: string }> = {
  PENDING: { label: '검토 대기', className: 'bg-amber-50 text-amber-700' },
  ACCEPTED: { label: '승인됨', className: 'bg-emerald-50 text-emerald-700' },
  APPROVED: { label: '승인됨', className: 'bg-emerald-50 text-emerald-700' },
  REJECTED: { label: '거절됨', className: 'bg-rose-50 text-rose-600' },
}

function ReceivedApplicationsTab({
  teamId,
  isLeader,
  onTeamRefresh,
}: {
  teamId: number
  isLeader: boolean
  onTeamRefresh: () => Promise<void>
}) {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<number | null>(null)

  useEffect(() => {
    let isCurrent = true

    if (!isLeader) {
      setLoading(false)
      return () => {
        isCurrent = false
      }
    }

    setLoading(true)
    setError(null)
    setApplications([])
    getTeamApplications(teamId)
      .then((data) => {
        if (isCurrent) {
          setApplications([...data].sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
        }
      })
      .catch((err: unknown) => {
        if (isCurrent) {
          setError(err instanceof Error ? err.message : '지원서 목록을 불러오지 못했어요.')
        }
      })
      .finally(() => {
        if (isCurrent) setLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [teamId, isLeader])

  async function handleRespond(applicationId: number, isApproved: boolean) {
    setProcessingId(applicationId)
    setError(null)
    try {
      await respondToApplication(applicationId, isApproved)
      setApplications((current) =>
        current.map((application) =>
          application.applicationId === applicationId
            ? { ...application, status: isApproved ? 'APPROVED' : 'REJECTED' }
            : application,
        ),
      )
      if (isApproved) {
        try {
          await onTeamRefresh()
        } catch (err) {
          setError(
            `지원서는 승인됐지만 팀 정보를 새로고침하지 못했어요: ${
              err instanceof Error ? err.message : '다시 시도해 주세요.'
            }`,
          )
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '지원서 처리에 실패했어요.')
    } finally {
      setProcessingId(null)
    }
  }

  if (!isLeader) {
    return (
      <p className="rounded-2xl border border-brand-100 py-16 text-center text-sm text-brand-400">
        팀장만 지원서를 확인할 수 있어요.
      </p>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-36 animate-pulse rounded-2xl bg-brand-50" />
        ))}
      </div>
    )
  }

  if (error && applications.length === 0) {
    return <p className="py-16 text-center text-sm text-rose-500">{error}</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p role="alert" className="text-sm text-rose-500">{error}</p>}
      {applications.length > 0 ? (
        applications.map((application) => {
          const status = APPLICATION_STATUS[application.status]
          const portfolioUrl = getSafeExternalUrl(application.portfolioUrl)

          return (
            <article
              key={application.applicationId}
              className="rounded-2xl border border-brand-100 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold text-brand-900">{application.applicant.name}</h2>
                  <p className="mt-1 text-xs text-brand-400">
                    {[application.applicant.college, application.applicant.major, application.applicant.grade]
                      .filter(Boolean)
                      .join(' · ') || '프로필 정보 없음'}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>
                  {status.label}
                </span>
              </div>

              {application.introduction && (
                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-brand-700">
                  {application.introduction}
                </p>
              )}
              {application.message && (
                <p className="mt-3 whitespace-pre-wrap rounded-xl bg-brand-50 p-3 text-sm leading-6 text-brand-600">
                  {application.message}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-brand-500">
                {application.contactNumber && <span>연락처: {application.contactNumber}</span>}
                {portfolioUrl ? (
                  <a
                    href={portfolioUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-brand-600 underline"
                  >
                    포트폴리오 보기
                  </a>
                ) : application.portfolioUrl ? (
                  <span>포트폴리오: {application.portfolioUrl}</span>
                ) : null}
                <span>{application.createdAt.slice(0, 10).replaceAll('-', '.')} 지원</span>
              </div>

              {application.status === 'PENDING' && (
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    disabled={processingId !== null}
                    onClick={() => handleRespond(application.applicationId, false)}
                    className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-wait disabled:opacity-50"
                  >
                    {processingId === application.applicationId ? '처리 중…' : '거절'}
                  </button>
                  <button
                    type="button"
                    disabled={processingId !== null}
                    onClick={() => handleRespond(application.applicationId, true)}
                    className="rounded-full bg-brand-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-wait disabled:opacity-50"
                  >
                    {processingId === application.applicationId ? '처리 중…' : '승인'}
                  </button>
                </div>
              )}
            </article>
          )
        })
      ) : (
        <p className="rounded-2xl border border-dashed border-brand-100 py-16 text-center text-sm text-brand-400">
          아직 도착한 지원서가 없어요.
        </p>
      )}
    </div>
  )
}

function getSafeExternalUrl(value: string): string | null {
  if (!value) return null

  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null
  } catch {
    return null
  }
}