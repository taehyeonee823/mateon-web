import { Link, useLocation } from 'react-router-dom'
import SlideInPanel from '../SlideInPanel'
import { useAuth } from '../../context/AuthContext'
import { useChatPanel } from '../../context/ChatPanel'
import { useChatContext } from '../../context/Chat'
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
  const chat = useChatContext()
  if (!chat) return null
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
          <ExpandIcon className="h-5 w-5" />
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
export default function ChatPanel() {
  const { isOpen, close } = useChatPanel()
  const { isLoggedIn } = useAuth()
  const location = useLocation()

  return (
    <SlideInPanel open={isOpen && isLoggedIn && location.pathname !== '/chat'} onClose={close} label="채팅">
      <ChatPanelBody />
    </SlideInPanel>
  )
}
