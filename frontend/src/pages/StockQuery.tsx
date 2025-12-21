import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { message, Table, Tag, Modal } from 'antd'
import {
  ThunderboltOutlined,
  StarOutlined,
  SearchOutlined,
  ReloadOutlined,
  DatabaseOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import { getStockList, getStockDetail } from '../api/stock'
import type { Stock, StockStatus } from '../api/types'
import styles from './StockQuery.module.css'

// 库存状态颜色映射
const STOCK_STATUS_COLORS: Record<StockStatus, string> = {
  low: 'red',
  normal: 'green',
  high: 'orange',
}

// 物料状态选项
const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'active', label: '启用' },
  { value: 'inactive', label: '停用' },
]

// 库存状态选项
const STOCK_STATUS_OPTIONS = [
  { value: '', label: '全部库存状态' },
  { value: 'low', label: '库存不足' },
  { value: 'normal', label: '正常' },
  { value: 'high', label: '库存过高' },
]

const StockQuery = () => {
  const [loading, setLoading] = useState(false)
  const [stockList, setStockList] = useState<Stock[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [stockStatusFilter, setStockStatusFilter] = useState<StockStatus | ''>('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  // 详情弹窗
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [currentStock, setCurrentStock] = useState<Stock | null>(null)

  // 加载库存列表
  const loadStockList = async () => {
    setLoading(true)
    try {
      const res = await getStockList({
        page,
        page_size: pageSize,
        search: search || undefined,
        status: statusFilter || undefined,
        stock_status: stockStatusFilter || undefined,
        supplier: supplierFilter || undefined,
        category: categoryFilter || undefined,
      })
      if (res.code === 200 && res.data) {
        setStockList(res.data.list)
        setTotal(res.data.total)
      } else {
        message.error(res.message || '获取库存列表失败')
      }
    } catch {
      message.error('获取库存列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStockList()
  }, [page, statusFilter, stockStatusFilter])

  // 搜索
  const handleSearch = () => {
    setPage(1)
    loadStockList()
  }

  // 查看详情
  const handleViewDetail = async (record: Stock) => {
    setDetailModalVisible(true)
    setDetailLoading(true)
    try {
      const res = await getStockDetail(record.id)
      if (res.code === 200 && res.data) {
        setCurrentStock(res.data)
      } else {
        message.error(res.message || '获取详情失败')
      }
    } catch {
      message.error('获取详情失败')
    } finally {
      setDetailLoading(false)
    }
  }

  // 表格列定义
  const columns = [
    {
      title: '物料编号',
      dataIndex: 'material_code',
      key: 'material_code',
      width: 120,
      render: (val: string) => <span style={{ fontFamily: 'monospace' }}>{val}</span>,
    },
    {
      title: '物料名称',
      dataIndex: 'material_name',
      key: 'material_name',
      width: 140,
    },
    {
      title: '规格型号',
      dataIndex: 'spec',
      key: 'spec',
      width: 100,
      render: (val: string) => val || '-',
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 60,
      render: (val: string) => val || '-',
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (val: string) => val || '-',
    },
    {
      title: '当前库存',
      dataIndex: 'current_stock',
      key: 'current_stock',
      width: 100,
      render: (val: number) => <span className={styles.quantityCell}>{val}</span>,
    },
    {
      title: '库存状态',
      dataIndex: 'stock_status',
      key: 'stock_status',
      width: 100,
      render: (val: StockStatus, record: Stock) => (
        <Tag color={STOCK_STATUS_COLORS[val] || 'default'}>
          {record.stock_status_display || val}
        </Tag>
      ),
    },
    {
      title: '库存价值',
      dataIndex: 'stock_value',
      key: 'stock_value',
      width: 100,
      render: (val: string) => <span className={styles.valueCell}>¥{val}</span>,
    },
    {
      title: '供应商',
      dataIndex: 'supplier',
      key: 'supplier',
      width: 120,
      render: (val: string) => val || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (val: string) => (
        <Tag color={val === 'active' ? 'green' : 'default'}>
          {val === 'active' ? '启用' : '停用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: unknown, record: Stock) => (
        <button
          className={styles.viewBtn}
          onClick={() => handleViewDetail(record)}
          title="查看详情"
        >
          <EyeOutlined />
        </button>
      ),
    },
  ]

  return (
    <div className="page-container">
      {/* 导航栏 */}
      <header className="nav-header">
        <div className="nav-left">
          <span className={styles.navTitle}>Stock Query</span>
          <button className="icon-button" onClick={() => message.info('收藏功能')}>
            <StarOutlined style={{ fontSize: 20 }} />
          </button>
          <button className="icon-button" onClick={() => message.info('快捷操作')}>
            <ThunderboltOutlined style={{ fontSize: 20 }} />
          </button>
        </div>
        <div className="nav-center">2025</div>
        <div className="nav-right">
          <Link to="/profile" className="nav-link">Profile</Link>
          <Link to="/dashboard" className="nav-link">Home</Link>
        </div>
      </header>

      {/* 主体内容 */}
      <main className={styles.main}>
        {/* 左侧标题区 */}
        <div className={styles.leftSection}>
          <h1 className="hero-title">
            STOCK<br />QUERY
          </h1>
          <div className="hero-year">查询</div>
        </div>

        {/* 右侧内容区 */}
        <div className={styles.rightSection}>
          <div className={`glass-card ${styles.contentCard}`}>
            {/* 头部操作栏 */}
            <div className={styles.header}>
              <h2 className={styles.title}>
                <DatabaseOutlined className={styles.titleIcon} />
                库存查询
              </h2>
              <div className={styles.actions}>
                <div className={styles.searchWrapper}>
                  <input
                    type="text"
                    className="cyber-input"
                    placeholder="搜索物料编号/名称"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button className={styles.searchBtn} onClick={handleSearch}>
                    <SearchOutlined />
                  </button>
                </div>
                <select
                  className={`cyber-input ${styles.filterSelect}`}
                  value={stockStatusFilter}
                  onChange={(e) => setStockStatusFilter(e.target.value as StockStatus | '')}
                >
                  {STOCK_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <select
                  className={`cyber-input ${styles.filterSelect}`}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button className="icon-button" onClick={loadStockList}>
                  <ReloadOutlined style={{ fontSize: 18 }} />
                </button>
              </div>
            </div>

            {/* 高级筛选 */}
            <div className={styles.advancedFilter}>
              <input
                type="text"
                className="cyber-input"
                placeholder="供应商筛选"
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <input
                type="text"
                className="cyber-input"
                placeholder="类别筛选"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button className={`cyber-button ${styles.filterBtn}`} onClick={handleSearch}>
                筛选
              </button>
            </div>

            {/* 表格 */}
            <div className={styles.tableWrapper}>
              <Table
                columns={columns}
                dataSource={stockList}
                rowKey="id"
                loading={loading}
                pagination={{
                  current: page,
                  pageSize: pageSize,
                  total: total,
                  onChange: (p) => setPage(p),
                  showTotal: (t) => `共 ${t} 条记录`,
                }}
                className={styles.table}
                scroll={{ x: 1200 }}
              />
            </div>
          </div>
        </div>
      </main>

      {/* 详情弹窗 */}
      <Modal
        title={null}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        className={styles.modal}
        width={600}
        centered
      >
        <div className={styles.modalContent}>
          <h3 className={styles.modalTitle}>库存详情</h3>
          {detailLoading ? (
            <p className={styles.modalSubtitle}>加载中...</p>
          ) : currentStock ? (
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>物料编号</span>
                <span className={styles.detailValue}>{currentStock.material_code}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>物料名称</span>
                <span className={styles.detailValue}>{currentStock.material_name}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>规格型号</span>
                <span className={styles.detailValue}>{currentStock.spec || '-'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>单位</span>
                <span className={styles.detailValue}>{currentStock.unit || '-'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>类别</span>
                <span className={styles.detailValue}>{currentStock.category || '-'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>供应商</span>
                <span className={styles.detailValue}>{currentStock.supplier || '-'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>当前库存</span>
                <span className={`${styles.detailValue} ${styles.quantityCell}`}>
                  {currentStock.current_stock}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>库存状态</span>
                <Tag color={STOCK_STATUS_COLORS[currentStock.stock_status] || 'default'}>
                  {currentStock.stock_status_display}
                </Tag>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>最小库存</span>
                <span className={styles.detailValue}>{currentStock.min_stock}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>最大库存</span>
                <span className={styles.detailValue}>{currentStock.max_stock}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>单价</span>
                <span className={styles.detailValue}>¥{currentStock.unit_price}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>库存价值</span>
                <span className={`${styles.detailValue} ${styles.valueCell}`}>
                  ¥{currentStock.stock_value}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>状态</span>
                <Tag color={currentStock.status === 'active' ? 'green' : 'default'}>
                  {currentStock.status === 'active' ? '启用' : '停用'}
                </Tag>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>创建时间</span>
                <span className={styles.detailValue}>
                  {currentStock.created_at ? new Date(currentStock.created_at).toLocaleString('zh-CN') : '-'}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>更新时间</span>
                <span className={styles.detailValue}>
                  {currentStock.updated_at ? new Date(currentStock.updated_at).toLocaleString('zh-CN') : '-'}
                </span>
              </div>
            </div>
          ) : (
            <p className={styles.modalSubtitle}>暂无数据</p>
          )}
          <div className={styles.modalActions}>
            <button
              className="cyber-button"
              onClick={() => setDetailModalVisible(false)}
            >
              关闭
            </button>
          </div>
        </div>
      </Modal>

      {/* 角落信息 */}
      <div className="corner-info bottom-left">
        <div className={styles.waveform}>
          {[...Array(8)].map((_, i) => (
            <span key={i} className={styles.waveBar} style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      </div>
      <div className="corner-info bottom-right">
        <div className="brand-badge">System</div>
        <p style={{ marginTop: 8 }}>库存管理系统<br />Stock Management</p>
      </div>
    </div>
  )
}

export default StockQuery
