import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export interface User {
  id: string
  username: string
  email: string
  role: string
  avatar?: string
  joinDate: string
  lastLogin: string
}

interface UserContextType {
  user: User | null
  isLoggedIn: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; message: string }>
  logout: () => Promise<void>
  updateUser: (data: Partial<User>) => Promise<{ success: boolean; message: string }>
  fetchProfile: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

const STORAGE_KEY = 'user_data'
const API_BASE = '/api'

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)

  // 初始化时检查本地存储并尝试获取用户信息
  useEffect(() => {
    const savedUser = localStorage.getItem(STORAGE_KEY)
    if (savedUser) {
      setUser(JSON.parse(savedUser))
      // 尝试从后端获取最新用户信息
      fetchProfile()
    }
  }, [])

  // 获取用户信息
  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_BASE}/profile/`, {
        credentials: 'include',
      })
      const result = await response.json()
      if (result.code === 200 && result.data) {
        const userData: User = {
          id: String(result.data.id),
          username: result.data.username,
          email: result.data.email,
          role: result.data.is_staff ? '管理员' : '普通用户',
          joinDate: result.data.date_joined?.split(' ')[0] || '',
          lastLogin: result.data.last_login || '',
        }
        setUser(userData)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userData))
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
  }

  // 登录
  const login = async (username: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch(`${API_BASE}/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      })
      const result = await response.json()

      if (result.code === 200 && result.data) {
        const userData: User = {
          id: String(result.data.id),
          username: result.data.username,
          email: result.data.email,
          role: result.data.is_staff ? '管理员' : '普通用户',
          joinDate: new Date().toISOString().split('T')[0],
          lastLogin: new Date().toLocaleString('zh-CN'),
        }
        setUser(userData)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userData))
        return { success: true, message: result.message || '登录成功' }
      }

      return { success: false, message: result.message || '登录失败' }
    } catch (error) {
      console.error('登录请求失败:', error)
      return { success: false, message: '网络错误，请稍后重试' }
    }
  }

  // 注册
  const register = async (username: string, email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch(`${API_BASE}/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      })
      const result = await response.json()

      if (result.code === 200) {
        return { success: true, message: result.message || '注册成功' }
      }

      return { success: false, message: result.message || '注册失败' }
    } catch (error) {
      console.error('注册请求失败:', error)
      return { success: false, message: '网络错误，请稍后重试' }
    }
  }

  // 登出
  const logout = async () => {
    try {
      await fetch(`${API_BASE}/logout/`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('登出请求失败:', error)
    } finally {
      setUser(null)
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  // 更新用户信息
  const updateUser = async (data: Partial<User>): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch(`${API_BASE}/profile/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      })
      const result = await response.json()

      if (result.code === 200 && result.data) {
        const updatedUser: User = {
          ...user!,
          username: result.data.username,
          email: result.data.email,
        }
        setUser(updatedUser)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser))
        return { success: true, message: result.message || '更新成功' }
      }

      return { success: false, message: result.message || '更新失败' }
    } catch (error) {
      console.error('更新用户信息失败:', error)
      return { success: false, message: '网络错误，请稍后重试' }
    }
  }

  return (
    <UserContext.Provider value={{ user, isLoggedIn: !!user, login, register, logout, updateUser, fetchProfile }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
