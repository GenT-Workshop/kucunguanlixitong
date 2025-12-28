# 入库功能

## 概述

创建、编辑入库单，自动更新库存数量和价值。

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/stock-in/create/` | 创建入库 |
| PUT | `/api/stock-in/<id>/update/` | 编辑入库 |
| DELETE | `/api/stock-in/<id>/delete/` | 撤销入库 |

## 入库类型

| 类型 | 说明 |
|------|------|
| purchase | 采购入库 |
| production | 生产入库 |
| return | 退货入库 |
| other | 其他入库 |
| adjust_gain | 盘盈入库 |

## 编辑功能说明

- 编辑时物料不可更改
- 可修改：数量、单价、类型、供应商、操作人、备注
- 修改数量后自动计算库存差值并更新
