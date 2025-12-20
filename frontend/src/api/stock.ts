import mockApi from '../mock/stock'
import type {
  ApiResponse,
  PaginatedData,
  Stock,
  StockIn,
  StockOut,
  StockInitParams,
  StockListParams,
  StockInCreateParams,
  StockInListParams,
  StockOutCreateParams,
  StockOutListParams,
} from './types'

// 是否使用 mock 数据（开发环境使用 mock，生产环境使用真实 API）
const USE_MOCK = false

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
    ...options,
  })
  return response.json()
}

// ==================== 库存接口 ====================

/**
 * 物料初始化
 */
export async function stockInit(params: StockInitParams): Promise<ApiResponse<Stock>> {
  if (USE_MOCK) {
    return mockApi.stockInit(params) as Promise<ApiResponse<Stock>>
  }
  return request<Stock>('/stock/init/', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

/**
 * 获取库存列表
 */
export async function getStockList(
  params: StockListParams = {}
): Promise<ApiResponse<PaginatedData<Stock>>> {
  if (USE_MOCK) {
    return mockApi.getStockList(params) as Promise<ApiResponse<PaginatedData<Stock>>>
  }
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.page_size) query.set('page_size', String(params.page_size))
  if (params.search) query.set('search', params.search)
  return request<PaginatedData<Stock>>(`/stock/?${query.toString()}`)
}

/**
 * 获取库存详情
 */
export async function getStockDetail(id: number): Promise<ApiResponse<Stock>> {
  if (USE_MOCK) {
    return mockApi.getStockDetail(id) as Promise<ApiResponse<Stock>>
  }
  return request<Stock>(`/stock/${id}/`)
}

// ==================== 入库接口 ====================

/**
 * 创建入库记录
 */
export async function createStockIn(
  params: StockInCreateParams
): Promise<ApiResponse<StockIn>> {
  if (USE_MOCK) {
    return mockApi.createStockIn(params) as Promise<ApiResponse<StockIn>>
  }
  return request<StockIn>('/stock-in/create/', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

/**
 * 获取入库记录列表
 */
export async function getStockInList(
  params: StockInListParams = {}
): Promise<ApiResponse<PaginatedData<StockIn>>> {
  if (USE_MOCK) {
    return mockApi.getStockInList(params) as Promise<ApiResponse<PaginatedData<StockIn>>>
  }
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.page_size) query.set('page_size', String(params.page_size))
  if (params.search) query.set('search', params.search)
  if (params.start_time) query.set('start_time', params.start_time)
  if (params.end_time) query.set('end_time', params.end_time)
  return request<PaginatedData<StockIn>>(`/stock-in/?${query.toString()}`)
}

/**
 * 获取入库记录详情
 */
export async function getStockInDetail(id: number): Promise<ApiResponse<StockIn>> {
  if (USE_MOCK) {
    return mockApi.getStockInDetail(id) as Promise<ApiResponse<StockIn>>
  }
  return request<StockIn>(`/stock-in/${id}/`)
}

// ==================== 出库接口 ====================

/**
 * 创建出库记录
 */
export async function createStockOut(
  params: StockOutCreateParams
): Promise<ApiResponse<StockOut>> {
  return request<StockOut>('/stock-out/create/', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

/**
 * 获取出库记录列表
 */
export async function getStockOutList(
  params: StockOutListParams = {}
): Promise<ApiResponse<PaginatedData<StockOut>>> {
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.page_size) query.set('page_size', String(params.page_size))
  if (params.search) query.set('search', params.search)
  if (params.out_type) query.set('out_type', params.out_type)
  if (params.start_time) query.set('start_time', params.start_time)
  if (params.end_time) query.set('end_time', params.end_time)
  return request<PaginatedData<StockOut>>(`/stock-out/?${query.toString()}`)
}

/**
 * 获取出库记录详情
 */
export async function getStockOutDetail(id: number): Promise<ApiResponse<StockOut>> {
  return request<StockOut>(`/stock-out/${id}/`)
}

/**
 * 删除出库记录
 */
export async function deleteStockOut(id: number): Promise<ApiResponse<null>> {
  return request<null>(`/stock-out/${id}/delete/`, {
    method: 'DELETE',
  })
}

// 导出所有接口
export default {
  stockInit,
  getStockList,
  getStockDetail,
  createStockIn,
  getStockInList,
  getStockInDetail,
  createStockOut,
  getStockOutList,
  getStockOutDetail,
  deleteStockOut,
}
