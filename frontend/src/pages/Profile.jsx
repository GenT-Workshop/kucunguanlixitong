import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Avatar, Descriptions, Button, Space, Typography, Tag, Divider, Modal, Form, Input, message } from 'antd'
import { UserOutlined, MailOutlined, PhoneOutlined, EnvironmentOutlined, EditOutlined, LogoutOutlined, IdcardOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import api from '../api/api'
import './Profile.css'

const { Title, Text } = Typography
const { TextArea } = Input
const { confirm } = Modal

function Profile() {
  const navigate = useNavigate()

  // 用户数据状态
  const [userInfo, setUserInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form] = Form.useForm()

  // 组件加载时获取用户信息
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const response = await api.getCurrentUser()
        setUserInfo(response.data)
      } catch (error) {
        console.error('获取用户信息失败:', error)
        message.error('请先登录')
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }

    loadUserInfo()
  }, [navigate])

  const handleEdit = () => {
    if (!userInfo) return

    form.setFieldsValue({
      email: userInfo.email,
      phone: userInfo.phone,
      location: userInfo.location,
      position: userInfo.position,
      bio: userInfo.bio
    })
    setIsModalOpen(true)
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()

      // 调用真实 API 更新用户信息
      const response = await api.updateUserInfo(values)

      setUserInfo(response.data)
      message.success('个人资料更新成功！')
      setIsModalOpen(false)
    } catch (error) {
      console.log('表单验证失败:', error)
      message.error('更新失败，请重试')
    }
  }

  const handleModalCancel = () => {
    setIsModalOpen(false)
  }

  const handleLogout = () => {
    confirm({
      title: '确认退出',
      icon: <ExclamationCircleOutlined />,
      content: '您确定要退出登录吗？',
      okText: '确定',
      cancelText: '取消',
      async onOk() {
        try {
          // 调用真实 API 退出登录
          await api.logout()
          message.success('退出登录成功！')

          // 跳转到登录页面
          setTimeout(() => {
            navigate('/login')
          }, 500)
        } catch (error) {
          console.error('退出登录失败:', error)
          message.error('退出失败，请重试')
        }
      },
      onCancel() {
        console.log('取消退出')
      },
    })
  }

  // 加载中状态
  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-content">
          <Card className="profile-card">
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Text>加载中...</Text>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // 未登录状态
  if (!userInfo) {
    return null
  }

  return (
    <div className="profile-container">
      <div className="profile-content">
        {/* 个人信息卡片 */}
        <Card className="profile-card">
          <div className="profile-header">
            <Avatar size={100} icon={<UserOutlined />} className="profile-avatar" />
            <div className="profile-info">
              <Title level={2}>{userInfo.username}</Title>
              <Space size="middle">
                <Tag color={userInfo.status === 'active' ? 'success' : 'default'}>
                  {userInfo.status === 'active' ? '活跃' : '未激活'}
                </Tag>
                <Tag color="blue">{userInfo.role}</Tag>
              </Space>
            </div>
            <div className="profile-actions">
              <Space>
                <Button type="primary" icon={<EditOutlined />} onClick={handleEdit}>
                  编辑资料
                </Button>
                <Button icon={<LogoutOutlined />} onClick={handleLogout}>
                  退出登录
                </Button>
              </Space>
            </div>
          </div>

          <Divider />

          <div className="profile-bio">
            <Title level={4}>个人简介</Title>
            <Text type="secondary">{userInfo.bio}</Text>
          </div>

          <Divider />

          <div className="profile-details">
            <Title level={4}>详细信息</Title>
            <Descriptions column={1} className="profile-descriptions">
              <Descriptions.Item
                label={<span><MailOutlined /> 邮箱</span>}
              >
                {userInfo.email}
              </Descriptions.Item>
              <Descriptions.Item
                label={<span><PhoneOutlined /> 手机</span>}
              >
                {userInfo.phone}
              </Descriptions.Item>
              <Descriptions.Item
                label={<span><EnvironmentOutlined /> 地区</span>}
              >
                {userInfo.location}
              </Descriptions.Item>
              <Descriptions.Item
                label={<span><IdcardOutlined /> 职位</span>}
              >
                {userInfo.position}
              </Descriptions.Item>
              <Descriptions.Item label="注册时间">
                {userInfo.joinDate}
              </Descriptions.Item>
            </Descriptions>
          </div>
        </Card>

        {/* 统计信息卡片 */}
        <div className="profile-stats">
          <Card className="stat-card">
            <div className="stat-content">
              <Text type="secondary">登录次数</Text>
              <Title level={2}>128</Title>
            </div>
          </Card>
          <Card className="stat-card">
            <div className="stat-content">
              <Text type="secondary">最后登录</Text>
              <Title level={2}>今天</Title>
            </div>
          </Card>
          <Card className="stat-card">
            <div className="stat-content">
              <Text type="secondary">账户状态</Text>
              <Title level={2}>正常</Title>
            </div>
          </Card>
        </div>

        {/* 编辑资料弹窗 */}
        <Modal
          title="编辑个人资料"
          open={isModalOpen}
          onOk={handleModalOk}
          onCancel={handleModalCancel}
          okText="保存"
          cancelText="取消"
          className="edit-profile-modal"
        >
          <Form
            form={form}
            layout="vertical"
            autoComplete="off"
          >
            <Form.Item
              label="邮箱"
              name="email"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="请输入邮箱" />
            </Form.Item>

            <Form.Item
              label="手机"
              name="phone"
              rules={[
                { required: true, message: '请输入手机号' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
              ]}
            >
              <Input prefix={<PhoneOutlined />} placeholder="请输入手机号" />
            </Form.Item>

            <Form.Item
              label="地区"
              name="location"
              rules={[{ required: true, message: '请输入地区' }]}
            >
              <Input prefix={<EnvironmentOutlined />} placeholder="请输入地区" />
            </Form.Item>

            <Form.Item
              label="职位"
              name="position"
              rules={[{ required: true, message: '请输入职位' }]}
            >
              <Input prefix={<IdcardOutlined />} placeholder="请输入职位" />
            </Form.Item>

            <Form.Item
              label="个人简介"
              name="bio"
              rules={[
                { required: true, message: '请输入个人简介' },
                { max: 200, message: '个人简介最多200个字符' }
              ]}
            >
              <TextArea
                rows={4}
                placeholder="请输入个人简介"
                showCount
                maxLength={200}
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  )
}

export default Profile
