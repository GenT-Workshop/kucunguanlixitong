import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { message, Spin } from 'antd'
import {
  EyeOutlined,
  EyeInvisibleOutlined,
  LoadingOutlined,
} from '@ant-design/icons'
import { useUser } from '../context/UserContext'
import styles from './Login.module.css'

const Login = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const navigate = useNavigate()
  const { login, isLoggedIn } = useUser()

  // 如果已登录，跳转到主页
  useEffect(() => {
    if (isLoggedIn) {
      navigate('/dashboard')
    }
  }, [isLoggedIn, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 表单验证
    if (!username.trim()) {
      message.error('请输入用户名')
      return
    }
    if (!password) {
      message.error('请输入密码')
      return
    }
    if (password.length < 6) {
      message.error('密码长度至少6位')
      return
    }

    setLoading(true)
    try {
      const result = await login(username, password)
      if (result.success) {
        message.success(result.message)
        if (rememberMe) {
          localStorage.setItem('remembered_username', username)
        } else {
          localStorage.removeItem('remembered_username')
        }
        navigate('/dashboard')
      } else {
        message.error(result.message)
      }
    } catch {
      message.error('登录失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      {/* 导航栏 */}
      <header className="nav-header">
        <div className="nav-left">
          <span className={styles.navTitle}>Detail Page</span>
        </div>
        <div className="nav-center">库存管理系统</div>
        <div className="nav-right">
          <Link to="/login" className="nav-link">Home</Link>
        </div>
      </header>

      {/* 主体内容 */}
      <main className={styles.main}>
        {/* 登录表单居中 */}
        <div className={styles.centerSection}>
          <div className={`glass-card ${styles.formCard}`}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>登录</h2>
              <p className={styles.formSubtitle}>欢迎回来，请登录您的账户</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>用户名</label>
                <input
                  type="text"
                  className="cyber-input"
                  placeholder="请输入用户名"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>密码</label>
                <div className={styles.passwordWrapper}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="cyber-input"
                    placeholder="请输入密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
              </div>

              <div className={styles.options}>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>记住我</span>
                </label>
              </div>

              <button
                type="submit"
                className={`cyber-button ${styles.submitButton}`}
                disabled={loading}
              >
                {loading ? <Spin indicator={<LoadingOutlined style={{ color: '#fff' }} />} /> : '登录'}
              </button>
            </form>

            <p className={styles.footer}>
              还没有账户？{' '}
              <Link to="/register" className="cyber-link">
                立即注册
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
      </div>
    </div>
  )
}

export default Login
