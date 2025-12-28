# 盘点管理模块

> 负责库存盘点任务的创建、执行和结果处理。

## 文档清单

| 文档 | 说明 |
|------|------|
| [PRD.md](./PRD.md) | 产品需求文档 |
| [FUNCTION-TASK.md](./FUNCTION-TASK.md) | 盘点任务管理 |

## 快速导航

- **核心功能**：创建盘点、提交盘点、完成盘点、盘盈盘亏处理
- **关键文件**：
  - `backend/apps/stock/models.py` - StockCountTask, StockCountItem
  - `frontend/src/pages/StockCount.tsx`
- **依赖模块**：stock-management
