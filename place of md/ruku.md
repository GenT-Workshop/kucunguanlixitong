# 库存管理系统 - 入库接口文档

## 一、数据模型设计

### 1.1 库存表 (Stock)
| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | Integer | 主键ID | 自增 |
| material_code | CharField | 物料编号 | 最大长度50，唯一 |
| material_name | CharField | 物料名称 | 最大长度100 |
| max_stock | IntegerField | 最大库存量 | 必填 |
| min_stock | IntegerField | 最小库存量 | 必填 |
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
| in_type | CharField | 入库类型 | 采购入库/生产入库/退货入库/其他 |
| operator | CharField | 操作人 | 最大长度50 |
| remark | TextField | 备注 | 可为空 |
| created_at | DateTimeField | 创建时间 | 自动生成 |

---

## 二、接口列表

| 序号 | 接口名称 | 请求方式 | URL |
|------|----------|----------|-----|
| 1 | 创建入库记录 | POST | /api/stock-in/ |
| 2 | 获取入库记录列表 | GET | /api/stock-in/ |
| 3 | 获取入库记录详情 | GET | /api/stock-in/{id}/ |
| 4 | 删除入库记录 | DELETE | /api/stock-in/{id}/ |
| 5 | 初始化物料信息 | POST | /api/stock/ |
| 6 | 获取库存列表 | GET | /api/stock/ |
| 7 | 获取库存详情 | GET | /api/stock/{id}/ |
| 8 | 更新库存信息 | PUT | /api/stock/{id}/ |

---

## 三、接口详细说明

### 3.1 创建入库记录接口

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
| in_type | string | 是 | 入库类型（purchase/production/return/other） |
| in_time | datetime | 否 | 入库时间，默认当前时间 |
| operator | string | 否 | 操作人 |
| remark | string | 否 | 备注 |

**请求示例：**
```json
{
    "material_code": "M001",
    "in_quantity": 100,
    "in_value": 50.00,
    "in_type": "purchase",
    "in_time": "2025-12-14T10:00:00Z",
    "operator": "李四",
    "remark": "采购入库"
}
```

**响应参数：**
| 参数名 | 类型 | 说明 |
|--------|------|------|
| code | integer | 状态码，200成功 |
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
        "in_time": "2025-12-14T10:00:00Z",
        "in_quantity": 100,
        "in_value": "50.00",
        "in_type": "purchase",
        "in_type_display": "采购入库",
        "operator": "李四",
        "remark": "采购入库",
        "created_at": "2025-12-14T10:00:00Z"
    }
}
```

**失败响应示例：**
```json
{
    "code": 400,
    "message": "物料编号不存在",
    "data": null
}
```

```json
{
    "code": 400,
    "message": "入库后将超过最大库存量，当前库存80，最大库存100",
    "data": null
}
```

---

### 3.2 获取入库记录列表接口

**接口地址：** `GET /api/stock-in/`

**接口描述：** 获取入库记录列表，支持分页、搜索和时间筛选

**请求参数（Query）：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | integer | 否 | 页码，默认1 |
| page_size | integer | 否 | 每页数量，默认10 |
| search | string | 否 | 搜索关键词（物料编号/名称） |
| in_type | string | 否 | 入库类型筛选 |
| start_time | datetime | 否 | 开始时间 |
| end_time | datetime | 否 | 结束时间 |

**请求示例：**
```
GET /api/stock-in/?page=1&page_size=10&in_type=purchase&start_time=2025-12-01&end_time=2025-12-31
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
                "in_time": "2025-12-14T10:00:00Z",
                "in_quantity": 100,
                "in_value": "50.00",
                "in_type": "purchase",
                "in_type_display": "采购入库",
                "operator": "李四"
            }
        ]
    }
}
```

---

### 3.3 获取入库记录详情接口

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
        "in_time": "2025-12-14T10:00:00Z",
        "in_quantity": 100,
        "in_value": "50.00",
        "in_type": "purchase",
        "in_type_display": "采购入库",
        "operator": "李四",
        "remark": "采购入库",
        "created_at": "2025-12-14T10:00:00Z"
    }
}
```

