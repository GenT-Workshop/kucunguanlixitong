# 前端风格文档 (Style Guide)

基于设计稿创建的前端样式规范文档。

---

## 1. 颜色系统 (Color System)

### 1.1 主色调 (Primary Colors)

| 名称 | 色值 | 用途 |
|------|------|------|
| 主色 (Primary) | `#1890FF` | 主要按钮、链接、选中状态 |
| 主色悬停 (Primary Hover) | `#40A9FF` | 按钮悬停状态 |
| 主色激活 (Primary Active) | `#096DD9` | 按钮点击状态 |

### 1.2 背景色 (Background Colors)

| 名称 | 色值 | 用途 |
|------|------|------|
| 页面背景 | `#0D1117` | 整体页面背景 |
| 侧边栏背景 | `#161B22` | 左侧导航栏背景 |
| 卡片背景 | `#21262D` | 内容卡片、表格背景 |
| 输入框背景 | `#0D1117` | 表单输入框背景 |

### 1.3 文字颜色 (Text Colors)

| 名称 | 色值 | 用途 |
|------|------|------|
| 主要文字 | `#FFFFFF` | 标题、重要内容 |
| 次要文字 | `#8B949E` | 描述、辅助信息 |
| 禁用文字 | `#484F58` | 禁用状态文字 |
| 链接文字 | `#58A6FF` | 可点击链接 |

### 1.4 边框颜色 (Border Colors)

| 名称 | 色值 | 用途 |
|------|------|------|
| 默认边框 | `#30363D` | 卡片、输入框边框 |
| 分割线 | `#21262D` | 列表分割线 |

### 1.5 状态颜色 (Status Colors)

| 名称 | 色值 | 用途 |
|------|------|------|
| 成功 (Success) | `#238636` | 成功提示、完成状态 |
| 警告 (Warning) | `#D29922` | 警告提示 |
| 错误 (Error) | `#F85149` | 错误提示、删除操作 |
| 信息 (Info) | `#58A6FF` | 信息提示 |

---

## 2. 字体系统 (Typography)

### 2.1 字体族 (Font Family)

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
             'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue',
             Helvetica, Arial, sans-serif;
```

### 2.2 字体大小 (Font Sizes)

| 名称 | 大小 | 行高 | 用途 |
|------|------|------|------|
| 超大标题 | `24px` | `32px` | 页面主标题 |
| 大标题 | `20px` | `28px` | 卡片标题 |
| 标题 | `16px` | `24px` | 小节标题 |
| 正文 | `14px` | `22px` | 主要内容文字 |
| 辅助文字 | `12px` | `20px` | 描述、提示信息 |

### 2.3 字重 (Font Weights)

| 名称 | 值 | 用途 |
|------|------|------|
| 常规 | `400` | 正文内容 |
| 中等 | `500` | 小标题 |
| 粗体 | `600` | 大标题、强调 |

---

## 3. 间距系统 (Spacing)

### 3.1 基础间距

| 名称 | 值 | 用途 |
|------|------|------|
| xs | `4px` | 紧凑元素间距 |
| sm | `8px` | 小间距 |
| md | `16px` | 默认间距 |
| lg | `24px` | 大间距 |
| xl | `32px` | 区块间距 |
| xxl | `48px` | 页面级间距 |

### 3.2 内边距 (Padding)

```css
/* 卡片内边距 */
.card {
  padding: 24px;
}

/* 按钮内边距 */
.btn {
  padding: 8px 16px;
}

/* 输入框内边距 */
.input {
  padding: 8px 12px;
}
```

---

## 4. 圆角系统 (Border Radius)

| 名称 | 值 | 用途 |
|------|------|------|
| 小圆角 | `4px` | 按钮、输入框 |
| 中圆角 | `6px` | 卡片、下拉框 |
| 大圆角 | `8px` | 弹窗、大卡片 |
| 圆形 | `50%` | 头像、图标按钮 |

---

## 5. 阴影系统 (Shadows)

```css
/* 卡片阴影 */
.shadow-card {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12),
              0 1px 2px rgba(0, 0, 0, 0.24);
}

