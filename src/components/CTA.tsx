import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import FloatingImages from './FloatingImages'
import { ChevronDownIcon } from './icons'
import { useAuth } from '../context/AuthContext'
import { getContestCount } from '../api/activity'

function formatToday() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}.${m}.${d}`
}

const LINES = [
  { text: '전국의 흩어진 활동,', highlight: false },
  { text: 'MateOn에서', highlight: true },
  { text: '시작하기', highlight: false },
]

export default function CTA() {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  const titleRef = useRef<HTMLHeadingElement>(null)
  const [contestCount, setContestCount] = useState<number | null>(null)

  useEffect(() => {
    if (!titleRef.current) return
    const letters = titleRef.current.querySelectorAll('span')

    gsap.fromTo(
      letters,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.03 },
    )
  }, [])

  useEffect(() => {
    getContestCount()
      .then(setContestCount)
      .catch(() => setContestCount(null))
  }, [])

  return (
    <section id="cta" className="relative px-6 pb-36 bg-[#F1F6FE]">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-10 overflow-hidden rounded-[2.5rem] px-8 py-24 text-left sm:px-16 lg:flex-row lg:justify-between">
        <div>
          <h2
            ref={titleRef}
            className="font-seoul-alrim text-3xl font-bold leading-none tracking-wide text-black sm:text-6xl"
          >
            {LINES.map((line, li) => (
              <div key={li} className={li > 0 ? 'mt-4' : undefined}>
                {line.text.split('').map((char, i) => (
                  <span
                    key={i}
                    className={line.highlight ? 'inline-block text-[#2554F0]' : 'inline-block'}
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                ))}
              </div>
            ))}
          </h2>
          <p className="mt-12 max-w-md text-lg text-black font-semibold">
            MateOn은 전국의 팀 빌딩 활동들을 한 곳에서 확인하고,
            <br />
            팀을 구성할 수 있는 대학생 플랫폼입니다.
          </p>

          <div className="mt-9">
            <p className="text-xs text-brand-500">{formatToday()}</p>
            <p className="mt-0.5 text-sm font-semibold text-brand-500">오늘 기준</p>

            <div className="mt-3 flex gap-8">
              {[
                { label: '등록된 팀', value: contestCount },
                { label: '회원 수', value: null as number | null },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-4xl font-extrabold leading-none text-[#2554F0] sm:text-5xl">
                    {stat.value !== null ? `${stat.value.toLocaleString()}+` : ' '}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-brand-400">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#contact"
                className="flex items-center gap-2 rounded-2xl bg-black px-7 py-3.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
              >
                <img
                  src="/landing_img/appleLogo.png"
                  alt=""
                  className="h-5 w-4 object-cover invert"
                />
                TestFlight로 시작하기
              </a>

              <button
                type="button"
                onClick={() => navigate(isLoggedIn ? '/contest' : '/login')}
                className="flex items-center gap-2 rounded-2xl bg-[#2554F0] px-7 py-3.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
              >
                MateOn Web으로 시작하기
              </button>
            </div>
          </div>
        </div>

        <FloatingImages />
      </div>

      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center -space-y-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              animation: 'chevron-cascade 1.2s ease-in-out infinite',
              animationDelay: `${i * 0.2}s`,
            }}
          >
            <ChevronDownIcon className="h-8 w-8 text-gray-400" />
          </span>
        ))}
      </div>
    </section>
  )
}
