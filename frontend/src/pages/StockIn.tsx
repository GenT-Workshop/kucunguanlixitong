import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { message, Spin, Table, Modal } from 'antd'
import {
  ThunderboltOutlined,
  StarOutlined,
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  LoadingOutlined,
  InboxOutlined,
} from '@ant-design/icons'
import { createStockIn, getStockInList, getStockList } from '../api/stock'
import type { StockIn as StockInType, Stock } from '../api/types'
import styles from './StockIn.module.css'

const StockIn = () => {
  const [loading, setLoading] = useState(false)
  const [tableLoading, setTableLoading] = useState(false)
  const [stockInList, setStockInList] = useState<StockInType[]>([])
  const [stockList, setStockList] = useState<Stock[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [modalVisible, setModalVisible] = useState(false)

  // 表单状态
  const [materialCode, setMaterialCode] = useState('')
  const [inQuantity, setInQuantity] = useState('')
  const [inValue, setInValue] = useState('')
  const [inTime, setInTime] = useState('')

  // 加载入库记录列表
  const loadStockInList = async () => {
    setTableLoading(true)
    try {
      const res = await getStockInList({ page, page_size: pageSize, search })
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
  }

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
  }, [page])

  // 搜索
  const handleSearch = () => {
    setPage(1)
    loadStockInList()
  }

  // 打开新增入库弹窗
  const openModal = () => {
    setMaterialCode('')
    setInQuantity('')
    setInValue('')
    setInTime('')
    setModalVisible(true)
  }

  // 提交入库
  const handleSubmit = async () => {
    if (!materialCode) {
      message.error('请选择物料')
      return
    }
    if (!inQuantity || Number(inQuantity) <= 0) {
      message.error('入库数量必须大于0')
      return
    }
    if (!inValue) {
      message.error('请输入入库价值')
      return
    }

    setLoading(true)
    try {
      const res = await createStockIn({
        material_code: materialCode,
        in_quantity: Number(inQuantity),
        in_value: Number(inValue),
        in_time: inTime || undefined,
      })
      if (res.code === 200) {
        message.success('入库成功')
        setModalVisible(false)
        loadStockInList()
      } else {
        message.error(res.message || '入库失败')
      }
    } catch {
      message.error('入库失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 表格列定义
  const columns = [
    {
      title: '物料编号',
      dataIndex: 'material_code',
      key: 'material_code',
    },
    {
      title: '物料名称',
      dataIndex: 'material_name',
      key: 'material_name',
    },
    {
      title: '入库数量',
      dataIndex: 'in_quantity',
      key: 'in_quantity',
      render: (val: number) => <span className={styles.quantityCell}>{val}</span>,
    },
    {
      title: '入库价值',
      dataIndex: 'in_value',
      key: 'in_value',
      render: (val: string) => <span className={styles.valueCell}>¥{val}</span>,
    },
    {
      title: '入库时间',
      dataIndex: 'in_time',
      key: 'in_time',
      render: (val: string) => new Date(val).toLocaleString('zh-CN'),
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
          <Link to="/login" className="nav-link">Home</Link>
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
                <button className="icon-button" onClick={loadStockInList}>
                  <ReloadOutlined style={{ fontSize: 18 }} />
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
              />
            </div>
          </div>
        </div>
      </main>

      {/* 新增入库弹窗 */}
      <Modal
        title={null}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        className={styles.modal}
        width={480}
        centered
      >
        <div className={styles.modalContent}>
          <h3 className={styles.modalTitle}>新增入库</h3>
          <p className={styles.modalSubtitle}>请填写入库信息</p>

          <div className={styles.form}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>物料编号</label>
              <select
                className="cyber-input"
                value={materialCode}
                onChange={(e) => setMaterialCode(e.target.value)}
                disabled={loading}
              >
                <option value="">请选择物料</option>
                {stockList.map((stock) => (
                  <option key={stock.id} value={stock.material_code}>
                    {stock.material_code} - {stock.material_name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>入库数量</label>
              <input
                type="number"
                className="cyber-input"
                placeholder="请输入入库数量"
                value={inQuantity}
                onChange={(e) => setInQuantity(e.target.value)}
                disabled={loading}
                min="1"
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>入库价值</label>
              <input
                type="number"
                className="cyber-input"
                placeholder="请输入入库价值"
                value={inValue}
                onChange={(e) => setInValue(e.target.value)}
                disabled={loading}
                min="0"
                step="0.01"
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>入库时间（可选）</label>
              <input
                type="datetime-local"
                className="cyber-input"
                value={inTime}
                onChange={(e) => setInTime(e.target.value)}
                disabled={loading}
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
