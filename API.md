# API 接口文档

## 基础信息

- **Base URL**: `http://127.0.0.1:8111`
- **Content-Type**: `application/json`
- **字符编码**: `UTF-8`
- **CORS**: 已配置，支持跨域请求

## 通用说明

### 响应格式

所有接口返回统一的 JSON 格式：

**成功响应**:
```json
{
  "success": true,
  "message": "操作成功",
  "data": { /* 具体数据 */ }
}
```

**失败响应**:
```json
{
  "success": false,
  "message": "错误信息描述"
}
```

### HTTP 状态码

- `200`: 请求成功
- `400`: 请求参数错误
- `401`: 未授权（用户名或密码错误）
- `405`: 请求方法不允许
- `500`: 服务器内部错误

## 接口列表

### 1. 用户注册

注册新用户账号，注册成功后自动登录。

**接口地址**: `POST /api/register`

**请求头**:
```
Content-Type: application/json
```

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名，3-20个字符，只能包含字母、数字、下划线 |
| password | string | 是 | 密码，至少6个字符 |
| email | string | 否 | 邮箱地址，需符合邮箱格式 |

**请求示例**:
```bash
curl -X POST http://127.0.0.1:8111/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "123456",
    "email": "test@example.com"
  }'
```

**成功响应** (200):
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

1. 缺少必填字段 (400):
```json
{
  "success": false,
  "message": "缺少用户名或密码"
}
```

2. 用户名长度不符 (400):
```json
{
  "success": false,
  "message": "用户名至少3个字符"
}
```

3. 密码长度不符 (400):
```json
{
  "success": false,
  "message": "密码至少6个字符"
}
```

4. 用户名格式错误 (400):
```json
{
  "success": false,
  "message": "用户名只能包含字母、数字和下划线"
}
```

5. 用户名已存在 (400):
```json
{
  "success": false,
  "message": "用户名已存在"
}
```

---

### 2. 用户登录

验证用户名和密码，登录成功后创建会话。

**接口地址**: `POST /api/login`

**请求头**:
```
Content-Type: application/json
```

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

**请求示例**:
```bash
curl -X POST http://127.0.0.1:8111/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "123456"
  }'
```

**成功响应** (200):
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

1. 缺少必填字段 (400):
```json
{
  "success": false,
  "message": "缺少用户名或密码"
}
```

2. 用户名或密码错误 (401):
```json
{
  "success": false,
  "message": "用户名或密码错误"
}
```

---

## 前端 API 调用示例

### JavaScript Fetch

```javascript
// 注册
async function register(username, password, email) {
  const response = await fetch('http://127.0.0.1:8111/api/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ username, password, email })
  });

  const data = await response.json();
  return data;
}

// 登录
async function login(username, password) {
  const response = await fetch('http://127.0.0.1:8111/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ username, password })
  });

  const data = await response.json();
  return data;
}
```

### Axios

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8111',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// 注册
export const register = (username, password, email) => {
  return api.post('/api/register', { username, password, email });
};

// 登录
export const login = (username, password) => {
  return api.post('/api/login', { username, password });
};
```

## 会话管理

### Session Cookie

- 登录成功后，后端会创建 Session 并返回 `sessionid` Cookie
- 前端需要在后续请求中携带此 Cookie
- 使用 `credentials: 'include'` 或 `withCredentials: true` 自动携带 Cookie

### 登录状态检查

前端可以通过以下方式检查登录状态：

1. 检查 localStorage 中的 `isLoggedIn` 标志
2. 尝试访问需要登录的接口，根据响应判断

## 错误处理

### 前端错误处理示例

```javascript
async function handleApiCall() {
  try {
    const response = await api.login('username', 'password');

    if (response.success) {
      // 登录成功
      console.log('登录成功:', response.data);
    } else {
      // 业务错误
      console.error('登录失败:', response.message);
    }
  } catch (error) {
    // 网络错误或其他异常
    console.error('请求失败:', error.message);
  }
}
```

## 安全说明

### 密码安全

- 后端使用 Django 的 `make_password` 进行密码加密
- 密码不会以明文形式存储
- 使用 PBKDF2 算法进行哈希

### CSRF 保护

- API 接口使用 `@csrf_exempt` 装饰器，不需要 CSRF Token
- 适用于前后端分离的场景
- 如需启用 CSRF，需要在前端请求中携带 CSRF Token

### CORS 配置

- 后端配置了 CORS 中间件
- 允许的请求方法：GET, POST, PUT, DELETE, OPTIONS
- 允许的请求头：Content-Type, Authorization
- 支持 Credentials（Cookie）

## 测试工具

### Postman 测试

1. 创建新请求
2. 设置请求方法为 POST
3. 输入 URL：`http://127.0.0.1:8111/api/register`
4. 在 Headers 中添加：`Content-Type: application/json`
5. 在 Body 中选择 raw 和 JSON，输入请求参数
6. 点击 Send 发送请求

### cURL 测试

```bash
# 注册
curl -X POST http://127.0.0.1:8111/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"123456","email":"test@example.com"}'

# 登录
curl -X POST http://127.0.0.1:8111/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"123456"}'
```

## 常见问题

### Q1: 为什么收到 405 错误？

**A**: 检查请求方法是否正确，所有接口只支持 POST 方法。

### Q2: 为什么收到 CORS 错误？

**A**: 确保：
1. 后端服务已启动
2. CORS 中间件已配置
3. 前端请求使用了正确的 URL

### Q3: 登录后如何保持会话？

**A**:
1. 前端请求时使用 `credentials: 'include'`
2. 后端会自动管理 Session Cookie
3. 前端可以将用户信息保存到 localStorage

### Q4: 如何退出登录？

**A**:
1. 前端清除 localStorage 中的用户信息
2. 清除 Cookie（可选）
3. 跳转到登录页面

## 更新日志

### v1.0.0 (2025-12-20)

- ✅ 添加用户注册接口
- ✅ 添加用户登录接口
- ✅ 配置 CORS 支持
- ✅ 实现 Session 会话管理

---

**文档版本**: v1.0.0
**最后更新**: 2025-12-20
