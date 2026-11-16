import Topbar from '../components/Topbar'
import CTA from '../components/CTA'
import DeadlineEvents from '../components/DeadlineEvents'
import WhyMateOn from '../components/WhyMateOn'
import HowItWorks from '../components/HowItWorks'
import Dreamy from '../components/Dreamy'
import AwardCTA from '../components/AwardCTA'
import Footer from '../components/Footer'

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <div>
        <Topbar />
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
