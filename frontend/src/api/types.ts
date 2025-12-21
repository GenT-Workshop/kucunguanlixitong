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

// ==================== 预警类型 ====================

// 预警类型
export type WarningType = 'low' | 'high'

// 预警级别
export type WarningLevel = 'warning' | 'danger'

// 预警状态
export type WarningStatus = 'pending' | 'handled' | 'ignored'

// 预警记录类型
export interface StockWarning {
  id: number
  material_code: string
  material_name: string
  warning_type: WarningType
  warning_type_display: string
  level: WarningLevel
  level_display: string
  current_stock: number
  min_stock: number
  max_stock: number
  status: WarningStatus
  status_display: string
  handled_by: string
  handled_at: string | null
  remark: string
  created_at: string
}

// 预警列表查询参数
export interface WarningListParams {
  page?: number
  page_size?: number
  search?: string
  warning_type?: WarningType
  level?: WarningLevel
  status?: WarningStatus
}

// 预警处理参数
export interface WarningHandleParams {
  action: 'handle' | 'ignore'
  handled_by?: string
  remark?: string
}

// 预警统计
export interface WarningStatistics {
  by_type: {
    low: number
    high: number
  }
  by_level: {
    warning: number
    danger: number
  }
  by_status: {
    pending: number
    handled: number
    ignored: number
  }
  total: number
}

// 预警检查结果
export interface WarningCheckResult {
  new_count: number
  new_warnings: {
    id: number
    material_code: string
    material_name: string
    warning_type: WarningType
    level: WarningLevel
  }[]
}

// ==================== 盘点类型 ====================

// 盘点任务状态
export type StockCountTaskStatus = 'pending' | 'doing' | 'done' | 'cancelled'

// 差异类型
export type DiffType = 'gain' | 'loss' | 'none'

// 盘点任务
export interface StockCountTask {
  id: number
  task_no: string
  status: StockCountTaskStatus
  status_display: string
  created_by: string
  remark: string
  created_at: string
  completed_at: string | null
  item_count: number
  counted_count: number
  items?: StockCountItem[]
}

// 盘点明细
export interface StockCountItem {
  id: number
  material_code: string
  material_name: string
  book_qty: number
  real_qty: number | null
  diff_qty: number
  diff_type: DiffType
  diff_type_display: string
  remark: string
  operator: string
  operated_at: string | null
}

// 盘点任务列表查询参数
export interface StockCountTaskListParams {
  page?: number
  page_size?: number
  status?: StockCountTaskStatus
}

// 创建盘点任务参数
export interface StockCountTaskCreateParams {
  created_by: string
  remark?: string
}

// 提交盘点明细参数
export interface StockCountItemSubmitParams {
  item_id: number
  real_qty: number
  operator?: string
  remark?: string
}

// 盘点完成结果
export interface StockCountCompleteResult {
  task_no: string
  adjust_count: number
  adjust_records: {
    material_code: string
    type: 'gain' | 'loss'
    qty: number
    bill_no: string
  }[]
}

// ==================== 统计分析类型 ====================

// 统计概览
export interface StatisticsOverview {
  stock: {
    total_count: number
    total_value: string
    total_qty: number
    status_distribution: {
      low: number
      normal: number
      high: number
    }
  }
  today_in: {
    count: number
    qty: number
    value: string
  }
  today_out: {
    count: number
    qty: number
    value: string
  }
  pending_warnings: number
}

// 出入库趋势数据项
export interface TrendDataItem {
  date: string
  in_qty: number
  in_value: string
  in_count: number
  out_qty: number
  out_value: string
  out_count: number
}

// 排行数据项
export interface RankingItem {
  rank: number
  material_code: string
  material_name: string
  total_qty: number
  total_value: string
}

// 排行结果
export interface RankingResult {
  type: 'in' | 'out'
  order_by: 'qty' | 'value'
  days: number
  list: RankingItem[]
}

// 类别统计项
export interface CategoryStatItem {
  category: string
  count: number
  total_qty: number
  total_value: string
}

// ==================== 月底结存类型 ====================

// 月度汇总项
export interface MonthlyReportItem {
  month: string
  in_qty: number
  in_value: string
  in_count: number
  out_qty: number
  out_value: string
  out_count: number
}

// 月度详情物料项
export interface MonthlyDetailItem {
  material_code: string
  material_name: string
  in_qty: number
  in_value: string
  out_qty: number
  out_value: string
  current_stock: number
  stock_value: string
}

// 月度详情结果
export interface MonthlyReportDetail {
  month: string
  summary: {
    total_in_qty: number
    total_in_value: string
    total_out_qty: number
    total_out_value: string
    material_count: number
  }
  details: MonthlyDetailItem[]
}

// ==================== 系统管理类型 ====================

// 系统用户
export interface SystemUser {
  id: number
  username: string
  email: string
  is_staff: boolean
  is_active: boolean
  date_joined: string
  last_login: string | null
}

// 用户列表查询参数
export interface UserListParams {
  page?: number
  page_size?: number
  search?: string
  is_staff?: boolean
  is_active?: boolean
}

// 创建用户参数
export interface UserCreateParams {
  username: string
  email: string
  password: string
  is_staff?: boolean
  is_active?: boolean
}

// 更新用户参数
export interface UserUpdateParams {
  username?: string
  email?: string
  is_staff?: boolean
  is_active?: boolean
}
