import Topbar from '../components/Topbar'
import CTA from '../components/CTA'
import DeadlineEvents from '../components/DeadlineEvents'
import WhyMateOn from '../components/WhyMateOn'
import HowItWorks from '../components/HowItWorks'
import Dreamy from '../components/Dreamy'
import AwardCTA from '../components/AwardCTA'
import Footer from '../components/Footer'

// 흰 배경 위의 빛번짐. 페이지 전체 높이 기준으로 흩어 놓는다.
// 위~중간은 살구색, 맨 아래 우하단은 파란색으로 끝나서 스크롤할수록 따뜻한 색 → 파란색으로 넘어간다.
// filter: blur 대신 radial-gradient의 감쇠만으로 번짐을 만들어서 스크롤 성능 부담이 없다.
// 배열 뒤쪽이 위에 그려지므로 파란색을 마지막에 둔다.
// 가장자리의 큰 빛번짐이 뼈대, 가운데 쪽의 작은 빛번짐은 글자 가독성을 위해 옅게 둔다.
const GLOWS: { top: string; left?: string; right?: string; size: number; rgb: string; alpha: number }[] = [
  // ── 살구색 (가장자리, 큼) ──
  { top: '-6%', left: '-14%', size: 920, rgb: '255, 198, 168', alpha: 0.62 },
  { top: '16%', right: '-16%', size: 840, rgb: '255, 214, 186', alpha: 0.58 },
  { top: '46%', left: '-12%', size: 780, rgb: '255, 206, 178', alpha: 0.48 },
  // 우하단 살구색은 조금 위·안쪽으로 당겨서 파란색과 겹치는 띠가 생기게 한다.
  { top: '64%', right: '-4%', size: 820, rgb: '255, 222, 196', alpha: 0.5 },
  // 좌하단: 우하단 파란색과 균형을 맞추는 살구색
  { top: '88%', left: '-10%', size: 760, rgb: '255, 214, 186', alpha: 0.5 },

  // ── 살구색 (가운데 쪽, 작고 옅음) ──
  { top: '4%', right: '22%', size: 480, rgb: '255, 222, 196', alpha: 0.38 },
  { top: '36%', right: '10%', size: 440, rgb: '255, 214, 186', alpha: 0.36 },
  { top: '58%', left: '22%', size: 520, rgb: '255, 222, 196', alpha: 0.34 },

  // ── 파란색 (배열 뒤쪽이 위에 그려지므로 마지막에 둔다) ──
  // 가장자리
  { top: '-4%', right: '-8%', size: 640, rgb: '186, 208, 255', alpha: 0.44 }, // 우상단 모서리
  { top: '34%', left: '-8%', size: 620, rgb: '190, 212, 255', alpha: 0.42 }, // 좌중간 (살구색 위쪽)
  { top: '68%', left: '-8%', size: 640, rgb: '186, 208, 255', alpha: 0.42 }, // 좌하단
  // 가운데 쪽
  { top: '26%', left: '34%', size: 560, rgb: '200, 220, 255', alpha: 0.42 },
  { top: '50%', right: '30%', size: 520, rgb: '190, 212, 255', alpha: 0.44 },
  { top: '74%', left: '40%', size: 460, rgb: '200, 220, 255', alpha: 0.4 },
  { top: '94%', left: '28%', size: 600, rgb: '190, 212, 255', alpha: 0.44 }, // 하단 중앙
  // 우하단 파란 빛번짐 (브랜드 블루 계열의 연한 하늘색)
  { top: '82%', right: '-12%', size: 980, rgb: '176, 204, 255', alpha: 0.66 },
]

export default function Landing() {
  return (
    <div className="relative isolate min-h-screen overflow-x-clip bg-white">
      {/* 배경 장식 — 콘텐츠 아래(-z-10), 래퍼의 흰 배경 위에 깔린다 */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {GLOWS.map((g, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              top: g.top,
              left: g.left,
              right: g.right,
              width: g.size,
              height: g.size,
              background: `radial-gradient(circle at center, rgba(${g.rgb}, ${g.alpha}) 0%, rgba(${g.rgb}, ${g.alpha * 0.55}) 32%, rgba(${g.rgb}, 0) 70%)`,
            }}
          />
        ))}
      </div>

      <div>
        <Topbar transparent />
        <main>
          <div id="landing-intro">
            <CTA />
          </div>
          <div id="landing-deadline">
            <DeadlineEvents />
          </div>
          <div id="landing-how">
            <HowItWorks />
          </div>
          <div id="landing-dreamy">
            <Dreamy />
          </div>
          <div id="landing-why">
            <WhyMateOn />
          </div>
          <div id="landing-start">
            <AwardCTA />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  )
}