---

### 3.4 删除入库记录接口

**接口地址：** `DELETE /api/stock-in/{id}/`

**接口描述：** 删除入库记录（同时扣减库存）

**路径参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | integer | 是 | 入库记录ID |

**成功响应示例：**
```json
{
    "code": 200,
    "message": "删除成功，库存已扣减",
    "data": null
}
```

**失败响应示例：**
```json
{
    "code": 400,
    "message": "删除失败，扣减后库存将为负数",
    "data": null
}
```

---

### 3.5 初始化物料信息接口

**接口地址：** `POST /api/stock/`

**接口描述：** 初始化物料基本信息，创建库存记录

**请求参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| material_code | string | 是 | 物料编号 |
| material_name | string | 是 | 物料名称 |
| max_stock | integer | 是 | 最大库存量 |
| min_stock | integer | 是 | 最小库存量 |
| current_stock | integer | 否 | 初始库存量，默认0 |
| stock_value | decimal | 否 | 初始库存价值，默认0 |

**请求示例：**
```json
{
    "material_code": "M001",
    "material_name": "螺丝钉",
    "max_stock": 1000,
    "min_stock": 100,
    "current_stock": 0,
    "stock_value": 0
}
```

**成功响应示例：**
```json
{
    "code": 200,
    "message": "物料初始化成功",
    "data": {
        "id": 1,
        "material_code": "M001",
        "material_name": "螺丝钉",
        "max_stock": 1000,
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

### 3.6 获取库存列表接口

**接口地址：** `GET /api/stock/`

**接口描述：** 获取库存列表，支持分页和搜索

**请求参数（Query）：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | integer | 否 | 页码，默认1 |
| page_size | integer | 否 | 每页数量，默认10 |
| search | string | 否 | 搜索关键词（物料编号/名称） |
| stock_status | string | 否 | 库存状态筛选（normal/low/high） |

**请求示例：**
```
GET /api/stock/?page=1&page_size=10&stock_status=low
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
        "list": [
            {
                "id": 1,
                "material_code": "M001",
                "material_name": "螺丝钉",
                "max_stock": 1000,
                "min_stock": 100,
                "current_stock": 500,
                "stock_value": "250.00",
                "stock_status": "normal",
                "stock_status_display": "正常"
            }
        ]
    }
}
```

---

### 3.7 获取库存详情接口

**接口地址：** `GET /api/stock/{id}/`

**接口描述：** 根据ID获取单条库存记录详情

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
        "max_stock": 1000,
        "min_stock": 100,
        "current_stock": 500,
        "stock_value": "250.00",
        "stock_status": "normal",
        "stock_status_display": "正常",
        "created_at": "2025-12-14T10:00:00Z",
        "updated_at": "2025-12-14T14:00:00Z"
    }
}
```

---

### 3.8 更新库存信息接口

**接口地址：** `PUT /api/stock/{id}/`

**接口描述：** 更新物料的基本信息（最大/最小库存量等）

**路径参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | integer | 是 | 库存记录ID |

**请求参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| material_name | string | 否 | 物料名称 |
| max_stock | integer | 否 | 最大库存量 |
| min_stock | integer | 否 | 最小库存量 |

**请求示例：**
```json
{
    "max_stock": 1500,
    "min_stock": 200
}
```

**成功响应示例：**
```json
{
    "code": 200,
    "message": "更新成功",
    "data": {
        "id": 1,
        "material_code": "M001",
        "material_name": "螺丝钉",
        "max_stock": 1500,
        "min_stock": 200,
        "current_stock": 500,
        "stock_value": "250.00"
    }
}
```

---

## 四、入库类型说明

