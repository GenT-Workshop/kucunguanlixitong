import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { message, Modal, Input } from 'antd'
import {
  UserOutlined,
  LogoutOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { useUser } from '../context/UserContext'
import styles from './Profile.module.css'

const Profile = () => {
  const { user, isLoggedIn, logout, updateUser } = useUser()
  const navigate = useNavigate()
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editForm, setEditForm] = useState({ username: '', email: '' })

  // 如果未登录，跳转到登录页
  if (!isLoggedIn || !user) {
    navigate('/login')
    return null
  }

  // 活动记录 - 库存管理相关
  const activities = [
    { action: '登录系统', time: '刚刚', type: 'create' },
  ]

  // 退出登录
  const handleLogout = () => {
    Modal.confirm({
      title: '确认退出',
      icon: <ExclamationCircleOutlined />,
      content: '确定要退出登录吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        logout()
        message.success('已退出登录')
        navigate('/login')
      },
    })
  }

  // 打开编辑资料弹窗
  const handleEditProfile = () => {
    setEditForm({
      username: user.username,
      email: user.email,
    })
    setEditModalVisible(true)
  }

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editForm.username.trim()) {
      message.error('用户名不能为空')
      return
    }
    if (!editForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      message.error('请输入有效的邮箱地址')
      return
    }
    const result = await updateUser({
      username: editForm.username,
      email: editForm.email,
    })
    if (result.success) {
      setEditModalVisible(false)
      message.success(result.message)
    } else {
      message.error(result.message)
    }
  }

  // 编辑头像
  const handleEditAvatar = () => {
    message.info('头像上传功能开发中...')
  }

  return (
    <div className="page-container">
      {/* 导航栏 */}
      <header className="nav-header">
        <div className="nav-left">
          <span className={styles.navTitle}>Detail Page</span>
        </div>
        <div className="nav-center">2025</div>
        <div className="nav-right">
          <Link to="/dashboard" className="nav-link">Home</Link>
        </div>
      </header>

      {/* 主体内容 */}
      <main className={styles.main}>
        {/* 左侧标题区 */}
        <div className={styles.leftSection}>
          <h1 className="hero-title">
            个人<br />资料
          </h1>
        </div>

        {/* 右侧个人信息区 */}
        <div className={styles.rightSection}>
          {/* 用户卡片 */}
          <div className={`glass-card ${styles.profileCard}`}>
            <div className={styles.profileHeader}>
              <div className={styles.avatarWrapper}>
                {user.avatar ? (
                  <img src={user.avatar} alt="avatar" className={styles.avatar} />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    <UserOutlined style={{ fontSize: 48 }} />
                  </div>
                )}
                <button className={styles.editAvatarBtn} onClick={handleEditAvatar}>
                  <EditOutlined />
                </button>
              </div>
              <div className={styles.userInfo}>
                <h2 className={styles.userName}>{user.username}</h2>
                <p className={styles.userEmail}>{user.email}</p>
                <span className={styles.roleBadge}>{user.role}</span>
              </div>
              <div className={styles.profileActions}>
                <button className="icon-button" onClick={handleLogout}>
                  <LogoutOutlined style={{ fontSize: 20 }} />
                </button>
              </div>
            </div>

            {/* 账户信息 */}
            <div className={styles.infoSection}>
              <h3 className={styles.sectionTitle}>账户信息</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>注册时间</span>
                  <span className={styles.infoValue}>{user.joinDate}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>最近登录</span>
                  <span className={styles.infoValue}>{user.lastLogin}</span>
                </div>
              </div>
            </div>

            {/* 最近活动 */}
            <div className={styles.activitySection}>
              <h3 className={styles.sectionTitle}>最近活动</h3>
              <div className={styles.activityList}>
                {activities.map((activity, index) => (
                  <div key={index} className={styles.activityItem}>
                    <div className={`${styles.activityDot} ${styles[activity.type]}`} />
                    <div className={styles.activityContent}>
                      <span className={styles.activityAction}>{activity.action}</span>
                      <span className={styles.activityTime}>{activity.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className={styles.buttonGroup}>
              <button className="cyber-button" onClick={handleEditProfile}>编辑资料</button>
            </div>
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
        <p style={{ marginTop: 8 }}>个人中心<br />User Profile</p>
      </div>

      {/* 编辑资料弹窗 */}
      <Modal
        title="编辑资料"
        open={editModalVisible}
        onOk={handleSaveEdit}
        onCancel={() => setEditModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, color: 'rgba(0,0,0,0.65)' }}>用户名</label>
          <Input
            value={editForm.username}
            onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
            placeholder="请输入用户名"
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 8, color: 'rgba(0,0,0,0.65)' }}>邮箱</label>
          <Input
            value={editForm.email}
            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            placeholder="请输入邮箱"
          />
        </div>
      </Modal>
    </div>
  )
}

export default Profile
