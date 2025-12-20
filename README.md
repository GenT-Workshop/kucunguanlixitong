# 用户管理系统

一个基于 React + Vite + Ant Design + Django 的全栈用户管理系统，包含用户注册、登录、个人信息管理等功能。

## 项目简介

本项目是一个完整的用户管理系统，前端使用现代化的 React 技术栈，后端使用 Django 框架，实现了用户的完整生命周期管理。

### 技术栈

**前端**：
- React 18
- Vite 5
- Ant Design 5
- React Router 6

**后端**：
- Django 4.x
- Python 3.12
- SQLite 数据库

## 功能特性

### ✅ 已实现功能

1. **用户注册**
   - 用户名、密码必填
   - 邮箱选填
   - 完整的表单验证
   - 注册成功后自动登录

2. **用户登录**
   - 用户名密码验证
   - Session 会话管理
   - 登录状态持久化

3. **个人信息管理**
   - 查看个人资料
   - 编辑个人信息（邮箱、手机、地区、职位、简介）
   - 信息实时更新

4. **退出登录**
   - 确认对话框
   - 清除登录状态
   - 自动跳转到登录页

5. **UI/UX**
   - 浅色主题设计
   - 响应式布局
   - 流畅的页面切换动画
   - 友好的错误提示

## 项目结构

```
.
├── frontend/                    # 前端项目
│   ├── src/
│   │   ├── api/
│   │   │   ├── api.js          # 真实 API 服务
│   │   │   └── mockApi.js      # Mock API 服务
│   │   ├── pages/
│   │   │   ├── Login.jsx       # 登录页面
│   │   │   ├── Register.jsx    # 注册页面
│   │   │   └── Profile.jsx     # 个人展示页面
│   │   ├── styles/
│   │   │   └── global.css      # 全局样式
│   │   ├── App.jsx             # 路由配置
│   │   └── main.jsx            # 入口文件
│   ├── package.json
│   └── vite.config.js
│
└── backend/                     # 后端项目
    └── kucunguanli/
        └── kucunguanlixitong/
            ├── accounts/        # 用户账户应用
            │   ├── views.py    # 登录/注册接口
            │   └── urls.py     # 路由配置
            ├── kucun/
            │   ├── middleware/
            │   │   └── cors.py # CORS 中间件
            │   ├── settings.py # Django 配置
            │   └── urls.py     # 主路由
            ├── manage.py
            └── db.sqlite3      # SQLite 数据库
```

## 快速开始

### 环境要求

- Node.js 16+
- Python 3.12+
- Git

### 1. 克隆项目

```bash
git clone <repository-url>
cd <project-directory>
```

### 2. 启动后端服务

```bash
# 进入后端目录
cd backend/kucunguanli/kucunguanlixitong

# 激活虚拟环境（如果已创建）
source .venv/bin/activate  # Linux/Mac
# 或
.venv\Scripts\activate     # Windows

# 安装依赖（如果需要）
pip install -r requirements.txt

# 运行数据库迁移
python manage.py migrate

# 启动后端服务（端口 8111）
python manage.py runserver 0.0.0.0:8111
```

后端服务将运行在：`http://127.0.0.1:8111`

### 3. 启动前端服务

```bash
# 打开新终端，进入前端目录
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端服务将运行在：`http://localhost:5173`

### 4. 访问应用

在浏览器中打开：`http://localhost:5173`

## API 接口文档

### 基础信息

- **Base URL**: `http://127.0.0.1:8111`
- **Content-Type**: `application/json`
- **CORS**: 已配置，支持跨域请求

### 接口列表

#### 1. 用户注册

**接口**: `POST /api/register`

**请求参数**:
```json
{
  "username": "testuser",      // 必填，3-20个字符，只能包含字母、数字、下划线
  "password": "123456",        // 必填，至少6个字符
  "email": "test@example.com"  // 选填，邮箱格式
}
```

**成功响应**:
```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "username": "testuser",
    "email": "test@example.com"
  }
}
```

**错误响应**:
```json
{
  "success": false,
  "message": "用户名已存在"
}
```

#### 2. 用户登录

**接口**: `POST /api/login`

**请求参数**:
```json
{
  "username": "testuser",
  "password": "123456"
}
```

**成功响应**:
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "username": "testuser",
    "email": "test@example.com"
  }
}
```

**错误响应**:
```json
{
  "success": false,
  "message": "用户名或密码错误"
}
```

## 使用指南

### 注册新账号

1. 访问注册页面：`http://localhost:5173/register`
2. 填写用户名（必填）和密码（必填）
3. 邮箱为选填项，如果不填写，系统会使用 `username@example.com` 作为默认邮箱
4. 点击"注册"按钮
5. 注册成功后自动登录并跳转到个人展示页面

