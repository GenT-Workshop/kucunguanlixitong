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
  StockWarning,
  WarningListParams,
  WarningHandleParams,
  WarningStatistics,
  WarningCheckResult,
  StockCountTask,
  StockCountTaskListParams,
  StockCountTaskCreateParams,
  StockCountItemSubmitParams,
  StockCountCompleteResult,
  StatisticsOverview,
  TrendDataItem,
  RankingResult,
  CategoryStatItem,
  MonthlyReportItem,
  MonthlyReportDetail,
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
  if (params.supplier) query.set('supplier', params.supplier)
  if (params.category) query.set('category', params.category)
  if (params.status) query.set('status', params.status)
  if (params.stock_status) query.set('stock_status', params.stock_status)
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
  if (params.in_type) query.set('in_type', params.in_type)
  if (params.supplier) query.set('supplier', params.supplier)
  if (params.bill_no) query.set('bill_no', params.bill_no)
  if (params.operator) query.set('operator', params.operator)
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

/**
 * 删除/撤销入库记录
 */
export async function deleteStockIn(id: number): Promise<ApiResponse<null>> {
  return request<null>(`/stock-in/${id}/delete/`, {
    method: 'DELETE',
  })
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
  if (params.bill_no) query.set('bill_no', params.bill_no)
  if (params.operator) query.set('operator', params.operator)
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
 * 删除/撤销出库记录
 */
export async function deleteStockOut(id: number): Promise<ApiResponse<null>> {
  return request<null>(`/stock-out/${id}/delete/`, {
    method: 'DELETE',
  })
}

// ==================== 预警接口 ====================

/**
 * 获取预警列表
 */
export async function getWarningList(
  params: WarningListParams = {}
): Promise<ApiResponse<PaginatedData<StockWarning>>> {
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.page_size) query.set('page_size', String(params.page_size))
  if (params.search) query.set('search', params.search)
  if (params.warning_type) query.set('warning_type', params.warning_type)
  if (params.level) query.set('level', params.level)
  if (params.status) query.set('status', params.status)
  return request<PaginatedData<StockWarning>>(`/warnings/?${query.toString()}`)
}

/**
 * 处理预警
 */
export async function handleWarning(
  id: number,
  params: WarningHandleParams
): Promise<ApiResponse<StockWarning>> {
  return request<StockWarning>(`/warnings/${id}/handle/`, {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

/**
 * 获取预警统计
 */
export async function getWarningStatistics(): Promise<ApiResponse<WarningStatistics>> {
  return request<WarningStatistics>('/warnings/statistics/')
}

/**
 * 检查并生成预警
 */
export async function checkWarnings(): Promise<ApiResponse<WarningCheckResult>> {
  return request<WarningCheckResult>('/warnings/check/', {
    method: 'POST',
  })
}

// ==================== 盘点接口 ====================

/**
 * 获取盘点任务列表
 */
export async function getStockCountTaskList(
  params: StockCountTaskListParams = {}
): Promise<ApiResponse<PaginatedData<StockCountTask>>> {
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.page_size) query.set('page_size', String(params.page_size))
  if (params.status) query.set('status', params.status)
  return request<PaginatedData<StockCountTask>>(`/stock-count/tasks/?${query.toString()}`)
}

/**
 * 创建盘点任务
 */
export async function createStockCountTask(
  params: StockCountTaskCreateParams
): Promise<ApiResponse<StockCountTask>> {
  return request<StockCountTask>('/stock-count/tasks/create/', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

/**
 * 获取盘点任务详情
 */
export async function getStockCountTaskDetail(id: number): Promise<ApiResponse<StockCountTask>> {
  return request<StockCountTask>(`/stock-count/tasks/${id}/`)
}

/**
 * 提交盘点明细
 */
export async function submitStockCountItem(
  params: StockCountItemSubmitParams
): Promise<ApiResponse<unknown>> {
  return request<unknown>('/stock-count/items/submit/', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

/**
 * 完成盘点任务
 */
export async function completeStockCountTask(id: number): Promise<ApiResponse<StockCountCompleteResult>> {
  return request<StockCountCompleteResult>(`/stock-count/tasks/${id}/complete/`, {
    method: 'POST',
  })
}

/**
 * 取消盘点任务
 */
export async function cancelStockCountTask(id: number): Promise<ApiResponse<null>> {
  return request<null>(`/stock-count/tasks/${id}/cancel/`, {
    method: 'POST',
  })
}

// ==================== 统计分析接口 ====================

/**
 * 获取统计概览
 */
export async function getStatisticsOverview(): Promise<ApiResponse<StatisticsOverview>> {
  return request<StatisticsOverview>('/statistics/overview/')
}

/**
 * 获取出入库趋势
 */
export async function getStatisticsTrend(days: 7 | 30 = 7): Promise<ApiResponse<TrendDataItem[]>> {
  return request<TrendDataItem[]>(`/statistics/trend/?days=${days}`)
}

/**
 * 获取物料排行
 */
export async function getStatisticsRanking(params: {
  type?: 'in' | 'out'
  order_by?: 'qty' | 'value'
  days?: number
  limit?: number
} = {}): Promise<ApiResponse<RankingResult>> {
  const query = new URLSearchParams()
  if (params.type) query.set('type', params.type)
  if (params.order_by) query.set('order_by', params.order_by)
  if (params.days) query.set('days', String(params.days))
  if (params.limit) query.set('limit', String(params.limit))
  return request<RankingResult>(`/statistics/ranking/?${query.toString()}`)
}

/**
 * 获取类别统计
 */
export async function getStatisticsCategory(): Promise<ApiResponse<CategoryStatItem[]>> {
  return request<CategoryStatItem[]>('/statistics/category/')
}

// ==================== 月底结存接口 ====================

/**
 * 获取月度报表列表
 */
export async function getMonthlyReportList(): Promise<ApiResponse<MonthlyReportItem[]>> {
  return request<MonthlyReportItem[]>('/monthly-report/')
}

/**
 * 获取月度报表详情
 */
export async function getMonthlyReportDetail(month?: string): Promise<ApiResponse<MonthlyReportDetail>> {
  const query = month ? `?month=${month}` : ''
  return request<MonthlyReportDetail>(`/monthly-report/detail/${query}`)
}

// 导出所有接口
export default {
  stockInit,
  getStockList,
  getStockDetail,
  createStockIn,
  getStockInList,
  getStockInDetail,
  deleteStockIn,
  createStockOut,
  getStockOutList,
  getStockOutDetail,
  deleteStockOut,
  getWarningList,
  handleWarning,
  getWarningStatistics,
  checkWarnings,
  getStockCountTaskList,
  createStockCountTask,
  getStockCountTaskDetail,
  submitStockCountItem,
  completeStockCountTask,
  cancelStockCountTask,
  getStatisticsOverview,
  getStatisticsTrend,
  getStatisticsRanking,
  getStatisticsCategory,
  getMonthlyReportList,
  getMonthlyReportDetail,
}
