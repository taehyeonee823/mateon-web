import type { ReactNode } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import Footer from './Footer'

export default function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <Sidebar />
      <div className="md:pl-60">
        <Topbar />
        <main>{children}</main>
        <Footer />
      </div>
    </div>
  )
}
