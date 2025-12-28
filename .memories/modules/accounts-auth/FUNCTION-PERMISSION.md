# 权限验证功能

## 概述

通过装饰器验证用户是否有权限访问特定功能。

## 权限装饰器

| 装饰器 | 说明 |
|--------|------|
| `@require_permission('module:action')` | 验证具体权限 |
| `@require_module('module')` | 验证模块访问权限 |

## 权限模块列表

| 模块 | 说明 |
|------|------|
| stock_in | 入库管理 |
| stock_out | 出库管理 |
| stock_query | 库存查询 |
| stock_warning | 库存预警 |
| stock_count | 盘点管理 |
| statistics | 统计分析 |
| monthly_report | 月底结存 |
| user_manage | 用户管理 |
| material | 物料管理 |

## 使用示例

```python
from apps.accounts.permissions import require_permission

@require_permission('stock_in:create')
def create_stock_in(request):
    pass
```
