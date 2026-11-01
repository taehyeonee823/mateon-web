import { useEffect, useState } from 'react'

export type IndicatorSection = { id: string; label: string }

// 랜딩 좌측 플로팅: 지금 보고 있는 섹션을 세로 점으로 표시하고, 클릭하면 해당 섹션으로 이동
export default function SectionIndicator({ sections }: { sections: IndicatorSection[] }) {
  const [activeId, setActiveId] = useState(sections[0]?.id)

  useEffect(() => {
    // 화면 세로 중앙선에 걸친 섹션을 현재 섹션으로 본다
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id)
        })
      },
      { rootMargin: '-50% 0px -50% 0px' },
    )

    sections.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [sections])

  return (
    <nav
      aria-label="페이지 섹션"
      className="fixed left-6 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-1 rounded-full bg-white/80 px-2 py-3 shadow-lg shadow-black/10 backdrop-blur md:flex"
    >
      {sections.map(({ id, label }) => {
        const active = id === activeId
        return (
          <button
            key={id}
            type="button"
            onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })}
            aria-label={label}
            aria-current={active ? 'true' : undefined}
            className="group relative flex h-6 w-4 items-center justify-center"
          >
            <span
              className={`block w-1.5 rounded-full transition-all duration-300 ${
                active ? 'h-5 bg-[#4D4DF1]' : 'h-1.5 bg-brand-200 group-hover:bg-brand-400'
              }`}
            />
            {/* 현재 섹션 또는 호버한 섹션의 이름을 오른쪽에 표시 */}
            <span
              className={`pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-full bg-[#1B1B33] px-2.5 py-1 text-[11px] font-semibold text-white transition-opacity ${
                active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
            >
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
