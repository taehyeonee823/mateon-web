import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useChatPanel } from '../../context/ChatPanel'
import { useChat } from '../../hooks/useChat'
import { Composer, MessageList, RoomAvatar, RoomList } from './ChatParts'

function CloseIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className={className} aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

function BackIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

function ExpandIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" />
    </svg>
  )
}

// 패널 안에서만 채팅 데이터를 들고 있도록 분리.
// 패널이 닫히면 이 컴포넌트가 언마운트되어 구독도 함께 정리된다.
function ChatPanelBody() {
  const { profile } = useAuth()
  const { close } = useChatPanel()
  const chat = useChat({ autoSelectFirst: false })
  const { selectedRoom } = chat

  return (
    <div className="flex h-full flex-col bg-white text-slate-900">
      <header className="flex h-[72px] shrink-0 items-center gap-2 border-b border-slate-100 px-4">
        {selectedRoom ? (
          <>
            <button
              type="button"
              onClick={() => chat.setSelectedRoomId(null)}
              aria-label="채팅 목록으로"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
            >
              <BackIcon className="h-5 w-5" />
            </button>
            <RoomAvatar
              src={selectedRoom.partnerId != null ? chat.partnerAvatars[selectedRoom.partnerId] : null}
              className="h-9 w-9"
            />
            <p className="min-w-0 flex-1 truncate font-semibold">{selectedRoom.title}</p>
          </>
        ) : (
          <h2 className="min-w-0 flex-1 text-lg font-bold">채팅</h2>
        )}

        <Link
          to="/chat"
          aria-label="채팅 전체 화면으로 보기"
          title="전체 화면"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
        >
          <ExpandIcon className="h-4.5 w-4.5" />
        </Link>
        <button
          type="button"
          onClick={close}
          aria-label="채팅 닫기"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </header>

      {selectedRoom ? (
        <>
          <MessageList
            messages={chat.messages}
            loading={chat.messagesLoading}
            currentUserId={profile?.id}
            className="bg-slate-50 px-4 py-4"
          />
          <footer className="shrink-0 border-t border-slate-200 bg-white px-3 py-3">
            <Composer onSend={chat.sendMessage} compact />
          </footer>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <RoomList
            rooms={chat.rooms}
            loading={chat.roomsLoading}
            selectedRoomId={chat.selectedRoomId}
            partnerAvatars={chat.partnerAvatars}
            onSelect={chat.setSelectedRoomId}
            compact
          />
        </div>
      )}
    </div>
  )
}

// App 레이아웃 오른쪽에 붙는 채팅 패널.
// 넓은 화면에서는 페이지 옆 고정 폭 컬럼으로, 좁은 화면에서는 전체를 덮는 오버레이로 뜬다.
const TRANSITION_MS = 350
const EASING = 'ease-[cubic-bezier(0.16,1,0.3,1)]'

export default function ChatPanel() {
  const { isOpen, close } = useChatPanel()
  const { isLoggedIn } = useAuth()
  const location = useLocation()

  const shouldShow = isOpen && isLoggedIn && location.pathname !== '/chat'

  // mounted: DOM에 올라가 있는지 (닫힘 애니메이션이 끝날 때까지 유지)
  // visible: 열린 상태의 스타일을 적용할지 (마운트 다음 프레임에 true로 바꿔 transition을 건다)
  const [mounted, setMounted] = useState(shouldShow)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (shouldShow) {
      setMounted(true)
      let raf2 = 0
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setVisible(true))
      })
      return () => {
        cancelAnimationFrame(raf1)
        cancelAnimationFrame(raf2)
      }
    }

    setVisible(false)
    const timer = window.setTimeout(() => setMounted(false), TRANSITION_MS)
    return () => window.clearTimeout(timer)
  }, [shouldShow])

  if (!mounted) return null

  return (
    <>
      {/* 좁은 화면용 배경 */}
      <div
        className={`fixed inset-0 z-[55] bg-black/20 transition-opacity duration-[350ms] ${EASING} lg:hidden ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={close}
      />
      <aside
        aria-label="채팅"
        className={`fixed inset-y-0 right-0 z-[60] w-full max-w-[400px] shadow-xl shadow-black/10 transition-transform duration-[350ms] will-change-transform ${EASING} lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:max-w-none lg:shrink-0 lg:translate-x-0 lg:overflow-hidden lg:shadow-none lg:transition-[width] ${
          visible ? 'translate-x-0 lg:w-[400px]' : 'translate-x-full lg:w-0'
        }`}
      >
        {/* 폭이 줄어드는 동안 내용이 찌그러지지 않도록 안쪽은 고정 폭으로 둔다 */}
        <div className="h-full w-full border-l border-slate-200 lg:w-[400px]">
          <ChatPanelBody />
        </div>
      </aside>
    </>
  )
}
