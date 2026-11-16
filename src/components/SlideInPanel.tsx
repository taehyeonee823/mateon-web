import { useEffect, useState, type ReactNode } from 'react'

const TRANSITION_MS = 350
const EASING = 'ease-[cubic-bezier(0.16,1,0.3,1)]'

// App 레이아웃 오른쪽에 붙는 사이드 패널의 공통 껍데기 (채팅/알림이 공유).
// 넓은 화면: 폭이 0 → 400px로 늘어나며 페이지가 왼쪽으로 밀린다.
// 좁은 화면: 전체를 덮는 오버레이로 오른쪽에서 슬라이드.
// 닫힘 애니메이션이 끝날 때까지 자식을 유지하고, 그 뒤에 언마운트한다.
export default function SlideInPanel({
  open,
  onClose,
  label,
  children,
}: {
  open: boolean
  onClose: () => void
  label: string
  children: ReactNode
}) {
  // mounted: DOM에 올라가 있는지 / visible: 열린 상태의 스타일을 적용할지
  // 마운트 다음 프레임에 visible을 true로 바꿔야 transition이 걸린다.
  const [mounted, setMounted] = useState(open)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (open) {
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
  }, [open])

  if (!mounted) return null

  return (
    <>
      {/* 좁은 화면용 배경 */}
      <div
        className={`fixed inset-0 z-[55] bg-black/20 transition-opacity duration-[350ms] ${EASING} lg:hidden ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      <aside
        aria-label={label}
        className={`fixed inset-y-0 right-0 z-[60] w-full max-w-[400px] shadow-xl shadow-black/10 transition-transform duration-[350ms] will-change-transform ${EASING} lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:max-w-none lg:shrink-0 lg:translate-x-0 lg:overflow-hidden lg:shadow-none lg:transition-[width] ${
          visible ? 'translate-x-0 lg:w-[400px]' : 'translate-x-full lg:w-0'
        }`}
      >
        {/* 폭이 줄어드는 동안 내용이 찌그러지지 않도록 안쪽은 고정 폭으로 둔다 */}
        <div className="h-full w-full border-l border-slate-200 lg:w-[400px]">{children}</div>
      </aside>
    </>
  )
}
