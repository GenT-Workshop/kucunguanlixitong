// API 响应类型
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

// 分页响应类型
export interface PaginatedData<T> {
  total: number
  page: number
  page_size: number
  list: T[]
}

// 库存类型
export interface Stock {
  id: number
  material_code: string
  material_name: string
  max_stock: number
  min_stock: number
  current_stock: number
  stock_value: string
  created_at: string
  updated_at: string
}

// 入库记录类型
export interface StockIn {
  id: number
  material_code: string
  material_name: string
  in_time: string
  in_quantity: number
  in_value: string
  created_at: string
}

// 物料初始化参数
export interface StockInitParams {
  material_code: string
  material_name: string
  max_stock?: number
  min_stock?: number
  stock_value?: number
}

// 库存列表查询参数
export interface StockListParams {
  page?: number
  page_size?: number
  search?: string
}

// 入库参数
export interface StockInCreateParams {
  material_code: string
  in_quantity: number
  in_value: number
  in_time?: string
}

// 入库列表查询参数
export interface StockInListParams {
  page?: number
  page_size?: number
  search?: string
  start_time?: string
  end_time?: string
}

// 出库记录类型
export interface StockOut {
  id: number
  material_code: string
  material_name: string
  out_time: string
  out_quantity: number
  out_value: string
  out_type: 'production' | 'sales' | 'other'
  out_type_display: string
  operator: string
  remark?: string
  created_at: string
}

// 出库参数
export interface StockOutCreateParams {
  material_code: string
  out_quantity: number
  out_value: number
  out_type: 'production' | 'sales' | 'other'
  out_time?: string
  operator?: string
  remark?: string
}

// 出库列表查询参数
export interface StockOutListParams {
  page?: number
  page_size?: number
  search?: string
  out_type?: string
  start_time?: string
  end_time?: string
}
