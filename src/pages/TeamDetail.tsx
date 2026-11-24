import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import Topbar from '../components/Topbar'
import Footer from '../components/Footer'
import { draftProposalForTeam } from '../api/proposal'
import { createOrGetDmRoom } from '../api/chat'
import { getPublicUserProfile, type PublicUserProfile } from '../api/user'
import {
  getTeamApplications,
  getTeamDetail,
  respondToApplication,
  submitTeamApplication,
  type TeamApplicationRequest,
} from '../api/team'
import type { Application, TeamDetail as TeamDetailType, TeamMember } from '../types/team'
import Teammates, { OfferManagement } from '../components/Teammates'
import { useAuth } from '../context/AuthContext'
import {
  DEFAULT_TEMPERATURE,
  getTemperatureLevelIndex,
  TEMPERATURE_LEVELS,
} from '../utils/collaborationTemperature'

const TABS = [
  { key: 'info', label: '팀 정보' },
  { key: 'members', label: '지원자 관리' },
  { key: 'roles', label: '팀원 모으기' },
  { key: 'offer', label: '제안 관리' },
] as const

type TabKey = (typeof TABS)[number]['key']

const PROFILE_ROLE_LABELS: Record<string, string> = {
  BE: '백엔드',
  FE: '프론트엔드',
  PM: '기획/PM',
  DESIGN: '디자인',
  DATA: '데이터',
  AI: 'AI/ML',
}

const PROFILE_EXPERIENCE_LABELS: Record<string, string> = {
  beginner: '입문',
  intermediate: '중급',
  advanced: '숙련',
}
const MAX_PROFILE_SKILLS = 6

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
  const [isSubmittedModalOpen, setIsSubmittedModalOpen] = useState(false)
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
        <div>
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
        <div>
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
    <div className={`min-h-screen ${team.leader ? 'bg-white' : 'bg-[#F7F8FA]'}`}>
      <div>
        <Topbar />

        {team.leader ? (
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
        ) : (
          <ApplicantTeamView
            team={team}
            onApply={() => setIsApplicationModalOpen(true)}
          />
        )}

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
            setIsSubmittedModalOpen(true)
          }}
        />
      )}
      {isSubmittedModalOpen && (
        <ApplicationSubmittedModal onClose={() => setIsSubmittedModalOpen(false)} />
      )}
    </div>
  )
}

// 지원 완료 안내 모달. PrivacyConsentModal과 같은 오버레이·카드·버튼 스타일을 쓴다.
function ApplicationSubmittedModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="application-submitted-title"
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        <header className="px-6 pb-4 pt-6">
          <h2 id="application-submitted-title" className="text-xl font-bold text-brand-900">
            지원이 완료되었어요
          </h2>
          <p className="mt-1 text-sm text-[#6F7095]">
            팀장이 지원서를 검토하면 결과를 알려드릴게요.
          </p>
        </header>

        <footer className="px-6 pb-6 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="h-14 w-full rounded-xl bg-[#2554F0] text-lg font-semibold text-white transition-opacity hover:opacity-90"
          >
            확인
          </button>
        </footer>
      </section>
    </div>
  )
}

// 숫자만 남기고 010-1234-5678 형태로 하이픈을 자동으로 넣는다 (최대 11자리)
function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length < 4) return digits
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
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

    if (contactNumber.replace(/\D/g, '').length !== 11) {
      setError('전화번호를 정확히 입력해주세요. (숫자 11자리)')
      return
    }

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
            자기소개  <span className="text-rose-500">*</span>
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
            지원 메시지 <span className="text-rose-500">*</span>
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
            연락처 <span className="text-rose-500">*</span>
            <input
              type="tel"
              required
              pattern="\d{3}-\d{4}-\d{4}"
              title="전화번호를 정확히 입력해주세요. (예: 010-1234-5678)"
              value={contactNumber}
              onChange={(event) => setContactNumber(formatPhoneNumber(event.target.value))}
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
              disabled={submitting || (shouldGenerateAiDraft && draftLoading)}
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

