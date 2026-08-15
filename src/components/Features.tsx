const FEATURES = [
  {
    title: '학교 인증',
    desc: '재학생 인증을 거친 회원만 활동할 수 있어 신뢰할 수 있는 팀 매칭이 가능해요.',
  },
  {
    title: '팀원 모집 & 지원',
    desc: '공모전, 프로젝트, 스터디 등 원하는 활동을 등록하고 지원서를 주고받으세요.',
  },
  {
    title: 'AI 팀메이트 추천',
    desc: '관심사와 활동 이력을 분석해 나에게 맞는 팀과 팀원을 챗봇이 추천해줘요.',
  },
  {
    title: '실시간 채팅',
    desc: '매칭 후 바로 대화를 시작해 일정과 역할을 빠르게 조율할 수 있어요.',
  },
  {
    title: '액티비티 이벤트',
    desc: '학교 안팎의 모임, 이벤트 정보를 확인하고 손쉽게 참여 신청하세요.',
  },
  {
    title: '북마크 & 알림',
    desc: '관심있는 모집글을 저장하고 지원 현황을 실시간 알림으로 받아보세요.',
  },
]

export default function Features() {
  return (
    <section id="features" className="bg-brand-50/60 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-500">
            Features
          </span>
          <h2 className="mt-3 text-3xl font-bold text-brand-900 sm:text-4xl">
            MateOn
          </h2>
          <p className="mt-4 text-brand-700">
            MateOn 소개
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-brand-100 bg-white p-7 transition-shadow hover:shadow-lg hover:shadow-brand-900/5"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-sm font-bold text-brand-600">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-5 text-lg font-bold text-brand-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-600">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
