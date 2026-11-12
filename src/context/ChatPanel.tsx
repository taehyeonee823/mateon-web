import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

type ChatPanelContextValue = {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

const ChatPanelContext = createContext<ChatPanelContextValue | null>(null)

// 탑바의 말풍선 버튼으로 여닫는 오른쪽 채팅 패널의 열림 상태.
// 어느 페이지에서나 같은 상태를 보도록 App 전체를 감싼다.
export function ChatPanelProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  // /chat 전체 페이지에 들어가면 패널은 의미가 없으니 닫는다.
  useEffect(() => {
    if (location.pathname === '/chat') setIsOpen(false)
  }, [location.pathname])

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])

  const value = useMemo(() => ({ isOpen, open, close, toggle }), [isOpen, open, close, toggle])

  return <ChatPanelContext.Provider value={value}>{children}</ChatPanelContext.Provider>
}

export function useChatPanel(): ChatPanelContextValue {
  const ctx = useContext(ChatPanelContext)
  if (!ctx) throw new Error('useChatPanel은 ChatPanelProvider 안에서만 쓸 수 있어요.')
  return ctx
}
