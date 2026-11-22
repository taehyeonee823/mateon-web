import { Routes, Route, Outlet } from 'react-router-dom'
import { CreateTeamProvider } from './context/CreateTeam' 
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import KakaoCallback from './pages/KakaoCallback'
import MyPage from './pages/MyPage'
import MyApplications from './pages/MyApplications'
import MyTeams from './pages/MyTeams'
import MyBookmarks from './pages/MyBookmarks'
import AccountSettings from './pages/AccountSettings'
import TeamReview from './pages/TeamReview'
import PasswordChange from './pages/PasswordChange'
import EditProfile from './pages/EditProfile'
import Contest from './pages/Contest'
import CreateContest from './pages/CreateContest'
import ContestDetail from './pages/ContestDetail'
import External from './pages/External'
import PageShell from './components/PageShell'
import Chat from './pages/Chat'
import CreateTeamInfo from './pages/CreateTeamInfo'
import CreateTeamPosition from './pages/CreateTeamPosition'
import CreateTeamPreview from './pages/CreateTeamPreview'
import Teams from './pages/Teams'
import TeamDetail from './pages/TeamDetail'
import TeamEdit from './pages/TeamEdit'
import ChatPanel from './components/chat/ChatPanel'
import NotificationPanel from './components/NotificationPanel'
import { SidePanelProvider } from './context/SidePanel'
import { NotificationsProvider } from './context/Notifications'

function App() {
  return (
    <SidePanelProvider>
    <NotificationsProvider>
    {/* 채팅/알림 패널이 열리면 페이지는 왼쪽 컬럼으로 줄어들고 오른쪽에 패널이 붙는다 */}
    <div className="flex min-h-screen">
    <div className="min-w-0 flex-1">
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/oauth/kakao/callback" element={<KakaoCallback />} />
      <Route path="/my" element={<MyPage />} />
      <Route path="/my/applications" element={<MyApplications />} />
      <Route path="/my/teams" element={<MyTeams />} />
      <Route path="/my/teams/:id" element={<TeamDetail />} />
      <Route path="/my/teams/:id/edit" element={<TeamEdit />} />
      <Route path="/my/bookmarks" element={<MyBookmarks />} />
      <Route path="/my/review" element={<TeamReview />} />
      <Route path="/my/settings" element={<AccountSettings />} />
      <Route path="/pwchange" element={<PasswordChange />} />
      <Route path="/editprofile" element={<EditProfile />} />

      {/* 채팅은 뷰포트 높이에 딱 맞는 자체 스크롤 레이아웃이라 풋터 없이 별도로 감싼다 */}
      <Route
        path="/chat"
        element={
          <PageShell hideFooter>
            <Chat />
          </PageShell>
        }
      />

      {/* PageShell로 감싸는 라우트 그룹 */}
      <Route
        element={
          <PageShell>
            <Outlet />
          </PageShell>
        }
      >
        <Route path="/contest" element={<Contest />} />
        <Route path="/contest/new" element={<CreateContest category="CONTEST" />} />
        <Route path="/contest/:id" element={<ContestDetail />} />
        <Route path="/external" element={<External />} />
        <Route path="/external/new" element={<CreateContest category="EXTERNAL" />} />
        <Route path="/external/:id" element={<ContestDetail />} />
        <Route path="/teams" element={<Teams />} />

        {/* 2. 팀 생성 관련 페이지들만 CreateTeamProvider로 한 번 더 감싸줍니다 */}
        <Route 
          element={
            <CreateTeamProvider>
              <Outlet />
            </CreateTeamProvider>
          }
        >
          <Route path="/teams/new" element={<CreateTeamInfo />} />
          <Route path="/teams/new/position" element={<CreateTeamPosition />} />
          <Route path="/teams/new/preview" element={<CreateTeamPreview />} />
        </Route>
      </Route>
    </Routes>
    </div>
    <ChatPanel />
    <NotificationPanel />
    </div>
    </NotificationsProvider>
    </SidePanelProvider>
  )
}

export default App