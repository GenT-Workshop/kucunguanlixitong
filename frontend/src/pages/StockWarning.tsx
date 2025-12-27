import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { message, Table, Tag, Spin } from 'antd'
import {
  ThunderboltOutlined,
  StarOutlined,
  SearchOutlined,
  AlertOutlined,
  SyncOutlined,
  LoadingOutlined,
} from '@ant-design/icons'
import { getWarningList, getWarningStatistics, checkWarnings } from '../api/stock'
import type { StockWarning as StockWarningType, WarningType, WarningStatistics } from '../api/types'
import styles from './StockWarning.module.css'

// 预警类型颜色映射
const WARNING_TYPE_COLORS: Record<WarningType, string> = {
  low: 'red',
  high: 'orange',
}

// 预警类型选项
const WARNING_TYPE_OPTIONS = [
  { value: '', label: '全部类型' },
  { value: 'low', label: '库存不足' },
  { value: 'high', label: '库存过高' },
]

const StockWarningPage = () => {
  const [loading, setLoading] = useState(false)
  const [warningList, setWarningList] = useState<StockWarningType[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [warningTypeFilter, setWarningTypeFilter] = useState<WarningType | ''>('')

  // 统计数据
  const [statistics, setStatistics] = useState<WarningStatistics | null>(null)

  // 检查预警loading
  const [checkLoading, setCheckLoading] = useState(false)

  // 加载预警列表
  const loadWarningList = async () => {
    setLoading(true)
    try {
      const res = await getWarningList({
        page,
        page_size: pageSize,
        search: search || undefined,
        warning_type: warningTypeFilter || undefined,
      })
      if (res.code === 200 && res.data) {
        // 过滤掉库存已恢复正常的记录，只显示异常的预警
        const abnormalList = res.data.list.filter((item: StockWarningType) => {
          return item.current_stock <= item.min_stock || item.current_stock >= item.max_stock
        })
        setWarningList(abnormalList)
        setTotal(abnormalList.length)
      } else {
        message.error(res.message || '获取预警列表失败')
      }
    } catch {
      message.error('获取预警列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 加载统计数据
  const loadStatistics = async () => {
    try {
      const res = await getWarningStatistics()
      if (res.code === 200 && res.data) {
        setStatistics(res.data)
      }
    } catch {
      console.error('获取统计数据失败')
    }
  }

  // 首次加载时自动检查预警
  useEffect(() => {
    const initLoad = async () => {
      // 先检查预警，生成新的预警记录
      try {
        await checkWarnings()
      } catch {
        // 忽略检查失败，继续加载列表
      }
      // 然后加载列表和统计
      loadWarningList()
      loadStatistics()
    }
    initLoad()
  }, [])

  // 筛选条件变化时重新加载
  useEffect(() => {
    loadWarningList()
    loadStatistics()
  }, [page, warningTypeFilter])

  // 搜索
  const handleSearch = () => {
    setPage(1)
    loadWarningList()
  }

  // 检查预警
  const handleCheckWarnings = async () => {
    setCheckLoading(true)
    try {
      const res = await checkWarnings()
      if (res.code === 200 && res.data) {
        message.success(res.message || `检查完成，新增 ${res.data.new_count} 条预警`)
        loadWarningList()
        loadStatistics()
      } else {
        message.error(res.message || '检查预警失败')
      }
    } catch {
      message.error('检查预警失败')
    } finally {
      setCheckLoading(false)
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
      title: '预警类型',
      dataIndex: 'warning_type',
      key: 'warning_type',
      width: 100,
      render: (val: WarningType, record: StockWarningType) => (
        <Tag color={WARNING_TYPE_COLORS[val] || 'default'}>
          {record.warning_type_display || val}
        </Tag>
      ),
    },
    {
      title: '当前库存',
      dataIndex: 'current_stock',
      key: 'current_stock',
      width: 100,
      render: (val: number) => <span className={styles.quantityCell}>{val}</span>,
    },
    {
      title: '最小/最大库存',
      key: 'stock_range',
      width: 120,
      render: (_: unknown, record: StockWarningType) => (
        <span>{record.min_stock} / {record.max_stock}</span>
      ),
    },
  ]

  return (
    <div className="page-container">
      {/* 导航栏 */}
      <header className="nav-header">
        <div className="nav-left">
          <span className={styles.navTitle}>Stock Warning</span>
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
            STOCK<br />WARNING
          </h1>
          <div className="hero-year">预警</div>

          {/* 统计卡片 */}
          {statistics && (
            <div className={styles.statsCard}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>待处理</span>
                <span className={`${styles.statValue} ${styles.pending}`}>
                  {statistics.by_status.pending}
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>库存不足</span>
                <span className={`${styles.statValue} ${styles.low}`}>
                  {statistics.by_type.low}
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>库存过高</span>
                <span className={`${styles.statValue} ${styles.high}`}>
                  {statistics.by_type.high}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 右侧内容区 */}
        <div className={styles.rightSection}>
          <div className={`glass-card ${styles.contentCard}`}>
            {/* 头部操作栏 */}
            <div className={styles.header}>
              <h2 className={styles.title}>
                <AlertOutlined className={styles.titleIcon} />
                库存预警
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
                  value={warningTypeFilter}
                  onChange={(e) => setWarningTypeFilter(e.target.value as WarningType | '')}
                >
                  {WARNING_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button
                  className={`cyber-button ${styles.checkBtn}`}
                  onClick={handleCheckWarnings}
                  disabled={checkLoading}
                >
                  {checkLoading ? (
                    <Spin indicator={<LoadingOutlined style={{ color: '#fff' }} />} />
                  ) : (
                    <>
                      <SyncOutlined /> 检查预警
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 表格 */}
            <div className={styles.tableWrapper}>
              <Table
                columns={columns}
                dataSource={warningList}
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

export default StockWarningPage
