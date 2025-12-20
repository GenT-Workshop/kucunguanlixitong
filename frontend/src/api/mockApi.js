import { validateUser, findUserByUsername } from '../mock/users'

// 模拟网络延迟
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Mock API 服务
const mockApi = {
  // 登录接口
  login: async (username, password) => {
    // 模拟网络延迟
    await delay(800)

    // 验证用户
    const result = validateUser(username, password)

    if (result.success) {
      // 保存登录状态到 localStorage
      localStorage.setItem('token', `mock-token-${Date.now()}`)
      localStorage.setItem('username', username)
      localStorage.setItem('userInfo', JSON.stringify(result.data))

      return {
        success: true,
        message: '登录成功',
        data: {
          username: result.data.username,
          token: localStorage.getItem('token'),
          userInfo: result.data
        }
      }
    } else {
      throw new Error(result.message)
    }
  },

  // 退出登录接口
  logout: async () => {
    await delay(300)

    // 清除登录状态
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('userInfo')

    return {
      success: true,
      message: '退出登录成功'
    }
  },

  // 获取当前用户信息
  getCurrentUser: async () => {
    await delay(300)

    const username = localStorage.getItem('username')
    const token = localStorage.getItem('token')

    if (!username || !token) {
      throw new Error('未登录')
    }

    const user = findUserByUsername(username)
    if (!user) {
      throw new Error('用户不存在')
    }

    const { password: _, ...userInfo } = user
    return {
      success: true,
      data: userInfo
    }
  },

  // 更新用户信息
  updateUserInfo: async (updates) => {
    await delay(500)

    const username = localStorage.getItem('username')
    if (!username) {
      throw new Error('未登录')
    }

    // 获取当前用户信息
    const userInfoStr = localStorage.getItem('userInfo')
    if (!userInfoStr) {
      throw new Error('用户信息不存在')
    }

    const userInfo = JSON.parse(userInfoStr)
    const updatedUserInfo = { ...userInfo, ...updates }

    // 保存更新后的用户信息
    localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo))

    return {
      success: true,
      message: '更新成功',
      data: updatedUserInfo
    }
  },

  // 注册接口
  register: async (userData) => {
    await delay(800)

    const { username, password, email } = userData

    // 检查用户名是否已存在
    const existingUser = findUserByUsername(username)
    if (existingUser) {
      throw new Error('用户名已存在')
    }

    // 模拟注册成功
    return {
      success: true,
      message: '注册成功',
      data: {
        username,
        email
      }
    }
  }
}

export default mockApi
