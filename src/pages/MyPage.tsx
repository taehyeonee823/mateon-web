import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Topbar from '../components/Topbar'
import Footer from '../components/Footer'
import { ChevronRightIcon } from '../components/icons'
import { useAuth } from '../context/AuthContext'
import {
  getMyApplications,
  getMyTeams,
  getParticipatedActivities,
  getReceivedOffers,
  getReviewableTeamCount,
  type ParticipatedActivity,
} from '../api/activity'
import { fetchBookmarkedEvents, type EventItem } from '../api/event'
import { dDayInfo } from '../utils/dday'
import { parsePortfolioSummary } from '../utils/portfolio'
import { getUnivByEmail } from '../utils/univ'

const VISIBLE_BOOKMARK_COUNT = 3
const DEFAULT_TEMPERATURE = 36.5

// 협업 온도 단계 (min 이상이면 해당 단계)
const TEMPERATURE_LEVELS = [
  { label: '불씨', min: 0, icon: '/landing_img/myPage/smflame.svg', bar: 'bg-[#F5B544]', text: 'text-[#D9822B]' },
  { label: '불꽃', min: 40, icon: '/landing_img/myPage/flame.svg', bar: 'bg-[#EE9240]', text: 'text-[#D9622B]' },
  { label: '모닥불', min: 55, icon: '/landing_img/myPage/bonfire.svg', bar: 'bg-[#E56C3A]', text: 'text-[#D2502A]' },
  { label: '캠프파이어', min: 70, icon: '/landing_img/myPage/campfire.svg', bar: 'bg-[#D94B2B]', text: 'text-[#C93A1F]' },
]

function getTemperatureLevelIndex(temperature: number) {
  return TEMPERATURE_LEVELS.reduce((found, level, index) => (temperature >= level.min ? index : found), 0)
}

