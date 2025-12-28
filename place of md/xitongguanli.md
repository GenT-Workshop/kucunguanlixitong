# 库存管理系统 - 系统安全管理接口文档

## 一、功能说明

系统安全管理模块包括用户权限管理、数据备份恢复、操作日志等功能，确保系统数据安全和操作可追溯。

---

## 二、接口列表

### 2.1 用户管理接口
| 序号 | 接口名称 | 请求方式 | URL |
|------|----------|----------|-----|
| 1 | 获取用户列表 | GET | /api/system/users/ |
| 2 | 创建用户 | POST | /api/system/users/ |
| 3 | 获取用户详情 | GET | /api/system/users/{id}/ |
| 4 | 更新用户 | PUT | /api/system/users/{id}/ |
| 5 | 删除用户 | DELETE | /api/system/users/{id}/ |
| 6 | 重置密码 | POST | /api/system/users/{id}/reset-password/ |
| 7 | 修改密码 | POST | /api/system/users/change-password/ |

### 2.2 角色权限接口
| 序号 | 接口名称 | 请求方式 | URL |
|------|----------|----------|-----|
| 1 | 获取角色列表 | GET | /api/system/roles/ |
| 2 | 创建角色 | POST | /api/system/roles/ |
| 3 | 更新角色 | PUT | /api/system/roles/{id}/ |
| 4 | 删除角色 | DELETE | /api/system/roles/{id}/ |
| 5 | 获取权限列表 | GET | /api/system/permissions/ |

### 2.3 数据备份恢复接口
| 序号 | 接口名称 | 请求方式 | URL |
|------|----------|----------|-----|
| 1 | 获取备份列表 | GET | /api/system/backups/ |
| 2 | 创建备份 | POST | /api/system/backups/ |
| 3 | 下载备份 | GET | /api/system/backups/{id}/download/ |
| 4 | 恢复备份 | POST | /api/system/backups/{id}/restore/ |
| 5 | 删除备份 | DELETE | /api/system/backups/{id}/ |

### 2.4 操作日志接口
| 序号 | 接口名称 | 请求方式 | URL |
|------|----------|----------|-----|
| 1 | 获取操作日志 | GET | /api/system/logs/ |
| 2 | 导出操作日志 | GET | /api/system/logs/export/ |

---

## 三、用户管理接口详细说明

### 3.1 获取用户列表接口

**接口地址：** `GET /api/system/users/`

**接口描述：** 获取系统用户列表

