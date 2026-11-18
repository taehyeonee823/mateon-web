import Topbar from '../components/Topbar'
import CTA from '../components/CTA'
import DeadlineEvents from '../components/DeadlineEvents'
import WhyMateOn from '../components/WhyMateOn'
import HowItWorks from '../components/HowItWorks'
import Dreamy from '../components/Dreamy'
import AwardCTA from '../components/AwardCTA'
import Footer from '../components/Footer'

// 흰 배경 위에 살구색 빛번짐. 페이지 전체 높이 기준으로 네 군데에 흩어 놓는다.
// filter: blur 대신 radial-gradient의 감쇠만으로 번짐을 만들어서 스크롤 성능 부담이 없다.
const GLOWS: { top: string; left?: string; right?: string; size: number; rgb: string; alpha: number }[] = [
  { top: '-6%', left: '-14%', size: 920, rgb: '255, 198, 168', alpha: 0.62 },
  { top: '16%', right: '-16%', size: 840, rgb: '255, 214, 186', alpha: 0.58 },
  { top: '46%', left: '-12%', size: 780, rgb: '255, 206, 178', alpha: 0.48 },
  { top: '72%', right: '-10%', size: 900, rgb: '255, 222, 196', alpha: 0.58 },
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
