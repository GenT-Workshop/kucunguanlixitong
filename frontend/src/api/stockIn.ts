import type {
  ApiResponse,
  PaginatedData,
  Stock,
  StockIn,
  StockInParams,
  StockInListParams,
} from './types'
import { request } from './client'

// 入库 API（连接后端）
export const stockInApi = {
  // 创建入库记录
  create(params: StockInParams): Promise<ApiResponse<StockIn>> {
    return request.post<StockIn>('/stock-in/', params)
  },

  // 获取入库记录列表
  getList(params?: StockInListParams): Promise<ApiResponse<PaginatedData<StockIn>>> {
    return request.get<PaginatedData<StockIn>>('/stock-in/', { params })
  },

  // 获取入库记录详情
  getDetail(id: number): Promise<ApiResponse<StockIn>> {
    return request.get<StockIn>(`/stock-in/${id}/`)
  },
}

// 库存 API（用于获取物料列表）
export const stockApi = {
  // 物料初始化
  init(params: {
    material_code: string
    material_name: string
    max_stock?: number
    min_stock?: number
    stock_value?: number
  }): Promise<ApiResponse<Stock>> {
    return request.post<Stock>('/stock/init/', params)
  },

  // 获取库存列表
  getList(params?: { page?: number; page_size?: number; search?: string }): Promise<ApiResponse<PaginatedData<Stock>>> {
    return request.get<PaginatedData<Stock>>('/stock/', { params })
  },

  // 获取库存详情
  getDetail(id: number): Promise<ApiResponse<Stock>> {
    return request.get<Stock>(`/stock/${id}/`)
  },
}
