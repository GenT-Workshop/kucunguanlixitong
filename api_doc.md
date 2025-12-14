# 库存管理系统 - 入库接口文档

## 一、数据模型设计

### 1.1 库存表 (Stock)
| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | Integer | 主键ID | 自增 |
| material_code | CharField | 物料编号 | 唯一，最大长度50 |
| material_name | CharField | 物料名称 | 最大长度100 |
| max_stock | IntegerField | 最大库存量 | 默认0 |
| min_stock | IntegerField | 最小库存量 | 默认0 |
| current_stock | IntegerField | 当前库存量 | 默认0 |
| stock_value | DecimalField | 库存价值 | 最大10位，2位小数 |
| created_at | DateTimeField | 创建时间 | 自动生成 |
| updated_at | DateTimeField | 更新时间 | 自动更新 |

### 1.2 入库表 (StockIn)
| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | Integer | 主键ID | 自增 |
| stock | ForeignKey | 关联库存表 | 外键 |
| material_code | CharField | 物料编号 | 最大长度50 |
| material_name | CharField | 物料名称 | 最大长度100 |
| in_time | DateTimeField | 入库时间 | 默认当前时间 |
| in_quantity | IntegerField | 入库数量 | 必填 |
| in_value | DecimalField | 入库价值 | 最大10位，2位小数 |
| created_at | DateTimeField | 创建时间 | 自动生成 |

---

## 二、接口列表

| 序号 | 接口名称 | 请求方式 | URL |
|------|----------|----------|-----|
| 1 | 物料初始化 | POST | /api/stock/init/ |
| 2 | 获取库存列表 | GET | /api/stock/ |
| 3 | 获取库存详情 | GET | /api/stock/{id}/ |
| 4 | 创建入库记录 | POST | /api/stock-in/ |
| 5 | 获取入库记录列表 | GET | /api/stock-in/ |
| 6 | 获取入库记录详情 | GET | /api/stock-in/{id}/ |

---

## 三、接口详细说明

### 3.1 物料初始化接口

**接口地址：** `POST /api/stock/init/`

**接口描述：** 初始化物料基本信息，创建库存记录

**请求头：**
```
Content-Type: application/json
```

**请求参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| material_code | string | 是 | 物料编号 |
| material_name | string | 是 | 物料名称 |
| max_stock | integer | 否 | 最大库存量，默认0 |
| min_stock | integer | 否 | 最小库存量，默认0 |
| stock_value | decimal | 否 | 初始库存价值，默认0.00 |

**请求示例：**
```json
{
    "material_code": "M001",
    "material_name": "螺丝钉",
    "max_stock": 10000,
    "min_stock": 100,
    "stock_value": 0.00
}
```

**响应参数：**
| 参数名 | 类型 | 说明 |
|--------|------|------|
| code | integer | 状态码，200成功 |
| message | string | 响应消息 |
| data | object | 返回数据 |

**成功响应示例：**
```json
{
    "code": 200,
    "message": "物料初始化成功",
    "data": {
        "id": 1,
        "material_code": "M001",
        "material_name": "螺丝钉",
        "max_stock": 10000,
        "min_stock": 100,
        "current_stock": 0,
        "stock_value": "0.00",
        "created_at": "2025-12-14T10:00:00Z"
    }
}
```

**失败响应示例：**
```json
{
    "code": 400,
    "message": "物料编号已存在",
    "data": null
}
```

---

### 3.2 获取库存列表接口

**接口地址：** `GET /api/stock/`

**接口描述：** 获取所有库存物料列表，支持分页和搜索

**请求参数（Query）：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | integer | 否 | 页码，默认1 |
| page_size | integer | 否 | 每页数量，默认10 |
| search | string | 否 | 搜索关键词（物料编号/名称） |

**请求示例：**
```
GET /api/stock/?page=1&page_size=10&search=螺丝
```

**响应参数：**
| 参数名 | 类型 | 说明 |
|--------|------|------|
| code | integer | 状态码 |
| message | string | 响应消息 |
| data | object | 返回数据 |
| data.total | integer | 总记录数 |
| data.page | integer | 当前页码 |
| data.page_size | integer | 每页数量 |
| data.list | array | 库存列表 |

**成功响应示例：**
```json
{
    "code": 200,
    "message": "success",
    "data": {
        "total": 100,
        "page": 1,
        "page_size": 10,
        "list": [
            {
                "id": 1,
                "material_code": "M001",
                "material_name": "螺丝钉",
                "max_stock": 10000,
                "min_stock": 100,
                "current_stock": 500,
                "stock_value": "250.00"
            }
        ]
    }
}
```

---

### 3.3 获取库存详情接口

**接口地址：** `GET /api/stock/{id}/`

**接口描述：** 根据ID获取单个库存物料详情

**路径参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | integer | 是 | 库存记录ID |

