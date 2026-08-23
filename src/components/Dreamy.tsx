import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function Dreamy() {
  const imageRef = useRef<HTMLImageElement>(null)
  const textRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (imageRef.current) {
        gsap.fromTo(
          imageRef.current,
          { opacity: 0, scale: 0.7, y: 40 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.9,
            ease: 'back.out(1.6)',
            scrollTrigger: { trigger: imageRef.current, start: 'top 85%' },
          },
        )
      }

      if (textRef.current) {
        gsap.fromTo(
          textRef.current,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: 'power2.out',
            delay: 0.2,
            scrollTrigger: { trigger: textRef.current, start: 'top 85%' },
          },
        )
      }
    })

    return () => ctx.revert()
  }, [])

  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center gap-10 bg-[#F1F6FE] px-6 py-28 text-center">
      <img ref={imageRef} src="/landing_img/dreamy.svg" alt="AI 드림이" className="w-64 sm:w-80" />

      <h2 ref={textRef} className="text-4xl font-bold leading-tight text-black sm:text-5xl">
        MateOn의 강력한 AI 어시스턴트
        <br />
        <span className="text-[#2554F0]">드림이</span>를 소개합니다.
      </h2>
    </section>
  )
}
