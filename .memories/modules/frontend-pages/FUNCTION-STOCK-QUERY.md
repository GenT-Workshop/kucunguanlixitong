# 库存查询页面

## 概述

提供库存数据的搜索、筛选和展示功能。

## 输入输出

| 类型 | 说明 |
|------|------|
| 输入 | 搜索关键词、筛选条件 |
| 输出 | 分页库存列表 |

## 核心逻辑

1. 用户输入搜索条件
2. 调用 API 获取数据
3. 表格展示结果

## 关键代码

```tsx
// frontend/src/pages/StockQuery.tsx
const StockQuery = () => {
  const [data, setData] = useState([])
  // 搜索、筛选、分页逻辑
}
```

## 依赖关系

- getStockList API

## 注意事项

- 支持按物料编号、名称搜索
- 支持按分类、状态筛选