**请求参数（Query）：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | integer | 否 | 页码，默认1 |
| page_size | integer | 否 | 每页数量，默认10 |
| search | string | 否 | 搜索用户名/姓名 |
| role | integer | 否 | 角色ID筛选 |
| is_active | boolean | 否 | 是否启用 |

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
                "username": "admin",
                "real_name": "管理员",
                "email": "admin@example.com",
                "phone": "13800138000",
                "role": {
                    "id": 1,
                    "name": "超级管理员"
                },
                "is_active": true,
                "last_login": "2025-12-14T10:00:00Z",
                "created_at": "2025-01-01T00:00:00Z"
            }
        ]
    }
}
```

---

### 3.2 创建用户接口

**接口地址：** `POST /api/system/users/`

**接口描述：** 创建新用户

**请求参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |
| real_name | string | 否 | 真实姓名 |
| email | string | 否 | 邮箱 |
| phone | string | 否 | 手机号 |
| role_id | integer | 是 | 角色ID |
| is_active | boolean | 否 | 是否启用，默认true |

**请求示例：**
```json
{
    "username": "warehouse_admin",
    "password": "Password123!",
    "real_name": "仓库管理员",
    "email": "warehouse@example.com",
    "phone": "13800138001",
    "role_id": 2,
    "is_active": true
}
```

**成功响应示例：**
```json
{
    "code": 200,
    "message": "用户创建成功",
    "data": {
        "id": 2,
        "username": "warehouse_admin",
        "real_name": "仓库管理员"
    }
}
```

---

### 3.3 重置密码接口

**接口地址：** `POST /api/system/users/{id}/reset-password/`

**接口描述：** 管理员重置用户密码

**请求参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| new_password | string | 是 | 新密码 |

**成功响应示例：**
```json
{
    "code": 200,
    "message": "密码重置成功",
    "data": null
}
```

---

### 3.4 修改密码接口

**接口地址：** `POST /api/system/users/change-password/`

**接口描述：** 用户修改自己的密码

**请求参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| old_password | string | 是 | 旧密码 |
| new_password | string | 是 | 新密码 |
| confirm_password | string | 是 | 确认新密码 |

**成功响应示例：**
```json
{
    "code": 200,
    "message": "密码修改成功",
    "data": null
}
```

---

## 四、角色权限接口详细说明

### 4.1 获取角色列表接口

**接口地址：** `GET /api/system/roles/`

**成功响应示例：**
```json
{
    "code": 200,
    "message": "success",
    "data": {
        "list": [
            {
                "id": 1,
                "name": "超级管理员",
                "code": "super_admin",
                "description": "拥有所有权限",
                "user_count": 1,
                "permissions": ["*"],
                "created_at": "2025-01-01T00:00:00Z"
            },
            {
                "id": 2,
                "name": "仓库管理员",
                "code": "warehouse_admin",
                "description": "管理库存出入库",
                "user_count": 3,
                "permissions": ["stock:view", "stock:edit", "stock_in:*", "stock_out:*"],
                "created_at": "2025-01-01T00:00:00Z"
            },
            {
                "id": 3,
                "name": "普通用户",
                "code": "user",
                "description": "只能查看库存",
                "user_count": 10,
                "permissions": ["stock:view", "stock_in:view", "stock_out:view"],
                "created_at": "2025-01-01T00:00:00Z"
            }
        ]
    }
}
```

---

### 4.2 创建角色接口

**接口地址：** `POST /api/system/roles/`

**请求参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| name | string | 是 | 角色名称 |
| code | string | 是 | 角色代码 |
| description | string | 否 | 角色描述 |
| permissions | array | 是 | 权限列表 |

**请求示例：**
```json
{
    "name": "财务人员",
    "code": "finance",
    "description": "负责月度结存和报表",
    "permissions": ["stock:view", "settlement:*", "report:*"]
}
```

---

### 4.3 获取权限列表接口

**接口地址：** `GET /api/system/permissions/`

**成功响应示例：**
```json
{
    "code": 200,
    "message": "success",
    "data": {
        "list": [
            {
                "module": "stock",
                "module_name": "库存管理",
                "permissions": [
                    {"code": "stock:view", "name": "查看库存"},
                    {"code": "stock:edit", "name": "编辑库存"},
                    {"code": "stock:delete", "name": "删除库存"}
                ]
            },
            {
                "module": "stock_in",
                "module_name": "入库管理",
                "permissions": [
                    {"code": "stock_in:view", "name": "查看入库"},
                    {"code": "stock_in:create", "name": "创建入库"},
                    {"code": "stock_in:delete", "name": "删除入库"}
                ]
            },
            {
                "module": "stock_out",
                "module_name": "出库管理",
                "permissions": [
                    {"code": "stock_out:view", "name": "查看出库"},
                    {"code": "stock_out:create", "name": "创建出库"},
                    {"code": "stock_out:delete", "name": "删除出库"}
                ]
            },
            {
                "module": "inventory",
                "module_name": "盘点管理",
                "permissions": [
                    {"code": "inventory:view", "name": "查看盘点"},
                    {"code": "inventory:create", "name": "创建盘点"},
                    {"code": "inventory:submit", "name": "提交盘点"}
                ]
            },
            {
                "module": "settlement",
                "module_name": "月度结存",
                "permissions": [
                    {"code": "settlement:view", "name": "查看结存"},
                    {"code": "settlement:create", "name": "创建结存"},
                    {"code": "settlement:confirm", "name": "确认结存"}
                ]
            },
            {
                "module": "system",
                "module_name": "系统管理",
                "permissions": [
                    {"code": "system:user", "name": "用户管理"},
                    {"code": "system:role", "name": "角色管理"},
                    {"code": "system:backup", "name": "备份管理"},
                    {"code": "system:log", "name": "日志查看"}
                ]
            }
        ]
    }
}
```

---

## 五、数据备份恢复接口详细说明

### 5.1 获取备份列表接口

**接口地址：** `GET /api/system/backups/`

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
                "filename": "backup_20251214_100000.sql",
                "file_size": "15.6 MB",
                "backup_type": "manual",
                "backup_type_display": "手动备份",
                "operator": "admin",
                "remark": "月度备份",
                "created_at": "2025-12-14T10:00:00Z"
            },
            {
                "id": 2,
                "filename": "backup_20251213_000000.sql",
                "file_size": "15.2 MB",
                "backup_type": "auto",
                "backup_type_display": "自动备份",
                "operator": "system",
                "remark": "每日自动备份",
                "created_at": "2025-12-13T00:00:00Z"
            }
        ]
    }
}
```

---

### 5.2 创建备份接口

**接口地址：** `POST /api/system/backups/`

**请求参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| remark | string | 否 | 备份备注 |

**请求示例：**
```json
{
    "remark": "系统升级前备份"
}
```

**成功响应示例：**
```json
{
    "code": 200,
    "message": "备份创建成功",
    "data": {
        "id": 3,
        "filename": "backup_20251214_150000.sql",
        "file_size": "15.8 MB",
        "created_at": "2025-12-14T15:00:00Z"
    }
}
```

---

### 5.3 恢复备份接口

**接口地址：** `POST /api/system/backups/{id}/restore/`

**接口描述：** 从备份文件恢复数据（危险操作，需二次确认）

**请求参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| confirm | boolean | 是 | 确认恢复（必须为true） |
| password | string | 是 | 管理员密码验证 |

