import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { message, Spin, Table, Modal, Tag } from 'antd'
import {
  ThunderboltOutlined,
  StarOutlined,
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  LoadingOutlined,
  InboxOutlined,
  DeleteOutlined,
  AppstoreAddOutlined,
} from '@ant-design/icons'
import { createStockIn, getStockInList, getStockList, deleteStockIn, stockInit } from '../api/stock'
import type { StockIn as StockInType, Stock, StockInType as InType } from '../api/types'
import { useAutoRefresh } from '../hooks/useAutoRefresh'
import styles from './StockIn.module.css'

// 入库类型选项
const IN_TYPE_OPTIONS: { value: InType; label: string }[] = [
  { value: 'purchase', label: '采购入库' },
  { value: 'production', label: '生产入库' },
  { value: 'return', label: '退货入库' },
  { value: 'other', label: '其他入库' },
  { value: 'adjust_gain', label: '盘点盘盈' },
]

// 入库类型颜色映射
const IN_TYPE_COLORS: Record<InType, string> = {
  purchase: 'blue',
  production: 'green',
  return: 'orange',
  other: 'default',
  adjust_gain: 'purple',
}

const StockIn = () => {
  const [loading, setLoading] = useState(false)
  const [tableLoading, setTableLoading] = useState(false)
  const [stockInList, setStockInList] = useState<StockInType[]>([])
  const [stockList, setStockList] = useState<Stock[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [inTypeFilter, setInTypeFilter] = useState<InType | ''>('')
  const [modalVisible, setModalVisible] = useState(false)

  // 新增物料弹窗状态
  const [materialModalVisible, setMaterialModalVisible] = useState(false)
  const [materialLoading, setMaterialLoading] = useState(false)
  const [materialForm, setMaterialForm] = useState({
    material_code: '',
    material_name: '',
    spec: '',
    unit: '',
    category: '',
    max_stock: '',
    min_stock: '',
  })

  // 表单状态
  const [formData, setFormData] = useState({
    material_code: '',
    in_quantity: '',
    unit_price: '',
    in_value: '',
    in_time: '',
    in_type: 'purchase' as InType,
    supplier: '',
    operator: '',
    remark: '',
  })

  // 加载入库记录列表
  const loadStockInList = useCallback(async () => {
    setTableLoading(true)
    try {
      const res = await getStockInList({
        page,
        page_size: pageSize,
        search: search || undefined,
        in_type: inTypeFilter || undefined,
      })
      if (res.code === 200 && res.data) {
        setStockInList(res.data.list)
        setTotal(res.data.total)
      } else {
        message.error(res.message || '获取入库记录失败')
      }
    } catch {
      message.error('获取入库记录失败')
    } finally {
      setTableLoading(false)
    }
  }, [page, pageSize, search, inTypeFilter])

  // 加载库存列表（用于选择物料）
  const loadStockList = async () => {
    try {
      const res = await getStockList({ page: 1, page_size: 100 })
      if (res.code === 200 && res.data) {
        setStockList(res.data.list)
      }
    } catch {
      console.error('获取库存列表失败')
    }
  }

  useEffect(() => {
    loadStockInList()
    loadStockList()
  }, [page, inTypeFilter, loadStockInList])

  // 自动刷新数据（每2秒）
  useAutoRefresh(loadStockInList, { interval: 2000 })

  // 搜索
  const handleSearch = () => {
    setPage(1)
    loadStockInList()
  }

  // 打开新增物料弹窗
  const openMaterialModal = () => {
    setMaterialForm({
      material_code: '',
      material_name: '',
      spec: '',
      unit: '',
      category: '',
      max_stock: '',
      min_stock: '',
    })
    setMaterialModalVisible(true)
  }

  // 提交新增物料
  const handleMaterialSubmit = async () => {
    if (!materialForm.material_code) {
      message.error('请输入物料编号')
      return
    }
    if (!materialForm.material_name) {
      message.error('请输入物料名称')
      return
    }

    setMaterialLoading(true)
    try {
      const res = await stockInit({
        material_code: materialForm.material_code,
        material_name: materialForm.material_name,
        spec: materialForm.spec || undefined,
        unit: materialForm.unit || undefined,
        category: materialForm.category || undefined,
        max_stock: materialForm.max_stock ? Number(materialForm.max_stock) : undefined,
        min_stock: materialForm.min_stock ? Number(materialForm.min_stock) : undefined,
      })
      if (res.code === 200) {
        message.success(res.message || '物料添加成功')
        setMaterialModalVisible(false)
        loadStockList()
        loadStockInList()
      } else {
        message.error(res.message || '物料添加失败')
      }
    } catch {
      message.error('物料添加失败，请稍后重试')
    } finally {
      setMaterialLoading(false)
    }
  }

  // 打开新增入库弹窗
  const openModal = () => {
    setFormData({
      material_code: '',
      in_quantity: '',
      unit_price: '',
      in_value: '',
      in_time: '',
      in_type: 'purchase',
      supplier: '',
      operator: '',
      remark: '',
    })
    setModalVisible(true)
  }

  // 提交入库
  const handleSubmit = async () => {
    if (!formData.material_code) {
      message.error('请选择物料')
      return
    }
    if (!formData.in_quantity || Number(formData.in_quantity) <= 0) {
      message.error('入库数量必须大于0')
      return
    }
    if (!formData.unit_price || Number(formData.unit_price) < 0) {
      message.error('请输入有效的单价')
      return
    }

    // 计算入库价值 = 数量 * 单价
    const calculatedValue = Number(formData.in_quantity) * Number(formData.unit_price)

    setLoading(true)
    try {
      const res = await createStockIn({
        material_code: formData.material_code,
        in_quantity: Number(formData.in_quantity),
        in_value: calculatedValue,
        in_type: formData.in_type,
        in_time: formData.in_time || undefined,
        supplier: formData.supplier || undefined,
        operator: formData.operator || undefined,
        remark: formData.remark || undefined,
      })
      if (res.code === 200) {
        message.success(res.message || '入库成功')
        setModalVisible(false)
        loadStockInList()
        loadStockList()
      } else {
        message.error(res.message || '入库失败')
      }
    } catch {
      message.error('入库失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 撤销入库
  const handleDelete = (record: StockInType) => {
    Modal.confirm({
      title: '确认撤销',
      content: `确定要撤销单据号 "${record.bill_no}" 的入库记录吗？撤销后库存将扣减。`,
      okText: '确认撤销',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const res = await deleteStockIn(record.id)
          if (res.code === 200) {
            message.success(res.message || '撤销成功')
            loadStockInList()
            loadStockList()
          } else {
            message.error(res.message || '撤销失败')
          }
        } catch {
          message.error('撤销失败')
        }
      },
    })
  }

  // 表格列定义
  const columns = [
    {
      title: '单据号',
      dataIndex: 'bill_no',
      key: 'bill_no',
      width: 160,
      render: (val: string) => <span style={{ fontFamily: 'monospace' }}>{val}</span>,
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
      width: 120,
    },
    {
      title: '入库类型',
      dataIndex: 'in_type',
      key: 'in_type',
      width: 100,
      render: (val: InType, record: StockInType) => (
        <Tag color={IN_TYPE_COLORS[val] || 'default'}>
          {record.in_type_display || val}
        </Tag>
      ),
    },
    {
      title: '入库数量',
      dataIndex: 'in_quantity',
      key: 'in_quantity',
      width: 100,
      render: (val: number) => <span className={styles.quantityCell}>{val}</span>,
    },
    {
      title: '入库价值',
      dataIndex: 'in_value',
      key: 'in_value',
      width: 100,
      render: (val: string) => <span className={styles.valueCell}>¥{val}</span>,
    },
    {
      title: '供应商',
      dataIndex: 'supplier',
      key: 'supplier',
      width: 100,
      render: (val: string) => val || '-',
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      key: 'operator',
      width: 80,
      render: (val: string) => val || '-',
    },
    {
      title: '入库时间',
      dataIndex: 'in_time',
      key: 'in_time',
      width: 160,
      render: (val: string) => {
        const d = new Date(val)
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        const hour = String(d.getHours()).padStart(2, '0')
        const minute = String(d.getMinutes()).padStart(2, '0')
        return `${year}/${month}/${day} ${hour}:${minute}`
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: unknown, record: StockInType) => (
        <button
          className={styles.deleteBtn}
          onClick={() => handleDelete(record)}
          title="撤销入库"
        >
          <DeleteOutlined />
        </button>
      ),
    },
  ]

  return (
    <div className="page-container">
      {/* 导航栏 */}
      <header className="nav-header">
        <div className="nav-left">
          <span className={styles.navTitle}>Stock In</span>
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
            STOCK<br />IN
          </h1>
          <div className="hero-year">入库</div>
        </div>

        {/* 右侧内容区 */}
        <div className={styles.rightSection}>
          <div className={`glass-card ${styles.contentCard}`}>
            {/* 头部操作栏 */}
            <div className={styles.header}>
              <h2 className={styles.title}>
                <InboxOutlined className={styles.titleIcon} />
                入库管理
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
                  value={inTypeFilter}
                  onChange={(e) => setInTypeFilter(e.target.value as InType | '')}
                >
                  <option value="">全部类型</option>
                  {IN_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button className="icon-button" onClick={loadStockInList}>
                  <ReloadOutlined style={{ fontSize: 18 }} />
                </button>
                <button className={`cyber-button-ghost ${styles.addMaterialBtn}`} onClick={openMaterialModal}>
                  <AppstoreAddOutlined /> 新增物料
                </button>
                <button className={`cyber-button ${styles.addBtn}`} onClick={openModal}>
                  <PlusOutlined /> 新增入库
                </button>
              </div>
            </div>

            {/* 表格 */}
            <div className={styles.tableWrapper}>
              <Table
                columns={columns}
                dataSource={stockInList}
                rowKey="id"
                loading={tableLoading}
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

      {/* 新增入库弹窗 */}
      <Modal
        title="新增入库"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        rootClassName="stock-in-modal"
        width={520}
        centered
      >
        <style>{`
          .stock-in-modal .ant-modal-content {
            background: rgba(0, 0, 0, 0.95) !important;
            border: 2px solid rgba(79, 140, 255, 0.6) !important;
            border-radius: 12px !important;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8), 0 0 20px rgba(79, 140, 255, 0.3) !important;
            padding: 0 !important;
            overflow: hidden !important;
          }
          .stock-in-modal .ant-modal-header {
            background: rgba(0, 0, 0, 0.95) !important;
            border-bottom: 1px solid rgba(79, 140, 255, 0.4) !important;
            padding: 16px 20px !important;
            margin: 0 !important;
          }
          .stock-in-modal .ant-modal-body {
            background: rgba(0, 0, 0, 0.95) !important;
            padding: 20px !important;
          }
          .stock-in-modal .ant-modal-title {
            color: #ffffff !important;
            font-size: 18px !important;
            font-weight: 600 !important;
          }
          .stock-in-modal .ant-modal-close {
            color: #ffffff !important;
          }
          .stock-in-modal .ant-modal-close:hover {
            color: #4F8CFF !important;
            background: rgba(79, 140, 255, 0.2) !important;
          }
        `}</style>
        <div className={styles.form}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>物料编号 *</label>
              <select
                className="cyber-input"
                value={formData.material_code}
                onChange={(e) => setFormData({ ...formData, material_code: e.target.value })}
                disabled={loading}
              >
                <option value="">请选择物料</option>
                {stockList.map((stock) => (
                  <option key={stock.id} value={stock.material_code}>
                    {stock.material_code} - {stock.material_name} (库存: {stock.current_stock})
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>入库类型 *</label>
                <select
                  className="cyber-input"
                  value={formData.in_type}
                  onChange={(e) => setFormData({ ...formData, in_type: e.target.value as InType })}
                  disabled={loading}
                >
                  {IN_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>入库数量 *</label>
                <input
                  type="number"
                  className="cyber-input"
                  placeholder="请输入入库数量"
                  value={formData.in_quantity}
                  onChange={(e) => setFormData({ ...formData, in_quantity: e.target.value })}
                  disabled={loading}
                  min="1"
                />
              </div>
            </div>

            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>单价 *</label>
                <input
                  type="number"
                  className="cyber-input"
                  placeholder="请输入单价"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                  disabled={loading}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>入库价值（自动计算）</label>
                <input
                  type="text"
                  className="cyber-input"
                  value={formData.in_quantity && formData.unit_price
                    ? `¥${(Number(formData.in_quantity) * Number(formData.unit_price)).toFixed(2)}`
                    : ''}
                  disabled
                  placeholder="数量 × 单价"
                />
              </div>
            </div>

            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>供应商</label>
                <input
                  type="text"
                  className="cyber-input"
                  placeholder="请输入供应商（可选）"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>操作人</label>
                <input
                  type="text"
                  className="cyber-input"
                  placeholder="请输入操作人（可选）"
                  value={formData.operator}
                  onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                  disabled={loading}
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>入库时间</label>
              <input
                type="datetime-local"
                className="cyber-input"
                value={formData.in_time}
                onChange={(e) => setFormData({ ...formData, in_time: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>备注</label>
              <textarea
                className="cyber-input"
                placeholder="请输入备注（可选）"
                value={formData.remark}
                onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                disabled={loading}
                rows={2}
                style={{ resize: 'none' }}
              />
            </div>

            <div className={styles.modalActions}>
              <button
                className="cyber-button-ghost"
                onClick={() => setModalVisible(false)}
                disabled={loading}
              >
                取消
              </button>
              <button
                className="cyber-button"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? <Spin indicator={<LoadingOutlined style={{ color: '#fff' }} />} /> : '确认入库'}
              </button>
            </div>
          </div>
      </Modal>

      {/* 新增物料弹窗 */}
      <Modal
        title="新增物料"
        open={materialModalVisible}
        onCancel={() => setMaterialModalVisible(false)}
        footer={null}
        rootClassName="stock-material-modal"
        width={560}
        centered
      >
        <style>{`
          .stock-material-modal .ant-modal-content {
            background: rgba(0, 0, 0, 0.95) !important;
            border: 2px solid rgba(79, 140, 255, 0.6) !important;
            border-radius: 12px !important;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8), 0 0 20px rgba(79, 140, 255, 0.3) !important;
            padding: 0 !important;
            overflow: hidden !important;
          }
          .stock-material-modal .ant-modal-header {
            background: rgba(0, 0, 0, 0.95) !important;
            border-bottom: 1px solid rgba(79, 140, 255, 0.4) !important;
            padding: 16px 20px !important;
            margin: 0 !important;
          }
          .stock-material-modal .ant-modal-body {
            background: rgba(0, 0, 0, 0.95) !important;
            padding: 20px !important;
          }
          .stock-material-modal .ant-modal-title {
            color: #ffffff !important;
            font-size: 18px !important;
            font-weight: 600 !important;
          }
          .stock-material-modal .ant-modal-close {
            color: #ffffff !important;
          }
          .stock-material-modal .ant-modal-close:hover {
            color: #4F8CFF !important;
            background: rgba(79, 140, 255, 0.2) !important;
          }
        `}</style>
        <div className={styles.form}>
          <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>物料编号 *</label>
                <input
                  type="text"
                  className="cyber-input"
                  placeholder="如: M001"
                  value={materialForm.material_code}
                  onChange={(e) => setMaterialForm({ ...materialForm, material_code: e.target.value })}
                  disabled={materialLoading}
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>物料名称 *</label>
                <input
                  type="text"
                  className="cyber-input"
                  placeholder="如: 螺丝钉"
                  value={materialForm.material_name}
                  onChange={(e) => setMaterialForm({ ...materialForm, material_name: e.target.value })}
                  disabled={materialLoading}
                />
              </div>
            </div>

            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>规格型号</label>
                <input
                  type="text"
                  className="cyber-input"
                  placeholder="如: M6x20"
                  value={materialForm.spec}
                  onChange={(e) => setMaterialForm({ ...materialForm, spec: e.target.value })}
                  disabled={materialLoading}
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>单位</label>
                <input
                  type="text"
                  className="cyber-input"
                  placeholder="如: 个、件、kg"
                  value={materialForm.unit}
                  onChange={(e) => setMaterialForm({ ...materialForm, unit: e.target.value })}
                  disabled={materialLoading}
                />
              </div>
            </div>

            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>类别</label>
                <input
                  type="text"
                  className="cyber-input"
                  placeholder="如: 五金配件"
                  value={materialForm.category}
                  onChange={(e) => setMaterialForm({ ...materialForm, category: e.target.value })}
                  disabled={materialLoading}
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>最小库存</label>
                <input
                  type="number"
                  className="cyber-input"
                  placeholder="低于此值预警"
                  value={materialForm.min_stock}
                  onChange={(e) => setMaterialForm({ ...materialForm, min_stock: e.target.value })}
                  disabled={materialLoading}
                  min="0"
                />
              </div>
            </div>

            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>最大库存</label>
                <input
                  type="number"
                  className="cyber-input"
                  placeholder="超过此值禁止入库"
                  value={materialForm.max_stock}
                  onChange={(e) => setMaterialForm({ ...materialForm, max_stock: e.target.value })}
                  disabled={materialLoading}
                  min="0"
                />
              </div>
              <div className={styles.inputGroup}></div>
            </div>

            <div className={styles.modalActions}>
              <button
                className="cyber-button-ghost"
                onClick={() => setMaterialModalVisible(false)}
                disabled={materialLoading}
              >
                取消
              </button>
              <button
                className="cyber-button"
                onClick={handleMaterialSubmit}
                disabled={materialLoading}
              >
                {materialLoading ? <Spin indicator={<LoadingOutlined style={{ color: '#fff' }} />} /> : '确认添加'}
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

export default StockIn
