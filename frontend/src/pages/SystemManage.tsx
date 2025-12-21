import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { message, Table, Modal, Input, Select, Tabs, Switch, Spin } from 'antd'
import {
  ThunderboltOutlined,
  StarOutlined,
  SettingOutlined,
  UserOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  DatabaseOutlined,
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { useUser } from '../context/UserContext'
import { getUserList, createUser, updateUser, deleteUser, resetUserPassword } from '../api/system'
import type { SystemUser, UserCreateParams, UserUpdateParams } from '../api/types'
import styles from './SystemManage.module.css'

const { TabPane } = Tabs

const SystemManage = () => {
  const { user, isLoggedIn } = useUser()
  const navigate = useNavigate()

  // 用户列表状态
  const [loading, setLoading] = useState(false)
  const [userList, setUserList] = useState<SystemUser[]>([])
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 })

  // 弹窗状态
  const [userModalVisible, setUserModalVisible] = useState(false)
  const [userModalType, setUserModalType] = useState<'create' | 'edit'>('create')
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(null)
  const [userForm, setUserForm] = useState<UserCreateParams>({
    username: '',
    email: '',
    password: '',
    is_staff: false,
    is_active: true,
  })
  const [submitting, setSubmitting] = useState(false)

  // 重置密码弹窗
  const [resetPwdModalVisible, setResetPwdModalVisible] = useState(false)
  const [resetPwdUser, setResetPwdUser] = useState<SystemUser | null>(null)
  const [newPassword, setNewPassword] = useState('')

  // 检查登录状态和权限
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login')
      return
    }
    if (user?.role !== '管理员') {
      message.error('您没有权限访问此页面')
      navigate('/dashboard')
      return
    }
  }, [isLoggedIn, user, navigate])

  // 加载用户列表
  const loadUserList = async () => {
    setLoading(true)
    try {
      const res = await getUserList({ page: pagination.page, page_size: pagination.pageSize })
      if (res.code === 200 && res.data) {
        setUserList(res.data.list)
        setPagination(prev => ({ ...prev, total: res.data.total }))
      } else {
        message.error(res.message || '获取用户列表失败')
      }
    } catch {
      message.error('获取用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isLoggedIn && user?.role === '管理员') {
      loadUserList()
    }
  }, [pagination.page, pagination.pageSize, isLoggedIn, user])

  // 打开创建用户弹窗
  const handleCreateUser = () => {
    setUserModalType('create')
    setCurrentUser(null)
    setUserForm({
      username: '',
      email: '',
      password: '',
      is_staff: false,
      is_active: true,
    })
    setUserModalVisible(true)
  }

  // 打开编辑用户弹窗
  const handleEditUser = (record: SystemUser) => {
    setUserModalType('edit')
    setCurrentUser(record)
    setUserForm({
      username: record.username,
      email: record.email,
      password: '',
      is_staff: record.is_staff,
      is_active: record.is_active,
    })
    setUserModalVisible(true)
  }

  // 提交用户表单
  const handleSubmitUser = async () => {
    if (!userForm.username.trim()) {
      message.error('用户名不能为空')
      return
    }
    if (!userForm.email.trim()) {
      message.error('邮箱不能为空')
      return
    }
    if (userModalType === 'create' && (!userForm.password || userForm.password.length < 8)) {
      message.error('密码长度至少8位')
      return
    }

    setSubmitting(true)
    try {
      if (userModalType === 'create') {
        const res = await createUser(userForm)
        if (res.code === 200) {
          message.success('用户创建成功')
          setUserModalVisible(false)
          loadUserList()
        } else {
          message.error(res.message || '创建失败')
        }
      } else if (currentUser) {
        const updateParams: UserUpdateParams = {
          username: userForm.username,
          email: userForm.email,
          is_staff: userForm.is_staff,
          is_active: userForm.is_active,
        }
        const res = await updateUser(currentUser.id, updateParams)
        if (res.code === 200) {
          message.success('用户更新成功')
          setUserModalVisible(false)
          loadUserList()
        } else {
          message.error(res.message || '更新失败')
        }
      }
    } catch {
      message.error('操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  // 删除用户
  const handleDeleteUser = (record: SystemUser) => {
    Modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除用户 "${record.username}" 吗？此操作不可恢复。`,
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const res = await deleteUser(record.id)
          if (res.code === 200) {
            message.success('删除成功')
            loadUserList()
          } else {
            message.error(res.message || '删除失败')
          }
        } catch {
          message.error('删除失败')
        }
      },
    })
  }

  // 打开重置密码弹窗
  const handleResetPassword = (record: SystemUser) => {
    setResetPwdUser(record)
    setNewPassword('')
    setResetPwdModalVisible(true)
  }

  // 提交重置密码
  const handleSubmitResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      message.error('新密码长度至少8位')
      return
    }
    if (!resetPwdUser) return

    setSubmitting(true)
    try {
      const res = await resetUserPassword(resetPwdUser.id, newPassword)
      if (res.code === 200) {
        message.success('密码重置成功')
        setResetPwdModalVisible(false)
      } else {
        message.error(res.message || '重置失败')
      }
    } catch {
      message.error('重置失败')
    } finally {
      setSubmitting(false)
    }
  }

  // 用户表格列
  const userColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
      render: (val: string) => <span className={styles.username}>{val}</span>,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 180,
    },
    {
      title: '角色',
      dataIndex: 'is_staff',
      key: 'is_staff',
      width: 100,
      render: (val: boolean) => (
        <span className={val ? styles.adminBadge : styles.userBadge}>
          {val ? '管理员' : '普通用户'}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      render: (val: boolean) => (
        <span className={val ? styles.activeStatus : styles.inactiveStatus}>
          {val ? '启用' : '禁用'}
        </span>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'date_joined',
      key: 'date_joined',
      width: 160,
      render: (val: string) => val?.split('T')[0] || '-',
    },
    {
      title: '最后登录',
      dataIndex: 'last_login',
      key: 'last_login',
      width: 160,
      render: (val: string) => val?.split('T')[0] || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: unknown, record: SystemUser) => (
        <div className={styles.actionBtns}>
          <button
            className={styles.actionBtn}
            onClick={() => handleEditUser(record)}
            title="编辑"
          >
            <EditOutlined />
          </button>
          <button
            className={styles.actionBtn}
            onClick={() => handleResetPassword(record)}
            title="重置密码"
          >
            <LockOutlined />
          </button>
          <button
            className={`${styles.actionBtn} ${styles.dangerBtn}`}
            onClick={() => handleDeleteUser(record)}
            title="删除"
          >
            <DeleteOutlined />
          </button>
        </div>
      ),
    },
  ]

  if (!isLoggedIn || user?.role !== '管理员') {
    return (
      <div className={styles.loadingWrapper}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="page-container">
      {/* 导航栏 */}
      <header className="nav-header">
        <div className="nav-left">
          <span className={styles.navTitle}>System Management</span>
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
            SYSTEM<br />MANAGE
          </h1>
          <div className="hero-year">管理</div>
        </div>

        {/* 右侧内容区 */}
        <div className={styles.rightSection}>
          <div className={`glass-card ${styles.contentCard}`}>
            <Tabs defaultActiveKey="users" className={styles.tabs}>
              {/* 用户管理 */}
              <TabPane
                tab={
                  <span className={styles.tabLabel}>
                    <TeamOutlined />
                    用户管理
                  </span>
                }
                key="users"
              >
                <div className={styles.tabContent}>
                  <div className={styles.header}>
                    <h2 className={styles.title}>
                      <UserOutlined className={styles.titleIcon} />
                      用户列表
                    </h2>
                    <div className={styles.actions}>
                      <button className="cyber-button" onClick={handleCreateUser}>
                        <PlusOutlined /> 新增用户
                      </button>
                      <button className="icon-button" onClick={loadUserList}>
                        <ReloadOutlined style={{ fontSize: 18 }} />
                      </button>
                    </div>
                  </div>

                  <div className={styles.tableWrapper}>
                    <Table
                      columns={userColumns}
                      dataSource={userList}
                      rowKey="id"
                      loading={loading}
                      className={styles.table}
                      pagination={{
                        current: pagination.page,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        showSizeChanger: true,
                        showTotal: (total) => `共 ${total} 条`,
                        onChange: (page, pageSize) => {
                          setPagination(prev => ({ ...prev, page, pageSize }))
                        },
                      }}
                      scroll={{ x: 1000 }}
                    />
                  </div>
                </div>
              </TabPane>

              {/* 系统设置 */}
              <TabPane
                tab={
                  <span className={styles.tabLabel}>
                    <SettingOutlined />
                    系统设置
                  </span>
                }
                key="settings"
              >
                <div className={styles.tabContent}>
                  <div className={styles.settingsSection}>
                    <h3 className={styles.sectionTitle}>
                      <SafetyCertificateOutlined className={styles.sectionIcon} />
                      安全设置
                    </h3>
                    <div className={styles.settingItem}>
                      <div className={styles.settingInfo}>
                        <span className={styles.settingLabel}>强制密码复杂度</span>
                        <span className={styles.settingDesc}>要求密码包含大小写字母、数字和特殊字符</span>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className={styles.settingItem}>
                      <div className={styles.settingInfo}>
                        <span className={styles.settingLabel}>登录失败锁定</span>
                        <span className={styles.settingDesc}>连续5次登录失败后锁定账户30分钟</span>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className={styles.settingItem}>
                      <div className={styles.settingInfo}>
                        <span className={styles.settingLabel}>会话超时</span>
                        <span className={styles.settingDesc}>用户无操作30分钟后自动登出</span>
                      </div>
                      <Switch />
                    </div>
                  </div>

                  <div className={styles.settingsSection}>
                    <h3 className={styles.sectionTitle}>
                      <DatabaseOutlined className={styles.sectionIcon} />
                      数据设置
                    </h3>
                    <div className={styles.settingItem}>
                      <div className={styles.settingInfo}>
                        <span className={styles.settingLabel}>自动备份</span>
                        <span className={styles.settingDesc}>每天凌晨2点自动备份数据库</span>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className={styles.settingItem}>
                      <div className={styles.settingInfo}>
                        <span className={styles.settingLabel}>数据保留期限</span>
                        <span className={styles.settingDesc}>历史数据保留时间</span>
                      </div>
                      <Select defaultValue="365" style={{ width: 120 }}>
                        <Select.Option value="90">90天</Select.Option>
                        <Select.Option value="180">180天</Select.Option>
                        <Select.Option value="365">1年</Select.Option>
                        <Select.Option value="730">2年</Select.Option>
                        <Select.Option value="forever">永久</Select.Option>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabPane>
            </Tabs>
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
        <p style={{ marginTop: 8 }}>系统管理<br />System Management</p>
      </div>

      {/* 用户编辑弹窗 */}
      <Modal
        title={null}
        open={userModalVisible}
        onCancel={() => setUserModalVisible(false)}
        footer={null}
        className={styles.modal}
        width={500}
        centered
      >
        <div className={styles.modalContent}>
          <h3 className={styles.modalTitle}>
            {userModalType === 'create' ? '新增用户' : '编辑用户'}
          </h3>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>用户名</label>
            <Input
              value={userForm.username}
              onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
              placeholder="请输入用户名"
              prefix={<UserOutlined />}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>邮箱</label>
            <Input
              value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              placeholder="请输入邮箱"
              type="email"
            />
          </div>

          {userModalType === 'create' && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>密码</label>
              <Input.Password
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                placeholder="请输入密码（至少8位）"
                prefix={<LockOutlined />}
              />
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>角色</label>
            <Select
              value={userForm.is_staff ? 'admin' : 'user'}
              onChange={(val) => setUserForm({ ...userForm, is_staff: val === 'admin' })}
              style={{ width: '100%' }}
            >
              <Select.Option value="user">普通用户</Select.Option>
              <Select.Option value="admin">管理员</Select.Option>
            </Select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>状态</label>
            <Switch
              checked={userForm.is_active}
              onChange={(checked) => setUserForm({ ...userForm, is_active: checked })}
              checkedChildren="启用"
              unCheckedChildren="禁用"
            />
          </div>

          <div className={styles.modalActions}>
            <button
              className="cyber-button-ghost"
              onClick={() => setUserModalVisible(false)}
            >
              取消
            </button>
            <button
              className="cyber-button"
              onClick={handleSubmitUser}
              disabled={submitting}
            >
              {submitting ? '提交中...' : '确定'}
            </button>
          </div>
        </div>
      </Modal>

      {/* 重置密码弹窗 */}
      <Modal
        title={null}
        open={resetPwdModalVisible}
        onCancel={() => setResetPwdModalVisible(false)}
        footer={null}
        className={styles.modal}
        width={400}
        centered
      >
        <div className={styles.modalContent}>
          <h3 className={styles.modalTitle}>重置密码</h3>
          <p className={styles.modalDesc}>
            为用户 <strong>{resetPwdUser?.username}</strong> 设置新密码
          </p>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>新密码</label>
            <Input.Password
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="请输入新密码（至少8位）"
              prefix={<LockOutlined />}
            />
          </div>

          <div className={styles.modalActions}>
            <button
              className="cyber-button-ghost"
              onClick={() => setResetPwdModalVisible(false)}
            >
              取消
            </button>
            <button
              className="cyber-button"
              onClick={handleSubmitResetPassword}
              disabled={submitting}
            >
              {submitting ? '提交中...' : '确定'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default SystemManage
