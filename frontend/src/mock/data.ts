import type { Stock, StockIn } from '../api/types'

// Mock 库存数据
export const mockStocks: Stock[] = [
  {
    id: 1,
    material_code: 'M001',
    material_name: '螺丝钉',
    max_stock: 10000,
    min_stock: 100,
    current_stock: 500,
    stock_value: '250.00',
    created_at: '2025-12-14T10:00:00Z',
    updated_at: '2025-12-14T12:00:00Z',
  },
  {
    id: 2,
    material_code: 'M002',
    material_name: '螺母',
    max_stock: 8000,
    min_stock: 200,
    current_stock: 1500,
    stock_value: '750.00',
    created_at: '2025-12-14T10:30:00Z',
    updated_at: '2025-12-14T14:00:00Z',
  },
  {
    id: 3,
    material_code: 'M003',
    material_name: '垫片',
    max_stock: 5000,
    min_stock: 50,
    current_stock: 30,  // 低于最小库存，触发预警
    stock_value: '15.00',
    created_at: '2025-12-14T11:00:00Z',
    updated_at: '2025-12-14T15:00:00Z',
  },
  {
    id: 4,
    material_code: 'M004',
    material_name: '弹簧',
    max_stock: 3000,
    min_stock: 100,
    current_stock: 800,
    stock_value: '1600.00',
    created_at: '2025-12-15T09:00:00Z',
    updated_at: '2025-12-15T10:00:00Z',
  },
  {
    id: 5,
    material_code: 'M005',
    material_name: '轴承',
    max_stock: 1000,
    min_stock: 50,
    current_stock: 200,
    stock_value: '4000.00',
    created_at: '2025-12-15T10:00:00Z',
    updated_at: '2025-12-15T11:00:00Z',
  },
]

// Mock 入库记录数据
export const mockStockIns: StockIn[] = [
  {
    id: 1,
    material_code: 'M001',
    material_name: '螺丝钉',
    in_time: '2025-12-14T14:30:00Z',
    in_quantity: 100,
    in_value: '50.00',
    created_at: '2025-12-14T14:30:00Z',
  },
  {
    id: 2,
    material_code: 'M001',
    material_name: '螺丝钉',
    in_time: '2025-12-15T09:00:00Z',
    in_quantity: 200,
    in_value: '100.00',
    created_at: '2025-12-15T09:00:00Z',
  },
  {
    id: 3,
    material_code: 'M002',
    material_name: '螺母',
    in_time: '2025-12-14T16:00:00Z',
    in_quantity: 500,
    in_value: '250.00',
    created_at: '2025-12-14T16:00:00Z',
  },
  {
    id: 4,
    material_code: 'M004',
    material_name: '弹簧',
    in_time: '2025-12-15T10:30:00Z',
    in_quantity: 300,
    in_value: '600.00',
    created_at: '2025-12-15T10:30:00Z',
  },
  {
    id: 5,
    material_code: 'M005',
    material_name: '轴承',
    in_time: '2025-12-15T11:00:00Z',
    in_quantity: 50,
    in_value: '1000.00',
    created_at: '2025-12-15T11:00:00Z',
  },
]

// 生成自增 ID
let stockIdCounter = mockStocks.length + 1
let stockInIdCounter = mockStockIns.length + 1

export const getNextStockId = () => stockIdCounter++
export const getNextStockInId = () => stockInIdCounter++
