# 库存管理系统 - 预警报告接口文档

## 一、功能说明

库存预警功能用于监控库存状态，当库存量低于最小库存量或高于最大库存量时，系统自动生成预警信息，提醒管理人员及时处理。

---

## 二、接口列表

| 序号 | 接口名称 | 请求方式 | URL |
|------|----------|----------|-----|
| 1 | 获取预警列表 | GET | /api/warning/list/ |
| 2 | 获取预警统计 | GET | /api/warning/statistics/ |
| 3 | 处理预警 | POST | /api/warning/{id}/handle/ |
| 4 | 批量处理预警 | POST | /api/warning/batch-handle/ |
| 5 | 预警设置 | GET/PUT | /api/warning/settings/ |
| 6 | 导出预警报告 | GET | /api/warning/export/ |

---

## 三、接口详细说明

### 3.1 获取预警列表接口

**接口地址：** `GET /api/warning/list/`

**接口描述：** 获取当前所有库存预警信息

**请求参数（Query）：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | integer | 否 | 页码，默认1 |
| page_size | integer | 否 | 每页数量，默认10 |
| warning_type | string | 否 | 预警类型（low/high/all） |
| status | string | 否 | 处理状态（pending/handled/ignored） |
| material_code | string | 否 | 物料编号 |
| level | string | 否 | 预警级别（warning/danger） |

**请求示例：**
```
GET /api/warning/list/?warning_type=low&status=pending
```

**成功响应示例：**
```json
{
    "code": 200,
    "message": "success",
    "data": {
        "total": 15,
        "page": 1,
        "page_size": 10,
        "list": [
            {
                "id": 1,
                "material_code": "M001",
                "material_name": "螺丝钉",
                "warning_type": "low",
                "warning_type_display": "库存不足",
                "level": "danger",
                "level_display": "紧急",
                "current_stock": 50,
                "min_stock": 100,
                "max_stock": 10000,
                "shortage_quantity": 50,
                "status": "pending",
                "status_display": "待处理",
                "suggestion": "建议立即采购补货，缺口数量：50",
                "created_at": "2025-12-14T10:00:00Z"
            },
            {
                "id": 2,
                "material_code": "M002",
                "material_name": "螺母",
                "warning_type": "low",
                "warning_type_display": "库存不足",
                "level": "warning",
                "level_display": "警告",
                "current_stock": 95,
                "min_stock": 100,
                "max_stock": 5000,
                "shortage_quantity": 5,
                "status": "pending",
                "status_display": "待处理",
                "suggestion": "库存接近下限，建议安排采购",
                "created_at": "2025-12-14T10:00:00Z"
            }
        ]
    }
}
```

---

### 3.2 获取预警统计接口

**接口地址：** `GET /api/warning/statistics/`

**接口描述：** 获取预警统计数据

**成功响应示例：**
```json
{
    "code": 200,
    "message": "success",
    "data": {
        "summary": {
            "total_warnings": 20,
            "pending_count": 15,
            "handled_count": 3,
            "ignored_count": 2
        },
        "by_type": {
            "low_stock": {
                "total": 12,
                "danger": 5,
                "warning": 7
            },
            "high_stock": {
                "total": 8,
                "danger": 2,
                "warning": 6
            }
        },
        "trend": [
            {"date": "2025-12-08", "low": 3, "high": 1},
            {"date": "2025-12-09", "low": 2, "high": 2},
            {"date": "2025-12-10", "low": 4, "high": 1},
            {"date": "2025-12-11", "low": 1, "high": 2},
            {"date": "2025-12-12", "low": 2, "high": 1},
            {"date": "2025-12-13", "low": 3, "high": 0},
            {"date": "2025-12-14", "low": 5, "high": 2}
        ]
    }
}
```

---

### 3.3 处理预警接口

**接口地址：** `POST /api/warning/{id}/handle/`

**接口描述：** 处理单条预警记录

**请求参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| action | string | 是 | 处理动作（handle/ignore） |
| remark | string | 否 | 处理备注 |

**请求示例：**
```json
{
    "action": "handle",
    "remark": "已安排采购，预计3天到货"
}
```

**成功响应示例：**
```json
{
    "code": 200,
    "message": "预警处理成功",
    "data": {
        "id": 1,
        "status": "handled",
        "handled_at": "2025-12-14T15:00:00Z",
        "handled_by": "admin",
        "remark": "已安排采购，预计3天到货"
    }
}
```

---

### 3.4 批量处理预警接口

**接口地址：** `POST /api/warning/batch-handle/`

**接口描述：** 批量处理多条预警记录

**请求参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| ids | array | 是 | 预警ID列表 |
| action | string | 是 | 处理动作（handle/ignore） |
| remark | string | 否 | 处理备注 |

**请求示例：**
```json
{
    "ids": [1, 2, 3],
    "action": "handle",
    "remark": "批量处理"
}
```

**成功响应示例：**
```json
{
    "code": 200,
    "message": "批量处理成功",
    "data": {
        "success_count": 3,
        "fail_count": 0
    }
}
```

---

### 3.5 预警设置接口

**接口地址：** `GET/PUT /api/warning/settings/`

**接口描述：** 获取或更新预警设置

#### GET 获取设置

**成功响应示例：**
```json
{
    "code": 200,
    "message": "success",
    "data": {
        "enable_low_stock_warning": true,
        "enable_high_stock_warning": true,
        "low_stock_danger_threshold": 0.5,
        "low_stock_warning_threshold": 0.8,
        "high_stock_danger_threshold": 1.0,
        "high_stock_warning_threshold": 0.9,
        "enable_email_notification": false,
        "notification_emails": [],
        "check_interval_minutes": 30
    }
}
```

#### PUT 更新设置

