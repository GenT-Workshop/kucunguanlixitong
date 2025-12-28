# 库存管理系统 - API 接口文档

## 一、接口概览

所有 API 前缀: `/api/`

### 认证模块
| 序号 | 接口名称 | 请求方式 | URL | 权限要求 |
|------|----------|----------|-----|----------|
| 1 | 用户登录 | POST | /api/login/ | 无 |
| 2 | 用户注册 | POST | /api/register/ | 无 |
| 3 | 用户登出 | POST | /api/logout/ | 无 |
| 4 | 获取/更新个人信息 | GET/PUT | /api/profile/ | 登录 |
| 5 | 修改密码 | POST | /api/change-password/ | 登录 |

### 用户管理模块（管理员）
| 序号 | 接口名称 | 请求方式 | URL | 权限要求 |
|------|----------|----------|-----|----------|
| 1 | 用户列表 | GET | /api/users/ | 管理员 |
| 2 | 创建用户 | POST | /api/users/create/ | 管理员 |
| 3 | 用户详情 | GET | /api/users/{id}/ | 管理员 |
| 4 | 更新用户 | PUT | /api/users/{id}/update/ | 管理员 |
| 5 | 删除用户 | DELETE | /api/users/{id}/delete/ | 管理员 |
| 6 | 重置密码 | POST | /api/users/{id}/reset-password/ | 管理员 |
| 7 | 角色列表 | GET | /api/roles/ | 管理员 |
| 8 | 权限列表 | GET | /api/permissions/ | 管理员 |
| 9 | 获取/设置用户角色 | GET/POST | /api/users/{id}/roles/ | 管理员 |

### 库存管理模块
| 序号 | 接口名称 | 请求方式 | URL | 权限要求 |
|------|----------|----------|-----|----------|
| 1 | 物料初始化 | POST | /api/stock/init/ | material:create |
| 2 | 库存列表 | GET | /api/stock/ | stock_query:view |
| 3 | 库存详情 | GET | /api/stock/{id}/ | stock_query:view |

### 入库管理模块
| 序号 | 接口名称 | 请求方式 | URL | 权限要求 |
|------|----------|----------|-----|----------|
| 1 | 创建入库 | POST | /api/stock-in/create/ | stock_in:create |
| 2 | 入库列表 | GET | /api/stock-in/ | stock_in:view |
| 3 | 入库详情 | GET | /api/stock-in/{id}/ | stock_in:view |
| 4 | 编辑入库 | PUT | /api/stock-in/{id}/update/ | stock_in:update |
| 5 | 删除入库 | DELETE | /api/stock-in/{id}/delete/ | stock_in:delete |

### 出库管理模块
| 序号 | 接口名称 | 请求方式 | URL | 权限要求 |
|------|----------|----------|-----|----------|
| 1 | 创建出库 | POST | /api/stock-out/create/ | stock_out:create |
| 2 | 出库列表 | GET | /api/stock-out/ | stock_out:view |
| 3 | 出库详情 | GET | /api/stock-out/{id}/ | stock_out:view |
| 4 | 编辑出库 | PUT | /api/stock-out/{id}/update/ | stock_out:update |
| 5 | 删除出库 | DELETE | /api/stock-out/{id}/delete/ | stock_out:delete |

### 库存预警模块
| 序号 | 接口名称 | 请求方式 | URL | 权限要求 |
|------|----------|----------|-----|----------|
| 1 | 预警列表 | GET | /api/warnings/ | stock_warning:view |
| 2 | 预警统计 | GET | /api/warnings/statistics/ | stock_warning:view |
| 3 | 检查预警 | POST | /api/warnings/check/ | stock_warning:check |

### 盘点管理模块
| 序号 | 接口名称 | 请求方式 | URL | 权限要求 |
|------|----------|----------|-----|----------|
| 1 | 盘点任务列表 | GET | /api/stock-count/tasks/ | stock_count:view |
| 2 | 创建盘点任务 | POST | /api/stock-count/tasks/create/ | stock_count:create |
| 3 | 盘点任务详情 | GET | /api/stock-count/tasks/{id}/ | stock_count:view |
| 4 | 提交盘点明细 | POST | /api/stock-count/items/submit/ | stock_count:submit |
| 5 | 完成盘点任务 | POST | /api/stock-count/tasks/{id}/complete/ | stock_count:complete |
| 6 | 取消盘点任务 | POST | /api/stock-count/tasks/{id}/cancel/ | stock_count:complete |

