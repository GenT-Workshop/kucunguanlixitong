# 库存管理系统 - 月底结存接口文档

## 一、功能说明

月底结存功能用于对本月的库存情况进行汇总统计，生成月度报表，包括入库汇总、出库汇总、库存结存等信息，支持按条件查询和打印导出。

---

## 二、数据模型设计

### 2.1 月度结存表 (MonthlySettlement)
| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | Integer | 主键ID | 自增 |
| year | Integer | 年份 | 必填 |
| month | Integer | 月份 | 必填 |
| settlement_no | CharField | 结存单号 | 唯一 |
| status | CharField | 状态 | draft/completed |
| operator | CharField | 操作人 | 最大长度50 |
| remark | TextField | 备注 | 可为空 |
| created_at | DateTimeField | 创建时间 | 自动生成 |
| completed_at | DateTimeField | 完成时间 | 可为空 |

### 2.2 月度结存明细表 (MonthlySettlementDetail)
| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | Integer | 主键ID | 自增 |
| settlement | ForeignKey | 关联结存单 | 外键 |
| material_code | CharField | 物料编号 | 最大长度50 |
| material_name | CharField | 物料名称 | 最大长度100 |
| opening_quantity | IntegerField | 期初数量 | 上月结存数量 |
| opening_value | DecimalField | 期初价值 | 上月结存价值 |
| in_quantity | IntegerField | 本月入库数量 | |
| in_value | DecimalField | 本月入库价值 | |
| out_quantity | IntegerField | 本月出库数量 | |
| out_value | DecimalField | 本月出库价值 | |
| closing_quantity | IntegerField | 期末数量 | 本月结存数量 |
| closing_value | DecimalField | 期末价值 | 本月结存价值 |

---

## 三、接口列表

| 序号 | 接口名称 | 请求方式 | URL |
|------|----------|----------|-----|
| 1 | 生成月度结存 | POST | /api/settlement/generate/ |
| 2 | 获取结存列表 | GET | /api/settlement/ |
| 3 | 获取结存详情 | GET | /api/settlement/{id}/ |
| 4 | 确认结存 | POST | /api/settlement/{id}/confirm/ |
| 5 | 删除结存 | DELETE | /api/settlement/{id}/ |
| 6 | 导出结存报表 | GET | /api/settlement/{id}/export/ |
| 7 | 获取月度汇总 | GET | /api/settlement/summary/ |

---

## 四、接口详细说明

### 4.1 生成月度结存接口

**接口地址：** `POST /api/settlement/generate/`

**接口描述：** 生成指定月份的结存单

**请求参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| year | integer | 是 | 年份 |
| month | integer | 是 | 月份（1-12） |
| operator | string | 否 | 操作人 |
| remark | string | 否 | 备注 |

**请求示例：**
```json
{
    "year": 2025,
    "month": 12,
    "operator": "财务部-王五",
    "remark": "2025年12月月度结存"
}
```

**成功响应示例：**
```json
{
    "code": 200,
    "message": "月度结存生成成功",
    "data": {
        "id": 1,
        "settlement_no": "JS202512",
        "year": 2025,
        "month": 12,
        "status": "draft",
        "status_display": "草稿",
        "operator": "财务部-王五",
        "detail_count": 100,
        "summary": {
            "total_opening_quantity": 50000,
            "total_opening_value": "250000.00",
            "total_in_quantity": 10000,
            "total_in_value": "50000.00",
            "total_out_quantity": 8000,
            "total_out_value": "40000.00",
            "total_closing_quantity": 52000,
            "total_closing_value": "260000.00"
        },
        "created_at": "2025-12-31T23:00:00Z"
    }
}
```

**失败响应示例：**
```json
{
    "code": 400,
    "message": "该月份结存单已存在",
    "data": null
}
```

---

### 4.2 获取结存列表接口

**接口地址：** `GET /api/settlement/`

**接口描述：** 获取月度结存列表

