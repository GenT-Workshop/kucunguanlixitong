import type {
  ApiResponse,
  PaginatedData,
  Stock,
  StockInitParams,
  ListParams,
} from './types'
import { request, USE_MOCK } from './client'
import { mockStocks, getNextStockId } from '../mock/data'

// 模拟延迟
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Mock 实现
const mockStockApi = {
  // 物料初始化
  async init(params: StockInitParams): Promise<ApiResponse<Stock>> {
    await delay(300)

    // 检查物料编号是否已存在
    const exists = mockStocks.find((s) => s.material_code === params.material_code)
    if (exists) {
      return { code: 400, message: '物料编号已存在', data: null as unknown as Stock }
    }

    const newStock: Stock = {
      id: getNextStockId(),
      material_code: params.material_code,
      material_name: params.material_name,
      max_stock: params.max_stock || 0,
      min_stock: params.min_stock || 0,
      current_stock: 0,
      stock_value: (params.stock_value || 0).toFixed(2),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    mockStocks.push(newStock)

    return { code: 200, message: '物料初始化成功', data: newStock }
  },

  // 获取库存列表
  async getList(params?: ListParams): Promise<ApiResponse<PaginatedData<Stock>>> {
    await delay(200)

    const page = params?.page || 1
    const pageSize = params?.page_size || 10
    const search = params?.search || ''

    // 过滤搜索
    let filtered = mockStocks
    if (search) {
      filtered = mockStocks.filter(
        (s) =>
          s.material_code.includes(search) || s.material_name.includes(search)
      )
    }

    // 分页
    const start = (page - 1) * pageSize
    const list = filtered.slice(start, start + pageSize)

    return {
      code: 200,
      message: 'success',
      data: {
        total: filtered.length,
        page,
        page_size: pageSize,
        list,
      },
    }
  },

  // 获取库存详情
  async getDetail(id: number): Promise<ApiResponse<Stock>> {
    await delay(200)

    const stock = mockStocks.find((s) => s.id === id)
    if (!stock) {
      return { code: 404, message: '库存记录不存在', data: null as unknown as Stock }
    }

    return { code: 200, message: 'success', data: stock }
  },
}

// 真实 API 实现
const realStockApi = {
  init(params: StockInitParams) {
    return request.post<Stock>('/stock/init/', params)
  },

  getList(params?: ListParams) {
    return request.get<PaginatedData<Stock>>('/stock/', { params })
  },

  getDetail(id: number) {
    return request.get<Stock>(`/stock/${id}/`)
  },
}

// 导出 API（根据环境自动切换）
export const stockApi = USE_MOCK ? mockStockApi : realStockApi
