import { useCallback } from 'react'
import { useSidePanel } from './SidePanel'

// 채팅 패널 전용 편의 훅. 실제 상태는 SidePanelProvider가 들고 있다.
export function useChatPanel() {
  const { active, open, close, toggle } = useSidePanel()
  return {
    isOpen: active === 'chat',
    open: useCallback(() => open('chat'), [open]),
    close,
    toggle: useCallback(() => toggle('chat'), [toggle]),
  }
}
