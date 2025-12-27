import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { message, Spin, Table } from 'antd'
import {
  ThunderboltOutlined,
  StarOutlined,
  ReloadOutlined,
  BarChartOutlined,
  InboxOutlined,
  ExportOutlined,
  AlertOutlined,
  DatabaseOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons'
import {
  getStatisticsOverview,
  getStatisticsTrend,
  getStatisticsRanking,
  getStatisticsCategory,
} from '../api/stock'
import type { StatisticsOverview, TrendDataItem, RankingItem, CategoryStatItem } from '../api/types'
import styles from './Statistics.module.css'

const Statistics = () => {
  const [loading, setLoading] = useState(false)
  const [overview, setOverview] = useState<StatisticsOverview | null>(null)
  const [trendData, setTrendData] = useState<TrendDataItem[]>([])
  const [trendDays, setTrendDays] = useState<7 | 30>(7)
  const [rankingData, setRankingData] = useState<RankingItem[]>([])
  const [rankingType, setRankingType] = useState<'in' | 'out'>('out')
  const [categoryData, setCategoryData] = useState<CategoryStatItem[]>([])

  // 加载统计概览
  const loadOverview = async () => {
    try {
      const res = await getStatisticsOverview()
      if (res.code === 200 && res.data) {
        setOverview(res.data)
      }
    } catch {
      console.error('获取统计概览失败')
    }
  }

  // 加载趋势数据
  const loadTrend = async () => {
    try {
      const res = await getStatisticsTrend(trendDays)
      if (res.code === 200 && res.data) {
        // 后端返回 {in_trend: [...], out_trend: [...]}，需要合并成 TrendDataItem[]
        const { in_trend = [], out_trend = [] } = res.data as unknown as {
          in_trend: Array<{ date: string; qty: number; value: string }>
          out_trend: Array<{ date: string; qty: number; value: string }>
        }

        // 生成日期范围
        const dateMap = new Map<string, TrendDataItem>()
        const end = new Date()
        for (let i = trendDays - 1; i >= 0; i--) {
          const d = new Date(end)
          d.setDate(d.getDate() - i)
          const dateStr = d.toISOString().split('T')[0]
          dateMap.set(dateStr, { date: dateStr, in_qty: 0, out_qty: 0 })
        }

        // 填充入库数据
        in_trend.forEach(item => {
          const dateStr = typeof item.date === 'string' ? item.date.split('T')[0] : item.date
          if (dateMap.has(dateStr)) {
            dateMap.get(dateStr)!.in_qty = item.qty || 0
          }
        })

        // 填充出库数据
        out_trend.forEach(item => {
          const dateStr = typeof item.date === 'string' ? item.date.split('T')[0] : item.date
          if (dateMap.has(dateStr)) {
            dateMap.get(dateStr)!.out_qty = item.qty || 0
          }
        })

        setTrendData(Array.from(dateMap.values()))
      }
    } catch {
      console.error('获取趋势数据失败')
    }
  }

  // 加载排行数据
  const loadRanking = async () => {
    try {
      const res = await getStatisticsRanking({ type: rankingType, order_by: 'qty', days: 30, limit: 10 })
      if (res.code === 200 && res.data) {
        // 添加排名字段
        const list = (res.data.list || []).map((item: RankingItem, index: number) => ({
          ...item,
          rank: index + 1,
          total_value: item.total_value || '0',
        }))
        setRankingData(list)
      }
    } catch {
      console.error('获取排行数据失败')
    }
  }

  // 加载类别统计
  const loadCategory = async () => {
    try {
      const res = await getStatisticsCategory()
      if (res.code === 200 && res.data) {
        setCategoryData(res.data)
      }
    } catch {
      console.error('获取类别统计失败')
    }
  }

  // 加载所有数据
  const loadAllData = async () => {
    setLoading(true)
    await Promise.all([loadOverview(), loadTrend(), loadRanking(), loadCategory()])
    setLoading(false)
  }

  useEffect(() => {
    loadAllData()
  }, [])

  useEffect(() => {
    loadTrend()
  }, [trendDays])

  useEffect(() => {
    loadRanking()
  }, [rankingType])

  // 计算趋势图的最大值
  const maxQty = Math.max(...trendData.map(d => Math.max(d.in_qty, d.out_qty)), 1)

  // 排行表格列
  const rankingColumns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 60,
      render: (val: number) => (
        <span className={val <= 3 ? styles.topRank : ''}>{val}</span>
      ),
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
    },
    {
      title: '数量',
      dataIndex: 'total_qty',
      key: 'total_qty',
      width: 100,
      render: (val: number) => <span className={styles.qtyValue}>{val}</span>,
    },
    {
      title: '金额',
      dataIndex: 'total_value',
      key: 'total_value',
      width: 120,
      render: (val: string) => <span className={styles.valueText}>¥{val}</span>,
    },
  ]

  // 类别表格列
  const categoryColumns = [
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: '物料数',
      dataIndex: 'count',
      key: 'count',
      width: 80,
    },
    {
      title: '库存数量',
      dataIndex: 'total_qty',
      key: 'total_qty',
      width: 100,
    },
    {
      title: '库存价值',
      dataIndex: 'total_value',
      key: 'total_value',
      width: 120,
      render: (val: string) => <span className={styles.valueText}>¥{val}</span>,
    },
  ]

  return (
    <div className="page-container">
      {/* 导航栏 */}
      <header className="nav-header">
        <div className="nav-left">
          <span className={styles.navTitle}>Statistics</span>
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
            STOCK<br />STATS
          </h1>
          <div className="hero-year">统计</div>
        </div>

        {/* 右侧内容区 */}
        <div className={styles.rightSection}>
          {loading ? (
            <div className={styles.loadingWrapper}>
              <Spin size="large" />
            </div>
          ) : (
            <div className={styles.statsContainer}>
              {/* 概览卡片 */}
              <div className={styles.overviewSection}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>
                    <BarChartOutlined className={styles.titleIcon} />
                    数据概览
                  </h2>
                  <button className="icon-button" onClick={loadAllData}>
                    <ReloadOutlined style={{ fontSize: 16 }} />
                  </button>
                </div>

                <div className={styles.overviewCards}>
                  <div className={styles.overviewCard}>
                    <div className={styles.cardIcon} style={{ background: 'rgba(114, 46, 209, 0.2)' }}>
                      <DatabaseOutlined style={{ color: '#722ED1', fontSize: 24 }} />
                    </div>
                    <div className={styles.cardContent}>
                      <div className={styles.cardValue}>{overview?.stock.total_count || 0}</div>
                      <div className={styles.cardLabel}>物料种类</div>
                    </div>
                    <div className={styles.cardExtra}>
                      <span className={styles.stockLow}>{overview?.stock.status_distribution.low || 0} 低</span>
                      <span className={styles.stockNormal}>{overview?.stock.status_distribution.normal || 0} 正常</span>
                      <span className={styles.stockHigh}>{overview?.stock.status_distribution.high || 0} 高</span>
                    </div>
                  </div>

                  <div className={styles.overviewCard}>
                    <div className={styles.cardIcon} style={{ background: 'rgba(79, 140, 255, 0.2)' }}>
                      <InboxOutlined style={{ color: '#4F8CFF', fontSize: 24 }} />
                    </div>
                    <div className={styles.cardContent}>
                      <div className={styles.cardValue}>{overview?.today_in.qty || 0}</div>
                      <div className={styles.cardLabel}>今日入库</div>
                    </div>
                    <div className={styles.cardExtra}>
                      <span>{overview?.today_in.count || 0} 单</span>
                      <span className={styles.valueText}>¥{overview?.today_in.value || '0'}</span>
                    </div>
                  </div>

                  <div className={styles.overviewCard}>
                    <div className={styles.cardIcon} style={{ background: 'rgba(82, 196, 26, 0.2)' }}>
                      <ExportOutlined style={{ color: '#52C41A', fontSize: 24 }} />
                    </div>
                    <div className={styles.cardContent}>
                      <div className={styles.cardValue}>{overview?.today_out.qty || 0}</div>
                      <div className={styles.cardLabel}>今日出库</div>
                    </div>
                    <div className={styles.cardExtra}>
                      <span>{overview?.today_out.count || 0} 单</span>
                      <span className={styles.valueText}>¥{overview?.today_out.value || '0'}</span>
                    </div>
                  </div>

                  <div className={styles.overviewCard}>
                    <div className={styles.cardIcon} style={{ background: 'rgba(250, 140, 22, 0.2)' }}>
                      <AlertOutlined style={{ color: '#FA8C16', fontSize: 24 }} />
                    </div>
                    <div className={styles.cardContent}>
                      <div className={styles.cardValue}>{overview?.pending_warnings || 0}</div>
                      <div className={styles.cardLabel}>待处理预警</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 趋势图 */}
              <div className={`glass-card ${styles.trendSection}`}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionSubtitle}>出入库趋势</h3>
                  <div className={styles.trendTabs}>
                    <button
                      className={`${styles.trendTab} ${trendDays === 7 ? styles.active : ''}`}
                      onClick={() => setTrendDays(7)}
                    >
                      近7天
                    </button>
                    <button
                      className={`${styles.trendTab} ${trendDays === 30 ? styles.active : ''}`}
                      onClick={() => setTrendDays(30)}
                    >
                      近30天
                    </button>
                  </div>
                </div>

                <div className={styles.trendChart}>
                  <div className={styles.chartLegend}>
                    <span className={styles.legendIn}><RiseOutlined /> 入库</span>
                    <span className={styles.legendOut}><FallOutlined /> 出库</span>
                  </div>
                  <div className={styles.chartBars}>
                    {trendData.map((item, idx) => (
                      <div key={idx} className={styles.barGroup}>
                        <div className={styles.bars}>
                          <div
                            className={styles.barIn}
                            style={{ height: `${(item.in_qty / maxQty) * 100}%` }}
                            title={`入库: ${item.in_qty}`}
                          />
                          <div
                            className={styles.barOut}
                            style={{ height: `${(item.out_qty / maxQty) * 100}%` }}
                            title={`出库: ${item.out_qty}`}
                          />
                        </div>
                        <div className={styles.barLabel}>
                          {item.date.slice(5)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 下方两列 */}
              <div className={styles.bottomSection}>
                {/* 排行榜 */}
                <div className={`glass-card ${styles.rankingSection}`}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionSubtitle}>
                      {rankingType === 'out' ? '出库排行' : '入库排行'}（近30天）
                    </h3>
                    <div className={styles.trendTabs}>
                      <button
                        className={`${styles.trendTab} ${rankingType === 'out' ? styles.active : ''}`}
                        onClick={() => setRankingType('out')}
                      >
                        出库
                      </button>
                      <button
                        className={`${styles.trendTab} ${rankingType === 'in' ? styles.active : ''}`}
                        onClick={() => setRankingType('in')}
                      >
                        入库
                      </button>
                    </div>
                  </div>
                  <Table
                    columns={rankingColumns}
                    dataSource={rankingData}
                    rowKey="rank"
                    pagination={false}
                    className={styles.table}
                    size="small"
                    scroll={{ y: 280 }}
                  />
                </div>

                {/* 类别统计 */}
                <div className={`glass-card ${styles.categorySection}`}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionSubtitle}>类别分布</h3>
                  </div>
                  <Table
                    columns={categoryColumns}
                    dataSource={categoryData}
                    rowKey="category"
                    pagination={false}
                    className={styles.table}
                    size="small"
                    scroll={{ y: 280 }}
                  />
                </div>
              </div>
            </div>
          )}
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

export default Statistics
