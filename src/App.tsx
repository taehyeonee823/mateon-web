import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import CTA from './components/CTA'
import WhyMateOn from './components/WhyMateOn'
import HowItWorks from './components/HowItWorks'
import Dreamy from './components/Dreamy'
import Footer from './components/Footer'
import Contest from './pages/Contest'
import External from './pages/External'
import ContestDetail from './pages/ContestDetail'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white">
        <Sidebar />
        <div className="md:pl-60">
          <Topbar />
          <main>
            <Routes>
              <Route
                path="/"
                element={
                  <>
                    <CTA />
                    <HowItWorks />
                    <Dreamy />
                    <WhyMateOn />
                  </>
                }
              />
              <Route path="/contest" element={<Contest />} />
              <Route path="/contest/:id" element={<ContestDetail />} />
              <Route path="/external" element={<External />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App