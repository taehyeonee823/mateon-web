const STEPS = [
  {
    step: '01',
    title: '학교 인증하기',
    desc: '재학 중인 학교로 간단히 인증하고 MateOn 회원이 되세요.',
  },
  {
    step: '02',
    title: '팀 등록 또는 탐색',
    desc: '직접 팀원을 모집하거나 관심있는 모집글을 둘러보세요.',
  },
  {
    step: '03',
    title: '지원 및 매칭',
    desc: '지원서를 보내고 채팅으로 소통하며 팀을 확정하세요.',
  },
  {
    step: '04',
    title: '함께 활동하기',
    desc: '매칭된 팀원들과 목표를 향해 활동을 시작해요.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-500">
            How it works
          </span>
          <h2 className="mt-3 text-3xl font-bold text-brand-900 sm:text-4xl">
            네 단계면 충분해요
          </h2>
        </div>

        <div className="relative mt-16 grid gap-8 md:grid-cols-4">
          <div className="absolute top-6 hidden h-px w-full bg-brand-200 md:block" />
          {STEPS.map((s) => (
            <div key={s.step} className="relative flex flex-col items-center text-center">
              <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-brand-400 text-sm font-bold text-white">
                {s.step}
              </span>
              <h3 className="mt-5 text-base font-bold text-brand-900">{s.title}</h3>
              <p className="mt-2 max-w-[220px] text-sm leading-relaxed text-brand-600">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
