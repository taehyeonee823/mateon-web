import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import CTA from './components/CTA'
import WhyMateOn from './components/WhyMateOn'
import HowItWorks from './components/HowItWorks'
import Dreamy from './components/Dreamy'
import Footer from './components/Footer'

function App() {
  return (
    <div className="min-h-screen bg-white">
      <Sidebar />
      <div className="md:pl-60">
        <Topbar />
        <main>
          <CTA />          
          <HowItWorks />
          <Dreamy />
          <WhyMateOn />

        </main>
        <Footer /> 
      </div>
    </div>
  )
}

export default App
