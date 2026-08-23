import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import MyPage from './pages/MyPage'
import PasswordChange from './pages/PasswordChange'
import EditProfile from './pages/EditProfile'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/my" element={<MyPage />} />
      <Route path="/pwchange" element={<PasswordChange />} />
      <Route path="/editprofile" element={<EditProfile />} />
    </Routes>
  )
}

export default App
