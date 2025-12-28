# 库存管理系统后端 - 项目记忆文档

## 项目概述

这是一个基于 **Django + Django REST Framework** 的库存管理系统后端项目。

## 技术栈

- **框架**: Django 4.2+ / Django REST Framework 3.14.0+
- **数据库**: PostgreSQL (生产) / SQLite3 (开发)
- **Python**: 3.12
- **其他**: django-cors-headers, psycopg2-binary

## 项目结构

```
backend/
├── config/                 # Django 项目配置
│   ├── settings.py        # 全局配置
│   ├── urls.py            # 主路由
│   ├── wsgi.py            # WSGI 入口
│   └── asgi.py            # ASGI 入口
├── apps/
│   ├── accounts/          # 用户认证与权限
│   │   ├── models.py      # Role, Permission, UserRole, RolePermission
│   │   ├── views.py       # 登录/注册/用户管理
│   │   ├── urls.py        # 认证相关路由
│   │   └── permissions.py # 权限检查装饰器
│   └── stock/             # 库存管理核心
│       ├── models.py      # Stock, StockIn, StockOut, StockWarning, StockCountTask
│       ├── views.py       # 库存/入库/出库/预警/盘点/统计
│       └── urls.py        # 库存相关路由
├── manage.py
├── init_data.py           # 初始化测试数据
└── requirements.txt
```

## 常用命令

```bash
# 启动开发服务器
python manage.py runserver

# 数据库迁移
python manage.py makemigrations
python manage.py migrate

# 初始化权限和角色
python manage.py init_permissions

# 初始化测试数据
python init_data.py
```

## 数据库配置

```python
# PostgreSQL (生产环境)
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "kucun_db",
        "USER": "kucun_user",
        "PASSWORD": "kucun123",
        "HOST": "localhost",
        "PORT": "5432",
    }
}
```

## 核心数据模型

### accounts 应用

| 模型 | 说明 |
|------|------|
| Role | 角色表 (stock_in_admin, stock_out_admin, warehouse_admin, finance, boss) |
| Permission | 权限表 (24个权限，按模块分类) |
| UserRole | 用户-角色关联 |
| RolePermission | 角色-权限关联 |

### stock 应用

| 模型 | 说明 |
|------|------|
| Stock | 库存表 (物料编号、名称、规格、库存量、单价等) |
| StockIn | 入库表 (单据号、入库类型、数量、操作人) |
| StockOut | 出库表 (单据号、出库类型、数量、操作人) |
| StockWarning | 库存预警表 (预警类型、级别、处理状态) |
| StockCountTask | 盘点任务表 |
| StockCountItem | 盘点明细表 |

## API 路由概览

所有 API 前缀: `/api/`

### 认证相关
- `POST /api/login/` - 登录
- `POST /api/register/` - 注册
- `POST /api/logout/` - 登出
- `GET/PUT /api/profile/` - 用户信息
- `POST /api/change-password/` - 修改密码

### 用户管理
- `GET /api/users/` - 用户列表
- `POST /api/users/create/` - 创建用户
- `GET /api/users/<id>/` - 用户详情
- `PUT /api/users/<id>/update/` - 更新用户
- `DELETE /api/users/<id>/delete/` - 删除用户
- `GET /api/roles/` - 角色列表
- `GET /api/permissions/` - 权限列表

### 库存管理
- `GET /api/stock/` - 库存列表
- `GET /api/stock/<id>/` - 库存详情
- `POST /api/stock/init/` - 初始化物料

### 入库管理
- `GET /api/stock-in/` - 入库列表
- `POST /api/stock-in/create/` - 创建入库
- `GET /api/stock-in/<id>/` - 入库详情
- `DELETE /api/stock-in/<id>/delete/` - 删除入库

### 出库管理
- `GET /api/stock-out/` - 出库列表
- `POST /api/stock-out/create/` - 创建出库
- `GET /api/stock-out/<id>/` - 出库详情
- `DELETE /api/stock-out/<id>/delete/` - 删除出库

### 库存预警
- `GET /api/warnings/` - 预警列表
- `GET /api/warnings/statistics/` - 预警统计
- `POST /api/warnings/check/` - 检查预警

### 盘点管理
- `GET /api/stock-count/tasks/` - 盘点任务列表
- `POST /api/stock-count/tasks/create/` - 创建盘点任务
- `POST /api/stock-count/tasks/<id>/complete/` - 完成盘点
- `POST /api/stock-count/items/submit/` - 提交盘点明细

### 统计分析
- `GET /api/statistics/overview/` - 统计概览
- `GET /api/statistics/trend/` - 出入库趋势
- `GET /api/statistics/ranking/` - 物料排名
- `GET /api/statistics/category/` - 分类统计

### 月底结存
- `GET /api/monthly-report/` - 月报列表
- `GET /api/monthly-report/detail/` - 月报详情

## 权限系统

### 权限模块
- `stock_in` - 入库管理
- `stock_out` - 出库管理
- `stock_query` - 库存查询
- `stock_warning` - 库存预警
- `stock_count` - 盘点管理
- `statistics` - 统计分析
- `monthly_report` - 月底结存
- `user_manage` - 用户管理
- `material` - 物料管理

### 权限装饰器使用

```python
from apps.accounts.permissions import require_permission, require_module

@require_permission('stock_in:create')
def create_stock_in(request):
    pass

@require_module('stock_query')
def stock_list(request):
    pass
```

### 预定义角色
| 角色 | 说明 |
|------|------|
| stock_in_admin | 入库管理员 |
| stock_out_admin | 出库管理员 |
| warehouse_admin | 仓库管理员 |
| finance | 财务 |
| boss | 老板 (全权限) |

## 关键配置

```python
# settings.py

# CORS 配置
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# REST Framework
REST_FRAMEWORK = {
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.AllowAny"],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 10,
}

# 国际化
LANGUAGE_CODE = "zh-hans"
TIME_ZONE = "Asia/Shanghai"
```

## 入库/出库类型

### 入库类型 (in_type)
- `purchase` - 采购入库
- `production` - 生产入库
- `return` - 退货入库
- `other` - 其他入库
- `adjust_gain` - 盘盈入库

### 出库类型 (out_type)
- `production` - 生产领用
- `sales` - 销售出库
- `other` - 其他出库
- `adjust_loss` - 盘亏出库

## 预警级别

- `warning_type`: `low` (低于最小库存) / `high` (高于最大库存)
- `level`: `warning` (警告) / `danger` (危险)
- `status`: `pending` (待处理) / `handled` (已处理) / `ignored` (已忽略)

## 盘点状态

- `pending` - 待盘点
- `doing` - 盘点中
- `done` - 已完成
- `cancelled` - 已取消

## 开发注意事项

1. 所有 API 返回 JSON 格式
2. 列表接口支持分页，默认每页 10 条
3. 权限检查通过装饰器实现
4. 入库/出库会自动更新库存数量和价值
5. 盘点完成后会自动生成盘盈/盘亏记录
