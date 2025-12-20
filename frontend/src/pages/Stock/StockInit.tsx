import { useState } from 'react'
import {
  Form,
  Input,
  InputNumber,
  Button,
  message,
  Table,
  Space,
  Tag,
} from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import type { TableProps } from 'antd'
import type { Stock } from '../../api/types'
import { stockApi } from '../../api/stockIn'
import './Stock.css'

export function StockInit() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [stockList, setStockList] = useState<Stock[]>([])
  const [tableLoading, setTableLoading] = useState(false)

  // 加载库存列表
  const loadStockList = async () => {
    setTableLoading(true)
    try {
      const res = await stockApi.getList({ page: 1, page_size: 100 })
      if (res.code === 200) {
        setStockList(res.data.list)
      }
    } catch {
      message.error('加载库存列表失败')
    } finally {
      setTableLoading(false)
    }
  }

  // 初次加载
  useState(() => {
    loadStockList()
  })

  // 提交表单
  const handleSubmit = async (values: {
    material_code: string
    material_name: string
    max_stock?: number
    min_stock?: number
    stock_value?: number
  }) => {
    setLoading(true)
    try {
      const res = await stockApi.init(values)
      if (res.code === 200) {
        message.success('物料初始化成功！')
        form.resetFields()
        loadStockList() // 刷新列表
      } else {
        message.error(res.message || '初始化失败')
      }
    } catch {
      message.error('操作失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 重置表单
  const handleReset = () => {
    form.resetFields()
  }

  // 表格列配置
  const columns: TableProps<Stock>['columns'] = [
    {
      title: '物料编号',
      dataIndex: 'material_code',
      key: 'material_code',
      width: 120,
    },
    {
      title: '物料名称',
      dataIndex: 'material_name',
      key: 'material_name',
      width: 150,
    },
    {
      title: '当前库存',
      dataIndex: 'current_stock',
      key: 'current_stock',
      width: 100,
      render: (value: number, record: Stock) => {
        const isLow = value < record.min_stock
        return (
          <span style={{ color: isLow ? '#ff4d4f' : 'inherit' }}>
            {value}
            {isLow && <Tag color="error" style={{ marginLeft: 8 }}>库存不足</Tag>}
          </span>
        )
      },
    },
    {
      title: '最小库存',
      dataIndex: 'min_stock',
      key: 'min_stock',
      width: 100,
    },
    {
      title: '最大库存',
      dataIndex: 'max_stock',
      key: 'max_stock',
      width: 100,
    },
    {
      title: '库存价值',
      dataIndex: 'stock_value',
      key: 'stock_value',
      width: 120,
      render: (value: string) => `¥${value}`,
    },
  ]

  return (
    <div className="stock-page">
      <header className="stock-page__header">
        <span className="stock-page__badge">Material</span>
        <h1 className="stock-page__title">物料初始化</h1>
        <p className="stock-page__subtitle">Initialize Material Stock</p>
      </header>

      <div className="stock-form-container">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="stock-form"
        >
          <div className="form-grid">
            <Form.Item
              name="material_code"
              label="物料编号"
              rules={[
                { required: true, message: '请输入物料编号' },
                { max: 50, message: '物料编号最多50个字符' },
              ]}
            >
              <Input placeholder="请输入物料编号，如 M001" />
            </Form.Item>

            <Form.Item
              name="material_name"
              label="物料名称"
              rules={[
                { required: true, message: '请输入物料名称' },
                { max: 100, message: '物料名称最多100个字符' },
              ]}
            >
              <Input placeholder="请输入物料名称" />
            </Form.Item>

            <Form.Item
              name="max_stock"
              label="最大库存量"
              initialValue={10000}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="请输入最大库存量"
                min={0}
              />
            </Form.Item>

            <Form.Item
              name="min_stock"
              label="最小库存量"
              initialValue={100}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="请输入最小库存量"
                min={0}
              />
            </Form.Item>

            <Form.Item
              name="stock_value"
              label="初始库存价值"
              initialValue={0}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="请输入初始库存价值"
                min={0}
                precision={2}
                prefix="¥"
              />
            </Form.Item>
          </div>

          <div className="form-actions">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<PlusOutlined />}
              size="large"
            >
              初始化物料
            </Button>
            <Button
              onClick={handleReset}
              icon={<ReloadOutlined />}
              size="large"
            >
              重置
            </Button>
          </div>
        </Form>
      </div>

      {/* 已有物料列表 */}
      <div className="stock-list-section">
        <div className="section-header">
          <h3>已有物料列表</h3>
          <Button onClick={loadStockList} loading={tableLoading}>
            刷新
          </Button>
        </div>
        <Table<Stock>
          columns={columns}
          dataSource={stockList}
          rowKey="id"
          loading={tableLoading}
          pagination={{ pageSize: 5 }}
          size="small"
        />
      </div>
    </div>
  )
}

export default StockInit
