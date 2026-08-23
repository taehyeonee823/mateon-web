import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import MyPage from './pages/MyPage'
import PasswordChange from './pages/PasswordChange'
import EditProfile from './pages/EditProfile'
import Contest from './pages/Contest'
import ContestDetail from './pages/ContestDetail'
import External from './pages/External'
import PageShell from './components/PageShell'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/my" element={<MyPage />} />
      <Route path="/pwchange" element={<PasswordChange />} />
      <Route path="/editprofile" element={<EditProfile />} />
      <Route
        path="/contest"
        element={
          <PageShell>
            <Contest />
          </PageShell>
        }
      />
      <Route
        path="/contest/:id"
        element={
          <PageShell>
            <ContestDetail />
          </PageShell>
        }
      />
      <Route
        path="/external"
        element={
          <PageShell>
            <External />
          </PageShell>
        }
      />
    </Routes>
  )
}

export default App
