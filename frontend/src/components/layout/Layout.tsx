import type { ReactNode } from 'react'
import { Background } from './Background'
import './Layout.css'

interface LayoutProps {
  children: ReactNode
}

/**
 * 主布局组件
 * 包含背景光效和内容容器
 */
export function Layout({ children }: LayoutProps) {
  return (
    <div className="layout">
      <Background />
      <div className="layout__content">
        {children}
      </div>
    </div>
  )
}

export default Layout