**请求参数（Query）：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | integer | 否 | 页码，默认1 |
| page_size | integer | 否 | 每页数量，默认10 |
| year | integer | 否 | 年份筛选 |
| status | string | 否 | 状态筛选 |

**成功响应示例：**
```json
{
    "code": 200,
    "message": "success",
    "data": {
        "total": 12,
        "page": 1,
        "page_size": 10,
        "list": [
            {
                "id": 1,
                "settlement_no": "JS202512",
                "year": 2025,
                "month": 12,
                "status": "completed",
                "status_display": "已完成",
                "operator": "财务部-王五",
                "detail_count": 100,
                "total_closing_quantity": 52000,
                "total_closing_value": "260000.00",
                "created_at": "2025-12-31T23:00:00Z",
                "completed_at": "2025-12-31T23:30:00Z"
            }
        ]
    }
}
```

---

### 4.3 获取结存详情接口

**接口地址：** `GET /api/settlement/{id}/`

**接口描述：** 获取结存单详情，包含所有物料的结存明细

**请求参数（Query）：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | integer | 否 | 明细分页页码 |
| page_size | integer | 否 | 明细每页数量 |
| search | string | 否 | 搜索物料编号/名称 |

**成功响应示例：**
```json
{
    "code": 200,
    "message": "success",
    "data": {
        "id": 1,
        "settlement_no": "JS202512",
        "year": 2025,
        "month": 12,
        "status": "completed",
        "status_display": "已完成",
        "operator": "财务部-王五",
        "remark": "2025年12月月度结存",
        "created_at": "2025-12-31T23:00:00Z",
        "completed_at": "2025-12-31T23:30:00Z",
        "summary": {
            "total_materials": 100,
            "total_opening_quantity": 50000,
            "total_opening_value": "250000.00",
            "total_in_quantity": 10000,
            "total_in_value": "50000.00",
            "total_out_quantity": 8000,
            "total_out_value": "40000.00",
            "total_closing_quantity": 52000,
            "total_closing_value": "260000.00"
        },
        "details": {
            "total": 100,
            "page": 1,
            "page_size": 20,
            "list": [
                {
                    "id": 1,
                    "material_code": "M001",
                    "material_name": "螺丝钉",
                    "opening_quantity": 500,
                    "opening_value": "250.00",
                    "in_quantity": 100,
                    "in_value": "50.00",
                    "out_quantity": 80,
                    "out_value": "40.00",
                    "closing_quantity": 520,
                    "closing_value": "260.00"
                }
            ]
        }
    }
}
```

---

### 4.4 确认结存接口

**接口地址：** `POST /api/settlement/{id}/confirm/`

**接口描述：** 确认结存单，锁定数据不可修改

**成功响应示例：**
```json
{
    "code": 200,
    "message": "结存确认成功",
    "data": {
        "id": 1,
        "status": "completed",
        "completed_at": "2025-12-31T23:30:00Z"
    }
}
```

---

### 4.5 删除结存接口

**接口地址：** `DELETE /api/settlement/{id}/`

**接口描述：** 删除结存单（仅草稿状态可删除）

**成功响应示例：**
```json
{
    "code": 200,
    "message": "删除成功",
    "data": null
}
```

---

### 4.6 导出结存报表接口

**接口地址：** `GET /api/settlement/{id}/export/`

**接口描述：** 导出结存报表

**请求参数（Query）：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| format | string | 否 | 导出格式（xlsx/pdf），默认xlsx |
| type | string | 否 | 报表类型（detail/summary），默认detail |

**成功响应：** 返回文件下载

**报表内容：**
- 明细报表：包含每个物料的期初、入库、出库、期末数据
- 汇总报表：按类别汇总的统计数据

---

### 4.7 获取月度汇总接口

**接口地址：** `GET /api/settlement/summary/`

**接口描述：** 获取指定月份的出入库汇总（无需生成结存单）

**请求参数（Query）：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| year | integer | 是 | 年份 |
| month | integer | 是 | 月份 |

