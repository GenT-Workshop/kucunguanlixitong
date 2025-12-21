import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { message, Table, Spin, Modal } from 'antd'
import {
  ThunderboltOutlined,
  StarOutlined,
  ReloadOutlined,
  FileTextOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import { getMonthlyReportList, getMonthlyReportDetail } from '../api/stock'
import type { MonthlyReportItem, MonthlyReportDetail, MonthlyDetailItem } from '../api/types'
import styles from './MonthlyReport.module.css'

const MonthlyReport = () => {
  const [loading, setLoading] = useState(false)
  const [reportList, setReportList] = useState<MonthlyReportItem[]>([])

  // 详情弹窗
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [currentDetail, setCurrentDetail] = useState<MonthlyReportDetail | null>(null)

  // 加载月度报表列表
  const loadReportList = async () => {
    setLoading(true)
    try {
      const res = await getMonthlyReportList()
      if (res.code === 200 && res.data) {
        setReportList(res.data)
      } else {
        message.error(res.message || '获取月度报表失败')
      }
    } catch {
      message.error('获取月度报表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReportList()
  }, [])

  // 查看月度详情
  const handleViewDetail = async (month: string) => {
    setDetailModalVisible(true)
    setDetailLoading(true)
    try {
      const res = await getMonthlyReportDetail(month)
      if (res.code === 200 && res.data) {
        setCurrentDetail(res.data)
      } else {
        message.error(res.message || '获取详情失败')
      }
    } catch {
      message.error('获取详情失败')
    } finally {
      setDetailLoading(false)
    }
  }

  // 月度列表表格列
  const columns = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 120,
      render: (val: string) => <span className={styles.monthCell}>{val}</span>,
    },
    {
      title: '入库单数',
      dataIndex: 'in_count',
      key: 'in_count',
      width: 100,
    },
    {
      title: '入库数量',
      dataIndex: 'in_qty',
      key: 'in_qty',
      width: 100,
      render: (val: number) => <span className={styles.inValue}>{val}</span>,
    },
    {
      title: '入库金额',
      dataIndex: 'in_value',
      key: 'in_value',
      width: 120,
      render: (val: string) => <span className={styles.inValue}>¥{val}</span>,
    },
    {
      title: '出库单数',
      dataIndex: 'out_count',
      key: 'out_count',
      width: 100,
    },
    {
      title: '出库数量',
      dataIndex: 'out_qty',
      key: 'out_qty',
      width: 100,
      render: (val: number) => <span className={styles.outValue}>{val}</span>,
    },
    {
      title: '出库金额',
      dataIndex: 'out_value',
      key: 'out_value',
      width: 120,
      render: (val: string) => <span className={styles.outValue}>¥{val}</span>,
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: unknown, record: MonthlyReportItem) => (
        <button
          className={styles.viewBtn}
          onClick={() => handleViewDetail(record.month)}
          title="查看详情"
        >
          <EyeOutlined />
        </button>
      ),
    },
  ]

  // 详情表格列
  const detailColumns = [
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
      title: '入库数量',
      dataIndex: 'in_qty',
      key: 'in_qty',
      width: 90,
      render: (val: number) => <span className={styles.inValue}>{val}</span>,
    },
    {
      title: '入库金额',
      dataIndex: 'in_value',
      key: 'in_value',
      width: 100,
      render: (val: string) => <span className={styles.inValue}>¥{val}</span>,
    },
    {
      title: '出库数量',
      dataIndex: 'out_qty',
      key: 'out_qty',
      width: 90,
      render: (val: number) => <span className={styles.outValue}>{val}</span>,
    },
    {
      title: '出库金额',
      dataIndex: 'out_value',
      key: 'out_value',
      width: 100,
      render: (val: string) => <span className={styles.outValue}>¥{val}</span>,
    },
    {
      title: '当前库存',
      dataIndex: 'current_stock',
      key: 'current_stock',
      width: 90,
    },
    {
      title: '库存价值',
      dataIndex: 'stock_value',
      key: 'stock_value',
      width: 100,
      render: (val: string) => <span>¥{val}</span>,
    },
  ]

  return (
    <div className="page-container">
      {/* 导航栏 */}
      <header className="nav-header">
        <div className="nav-left">
          <span className={styles.navTitle}>Monthly Report</span>
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
            MONTHLY<br />REPORT
          </h1>
          <div className="hero-year">结存</div>
        </div>

        {/* 右侧内容区 */}
        <div className={styles.rightSection}>
          <div className={`glass-card ${styles.contentCard}`}>
            {/* 头部操作栏 */}
            <div className={styles.header}>
              <h2 className={styles.title}>
                <FileTextOutlined className={styles.titleIcon} />
                月底结存
              </h2>
              <div className={styles.actions}>
                <button className="icon-button" onClick={loadReportList}>
                  <ReloadOutlined style={{ fontSize: 18 }} />
                </button>
              </div>
            </div>

            {/* 表格 */}
            <div className={styles.tableWrapper}>
              <Table
                columns={columns}
                dataSource={reportList}
                rowKey="month"
                loading={loading}
                pagination={false}
                className={styles.table}
                scroll={{ x: 900 }}
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
        width={1000}
        centered
      >
        <div className={styles.modalContent}>
          <h3 className={styles.modalTitle}>
            {currentDetail?.month} 月度结存明细
          </h3>

          {detailLoading ? (
            <div className={styles.loadingWrapper}>
              <Spin size="large" />
            </div>
          ) : currentDetail ? (
            <>
              {/* 汇总信息 */}
              <div className={styles.summaryCards}>
                <div className={styles.summaryCard}>
                  <div className={styles.summaryLabel}>物料种类</div>
                  <div className={styles.summaryValue}>{currentDetail.summary.material_count}</div>
                </div>
                <div className={styles.summaryCard}>
                  <div className={styles.summaryLabel}>入库数量</div>
                  <div className={`${styles.summaryValue} ${styles.inValue}`}>
                    {currentDetail.summary.total_in_qty}
                  </div>
                </div>
                <div className={styles.summaryCard}>
                  <div className={styles.summaryLabel}>入库金额</div>
                  <div className={`${styles.summaryValue} ${styles.inValue}`}>
                    ¥{currentDetail.summary.total_in_value}
                  </div>
                </div>
                <div className={styles.summaryCard}>
                  <div className={styles.summaryLabel}>出库数量</div>
                  <div className={`${styles.summaryValue} ${styles.outValue}`}>
                    {currentDetail.summary.total_out_qty}
                  </div>
                </div>
                <div className={styles.summaryCard}>
                  <div className={styles.summaryLabel}>出库金额</div>
                  <div className={`${styles.summaryValue} ${styles.outValue}`}>
                    ¥{currentDetail.summary.total_out_value}
                  </div>
                </div>
              </div>

              {/* 明细表格 */}
              <div className={styles.detailTableWrapper}>
                <Table
                  columns={detailColumns}
                  dataSource={currentDetail.details}
                  rowKey="material_code"
                  pagination={false}
                  className={styles.table}
                  scroll={{ x: 800, y: 350 }}
                  size="small"
                />
              </div>
            </>
          ) : (
            <p className={styles.noData}>暂无数据</p>
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

export default MonthlyReport
