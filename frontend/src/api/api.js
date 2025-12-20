// 真实后端 API 服务
const API_BASE_URL = 'http://127.0.0.1:8111'

// API 请求封装
const request = async (url, options = {}) => {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // 支持 cookie
  }

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  }

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, config)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || '请求失败')
    }

    return data
  } catch (error) {
    console.error('API 请求错误:', error)
    throw error
  }
}

// 真实 API 服务
const api = {
  // 登录接口
  login: async (username, password) => {
    try {
      const response = await request('/api/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      })

      if (response.success) {
        // 保存登录状态到 localStorage
        localStorage.setItem('username', username)
        localStorage.setItem('isLoggedIn', 'true')

        // 保存用户信息（包括邮箱）
        if (response.data) {
          const userInfo = {
            username: username,
            email: response.data.email || `${username}@example.com`,
            phone: '138****8888',
            location: '北京市',
            position: '开发工程师',
            role: '用户',
            status: 'active',
            bio: '这是一段个人简介。',
            joinDate: new Date().toISOString().split('T')[0]
          }
          localStorage.setItem('userInfo', JSON.stringify(userInfo))
        }

        return {
          success: true,
          message: response.message || '登录成功',
          data: {
            username: username,
          }
        }
      } else {
        throw new Error(response.message || '登录失败')
      }
    } catch (error) {
      throw new Error(error.message || '登录失败，请检查用户名和密码')
    }
  },

  // 退出登录接口
  logout: async () => {
    // 清除登录状态
    localStorage.removeItem('username')
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('userInfo')

    return {
      success: true,
      message: '退出登录成功'
    }
  },

  // 获取当前用户信息
  getCurrentUser: async () => {
    const username = localStorage.getItem('username')
    const isLoggedIn = localStorage.getItem('isLoggedIn')

    if (!username || !isLoggedIn) {
      throw new Error('未登录')
    }

    // 从 localStorage 获取用户信息，如果没有则返回基本信息
    const userInfoStr = localStorage.getItem('userInfo')
    if (userInfoStr) {
      return {
        success: true,
        data: JSON.parse(userInfoStr)
      }
    }

    // 返回基本用户信息
    return {
      success: true,
      data: {
        username: username,
        email: `${username}@example.com`,
        phone: '138****8888',
        location: '北京市',
        position: '开发工程师',
        role: '用户',
        status: 'active',
        bio: '这是一段个人简介。',
        joinDate: new Date().toISOString().split('T')[0]
      }
    }
  },

  // 更新用户信息
  updateUserInfo: async (updates) => {
    const username = localStorage.getItem('username')
    if (!username) {
      throw new Error('未登录')
    }

    // 获取当前用户信息
    const userInfoStr = localStorage.getItem('userInfo')
    let userInfo = {}

    if (userInfoStr) {
      userInfo = JSON.parse(userInfoStr)
    } else {
      userInfo = {
        username: username,
        email: `${username}@example.com`,
        phone: '138****8888',
        location: '北京市',
        position: '开发工程师',
        role: '用户',
        status: 'active',
        bio: '这是一段个人简介。',
        joinDate: new Date().toISOString().split('T')[0]
      }
    }

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
    try {
      const response = await request('/api/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      })

      if (response.success) {
        // 注册成功后保存用户信息到 localStorage
        localStorage.setItem('username', userData.username)
        localStorage.setItem('isLoggedIn', 'true')

        // 保存用户信息（包括注册时填写的邮箱）
        const userInfo = {
          username: userData.username,
          email: userData.email || `${userData.username}@example.com`,
          phone: '138****8888',
          location: '北京市',
          position: '开发工程师',
          role: '用户',
          status: 'active',
          bio: '这是一段个人简介。',
          joinDate: new Date().toISOString().split('T')[0]
        }
        localStorage.setItem('userInfo', JSON.stringify(userInfo))
      }

      return {
        success: true,
        message: response.message || '注册成功',
        data: response.data
      }
    } catch (error) {
      throw new Error(error.message || '注册失败')
    }
  }
}

export default api
