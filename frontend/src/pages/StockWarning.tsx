import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { message, Table, Tag, Modal, Spin } from 'antd'
import {
  ThunderboltOutlined,
  StarOutlined,
  SearchOutlined,
  ReloadOutlined,
  AlertOutlined,
  CheckOutlined,
  CloseOutlined,
  SyncOutlined,
  LoadingOutlined,
} from '@ant-design/icons'
import { getWarningList, handleWarning, getWarningStatistics, checkWarnings } from '../api/stock'
import type { StockWarning as StockWarningType, WarningType, WarningLevel, WarningStatus, WarningStatistics } from '../api/types'
import styles from './StockWarning.module.css'

// 预警类型颜色映射
const WARNING_TYPE_COLORS: Record<WarningType, string> = {
  low: 'red',
  high: 'orange',
}

// 预警级别颜色映射
const LEVEL_COLORS: Record<WarningLevel, string> = {
  warning: 'orange',
  danger: 'red',
}

// 预警状态颜色映射
const STATUS_COLORS: Record<WarningStatus, string> = {
  pending: 'blue',
  handled: 'green',
  ignored: 'default',
}

// 预警类型选项
const WARNING_TYPE_OPTIONS = [
  { value: '', label: '全部类型' },
  { value: 'low', label: '库存不足' },
  { value: 'high', label: '库存过高' },
]

// 预警级别选项
const LEVEL_OPTIONS = [
  { value: '', label: '全部级别' },
  { value: 'warning', label: '警告' },
  { value: 'danger', label: '危险' },
]

// 预警状态选项
const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待处理' },
  { value: 'handled', label: '已处理' },
  { value: 'ignored', label: '已忽略' },
]

