import { useEffect, useRef } from 'react'
import gsap from 'gsap'

const TITLE = '흩어진 공모전 정보를 한눈에, MateOn'

export default function CTA() {
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (!titleRef.current) return
    const letters = titleRef.current.querySelectorAll('span')

    gsap.fromTo(
      letters,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.03 },
    )
  }, [])

  return (
    <section id="cta" className="px-6 pb-24">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-brand-400 px-8 py-16 text-center sm:px-16">
        <h2 ref={titleRef} className="text-3xl font-bold text-white sm:text-4xl">
          {TITLE.split('').map((char, i) => (
            <span key={i} className="inline-block">
              {char === ' ' ? ' ' : char}
            </span>
          ))}
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm text-brand-50/90">
          MateOn 설명 페이지
        </p>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <a
            href="#contact"
            className="rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-brand-600 transition-transform hover:-translate-y-0.5"
          >
            앱 다운로드
          </a>
          <a
            href="#contact"
            className="rounded-full border border-white/40 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            문의하기
          </a>
        </div>
      </div>
    </section>
  )
}
