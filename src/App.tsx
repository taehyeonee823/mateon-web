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
import TeamReview from './pages/TeamReview'
import PasswordChange from './pages/PasswordChange'
import EditProfile from './pages/EditProfile'
import Contest from './pages/Contest'
import ContestDetail from './pages/ContestDetail'
import External from './pages/External'
import PageShell from './components/PageShell'
import Chat from './pages/Chat'
import CreateTeamInfo from './pages/CreateTeamInfo'
import CreateTeamPosition from './pages/CreateTeamPosition'
import CreateTeamPreview from './pages/CreateTeamPreview'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/oauth/kakao/callback" element={<KakaoCallback />} />
      <Route path="/my" element={<MyPage />} />
      <Route path="/my/applications" element={<MyApplications />} />
      <Route path="/my/teams" element={<MyTeams />} />
      <Route path="/my/bookmarks" element={<MyBookmarks />} />
      <Route path="/my/review" element={<TeamReview />} />
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
        <Route path="/contest/:id" element={<ContestDetail />} />
        <Route path="/external" element={<External />} />
        <Route path="/external/:id" element={<ContestDetail />} />

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
  )
}

export default App