# 库存管理系统 - 数据查询接口文档

## 一、接口列表

| 序号 | 接口名称 | 请求方式 | URL |
|------|----------|----------|-----|
| 1 | 库存综合查询 | GET | /api/query/stock/ |
| 2 | 入库记录查询 | GET | /api/query/stock-in/ |
| 3 | 出库记录查询 | GET | /api/query/stock-out/ |
| 4 | 物料流水查询 | GET | /api/query/material-flow/ |
| 5 | 库存统计查询 | GET | /api/query/statistics/ |

---

## 二、接口详细说明

### 2.1 库存综合查询接口

**接口地址：** `GET /api/query/stock/`

**接口描述：** 按多种条件组合查询库存物料信息

**请求参数（Query）：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | integer | 否 | 页码，默认1 |
| page_size | integer | 否 | 每页数量，默认10 |
| material_code | string | 否 | 物料编号（支持模糊查询） |
| material_name | string | 否 | 物料名称（支持模糊查询） |
| min_stock_qty | integer | 否 | 最小库存数量 |
| max_stock_qty | integer | 否 | 最大库存数量 |
| min_stock_value | decimal | 否 | 最小库存价值 |
| max_stock_value | decimal | 否 | 最大库存价值 |
| stock_status | string | 否 | 库存状态（normal/low/high） |
| sort_by | string | 否 | 排序字段 |
| sort_order | string | 否 | 排序方式（asc/desc） |

**请求示例：**
```
GET /api/query/stock/?material_name=螺丝&stock_status=low&sort_by=current_stock&sort_order=asc
```

**成功响应示例：**
```json
{
    "code": 200,
    "message": "success",
    "data": {
        "total": 50,
        "page": 1,
        "page_size": 10,
        "list": [
            {
                "id": 1,
                "material_code": "M001",
                "material_name": "螺丝钉",
                "max_stock": 10000,
                "min_stock": 100,
                "current_stock": 80,
                "stock_value": "40.00",
                "stock_status": "low",
                "stock_status_display": "库存不足",
                "created_at": "2025-12-01T10:00:00Z",
                "updated_at": "2025-12-14T14:30:00Z"
            }
        ]
    }
}
```

---

### 2.2 入库记录查询接口

**接口地址：** `GET /api/query/stock-in/`

**接口描述：** 按多种条件组合查询入库记录

**请求参数（Query）：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | integer | 否 | 页码，默认1 |
| page_size | integer | 否 | 每页数量，默认10 |
| material_code | string | 否 | 物料编号 |
| material_name | string | 否 | 物料名称 |
| start_time | datetime | 否 | 开始时间 |
| end_time | datetime | 否 | 结束时间 |
| min_quantity | integer | 否 | 最小入库数量 |
| max_quantity | integer | 否 | 最大入库数量 |
| min_value | decimal | 否 | 最小入库价值 |
| max_value | decimal | 否 | 最大入库价值 |

**请求示例：**
```
GET /api/query/stock-in/?start_time=2025-12-01&end_time=2025-12-31&material_code=M001
```

**成功响应示例：**
```json
{
    "code": 200,
    "message": "success",
    "data": {
        "total": 20,
        "page": 1,
        "page_size": 10,
        "summary": {
            "total_quantity": 1500,
            "total_value": "7500.00"
        },
        "list": [
            {
                "id": 1,
                "material_code": "M001",
                "material_name": "螺丝钉",
                "in_time": "2025-12-14T14:30:00Z",
                "in_quantity": 100,
                "in_value": "50.00",
                "created_at": "2025-12-14T14:30:00Z"
            }
        ]
    }
}
```

---

### 2.3 出库记录查询接口

**接口地址：** `GET /api/query/stock-out/`

**接口描述：** 按多种条件组合查询出库记录

**请求参数（Query）：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | integer | 否 | 页码，默认1 |
| page_size | integer | 否 | 每页数量，默认10 |
| material_code | string | 否 | 物料编号 |
| material_name | string | 否 | 物料名称 |
| out_type | string | 否 | 出库类型 |
| operator | string | 否 | 操作人 |
| start_time | datetime | 否 | 开始时间 |
| end_time | datetime | 否 | 结束时间 |
| min_quantity | integer | 否 | 最小出库数量 |
| max_quantity | integer | 否 | 最大出库数量 |

**请求示例：**
```
GET /api/query/stock-out/?out_type=production&start_time=2025-12-01&end_time=2025-12-31
```

