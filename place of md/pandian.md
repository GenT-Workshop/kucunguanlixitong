# 库存管理系统 - 盘点接口文档

## 一、数据模型设计

### 1.1 盘点单表 (Inventory)
| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | Integer | 主键ID | 自增 |
| inventory_no | CharField | 盘点单号 | 唯一，最大长度50 |
| inventory_date | DateField | 盘点日期 | 必填 |
| status | CharField | 盘点状态 | draft/completed/cancelled |
| operator | CharField | 盘点人 | 最大长度50 |
| remark | TextField | 备注 | 可为空 |
| created_at | DateTimeField | 创建时间 | 自动生成 |
| updated_at | DateTimeField | 更新时间 | 自动更新 |

### 1.2 盘点明细表 (InventoryDetail)
| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | Integer | 主键ID | 自增 |
| inventory | ForeignKey | 关联盘点单 | 外键 |
| stock | ForeignKey | 关联库存表 | 外键 |
| material_code | CharField | 物料编号 | 最大长度50 |
| material_name | CharField | 物料名称 | 最大长度100 |
| book_quantity | IntegerField | 账面数量 | 盘点时的库存数量 |
| actual_quantity | IntegerField | 实际数量 | 盘点后的实际数量 |
| diff_quantity | IntegerField | 差异数量 | 实际-账面 |
| book_value | DecimalField | 账面价值 | 最大10位，2位小数 |
| actual_value | DecimalField | 实际价值 | 最大10位，2位小数 |
| diff_value | DecimalField | 差异价值 | 最大10位，2位小数 |
| remark | TextField | 备注 | 可为空 |

---

## 二、接口列表

| 序号 | 接口名称 | 请求方式 | URL |
|------|----------|----------|-----|
| 1 | 创建盘点单 | POST | /api/inventory/ |
| 2 | 获取盘点单列表 | GET | /api/inventory/ |
| 3 | 获取盘点单详情 | GET | /api/inventory/{id}/ |
| 4 | 更新盘点明细 | PUT | /api/inventory/{id}/detail/ |
| 5 | 提交盘点单 | POST | /api/inventory/{id}/submit/ |
| 6 | 取消盘点单 | POST | /api/inventory/{id}/cancel/ |
| 7 | 导出盘点报表 | GET | /api/inventory/{id}/export/ |

---

## 三、接口详细说明

### 3.1 创建盘点单接口

**接口地址：** `POST /api/inventory/`

**接口描述：** 创建新的盘点单，自动生成盘点明细（包含所有库存物料）

**请求头：**
```
Content-Type: application/json
```

**请求参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| inventory_date | date | 是 | 盘点日期 |
| operator | string | 否 | 盘点人 |
| remark | string | 否 | 备注 |
| material_codes | array | 否 | 指定盘点的物料编号列表，为空则盘点全部 |

**请求示例：**
```json
{
    "inventory_date": "2025-12-14",
    "operator": "李四",
    "remark": "月度盘点",
    "material_codes": ["M001", "M002", "M003"]
}
```

**成功响应示例：**
```json
{
    "code": 200,
    "message": "盘点单创建成功",
    "data": {
        "id": 1,
        "inventory_no": "PD202512140001",
        "inventory_date": "2025-12-14",
        "status": "draft",
        "status_display": "草稿",
        "operator": "李四",
        "remark": "月度盘点",
        "detail_count": 3,
        "created_at": "2025-12-14T10:00:00Z"
    }
}
```

---

### 3.2 获取盘点单列表接口

**接口地址：** `GET /api/inventory/`

**接口描述：** 获取盘点单列表，支持分页和筛选

**请求参数（Query）：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | integer | 否 | 页码，默认1 |
| page_size | integer | 否 | 每页数量，默认10 |
| status | string | 否 | 状态筛选 |
| start_date | date | 否 | 开始日期 |
| end_date | date | 否 | 结束日期 |

**成功响应示例：**
```json
{
    "code": 200,
    "message": "success",
    "data": {
        "total": 10,
        "page": 1,
        "page_size": 10,
        "list": [
            {
                "id": 1,
                "inventory_no": "PD202512140001",
                "inventory_date": "2025-12-14",
                "status": "draft",
                "status_display": "草稿",
                "operator": "李四",
                "detail_count": 3,
                "total_diff_quantity": 0,
                "total_diff_value": "0.00"
            }
        ]
    }
}
```

---

### 3.3 获取盘点单详情接口

**接口地址：** `GET /api/inventory/{id}/`

**接口描述：** 获取盘点单详情，包含所有盘点明细

**成功响应示例：**
```json
{
    "code": 200,
    "message": "success",
    "data": {
        "id": 1,
        "inventory_no": "PD202512140001",
        "inventory_date": "2025-12-14",
        "status": "draft",
        "status_display": "草稿",
        "operator": "李四",
        "remark": "月度盘点",
        "created_at": "2025-12-14T10:00:00Z",
        "details": [
            {
                "id": 1,
                "material_code": "M001",
                "material_name": "螺丝钉",
                "book_quantity": 500,
                "actual_quantity": 500,
                "diff_quantity": 0,
                "book_value": "250.00",
                "actual_value": "250.00",
                "diff_value": "0.00",
                "remark": ""
            },
            {
                "id": 2,
                "material_code": "M002",
                "material_name": "螺母",
                "book_quantity": 300,
                "actual_quantity": 295,
                "diff_quantity": -5,
                "book_value": "150.00",
                "actual_value": "147.50",
                "diff_value": "-2.50",
                "remark": "盘亏5个"
            }
        ],
        "summary": {
            "total_items": 2,
            "total_book_quantity": 800,
            "total_actual_quantity": 795,
            "total_diff_quantity": -5,
            "total_book_value": "400.00",
            "total_actual_value": "397.50",
            "total_diff_value": "-2.50"
        }
    }
}
```

