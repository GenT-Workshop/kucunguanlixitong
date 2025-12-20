import Mock from 'mockjs'

// 库存类型
interface StockItem {
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
interface StockInItem {
  id: number
  material_code: string
  material_name: string
  in_time: string
  in_quantity: number
  in_value: string
  created_at: string
}

// 模拟库存数据
const stockData = Mock.mock({
  'list|20': [
    {
      'id|+1': 1,
      'material_code': /M[0-9]{3}/,
      'material_name': '@ctitle(3, 6)',
      'max_stock|1000-10000': 1,
      'min_stock|50-200': 1,
      'current_stock|100-5000': 1,
      'stock_value|1000-50000.2': 1,
      'created_at': '@datetime("yyyy-MM-ddTHH:mm:ssZ")',
      'updated_at': '@datetime("yyyy-MM-ddTHH:mm:ssZ")',
    },
  ],
}) as { list: StockItem[] }

// 模拟入库记录数据
const stockInData = Mock.mock({
  'list|50': [
    {
      'id|+1': 1,
      'material_code': /M[0-9]{3}/,
      'material_name': '@ctitle(3, 6)',
      'in_time': '@datetime("yyyy-MM-ddTHH:mm:ssZ")',
      'in_quantity|10-500': 1,
      'in_value|100-5000.2': 1,
      'created_at': '@datetime("yyyy-MM-ddTHH:mm:ssZ")',
    },
  ],
}) as { list: StockInItem[] }

// 存储数据
const stocks: StockItem[] = stockData.list
const stockIns: StockInItem[] = stockInData.list
let stockIdCounter = stocks.length + 1
let stockInIdCounter = stockIns.length + 1

// 模拟延迟
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// 统一响应格式
const response = <T>(data: T, message = 'success', code = 200) => ({
  code,
  message,
  data,
})

const errorResponse = (message: string, code = 400) => ({
  code,
  message,
  data: null,
})

// ==================== 库存接口 ====================

// 物料初始化
export const stockInit = async (params: {
  material_code: string
  material_name: string
  max_stock?: number
  min_stock?: number
  stock_value?: number
}) => {
  await delay(300)

  const { material_code, material_name, max_stock = 0, min_stock = 0, stock_value = 0 } = params

  if (!material_code) {
    return errorResponse('物料编号不能为空')
  }
  if (!material_name) {
    return errorResponse('物料名称不能为空')
  }

  // 检查物料编号是否已存在
  const exists = stocks.find((s: StockItem) => s.material_code === material_code)
  if (exists) {
    return errorResponse('物料编号已存在')
  }

  const newStock: StockItem = {
    id: stockIdCounter++,
    material_code,
    material_name,
    max_stock,
    min_stock,
    current_stock: 0,
    stock_value: stock_value.toFixed(2),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  stocks.push(newStock)

  return response(newStock, '物料初始化成功')
}

// 获取库存列表
export const getStockList = async (params: {
  page?: number
  page_size?: number
  search?: string
}) => {
  await delay(200)

  const { page = 1, page_size = 10, search = '' } = params

  let filteredList = stocks

  // 搜索过滤
  if (search) {
    filteredList = stocks.filter(
      (s: StockItem) =>
        s.material_code.toLowerCase().includes(search.toLowerCase()) ||
        s.material_name.includes(search)
    )
  }

  // 分页
  const start = (page - 1) * page_size
  const end = start + page_size
  const list = filteredList.slice(start, end)

  return response({
    total: filteredList.length,
    page,
    page_size,
    list,
  })
}

// 获取库存详情
export const getStockDetail = async (id: number) => {
  await delay(200)

  const stock = stocks.find((s: StockItem) => s.id === id)

  if (!stock) {
    return errorResponse('库存记录不存在', 404)
  }

  return response(stock)
}

// ==================== 入库接口 ====================

// 创建入库记录
export const createStockIn = async (params: {
  material_code: string
  in_quantity: number
  in_value: number
  in_time?: string
}) => {
  await delay(300)

  const { material_code, in_quantity, in_value, in_time } = params

  if (!material_code) {
    return errorResponse('物料编号不能为空')
  }
  if (!in_quantity || in_quantity <= 0) {
    return errorResponse('入库数量必须大于0')
  }
  if (in_value === undefined) {
    return errorResponse('入库价值不能为空')
  }

  // 查找库存记录
  const stock = stocks.find((s: StockItem) => s.material_code === material_code)
  if (!stock) {
    return errorResponse('物料编号不存在，请先初始化物料')
  }

  // 检查是否超过最大库存量
  if (stock.max_stock > 0 && stock.current_stock + in_quantity > stock.max_stock) {
    return errorResponse('入库后将超过最大库存量')
  }

  const newStockIn: StockInItem = {
    id: stockInIdCounter++,
    material_code,
    material_name: stock.material_name,
    in_time: in_time || new Date().toISOString(),
    in_quantity,
    in_value: in_value.toFixed(2),
    created_at: new Date().toISOString(),
  }

  stockIns.unshift(newStockIn)

  // 更新库存
  stock.current_stock += in_quantity
  stock.stock_value = (parseFloat(stock.stock_value) + in_value).toFixed(2)
  stock.updated_at = new Date().toISOString()

  return response(newStockIn, '入库成功')
}

// 获取入库记录列表
export const getStockInList = async (params: {
  page?: number
  page_size?: number
  search?: string
  start_time?: string
  end_time?: string
}) => {
  await delay(200)

  const { page = 1, page_size = 10, search = '', start_time, end_time } = params

  let filteredList = stockIns

  // 搜索过滤
  if (search) {
    filteredList = filteredList.filter(
      (s: StockInItem) =>
        s.material_code.toLowerCase().includes(search.toLowerCase()) ||
        s.material_name.includes(search)
    )
  }

  // 时间过滤
  if (start_time) {
    filteredList = filteredList.filter((s: StockInItem) => new Date(s.in_time) >= new Date(start_time))
  }
  if (end_time) {
    filteredList = filteredList.filter((s: StockInItem) => new Date(s.in_time) <= new Date(end_time))
  }

  // 分页
  const start = (page - 1) * page_size
  const end = start + page_size
  const list = filteredList.slice(start, end)

  return response({
    total: filteredList.length,
    page,
    page_size,
    list,
  })
}

// 获取入库记录详情
export const getStockInDetail = async (id: number) => {
  await delay(200)

  const stockIn = stockIns.find((s: StockInItem) => s.id === id)

  if (!stockIn) {
    return errorResponse('入库记录不存在', 404)
  }

  return response(stockIn)
}

// 导出所有 mock 接口
export default {
  stockInit,
  getStockList,
  getStockDetail,
  createStockIn,
  getStockInList,
  getStockInDetail,
}
