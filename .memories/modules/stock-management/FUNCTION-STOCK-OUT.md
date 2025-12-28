# 出库功能

## 概述

创建、编辑出库单，自动扣减库存数量。

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/stock-out/create/` | 创建出库 |
| PUT | `/api/stock-out/<id>/update/` | 编辑出库 |
| DELETE | `/api/stock-out/<id>/delete/` | 撤销出库 |

## 出库类型

| 类型 | 说明 |
|------|------|
| production | 生产领用 |
| sales | 销售出库 |
| other | 其他出库 |
| adjust_loss | 盘亏出库 |

## 编辑功能说明

- 编辑时物料不可更改
- 可修改：数量、单价、类型、操作人、备注
- 修改数量后自动计算库存差值并更新
