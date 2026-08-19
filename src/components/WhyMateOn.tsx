import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const REASONS = [
  {
    image: '/landing_img/teamFind.png',
    title: '팀 빌딩과 매칭',
    desc: '관심 분야와 활동 이력을 분석해서 지금 가장 잘 맞는 팀과 팀원을 추천해줘요. 우리 팀에 가장 필요한 인재들을 AI가 추천해줘요.',
  },
  {
    image: '/landing_img/chatBot.png',
    title: '모집 · 지원글 작성',
    desc: '어디서부터 시작해야 할지 모르는 팀 빌딩과 지원, 이제 모집글과 지원글 AI가 모두 작성해줘요.',
  },
  {
    image: '/landing_img/aiReport.png',
    title: '개인 포트폴리오 분석',
    desc: '나의 활동 이력을 제출하고 그 바탕으로 AI가 강점을 분석해줘요.',
  },
]

export default function WhyMateOn() {
  const sectionRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const reasonsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (sectionRef.current) {
        gsap.fromTo(
          sectionRef.current,
          { backgroundColor: '#F1F6FE' },
          {
            backgroundColor: '#000000',
            ease: 'none',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top bottom',
              end: 'top top',
              scrub: true,
            },
          },
        )
      }

      if (titleRef.current) {
        gsap.fromTo(
          titleRef.current,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: 'power2.out',
            scrollTrigger: { trigger: titleRef.current, start: 'top 85%' },
          },
        )
      }

      if (reasonsRef.current) {
        const items = reasonsRef.current.querySelectorAll('.reason')
        items.forEach((item) => {
          const img = item.querySelector('img')
          const text = item.querySelector('.reason-text')

          if (img) {
            gsap.fromTo(
              img,
              { opacity: 0, y: 40, scale: 0.95 },
              {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.8,
                ease: 'power2.out',
                scrollTrigger: { trigger: item, start: 'top 80%' },
              },
            )
          }

          if (text) {
            gsap.fromTo(
              text,
              { opacity: 0, y: 20 },
              {
                opacity: 1,
                y: 0,
                duration: 0.6,
                ease: 'power2.out',
                delay: 0.15,
                scrollTrigger: { trigger: item, start: 'top 80%' },
              },
            )
          }
        })
      }
    })

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="bg-[#F1F6FE] px-6 py-32">
      <h2
        ref={titleRef}
        className="mx-auto max-w-3xl text-center text-4xl font-bold leading-tight text-white sm:text-6xl"
      >
        AI 드림이의 맞춤 기능
      </h2>

      <div ref={reasonsRef} className="mx-auto mt-24 flex max-w-5xl flex-col gap-24">
        {REASONS.map((reason, i) => (
          <div
            key={reason.title}
            className={`reason flex flex-col items-center gap-10 sm:gap-16 ${
              i % 2 === 1 ? 'sm:flex-row-reverse' : 'sm:flex-row'
            }`}
          >
            <img
              src={reason.image}
              alt=""
              className="h-[44rem] w-auto shrink-0 object-contain"
            />
            <div className="text-center sm:text-left">
              <p className="text-3xl font-bold text-white sm:text-5xl">{reason.title}</p>
              <p className="mt-4 max-w-sm text-lg leading-relaxed text-white/60">
                {reason.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
