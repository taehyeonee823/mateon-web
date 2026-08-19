import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const STEPS = [
  { icon: '/landing_img/src1.svg', bg: 'bg-blue-100', title: '활동 탐색', subtitle: '전국의 흩어진 활동들을 한 눈에 찾을 수 있어요.' },
  { icon: '/landing_img/src2.svg', bg: 'bg-violet-100', title: '팀원 모집', subtitle: 'AI 매칭을 통해 가장 적합한 팀원을 매칭할 수 있어요.' },
  { icon: '/landing_img/src3.svg', bg: 'bg-rose-100', title: '신뢰', subtitle: '활동 종료 후 평가에 따라 협업온도가 산정돼요.' },
]

const TITLE_LINES = ['3단계로 이루어지는', 'MateOn의 팀 빌딩']

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const stepsRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (titleRef.current) {
        const letters = titleRef.current.querySelectorAll('span')
        gsap.fromTo(
          letters,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: 'power2.out',
            stagger: 0.03,
            scrollTrigger: {
              trigger: titleRef.current,
              start: 'top 85%',
            },
          },
        )
      }

      if (stepsRef.current) {
        const cards = stepsRef.current.querySelectorAll('.step-card')
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: stepsRef.current,
            start: 'top 80%',
          },
        })

        if (lineRef.current) {
          tl.fromTo(
            lineRef.current,
            { scaleX: 0 },
            { scaleX: 1, duration: 0.8, ease: 'power1.inOut', transformOrigin: 'left center' },
          )
        }

        tl.fromTo(cards, { opacity: 0 }, { opacity: 1, duration: 0.8, ease: 'power1.out', stagger: 0.4 })
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="bg-[#F1F6FE] px-6 py-24">
      <div className="mx-auto max-w-5xl text-center">
        <span className="text-base font-medium text-brand-500">How it works</span>
        <h2 ref={titleRef} className="mt-3 text-3xl font-bold leading-normal text-black sm:text-5xl">
          {TITLE_LINES.map((line, li) => (
            <div key={li}>
              {line.split('').map((char, i) => (
                <span key={i} className="inline-block">
                  {char === ' ' ? '\u00A0' : char}
                </span>
              ))}
            </div>
          ))}
        </h2>

        <div ref={stepsRef} className="relative mt-20 grid grid-cols-3">
          <div
            ref={lineRef}
            className="pointer-events-none absolute inset-x-[16.6667%] top-16 h-px bg-brand-900/50"
          />
          {STEPS.map((step) => (
            <div key={step.title} className="step-card relative z-10 flex flex-col items-center">
              <div
                className={`flex h-32 w-32 items-center justify-center rounded-full ${step.bg}`}
              >
                <img src={step.icon} alt="" className="h-16 w-16" />
              </div>
              <p className="mt-6 text-2xl font-semibold text-brand-900">{step.title}</p>
              <p className="mt-1 text-sm text-brand-500">{step.subtitle}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
