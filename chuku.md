# 库存管理系统 - 出库接口文档

## 一、数据模型设计

### 1.1 出库表 (StockOut)
| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | Integer | 主键ID | 自增 |
| stock | ForeignKey | 关联库存表 | 外键 |
| material_code | CharField | 物料编号 | 最大长度50 |
| material_name | CharField | 物料名称 | 最大长度100 |
| out_time | DateTimeField | 出库时间 | 默认当前时间 |
| out_quantity | IntegerField | 出库数量 | 必填 |
| out_value | DecimalField | 出库价值 | 最大10位，2位小数 |
| out_type | CharField | 出库类型 | 生产领料/销售提货/其他 |
| operator | CharField | 操作人 | 最大长度50 |
| remark | TextField | 备注 | 可为空 |
| created_at | DateTimeField | 创建时间 | 自动生成 |

---

## 二、接口列表

| 序号 | 接口名称 | 请求方式 | URL |
|------|----------|----------|-----|
| 1 | 创建出库记录 | POST | /api/stock-out/ |
| 2 | 获取出库记录列表 | GET | /api/stock-out/ |
| 3 | 获取出库记录详情 | GET | /api/stock-out/{id}/ |
| 4 | 删除出库记录 | DELETE | /api/stock-out/{id}/ |

---

## 三、接口详细说明

### 3.1 创建出库记录接口

**接口地址：** `POST /api/stock-out/`

**接口描述：** 创建物料出库记录，同时更新库存表中的当前库存量和库存价值

**请求头：**
```
Content-Type: application/json
```

**请求参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| material_code | string | 是 | 物料编号 |
| out_quantity | integer | 是 | 出库数量 |
| out_value | decimal | 是 | 出库价值 |
| out_type | string | 是 | 出库类型（production/sales/other） |
| out_time | datetime | 否 | 出库时间，默认当前时间 |
| operator | string | 否 | 操作人 |
| remark | string | 否 | 备注 |

**请求示例：**
```json
{
    "material_code": "M001",
    "out_quantity": 50,
    "out_value": 25.00,
    "out_type": "production",
    "out_time": "2025-12-14T14:30:00Z",
    "operator": "张三",
    "remark": "生产车间领料"
}
```

**响应参数：**
| 参数名 | 类型 | 说明 |
|--------|------|------|
| code | integer | 状态码，200成功 |
| message | string | 响应消息 |
| data | object | 出库记录详情 |

**成功响应示例：**
```json
{
    "code": 200,
    "message": "出库成功",
    "data": {
        "id": 1,
        "material_code": "M001",
        "material_name": "螺丝钉",
        "out_time": "2025-12-14T14:30:00Z",
        "out_quantity": 50,
        "out_value": "25.00",
        "out_type": "production",
        "out_type_display": "生产领料",
        "operator": "张三",
        "remark": "生产车间领料",
        "created_at": "2025-12-14T14:30:00Z"
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
    "message": "库存不足，当前库存量为30",
    "data": null
}
```

---

### 3.2 获取出库记录列表接口

**接口地址：** `GET /api/stock-out/`

**接口描述：** 获取出库记录列表，支持分页、搜索和时间筛选

**请求参数（Query）：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | integer | 否 | 页码，默认1 |
| page_size | integer | 否 | 每页数量，默认10 |
| search | string | 否 | 搜索关键词（物料编号/名称） |
| out_type | string | 否 | 出库类型筛选 |
| start_time | datetime | 否 | 开始时间 |
| end_time | datetime | 否 | 结束时间 |

**请求示例：**
```
GET /api/stock-out/?page=1&page_size=10&out_type=production&start_time=2025-12-01&end_time=2025-12-31
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

### 3.3 获取出库记录详情接口

**接口地址：** `GET /api/stock-out/{id}/`

**接口描述：** 根据ID获取单条出库记录详情

**路径参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | integer | 是 | 出库记录ID |

**成功响应示例：**
```json
{
    "code": 200,
    "message": "success",
    "data": {
        "id": 1,
        "material_code": "M001",
        "material_name": "螺丝钉",
        "out_time": "2025-12-14T14:30:00Z",
        "out_quantity": 50,
        "out_value": "25.00",
        "out_type": "production",
        "out_type_display": "生产领料",
        "operator": "张三",
        "remark": "生产车间领料",
        "created_at": "2025-12-14T14:30:00Z"
    }
}
```

---

### 3.4 删除出库记录接口

**接口地址：** `DELETE /api/stock-out/{id}/`

**接口描述：** 删除出库记录（同时恢复库存）

**路径参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | integer | 是 | 出库记录ID |

**成功响应示例：**
```json
{
    "code": 200,
    "message": "删除成功，库存已恢复",
    "data": null
}
```

---

## 四、出库类型说明

| 类型代码 | 类型名称 | 说明 |
|----------|----------|------|
| production | 生产领料 | 生产车间领用物料 |
| sales | 销售提货 | 销售出库 |
| other | 其他出库 | 其他原因出库 |

---

## 五、Django模型参考实现

```python
from django.db import models

class StockOut(models.Model):
    """出库表"""
    OUT_TYPE_CHOICES = [
        ('production', '生产领料'),
        ('sales', '销售提货'),
        ('other', '其他出库'),
    ]

    stock = models.ForeignKey('Stock', on_delete=models.CASCADE, verbose_name='关联库存')
    material_code = models.CharField(max_length=50, verbose_name='物料编号')
    material_name = models.CharField(max_length=100, verbose_name='物料名称')
    out_time = models.DateTimeField(verbose_name='出库时间')
    out_quantity = models.IntegerField(verbose_name='出库数量')
    out_value = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='出库价值')
    out_type = models.CharField(max_length=20, choices=OUT_TYPE_CHOICES, verbose_name='出库类型')
    operator = models.CharField(max_length=50, blank=True, verbose_name='操作人')
    remark = models.TextField(blank=True, verbose_name='备注')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        db_table = 'stock_out'
        verbose_name = '出库记录'
        verbose_name_plural = verbose_name
        ordering = ['-out_time']
```

---

## 六、业务逻辑说明

1. **出库前校验**：
   - 检查物料编号是否存在
   - 检查当前库存是否充足（current_stock >= out_quantity）
   - 检查出库后是否低于最小库存量（给予警告但允许出库）

2. **出库操作**：
   - 根据物料编号查找对应的库存记录
   - 创建出库记录
   - 使用Django的F()表达式更新库存表的当前库存量和库存价值（原子操作）

3. **库存预警**：
   - 当出库后 current_stock <= min_stock 时，返回预警信息
