export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-12 pb-24 sm:pt-16">
      <div className="pointer-events-none absolute -top-24 right-[-10%] h-96 w-96 rounded-full bg-brand-200/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-[-10%] h-96 w-96 rounded-full bg-brand-300/40 blur-3xl" />

      <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 lg:grid-cols-2">
        <div>
          <span className="inline-flex items-center rounded-full bg-brand-100 px-4 py-1.5 text-xs font-semibold text-brand-700">
            학교 인증 기반 팀메이트 매칭
          </span>

          <h1 className="mt-6 text-4xl font-bold leading-tight text-brand-900 sm:text-5xl">
            MateOn 
            <br />
            대표 문구
          </h1>

          <p className="mt-6 max-w-md text-base leading-relaxed text-brand-700">
            MateOn 소개
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href="#cta"
              className="rounded-full bg-brand-400 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-400/30 transition-transform hover:-translate-y-0.5 hover:bg-brand-500"
            >
              무료 체험 시작하기
            </a>
          </div>

          <dl className="mt-14 flex gap-10">
            {[
              ['1,200+', '매칭 성사'],
              ['320+', '활동 팀'],
              ['45+', '참여 학교'],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="text-2xl font-bold text-brand-900">{value}</dt>
                <dd className="mt-1 text-xs text-brand-600">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative mx-auto w-full max-w-sm">
          <div className="rounded-[2rem] border border-brand-100 bg-white p-6 shadow-2xl shadow-brand-900/10">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-brand-900">팀원 모집 중</span>
              <span className="rounded-full bg-brand-100 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
                D-3
              </span>
            </div>

            <div className="mt-4 rounded-2xl bg-brand-50 p-4">
              <p className="text-sm font-bold text-brand-900">
                UX 공모전 함께하실 팀원 구해요
              </p>
              <p className="mt-1 text-xs text-brand-600">
                디자인 · 기획 2인 · 서울권 대학교
              </p>
              <div className="mt-3 flex -space-x-2">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-8 w-8 rounded-full border-2 border-white bg-brand-300"
                  />
                ))}
                <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-brand-100 text-[10px] font-semibold text-brand-700">
                  +5
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {['학교 인증 완료', '실시간 채팅 지원', 'AI 팀원 추천'].map((item) => (
                <div key={item} className="flex items-center gap-2 text-xs text-brand-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                  {item}
                </div>
              ))}
            </div>

            <button
              type="button"
              className="mt-5 w-full rounded-xl bg-brand-400 py-3 text-sm font-semibold text-white"
            >
              지원하기
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
