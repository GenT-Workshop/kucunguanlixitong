import { useState, useEffect } from 'react'
import { Table, Input, DatePicker, Button, Space, Tag } from 'antd'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import type { TableProps } from 'antd'
import type { StockIn, StockInListParams } from '../../api/types'
import { stockInApi } from '../../api/stockIn'
import './StockIn.css'

const { RangePicker } = DatePicker

export function StockInList() {
  const [data, setData] = useState<StockIn[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [params, setParams] = useState<StockInListParams>({
    page: 1,
    page_size: 10,
  })
  const [searchText, setSearchText] = useState('')

  // 获取数据
  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await stockInApi.getList(params)
      if (res.code === 200) {
        setData(res.data.list)
        setTotal(res.data.total)
      }
    } catch (error) {
      console.error('获取入库记录失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [params])

  // 搜索
  const handleSearch = () => {
    setParams((prev) => ({
      ...prev,
      page: 1,
      search: searchText,
    }))
  }

  // 日期筛选
  const handleDateChange = (dates: unknown) => {
    if (dates && Array.isArray(dates) && dates[0] && dates[1]) {
      setParams((prev) => ({
        ...prev,
        page: 1,
        start_time: (dates[0] as { toISOString: () => string }).toISOString(),
        end_time: (dates[1] as { toISOString: () => string }).toISOString(),
      }))
    } else {
      setParams((prev) => ({
        ...prev,
        page: 1,
        start_time: undefined,
        end_time: undefined,
      }))
    }
  }

  // 重置筛选
  const handleReset = () => {
    setSearchText('')
    setParams({
      page: 1,
      page_size: 10,
    })
  }

  // 分页变化
  const handleTableChange: TableProps<StockIn>['onChange'] = (pagination) => {
    setParams((prev) => ({
      ...prev,
      page: pagination.current || 1,
      page_size: pagination.pageSize || 10,
    }))
  }

  // 格式化时间
  const formatTime = (time: string) => {
    return new Date(time).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // 表格列配置
  const columns: TableProps<StockIn>['columns'] = [
    {
      title: '入库单号',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id) => <Tag color="orange">RK{String(id).padStart(6, '0')}</Tag>,
    },
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
      title: '入库数量',
      dataIndex: 'in_quantity',
      key: 'in_quantity',
      width: 120,
      render: (qty) => <span style={{ color: '#52c41a' }}>+{qty}</span>,
    },
    {
      title: '入库金额',
      dataIndex: 'in_value',
      key: 'in_value',
      width: 120,
      render: (value) => `¥${value}`,
    },
    {
      title: '入库时间',
      dataIndex: 'in_time',
      key: 'in_time',
      width: 180,
      render: (time) => formatTime(time),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (time) => formatTime(time),
    },
  ]

  return (
    <div className="stock-in-page">
      <header className="stock-in-page__header">
        <span className="stock-in-page__badge">Stock In Records</span>
        <h1 className="stock-in-page__title">入库记录</h1>
        <p className="stock-in-page__subtitle">Stock In List</p>
      </header>

      {/* 筛选区域 */}
      <div className="stock-in-filters card">
        <Space wrap size="middle">
          <Input
            placeholder="搜索物料编号/名称"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 200 }}
            prefix={<SearchOutlined />}
          />
          <RangePicker
            showTime
            onChange={handleDateChange}
            placeholder={['开始时间', '结束时间']}
          />
          <Button type="primary" onClick={handleSearch} icon={<SearchOutlined />}>
            搜索
          </Button>
          <Button onClick={handleReset} icon={<ReloadOutlined />}>
            重置
          </Button>
        </Space>
      </div>

      {/* 统计信息 */}
      <div className="stock-in-stats">
        <div className="stock-in-stat-item">
          <span className="stock-in-stat-value">{total}</span>
          <span className="stock-in-stat-label">总记录数</span>
        </div>
        <div className="stock-in-stat-item">
          <span className="stock-in-stat-value">
            {data.reduce((sum, item) => sum + item.in_quantity, 0)}
          </span>
          <span className="stock-in-stat-label">入库总数量</span>
        </div>
        <div className="stock-in-stat-item">
          <span className="stock-in-stat-value">
            ¥{data.reduce((sum, item) => sum + parseFloat(item.in_value), 0).toFixed(2)}
          </span>
          <span className="stock-in-stat-label">入库总金额</span>
        </div>
      </div>

      {/* 表格 */}
      <div className="card">
        <Table<StockIn>
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          onChange={handleTableChange}
          pagination={{
            current: params.page,
            pageSize: params.page_size,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </div>
    </div>
  )
}

export default StockInList
