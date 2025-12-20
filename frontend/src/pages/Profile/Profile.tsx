import { Avatar, Tag, Tooltip } from 'antd'
import {
  GithubOutlined,
  MailOutlined,
  LinkedinOutlined,
  GlobalOutlined,
} from '@ant-design/icons'
import './Profile.css'

// 技能数据
const skills = [
  { name: 'React', level: 90 },
  { name: 'TypeScript', level: 85 },
  { name: 'Node.js', level: 80 },
  { name: 'Python', level: 75 },
  { name: 'Docker', level: 70 },
  { name: 'AWS', level: 65 },
]

// 项目数据
const projects = [
  {
    title: '库存管理系统',
    description: '基于 React + Django 的企业级库存管理解决方案',
    tags: ['React', 'Django', 'PostgreSQL'],
    link: '#',
  },
  {
    title: '数据可视化平台',
    description: '实时数据监控与可视化分析平台',
    tags: ['Vue.js', 'ECharts', 'WebSocket'],
    link: '#',
  },
  {
    title: '微服务架构项目',
    description: '基于 Kubernetes 的微服务部署与管理',
    tags: ['Docker', 'K8s', 'Go'],
    link: '#',
  },
]

// 社交链接
const socialLinks = [
  { icon: <GithubOutlined />, label: 'GitHub', url: 'https://github.com' },
  { icon: <LinkedinOutlined />, label: 'LinkedIn', url: 'https://linkedin.com' },
  { icon: <MailOutlined />, label: 'Email', url: 'mailto:example@email.com' },
  { icon: <GlobalOutlined />, label: 'Website', url: '#' },
]

export function Profile() {
  return (
    <div className="profile">
      {/* 头部区域 */}
      <header className="profile__header">
        <div className="profile__avatar-wrapper">
          <Avatar
            size={120}
            style={{
              backgroundColor: '#ff6b35',
              fontSize: '48px',
              fontWeight: 'bold',
            }}
          >
            U
          </Avatar>
          <div className="profile__status" />
        </div>

        <div className="profile__info">
          <span className="profile__badge">Full Stack Developer</span>
          <h1 className="profile__name">用户名</h1>
          <p className="profile__bio">
            热爱技术，专注于构建高质量的 Web 应用。
            <br />
            5年+ 全栈开发经验，擅长 React 生态和云原生技术。
          </p>

          {/* 社交链接 */}
          <div className="profile__social">
            {socialLinks.map((link) => (
              <Tooltip key={link.label} title={link.label}>
                <a
                  href={link.url}
                  className="profile__social-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.icon}
                </a>
              </Tooltip>
            ))}
          </div>
        </div>
      </header>

      <div className="divider" />

      {/* 统计数据 */}
      <section className="profile__stats">
        <div className="profile__stat-item">
          <span className="profile__stat-value">50+</span>
          <span className="profile__stat-label">完成项目</span>
        </div>
        <div className="profile__stat-item">
          <span className="profile__stat-value">5+</span>
          <span className="profile__stat-label">工作年限</span>
        </div>
        <div className="profile__stat-item">
          <span className="profile__stat-value">1000+</span>
          <span className="profile__stat-label">代码提交</span>
        </div>
        <div className="profile__stat-item">
          <span className="profile__stat-value">20+</span>
          <span className="profile__stat-label">技术文章</span>
        </div>
      </section>

      <div className="divider" />

      {/* 技能展示 */}
      <section className="profile__section">
        <h2 className="profile__section-title">
          <span className="index-number">01</span>
          技能专长
        </h2>
        <div className="profile__skills">
          {skills.map((skill) => (
            <div key={skill.name} className="profile__skill">
              <div className="profile__skill-header">
                <span className="profile__skill-name">{skill.name}</span>
                <span className="profile__skill-level">{skill.level}%</span>
              </div>
              <div className="profile__skill-bar">
                <div
                  className="profile__skill-progress"
                  style={{ width: `${skill.level}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="divider" />

      {/* 项目展示 */}
      <section className="profile__section">
        <h2 className="profile__section-title">
          <span className="index-number">02</span>
          项目作品
        </h2>
        <div className="grid grid--3">
          {projects.map((project) => (
            <a
              key={project.title}
              href={project.link}
              className="profile__project card"
            >
              <h3 className="profile__project-title">{project.title}</h3>
              <p className="profile__project-desc">{project.description}</p>
              <div className="profile__project-tags">
                {project.tags.map((tag) => (
                  <Tag key={tag} color="orange">
                    {tag}
                  </Tag>
                ))}
              </div>
            </a>
          ))}
        </div>
      </section>

      <div className="divider" />

      {/* 联系方式 */}
      <section className="profile__section">
        <h2 className="profile__section-title">
          <span className="index-number">03</span>
          联系我
        </h2>
        <div className="profile__contact">
          <p className="profile__contact-text">
            如果您有任何项目合作或技术交流的想法，欢迎随时联系我！
          </p>
          <a href="mailto:example@email.com" className="profile__contact-btn">
            发送邮件
          </a>
        </div>
      </section>

      {/* 底部 */}
      <footer className="profile__footer">
        <div className="contact-bar">
          <div className="contact-bar__item">
            <span className="contact-bar__label">Location</span>
            <span>中国 · 北京</span>
          </div>
          <div className="contact-bar__item">
            <span className="contact-bar__label">Status</span>
            <span style={{ color: '#f7931e' }}>Open to Work</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Profile
