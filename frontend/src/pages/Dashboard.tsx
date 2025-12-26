import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { message } from 'antd'
import {
  InboxOutlined,
  ExportOutlined,
  DatabaseOutlined,
  AlertOutlined,
  AuditOutlined,
  BarChartOutlined,
  FileTextOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { useUser } from '../context/UserContext'
import styles from './Dashboard.module.css'

// 功能模块配置
const MODULES = [
  {
    key: 'stock-in',
    title: '入库管理',
    subtitle: 'Stock In',
    icon: InboxOutlined,
    path: '/stock-in',
    color: '#4F8CFF',
    ready: true,
    description: '采购入库、生产入库、退货入库等',
  },
  {
    key: 'stock-out',
    title: '出库管理',
    subtitle: 'Stock Out',
    icon: ExportOutlined,
    path: '/stock-out',
    color: '#52C41A',
    ready: true,
    description: '生产领料、销售提货、其他出库等',
  },
  {
    key: 'stock-query',
    title: '库存查询',
    subtitle: 'Stock Query',
    icon: DatabaseOutlined,
    path: '/stock-query',
    color: '#722ED1',
    ready: true,
    description: '实时库存查询、多条件筛选',
  },
  {
    key: 'warning',
    title: '库存预警',
    subtitle: 'Warning',
    icon: AlertOutlined,
    path: '/warning',
    color: '#FA8C16',
    ready: true,
    description: '低库存预警、高库存预警处理',
  },
  {
    key: 'stock-count',
    title: '盘点管理',
    subtitle: 'Stock Count',
    icon: AuditOutlined,
    path: '/stock-count',
    color: '#13C2C2',
    ready: true,
    description: '盘点任务创建、盘点明细录入',
  },
  {
    key: 'statistics',
    title: '统计分析',
    subtitle: 'Statistics',
    icon: BarChartOutlined,
    path: '/statistics',
    color: '#EB2F96',
    ready: true,
    description: '出入库趋势、畅销滞销排行',
  },
  {
    key: 'monthly-report',
    title: '月底结存',
    subtitle: 'Monthly Report',
    icon: FileTextOutlined,
    path: '/monthly-report',
    color: '#722ED1',
    ready: true,
    description: '月度报表、库存结存汇总',
  },
  {
    key: 'system',
    title: '系统管理',
    subtitle: 'System',
    icon: SettingOutlined,
    path: '/system',
    color: '#13C2C2',
    ready: true,
    description: '用户管理、角色权限、系统配置',
  },
]

const Dashboard = () => {
  const navigate = useNavigate()
  const { user, logout, isLoggedIn } = useUser()

  // 未登录跳转到登录页
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login')
    }
  }, [isLoggedIn, navigate])

  const handleModuleClick = (module: typeof MODULES[0]) => {
    if (module.ready) {
      navigate(module.path)
    } else {
      message.info(`${module.title}功能开发中...`)
    }
  }

  const handleLogout = async () => {
    await logout()
    message.success('已退出登录')
    navigate('/login')
  }

  // 未登录时不渲染内容
  if (!isLoggedIn) {
    return null
  }

  return (
    <div className="page-container">
      {/* 导航栏 */}
      <header className="nav-header">
        <div className="nav-left">
          <span className={styles.navTitle}>Dashboard</span>
        </div>
        <div className="nav-center">库存管理系统</div>
        <div className="nav-right">
          <Link to="/profile" className="nav-link">
            <UserOutlined style={{ marginRight: 4 }} />
            {user?.username || '用户'}
          </Link>
          <button className="icon-button" onClick={handleLogout} title="退出登录">
            <LogoutOutlined style={{ fontSize: 18 }} />
          </button>
        </div>
      </header>

      {/* 主体内容 */}
      <main className={styles.main}>
        {/* 左侧标题区 */}
        <div className={styles.leftSection}>
          <h1 className="hero-title">
            INVENTORY<br />SYSTEM
          </h1>
          <div className="hero-year">2025</div>
        </div>

        {/* 右侧功能模块区 */}
        <div className={styles.rightSection}>
          <div className={styles.welcomeCard}>
            <h2 className={styles.welcomeTitle}>
              欢迎回来，{user?.username || '用户'}
            </h2>
            <p className={styles.welcomeSubtitle}>
              请选择要访问的功能模块
            </p>
          </div>

          <div className={styles.moduleGrid}>
            {MODULES.map((module) => {
              const IconComponent = module.icon
              return (
                <div
                  key={module.key}
                  className={`${styles.moduleCard} ${!module.ready ? styles.moduleDisabled : ''}`}
                  onClick={() => handleModuleClick(module)}
                  style={{ '--module-color': module.color } as React.CSSProperties}
                >
                  <div className={styles.moduleIcon}>
                    <IconComponent style={{ fontSize: 32, color: module.color }} />
                  </div>
                  <div className={styles.moduleInfo}>
                    <h3 className={styles.moduleTitle}>{module.title}</h3>
                    <span className={styles.moduleSubtitle}>{module.subtitle}</span>
                    <p className={styles.moduleDesc}>{module.description}</p>
                  </div>
                  {!module.ready && (
                    <div className={styles.comingSoon}>开发中</div>
                  )}
                  <div className={styles.moduleArrow}>→</div>
                </div>
              )
            })}
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
        <p style={{ marginTop: 8 }}>库存管理系统<br />Inventory Management</p>
      </div>
    </div>
  )
}

export default Dashboard
