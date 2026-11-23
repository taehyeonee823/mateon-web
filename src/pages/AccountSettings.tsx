import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Topbar from '../components/Topbar'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import { profileToUpdatePayload, updateProfile } from '../api/user'
import { getUnivByEmail } from '../utils/univ'

// 알림 설정은 아직 백엔드 API가 없어서 브라우저(localStorage)에 사용자별로 저장한다.
// 서버 저장이 생기면 load/save만 API 호출로 바꾸면 된다.
// (맞춤 추천 설정은 PUT /api/users/me의 matchIncludeProfile / matchIncludePortfolio에 실제로 저장된다)
type NotifySettings = {
  notifyNewApplicant: boolean
  notifyApplicationResult: boolean
  notifyChat: boolean
  notifyTeamReview: boolean
}

const DEFAULT_NOTIFY: NotifySettings = {
  notifyNewApplicant: true,
  notifyApplicationResult: true,
  notifyChat: true,
  notifyTeamReview: true,
}

function storageKey(userId: number) {
  return `mateon:account-settings:${userId}`
}

function loadNotify(userId: number): NotifySettings {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    return raw ? { ...DEFAULT_NOTIFY, ...(JSON.parse(raw) as Partial<NotifySettings>) } : DEFAULT_NOTIFY
  } catch {
    return DEFAULT_NOTIFY
  }
}

function saveNotify(userId: number, settings: NotifySettings) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(settings))
  } catch {
    // 사생활 보호 모드 등에서 저장이 막혀도 화면 동작은 유지한다
  }
}

type MatchKey = 'matchIncludeProfile' | 'matchIncludePortfolio'

const RECOMMEND_ITEMS: { key: MatchKey; title: string; description: string }[] = [
  { key: 'matchIncludeProfile', title: '프로필 정보', description: '학교, 전공, 관심 직무, 한 줄 소개' },
  { key: 'matchIncludePortfolio', title: '포트폴리오', description: '경력과 성과, 요약' },
]

const NOTIFY_ITEMS: { key: keyof NotifySettings; title: string; description: string }[] = [
  { key: 'notifyNewApplicant', title: '새 지원자', description: '내가 모집중인 팀에 누군가가 지원했을 때' },
  { key: 'notifyApplicationResult', title: '지원 결과', description: '내가 지원한 팀이 수락하거나 거절했을 때' },
  { key: 'notifyChat', title: '채팅', description: '채팅에 새 메시지가 왔을 때' },
  { key: 'notifyTeamReview', title: '팀원 평가', description: '활동이 끝난 팀의 팀원 평가 요청이 왔을 때' },
]

function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m5 12 5 5 9-10" />
    </svg>
  )
}

function Switch({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-10 shrink-0 appearance-none rounded-full border-0 p-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4D4DF1] focus-visible:ring-offset-2 disabled:opacity-50 ${
        checked ? 'bg-[#4D4DF1]' : 'bg-[#E1E2EA]'
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="border-b border-[#ECECF2] py-8 first:pt-0 last:border-b-0">
      <h2 className="text-base font-bold text-[#1B1B33]">{title}</h2>
      {description && <p className="mt-1.5 text-xs text-[#8B8CA3]">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  )
}

function InfoRow({ label, value, action }: { label: string; value: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center gap-4 py-3">
      <span className="w-[120px] shrink-0 text-xs text-[#8B8CA3]">{label}</span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#1B1B33]">{value}</span>
      {action}
    </div>
  )
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  title: string
  description: string
  checked: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#1B1B33]">{title}</p>
        <p className="mt-1 text-xs text-[#8B8CA3]">{description}</p>
      </div>
      <Switch checked={checked} onChange={onChange} label={title} disabled={disabled} />
    </div>
  )
}

const smallButtonClass =
  'h-7 shrink-0 rounded-md border border-[#D5D6E0] bg-white px-2.5 text-[11px] font-medium text-[#1B1B33] transition-colors hover:bg-[#F5F5F9]'

