import type { ReactNode } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import Footer from './Footer'

// hideFooter: 채팅처럼 화면 높이에 딱 맞춰 자체 스크롤을 쓰는 페이지용.
// 풋터가 붙으면 뷰포트보다 전체 높이가 길어져서 입력창 등 하단 요소가 화면 밖으로 밀려난다.
export default function PageShell({
  children,
  hideFooter = false,
}: {
  children: ReactNode
  hideFooter?: boolean
}) {
  // hideFooter일 때는 min-height 대신 고정 h-screen을 써서 Safari에서
  // flex-grow + height:100% 체인이 종종 안 먹는 문제를 피한다.
  return (
    <div className={`bg-white ${hideFooter ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      <Sidebar />
      <div
        className={`flex flex-col md:pl-64 ${hideFooter ? 'h-screen overflow-hidden' : 'min-h-screen'}`}
      >
        <Topbar />
        <main className="min-h-0 flex-1">{children}</main>
        {!hideFooter && <Footer />}
      </div>
    </div>
  )
}
