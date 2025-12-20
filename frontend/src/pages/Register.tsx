import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { message, Spin } from 'antd'
import {
  EyeOutlined,
  EyeInvisibleOutlined,
  ThunderboltOutlined,
  StarOutlined,
  CameraOutlined,
  CheckCircleFilled,
  LoadingOutlined,
} from '@ant-design/icons'
import { useUser } from '../context/UserContext'
import styles from './Register.module.css'

const Register = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const navigate = useNavigate()
  const { register } = useUser()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 表单验证
    if (!formData.username.trim()) {
      message.error('请输入用户名')
      return
    }
    if (formData.username.length < 2) {
      message.error('用户名至少2个字符')
      return
    }
    if (!formData.email.trim()) {
      message.error('请输入邮箱地址')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      message.error('请输入有效的邮箱地址')
      return
    }
    if (!formData.password) {
      message.error('请输入密码')
      return
    }
    if (formData.password.length < 8) {
      message.error('密码长度至少8位')
      return
    }
    if (formData.password !== formData.confirmPassword) {
      message.error('两次输入的密码不一致')
      return
    }
    if (!agreed) {
      message.error('请阅读并同意服务条款和隐私政策')
      return
    }

    setLoading(true)
    try {
      const result = await register(formData.username, formData.email, formData.password)
      if (result.success) {
        message.success(result.message)
        navigate('/login')
      } else {
        message.error(result.message)
      }
    } catch {
      message.error('注册失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 密码强度检测
  const getPasswordStrength = (pwd: string) => {
    let strength = 0
    if (pwd.length >= 8) strength++
    if (/[A-Z]/.test(pwd)) strength++
    if (/[0-9]/.test(pwd)) strength++
    if (/[^A-Za-z0-9]/.test(pwd)) strength++
    return strength
  }

  const passwordStrength = getPasswordStrength(formData.password)
  const strengthLabels = ['弱', '一般', '中等', '强']
  const strengthColors = ['#ff4d4f', '#faad14', '#52c41a', '#4F8CFF']

  const handleTermsClick = (e: React.MouseEvent) => {
    e.preventDefault()
    message.info('服务条款页面开发中...')
  }

  const handlePrivacyClick = (e: React.MouseEvent) => {
    e.preventDefault()
    message.info('隐私政策页面开发中...')
  }

  return (
    <div className="page-container">
      {/* 导航栏 */}
      <header className="nav-header">
        <div className="nav-left">
          <span className={styles.navTitle}>Detail Page</span>
          <button className="icon-button" onClick={() => message.info('收藏功能')}>
            <StarOutlined style={{ fontSize: 20 }} />
          </button>
          <button className="icon-button" onClick={() => message.info('快捷操作')}>
            <ThunderboltOutlined style={{ fontSize: 20 }} />
          </button>
          <button className="icon-button" onClick={() => message.info('截图功能')}>
            <CameraOutlined style={{ fontSize: 20 }} />
          </button>
        </div>
        <div className="nav-center">2025</div>
        <div className="nav-right">
          <Link to="/login" className="nav-link">Home</Link>
        </div>
      </header>

      {/* 主体内容 */}
      <main className={styles.main}>
        {/* 左侧标题区 */}
        <div className={styles.leftSection}>
          <h1 className="hero-title">
            JOIN<br />US
          </h1>
          <div className="hero-year">2025</div>

          {/* 特性列表 */}
          <div className={styles.features}>
            <div className={styles.featureItem}>
              <CheckCircleFilled className={styles.featureIcon} />
              <span>安全加密存储</span>
            </div>
            <div className={styles.featureItem}>
              <CheckCircleFilled className={styles.featureIcon} />
              <span>多端数据同步</span>
            </div>
            <div className={styles.featureItem}>
              <CheckCircleFilled className={styles.featureIcon} />
              <span>专业技术支持</span>
            </div>
          </div>
        </div>

        {/* 右侧注册表单 */}
        <div className={styles.rightSection}>
          <div className={`glass-card ${styles.formCard}`}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>创建账户</h2>
              <p className={styles.formSubtitle}>开始您的数据管理之旅</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>用户名</label>
                <input
                  type="text"
                  name="username"
                  className="cyber-input"
                  placeholder="请输入用户名"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>邮箱</label>
                <input
                  type="email"
                  name="email"
                  className="cyber-input"
                  placeholder="请输入邮箱地址"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>密码</label>
                <div className={styles.passwordWrapper}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className="cyber-input"
                    placeholder="请输入密码（至少8位）"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className={styles.eyeButton}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  </button>
                </div>
                {formData.password && (
                  <div className={styles.strengthBar}>
                    <div className={styles.strengthTrack}>
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className={styles.strengthSegment}
                          style={{
                            backgroundColor: i < passwordStrength ? strengthColors[passwordStrength - 1] : 'var(--border-color)',
                          }}
                        />
                      ))}
                    </div>
                    <span style={{ color: strengthColors[passwordStrength - 1] || 'var(--text-muted)' }}>
                      {passwordStrength > 0 ? strengthLabels[passwordStrength - 1] : ''}
                    </span>
                  </div>
                )}
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>确认密码</label>
                <div className={styles.passwordWrapper}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    className="cyber-input"
                    placeholder="请再次输入密码"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className={styles.eyeButton}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  </button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <span className={styles.errorText}>两次输入的密码不一致</span>
                )}
              </div>

              <div className={styles.agreement}>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                  />
                  <span>
                    我已阅读并同意{' '}
                    <a href="#" onClick={handleTermsClick} className="cyber-link">服务条款</a>
                    {' '}和{' '}
                    <a href="#" onClick={handlePrivacyClick} className="cyber-link">隐私政策</a>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className={`cyber-button ${styles.submitButton}`}
                disabled={loading}
              >
                {loading ? <Spin indicator={<LoadingOutlined style={{ color: '#fff' }} />} /> : '创建账户'}
              </button>
            </form>

            <p className={styles.footer}>
              已有账户？{' '}
              <Link to="/login" className="cyber-link">
                立即登录
              </Link>
            </p>
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
        <p style={{ marginTop: 8 }}>用户注册系统<br />User Registration</p>
      </div>
    </div>
  )
}

export default Register