**成功响应示例：**
```json
{
    "code": 200,
    "message": "success",
    "data": {
        "total": 30,
        "page": 1,
        "page_size": 10,
        "summary": {
            "total_quantity": 800,
            "total_value": "4000.00",
            "by_type": {
                "production": {"quantity": 500, "value": "2500.00"},
                "sales": {"quantity": 300, "value": "1500.00"}
            }
        },
        "list": [
            {
                "id": 1,
                "material_code": "M001",
                "material_name": "螺丝钉",
                "out_time": "2025-12-14T14:30:00Z",
                "out_quantity": 50,
                "out_value": "25.00",
                "out_type": "production",
                "out_type_display": "生产领料",
                "operator": "张三"
            }
        ]
    }
}
```

---

### 2.4 物料流水查询接口

**接口地址：** `GET /api/query/material-flow/`

**接口描述：** 查询指定物料的所有出入库流水记录

**请求参数（Query）：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| material_code | string | 是 | 物料编号 |
| page | integer | 否 | 页码，默认1 |
| page_size | integer | 否 | 每页数量，默认20 |
| flow_type | string | 否 | 流水类型（in/out/all） |
| start_time | datetime | 否 | 开始时间 |
| end_time | datetime | 否 | 结束时间 |

**请求示例：**
```
GET /api/query/material-flow/?material_code=M001&start_time=2025-12-01&end_time=2025-12-31
```

**成功响应示例：**
```json
{
    "code": 200,
    "message": "success",
    "data": {
        "material_info": {
            "material_code": "M001",
            "material_name": "螺丝钉",
            "current_stock": 500,
            "stock_value": "250.00"
        },
        "total": 15,
        "page": 1,
        "page_size": 20,
        "summary": {
            "total_in_quantity": 1000,
            "total_in_value": "500.00",
            "total_out_quantity": 500,
            "total_out_value": "250.00"
        },
        "list": [
            {
                "id": 1,
                "flow_type": "in",
                "flow_type_display": "入库",
                "time": "2025-12-14T14:30:00Z",
                "quantity": 100,
                "value": "50.00",
                "balance_quantity": 600,
                "balance_value": "300.00",
                "remark": "采购入库"
            },
            {
                "id": 2,
                "flow_type": "out",
                "flow_type_display": "出库",
                "time": "2025-12-14T16:00:00Z",
                "quantity": 50,
                "value": "25.00",
                "balance_quantity": 550,
                "balance_value": "275.00",
                "remark": "生产领料"
            }
        ]
    }
}
```

---

### 2.5 库存统计查询接口

**接口地址：** `GET /api/query/statistics/`

**接口描述：** 获取库存统计数据

**请求参数（Query）：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| start_date | date | 否 | 开始日期 |
| end_date | date | 否 | 结束日期 |
| group_by | string | 否 | 分组方式（day/week/month） |

**请求示例：**
```
GET /api/query/statistics/?start_date=2025-12-01&end_date=2025-12-31&group_by=day
```

**成功响应示例：**
```json
{
    "code": 200,
    "message": "success",
    "data": {
        "overview": {
            "total_materials": 100,
            "total_stock_quantity": 50000,
            "total_stock_value": "250000.00",
            "low_stock_count": 5,
            "high_stock_count": 3
        },
        "period_summary": {
            "total_in_quantity": 10000,
            "total_in_value": "50000.00",
            "total_out_quantity": 8000,
            "total_out_value": "40000.00",
            "net_change_quantity": 2000,
            "net_change_value": "10000.00"
        },
        "trend": [
            {
                "date": "2025-12-01",
                "in_quantity": 500,
                "in_value": "2500.00",
                "out_quantity": 300,
                "out_value": "1500.00"
            },
            {
                "date": "2025-12-02",
                "in_quantity": 600,
                "in_value": "3000.00",
                "out_quantity": 400,
                "out_value": "2000.00"
            }
        ],
        "top_in_materials": [
            {"material_code": "M001", "material_name": "螺丝钉", "quantity": 1000, "value": "5000.00"}
        ],
        "top_out_materials": [
            {"material_code": "M002", "material_name": "螺母", "quantity": 800, "value": "4000.00"}
        ]
    }
}
```

---

## 三、库存状态说明

| 状态代码 | 状态名称 | 说明 |
|----------|----------|------|
| normal | 正常 | 库存在最小和最大库存量之间 |
| low | 库存不足 | 当前库存 <= 最小库存量 |
| high | 库存过高 | 当前库存 >= 最大库存量 |

---

## 四、排序字段说明

| 字段名 | 说明 |
|--------|------|
| material_code | 物料编号 |
| material_name | 物料名称 |
| current_stock | 当前库存量 |
| stock_value | 库存价值 |
| created_at | 创建时间 |
| updated_at | 更新时间 |

---

## 五、导出功能

所有查询接口均支持导出功能，在请求参数中添加 `export=true` 即可导出Excel文件。

**示例：**
```
GET /api/query/stock/?material_name=螺丝&export=true
```

**导出字段：**
- 物料编号
- 物料名称
- 当前库存
- 最大库存
- 最小库存
- 库存价值
- 库存状态
- 更新时间
