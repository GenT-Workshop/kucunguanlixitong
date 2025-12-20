// Mock 用户数据
export const mockUsers = [
  {
    id: 1,
    username: 'admin',
    password: '123456',
    email: 'admin@example.com',
    phone: '13800138000',
    location: '北京市',
    position: '系统管理员',
    role: '管理员',
    status: 'active',
    bio: '我是系统管理员，负责系统的日常维护和管理工作。',
    joinDate: '2024-01-01'
  },
  {
    id: 2,
    username: 'zhangsan',
    password: '123456',
    email: 'zhangsan@example.com',
    phone: '13800138001',
    location: '上海市',
    position: '高级前端工程师',
    role: '开发者',
    status: 'active',
    bio: '热爱前端开发，专注于 React 和 Vue 技术栈。',
    joinDate: '2024-01-15'
  },
  {
    id: 3,
    username: 'lisi',
    password: '123456',
    email: 'lisi@example.com',
    phone: '13800138002',
    location: '深圳市',
    position: '后端工程师',
    role: '开发者',
    status: 'active',
    bio: '专注于后端开发，擅长 Python 和 Django 框架。',
    joinDate: '2024-02-01'
  }
]

// 根据用户名查找用户
export const findUserByUsername = (username) => {
  return mockUsers.find(user => user.username === username)
}

// 验证用户登录
export const validateUser = (username, password) => {
  const user = findUserByUsername(username)
  if (!user) {
    return { success: false, message: '用户不存在' }
  }
  if (user.password !== password) {
    return { success: false, message: '密码错误' }
  }
  // 返回用户信息（不包含密码）
  const { password: _, ...userInfo } = user
  return { success: true, data: userInfo }
}
