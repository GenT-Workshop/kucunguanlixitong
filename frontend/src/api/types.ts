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

// 库存状态类型
export type StockStatus = 'low' | 'normal' | 'high'

// 库存类型
export interface Stock {
  id: number
  material_code: string
  material_name: string
  spec: string
  unit: string
  category: string
  supplier: string
  max_stock: number
  min_stock: number
  current_stock: number
  unit_price: string
  stock_value: string
  status: 'active' | 'inactive'
  stock_status: StockStatus
  stock_status_display: string
  created_at: string
  updated_at: string
}

// 入库类型
export type StockInType = 'purchase' | 'production' | 'return' | 'other' | 'adjust_gain'

// 入库记录类型
export interface StockIn {
  id: number
  bill_no: string
  material_code: string
  material_name: string
  supplier: string
  in_time: string
  in_quantity: number
  in_value: string
  in_type: StockInType
  in_type_display: string
  operator: string
  remark: string
  created_at: string
  // 创建成功后返回的库存状态
  current_stock?: number
  stock_status?: StockStatus
  stock_status_display?: string
}

// 物料初始化参数
export interface StockInitParams {
  material_code: string
  material_name: string
  spec?: string
  unit?: string
  category?: string
  supplier?: string
  max_stock?: number
  min_stock?: number
  unit_price?: number
  stock_value?: number
}

// 库存列表查询参数
export interface StockListParams {
  page?: number
  page_size?: number
  search?: string
  supplier?: string
  category?: string
  status?: string
  stock_status?: StockStatus
}

// 入库参数
export interface StockInCreateParams {
  material_code: string
  in_quantity: number
  in_value: number
  in_type?: StockInType
  in_time?: string
  supplier?: string
  operator?: string
  remark?: string
}

// 入库列表查询参数
export interface StockInListParams {
  page?: number
  page_size?: number
  search?: string
  in_type?: StockInType
  supplier?: string
  bill_no?: string
  operator?: string
  start_time?: string
  end_time?: string
}

// 出库类型
export type StockOutType = 'production' | 'sales' | 'other' | 'adjust_loss'

// 出库记录类型
export interface StockOut {
  id: number
  bill_no: string
  material_code: string
  material_name: string
  out_time: string
  out_quantity: number
  out_value: string
  out_type: StockOutType
  out_type_display: string
  operator: string
  remark?: string
  created_at: string
  // 创建成功后返回的库存状态
  current_stock?: number
  stock_status?: StockStatus
  stock_status_display?: string
}

// 出库参数
export interface StockOutCreateParams {
  material_code: string
  out_quantity: number
  out_value: number
  out_type: StockOutType
  out_time?: string
  operator?: string
  remark?: string
}

// 出库列表查询参数
export interface StockOutListParams {
  page?: number
  page_size?: number
  search?: string
  out_type?: StockOutType
  bill_no?: string
  operator?: string
  start_time?: string
  end_time?: string
}