**请求示例：**
```json
{
    "confirm": true,
    "password": "admin_password"
}
```

**成功响应示例：**
```json
{
    "code": 200,
    "message": "数据恢复成功",
    "data": {
        "restored_at": "2025-12-14T15:30:00Z",
        "backup_file": "backup_20251214_100000.sql"
    }
}
```

---

## 六、操作日志接口详细说明

### 6.1 获取操作日志接口

**接口地址：** `GET /api/system/logs/`

**请求参数（Query）：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | integer | 否 | 页码 |
| page_size | integer | 否 | 每页数量 |
| username | string | 否 | 操作用户 |
| module | string | 否 | 操作模块 |
| action | string | 否 | 操作类型 |
| start_time | datetime | 否 | 开始时间 |
| end_time | datetime | 否 | 结束时间 |

**成功响应示例：**
```json
{
    "code": 200,
    "message": "success",
    "data": {
        "total": 1000,
        "page": 1,
        "page_size": 20,
        "list": [
            {
                "id": 1,
                "username": "admin",
                "real_name": "管理员",
                "module": "stock_in",
                "module_display": "入库管理",
                "action": "create",
                "action_display": "创建",
                "description": "创建入库记录，物料编号：M001，数量：100",
                "ip_address": "192.168.1.100",
                "user_agent": "Mozilla/5.0...",
                "request_data": "{\"material_code\":\"M001\",\"in_quantity\":100}",
                "response_code": 200,
                "created_at": "2025-12-14T14:30:00Z"
            }
        ]
    }
}
```

---

### 6.2 导出操作日志接口

**接口地址：** `GET /api/system/logs/export/`

**请求参数：** 同获取操作日志接口

**成功响应：** 返回Excel文件下载

---

## 七、数据模型参考实现

```python
from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    """用户表"""
    real_name = models.CharField(max_length=50, blank=True, verbose_name='真实姓名')
    phone = models.CharField(max_length=20, blank=True, verbose_name='手机号')
    role = models.ForeignKey('Role', on_delete=models.SET_NULL, null=True, verbose_name='角色')

    class Meta:
        db_table = 'sys_user'
        verbose_name = '用户'
        verbose_name_plural = verbose_name


class Role(models.Model):
    """角色表"""
    name = models.CharField(max_length=50, verbose_name='角色名称')
    code = models.CharField(max_length=50, unique=True, verbose_name='角色代码')
    description = models.TextField(blank=True, verbose_name='描述')
    permissions = models.JSONField(default=list, verbose_name='权限列表')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        db_table = 'sys_role'
        verbose_name = '角色'
        verbose_name_plural = verbose_name


class Backup(models.Model):
    """备份表"""
    BACKUP_TYPE_CHOICES = [
        ('manual', '手动备份'),
        ('auto', '自动备份'),
    ]

    filename = models.CharField(max_length=200, verbose_name='文件名')
    file_path = models.CharField(max_length=500, verbose_name='文件路径')
    file_size = models.BigIntegerField(verbose_name='文件大小(字节)')
    backup_type = models.CharField(max_length=20, choices=BACKUP_TYPE_CHOICES, verbose_name='备份类型')
    operator = models.CharField(max_length=50, verbose_name='操作人')
    remark = models.TextField(blank=True, verbose_name='备注')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        db_table = 'sys_backup'
        verbose_name = '数据备份'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']


class OperationLog(models.Model):
    """操作日志表"""
    username = models.CharField(max_length=50, verbose_name='用户名')
    real_name = models.CharField(max_length=50, blank=True, verbose_name='真实姓名')
    module = models.CharField(max_length=50, verbose_name='模块')
    action = models.CharField(max_length=50, verbose_name='操作')
    description = models.TextField(verbose_name='描述')
    ip_address = models.GenericIPAddressField(null=True, verbose_name='IP地址')
    user_agent = models.TextField(blank=True, verbose_name='User Agent')
    request_data = models.TextField(blank=True, verbose_name='请求数据')
    response_code = models.IntegerField(null=True, verbose_name='响应码')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        db_table = 'sys_operation_log'
        verbose_name = '操作日志'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']
```

---

## 八、权限代码说明

| 权限代码 | 说明 |
|----------|------|
| * | 所有权限 |
| module:* | 模块所有权限 |
| module:view | 查看权限 |
| module:create | 创建权限 |
| module:edit | 编辑权限 |
| module:delete | 删除权限 |

---

## 九、安全策略

1. **密码策略**：
   - 最小长度8位
   - 必须包含大小写字母和数字
   - 不能与用户名相同
   - 90天强制修改

2. **登录安全**：
   - 连续5次登录失败锁定账户30分钟
   - 记录登录IP和时间
   - 支持单点登录控制

3. **数据备份**：
   - 每日自动备份
   - 备份文件加密存储
   - 保留最近30天备份

4. **操作审计**：
   - 记录所有增删改操作
   - 日志保留180天
   - 支持日志导出
