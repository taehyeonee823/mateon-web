import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const TUBE_TOP = 6
const TUBE_LEFT = 38
const TUBE_RIGHT = 62
const TUBE_RADIUS = 12
const BULB_CX = 50
const BULB_CY = 200
const BULB_R = 26

const NECK_Y = BULB_CY - Math.sqrt(BULB_R ** 2 - (BULB_CX - TUBE_LEFT) ** 2)
const BULB_BOTTOM = BULB_CY + BULB_R

const OUTLINE = `
  M${TUBE_LEFT},${TUBE_TOP + TUBE_RADIUS}
  A${TUBE_RADIUS},${TUBE_RADIUS} 0 0 1 ${BULB_CX},${TUBE_TOP}
  A${TUBE_RADIUS},${TUBE_RADIUS} 0 0 1 ${TUBE_RIGHT},${TUBE_TOP + TUBE_RADIUS}
  L${TUBE_RIGHT},${NECK_Y}
  A${BULB_R},${BULB_R} 0 1 1 ${TUBE_LEFT},${NECK_Y}
  Z
`

export default function Thermometer({ value, max = 100 }: { value: number; max?: number }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const liquidRef = useRef<SVGGElement>(null)

  const percent = Math.min(Math.max(value, 0) / max, 1)
  const liquidTopY = BULB_BOTTOM - percent * (BULB_BOTTOM - TUBE_TOP)

  useEffect(() => {
    if (!liquidRef.current || !wrapRef.current) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        liquidRef.current,
        { y: BULB_BOTTOM },
        {
          y: liquidTopY,
          duration: 1.4,
          ease: 'power2.out',
          scrollTrigger: { trigger: wrapRef.current, start: 'top 85%' },
        },
      )
    })

    return () => ctx.revert()
  }, [liquidTopY])

  return (
    <div ref={wrapRef} className="flex flex-col items-center">
      <div className="relative h-64 w-24">
        <svg
          viewBox="0 0 100 250"
          className="h-full w-full overflow-visible"
          style={{ filter: 'drop-shadow(0 10px 14px rgba(255,0,0,0.18)) drop-shadow(0 2px 4px rgba(0,0,0,0.12))' }}
        >
          <defs>
            <clipPath id="thermo-clip">
              <path d={OUTLINE} />
            </clipPath>
          </defs>

          <g clipPath="url(#thermo-clip)">
            <rect x="0" y="0" width="100" height="250" fill="#FDE2E2" />
          </g>

          <g clipPath="url(#thermo-clip)">
            <g ref={liquidRef}>
              <path
                d="M0,10 Q25,-2 50,10 T100,10 T150,10 T200,10 V400 H0 Z"
                fill="#FF4747"
                className="thermo-wave"
              />
            </g>
          </g>

          <path d={OUTLINE} fill="none" stroke="#FF0000" strokeWidth="3.5" strokeLinejoin="round" />
        </svg>
      </div>

      <p className="mt-3 text-2xl font-bold text-[#FF0000]">{value}°C</p>
    </div>
  )
}
