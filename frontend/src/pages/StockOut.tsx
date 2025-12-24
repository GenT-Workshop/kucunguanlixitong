import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { message, Spin, Modal, Tag } from 'antd'
import {
  ThunderboltOutlined,
  StarOutlined,
  CameraOutlined,
  LoadingOutlined,
  SearchOutlined,
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { getStockOutList, createStockOut, deleteStockOut, getStockList } from '../api/stock'
import type { StockOut, Stock, StockOutType } from '../api/types'
import styles from './StockOut.module.css'

// 出库类型选项
const OUT_TYPE_OPTIONS: { value: StockOutType; label: string }[] = [
  { value: 'production', label: '生产领料' },
  { value: 'sales', label: '销售提货' },
  { value: 'other', label: '其他出库' },
  { value: 'adjust_loss', label: '盘点盘亏' },
]

// 出库类型颜色映射
const OUT_TYPE_COLORS: Record<StockOutType, string> = {
  production: 'blue',
  sales: 'green',
  other: 'default',
  adjust_loss: 'red',
}

const StockOutPage = () => {
  const [loading, setLoading] = useState(false)
  const [stockOutList, setStockOutList] = useState<StockOut[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [outTypeFilter, setOutTypeFilter] = useState<StockOutType | ''>('')

  // 新建出库弹窗
  const [modalVisible, setModalVisible] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [stockList, setStockList] = useState<Stock[]>([])
  const [formData, setFormData] = useState({
    material_code: '',
    out_quantity: '',
    unit_price: '',
    out_value: '',
    out_type: 'production' as StockOutType,
    operator: '',
    remark: '',
  })

  // 加载出库列表
  const loadStockOutList = async () => {
    setLoading(true)
    try {
      const res = await getStockOutList({
        page,
        page_size: pageSize,
        search: search || undefined,
        out_type: outTypeFilter || undefined,
      })
      if (res.code === 200) {
        setStockOutList(res.data.list)
        setTotal(res.data.total)
      } else {
        message.error(res.message)
      }
    } catch {
      message.error('加载出库列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 加载库存列表（用于选择物料）
  const loadStockList = async () => {
    try {
      const res = await getStockList({ page_size: 100 })
      if (res.code === 200) {
        setStockList(res.data.list)
      }
    } catch {
      console.error('加载库存列表失败')
    }
  }

  useEffect(() => {
    loadStockOutList()
  }, [page, outTypeFilter])

  useEffect(() => {
    loadStockList()
  }, [])

  // 搜索
  const handleSearch = () => {
    setPage(1)
    loadStockOutList()
  }

  // 打开新建弹窗
  const handleOpenModal = () => {
    setFormData({
      material_code: '',
      out_quantity: '',
      unit_price: '',
      out_value: '',
      out_type: 'production',
      operator: '',
      remark: '',
    })
    setModalVisible(true)
  }

  // 提交出库
  const handleSubmit = async () => {
    if (!formData.material_code) {
      message.error('请选择物料')
      return
    }
    if (!formData.out_quantity || Number(formData.out_quantity) <= 0) {
      message.error('请输入有效的出库数量')
      return
    }
    if (!formData.unit_price || Number(formData.unit_price) < 0) {
      message.error('请输入有效的单价')
      return
    }

    // 计算出库价值 = 数量 * 单价
    const calculatedValue = Number(formData.out_quantity) * Number(formData.unit_price)

    setModalLoading(true)
    try {
      const res = await createStockOut({
        material_code: formData.material_code,
        out_quantity: Number(formData.out_quantity),
        out_value: calculatedValue,
        out_type: formData.out_type,
        operator: formData.operator || undefined,
        remark: formData.remark || undefined,
      })
      if (res.code === 200) {
        message.success(res.message)
        setModalVisible(false)
        loadStockOutList()
        loadStockList()
      } else {
        message.error(res.message)
      }
    } catch {
      message.error('出库失败')
    } finally {
      setModalLoading(false)
    }
  }

  // 删除出库记录
  const handleDelete = (record: StockOut) => {
    Modal.confirm({
      title: '确认撤销',
      content: `确定要撤销单据号 "${record.bill_no}" 的出库记录吗？撤销后库存将恢复。`,
      okText: '确认撤销',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const res = await deleteStockOut(record.id)
          if (res.code === 200) {
            message.success(res.message)
            loadStockOutList()
            loadStockList()
          } else {
            message.error(res.message)
          }
        } catch {
          message.error('撤销失败')
        }
      },
    })
  }

  // 选择物料时自动填充
  const handleMaterialChange = (code: string) => {
    setFormData({ ...formData, material_code: code })
  }

  return (
    <div className="page-container">
      {/* 导航栏 */}
      <header className="nav-header">
        <div className="nav-left">
          <span className={styles.navTitle}>Stock Out</span>
          <button className="icon-button" onClick={() => message.info('收藏功能')}>
            <StarOutlined style={{ fontSize: 20 }} />
          </button>
          <button className="icon-button" onClick={() => message.info('快捷操作')}>
            <ThunderboltOutlined style={{ fontSize: 20 }} />
          </button>
          <button className="icon-button" onClick={() => message.info('截图功能')}>
            <CameraOutlined style={{ fontSize: 20 }} />
          </button>
        </div>
        <div className="nav-center">2025</div>
        <div className="nav-right">
          <Link to="/dashboard" className="nav-link">Home</Link>
          <Link to="/profile" className="nav-link">Profile</Link>
        </div>
      </header>

      {/* 主体内容 */}
      <main className={styles.main}>
        {/* 左侧标题区 */}
        <div className={styles.leftSection}>
          <h1 className="hero-title">
            STOCK<br />OUT
          </h1>
          <div className={styles.heroSubtitle}>出库</div>
        </div>

        {/* 右侧内容区 */}
        <div className={styles.rightSection}>
          <div className={`glass-card ${styles.contentCard}`}>
            {/* 操作栏 */}
            <div className={styles.toolbar}>
              <div className={styles.searchGroup}>
                <input
                  type="text"
                  className="cyber-input"
                  placeholder="搜索物料编号/名称"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button className="cyber-button" onClick={handleSearch}>
                  <SearchOutlined />
                </button>
              </div>
              <select
                className={`cyber-input ${styles.filterSelect}`}
                value={outTypeFilter}
                onChange={(e) => setOutTypeFilter(e.target.value as StockOutType | '')}
              >
                <option value="">全部类型</option>
                {OUT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button className="cyber-button" onClick={() => loadStockOutList()}>
                <ReloadOutlined />
              </button>
              <button className="cyber-button" onClick={handleOpenModal}>
                <PlusOutlined /> 新建出库
              </button>
            </div>

            {/* 表格 */}
            <div className={styles.tableWrapper}>
              {loading ? (
                <div className={styles.loadingWrapper}>
                  <Spin indicator={<LoadingOutlined style={{ fontSize: 32 }} />} />
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>单据号</th>
                      <th>物料编号</th>
                      <th>物料名称</th>
                      <th>出库类型</th>
                      <th>出库数量</th>
                      <th>出库价值</th>
                      <th>操作人</th>
                      <th>出库时间</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockOutList.length === 0 ? (
                      <tr>
                        <td colSpan={9} className={styles.emptyCell}>
                          暂无出库记录
                        </td>
                      </tr>
                    ) : (
                      stockOutList.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <span style={{ fontFamily: 'monospace' }}>{item.bill_no}</span>
                          </td>
                          <td>{item.material_code}</td>
                          <td>{item.material_name}</td>
                          <td>
                            <Tag color={OUT_TYPE_COLORS[item.out_type] || 'default'}>
                              {item.out_type_display}
                            </Tag>
                          </td>
                          <td>{item.out_quantity}</td>
                          <td>¥{item.out_value}</td>
                          <td>{item.operator || '-'}</td>
                          <td>{new Date(item.out_time).toLocaleString()}</td>
                          <td>
                            <button
                              className={styles.deleteBtn}
                              onClick={() => handleDelete(item)}
                              title="撤销出库"
                            >
                              <DeleteOutlined />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* 分页 */}
            <div className={styles.pagination}>
              <span className={styles.totalText}>共 {total} 条记录</span>
              <div className={styles.pageButtons}>
                <button
                  className="cyber-button-ghost"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  上一页
                </button>
                <span className={styles.pageInfo}>第 {page} 页</span>
                <button
                  className="cyber-button-ghost"
                  disabled={page * pageSize >= total}
                  onClick={() => setPage(page + 1)}
                >
                  下一页
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 新建出库弹窗 */}
      <Modal
        title="新建出库"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        rootClassName="stock-out-modal"
      >
        <style>{`
          .stock-out-modal .ant-modal-content {
            background: rgba(0, 0, 0, 0.95) !important;
            border: 2px solid rgba(79, 140, 255, 0.6) !important;
            border-radius: 12px !important;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8), 0 0 20px rgba(79, 140, 255, 0.3) !important;
            padding: 0 !important;
            overflow: hidden !important;
          }
          .stock-out-modal .ant-modal-header {
            background: rgba(0, 0, 0, 0.95) !important;
            border-bottom: 1px solid rgba(79, 140, 255, 0.4) !important;
            padding: 16px 20px !important;
            margin: 0 !important;
          }
          .stock-out-modal .ant-modal-body {
            background: rgba(0, 0, 0, 0.95) !important;
            padding: 20px !important;
          }
          .stock-out-modal .ant-modal-title {
            color: #ffffff !important;
            font-size: 18px !important;
            font-weight: 600 !important;
          }
          .stock-out-modal .ant-modal-close {
            color: #ffffff !important;
            width: 32px !important;
            height: 32px !important;
          }
          .stock-out-modal .ant-modal-close:hover {
            color: #4F8CFF !important;
            background: rgba(79, 140, 255, 0.2) !important;
          }
          .stock-out-modal .ant-modal-close .ant-modal-close-x {
            font-size: 18px !important;
          }
          .stock-out-modal .ant-modal-container,
          .stock-out-modal .ant-modal-wrap,
          .stock-out-modal * {
            background-color: transparent !important;
          }
          .stock-out-modal .ant-modal-content,
          .stock-out-modal .ant-modal-header,
          .stock-out-modal .ant-modal-body {
            background: rgba(0, 0, 0, 0.95) !important;
          }
        `}</style>
        <div className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label>物料 *</label>
            <select
              value={formData.material_code}
              onChange={(e) => handleMaterialChange(e.target.value)}
            >
              <option value="">请选择物料</option>
              {stockList.map((stock) => (
                <option key={stock.id} value={stock.material_code}>
                  {stock.material_code} - {stock.material_name} (库存: {stock.current_stock})
                </option>
              ))}
            </select>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>出库类型 *</label>
              <select
                value={formData.out_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    out_type: e.target.value as StockOutType,
                  })
                }
              >
                {OUT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>出库数量 *</label>
              <input
                type="number"
                placeholder="请输入出库数量"
                value={formData.out_quantity}
                onChange={(e) => setFormData({ ...formData, out_quantity: e.target.value })}
              />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>单价 *</label>
              <input
                type="number"
                step="0.01"
                placeholder="请输入单价"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
              />
            </div>
            <div className={styles.formGroup}>
              <label>出库价值（自动计算）</label>
              <input
                type="text"
                value={formData.out_quantity && formData.unit_price
                  ? `¥${(Number(formData.out_quantity) * Number(formData.unit_price)).toFixed(2)}`
                  : ''}
                disabled
                placeholder="数量 × 单价"
              />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>操作人</label>
              <input
                type="text"
                placeholder="请输入操作人（可选）"
                value={formData.operator}
                onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
              />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>备注</label>
            <textarea
              placeholder="请输入备注（可选）"
              value={formData.remark}
              onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
              rows={3}
            />
          </div>
          <div className={styles.modalFooter}>
            <button
              className="cyber-button-ghost"
              onClick={() => setModalVisible(false)}
              disabled={modalLoading}
            >
              取消
            </button>
            <button
              className="cyber-button"
              onClick={handleSubmit}
              disabled={modalLoading}
            >
              {modalLoading ? <Spin indicator={<LoadingOutlined />} /> : '确认出库'}
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

export default StockOutPage
