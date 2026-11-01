import Topbar from '../components/Topbar'
import CTA from '../components/CTA'
import DeadlineEvents from '../components/DeadlineEvents'
import WhyMateOn from '../components/WhyMateOn'
import HowItWorks from '../components/HowItWorks'
import Dreamy from '../components/Dreamy'
import AwardCTA from '../components/AwardCTA'
import Footer from '../components/Footer'
import SectionIndicator from '../components/SectionIndicator'

// 좌측 섹션 인디케이터에 표시할 섹션 (id는 아래 각 섹션을 감싼 div의 id)
const SECTIONS = [
  { id: 'landing-intro', label: '소개' },
  { id: 'landing-deadline', label: '마감 임박 활동' },
  { id: 'landing-how', label: '팀 빌딩 3단계' },
  { id: 'landing-dreamy', label: '드림이' },
  { id: 'landing-why', label: 'Why MateOn' },
  { id: 'landing-start', label: '시작하기' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <div>
        <Topbar />
        <SectionIndicator sections={SECTIONS} />
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
