import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { UserProvider } from './context/UserContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import StockIn from './pages/StockIn'
import './styles/theme.css'

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/stock-in" element={<StockIn />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  )
}

export default App
