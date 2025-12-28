# 库存管理模块

> 负责库存的入库、出库、查询、预警、盘点等核心业务功能。

## 文档清单

| 文档 | 说明 |
|------|------|
| [PRD.md](./PRD.md) | 产品需求文档 |
| [FUNCTION-STOCK-IN.md](./FUNCTION-STOCK-IN.md) | 入库功能 |
| [FUNCTION-STOCK-OUT.md](./FUNCTION-STOCK-OUT.md) | 出库功能 |
| [FUNCTION-WARNING.md](./FUNCTION-WARNING.md) | 库存预警功能 |

## 快速导航

- **核心功能**：入库、出库、库存查询、预警、盘点、统计
- **关键文件**：
  - `backend/apps/stock/models.py` - 数据模型
  - `backend/apps/stock/views.py` - 视图函数
- **依赖模块**：accounts-auth（权限验证）