**成功响应示例：**
```json
{
    "code": 200,
    "message": "success",
    "data": {
        "year": 2025,
        "month": 12,
        "period": "2025-12-01 至 2025-12-31",
        "in_summary": {
            "total_records": 150,
            "total_quantity": 10000,
            "total_value": "50000.00",
            "by_day": [
                {"date": "2025-12-01", "quantity": 300, "value": "1500.00"},
                {"date": "2025-12-02", "quantity": 350, "value": "1750.00"}
            ]
        },
        "out_summary": {
            "total_records": 120,
            "total_quantity": 8000,
            "total_value": "40000.00",
            "by_type": {
                "production": {"quantity": 5000, "value": "25000.00"},
                "sales": {"quantity": 3000, "value": "15000.00"}
            },
            "by_day": [
                {"date": "2025-12-01", "quantity": 250, "value": "1250.00"},
                {"date": "2025-12-02", "quantity": 280, "value": "1400.00"}
            ]
        },
        "stock_summary": {
            "opening_quantity": 50000,
            "opening_value": "250000.00",
            "closing_quantity": 52000,
            "closing_value": "260000.00",
            "net_change_quantity": 2000,
            "net_change_value": "10000.00"
        }
    }
}
```

---

## 五、结存状态说明

| 状态代码 | 状态名称 | 说明 |
|----------|----------|------|
| draft | 草稿 | 结存单创建后的初始状态，可删除 |
| completed | 已完成 | 结存单确认后，数据锁定 |

---

## 六、Django模型参考实现

```python
from django.db import models

class MonthlySettlement(models.Model):
    """月度结存表"""
    STATUS_CHOICES = [
        ('draft', '草稿'),
        ('completed', '已完成'),
    ]

    year = models.IntegerField(verbose_name='年份')
    month = models.IntegerField(verbose_name='月份')
    settlement_no = models.CharField(max_length=50, unique=True, verbose_name='结存单号')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', verbose_name='状态')
    operator = models.CharField(max_length=50, blank=True, verbose_name='操作人')
    remark = models.TextField(blank=True, verbose_name='备注')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='完成时间')

    class Meta:
        db_table = 'monthly_settlement'
        verbose_name = '月度结存'
        verbose_name_plural = verbose_name
        unique_together = ['year', 'month']
        ordering = ['-year', '-month']


class MonthlySettlementDetail(models.Model):
    """月度结存明细表"""
    settlement = models.ForeignKey(MonthlySettlement, on_delete=models.CASCADE, related_name='details', verbose_name='结存单')
    material_code = models.CharField(max_length=50, verbose_name='物料编号')
    material_name = models.CharField(max_length=100, verbose_name='物料名称')
    opening_quantity = models.IntegerField(default=0, verbose_name='期初数量')
    opening_value = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='期初价值')
    in_quantity = models.IntegerField(default=0, verbose_name='入库数量')
    in_value = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='入库价值')
    out_quantity = models.IntegerField(default=0, verbose_name='出库数量')
    out_value = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='出库价值')
    closing_quantity = models.IntegerField(default=0, verbose_name='期末数量')
    closing_value = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='期末价值')

    class Meta:
        db_table = 'monthly_settlement_detail'
        verbose_name = '月度结存明细'
        verbose_name_plural = verbose_name
```

---

## 七、业务逻辑说明

1. **生成结存单**：
   - 检查该月份是否已存在结存单
   - 获取上月结存数据作为本月期初
   - 统计本月所有入库记录
   - 统计本月所有出库记录
   - 计算期末数量 = 期初 + 入库 - 出库
   - 生成结存明细

2. **期初数据来源**：
   - 如果存在上月结存单，使用上月期末数据
   - 如果不存在上月结存单，使用当前库存数据

3. **结存确认**：
   - 确认后数据锁定，不可修改
   - 作为下月结存的期初数据依据

4. **报表打印**：
   - 支持明细报表和汇总报表
   - 支持Excel和PDF格式导出