/* 弹窗阴影 */
.shadow-modal {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

/* 下拉菜单阴影 */
.shadow-dropdown {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
```

---

## 6. 组件规范 (Components)

### 6.1 按钮 (Buttons)

```css
/* 主要按钮 */
.btn-primary {
  background-color: #1890FF;
  color: #FFFFFF;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background-color: #40A9FF;
}

/* 次要按钮 */
.btn-secondary {
  background-color: transparent;
  color: #8B949E;
  border: 1px solid #30363D;
  border-radius: 4px;
  padding: 8px 16px;
}

/* 危险按钮 */
.btn-danger {
  background-color: #F85149;
  color: #FFFFFF;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
}
```

### 6.2 输入框 (Inputs)

```css
.input {
  background-color: #0D1117;
  border: 1px solid #30363D;
  border-radius: 4px;
  padding: 8px 12px;
  color: #FFFFFF;
  font-size: 14px;
  width: 100%;
  transition: border-color 0.2s;
}

.input:focus {
  border-color: #1890FF;
  outline: none;
}

.input::placeholder {
  color: #484F58;
}
```

### 6.3 卡片 (Cards)

```css
.card {
  background-color: #21262D;
  border: 1px solid #30363D;
  border-radius: 6px;
  padding: 24px;
}

.card-header {
  font-size: 16px;
  font-weight: 600;
  color: #FFFFFF;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #30363D;
}
```

### 6.4 表格 (Tables)

```css
.table {
  width: 100%;
  border-collapse: collapse;
  background-color: #21262D;
}

.table th {
  background-color: #161B22;
  color: #8B949E;
  font-weight: 500;
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #30363D;
}

.table td {
  padding: 12px 16px;
  color: #FFFFFF;
  border-bottom: 1px solid #30363D;
}

.table tr:hover {
  background-color: #30363D;
}
```

### 6.5 侧边栏导航 (Sidebar Navigation)

```css
.sidebar {
  width: 240px;
  background-color: #161B22;
  height: 100vh;
  padding: 16px 0;
}

.sidebar-item {
  display: flex;
  align-items: center;
  padding: 12px 24px;
  color: #8B949E;
  cursor: pointer;
  transition: all 0.2s;
}

.sidebar-item:hover {
  background-color: #21262D;
  color: #FFFFFF;
}

.sidebar-item.active {
  background-color: #21262D;
  color: #1890FF;
  border-left: 3px solid #1890FF;
}

.sidebar-item-icon {
  margin-right: 12px;
  font-size: 16px;
}
```

---

## 7. 布局规范 (Layout)

### 7.1 页面结构

```
+------------------+--------------------------------+
|     Logo         |          Header                |
+------------------+--------------------------------+
|                  |                                |
|    Sidebar       |          Content               |
|    (240px)       |          (flex: 1)             |
|                  |                                |
+------------------+--------------------------------+
```

### 7.2 栅格系统

- 使用 24 列栅格系统
- 列间距: `16px`
- 响应式断点:
  - `xs`: < 576px
  - `sm`: >= 576px
  - `md`: >= 768px
  - `lg`: >= 992px
  - `xl`: >= 1200px
  - `xxl`: >= 1600px

---

## 8. 动画过渡 (Transitions)

```css
/* 默认过渡 */
.transition-default {
  transition: all 0.2s ease-in-out;
}

/* 快速过渡 */
.transition-fast {
  transition: all 0.1s ease-in-out;
}

/* 慢速过渡 */
.transition-slow {
  transition: all 0.3s ease-in-out;
}
```

---

## 9. CSS 变量 (CSS Variables)

```css
:root {
  /* 主色 */
  --color-primary: #1890FF;
  --color-primary-hover: #40A9FF;
  --color-primary-active: #096DD9;

  /* 背景色 */
  --bg-page: #0D1117;
  --bg-sidebar: #161B22;
  --bg-card: #21262D;
  --bg-input: #0D1117;

  /* 文字颜色 */
  --text-primary: #FFFFFF;
  --text-secondary: #8B949E;
  --text-disabled: #484F58;
  --text-link: #58A6FF;

  /* 边框颜色 */
  --border-default: #30363D;
  --border-divider: #21262D;

  /* 状态颜色 */
  --color-success: #238636;
  --color-warning: #D29922;
  --color-error: #F85149;
  --color-info: #58A6FF;

  /* 间距 */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-xxl: 48px;

  /* 圆角 */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;

  /* 侧边栏宽度 */
  --sidebar-width: 240px;
}
```

---

## 10. 使用示例

### 10.1 页面基础结构

```html
<div class="app-container">
  <aside class="sidebar">
    <div class="logo">Logo</div>
    <nav class="sidebar-nav">
      <div class="sidebar-item active">
        <span class="sidebar-item-icon">📊</span>
        <span>仪表盘</span>
      </div>
      <div class="sidebar-item">
        <span class="sidebar-item-icon">👥</span>
        <span>用户管理</span>
      </div>
    </nav>
  </aside>
  <main class="main-content">
    <header class="header">
      <h1>页面标题</h1>
    </header>
    <div class="content">
      <div class="card">
        <!-- 卡片内容 -->
      </div>
    </div>
  </main>
</div>
```

---

*文档版本: 1.0.0*
*最后更新: 2025-12-20*