**成功响应示例：**
```json
{
    "code": 200,
    "message": "success",
    "data": {
        "id": 1,
        "material_code": "M001",
        "material_name": "螺丝钉",
        "max_stock": 10000,
        "min_stock": 100,
        "current_stock": 500,
        "stock_value": "250.00",
        "created_at": "2025-12-14T10:00:00Z",
        "updated_at": "2025-12-14T12:00:00Z"
    }
}
```

---

### 3.4 创建入库记录接口

**接口地址：** `POST /api/stock-in/`

**接口描述：** 创建物料入库记录，同时更新库存表中的当前库存量和库存价值

**请求头：**
```
Content-Type: application/json
```

**请求参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| material_code | string | 是 | 物料编号 |
| in_quantity | integer | 是 | 入库数量 |
| in_value | decimal | 是 | 入库价值 |
| in_time | datetime | 否 | 入库时间，默认当前时间 |

**请求示例：**
```json
{
    "material_code": "M001",
    "in_quantity": 100,
    "in_value": 50.00,
    "in_time": "2025-12-14T14:30:00Z"
}
```

**响应参数：**
| 参数名 | 类型 | 说明 |
|--------|------|------|
| code | integer | 状态码 |
| message | string | 响应消息 |
| data | object | 入库记录详情 |

**成功响应示例：**
```json
{
    "code": 200,
    "message": "入库成功",
    "data": {
        "id": 1,
        "material_code": "M001",
        "material_name": "螺丝钉",
        "in_time": "2025-12-14T14:30:00Z",
        "in_quantity": 100,
        "in_value": "50.00",
        "created_at": "2025-12-14T14:30:00Z"
    }
}
```

**失败响应示例：**
```json
{
    "code": 400,
    "message": "物料编号不存在，请先初始化物料",
    "data": null
}
```

```json
{
    "code": 400,
    "message": "入库后将超过最大库存量",
    "data": null
}
```

---

### 3.5 获取入库记录列表接口

**接口地址：** `GET /api/stock-in/`

**接口描述：** 获取入库记录列表，支持分页、搜索和时间筛选

**请求参数（Query）：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | integer | 否 | 页码，默认1 |
| page_size | integer | 否 | 每页数量，默认10 |
| search | string | 否 | 搜索关键词（物料编号/名称） |
| start_time | datetime | 否 | 开始时间 |
| end_time | datetime | 否 | 结束时间 |

**请求示例：**
```
GET /api/stock-in/?page=1&page_size=10&start_time=2025-12-01&end_time=2025-12-31
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
                "in_time": "2025-12-14T14:30:00Z",
                "in_quantity": 100,
                "in_value": "50.00"
            }
        ]
    }
}
```

---

### 3.6 获取入库记录详情接口

**接口地址：** `GET /api/stock-in/{id}/`

**接口描述：** 根据ID获取单条入库记录详情

**路径参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | integer | 是 | 入库记录ID |

**成功响应示例：**
```json
{
    "code": 200,
    "message": "success",
    "data": {
        "id": 1,
        "material_code": "M001",
        "material_name": "螺丝钉",
        "in_time": "2025-12-14T14:30:00Z",
        "in_quantity": 100,
        "in_value": "50.00",
        "created_at": "2025-12-14T14:30:00Z"
    }
}
```

---

## 四、错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 五、Django模型参考实现

```python
from django.db import models

class Stock(models.Model):
    """库存表"""
    material_code = models.CharField(max_length=50, unique=True, verbose_name='物料编号')
    material_name = models.CharField(max_length=100, verbose_name='物料名称')
    max_stock = models.IntegerField(default=0, verbose_name='最大库存量')
    min_stock = models.IntegerField(default=0, verbose_name='最小库存量')
    current_stock = models.IntegerField(default=0, verbose_name='当前库存量')
    stock_value = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='库存价值')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        db_table = 'stock'
        verbose_name = '库存'
        verbose_name_plural = verbose_name


class StockIn(models.Model):
    """入库表"""
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, verbose_name='关联库存')
    material_code = models.CharField(max_length=50, verbose_name='物料编号')
    material_name = models.CharField(max_length=100, verbose_name='物料名称')
    in_time = models.DateTimeField(verbose_name='入库时间')
    in_quantity = models.IntegerField(verbose_name='入库数量')
    in_value = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='入库价值')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        db_table = 'stock_in'
        verbose_name = '入库记录'
        verbose_name_plural = verbose_name
```

---

## 六、业务逻辑说明

1. **物料初始化**：在进行入库操作前，需先通过初始化接口创建物料的库存记录
2. **入库操作**：
   - 根据物料编号查找对应的库存记录
   - 校验入库后是否超过最大库存量
   - 创建入库记录
   - 使用Django的F()表达式更新库存表的当前库存量和库存价值（原子操作）
3. **库存预警**：当current_stock < min_stock时，可在前端进行库存不足预警提示
