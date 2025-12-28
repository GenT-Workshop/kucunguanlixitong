# 统计概览

## 概述

展示库存系统的核心统计数据。

## 输入输出

| 类型 | 说明 |
|------|------|
| 输入 | 无 |
| 输出 | 库存总量、总价值、物料数等 |

## 核心逻辑

1. 聚合库存表数据
2. 计算总量和总价值
3. 返回统计结果

## 关键代码

```python
# GET /api/statistics/overview/
def statistics_overview(request):
    total_qty = Stock.objects.aggregate(Sum('current_stock'))
    total_value = Stock.objects.aggregate(Sum('stock_value'))
```

## 依赖关系

- Stock 模型

## 注意事项

- 数据实时计算，无缓存
