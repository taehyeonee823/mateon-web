import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ChatIcon } from './icons'
import NotificationRow from './NotificationRow'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/Notifications'
import { useSidePanel } from '../context/SidePanel'

const NAV_TABS = [
  { label: '공모전', path: '/contest' },
  { label: '대외활동', path: '/external' },
  { label: '팀 빌딩', path: '/teams', match: '/teams' },
]

function MenuIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className={className} aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

function CloseIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className={className} aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

const DRAWER_MS = 350
const DRAWER_EASING = 'ease-[cubic-bezier(0.16,1,0.3,1)]'

// 오른쪽에서 슬라이드되는 드로어의 열림/표시 상태.
// 마운트 직후 바로 상태를 바꾸면 브라우저가 시작 위치(translate-x-full)를
// 페인트하기 전에 최종 위치로 넘어가버려 트랜지션이 씹힐 수 있다.
// rAF를 두 번 중첩해 한 프레임을 확실히 그리게 한 뒤 전환을 건다.
function useSlideDrawer() {
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    let frame2 = 0
    const frame1 = requestAnimationFrame(() => {
      frame2 = requestAnimationFrame(() => setIsVisible(true))
    })
    return () => {
      cancelAnimationFrame(frame1)
      cancelAnimationFrame(frame2)
    }
  }, [isOpen])

  const open = () => setIsOpen(true)
  const close = () => {
    setIsVisible(false)
    setTimeout(() => setIsOpen(false), DRAWER_MS)
  }

  return { isOpen, isVisible, open, close }
}

