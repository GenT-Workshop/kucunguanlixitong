# 用户认证与权限管理模块

> 负责用户登录、注册、权限验证及角色管理的核心模块。

## 文档清单

| 文档 | 说明 |
|------|------|
| [PRD.md](./PRD.md) | 产品需求文档 |
| [FUNCTION-LOGIN.md](./FUNCTION-LOGIN.md) | 登录功能 |
| [FUNCTION-PERMISSION.md](./FUNCTION-PERMISSION.md) | 权限验证功能 |

## 快速导航

- **核心功能**：登录、注册、登出、权限检查、角色管理
- **关键文件**：
  - `backend/apps/accounts/models.py` - 数据模型
  - `backend/apps/accounts/views.py` - 视图函数
  - `backend/apps/accounts/permissions.py` - 权限装饰器
- **依赖模块**：无（基础模块）