export default function AccountSettings() {
  const navigate = useNavigate()
  const { isLoggedIn, profile, logout, refresh } = useAuth()
  const [notify, setNotify] = useState<NotifySettings>(DEFAULT_NOTIFY)
  const [savingMatchKey, setSavingMatchKey] = useState<MatchKey | null>(null)

  useEffect(() => {
    if (profile) setNotify(loadNotify(profile.id))
  }, [profile?.id])

  const updateNotify = (key: keyof NotifySettings, value: boolean) => {
    if (!profile) return
    const next = { ...notify, [key]: value }
    setNotify(next)
    saveNotify(profile.id, next)
  }

  // 맞춤 추천 설정은 서버에 저장한다. 다른 필드가 지워지지 않도록 현재 프로필 전체를 함께 보낸다.
  const updateMatch = async (key: MatchKey, value: boolean) => {
    if (!profile || savingMatchKey) return
    setSavingMatchKey(key)
    try {
      await updateProfile({ ...profileToUpdatePayload(profile), [key]: value })
      await refresh()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : '설정을 저장하지 못했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      setSavingMatchKey(null)
    }
  }

  const handleLogout = () => {
    if (!window.confirm('정말 로그아웃 하시겠어요?')) return
    logout()
    navigate('/')
  }

  const notReady = () => window.alert('아직 준비 중인 기능이에요.')

  if (!isLoggedIn || !profile) {
    return (
      <div className="min-h-screen bg-white">
        <Topbar />
        <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
          <p className="text-lg font-semibold text-brand-900">로그인이 필요해요.</p>
          <Link to="/login" className="rounded-full bg-[#2554F0] px-6 py-3 text-sm font-semibold text-white">
            로그인하러 가기
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  const univ = profile.schoolVerified ? getUnivByEmail(profile.schoolEmail ?? profile.email) : null

  return (
    <div className="min-h-screen bg-white">
      <Topbar />

      <main className="mx-auto w-full max-w-[460px] px-6 pb-24 pt-16">
        <h1 className="text-2xl font-bold text-[#1B1B33]">계정 설정</h1>

        <div className="mt-8">
          <Section title="로그인 정보">
            <InfoRow label="이메일" value={profile.email} />
            <InfoRow
              label="비밀번호"
              value="••••••••"
              action={
                <button type="button" onClick={() => navigate('/pwchange')} className={smallButtonClass}>
                  변경
                </button>
              }
            />
          </Section>

          <Section title="학교 인증">
            {profile.schoolVerified ? (
              <div className="flex items-center gap-3 rounded-lg bg-[#EEF9F1] px-4 py-3.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2DB55D] text-white">
                  <CheckIcon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#1B1B33]">인증 완료</p>
                  <p className="mt-0.5 truncate text-xs text-[#6F7095]">
                    인증된 학교: {univ ?? profile.schoolEmail ?? '-'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={notReady}
                  className="shrink-0 text-xs font-medium text-[#4D4DF1] underline underline-offset-2"
                >
                  다시 인증
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-lg bg-[#F5F5F9] px-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#1B1B33]">아직 인증하지 않았어요</p>
                  <p className="mt-0.5 text-xs text-[#6F7095]">학교 이메일로 재학생 인증을 하면 학교가 프로필에 표시돼요.</p>
                </div>
                <button type="button" onClick={notReady} className={smallButtonClass}>
                  인증하기
                </button>
              </div>
            )}
          </Section>

          <Section title="맞춤 추천" description="팀을 추천받을 때 어떤 정보를 쓸지 골라요">
            {RECOMMEND_ITEMS.map((item) => (
              <ToggleRow
                key={item.key}
                title={item.title}
                description={item.description}
                checked={profile[item.key] ?? true}
                disabled={savingMatchKey !== null}
                onChange={(v) => void updateMatch(item.key, v)}
              />
            ))}
          </Section>

          <Section title="알림">
            {NOTIFY_ITEMS.map((item) => (
              <ToggleRow
                key={item.key}
                title={item.title}
                description={item.description}
                checked={notify[item.key]}
                onChange={(v) => updateNotify(item.key, v)}
              />
            ))}
          </Section>

          <section className="pt-8">
            <button type="button" onClick={handleLogout} className="text-base font-bold text-[#1B1B33] hover:underline">
              로그아웃
            </button>
            <div className="mt-6">
              <button type="button" onClick={notReady} className="text-xs text-[#8B8CA3] underline underline-offset-2 hover:text-[#6F7095]">
                회원 탈퇴
              </button>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