---

### 3.4 更新盘点明细接口

**接口地址：** `PUT /api/inventory/{id}/detail/`

**接口描述：** 更新盘点明细的实际数量

**请求参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| details | array | 是 | 盘点明细列表 |
| details[].id | integer | 是 | 明细ID |
| details[].actual_quantity | integer | 是 | 实际数量 |
| details[].actual_value | decimal | 否 | 实际价值（可自动计算） |
| details[].remark | string | 否 | 备注 |

**请求示例：**
```json
{
    "details": [
        {
            "id": 1,
            "actual_quantity": 500,
            "remark": ""
        },
        {
            "id": 2,
            "actual_quantity": 295,
            "remark": "盘亏5个"
        }
    ]
}
```

**成功响应示例：**
```json
{
    "code": 200,
    "message": "盘点明细更新成功",
    "data": null
}
```

---

### 3.5 提交盘点单接口

**接口地址：** `POST /api/inventory/{id}/submit/`

**接口描述：** 提交盘点单，根据盘点结果调整库存

**成功响应示例：**
```json
{
    "code": 200,
    "message": "盘点单提交成功，库存已调整",
    "data": {
        "adjusted_items": 2,
        "total_diff_quantity": -5,
        "total_diff_value": "-2.50"
    }
}
```

**失败响应示例：**
```json
{
    "code": 400,
    "message": "盘点单已提交，不能重复提交",
    "data": null
}
```

---

### 3.6 取消盘点单接口

**接口地址：** `POST /api/inventory/{id}/cancel/`

**接口描述：** 取消盘点单（仅草稿状态可取消）

**成功响应示例：**
```json
{
    "code": 200,
    "message": "盘点单已取消",
    "data": null
}
```

---

### 3.7 导出盘点报表接口

**接口地址：** `GET /api/inventory/{id}/export/`

**接口描述：** 导出盘点报表（Excel格式）

**请求参数（Query）：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| format | string | 否 | 导出格式，默认xlsx |

**成功响应：** 返回Excel文件下载

---

## 四、盘点状态说明

| 状态代码 | 状态名称 | 说明 |
|----------|----------|------|
| draft | 草稿 | 盘点单创建后的初始状态，可编辑 |
| completed | 已完成 | 盘点单提交后，库存已调整 |
| cancelled | 已取消 | 盘点单被取消 |

---

## 五、Django模型参考实现

```python
from django.db import models

class Inventory(models.Model):
    """盘点单表"""
    STATUS_CHOICES = [
        ('draft', '草稿'),
        ('completed', '已完成'),
        ('cancelled', '已取消'),
    ]

    inventory_no = models.CharField(max_length=50, unique=True, verbose_name='盘点单号')
    inventory_date = models.DateField(verbose_name='盘点日期')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', verbose_name='状态')
    operator = models.CharField(max_length=50, blank=True, verbose_name='盘点人')
    remark = models.TextField(blank=True, verbose_name='备注')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        db_table = 'inventory'
        verbose_name = '盘点单'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']


class InventoryDetail(models.Model):
    """盘点明细表"""
    inventory = models.ForeignKey(Inventory, on_delete=models.CASCADE, related_name='details', verbose_name='盘点单')
    stock = models.ForeignKey('Stock', on_delete=models.CASCADE, verbose_name='关联库存')
    material_code = models.CharField(max_length=50, verbose_name='物料编号')
    material_name = models.CharField(max_length=100, verbose_name='物料名称')
    book_quantity = models.IntegerField(verbose_name='账面数量')
    actual_quantity = models.IntegerField(default=0, verbose_name='实际数量')
    diff_quantity = models.IntegerField(default=0, verbose_name='差异数量')
    book_value = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='账面价值')
    actual_value = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='实际价值')
    diff_value = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='差异价值')
    remark = models.TextField(blank=True, verbose_name='备注')

    class Meta:
        db_table = 'inventory_detail'
        verbose_name = '盘点明细'
        verbose_name_plural = verbose_name
```

---

## 六、业务逻辑说明

1. **创建盘点单**：
   - 自动生成盘点单号（格式：PD + 日期 + 序号）
   - 根据指定物料或全部物料生成盘点明细
   - 记录当前账面数量和账面价值

2. **盘点录入**：
   - 录入实际盘点数量
   - 自动计算差异数量（实际数量 - 账面数量）
   - 自动计算差异价值

3. **提交盘点**：
   - 校验盘点单状态
   - 根据差异数量调整库存（使用F()表达式原子操作）
   - 生成盘点调整记录
   - 更新盘点单状态为已完成

4. **盘点报表**：
   - 汇总盘点结果
   - 支持导出Excel报表
