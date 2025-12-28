# 模块索引

本文件维护所有记忆模块的清单，便于快速检索。

## 模块列表

| 模块目录 | 说明 | 负责人 | 最后更新 |
|----------|------|--------|----------|
| `accounts-auth` | 用户认证与权限管理 | - | 2025-12-28 |
| `stock-management` | 库存管理核心功能 | - | 2025-12-28 |
| `frontend-pages` | 前端页面模块 | - | 2025-12-28 |
| `statistics` | 统计分析模块 | - | 2025-12-28 |
| `stock-count` | 盘点管理模块 | - | 2025-12-28 |
| `monthly-report` | 月底结存模块 | - | 2025-12-28 |

## 模块依赖关系

```
accounts-auth (基础模块)
    ↓
stock-management
    ↓
├── statistics
├── stock-count
├── monthly-report
└── frontend-pages
```

## 更新说明

- 新增模块时请在此表格中登记
- 每次修改模块内容后更新"最后更新"时间

## 更新记录

- **2025-12-28**: 新增 frontend-pages, statistics, stock-count, monthly-report 模块
- **2025-12-28**: 入库/出库功能新增编辑 API
