import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import CTA from '../components/CTA'
import WhyMateOn from '../components/WhyMateOn'
import HowItWorks from '../components/HowItWorks'
import Dreamy from '../components/Dreamy'
import AwardCTA from '../components/AwardCTA'
import Footer from '../components/Footer'

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <Sidebar />
      <div className="md:pl-64">
        <Topbar />
        <main>
          <CTA />
          <HowItWorks />
          <Dreamy />
          <WhyMateOn />
          <AwardCTA />
        </main>
        <Footer />
      </div>
    </div>
  )
}
