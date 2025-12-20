import { useState } from 'react'
import { ConfigProvider, theme, Menu } from 'antd'
import {
  UserOutlined,
  PlusCircleOutlined,
  UnorderedListOutlined,
  AppstoreAddOutlined,
} from '@ant-design/icons'
import { Layout } from './components/layout'
import { Profile } from './pages/Profile'
import { StockInForm, StockInList } from './pages/StockIn'
import { StockInit } from './pages/Stock'
import './styles/variables.css'

type PageKey = 'profile' | 'stockInit' | 'stockInForm' | 'stockInList'

function App() {
  const [currentPage, setCurrentPage] = useState<PageKey>('profile')

  const menuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人主页',
    },
    {
      key: 'stockInit',
      icon: <AppstoreAddOutlined />,
      label: '物料初始化',
    },
    {
      key: 'stockInForm',
      icon: <PlusCircleOutlined />,
      label: '新增入库',
    },
    {
      key: 'stockInList',
      icon: <UnorderedListOutlined />,
      label: '入库记录',
    },
  ]

  const renderPage = () => {
    switch (currentPage) {
      case 'profile':
        return <Profile />
      case 'stockInit':
        return <StockInit />
      case 'stockInForm':
        return <StockInForm />
      case 'stockInList':
        return <StockInList />
      default:
        return <Profile />
    }
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#ff6b35',
          colorBgContainer: 'rgba(255, 255, 255, 0.03)',
          colorBorderSecondary: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 8,
          fontFamily: "'Inter', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif",
        },
      }}
    >
      <Layout>
        <nav className="app-nav">
          <Menu
            mode="horizontal"
            selectedKeys={[currentPage]}
            items={menuItems}
            onClick={({ key }) => setCurrentPage(key as PageKey)}
            style={{
              background: 'transparent',
              borderBottom: '1px solid var(--color-border)',
              marginBottom: 'var(--spacing-xl)',
            }}
          />
        </nav>
        {renderPage()}
      </Layout>
    </ConfigProvider>
  )
}

export default App
