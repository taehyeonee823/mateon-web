import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function AwardCTA() {
  const imageRef = useRef<HTMLImageElement>(null)
  const textRef = useRef<HTMLHeadingElement>(null)

  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center gap-10 bg-white px-6 py-28 text-center">
      <img
        ref={imageRef}
        src="/landing_img/dreamyAward.png"
        alt="드림이와 함께 1위 수상"
        className="w-64 sm:w-80"
      />

      <h2 ref={textRef} className="text-4xl font-bold leading-tight text-black sm:text-5xl">
        <span className="text-[#2554F0]">드림이</span>와 함께
        <br />
        1위 수상을 달성해보세요!
      </h2>
    </section>
  )
}
