import { useEffect, useRef, useState } from 'react'
import type { ChatRoom, StompChatMessage } from '../../types/chat'

/* ── 시간 포맷 ─────────────────────────────────────────────── */

// "YYYY-MM-DDTHH:mm:ss" -> 채팅방 목록용 짧은 표시 (오늘이면 시:분, 아니면 M/D)
export function formatRoomTime(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const now = new Date()
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  return isToday
    ? date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    : `${date.getMonth() + 1}/${date.getDate()}`
}

// "YYYY-MM-DDTHH:mm:ss" -> 메시지 말풍선용 시:분
export function formatMessageTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

// "YYYY-MM-DDTHH:mm:ss" -> 날짜 변경선 문구 ("2026년 8월 31일 월요일")
export function formatChatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${DAY_LABELS[date.getDay()]}요일`
}

export function isSameDay(a: string, b: string): boolean {
  const dateA = new Date(a)
  const dateB = new Date(b)
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  )
}

/* ── 조각 컴포넌트 ─────────────────────────────────────────── */

export function RoomAvatar({ src, className = 'h-11 w-11' }: { src?: string | null; className?: string }) {
  return (
    <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 ${className}`}>
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <img src="/landing_img/myPage/user.svg" alt="" className="h-[60%] w-[60%] opacity-40" />
      )}
    </div>
  )
}

export function ChatDateSeparator({ date }: { date: string }) {
  return (
    <div className="my-3 flex items-center px-2">
      <div className="h-px flex-1 bg-slate-200" />
      <span className="mx-3 text-xs font-medium text-slate-400">{formatChatDate(date)}</span>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  )
}

export function RoomList({
  rooms,
  loading,
  selectedRoomId,
  partnerAvatars,
  onSelect,
  compact = false,
}: {
  rooms: ChatRoom[]
  loading: boolean
  selectedRoomId: number | null
  partnerAvatars: Record<number, string | null>
  onSelect: (roomId: number) => void
  compact?: boolean
}) {
  if (loading) {
    return <p className="px-6 py-8 text-center text-sm text-slate-400">불러오는 중…</p>
  }
  if (rooms.length === 0) {
    return <p className="px-6 py-8 text-center text-sm text-slate-400">채팅방이 없어요.</p>
  }

  return (
    <>
      {rooms.map((room) => {
        const selected = room.roomId === selectedRoomId
        return (
          <button
            key={room.roomId}
            type="button"
            onClick={() => onSelect(room.roomId)}
            className={`flex w-full items-start gap-3 border-l-[3px] text-left transition-colors ${
              compact ? 'px-4 py-3' : 'px-5 py-4 max-md:gap-2 max-md:px-4 max-md:py-3'
            } ${selected ? 'border-indigo-600 bg-indigo-50/70' : 'border-transparent hover:bg-slate-50'}`}
          >
            <RoomAvatar src={room.partnerId != null ? partnerAvatars[room.partnerId] : null} className={compact ? 'h-10 w-10' : 'h-11 w-11'} />

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold">{room.title}</span>
                <span className="shrink-0 text-xs text-slate-400">{formatRoomTime(room.lastMessageAt)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="truncate text-sm text-slate-500">{room.lastMessage}</p>
                {room.unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[11px] font-semibold text-white">
                    {room.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </button>
        )
      })}
    </>
  )
}

export function MessageList({
  messages,
  loading,
  currentUserId,
  fontSize = 14,
  className = '',
}: {
  messages: StompChatMessage[]
  loading: boolean
  currentUserId: number | undefined
  fontSize?: number
  className?: string
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages])

  return (
    <div ref={scrollRef} className={`flex-1 space-y-2 overflow-y-auto ${className}`}>
      {loading && <p className="text-center text-sm text-slate-400">메시지를 불러오는 중…</p>}

      {messages.map((msg, idx) => {
        const senderIsMe = msg.senderId === currentUserId
        const prevMsg = messages[idx - 1]
        const showDateSeparator = !prevMsg || !isSameDay(prevMsg.createdAt, msg.createdAt)
        return (
          <div key={msg.messageId}>
            {showDateSeparator && <ChatDateSeparator date={msg.createdAt} />}
            <div className={`flex ${senderIsMe ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[75%]">
                {!senderIsMe && <p className="mb-1 text-xs font-medium text-slate-500">{msg.senderName}</p>}
                <div
                  style={{ fontSize }}
                  className={`whitespace-pre-wrap break-words rounded-2xl px-3 py-2 leading-relaxed ${
                    senderIsMe ? 'bg-indigo-600 text-white' : 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-100'
                  }`}
                >
                  {msg.content}
                </div>
                <p className={`mt-1 text-[11px] text-slate-400 ${senderIsMe ? 'text-right' : 'text-left'}`}>
                  {formatMessageTime(msg.createdAt)}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function Composer({
  onSend,
  compact = false,
}: {
  onSend: (content: string) => boolean
  compact?: boolean
}) {
  const [draft, setDraft] = useState('')
  const [isComposing, setIsComposing] = useState(false)

  const handleSend = () => {
    if (onSend(draft)) setDraft('')
  }

  return (
    <div className={`flex items-end ${compact ? 'gap-2' : 'gap-3 max-lg:gap-2'}`}>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !isComposing && !e.nativeEvent.isComposing) {
            e.preventDefault()
            handleSend()
          }
        }}
        placeholder="메시지를 입력하세요..."
        rows={1}
        className={`flex-1 resize-none rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 ${
          compact ? 'px-3 py-2' : 'px-4 py-3 max-lg:px-3 max-lg:py-2'
        }`}
      />
      <button
        type="button"
        onClick={handleSend}
        disabled={!draft.trim()}
        className={`flex shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white disabled:opacity-40 ${
          compact ? 'h-9 w-9' : 'h-11 w-11 max-lg:h-9 max-lg:w-9'
        }`}
        aria-label="메시지 보내기"
      >
        ↑
      </button>
    </div>
  )
}
