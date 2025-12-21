import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { UserProvider } from './context/UserContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Dashboard from './pages/Dashboard'
import StockIn from './pages/StockIn'
import StockOut from './pages/StockOut'
import StockQuery from './pages/StockQuery'
import StockWarning from './pages/StockWarning'
import StockCount from './pages/StockCount'
import Statistics from './pages/Statistics'
import MonthlyReport from './pages/MonthlyReport'
import SystemManage from './pages/SystemManage'
import './styles/theme.css'

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/stock-in" element={<StockIn />} />
          <Route path="/stock-out" element={<StockOut />} />
          <Route path="/stock-query" element={<StockQuery />} />
          <Route path="/warning" element={<StockWarning />} />
          <Route path="/stock-count" element={<StockCount />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/monthly-report" element={<MonthlyReport />} />
          <Route path="/system" element={<SystemManage />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  )
}

export default App