### 登录系统

1. 访问登录页面：`http://localhost:5173/login`
2. 输入用户名和密码
3. 点击"登录"按钮
4. 登录成功后跳转到个人展示页面

### 管理个人信息

1. 登录后自动进入个人展示页面
2. 点击"编辑资料"按钮
3. 在弹窗中修改个人信息：
   - 邮箱
   - 手机号
   - 地区
   - 职位
   - 个人简介
4. 点击"保存"按钮保存修改

### 退出登录

1. 在个人展示页面点击"退出登录"按钮
2. 在确认对话框中点击"确定"
3. 系统清除登录状态并跳转到登录页面

## 开发说明

### 前端开发

#### 目录结构说明

- `src/api/`: API 服务层
  - `api.js`: 真实后端 API 调用
  - `mockApi.js`: Mock API（用于开发测试）
- `src/pages/`: 页面组件
- `src/styles/`: 全局样式和主题配置

#### 切换 Mock API 和真实 API

在页面组件中修改导入：

```javascript
// 使用真实 API
import api from '../api/api'

// 使用 Mock API
import api from '../api/mockApi'
```

#### 样式定制

全局样式变量定义在 `src/styles/global.css` 中，可以修改：
- 颜色主题
- 字体大小
- 间距
- 圆角
- 阴影等

### 后端开发

#### 添加新接口

1. 在 `accounts/views.py` 中添加视图函数
2. 在 `accounts/urls.py` 中添加路由
3. 使用 `@csrf_exempt` 装饰器禁用 CSRF（API 接口）
4. 返回标准 JSON 格式响应

#### 数据库操作

```bash
# 创建迁移文件
python manage.py makemigrations

# 执行迁移
python manage.py migrate

# 创建超级用户
python manage.py createsuperuser

# 访问管理后台
http://127.0.0.1:8111/admin
```

## 部署指南

### 前端部署

```bash
# 构建生产版本
cd frontend
npm run build

# 构建产物在 dist/ 目录
# 可以部署到任何静态文件服务器
```

### 后端部署

```bash
# 设置环境变量
export DEBUG=False
export SECRET_KEY='your-secret-key'

# 收集静态文件
python manage.py collectstatic

# 使用 gunicorn 运行
gunicorn kucun.wsgi:application --bind 0.0.0.0:8111
```

## 常见问题

### 1. CORS 错误

**问题**: 前端请求后端时出现 CORS 错误

**解决**:
- 确保后端已启动 CORS 中间件
- 检查 `kucun/middleware/cors.py` 配置
- 确认前端请求的 URL 正确

### 2. 登录后刷新页面退出登录

**问题**: 刷新页面后需要重新登录

**解决**:
- 登录状态保存在 localStorage 中
- 检查浏览器是否禁用了 localStorage
- 确认没有清除浏览器缓存

### 3. 注册时提示用户名已存在

**问题**: 注册新用户时提示用户名已存在

**解决**:
- 更换其他用户名
- 或在后端数据库中删除已存在的用户

### 4. 后端服务无法启动

**问题**: 运行 `python manage.py runserver` 时报错

**解决**:
- 确认已激活虚拟环境
- 检查 Python 版本是否为 3.12+
- 运行 `pip install -r requirements.txt` 安装依赖
- 检查端口 8111 是否被占用

## 技术特点

### 前端特点

1. **现代化技术栈**: 使用最新的 React 18 和 Vite 5
2. **组件化开发**: 页面组件化，代码复用性高
3. **响应式设计**: 适配不同屏幕尺寸
4. **用户体验优化**:
   - 加载状态提示
   - 错误信息友好展示
   - 表单验证实时反馈

### 后端特点

1. **RESTful API**: 标准的 REST 接口设计
2. **安全性**:
   - 密码加密存储
   - Session 会话管理
   - CSRF 保护
3. **CORS 支持**: 完整的跨域配置
4. **可扩展性**: 模块化设计，易于扩展新功能

## 更新日志

### v1.0.0 (2025-12-20)

- ✅ 实现用户注册功能
- ✅ 实现用户登录功能
- ✅ 实现个人信息管理
- ✅ 实现退出登录功能
- ✅ 配置 CORS 支持
- ✅ 浅色主题 UI 设计
- ✅ 邮箱选填功能
- ✅ 邮箱信息同步

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 联系方式

如有问题，请提交 Issue 或联系项目维护者。

---

**项目状态**: ✅ 开发完成，可用于生产环境

**最后更新**: 2025-12-20