const StockWarningPage = () => {
  const [loading, setLoading] = useState(false)
  const [warningList, setWarningList] = useState<StockWarningType[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [warningTypeFilter, setWarningTypeFilter] = useState<WarningType | ''>('')
  const [levelFilter, setLevelFilter] = useState<WarningLevel | ''>('')
  const [statusFilter, setStatusFilter] = useState<WarningStatus | ''>('')

  // 统计数据
  const [statistics, setStatistics] = useState<WarningStatistics | null>(null)

  // 处理弹窗
  const [handleModalVisible, setHandleModalVisible] = useState(false)
  const [handleLoading, setHandleLoading] = useState(false)
  const [currentWarning, setCurrentWarning] = useState<StockWarningType | null>(null)
  const [handleForm, setHandleForm] = useState({
    action: 'handle' as 'handle' | 'ignore',
    handled_by: '',
    remark: '',
  })

  // 检查预警loading
  const [checkLoading, setCheckLoading] = useState(false)

  // 判断库存是否在合理范围内
  const isStockNormal = (record: StockWarningType) => {
    return record.current_stock >= record.min_stock && record.current_stock <= record.max_stock
  }

  // 加载预警列表
  const loadWarningList = async () => {
    setLoading(true)
    try {
      const res = await getWarningList({
        page,
        page_size: pageSize,
        search: search || undefined,
        warning_type: warningTypeFilter || undefined,
        level: levelFilter || undefined,
        status: statusFilter || undefined,
      })
      if (res.code === 200 && res.data) {
        // 过滤掉库存已恢复正常的记录，只显示异常的预警
        const abnormalList = res.data.list.filter((item: StockWarningType) => {
          return item.current_stock < item.min_stock || item.current_stock > item.max_stock
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

  useEffect(() => {
    loadWarningList()
    loadStatistics()
  }, [page, warningTypeFilter, levelFilter, statusFilter])

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

  // 打开处理弹窗
  const openHandleModal = (record: StockWarningType, action: 'handle' | 'ignore') => {
    setCurrentWarning(record)
    setHandleForm({
      action,
      handled_by: '',
      remark: '',
    })
    setHandleModalVisible(true)
  }

  // 提交处理
  const handleSubmit = async () => {
    if (!currentWarning) return

    setHandleLoading(true)
    try {
      const res = await handleWarning(currentWarning.id, handleForm)
      if (res.code === 200) {
        message.success(res.message || '处理成功')
        setHandleModalVisible(false)
        loadWarningList()
        loadStatistics()
      } else {
        message.error(res.message || '处理失败')
      }
    } catch {
      message.error('处理失败')
    } finally {
      setHandleLoading(false)
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
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (val: WarningLevel, record: StockWarningType) => (
        <Tag color={LEVEL_COLORS[val] || 'default'}>
          {record.level_display || val}
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
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (_val: WarningStatus, record: StockWarningType) => {
        // 如果库存已恢复正常，动态显示为已处理
        if (isStockNormal(record)) {
          return <Tag color="green">已处理</Tag>
        }
        return (
          <Tag color={STATUS_COLORS[record.status] || 'default'}>
            {record.status_display || record.status}
          </Tag>
        )
      },
    },
    {
      title: '处理人',
      dataIndex: 'handled_by',
      key: 'handled_by',
      width: 80,
      render: (val: string) => val || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_: unknown, record: StockWarningType) => {
        // 如果库存已恢复正常，显示已处理
        if (isStockNormal(record)) {
          return <span className={styles.handledText}>已处理</span>
        }
        // 待处理状态显示操作按钮
        if (record.status === 'pending') {
          return (
            <div className={styles.actionBtns}>
              <button
                className={styles.handleBtn}
                onClick={() => openHandleModal(record, 'handle')}
                title="处理"
              >
                <CheckOutlined />
              </button>
              <button
                className={styles.ignoreBtn}
                onClick={() => openHandleModal(record, 'ignore')}
                title="忽略"
              >
                <CloseOutlined />
              </button>
            </div>
          )
        }
        return (
          <span className={styles.handledText}>
            {record.status === 'handled' ? '已处理' : '已忽略'}
          </span>
        )
      },
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
                <select
                  className={`cyber-input ${styles.filterSelect}`}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as WarningStatus | '')}
                >
                  {STATUS_OPTIONS.map((opt) => (
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

      {/* 处理弹窗 */}
      <Modal
        title={handleForm.action === 'handle' ? '处理预警' : '忽略预警'}
        open={handleModalVisible}
        onCancel={() => setHandleModalVisible(false)}
        footer={null}
        rootClassName="stock-warning-modal"
        width={480}
        centered
      >
        <style>{`
          .stock-warning-modal .ant-modal-content {
            background: rgba(0, 0, 0, 0.95) !important;
            border: 2px solid rgba(250, 140, 22, 0.6) !important;
            border-radius: 12px !important;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8), 0 0 20px rgba(250, 140, 22, 0.3) !important;
            padding: 0 !important;
            overflow: hidden !important;
          }
          .stock-warning-modal .ant-modal-header {
            background: rgba(0, 0, 0, 0.95) !important;
            border-bottom: 1px solid rgba(250, 140, 22, 0.4) !important;
            padding: 16px 20px !important;
            margin: 0 !important;
          }
          .stock-warning-modal .ant-modal-body {
            background: rgba(0, 0, 0, 0.95) !important;
            padding: 20px !important;
          }
          .stock-warning-modal .ant-modal-title {
            color: #ffffff !important;
            font-size: 18px !important;
            font-weight: 600 !important;
          }
          .stock-warning-modal .ant-modal-close {
            color: #ffffff !important;
          }
          .stock-warning-modal .ant-modal-close:hover {
            color: #FA8C16 !important;
            background: rgba(250, 140, 22, 0.2) !important;
          }
        `}</style>
        <p className={styles.modalSubtitle}>
          {currentWarning?.material_code} - {currentWarning?.material_name}
        </p>
        <div className={styles.form}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>处理人</label>
              <input
                type="text"
                className="cyber-input"
                placeholder="请输入处理人"
                value={handleForm.handled_by}
                onChange={(e) => setHandleForm({ ...handleForm, handled_by: e.target.value })}
                disabled={handleLoading}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>备注</label>
              <textarea
                className="cyber-input"
                placeholder="请输入备注（可选）"
                value={handleForm.remark}
                onChange={(e) => setHandleForm({ ...handleForm, remark: e.target.value })}
                disabled={handleLoading}
                rows={3}
                style={{ resize: 'none' }}
              />
            </div>

            <div className={styles.modalActions}>
              <button
                className="cyber-button-ghost"
                onClick={() => setHandleModalVisible(false)}
                disabled={handleLoading}
              >
                取消
              </button>
              <button
                className={`cyber-button ${handleForm.action === 'ignore' ? styles.ignoreSubmitBtn : ''}`}
                onClick={handleSubmit}
                disabled={handleLoading}
              >
                {handleLoading ? (
                  <Spin indicator={<LoadingOutlined style={{ color: '#fff' }} />} />
                ) : (
                  handleForm.action === 'handle' ? '确认处理' : '确认忽略'
                )}
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

export default StockWarningPage
