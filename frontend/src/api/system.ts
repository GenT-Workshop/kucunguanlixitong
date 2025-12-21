import type {
  ApiResponse,
  PaginatedData,
  SystemUser,
  UserListParams,
  UserCreateParams,
  UserUpdateParams,
} from './types'

// API 基础路径
const API_BASE = '/api'

// 通用请求方法
async function request<T>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    ...options,
  })
  return response.json()
}

// ==================== 用户管理接口 ====================

/**
 * 获取用户列表
 */
export async function getUserList(
  params: UserListParams = {}
): Promise<ApiResponse<PaginatedData<SystemUser>>> {
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.page_size) query.set('page_size', String(params.page_size))
  if (params.search) query.set('search', params.search)
  if (params.is_staff !== undefined) query.set('is_staff', String(params.is_staff))
  if (params.is_active !== undefined) query.set('is_active', String(params.is_active))
  return request<PaginatedData<SystemUser>>(`/users/?${query.toString()}`)
}

/**
 * 获取用户详情
 */
export async function getUserDetail(id: number): Promise<ApiResponse<SystemUser>> {
  return request<SystemUser>(`/users/${id}/`)
}

/**
 * 创建用户
 */
export async function createUser(params: UserCreateParams): Promise<ApiResponse<SystemUser>> {
  return request<SystemUser>('/users/create/', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

/**
 * 更新用户
 */
export async function updateUser(
  id: number,
  params: UserUpdateParams
): Promise<ApiResponse<SystemUser>> {
  return request<SystemUser>(`/users/${id}/update/`, {
    method: 'PUT',
    body: JSON.stringify(params),
  })
}

/**
 * 删除用户
 */
export async function deleteUser(id: number): Promise<ApiResponse<null>> {
  return request<null>(`/users/${id}/delete/`, {
    method: 'DELETE',
  })
}

/**
 * 重置用户密码
 */
export async function resetUserPassword(
  id: number,
  newPassword: string
): Promise<ApiResponse<null>> {
  return request<null>(`/users/${id}/reset-password/`, {
    method: 'POST',
    body: JSON.stringify({ new_password: newPassword }),
  })
}

// 导出所有接口
export default {
  getUserList,
  getUserDetail,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
}
