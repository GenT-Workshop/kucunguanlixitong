import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { message, Table, Tag, Modal, Spin } from 'antd'
import {
  ThunderboltOutlined,
  StarOutlined,
  ReloadOutlined,
  AuditOutlined,
  PlusOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  LoadingOutlined,
} from '@ant-design/icons'
import {
  getStockCountTaskList,
  createStockCountTask,
  getStockCountTaskDetail,
  submitStockCountItem,
  completeStockCountTask,
  cancelStockCountTask,
} from '../api/stock'
import type { StockCountTask, StockCountItem, StockCountTaskStatus, DiffType } from '../api/types'
import styles from './StockCount.module.css'

// 任务状态颜色映射
const TASK_STATUS_COLORS: Record<StockCountTaskStatus, string> = {
  pending: 'blue',
  doing: 'orange',
  done: 'green',
  cancelled: 'default',
}

// 差异类型颜色映射
const DIFF_TYPE_COLORS: Record<DiffType, string> = {
  gain: 'green',
  loss: 'red',
  none: 'default',
}

// 任务状态选项
const TASK_STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待盘点' },
  { value: 'doing', label: '盘点中' },
  { value: 'done', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
]

const StockCount = () => {
  const [loading, setLoading] = useState(false)
  const [taskList, setTaskList] = useState<StockCountTask[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [statusFilter, setStatusFilter] = useState<StockCountTaskStatus | ''>('')

  // 创建任务弹窗
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createForm, setCreateForm] = useState({
    created_by: '',
    remark: '',
  })

  // 任务详情弹窗
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [currentTask, setCurrentTask] = useState<StockCountTask | null>(null)

  // 盘点录入弹窗
  const [countModalVisible, setCountModalVisible] = useState(false)
  const [countLoading, setCountLoading] = useState(false)
  const [currentItem, setCurrentItem] = useState<StockCountItem | null>(null)
  const [countForm, setCountForm] = useState({
    real_qty: '',
    operator: '',
    remark: '',
  })

  // 加载任务列表
  const loadTaskList = async () => {
    setLoading(true)
    try {
      const res = await getStockCountTaskList({
        page,
        page_size: pageSize,
        status: statusFilter || undefined,
      })
      if (res.code === 200 && res.data) {
        setTaskList(res.data.list)
        setTotal(res.data.total)
      } else {
        message.error(res.message || '获取盘点任务列表失败')
      }
    } catch {
      message.error('获取盘点任务列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTaskList()
  }, [page, statusFilter])

  // 创建任务
  const handleCreateTask = async () => {
    if (!createForm.created_by.trim()) {
      message.error('请输入创建人')
      return
    }

    setCreateLoading(true)
    try {
      const res = await createStockCountTask({
        created_by: createForm.created_by,
        remark: createForm.remark,
      })
      if (res.code === 200) {
        message.success(res.message || '盘点任务创建成功')
        setCreateModalVisible(false)
        setCreateForm({ created_by: '', remark: '' })
        loadTaskList()
      } else {
        message.error(res.message || '创建失败')
      }
    } catch {
      message.error('创建失败')
    } finally {
      setCreateLoading(false)
    }
  }

  // 查看任务详情
  const handleViewDetail = async (task: StockCountTask) => {
    setDetailModalVisible(true)
    setDetailLoading(true)
    try {
      const res = await getStockCountTaskDetail(task.id)
      if (res.code === 200 && res.data) {
        setCurrentTask(res.data)
      } else {
        message.error(res.message || '获取详情失败')
      }
    } catch {
      message.error('获取详情失败')
    } finally {
      setDetailLoading(false)
    }
  }

  // 打开盘点录入弹窗
  const openCountModal = (item: StockCountItem) => {
    setCurrentItem(item)
    setCountForm({
      real_qty: item.real_qty !== null ? String(item.real_qty) : '',
      operator: item.operator || '',
      remark: item.remark || '',
    })
    setCountModalVisible(true)
  }

  // 提交盘点录入
  const handleSubmitCount = async () => {
    if (!currentItem) return

    const realQty = parseInt(countForm.real_qty)
    if (isNaN(realQty) || realQty < 0) {
      message.error('请输入有效的实盘数量')
      return
    }

    setCountLoading(true)
    try {
      const res = await submitStockCountItem({
        item_id: currentItem.id,
        real_qty: realQty,
        operator: countForm.operator,
        remark: countForm.remark,
      })
      if (res.code === 200) {
        message.success(res.message || '盘点录入成功')
        setCountModalVisible(false)
        // 刷新任务详情
        if (currentTask) {
          handleViewDetail(currentTask)
        }
        loadTaskList()
      } else {
        message.error(res.message || '录入失败')
      }
    } catch {
      message.error('录入失败')
    } finally {
      setCountLoading(false)
    }
  }

  // 完成盘点任务
  const handleCompleteTask = async () => {
    if (!currentTask) return

    Modal.confirm({
      title: '确认完成盘点',
      content: '完成后将根据差异自动生成调整单并更新库存，确定要完成吗？',
      okText: '确认完成',
      cancelText: '取消',
      onOk: async () => {
        try {
          const res = await completeStockCountTask(currentTask.id)
          if (res.code === 200) {
            message.success(res.message || '盘点完成')
            setDetailModalVisible(false)
            loadTaskList()
          } else {
            message.error(res.message || '完成失败')
          }
        } catch {
          message.error('完成失败')
        }
      },
    })
  }

  // 取消盘点任务
  const handleCancelTask = async (task: StockCountTask) => {
    Modal.confirm({
      title: '确认取消',
      content: `确定要取消盘点任务 "${task.task_no}" 吗？`,
      okText: '确认取消',
      cancelText: '返回',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const res = await cancelStockCountTask(task.id)
          if (res.code === 200) {
            message.success(res.message || '已取消')
            loadTaskList()
          } else {
            message.error(res.message || '取消失败')
          }
        } catch {
          message.error('取消失败')
        }
      },
    })
  }

  // 任务列表表格列
  const taskColumns = [
    {
      title: '任务号',
      dataIndex: 'task_no',
      key: 'task_no',
      width: 160,
      render: (val: string) => <span style={{ fontFamily: 'monospace' }}>{val}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (val: StockCountTaskStatus, record: StockCountTask) => (
        <Tag color={TASK_STATUS_COLORS[val] || 'default'}>
          {record.status_display || val}
        </Tag>
      ),
    },
    {
      title: '盘点进度',
      key: 'progress',
      width: 120,
      render: (_: unknown, record: StockCountTask) => (
        <span>
          <span className={styles.progressCount}>{record.counted_count}</span>
          <span className={styles.progressSep}>/</span>
          <span>{record.item_count}</span>
        </span>
      ),
    },
    {
      title: '创建人',
      dataIndex: 'created_by',
      key: 'created_by',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (val: string) => new Date(val).toLocaleString('zh-CN'),
    },
    {
      title: '完成时间',
      dataIndex: 'completed_at',
      key: 'completed_at',
      width: 160,
      render: (val: string | null) => val ? new Date(val).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_: unknown, record: StockCountTask) => (
        <div className={styles.actionBtns}>
          <button
            className={styles.viewBtn}
            onClick={() => handleViewDetail(record)}
            title="查看详情"
          >
            <EyeOutlined />
          </button>
          {(record.status === 'pending' || record.status === 'doing') && (
            <button
              className={styles.cancelBtn}
              onClick={() => handleCancelTask(record)}
              title="取消任务"
            >
              <CloseOutlined />
            </button>
          )}
        </div>
      ),
    },
  ]

  // 盘点明细表格列
  const itemColumns = [
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
      width: 140,
    },
    {
      title: '账面数量',
      dataIndex: 'book_qty',
      key: 'book_qty',
      width: 100,
    },
    {
      title: '实盘数量',
      dataIndex: 'real_qty',
      key: 'real_qty',
      width: 100,
      render: (val: number | null) => val !== null ? val : <span className={styles.uncounted}>未盘点</span>,
    },
    {
      title: '差异',
      dataIndex: 'diff_qty',
      key: 'diff_qty',
      width: 80,
      render: (val: number, record: StockCountItem) => (
        record.real_qty !== null ? (
          <Tag color={DIFF_TYPE_COLORS[record.diff_type] || 'default'}>
            {val > 0 ? `+${val}` : val}
          </Tag>
        ) : '-'
      ),
    },
    {
      title: '差异类型',
      dataIndex: 'diff_type',
      key: 'diff_type',
      width: 90,
      render: (val: DiffType, record: StockCountItem) => (
        record.real_qty !== null ? (
          <span>{record.diff_type_display || val}</span>
        ) : '-'
      ),
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      key: 'operator',
      width: 80,
      render: (val: string) => val || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: unknown, record: StockCountItem) => (
        currentTask && (currentTask.status === 'pending' || currentTask.status === 'doing') ? (
          <button
            className={styles.countBtn}
            onClick={() => openCountModal(record)}
            title="录入盘点"
          >
            <CheckOutlined />
          </button>
        ) : null
      ),
    },
  ]

  return (
    <div className="page-container">
      {/* 导航栏 */}
      <header className="nav-header">
        <div className="nav-left">
          <span className={styles.navTitle}>Stock Count</span>
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
            STOCK<br />COUNT
          </h1>
          <div className="hero-year">盘点</div>
        </div>

        {/* 右侧内容区 */}
        <div className={styles.rightSection}>
          <div className={`glass-card ${styles.contentCard}`}>
            {/* 头部操作栏 */}
            <div className={styles.header}>
              <h2 className={styles.title}>
                <AuditOutlined className={styles.titleIcon} />
                盘点管理
              </h2>
              <div className={styles.actions}>
                <select
                  className={`cyber-input ${styles.filterSelect}`}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StockCountTaskStatus | '')}
                >
                  {TASK_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button className="icon-button" onClick={loadTaskList}>
                  <ReloadOutlined style={{ fontSize: 18 }} />
                </button>
                <button
                  className={`cyber-button ${styles.createBtn}`}
                  onClick={() => setCreateModalVisible(true)}
                >
                  <PlusOutlined /> 新建盘点
                </button>
              </div>
            </div>

            {/* 表格 */}
            <div className={styles.tableWrapper}>
              <Table
                columns={taskColumns}
                dataSource={taskList}
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
                scroll={{ x: 900 }}
              />
            </div>
          </div>
        </div>
      </main>

      {/* 创建任务弹窗 */}
      <Modal
        title={null}
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        className={styles.modal}
        width={480}
        centered
      >
        <div className={styles.modalContent}>
          <h3 className={styles.modalTitle}>新建盘点任务</h3>
          <p className={styles.modalSubtitle}>创建后将自动添加所有启用物料</p>

          <div className={styles.form}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>创建人 *</label>
              <input
                type="text"
                className="cyber-input"
                placeholder="请输入创建人"
                value={createForm.created_by}
                onChange={(e) => setCreateForm({ ...createForm, created_by: e.target.value })}
                disabled={createLoading}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>备注</label>
              <textarea
                className="cyber-input"
                placeholder="请输入备注（可选）"
                value={createForm.remark}
                onChange={(e) => setCreateForm({ ...createForm, remark: e.target.value })}
                disabled={createLoading}
                rows={3}
                style={{ resize: 'none' }}
              />
            </div>

            <div className={styles.modalActions}>
              <button
                className="cyber-button-ghost"
                onClick={() => setCreateModalVisible(false)}
                disabled={createLoading}
              >
                取消
              </button>
              <button
                className="cyber-button"
                onClick={handleCreateTask}
                disabled={createLoading}
              >
                {createLoading ? <Spin indicator={<LoadingOutlined style={{ color: '#fff' }} />} /> : '创建任务'}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* 任务详情弹窗 */}
      <Modal
        title={null}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        className={styles.modal}
        width={900}
        centered
      >
        <div className={styles.modalContent}>
          <h3 className={styles.modalTitle}>盘点任务详情</h3>
          {detailLoading ? (
            <div className={styles.loadingWrapper}>
              <Spin indicator={<LoadingOutlined style={{ fontSize: 32 }} />} />
            </div>
          ) : currentTask ? (
            <>
              <div className={styles.taskInfo}>
                <div className={styles.taskInfoItem}>
                  <span className={styles.taskInfoLabel}>任务号</span>
                  <span className={styles.taskInfoValue}>{currentTask.task_no}</span>
                </div>
                <div className={styles.taskInfoItem}>
                  <span className={styles.taskInfoLabel}>状态</span>
                  <Tag color={TASK_STATUS_COLORS[currentTask.status] || 'default'}>
                    {currentTask.status_display}
                  </Tag>
                </div>
                <div className={styles.taskInfoItem}>
                  <span className={styles.taskInfoLabel}>创建人</span>
                  <span className={styles.taskInfoValue}>{currentTask.created_by}</span>
                </div>
                <div className={styles.taskInfoItem}>
                  <span className={styles.taskInfoLabel}>创建时间</span>
                  <span className={styles.taskInfoValue}>
                    {new Date(currentTask.created_at).toLocaleString('zh-CN')}
                  </span>
                </div>
              </div>

              <div className={styles.itemTableWrapper}>
                <Table
                  columns={itemColumns}
                  dataSource={currentTask.items || []}
                  rowKey="id"
                  pagination={false}
                  className={styles.table}
                  scroll={{ x: 800, y: 300 }}
                  size="small"
                />
              </div>

              {(currentTask.status === 'pending' || currentTask.status === 'doing') && (
                <div className={styles.modalActions}>
                  <button
                    className="cyber-button-ghost"
                    onClick={() => setDetailModalVisible(false)}
                  >
                    关闭
                  </button>
                  <button
                    className="cyber-button"
                    onClick={handleCompleteTask}
                  >
                    完成盘点
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className={styles.modalSubtitle}>暂无数据</p>
          )}
        </div>
      </Modal>

      {/* 盘点录入弹窗 */}
      <Modal
        title={null}
        open={countModalVisible}
        onCancel={() => setCountModalVisible(false)}
        footer={null}
        className={styles.modal}
        width={420}
        centered
      >
        <div className={styles.modalContent}>
          <h3 className={styles.modalTitle}>盘点录入</h3>
          {currentItem && (
            <p className={styles.modalSubtitle}>
              {currentItem.material_code} - {currentItem.material_name}
              <br />
              账面数量: {currentItem.book_qty}
            </p>
          )}

          <div className={styles.form}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>实盘数量 *</label>
              <input
                type="number"
                className="cyber-input"
                placeholder="请输入实盘数量"
                value={countForm.real_qty}
                onChange={(e) => setCountForm({ ...countForm, real_qty: e.target.value })}
                disabled={countLoading}
                min="0"
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>操作人</label>
              <input
                type="text"
                className="cyber-input"
                placeholder="请输入操作人"
                value={countForm.operator}
                onChange={(e) => setCountForm({ ...countForm, operator: e.target.value })}
                disabled={countLoading}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>备注</label>
              <input
                type="text"
                className="cyber-input"
                placeholder="差异原因等（可选）"
                value={countForm.remark}
                onChange={(e) => setCountForm({ ...countForm, remark: e.target.value })}
                disabled={countLoading}
              />
            </div>

            <div className={styles.modalActions}>
              <button
                className="cyber-button-ghost"
                onClick={() => setCountModalVisible(false)}
                disabled={countLoading}
              >
                取消
              </button>
              <button
                className="cyber-button"
                onClick={handleSubmitCount}
                disabled={countLoading}
              >
                {countLoading ? <Spin indicator={<LoadingOutlined style={{ color: '#fff' }} />} /> : '确认录入'}
              </button>
            </div>
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

export default StockCount
