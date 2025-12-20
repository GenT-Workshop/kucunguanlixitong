import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import type { ApiResponse } from './types'

// 是否启用 Mock 模式
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// 创建 axios 实例
const client: AxiosInstance = axios.create({
  baseURL: 'http://localhost:8111/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
client.interceptors.request.use(
  (config) => {
    // 添加 token 认证信息
    const token = 'admin123'
    if (token) {
      config.headers.Authorization = `Token ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
client.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<unknown>>) => {
    const { data } = response
    // 业务错误处理
    if (data.code !== 200) {
      console.error('API Error:', data.message)
      return Promise.reject(new Error(data.message))
    }
    return response
  },
  (error) => {
    // HTTP 错误处理
    console.error('HTTP Error:', error.message)
    return Promise.reject(error)
  }
)

// 封装请求方法
export const request = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return client.get(url, config).then((res) => res.data)
  },

  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return client.post(url, data, config).then((res) => res.data)
  },

  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return client.put(url, data, config).then((res) => res.data)
  },

  delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return client.delete(url, config).then((res) => res.data)
  },
}

export default client
