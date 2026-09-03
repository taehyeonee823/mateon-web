import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchEventSimilarityMap,
  EventEmbeddingNotReadyError,
  type EventSimilarityMap,
  type SimilarityMapPoint,
} from '../api/event'

const SIZE = 320
const CENTER = SIZE / 2
const PLOT_RADIUS = CENTER - 24

function colorForPercentile(rankPercentile: number): string {
  if (rankPercentile <= 0.1) return '#4D4DF1'
  if (rankPercentile <= 0.3) return '#7A7AF5'
  if (rankPercentile <= 0.6) return '#A9A9F7'
  return '#D6D6F5'
}

export default function SimilarityMap({ eventId }: { eventId: number }) {
  const navigate = useNavigate()
  const [data, setData] = useState<EventSimilarityMap | null>(null)
  const [loading, setLoading] = useState(true)
  const [notReady, setNotReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hovered, setHovered] = useState<SimilarityMapPoint | null>(null)
  const [mounted, setMounted] = useState(false) // 등장 애니메이션 트리거

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    setNotReady(false)
    setMounted(false)

    fetchEventSimilarityMap(eventId, { topN: 60 }, controller.signal)
      .then((res) => {
        setData(res)
        // 렌더된 다음 프레임에 mounted를 true로 바꿔서 CSS transition이 걸리게 함
        requestAnimationFrame(() => requestAnimationFrame(() => setMounted(true)))
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        if (err instanceof EventEmbeddingNotReadyError) {
          setNotReady(true)
          return
        }
        setError(err instanceof Error ? err.message : '유사도 지도를 불러오지 못했어요.')
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [eventId])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-[#8C8DAE]">
        비슷한 공모전을 찾는 중이에요…
      </div>
    )
  }

  if (notReady) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-1 rounded-2xl bg-[#F7F7FC] text-center">
        <p className="text-sm font-medium text-[#8C8DAE]">
          아직 분석 준비 중이에요. 잠시 후 다시 확인해주세요.
        </p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-[#8C8DAE]">
        {error ?? '유사도 정보를 불러올 수 없어요.'}
      </div>
    )
  }

  if (data.points.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-[#8C8DAE]">
        아직 비슷한 공모전이 없어요.
      </div>
    )
  }

  const scale = PLOT_RADIUS / data.maxRadius
  const topPicks = [...data.points].sort((a, b) => b.similarity - a.similarity).slice(0, 4)

  return (
    <div className="flex flex-col gap-6">
      {/* 산점도 */}
      <div className="relative mx-auto" style={{ width: SIZE, height: SIZE }}>
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-full w-full overflow-visible">
          {data.referenceRings.map((ring, i) => (
            <circle
              key={ring.percentile}
              cx={CENTER}
              cy={CENTER}
              r={ring.radius * scale}
              fill="none"
              stroke="#B3B3CC" // 동심원 색
              strokeWidth={1.25}
              strokeDasharray="3 3"
              style={{
                opacity: mounted ? 1 : 0,
                transition: `opacity 500ms ease ${i * 80}ms`,
              }}
            />
          ))}

          {data.points.map((p, i) => {
            const targetX = CENTER + p.x * scale
            const targetY = CENTER + p.y * scale
            const isHovered = hovered?.id === p.id
            return (
              <circle
                key={p.id}
                cx={mounted ? targetX : CENTER}
                cy={mounted ? targetY : CENTER}
                r={isHovered ? 7 : 5}
                fill={colorForPercentile(p.rankPercentile)}
                stroke="white"
                strokeWidth={1.5}
                className="cursor-pointer"
                style={{
                  opacity: mounted ? 1 : 0,
                  transition: `cx 600ms cubic-bezier(0.22,1,0.36,1) ${i * 12}ms, cy 600ms cubic-bezier(0.22,1,0.36,1) ${i * 12}ms, opacity 300ms ease ${i * 12}ms, r 150ms ease`,
                }}
                onMouseEnter={() => setHovered(p)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => navigate(`/contests/${p.id}`)}
              />
            )
          })}

          <circle cx={CENTER} cy={CENTER} r={7} fill="#1B1B33" stroke="white" strokeWidth={2} />
        </svg>

        {hovered && (
          <div className="pointer-events-none absolute left-1/2 top-0 w-56 -translate-x-1/2 -translate-y-full rounded-xl border border-[#ECECF5] bg-white p-3 text-left shadow-lg">
            <p className="line-clamp-2 text-[13px] font-bold text-[#1B1B33]">{hovered.title}</p>
            <p className="mt-0.5 text-[11px] text-[#8C8DAE]">
              {hovered.organizer ?? '주최 미상'}
              {hovered.fieldLabel ? ` · ${hovered.fieldLabel}` : ''}
            </p>
            <p className="mt-1 text-[11px] font-semibold text-[#4D4DF1]">
              유사도 {Math.round(hovered.similarity * 100)}%
            </p>
          </div>
        )}
      </div>

      {/* 하단 TOP 카드 리스트 */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {topPicks.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => navigate(`/contests/${p.id}`)}
            className="flex items-center gap-3 rounded-xl border border-[#ECECF5] bg-white p-3 text-left transition-all hover:border-[#4D4DF1]/40 hover:shadow-sm"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(6px)',
              transition: `opacity 400ms ease ${300 + i * 80}ms, transform 400ms ease ${300 + i * 80}ms`,
            }}
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
              style={{ backgroundColor: colorForPercentile(p.rankPercentile) }}
            >
              {Math.round(p.similarity * 100)}%
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold text-[#1B1B33]">{p.title}</p>
              <p className="truncate text-[11px] text-[#8C8DAE]">
                {p.organizer ?? '주최 미상'}
                {p.fieldLabel ? ` · ${p.fieldLabel}` : ''}
              </p>
            </div>
          </button>
        ))}
      </div>

      <p className="text-center text-[12px] text-[#8C8DAE]">
        총 {data.candidatePoolTotal}개 중 유사도 상위 {data.points.length}개를 보여드려요
      </p>
    </div>
  )
}