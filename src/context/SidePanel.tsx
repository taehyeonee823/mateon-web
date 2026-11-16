import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

export type SidePanelName = 'chat' | 'notifications'

type SidePanelContextValue = {
  active: SidePanelName | null
  open: (name: SidePanelName) => void
  close: () => void
  toggle: (name: SidePanelName) => void
}

const SidePanelContext = createContext<SidePanelContextValue | null>(null)

// 탑바 버튼으로 여닫는 오른쪽 사이드 패널(채팅/알림)의 열림 상태.
// 한 번에 하나만 열리며, 어느 페이지에서나 같은 상태를 보도록 App 전체를 감싼다.
export function SidePanelProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<SidePanelName | null>(null)
  const location = useLocation()

  // /chat 전체 페이지에 들어가면 채팅 패널은 의미가 없으니 닫는다.
  useEffect(() => {
    if (location.pathname === '/chat') {
      setActive((prev) => (prev === 'chat' ? null : prev))
    }
  }, [location.pathname])

  const open = useCallback((name: SidePanelName) => setActive(name), [])
  const close = useCallback(() => setActive(null), [])
  const toggle = useCallback(
    (name: SidePanelName) => setActive((prev) => (prev === name ? null : name)),
    [],
  )

  const value = useMemo(() => ({ active, open, close, toggle }), [active, open, close, toggle])

  return <SidePanelContext.Provider value={value}>{children}</SidePanelContext.Provider>
}

export function useSidePanel(): SidePanelContextValue {
  const ctx = useContext(SidePanelContext)
  if (!ctx) throw new Error('useSidePanel은 SidePanelProvider 안에서만 쓸 수 있어요.')
  return ctx
}