| 类型代码 | 类型名称 | 说明 |
|----------|----------|------|
| purchase | 采购入库 | 采购物料入库 |
| production | 生产入库 | 生产完成入库 |
| return | 退货入库 | 客户退货入库 |
| other | 其他入库 | 其他原因入库 |

---

## 五、库存状态说明

| 状态代码 | 状态名称 | 说明 |
|----------|----------|------|
| normal | 正常 | 库存量在最小和最大之间 |
| low | 库存不足 | 库存量 <= 最小库存量 |
| high | 库存过高 | 库存量 >= 最大库存量 |

---

## 六、Django模型参考实现

```python
from django.db import models

class Stock(models.Model):
    """库存表"""
    material_code = models.CharField(max_length=50, unique=True, verbose_name='物料编号')
    material_name = models.CharField(max_length=100, verbose_name='物料名称')
    max_stock = models.IntegerField(verbose_name='最大库存量')
    min_stock = models.IntegerField(verbose_name='最小库存量')
    current_stock = models.IntegerField(default=0, verbose_name='当前库存量')
    stock_value = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='库存价值')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        db_table = 'stock'
        verbose_name = '库存'
        verbose_name_plural = verbose_name

    @property
    def stock_status(self):
        """计算库存状态"""
        if self.current_stock <= self.min_stock:
            return 'low'
        elif self.current_stock >= self.max_stock:
            return 'high'
        return 'normal'


class StockIn(models.Model):
    """入库表"""
    IN_TYPE_CHOICES = [
        ('purchase', '采购入库'),
        ('production', '生产入库'),
        ('return', '退货入库'),
        ('other', '其他入库'),
    ]

    stock = models.ForeignKey('Stock', on_delete=models.CASCADE, verbose_name='关联库存')
    material_code = models.CharField(max_length=50, verbose_name='物料编号')
    material_name = models.CharField(max_length=100, verbose_name='物料名称')
    in_time = models.DateTimeField(verbose_name='入库时间')
    in_quantity = models.IntegerField(verbose_name='入库数量')
    in_value = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='入库价值')
    in_type = models.CharField(max_length=20, choices=IN_TYPE_CHOICES, verbose_name='入库类型')
    operator = models.CharField(max_length=50, blank=True, verbose_name='操作人')
    remark = models.TextField(blank=True, verbose_name='备注')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        db_table = 'stock_in'
        verbose_name = '入库记录'
        verbose_name_plural = verbose_name
        ordering = ['-in_time']
```

---

## 七、业务逻辑说明

1. **入库前校验**：
   - 检查物料编号是否存在
   - 检查入库后是否超过最大库存量（给予警告但允许入库）
   - 检查入库数量是否为正数

2. **入库操作**：
   - 根据物料编号查找对应的库存记录
   - 创建入库记录
   - 使用Django的F()表达式更新库存表的当前库存量和库存价值（原子操作）

3. **库存预警**：
   - 当入库后 current_stock >= max_stock 时，返回预警信息
   - 当 current_stock <= min_stock 时，返回库存不足预警

4. **删除入库记录**：
   - 删除入库记录时需要同步扣减库存
   - 扣减前需检查扣减后库存是否为负数

---

## 八、使用Django模型方法优化

为减少服务器内存占用，建议使用以下Django内置方法：

1. **使用F()表达式进行原子更新**：
```python
from django.db.models import F

# 入库时更新库存
Stock.objects.filter(material_code=code).update(
    current_stock=F('current_stock') + quantity,
    stock_value=F('stock_value') + value
)
```

2. **使用select_related减少查询次数**：
```python
StockIn.objects.select_related('stock').filter(...)
```

3. **使用values()或only()减少内存占用**：
```python
StockIn.objects.values('id', 'material_code', 'in_quantity')
```

4. **使用iterator()处理大量数据**：
```python
for record in StockIn.objects.iterator():
    # 处理记录
```