export default function MyPage() {
  const { profile, isLoggedIn, logout } = useAuth()
  const navigate = useNavigate()

  const [applicationCount, setApplicationCount] = useState(0)
  const [myTeamCount, setMyTeamCount] = useState(0)
  const [reviewableTeamCount, setReviewableTeamCount] = useState(0)
  const [bookmarks, setBookmarks] = useState<EventItem[]>([])
  const [participatedActivities, setParticipatedActivities] = useState<ParticipatedActivity[]>([])
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const { bulletPoints, summaryText } = parsePortfolioSummary(profile?.portfolio ?? null)
  const univ = getUnivByEmail(profile?.schoolEmail ?? profile?.email)

  useEffect(() => {
    if (!isLoggedIn) return

    Promise.all([getMyApplications().catch(() => []), getReceivedOffers().catch(() => [])]).then(
      ([applications, offers]) => setApplicationCount(applications.length + offers.length),
    )

    getMyTeams()
      .then((data) => setMyTeamCount(data.length))
      .catch(() => setMyTeamCount(0))

    getReviewableTeamCount()
      .then(setReviewableTeamCount)
      .catch(() => setReviewableTeamCount(0))

    // 마감 안 된 북마크 중 마감이 가까운 순으로 보여준다
    fetchBookmarkedEvents({ page: 0, size: 100 })
      .then((events) =>
        setBookmarks(
          events
            .filter((event) => !dDayInfo(event.endDate).closed)
            .sort((a, b) => a.endDate.localeCompare(b.endDate))
            .slice(0, VISIBLE_BOOKMARK_COUNT),
        ),
      )
      .catch(() => setBookmarks([]))

    getParticipatedActivities()
      .then(setParticipatedActivities)
      .catch(() => setParticipatedActivities([]))
  }, [isLoggedIn])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setIsMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    if (!window.confirm('정말 로그아웃 하시겠어요?')) return
    logout()
    navigate('/')
  }

  const handleWithdraw = () => {
    window.alert('아직 준비 중인 기능이에요.')
  }

  if (!isLoggedIn || !profile) {
    return (
      <div className="min-h-screen bg-white">
        <div>
          <Topbar />
          <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
            <p className="text-lg font-semibold text-brand-900">로그인이 필요해요.</p>
            <Link
              to="/login"
              className="rounded-full bg-[#2554F0] px-6 py-3 text-sm font-semibold text-white"
            >
              로그인하러 가기
            </Link>
          </main>
          <Footer />
        </div>
      </div>
    )
  }

  // 시안에서 빠진 내 활동 바로가기와 계정 설정은 톱니바퀴 메뉴로 옮겼다
  const ACTIVITY_MENU = [
    { label: '지원 및 제안', count: applicationCount, path: '/my/applications' },
    { label: '모집한 팀', count: myTeamCount, path: '/my/teams' },
    { label: '팀원 평가', count: reviewableTeamCount, path: '/my/review' },
  ]

  const menuItemClass =
    'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-brand-50/60'

  const temperature = profile.collaborationTemperature ?? DEFAULT_TEMPERATURE
  const levelIndex = getTemperatureLevelIndex(temperature)
  const level = TEMPERATURE_LEVELS[levelIndex]
  const interestJobs = [profile.interestJobPrimary, profile.interestJobSecondary, profile.interestJobTertiary].filter(
    (job): job is string => !!job,
  )
  const affiliation = [profile.college, profile.major, profile.grade].filter(Boolean).join(' · ')

  return (
    <div className="min-h-screen bg-white">
      <div>
        <Topbar />

        <div className="h-28 bg-[#EEF1FD]" />

        <main className="mx-auto flex max-w-[1160px] flex-col gap-12 px-6 pb-24 lg:flex-row lg:items-start lg:gap-28">
          {/* 왼쪽: 프로필 · 관심 직무 · 협업 온도 · 북마크 */}
          <aside className="w-full shrink-0 lg:w-[280px]">
            <div className="-mt-12 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-brand-50 ring-4 ring-white">
              {profile.profileImageUrl ? (
                <img src={profile.profileImageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <img src="/landing_img/myPage/user.svg" alt="" className="h-11 w-11" />
              )}
            </div>

            <h1 className="mt-5 text-2xl font-bold text-black">{profile.name}</h1>
            <p className="mt-2 text-[14px] leading-5 text-black">
              {profile.schoolVerified ? [univ, profile.campus].filter(Boolean).join(' ') : '재학생 인증 필요'}
              {affiliation && (
                <>
                  <br />
                  {affiliation}
                </>
              )}
            </p>

            {profile.tagline && (
              <p className="mt-4 rounded-xl bg-[#F8F8F8] px-4 py-3 text-[13px] text-black">{profile.tagline}</p>
            )}

            <div className="mt-4 flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/editprofile')}
                className="h-10 flex-1 rounded-lg border border-slate-300 text-[13px] font-medium text-black transition-colors hover:bg-slate-50"
              >
                프로필 수정
              </button>

              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen((v) => !v)}
                  aria-label="내 활동 및 계정 설정"
                  aria-expanded={isMenuOpen}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-black transition-colors hover:bg-slate-50"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-4 w-4"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-2.82-1.17l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0-1.17-2.82H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.17-2.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 2.82-1.17V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 2.82 1.17l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0 1.17 2.82H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 top-full z-30 mt-2 w-52 rounded-2xl border border-brand-100 bg-white p-2 shadow-lg shadow-black/10">
                    {ACTIVITY_MENU.map((item) => (
                      <button key={item.path} type="button" onClick={() => navigate(item.path)} className={menuItemClass}>
                        <span className="text-brand-900">{item.label}</span>
                        <span className="text-xs text-brand-500">{item.count}건</span>
                      </button>
                    ))}

                    <div className="my-1 border-t border-brand-100" />

                    <button
                      type="button"
                      disabled={profile.schoolVerified}
                      onClick={() => window.alert('준비 중인 기능이에요.')}
                      className={menuItemClass}
                    >
                      <span className="text-brand-900">학교 인증</span>
                      {profile.schoolVerified && (
                        <span className="text-xs font-semibold text-emerald-600">인증 완료됨</span>
                      )}
                    </button>
                    <button type="button" onClick={() => navigate('/pwchange')} className={menuItemClass}>
                      <span className="text-brand-900">비밀번호 변경</span>
                    </button>
                    <button type="button" onClick={handleLogout} className={menuItemClass}>
                      <span className="text-rose-500">로그아웃</span>
                    </button>
                    <button type="button" onClick={handleWithdraw} className={menuItemClass}>
                      <span className="text-brand-300">회원 탈퇴</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-5">
              <h2 className="text-lg font-bold text-black">관심 직무</h2>
              {interestJobs.length > 0 ? (
                <ol className="mt-3 flex flex-col gap-1">
                  {interestJobs.map((job, index) => (
                    <li
                      key={index}
                      className={`flex items-center gap-3 rounded-full px-2 py-1.5 text-xs font-medium text-black ${
                        index === 0 ? 'bg-[#EEF1FD]' : ''
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                          index === 0 ? 'bg-[#3F4FDB] text-white' : 'border border-slate-200 text-black'
                        }`}
                      >
                        {index + 1}
                      </span>
                      {job}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-3 text-sm text-brand-400">아직 설정하지 않았어요.</p>
              )}
            </div>

            <div className="mt-6">
              <h2 className="text-lg font-bold text-black">협업 온도</h2>
              <div className="mt-3 flex items-center gap-4">
                <img src={level.icon} alt="" className="h-[74px] w-[74px] rounded-2xl" />
                <div>
                  <p className="text-lg font-bold text-black">{level.label}</p>
                  <p className="mt-1 text-xs text-[#6F7095]">
                    {temperature}°C ·{' '}
                    {profile.collaborationReviewCount > 0
                      ? `팀원 평가 ${profile.collaborationReviewCount}회`
                      : '첫 평가를 기다리는 중'}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-4 gap-4">
                {TEMPERATURE_LEVELS.map((item, index) => (
                  <div key={item.label}>
                    <div className={`h-1 rounded-full ${index <= levelIndex ? item.bar : 'bg-[#F1E6D6]'}`} />
                    <p
                      className={`mt-2 whitespace-nowrap text-[10px] font-medium ${
                        index === levelIndex ? item.text : 'text-[#A8A9BD]'
                      }`}
                    >
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-black">북마크</h2>
                <Link to="/my/bookmarks" className="flex items-center gap-1 text-xs font-medium text-black">
                  전체 보기
                  <ChevronRightIcon className="h-3.5 w-3.5" />
                </Link>
              </div>

              {bookmarks.length > 0 ? (
                <ul className="mt-4 flex flex-col gap-5">
                  {bookmarks.map((event) => {
                    const d = dDayInfo(event.endDate)
                    const isExternal = event.category === 'EXTERNAL'
                    return (
                      <li key={event.id}>
                        <Link
                          to={`${isExternal ? '/external' : '/contest'}/${event.id}`}
                          state={{ event }}
                          className="flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-black">{event.title}</p>
                            <div className="mt-1 flex items-center gap-2 text-[11px] text-[#6F7095]">
                              <span
                                className={`shrink-0 rounded-full px-1.5 py-0.5 font-semibold ${
                                  isExternal ? 'bg-emerald-50 text-emerald-600' : 'bg-[#EEF1FD] text-[#3F4FDB]'
                                }`}
                              >
                                {isExternal ? '대외활동' : '공모전'}
                              </span>
                              <span className="truncate">{event.fieldLabel ?? '기타'}</span>
                            </div>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                              d.urgent ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                            }`}
                          >
                            {d.label}
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-brand-400">마감 전인 북마크가 없어요.</p>
              )}
            </div>
          </aside>

          {/* 오른쪽: 포트폴리오 · 주요 경력 · 활동 기록 */}
          <div className="min-w-0 flex-1 lg:pt-10">
            <section>
              <h2 className="text-2xl font-bold text-black">포트폴리오</h2>

              {profile.portfolio ? (
                summaryText && (
                  <div className="mt-6 rounded-2xl bg-[#F7F8FD] p-5">
                    <p className="text-xs font-bold text-[#3F4FDB]">✦ AI 요약</p>
                    <p className="mt-2 text-sm leading-6 text-[#3A3A4A]">{summaryText}</p>
                  </div>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => window.alert('웹에서는 아직 지원하지 않아요. 앱에서 업로드해주세요.')}
                  className="mt-6 flex w-full flex-col items-center justify-center rounded-2xl bg-[#F7F8FD] p-8"
                >
                  <span className="mb-1 text-base font-semibold text-[#2554F0]">PDF 포트폴리오 업로드</span>
                  <span className="text-center text-xs text-brand-400">
                    AI가 핵심 경력과 역량을 요약해 한눈에 보여드려요
                  </span>
                </button>
              )}
            </section>

            {bulletPoints.length > 0 && (
              <section className="mt-12">
                <h2 className="text-2xl font-bold text-black">주요 경력과 성과</h2>
                <ul className="mt-5 divide-y divide-slate-100 border-b border-slate-100">
                  {bulletPoints.map((point, index) => (
                    <li key={index} className="flex items-start gap-4 py-5 first:pt-0">
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#3F4FDB]" />
                      <p className="text-sm leading-6 text-[#2A2A36]">{point}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="mt-12">
              <h2 className="text-2xl font-bold text-black">활동 참여 기록</h2>

              {participatedActivities.length > 0 ? (
                <ol className="mt-6">
                  {participatedActivities.map((activity, index) => (
                    <li key={activity.teamId} className="relative flex items-center justify-between gap-4 pb-8 pl-7 last:pb-0">
                      {index !== participatedActivities.length - 1 && (
                        <span className="absolute bottom-0 left-[6px] top-3.5 w-px bg-slate-200" />
                      )}
                      <span className="absolute left-0 top-1 h-3.5 w-3.5 rounded-full border-[3px] border-[#3F4FDB] bg-white" />
                      <span className="truncate text-sm font-medium text-black">{activity.title}</span>
                      <span
                        className={`mr-12 shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${
                          activity.role === 'LEADER' ? 'bg-red-50 text-red-500' : 'bg-[#EEF1FD] text-[#3F4FDB]'
                        }`}
                      >
                        {activity.role === 'LEADER' ? '팀장' : '팀원'}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-6 text-sm text-brand-400">아직 참여한 활동이 없어요.</p>
              )}
            </section>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  )
}
