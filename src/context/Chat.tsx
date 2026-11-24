import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useChat } from '../hooks/useChat'
import { useAuth } from './AuthContext'

export type ChatContextValue = ReturnType<typeof useChat> & {
  // 모든 방의 안 읽은 개수 합계. Topbar 종 아이콘 빨간 점 판단에 쓴다.
  totalUnread: number
}

const ChatContext = createContext<ChatContextValue | null>(null)

// 채팅 상태(방 목록, 메시지, STOMP 구독)를 앱 전체에서 한 번만 만든다.
// 로그인 상태가 아니면 children만 그대로 렌더링하고 채팅 훅은 쓰지 않는다.
export function ChatProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth()
  if (!isLoggedIn) return <>{children}</>
  return <ConnectedChatProvider>{children}</ConnectedChatProvider>
}

function ConnectedChatProvider({ children }: { children: ReactNode }) {
  const chat = useChat({ autoSelectFirst: false })
  const totalUnread = useMemo(
    () => chat.rooms.reduce((sum, r) => sum + r.unreadCount, 0),
    [chat.rooms],
  )
  const value = useMemo(() => ({ ...chat, totalUnread }), [chat, totalUnread])
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

// 로그인 상태가 아니면 null이 되므로 호출부에서 `?.`로 안전하게 읽는다.
export function useChatContext(): ChatContextValue | null {
  return useContext(ChatContext)
}
