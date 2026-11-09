import { Link } from 'react-router-dom'

const TEAM_POLAROIDS = [
  { label: '기획', photo: 'bg-[#FDEBDD]', tape: 'bg-[#F7DF9A]', rotate: '-rotate-3' },
  { label: '디자인', photo: 'bg-[#DCE6FB]', tape: 'bg-[#D3CFF5]', rotate: 'rotate-2' },
  { label: '발표', photo: 'bg-[#DDF3E4]', tape: 'bg-[#F7DF9A]', rotate: '-rotate-1' },
]

// 회원가입 첫 화면: 왼쪽은 코르크보드 일러스트, 오른쪽은 가입 방법 선택
export default function SignupWelcome({
  onKakao,
  onEmail,
  error,
}: {
  onKakao: () => void
  onEmail: () => void
  error: string | null
}) {
  return (
    <div className="flex min-h-screen overflow-hidden bg-white">
      <div
        className="relative hidden min-h-screen w-1/2 shrink-0 bg-[#DDC79C] lg:block"
        style={{
          backgroundImage: 'radial-gradient(rgba(120, 90, 40, 0.18) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      >
        <Link to="/" aria-label="MateOn 홈" className="absolute left-[8%] top-[6%]">
          <img src="/landing_img/logo.svg" alt="" className="h-12 w-auto" />
        </Link>

        {/* 메인 메모 */}
        <div className="absolute left-[31%] top-[18.5%] w-[60%] -rotate-2 bg-white px-[4%] py-[4%] font-handwriting shadow-lg shadow-black/20 stick-in" style={{ animationDelay: '100ms' }}>
          <span className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-[#C8352B] shadow pin-in" style={{ animationDelay: '500ms' }} />
          <p className="text-[clamp(1.75rem,3vw,2.75rem)] leading-[1.5] text-black">
            이번 공모전,
            <br />
            같이 나갈 사람?
          </p>
          <p className="mt-2 text-[clamp(1.1rem,1.7vw,1.6rem)] text-[#2554F0]">→ 메이트온에서 찾자!</p>
        </div>

        {/* 공모전 포스터 */}
        <div className="absolute left-[8%] top-[48%] aspect-[4/5] w-[26%] rotate-[8deg] bg-[#3F4FDB] p-[3%] text-white shadow-lg shadow-black/25 stick-in" style={{ animationDelay: '650ms' }}>
          <span className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-[#F08A24] shadow pin-in" style={{ animationDelay: '1050ms' }} />
          <p className="text-[clamp(0.7rem,1vw,0.875rem)] font-medium">2026 대학생 공모전</p>
          <p className="mt-[18%] text-[clamp(1.1rem,1.6vw,1.5rem)] font-semibold leading-tight">
            캠퍼스
            <br />
            챌린지
          </p>
          <span className="absolute bottom-[8%] left-[10%] rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#3F4FDB]">
            D-20
          </span>
        </div>

        {/* 포스트잇 */}
        <div className="absolute left-[50%] top-[51%] w-[31%] -rotate-3 bg-[#FBE38E] px-[4%] py-[3.5%] font-handwriting shadow-md shadow-black/20 stick-in" style={{ animationDelay: '1200ms' }}>
          <p className="text-[clamp(1.5rem,2.4vw,2.25rem)] leading-[1.5] text-black">
            디자이너
            <br />
            구해요!!
          </p>
        </div>

        {/* 우리 팀 폴라로이드 */}
        <div className="absolute bottom-[7%] left-[6%] w-[60%]">
          <span
            className="inline-block bg-[#FBF3DF] px-5 py-1.5 font-handwriting text-[clamp(1.25rem,1.8vw,1.6rem)] text-black shadow-sm stick-in-soft"
            style={{ animationDelay: '650ms' }}
          >
            우리 팀 (3/4)
          </span>
          <div className="mt-4 grid grid-cols-4 gap-[3%]">
            {TEAM_POLAROIDS.map((member, index) => (
              <div
                key={member.label}
                className={`relative bg-white p-[6%] shadow-md shadow-black/20 stick-in-soft ${member.rotate}`}
                style={{ animationDelay: `${1000 + index * 350}ms` }}
              >
                <span className={`absolute -top-2 left-1/2 h-3 w-1/3 -translate-x-1/2 ${member.tape}`} />
                <div className={`aspect-square ${member.photo}`} />
                <p className="mt-1 text-center font-handwriting text-base text-black">{member.label}</p>
              </div>
            ))}
            <div
              className="relative rotate-2 bg-white p-[6%] shadow-md shadow-black/20 stick-in-soft"
              style={{ animationDelay: '2050ms' }}
            >
              <span className="absolute -top-2 left-1/2 h-3 w-1/3 -translate-x-1/2 bg-[#D3CFF5]" />
              <div className="flex aspect-square items-center justify-center border-2 border-dashed border-[#3F4FDB] bg-[#EEF1FE] text-2xl font-bold text-[#3F4FDB]">
                ?
              </div>
              <p className="mt-1 whitespace-nowrap text-center font-handwriting text-base text-[#3F4FDB]">개발 구함!</p>
            </div>
          </div>
        </div>

        {/* 패널 경계에 걸쳐서 오른쪽 영역 위로 겹쳐 보이는 드림이 */}
        <img
          src="/landing_img/dreamyAward.png"
          alt=""
          className="absolute -right-[17%] bottom-[6%] z-10 w-[34%]"
        />
      </div>

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-[318px]">
          <Link to="/" aria-label="MateOn 홈" className="mb-8 block lg:hidden">
            <img src="/landing_img/logo.svg" alt="" className="h-10 w-auto" />
          </Link>

          <h1 className="text-2xl font-bold text-brand-900">MateOn 시작하기</h1>
          <p className="mt-2 text-base text-[#6F7095]">가입하고 공모전에 함께 나갈 팀원을 찾아보세요.</p>

          <button
            type="button"
            onClick={onKakao}
            className="mt-7 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#FAE100] text-sm font-medium text-black transition-opacity hover:opacity-90"
          >
            <img src="/landing_img/KakaoLogo.svg" alt="" className="h-4 w-4" />
            카카오 로그인
          </button>

          <div className="my-3 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-700">또는</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <button
            type="button"
            onClick={onEmail}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white text-sm font-medium text-black transition-colors hover:bg-slate-50"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
            이메일로 가입하기
          </button>

          {error && <p className="mt-3 text-center text-xs font-medium text-rose-500">{error}</p>}

          <p className="mt-6 text-center text-sm text-[#6F7095]">
            이미 계정이 있나요?
            <Link to="/login" className="ml-2 font-medium text-[#2554F0] underline">
              로그인
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