**请求参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| enable_low_stock_warning | boolean | 否 | 启用库存不足预警 |
| enable_high_stock_warning | boolean | 否 | 启用库存过高预警 |
| low_stock_danger_threshold | decimal | 否 | 库存不足紧急阈值（相对于最小库存的比例） |
| low_stock_warning_threshold | decimal | 否 | 库存不足警告阈值 |
| high_stock_danger_threshold | decimal | 否 | 库存过高紧急阈值（相对于最大库存的比例） |
| high_stock_warning_threshold | decimal | 否 | 库存过高警告阈值 |
| enable_email_notification | boolean | 否 | 启用邮件通知 |
| notification_emails | array | 否 | 通知邮箱列表 |

**请求示例：**
```json
{
    "enable_low_stock_warning": true,
    "enable_high_stock_warning": true,
    "low_stock_danger_threshold": 0.5,
    "enable_email_notification": true,
    "notification_emails": ["admin@example.com", "manager@example.com"]
}
```

---

### 3.6 导出预警报告接口

**接口地址：** `GET /api/warning/export/`

**接口描述：** 导出预警报告（Excel格式）

**请求参数（Query）：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| warning_type | string | 否 | 预警类型 |
| status | string | 否 | 处理状态 |
| start_date | date | 否 | 开始日期 |
| end_date | date | 否 | 结束日期 |

**成功响应：** 返回Excel文件下载

---

## 四、预警类型说明

| 类型代码 | 类型名称 | 触发条件 |
|----------|----------|----------|
| low | 库存不足 | 当前库存 <= 最小库存量 |
| high | 库存过高 | 当前库存 >= 最大库存量 |

---

## 五、预警级别说明

| 级别代码 | 级别名称 | 说明 |
|----------|----------|------|
| danger | 紧急 | 库存严重不足或严重超标，需立即处理 |
| warning | 警告 | 库存接近临界值，需关注 |

**级别判定规则：**
- 库存不足紧急：current_stock <= min_stock * 0.5
- 库存不足警告：min_stock * 0.5 < current_stock <= min_stock
- 库存过高紧急：current_stock >= max_stock
- 库存过高警告：max_stock * 0.9 <= current_stock < max_stock

---

## 六、处理状态说明

| 状态代码 | 状态名称 | 说明 |
|----------|----------|------|
| pending | 待处理 | 预警未处理 |
| handled | 已处理 | 预警已处理 |
| ignored | 已忽略 | 预警被忽略 |

---

## 七、Django模型参考实现

```python
from django.db import models

class StockWarning(models.Model):
    """库存预警表"""
    WARNING_TYPE_CHOICES = [
        ('low', '库存不足'),
        ('high', '库存过高'),
    ]
    LEVEL_CHOICES = [
        ('warning', '警告'),
        ('danger', '紧急'),
    ]
    STATUS_CHOICES = [
        ('pending', '待处理'),
        ('handled', '已处理'),
        ('ignored', '已忽略'),
    ]

    stock = models.ForeignKey('Stock', on_delete=models.CASCADE, verbose_name='关联库存')
    material_code = models.CharField(max_length=50, verbose_name='物料编号')
    material_name = models.CharField(max_length=100, verbose_name='物料名称')
    warning_type = models.CharField(max_length=20, choices=WARNING_TYPE_CHOICES, verbose_name='预警类型')
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, verbose_name='预警级别')
    current_stock = models.IntegerField(verbose_name='当前库存')
    min_stock = models.IntegerField(verbose_name='最小库存')
    max_stock = models.IntegerField(verbose_name='最大库存')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='状态')
    handled_at = models.DateTimeField(null=True, blank=True, verbose_name='处理时间')
    handled_by = models.CharField(max_length=50, blank=True, verbose_name='处理人')
    remark = models.TextField(blank=True, verbose_name='备注')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        db_table = 'stock_warning'
        verbose_name = '库存预警'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']


class WarningSettings(models.Model):
    """预警设置表"""
    enable_low_stock_warning = models.BooleanField(default=True, verbose_name='启用库存不足预警')
    enable_high_stock_warning = models.BooleanField(default=True, verbose_name='启用库存过高预警')
    low_stock_danger_threshold = models.DecimalField(max_digits=3, decimal_places=2, default=0.5, verbose_name='库存不足紧急阈值')
    low_stock_warning_threshold = models.DecimalField(max_digits=3, decimal_places=2, default=0.8, verbose_name='库存不足警告阈值')
    high_stock_danger_threshold = models.DecimalField(max_digits=3, decimal_places=2, default=1.0, verbose_name='库存过高紧急阈值')
    high_stock_warning_threshold = models.DecimalField(max_digits=3, decimal_places=2, default=0.9, verbose_name='库存过高警告阈值')
    enable_email_notification = models.BooleanField(default=False, verbose_name='启用邮件通知')
    notification_emails = models.JSONField(default=list, verbose_name='通知邮箱')
    check_interval_minutes = models.IntegerField(default=30, verbose_name='检查间隔(分钟)')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        db_table = 'warning_settings'
        verbose_name = '预警设置'
        verbose_name_plural = verbose_name
```

---

## 八、业务逻辑说明

1. **预警生成**：
   - 系统定时检查所有库存物料
   - 根据预警设置判断是否触发预警
   - 避免重复生成相同的预警记录

2. **预警处理**：
   - 处理后更新预警状态
   - 记录处理人和处理时间
   - 支持批量处理

3. **入库时预警检查**：
   - 入库前检查是否会超过最大库存量
   - 超过最大库存量时拒绝入库并返回预警信息

4. **出库时预警检查**：
   - 出库后检查是否低于最小库存量
   - 低于最小库存量时生成预警记录
