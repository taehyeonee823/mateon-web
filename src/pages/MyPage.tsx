import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import Footer from '../components/Footer'
import Thermometer from '../components/Thermometer'
import { useAuth } from '../context/AuthContext'
import {
  fetchBookmarkedEventIds,
  getMyApplications,
  getMyTeams,
  getReceivedOffers,
  getReviewableTeamCount,
} from '../api/activity'
import { parsePortfolioSummary } from '../utils/portfolio'
import { getUnivByEmail } from '../utils/univ'

export default function MyPage() {
  const { profile, isLoggedIn, logout } = useAuth()
  const navigate = useNavigate()

  const [applicationCount, setApplicationCount] = useState(0)
  const [myTeamCount, setMyTeamCount] = useState(0)
  const [reviewableTeamCount, setReviewableTeamCount] = useState(0)
  const [bookmarkCount, setBookmarkCount] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)

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

    fetchBookmarkedEventIds()
      .then((ids) => setBookmarkCount(ids.length))
      .catch(() => setBookmarkCount(0))
  }, [isLoggedIn])

  const handleLogout = () => {
    if (!window.confirm('정말 로그아웃 하시겠습니까?')) return
    logout()
    navigate('/')
  }

  const ACTIVITIES = [
    { label: '지원 및 제안', count: applicationCount, icon: '/landing_img/myPage/applyment.svg', isEmoji: false },
    { label: '모집한 팀', count: myTeamCount, icon: '/landing_img/myPage/flagicon.svg', isEmoji: false },
    { label: '북마크', count: bookmarkCount, icon: '/landing_img/myPage/bookmark.svg', isEmoji: false },
    { label: '팀원 평가', count: reviewableTeamCount, icon: '/landing_img/myPage/staricon.svg', isEmoji: false },
  ]

  const SETTINGS = [
    { label: '학교 인증', done: profile?.schoolVerified, path: null },
    { label: '비밀번호 변경', done: false, path: '/pwchange' },
  ]

  if (!isLoggedIn || !profile) {
    return (
      <div className="min-h-screen bg-white">
        <Sidebar />
        <div className="md:pl-60">
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

  return (
    <div className="min-h-screen bg-white">
      <Sidebar />
      <div className="md:pl-60">
        <Topbar />

        <main className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-12 lg:flex-row lg:items-start">
          {/* 왼쪽: 프로필 · 협업온도 · 계정 설정 */}
          <aside className="w-full shrink-0 lg:w-72">
            <div className="rounded-2xl border border-brand-100 p-6">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-brand-50">
                  {profile.profileImageUrl ? (
                    <img
                      src={profile.profileImageUrl}
                      alt=""
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl">🙂</span>
                  )}
                </div>

                <p className="mt-3 text-xl font-bold text-brand-900">{profile.name}</p>
                <p className="mt-0.5 text-sm text-brand-600">
                  {profile.schoolVerified
                    ? `${univ ?? ''} ${profile.major ?? ''} 재학생`
                    : '재학생 인증 필요'}
                </p>
                <p className="mt-0.5 text-xs text-brand-400">
                  희망직무 : {profile.interestJobPrimary ?? '미설정'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/editprofile')}
                className="mt-5 h-11 w-full rounded-xl border border-[#2554F0] text-sm font-semibold text-[#2554F0] transition-colors hover:bg-brand-50"
              >
                회원정보 수정
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-brand-100 p-6">
              <p className="mb-4 text-center text-lg font-bold text-brand-900">협업 온도</p>
              <Thermometer value={profile.collaborationTemperature ?? 0} />
            </div>

            <div className="mt-6">
              <p className="mb-1 text-lg font-bold text-brand-900">계정 설정</p>
              <div className="border-t border-brand-100">
                {SETTINGS.map((setting, index) => (
                  <button
                    type="button"
                    key={setting.label}
                    disabled={!!setting.done}
                    onClick={() =>
                      setting.path ? navigate(setting.path) : window.alert('준비 중인 기능이에요.')
                    }
                    className={`flex w-full items-center justify-between py-4 text-left ${
                      index !== SETTINGS.length - 1 ? 'border-b border-brand-100' : ''
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base text-brand-900">{setting.label}</span>
                      {setting.done && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-sm font-semibold text-emerald-600">
                          인증 완료됨
                        </span>
                      )}
                    </span>
                    {!setting.done && <span className="text-brand-300">›</span>}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center justify-between border-b border-brand-100 py-4 text-left"
                >
                  <span className="text-base text-rose-500">로그아웃</span>
                  <span className="text-brand-300">›</span>
                </button>
              </div>
            </div>
          </aside>

          {/* 오른쪽: 내 활동 · AI 포트폴리오 리포트 */}
          <div className="min-w-0 flex-1">
            <div className="mb-8 overflow-hidden rounded-2xl border border-[#D8E1FD]">
              <div className="flex items-center gap-2 border-b border-[#E8EEFF] bg-[#F5F7FF] p-4">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2554F0]/10 p-1">
                  <img src="/landing_img/myPage/idea.png" alt="" className="h-full w-full object-contain" />
                </span>
                <p className="text-base font-bold text-brand-900">내 활동</p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
                {ACTIVITIES.map((activity) => (
                  <div
                    key={activity.label}
                    className="flex flex-col items-center rounded-xl border border-brand-100 py-5"
                  >
                    {activity.isEmoji ? (
                      <span className="text-xl">{activity.icon}</span>
                    ) : (
                      <img src={activity.icon} alt="" className="h-6 w-6" />
                    )}
                    <span className="mt-2 text-sm font-semibold text-brand-900">
                      {activity.label}
                    </span>
                    <span className="mt-0.5 text-base text-brand-700">{activity.count}건</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#D8E1FD]">
              <div className="flex items-center gap-2 border-b border-[#E8EEFF] bg-[#F5F7FF] p-4">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2554F0]/10 p-1">
                  <img src="/landing_img/myPage/report.png" alt="" className="h-full w-full object-contain" />
                </span>
                <p className="text-base font-bold text-brand-900">AI 포트폴리오 리포트</p>
              </div>

              {profile.portfolio ? (
                <div className="p-5">
                  {summaryText && (
                    <div className="mb-4 rounded-xl border border-brand-100 border-l-4 border-l-[#2554F0] bg-brand-50/50 p-3.5">
                      <p className="mb-1 text-xs font-bold text-[#2554F0]">한 눈에 보는 역량</p>
                      <p className="text-sm leading-5 text-brand-800">{summaryText}</p>
                    </div>
                  )}

                  <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-brand-400">
                    Key Highlights
                  </p>

                  <div className="flex flex-col gap-2.5">
                    {(isExpanded ? bulletPoints : bulletPoints.slice(0, 2)).map((point, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="mt-0.5 text-sm font-bold text-[#2554F0]">•</span>
                        <p className="flex-1 text-sm leading-5 text-brand-700">{point}</p>
                      </div>
                    ))}
                  </div>

                  {bulletPoints.length > 2 && (
                    <button
                      type="button"
                      onClick={() => setIsExpanded((v) => !v)}
                      className="mt-4 flex w-full items-center justify-center gap-1 border-t border-brand-100 pt-3 text-xs font-semibold text-brand-500"
                    >
                      {isExpanded ? '간략히 보기' : `주요 이력 ${bulletPoints.length - 2}개 더보기`}
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => window.alert('웹에서는 아직 지원하지 않아요. 앱에서 업로드해주세요.')}
                  className="flex w-full flex-col items-center justify-center p-6"
                >
                  <span className="mb-1 text-base font-semibold text-[#2554F0]">
                    PDF 포트폴리오 업로드
                  </span>
                  <span className="text-center text-xs text-brand-400">
                    AI가 핵심 경력과 역량을 요약해 한눈에 보여드려요
                  </span>
                </button>
              )}
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  )
}
