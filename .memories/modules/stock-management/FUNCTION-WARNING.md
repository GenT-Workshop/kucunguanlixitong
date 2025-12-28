# 库存预警功能

## 概述

监控库存数量，当低于或高于阈值时自动生成预警。

## API 接口

- **列表**: `GET /api/warnings/`
- **统计**: `GET /api/warnings/statistics/`
- **检查**: `POST /api/warnings/check/`

## 预警类型

| 类型 | 说明 |
|------|------|
| low | 低于最小库存 |
| high | 高于最大库存 |

## 预警级别

| 级别 | 说明 |
|------|------|
| warning | 警告 |
| danger | 危险 |

## 处理状态

| 状态 | 说明 |
|------|------|
| pending | 待处理 |
| handled | 已处理 |
| ignored | 已忽略 |