### 统计分析模块
| 序号 | 接口名称 | 请求方式 | URL | 权限要求 |
|------|----------|----------|-----|----------|
| 1 | 统计概览 | GET | /api/statistics/overview/ | statistics:view |
| 2 | 出入库趋势 | GET | /api/statistics/trend/ | statistics:view |
| 3 | 物料排名 | GET | /api/statistics/ranking/ | statistics:view |
| 4 | 分类统计 | GET | /api/statistics/category/ | statistics:view |

### 月底结存模块
| 序号 | 接口名称 | 请求方式 | URL | 权限要求 |
|------|----------|----------|-----|----------|
| 1 | 月报列表 | GET | /api/monthly-report/ | monthly_report:view |
| 2 | 月报详情 | GET | /api/monthly-report/detail/ | monthly_report:view |

---

## 二、统一响应格式

所有接口返回统一的 JSON 格式：

```json
{
    "code": 200,
    "message": "success",
    "data": { ... }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| code | integer | 状态码 |
| message | string | 响应消息 |
| data | object/array/null | 返回数据 |

### 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 401 | 未登录或登录失效 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 三、认证模块接口详情

### 3.1 用户登录

**接口地址：** `POST /api/login/`

**请求参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

**成功响应：**
```json
{
    "code": 200,
    "message": "登录成功",
    "data": {
        "id": 1,
        "username": "admin",
        "email": "admin@example.com",
        "is_staff": true,
        "is_superuser": true,
        "roles": [{"name": "boss", "display_name": "老板"}],
        "modules": ["stock_in", "stock_out", "stock_query"],
        "permissions": ["stock_in:create", "stock_in:view"]
    }
}
```

### 3.2 用户注册

**接口地址：** `POST /api/register/`

**请求参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名 |
| email | string | 是 | 邮箱 |
| password | string | 是 | 密码 |

### 3.3 用户登出

**接口地址：** `POST /api/logout/`

### 3.4 获取/更新个人信息

**接口地址：** `GET/PUT /api/profile/`

**GET 响应：**
```json
{
    "code": 200,
    "message": "success",
    "data": {
        "id": 1,
        "username": "admin",
        "email": "admin@example.com",
        "is_staff": true,
        "is_superuser": true,
        "is_active": true,
        "date_joined": "2025-01-01T00:00:00Z",
        "last_login": "2025-12-28T10:00:00Z",
        "roles": [{"name": "boss", "display_name": "老板"}],
        "modules": ["stock_in", "stock_out"],
        "permissions": ["stock_in:create"]
    }
}
```

**PUT 请求参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 否 | 新用户名 |
| email | string | 否 | 新邮箱 |

### 3.5 修改密码

**接口地址：** `POST /api/change-password/`

**请求参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| old_password | string | 是 | 旧密码 |
| new_password | string | 是 | 新密码 |

---

## 四、用户管理模块接口详情（管理员）

### 4.1 用户列表

**接口地址：** `GET /api/users/`

**请求参数（Query）：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | integer | 否 | 页码，默认1 |
| page_size | integer | 否 | 每页数量，默认10 |
| search | string | 否 | 搜索关键词（用户名/邮箱） |
| is_staff | string | 否 | 是否管理员 (true/false) |
| is_active | string | 否 | 是否激活 (true/false) |

### 4.2 创建用户

**接口地址：** `POST /api/users/create/`

**请求参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名 |
| email | string | 是 | 邮箱 |
| password | string | 是 | 密码 |
| is_staff | boolean | 否 | 是否管理员，默认false |
| is_active | boolean | 否 | 是否激活，默认true |

### 4.3 更新用户

**接口地址：** `PUT /api/users/{id}/update/`

**请求参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 否 | 用户名 |
| email | string | 否 | 邮箱 |
| is_staff | boolean | 否 | 是否管理员 |
| is_active | boolean | 否 | 是否激活 |

### 4.4 删除用户

**接口地址：** `DELETE /api/users/{id}/delete/`

### 4.5 重置密码

**接口地址：** `POST /api/users/{id}/reset-password/`

**请求参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| new_password | string | 是 | 新密码 |

### 4.6 角色列表

**接口地址：** `GET /api/roles/`

**响应示例：**
```json
{
    "code": 200,
    "message": "success",
    "data": {
        "list": [
            {"id": 1, "name": "boss", "display_name": "老板", "description": "全权限", "is_active": true},
            {"id": 2, "name": "warehouse_admin", "display_name": "仓库管理员", "description": "", "is_active": true}
        ]
    }
}
```

### 4.7 获取/设置用户角色

**接口地址：** `GET/POST /api/users/{id}/roles/`

**POST 请求参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| role_ids | array | 是 | 角色ID数组 |




  ---
  五、库存管理模块接口详情

  5.1 物料初始化

  接口地址： POST /api/stock/init/

  请求参数：
  | 参数名        | 类型    | 必填 | 说明                |
  |---------------|---------|------|---------------------|
  | material_code | string  | 是   | 物料编号            |
  | material_name | string  | 是   | 物料名称            |
  | spec          | string  | 否   | 规格                |
  | unit          | string  | 否   | 单位                |
  | category      | string  | 否   | 分类                |
  | supplier      | string  | 否   | 供应商              |
  | max_stock     | integer | 否   | 最大库存量，默认0   |
  | min_stock     | integer | 否   | 最小库存量，默认0   |
  | stock_value   | decimal | 否   | 初始库存价值，默认0 |

  5.2 库存列表

  接口地址： GET /api/stock/

  请求参数（Query）：
  | 参数名       | 类型    | 必填 | 说明                        |
  |--------------|---------|------|-----------------------------|
  | page         | integer | 否   | 页码，默认1                 |
  | page_size    | integer | 否   | 每页数量，默认10            |
  | search       | string  | 否   | 搜索关键词（物料编号/名称） |
  | supplier     | string  | 否   | 供应商筛选                  |
  | category     | string  | 否   | 分类筛选                    |
  | status       | string  | 否   | 状态筛选                    |
  | stock_status | string  | 否   | 库存状态 (low/normal/high)  |

  ---
  六、入库管理模块接口详情

  6.1 创建入库

  接口地址： POST /api/stock-in/create/

  请求参数：
  | 参数名        | 类型     | 必填 | 说明                    |
  |---------------|----------|------|-------------------------|
  | material_code | string   | 是   | 物料编号                |
  | in_quantity   | integer  | 是   | 入库数量（必须大于0）   |
  | in_value      | decimal  | 是   | 入库价值                |
  | in_type       | string   | 否   | 入库类型，默认 purchase |
  | in_time       | datetime | 否   | 入库时间，默认当前时间  |
  | operator      | string   | 否   | 操作人                  |
  | supplier      | string   | 否   | 供应商                  |
  | remark        | string   | 否   | 备注                    |

  入库类型 (in_type)：
  - purchase - 采购入库
  - production - 生产入库
  - return - 退货入库
  - other - 其他入库
  - adjust_gain - 盘盈入库

  6.2 入库列表

  接口地址： GET /api/stock-in/

  请求参数（Query）：
  | 参数名     | 类型     | 必填 | 说明                  |
  |------------|----------|------|-----------------------|
  | page       | integer  | 否   | 页码                  |
  | page_size  | integer  | 否   | 每页数量              |
  | search     | string   | 否   | 搜索（物料编号/名称） |
  | in_type    | string   | 否   | 入库类型筛选          |
  | supplier   | string   | 否   | 供应商筛选            |
  | bill_no    | string   | 否   | 单据号筛选            |
  | operator   | string   | 否   | 操作人筛选            |
  | start_time | datetime | 否   | 开始时间              |
  | end_time   | datetime | 否   | 结束时间              |

  6.3 编辑入库

  接口地址： PUT /api/stock-in/{id}/update/

  请求参数：
  | 参数名      | 类型    | 必填 | 说明     |
  |-------------|---------|------|----------|
  | in_quantity | integer | 否   | 入库数量 |
  | in_value    | decimal | 否   | 入库价值 |
  | in_type     | string  | 否   | 入库类型 |
  | operator    | string  | 否   | 操作人   |
  | supplier    | string  | 否   | 供应商   |
  | remark      | string  | 否   | 备注     |

  6.4 删除入库

  接口地址： DELETE /api/stock-in/{id}/delete/

  删除后会自动扣减库存。

  ---
  七、出库管理模块接口详情

  7.1 创建出库

  接口地址： POST /api/stock-out/create/

  请求参数：
  | 参数名        | 类型     | 必填 | 说明                  |
  |---------------|----------|------|-----------------------|
  | material_code | string   | 是   | 物料编号              |
  | out_quantity  | integer  | 是   | 出库数量（必须大于0） |
  | out_value     | decimal  | 是   | 出库价值              |
  | out_type      | string   | 是   | 出库类型              |
  | out_time      | datetime | 否   | 出库时间              |
  | operator      | string   | 否   | 操作人                |
  | remark        | string   | 否   | 备注                  |

  出库类型 (out_type)：
  - production - 生产领料
  - sales - 销售提货
  - other - 其他出库
  - adjust_loss - 盘亏出库

  7.2 出库列表

  接口地址： GET /api/stock-out/

  请求参数（Query）：
  | 参数名     | 类型     | 必填 | 说明                  |
  |------------|----------|------|-----------------------|
  | page       | integer  | 否   | 页码                  |
  | page_size  | integer  | 否   | 每页数量              |
  | search     | string   | 否   | 搜索（物料编号/名称） |
  | out_type   | string   | 否   | 出库类型筛选          |
  | bill_no    | string   | 否   | 单据号筛选            |
  | operator   | string   | 否   | 操作人筛选            |
  | start_time | datetime | 否   | 开始时间              |
  | end_time   | datetime | 否   | 结束时间              |

  7.3 编辑出库

  接口地址： PUT /api/stock-out/{id}/update/

  7.4 删除出库

  接口地址： DELETE /api/stock-out/{id}/delete/

  删除后会自动恢复库存。

  ---
  八、库存预警模块接口详情

  8.1 预警列表

  接口地址： GET /api/warnings/

  请求参数（Query）：
  | 参数名       | 类型    | 必填 | 说明                      |
  |--------------|---------|------|---------------------------|
  | page         | integer | 否   | 页码                      |
  | page_size    | integer | 否   | 每页数量                  |
  | search       | string  | 否   | 搜索                      |
  | warning_type | string  | 否   | 预警类型 (low/high)       |
  | level        | string  | 否   | 预警级别 (warning/danger) |

  8.2 预警统计

  接口地址： GET /api/warnings/statistics/

  8.3 检查预警

  接口地址： POST /api/warnings/check/

  自动检查所有库存，生成新预警并清理已恢复正常的预警。

  ---
  九、盘点管理模块接口详情

  9.1 创建盘点任务

  接口地址： POST /api/stock-count/tasks/create/

  请求参数：
  | 参数名     | 类型   | 必填 | 说明   |
  |------------|--------|------|--------|
  | created_by | string | 是   | 创建人 |
  | remark     | string | 否   | 备注   |

  9.2 盘点任务列表

  接口地址： GET /api/stock-count/tasks/

  请求参数（Query）：
  | 参数名    | 类型    | 必填 | 说明                                |
  |-----------|---------|------|-------------------------------------|
  | page      | integer | 否   | 页码                                |
  | page_size | integer | 否   | 每页数量                            |
  | status    | string  | 否   | 状态 (pending/doing/done/cancelled) |

  9.3 提交盘点明细

  接口地址： POST /api/stock-count/items/submit/

  请求参数：
  | 参数名   | 类型    | 必填 | 说明                 |
  |----------|---------|------|----------------------|
  | item_id  | integer | 是   | 盘点明细ID           |
  | real_qty | integer | 是   | 实盘数量（不能为负） |
  | operator | string  | 否   | 操作人               |
  | remark   | string  | 否   | 备注                 |

  9.4 完成盘点任务

  接口地址： POST /api/stock-count/tasks/{id}/complete/

  9.5 取消盘点任务

  接口地址： POST /api/stock-count/tasks/{id}/cancel/

  ---
  十、统计分析模块接口详情

  10.1 统计概览

  接口地址： GET /api/statistics/overview/

  10.2 出入库趋势

  接口地址： GET /api/statistics/trend/

  请求参数（Query）：
  | 参数名 | 类型    | 必填 | 说明        |
  |--------|---------|------|-------------|
  | days   | integer | 否   | 天数，默认7 |

  10.3 物料排名

  接口地址： GET /api/statistics/ranking/

  请求参数（Query）：
  | 参数名 | 类型    | 必填 | 说明                      |
  |--------|---------|------|---------------------------|
  | type   | string  | 否   | 排名类型 (in/out)，默认in |
  | limit  | integer | 否   | 数量限制，默认10          |

  10.4 分类统计

  接口地址： GET /api/statistics/category/

  ---
  十一、月底结存模块接口详情

  11.1 月报列表

  接口地址： GET /api/monthly-report/

  11.2 月报详情

  接口地址： GET /api/monthly-report/detail/

  请求参数（Query）：
  | 参数名 | 类型   | 必填 | 说明                       |
  |--------|--------|------|----------------------------|
  | month  | string | 否   | 月份 (YYYY-MM)，默认当前月 |

  ---