function ApplicantTeamView({
  team,
  onApply,
}: {
  team: TeamDetailType
  onApply: () => void
}) {
  const [profiles, setProfiles] = useState<Record<number, PublicUserProfile>>({})
  const [profileLoading, setProfileLoading] = useState<Record<number, boolean>>({})
  const [profileErrors, setProfileErrors] = useState<Record<number, string>>({})
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [isProfilePanelOpen, setIsProfilePanelOpen] = useState(false)
  const leader = team.members.find((member) => member.isLeader)
  const leaderName = leader?.name || team.leaderName
  const leaderProfile = profiles[team.leaderId]

  const loadPublicProfile = useCallback(async (userId: number) => {
    setProfileLoading((current) => ({ ...current, [userId]: true }))
    setProfileErrors((current) => {
      const next = { ...current }
      delete next[userId]
      return next
    })
    try {
      const publicProfile = await getPublicUserProfile(userId)
      setProfiles((current) => ({ ...current, [userId]: publicProfile }))
    } catch (error) {
      console.error(`사용자 ${userId}의 공개 프로필 조회 실패:`, error)
      setProfileErrors((current) => ({
        ...current,
        [userId]: error instanceof Error ? error.message : '프로필을 불러오지 못했어요.',
      }))
    } finally {
      setProfileLoading((current) => ({ ...current, [userId]: false }))
    }
  }, [])

  useEffect(() => {
    const userIds = new Set([team.leaderId, ...team.members.map((member) => member.userId)])
    userIds.forEach((userId) => void loadPublicProfile(userId))
  }, [team.leaderId, team.members, loadPublicProfile])

  useEffect(() => {
    if (isProfilePanelOpen || !selectedMember) return
    const timeout = window.setTimeout(() => setSelectedMember(null), 350)
    return () => window.clearTimeout(timeout)
  }, [isProfilePanelOpen, selectedMember])

  const openMemberProfile = (member: TeamMember) => {
    setSelectedMember(member)
    setIsProfilePanelOpen(true)
  }

  const closeMemberProfile = () => setIsProfilePanelOpen(false)

  const applicationLabel = team.hasApplied
    ? team.myApplicationStatus === 'APPROVED' || team.myApplicationStatus === 'ACCEPTED'
      ? '합류 완료'
      : team.myApplicationStatus === 'REJECTED'
        ? '지원 거절됨'
        : '지원 완료'
    : team.recruiting
      ? '지원하기'
      : '모집이 마감됐어요'

  return (
    <>
      <header className="bg-white">
        <div className="mx-auto flex max-w-[1080px] items-center gap-4 px-6 py-8 sm:py-10">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#EEF0FC] text-xl font-bold text-[#45465C]">
            {team.title.slice(0, 1) || '팀'}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-[#1B1B33] sm:text-2xl">{team.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#6F7095] sm:text-sm">
              {team.connectedActivityTitle && (
                <>
                  <span className="rounded-full bg-[#EEF0FC] px-2 py-1 text-[11px] font-medium text-[#4D4DF1]">
                    활동
                  </span>
                  <span className="max-w-full truncate text-[#1B1B33]">
                    {team.connectedActivityTitle}
                  </span>
                  <span className="mx-1 hidden h-4 w-px bg-[#E1E2EA] sm:block" />
                </>
              )}
              <span>팀장</span>
              <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E1E2EA] text-[10px] font-semibold text-[#6F7095]">
                {leaderProfile?.profileImageUrl ? (
                  <img src={leaderProfile.profileImageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  leaderName.slice(0, 1) || '팀'
                )}
              </span>
              <span className="font-medium text-[#1B1B33]">{leaderName}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1080px] gap-6 px-6 py-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8">
        <section className="min-w-0 rounded-2xl bg-white p-6 sm:p-8">
          <div>
            <h2 className="text-base font-bold text-[#1B1B33]">팀 소개</h2>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#45465C]">
              {team.promotionText || '등록된 팀 소개가 없어요.'}
            </p>
          </div>

          <div className="mt-8">
            <h2 className="text-base font-bold text-[#1B1B33]">팀 분위기</h2>
            <p className="mt-3 whitespace-pre-wrap border-l-2 border-[#4D4DF1] pl-3 text-sm leading-6 text-[#45465C]">
              {team.characteristic || '아직 등록된 팀 분위기가 없어요.'}
            </p>
          </div>

          <div className="mt-8 border-t border-[#ECECF2] pt-6">
            <h2 className="text-base font-bold text-[#1B1B33]">모집 포지션</h2>
            {team.role.length > 0 ? (
              <ul className="mt-3">
                {team.role.map((role) => (
                  <li
                    key={role}
                    className="flex items-center gap-3 border-b border-[#ECECF2] py-3 text-sm font-medium text-[#1B1B33] last:border-b-0"
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#4D4DF1]" />
                    {role}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-[#8B8CA3]">모집 포지션이 등록되지 않았어요.</p>
            )}
          </div>

          {team.requiredSkills.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs text-[#6F7095]">있으면 좋아요</span>
              {team.requiredSkills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-[#F0F0F3] px-2.5 py-1 text-xs font-medium text-[#45465C]"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </section>

        <aside className="flex flex-col gap-6">
          <section className="rounded-xl border-2 border-[#168BFF] bg-white p-5">
            <h2 className="text-base font-bold text-[#1B1B33]">모집 기간</h2>
            <dl className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-4 text-xs">
                <dt className="text-[#8B8CA3]">시작일</dt>
                <dd className="font-medium text-[#45465C]">
                  {team.recruitmentStartDate.replaceAll('-', '.')}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 text-xs">
                <dt className="text-[#8B8CA3]">마감일</dt>
                <dd className="font-medium text-[#45465C]">
                  {team.recruitmentEndDate.replaceAll('-', '.')}
                </dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={onApply}
              disabled={!team.recruiting || team.hasApplied}
              className="mt-5 h-11 w-full rounded-lg bg-[#4146E8] text-sm font-semibold text-white transition-colors hover:bg-[#3439CF] disabled:cursor-not-allowed disabled:bg-[#D9DAE2] disabled:text-[#77788D]"
            >
              {applicationLabel}
            </button>
          </section>

          <section className="rounded-xl border border-[#E8E8EF] bg-white p-5">
            <h2 className="text-base font-bold text-[#1B1B33]">
              함께하는 사람
              <span className="ml-1.5 text-sm font-normal text-[#8B8CA3]">
                {team.currentMemberCount}/{team.capacity}
              </span>
            </h2>
            <ul className="mt-3 divide-y divide-[#F0F0F5]">
              {team.members.map((member) => (
                <li key={member.userId}>
                  <button
                    type="button"
                    onClick={() => openMemberProfile(member)}
                    aria-label={`${member.name} 프로필 보기`}
                    className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-[#F8F8FB]"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E1E2EA] text-sm font-semibold text-[#6F7095]">
                      {profiles[member.userId]?.profileImageUrl ? (
                        <img
                          src={profiles[member.userId].profileImageUrl ?? undefined}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        member.name.slice(0, 1) || '팀'
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-semibold text-[#1B1B33]">
                          {member.name}
                        </span>
                        {member.isLeader && (
                          <span className="rounded bg-[#EEF0FC] px-1 py-0.5 text-[10px] font-medium text-[#4D4DF1]">
                            팀장
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-[#8B8CA3]">
                        {member.major || '전공 정보 없음'}
                      </span>
                    </span>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 shrink-0 text-[#6F7095]"
                      aria-hidden="true"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
            {team.recruiting && team.currentMemberCount < team.capacity && (
              <div className="flex items-center gap-3 border-t border-[#F0F0F5] py-3">
                <span className="h-10 w-10 shrink-0 rounded-full border border-dashed border-[#D5D6E0]" />
                <span className="text-xs text-[#A3A4B8]">함께할 팀원을 찾고 있어요</span>
              </div>
            )}
          </section>
        </aside>
      </main>
      {selectedMember && (
        <TeamMemberProfileDrawer
          member={selectedMember}
          team={team}
          profile={profiles[selectedMember.userId] ?? null}
          isLoading={profileLoading[selectedMember.userId] ?? false}
          error={profileErrors[selectedMember.userId] ?? null}
          open={isProfilePanelOpen}
          onRetry={() => void loadPublicProfile(selectedMember.userId)}
          onClose={closeMemberProfile}
        />
      )}
    </>
  )
}

function TeamMemberProfileDrawer({
  member,
  team,
  profile,
  isLoading,
  error,
  open,
  onRetry,
  onClose,
}: {
  member: TeamMember
  team: TeamDetailType
  profile: PublicUserProfile | null
  isLoading: boolean
  error: string | null
  open: boolean
  onRetry: () => void
  onClose: () => void
}) {
  const navigate = useNavigate()
  const { profile: currentProfile } = useAuth()
  const [visible, setVisible] = useState(false)
  const [isStartingChat, setIsStartingChat] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const isCurrentUser = currentProfile?.id === member.userId
  const affiliation = [
    profile?.school ?? (member.isLeader ? team.leaderCollege : null),
    profile?.campus,
    profile?.college,
    profile?.major ?? member.major,
    profile?.grade ?? (member.isLeader ? team.leaderGrade : null),
  ].filter(Boolean).join(' · ')
  const desiredRoles = profile?.desiredRoles ?? []
  const skills = profile?.skills ?? []
  const visibleSkills = skills.slice(0, MAX_PROFILE_SKILLS)
  const hiddenSkillCount = skills.length - visibleSkills.length
  const interestJobs = [
    profile?.interestJobPrimary,
    profile?.interestJobSecondary,
    profile?.interestJobTertiary,
  ].filter((job): job is string => Boolean(job))
  const participatedActivities = profile?.participatedActivities ?? []
  const experienceLabel = profile?.experienceLevel
    ? PROFILE_EXPERIENCE_LABELS[profile.experienceLevel.toLowerCase()] ?? profile.experienceLevel
    : null
  const portfolioUrl = profile?.portfolio ? getSafeExternalUrl(profile.portfolio) : null
  const temperature = profile?.collaborationTemperature ?? DEFAULT_TEMPERATURE
  const temperatureLevelIndex = getTemperatureLevelIndex(temperature)
  const temperatureLevel = TEMPERATURE_LEVELS[temperatureLevelIndex]

  useEffect(() => {
    if (!open) {
      setVisible(false)
      return
    }

    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, open])

  const handleStartChat = async () => {
    if (isStartingChat || isCurrentUser) return
    setIsStartingChat(true)
    setChatError(null)
    try {
      const room = await createOrGetDmRoom(member.userId)
      navigate('/chat', { state: { roomId: room.roomId } })
      onClose()
    } catch (error) {
      setChatError(error instanceof Error ? error.message : '대화방을 열지 못했어요.')
    } finally {
      setIsStartingChat(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        aria-label="프로필 패널 닫기"
        onClick={onClose}
        className={`absolute inset-0 h-full w-full bg-black/30 transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`${member.name} 프로필`}
        onClick={(event) => event.stopPropagation()}
        className={`absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          visible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-[#ECECF2] px-6">
          <h2 className="text-base font-bold text-[#1B1B33]">프로필</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="프로필 패널 닫기"
            className="flex h-9 w-9 items-center justify-center rounded-full text-2xl text-[#6F7095] transition-colors hover:bg-[#F5F5F9]"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-[#E1E2EA] text-3xl font-semibold text-[#6F7095]">
              {profile?.profileImageUrl ? (
                <img
                  src={profile.profileImageUrl}
                  alt={`${profile.name} 프로필`}
                  className="h-full w-full object-cover"
                />
              ) : (
                (profile?.name || member.name).slice(0, 1) || '팀'
              )}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <h3 className="text-xl font-bold text-[#1B1B33]">{profile?.name || member.name}</h3>
              {member.isLeader && (
                <span className="rounded-md bg-[#EEF0FC] px-2 py-1 text-xs font-semibold text-[#4D4DF1]">
                  팀장
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-[#6F7095]">
              {affiliation || '등록된 소속 정보가 없어요.'}
            </p>
            {profile?.schoolVerified && (
              <span className="mt-2 rounded-full bg-[#EEF9F1] px-2.5 py-1 text-xs font-medium text-[#2B8A4B]">
                학교 인증
              </span>
            )}
          </div>

          {profile?.tagline && (
            <p className="mt-6 rounded-xl border border-[#E8E8EF] bg-[#FAFAFD] px-4 py-3 text-sm italic leading-6 text-[#45465C]">
              {profile.tagline}
            </p>
          )}

          {isLoading && (
            <p className="mt-6 text-sm text-[#8B8CA3]">프로필 정보를 불러오는 중이에요.</p>
          )}
          {error && (
            <div className="mt-6 rounded-lg bg-[#FFF5F5] p-3">
              <p role="alert" className="text-sm text-rose-600">
                프로필 정보를 불러오지 못했어요.
              </p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-2 text-xs font-semibold text-[#4D4DF1] hover:underline"
              >
                다시 시도
              </button>
            </div>
          )}

          {profile && (
            <div className="mt-8 space-y-4 border-t border-[#ECECF2] pt-6">
              {(desiredRoles.length > 0 || experienceLabel || profile.activityStyle) && (
                <section className="rounded-xl bg-[#F7F8FC] p-4">
                  <h4 className="text-sm font-bold text-[#1B1B33]">활동 성향</h4>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {desiredRoles.map((role) => (
                      <span
                        key={role}
                        className="rounded-md bg-[#EEF0FC] px-2.5 py-1 text-xs font-medium text-[#4D4DF1]"
                      >
                        {PROFILE_ROLE_LABELS[role.toUpperCase()] ?? role}
                      </span>
                    ))}
                    {experienceLabel && (
                      <span className="rounded-md border border-[#E1E2EA] px-2.5 py-1 text-xs text-[#6F7095]">
                        {experienceLabel}
                      </span>
                    )}
                    {profile.activityStyle && (
                      <span className="rounded-md border border-[#E1E2EA] px-2.5 py-1 text-xs text-[#6F7095]">
                        {profile.activityStyle}
                      </span>
                    )}
                  </div>
                </section>
              )}

              {skills.length > 0 && (
                <section className="rounded-xl border border-[#ECECF2] p-4">
                  <h4 className="text-sm font-bold text-[#1B1B33]">보유 스킬</h4>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {visibleSkills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-[#F0F0F3] px-3 py-1.5 text-xs font-medium text-[#45465C]"
                      >
                        {skill}
                      </span>
                    ))}
                    {hiddenSkillCount > 0 && (
                      <span className="rounded-full bg-[#EEF0FC] px-3 py-1.5 text-xs font-semibold text-[#4D4DF1]">
                        +{hiddenSkillCount}
                      </span>
                    )}
                  </div>
                </section>
              )}

              {interestJobs.length > 0 && (
                <section className="rounded-xl border border-[#ECECF2] p-4">
                  <h4 className="text-sm font-bold text-[#1B1B33]">관심 직무</h4>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {interestJobs.map((job, index) => (
                      <span
                        key={`${job}-${index}`}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                          index === 0
                            ? 'bg-[#EEF0FC] text-[#4D4DF1]'
                            : 'bg-[#F5F5F8] text-[#6F7095]'
                        }`}
                      >
                        {job}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              <section className="rounded-xl bg-[#FFF8F1] p-4">
                <div className="flex items-center gap-3">
                  <img
                    src={temperatureLevel.icon}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-xl"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-[#9A705B]">협업 온도</p>
                    <div className="mt-1 flex items-baseline justify-between gap-2">
                      <p className={`text-base font-bold ${temperatureLevel.text}`}>
                        {temperatureLevel.label}
                      </p>
                      <p className="text-sm font-semibold text-[#45465C]">
                        {temperature.toFixed(1)}°C
                      </p>
                    </div>
                    <p className="mt-1 text-[11px] text-[#9A8B83]">
                      {profile.collaborationReviewCount > 0
                        ? `팀원 평가 ${profile.collaborationReviewCount}회`
                        : '첫 평가를 기다리는 중'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {TEMPERATURE_LEVELS.map((level, index) => (
                    <div key={level.label}>
                      <div
                        className={`h-1 rounded-full ${
                          index <= temperatureLevelIndex ? level.bar : 'bg-[#F1E6D6]'
                        }`}
                      />
                      <p
                        className={`mt-1.5 whitespace-nowrap text-[9px] font-medium ${
                          index === temperatureLevelIndex ? level.text : 'text-[#A8A9BD]'
                        }`}
                      >
                        {level.label}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {portfolioUrl && (
                <section className="rounded-xl border border-[#ECECF2] p-4">
                  <h4 className="text-sm font-bold text-[#1B1B33]">포트폴리오</h4>
                  <a
                    href={portfolioUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block truncate text-sm font-medium text-[#4D4DF1] hover:underline"
                  >
                    {profile.portfolio}
                  </a>
                </section>
              )}

              {participatedActivities.length > 0 && (
                <section className="rounded-xl border border-[#ECECF2] p-4">
                  <h4 className="text-sm font-bold text-[#1B1B33]">활동 참여 기록</h4>
                  <ol className="mt-4">
                    {participatedActivities.map((activity, index) => (
                      <li
                        key={`${activity.id}-${activity.title}`}
                        className="relative flex items-center justify-between gap-3 pb-5 pl-6 last:pb-0"
                      >
                        {index !== participatedActivities.length - 1 && (
                          <span className="absolute bottom-0 left-[6px] top-3.5 w-px bg-slate-200" />
                        )}
                        <span className="absolute left-0 top-1 h-3.5 w-3.5 rounded-full border-[3px] border-[#3F4FDB] bg-white" />
                        <span className="min-w-0 truncate text-sm font-medium text-[#45465C]">
                          {activity.title}
                        </span>
                        <span className="shrink-0 rounded-full bg-[#EEF1FD] px-2 py-1 text-[11px] font-semibold text-[#3F4FDB]">
                          {activity.category}
                        </span>
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </div>
          )}
        </div>

        <footer className="shrink-0 border-t border-[#ECECF2] px-6 py-5">
          {chatError && (
            <p role="alert" className="mb-3 text-sm text-rose-600">
              {chatError}
            </p>
          )}
          <button
            type="button"
            onClick={() => void handleStartChat()}
            disabled={isStartingChat || isCurrentUser}
            className="h-12 w-full rounded-lg bg-[#4146E8] text-sm font-semibold text-white transition-colors hover:bg-[#3439CF] disabled:cursor-not-allowed disabled:bg-[#D9DAE2] disabled:text-[#77788D]"
          >
            {isCurrentUser ? '내 프로필' : isStartingChat ? '대화방 여는 중...' : '1:1 대화하기'}
          </button>
        </footer>
      </aside>
    </div>
  )
}

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