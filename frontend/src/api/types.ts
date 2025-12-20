// API 响应基础结构
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

// 分页响应结构
export interface PaginatedData<T> {
  total: number
  page: number
  page_size: number
  list: T[]
}

// 库存表类型
export interface Stock {
  id: number
  material_code: string
  material_name: string
  max_stock: number
  min_stock: number
  current_stock: number
  stock_value: string
  created_at?: string
  updated_at?: string
}

// 入库记录类型
export interface StockIn {
  id: number
  material_code: string
  material_name: string
  in_time: string
  in_quantity: number
  in_value: string
  created_at?: string
}

// 物料初始化请求参数
export interface StockInitParams {
  material_code: string
  material_name: string
  max_stock?: number
  min_stock?: number
  stock_value?: number
}

// 入库请求参数
export interface StockInParams {
  material_code: string
  in_quantity: number
  in_value: number
  in_time?: string
}

// 列表查询参数
export interface ListParams {
  page?: number
  page_size?: number
  search?: string
}

// 入库记录查询参数
export interface StockInListParams extends ListParams {
  start_time?: string
  end_time?: string
}