// transparent: 랜딩처럼 페이지 배경(빛번짐)이 탑바 뒤까지 이어져 보여야 할 때 켠다.
export default function Topbar({ transparent = false }: { transparent?: boolean } = {}) {
  const { isLoggedIn, profile, logout } = useAuth()
  const { active: activePanel, open: openPanel, toggle: togglePanel } = useSidePanel()
  const { grouped: groupedNotifications, hasUnread } = useNotifications()
  const navigate = useNavigate()
  const location = useLocation()

  const [isBellHovered, setIsBellHovered] = useState(false)
  // 폰/태블릿 폭에서 탑바 우측 기능을 모아 보여주는 메뉴 드로어
  const menuDrawer = useSlideDrawer()

  const previewNotifications = groupedNotifications.slice(0, 3)
  const isChatPanelOpen = activePanel === 'chat'
  const isNotificationPanelOpen = activePanel === 'notifications'

  // 페이지를 이동하면 메뉴는 닫는다.
  useEffect(() => {
    if (menuDrawer.isOpen) menuDrawer.close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  // 드로어가 떠 있는 동안은 뒤 배경 스크롤을 잠가서 스크롤이 따로 놀게 한다.
  useEffect(() => {
    if (!menuDrawer.isOpen) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [menuDrawer.isOpen])

  const handleLogout = () => {
    const message = profile ? `${profile.name}님 로그아웃 하시겠어요?` : '로그아웃 하시겠어요?'
    if (!window.confirm(message)) return
    logout()
    navigate('/')
  }

  const handleNotificationClick = () => {
    setIsBellHovered(false)
    if (menuDrawer.isOpen) menuDrawer.close()
    if (isLoggedIn) togglePanel('notifications')
    else navigate('/login')
  }

  const handleChatClick = () => {
    if (menuDrawer.isOpen) menuDrawer.close()
    if (isLoggedIn) togglePanel('chat')
    else navigate('/login')
  }

  const profileAvatar = profile?.profileImageUrl ? (
    <img src={profile.profileImageUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
  ) : (
    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100">
      <img src="/landing_img/myPage/user.svg" alt="" className="h-5 w-5" />
    </span>
  )

  const iconButtonClass = (active: boolean) =>
    `relative flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
      active ? 'bg-brand-50 text-[#3F4FDB]' : 'text-black hover:bg-brand-50'
    }`

  const menuItemClass =
    'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[15px] font-semibold text-brand-900 transition-colors hover:bg-brand-50/60'

  return (
    <>
    {/* @container: 뷰포트가 아니라 헤더 자신의 폭 기준으로 단계가 바뀐다 (채팅/알림 패널이 열려 좁아져도 대응) */}
    <header className={`@container border-b ${transparent ? 'border-transparent bg-transparent' : 'border-slate-100 bg-white'}`}>
    <div className="mx-auto flex h-[72px] max-w-[1160px] items-center justify-between gap-4 px-4 sm:px-6 @tablet:gap-6">
      <div className="flex h-full min-w-0 items-center gap-4 @tablet:gap-6 @desktop:gap-10">
        <Link to="/" aria-label="MateOn 홈" className="flex shrink-0 items-center">
          <img src="/landing_img/logo.svg" alt="" className="h-8 w-auto" />
        </Link>

        {/* 메인 탭은 로그인한 사용자에게만 노출 */}
        {isLoggedIn && (
          <nav className="flex h-full items-center gap-3 text-sm @tablet:gap-5 @tablet:text-base @desktop:gap-8">
            {NAV_TABS.map((tab) => {
              const active = location.pathname.startsWith(tab.match ?? tab.path)
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  aria-current={active ? 'page' : undefined}
                  className={`flex h-full items-center whitespace-nowrap border-b-2 px-1 font-semibold transition-colors ${
                    active ? 'border-[#3F4FDB] text-[#3F4FDB]' : 'border-transparent text-black hover:text-[#3F4FDB]'
                  }`}
                >
                  {tab.label}
                </Link>
              )
            })}
          </nav>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2 @tablet:gap-3 @desktop:gap-6">
        {/* 알림 — 폰 폭에서는 로그인했을 때만 노출. 누르면 오른쪽 알림 패널이 열린다 */}
        {isLoggedIn && (
        <div
          className="relative shrink-0"
          onMouseEnter={() => setIsBellHovered(true)}
          onMouseLeave={() => setIsBellHovered(false)}
        >
          <button
            type="button"
            aria-label="알림"
            aria-pressed={isNotificationPanelOpen}
            onClick={handleNotificationClick}
            className={iconButtonClass(isNotificationPanelOpen)}
          >
            <img src="/noti/notification_line.svg" alt="" className="h-6 w-6" />
            {hasUnread && (
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-500" />
            )}
          </button>

          {/* 마우스 올렸을 때 최근 3개 미리보기 (패널이 열려 있으면 생략) */}
          {isBellHovered && isLoggedIn && !isNotificationPanelOpen && (
            <div className="absolute right-0 top-full z-50 hidden w-80 rounded-2xl border border-brand-100 bg-white p-2 shadow-lg shadow-black/10 @tablet:block">
              {previewNotifications.length > 0 ? (
                previewNotifications.map((n) => (
                  <div
                    key={n.id}
                    className="flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-left hover:bg-brand-50/60"
                  >
                    <NotificationRow notification={n} iconSize="h-7 w-7" />
                  </div>
                ))
              ) : (
                <p className="px-3 py-4 text-center text-sm text-brand-400">알림이 없어요.</p>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsBellHovered(false)
                  openPanel('notifications')
                }}
                className="mt-1 w-full rounded-xl py-2.5 text-center text-sm font-semibold text-brand-500 transition-colors hover:bg-brand-50/60"
              >
                전체 보기
              </button>
            </div>
          )}
        </div>
        )}

        {/* 태블릿 이상: 채팅 */}
        {isLoggedIn && <button
          type="button"
          onClick={handleChatClick}
          aria-label="채팅"
          aria-pressed={isChatPanelOpen}
          className={`hidden @tablet:flex ${iconButtonClass(isChatPanelOpen)}`}
        >
          <ChatIcon className="h-6 w-6" />
        </button>}

        {/* 로그인 사용자는 PC에서 계정 정보, 비로그인 사용자는 모든 폭에서 로그인·가입 */}
        <div
          className={`${
            isLoggedIn ? 'hidden @desktop:flex' : 'flex'
          } items-center gap-2 @desktop:gap-6`}
        >
          {isLoggedIn && profile ? (
            <>
              <Link to="/my" aria-label="마이페이지" className="flex shrink-0 items-center gap-2 rounded-full transition-opacity hover:opacity-80">
                {profileAvatar}
                <span className="text-base font-semibold text-black">{profile.name}</span>
              </Link>

              {/* 바로 로그아웃할 수 있는 버튼 */}
              <button
                type="button"
                onClick={handleLogout}
                className="flex shrink-0 items-center rounded-full bg-gray-200 px-4 py-2 text-sm font-semibold text-brand-900 transition-colors hover:bg-brand-500 hover:text-white"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="flex shrink-0 items-center gap-2 rounded-full bg-gray-200 px-3 py-2 text-xs font-semibold text-brand-900 transition-colors hover:bg-brand-500 hover:text-white @desktop:px-4 @desktop:text-sm"
              >
                로그인
              </Link>

              <Link
                to="/signup"
                className="flex shrink-0 items-center gap-2 rounded-full bg-[#4D4DF1] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#3D3DD9] @desktop:px-4 @desktop:text-sm"
              >
                무료로 시작하기
              </Link>
            </>
          )}
        </div>

        {/* PC 미만: 메뉴 버튼 */}
        <button
          type="button"
          onClick={menuDrawer.open}
          aria-label="메뉴 열기"
          aria-expanded={menuDrawer.isOpen}
          className="flex h-10 w-10 items-center justify-center rounded-full text-black transition-colors hover:bg-brand-50 @desktop:hidden"
        >
          <MenuIcon className="h-6 w-6" />
        </button>
      </div>
    </div>
    </header>

    {/* 메뉴 드로어는 position: fixed라 @container(containment) 바깥에 둔다 */}
    {menuDrawer.isOpen && (
      <>
        <div
          className={`fixed inset-0 z-[60] bg-black/20 transition-opacity duration-[350ms] ${DRAWER_EASING} ${
            menuDrawer.isVisible ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={menuDrawer.close}
        />
        <div
          className={`fixed inset-y-0 right-0 z-[70] flex w-[min(100vw-3rem,320px)] flex-col bg-white shadow-xl shadow-black/10 transition-transform duration-[350ms] ${DRAWER_EASING} will-change-transform ${
            menuDrawer.isVisible ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex h-[72px] items-center justify-between border-b border-brand-100 px-5">
            {isLoggedIn && profile ? (
              <Link to="/my" className="flex min-w-0 items-center gap-3" onClick={menuDrawer.close}>
                {profileAvatar}
                <span className="min-w-0">
                  <span className="block truncate text-base font-bold text-brand-900">{profile.name}</span>
                  <span className="block text-xs text-brand-400">마이페이지</span>
                </span>
              </Link>
            ) : (
              <p className="text-base font-bold text-brand-900">메뉴</p>
            )}
            <button
              type="button"
              aria-label="메뉴 닫기"
              onClick={menuDrawer.close}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-brand-400 transition-colors hover:bg-brand-50 hover:text-brand-700"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          {/* 계정 관련 항목만. 탭은 탑바에 항상 보이고 알림은 🔔이 있으니 여기엔 두지 않는다 */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="flex flex-col gap-0.5">
              {isLoggedIn && profile && (
                <Link to="/my" onClick={menuDrawer.close} className={menuItemClass}>
                  <img src="/landing_img/myPage/user.svg" alt="" className="h-5 w-5" />
                  마이페이지
                </Link>
              )}
              {/* 폰 폭에서는 탑바에 💬이 안 들어가서 여기가 유일한 채팅 진입점. 그 이상 폭에서는 숨긴다 */}
              <button type="button" onClick={handleChatClick} className={`${menuItemClass} md:hidden`}>
                <ChatIcon className="h-5 w-5" />
                채팅
              </button>
            </div>
          </div>

          <div className="border-t border-brand-100 p-4">
            {isLoggedIn ? (
              <button
                type="button"
                onClick={() => {
                  menuDrawer.close()
                  handleLogout()
                }}
                className="h-11 w-full rounded-xl bg-gray-200 text-sm font-semibold text-brand-900 transition-colors hover:bg-brand-500 hover:text-white"
              >
                로그아웃
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={menuDrawer.close}
                  className="flex h-11 items-center justify-center rounded-xl bg-gray-200 text-sm font-semibold text-brand-900 transition-colors hover:bg-brand-500 hover:text-white"
                >
                  로그인
                </Link>
                <Link
                  to="/signup"
                  onClick={menuDrawer.close}
                  className="flex h-11 items-center justify-center rounded-xl bg-[#4D4DF1] text-sm font-semibold text-white transition-colors hover:bg-[#3D3DD9]"
                >
                  무료로 시작하기
                </Link>
              </div>
            )}
          </div>
        </div>
      </>
    )}
    </>
  )
}
