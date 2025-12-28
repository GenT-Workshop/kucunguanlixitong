# 库存管理系统 PRD

本文档明确需求，采用 RESTful API，前后端职责清晰，供开发与测试使用。

## 1. 目标与范围
- 支撑日常物料出入库、动态库存监控、预警、查询、盘点、月结报表与打印导出。
- 提供多条件查询与统计分析，辅助营销策略与补货决策。
- 数据一致、账实相符；满足角色权限与审计要求。

## 2. 角色
- 系统管理员：用户/角色管理、参数配置、导入初始化、全局审计。
- 仓库管理员：物料维护、出入库、盘点、报表导出/打印、预警处理。
- 采购：采购入库、供应商维护、补货决策。
- 销售/生产：销售提货/生产领料出库。
- 审计/财务：月结、报表、导出、权限内查询。
- 只读访客：查看查询与报表。

## 3. 功能需求

### 3.1 系统初始化
- 物料主数据初始化：名称、编号（唯一）、规格型号、单位、类别、供应商、最大/最小库存、初始库存量、初始库存金额（单价*数量或直接填总值）、状态（启用/停用）。
- 用户与权限初始化：创建管理员密码，新增用户、角色（管理员/仓库/采购/销售/财务/只读），分配权限。
- 阈值与预警开关初始化：低/高库存阈值（min_stock/max_stock），报警策略（是否启用、邮件/站内通知可选，若不做邮件可保留字段）。
- 批量导入：支持 CSV/Excel/JSON 导入物料及现有库存（含供应商、阈值）。

### 3.2 物料出入库管理
- 入库类型：采购入库、生产入库、退货入库、其他、盘点盘盈调整（adjust_gain）。
- 出库类型：生产领料、销售提货、其他、盘点盘亏调整（adjust_loss）。
- 单据生成：自动生成单号（示例 IN-YYYYMMDD-#### / OUT-YYYYMMDD-#### / ADJ-YYYYMMDD-####），记录操作人、时间、数量、金额、备注。
- 库存校验：
  - current_stock + in_quantity > max_stock：禁止入库，提示“超上限”。
  - current_stock <= min_stock：入库允许但提示需订货（针对低库存），出库若不足则拒绝。
  - 出库不得超过可用库存；盘亏不得导致负数。
- 成功响应需返回：单据明细、更新后的库存数量、库存状态（low/normal/high）和提示文案。
- 支持撤销/删除单据的权限控制与库存回滚（仅未锁帐期间允许）。

### 3.3 动态库存监控与预警
- 库存状态判定：low（<= min_stock）、high（>= max_stock）、normal（其他）。
- 预警规则：
  - current_stock <= min_stock：提示需订货，产生低库存预警。
  - current_stock >= max_stock：标记高库存，禁止新增入库。
- 预警记录：包含物料、当前库存、阈值、级别（warning/danger 可按 50%min、90%max 细分）、状态（pending/handled/ignored）、处理人、备注、时间。
- 预警报告：列表、统计（按类型/级别/处理状态）、导出打印。

### 3.4 数据查询与打印
- 复合条件查询：支持按物料编码、名称、供应商、类别、日期范围（入库/出库时间）、单据类型、操作人、单号，分页返回。
- 查询范围：库存现存量、入库记录、出库记录、盘点记录、预警记录。
- 结果可打印与导出（CSV/Excel）；打印模板含页眉页脚、时间、操作人、筛选条件摘要。

### 3.5 盘点与清查
- 盘点任务：创建任务（任务号、状态：pending/doing/done/cancelled、备注、创建人、时间）。
- 盘点明细：账面数、实盘数、差异、差异原因、操作人、时间。
- 提交盘点后，根据差异生成盘盈/盘亏调整单据（adjust_gain/adjust_loss）并更新库存；禁止产生负库存。
- 完成任务后可导出盘点报表（明细 + 差异汇总 + 任务信息），支持打印。

### 3.6 月底结存
- 生成当月入库、出库、库存结存报表（汇总+明细），可按条件查询、导出、打印。
- 可选封账/锁账：月结后限制修改当月单据（若不封账则记录审计日志）。

### 3.7 统计分析
- 趋势：按日/周/月展示入库量、出库量、销售出库量趋势。
- 汇总：出入库金额/数量汇总，库存周转指标（可选）。
- 排行：畅销/滞销 TopN（按出库数量/金额）。
- 预警统计：低/高库存数量、处理状态分布。
- 导出与打印支持。

## 4. 非功能
- 权限控制：角色/权限点覆盖物料维护、出入库、盘点、预警处理、报表导出/打印、用户管理。
- 审计日志：关键操作（登录、配置变更、出入库、盘点、月结、删除/撤销单据）。
- 性能：常规查询分页，支持模糊查询与组合筛选；导出需限流或异步。
- 时间与时区：统一使用 ISO8601，服务端以 UTC 存储，客户端按本地展示。

## 5. 数据模型概要（核心字段）
- Material：code*, name, spec, unit, category, supplier, min_stock, max_stock, current_stock, unit_price/avg_price, stock_value, status, created_at, updated_at。
- StockIn：bill_no, material_code/name, supplier, in_type, in_quantity, in_value, in_time, operator, remark, created_at。
- StockOut：bill_no, material_code/name, out_type, out_quantity, out_value, out_time, operator, remark, created_at。
- StockWarning：material, warning_type(low/high), level(warning/danger), current_stock, min_stock, max_stock, status(pending/handled/ignored), handled_at, handled_by, remark, created_at。
- StockCountTask：task_no, status, created_by, created_at, remark。
- StockCountItem：task, material, book_qty, real_qty, diff_qty, diff_type(gain/loss/none), remark, operator, operated_at。

## 6. RESTful API 设计（草案）
前端统一以 `/api` 前缀访问；所有响应结构：`{ code, message, data }`。

### 6.1 认证与用户
- POST `/auth/login` 登录
- POST `/auth/logout` 登出
- GET `/users/` 列表，POST 创建，PUT `/users/{id}` 更新，PUT `/users/{id}/reset-password` 重置
- GET `/roles/` 角色与权限点

### 6.2 物料
- POST `/materials/init/` 批量初始化（支持导入文件或 JSON）
- GET `/materials/` 列表（支持 code/name/supplier/category/status 模糊 + 分页）
- POST `/materials/` 创建；PUT `/materials/{id}` 更新；GET `/materials/{id}` 详情

### 6.3 库存状态与预警
- GET `/stock/` 当前库存列表（含状态/阈值，支持查询条件）
- GET `/stock/{id}/` 详情
- GET `/warnings/` 预警列表（过滤 warning_type/level/status/material_code/name/supplier/date）
- POST `/warnings/{id}/handle/` 处理预警（action: handle/ignore，remark）
- GET `/warnings/statistics/` 预警统计

### 6.4 入库
- POST `/stock-in/` 创建入库单（purchase/production/return/other/adjust_gain）
- GET `/stock-in/` 列表（code/name/supplier/type/date/operator/bill_no）
- GET `/stock-in/{id}` 详情
- DELETE `/stock-in/{id}` 撤销（权限控制，锁账后禁用）

### 6.5 出库
- POST `/stock-out/` 创建出库单（production/sales/other/adjust_loss）
- GET `/stock-out/` 列表（code/name/type/date/operator/bill_no）
- GET `/stock-out/{id}` 详情
- DELETE `/stock-out/{id}` 撤销（权限控制，锁账后禁用）

### 6.6 盘点
- POST `/stock-count/tasks/` 创建盘点任务
- GET `/stock-count/tasks/` 列表；GET `/stock-count/tasks/{id}` 详情（含明细）
- POST `/stock-count/items/` 提交盘点明细（book_qty, real_qty, remark）
- POST `/stock-count/tasks/{id}/complete/` 完成并生成调整单
- POST `/stock-count/tasks/{id}/cancel/` 取消（未完成时）
- GET `/stock-count/tasks/{id}/export/` 导出盘点报表

### 6.7 月结与报表
- GET `/reports/monthly/` 按月获取入库/出库/库存结存汇总与明细
- GET `/reports/trends/` 入库/出库/销售趋势（按日/周/月）
- GET `/reports/top/` 畅销/滞销排行
- GET `/reports/export/` 导出报表（支持类型参数：monthly/stock-in/stock-out/warning）

### 6.8 导出与打印
- 所有列表类接口应支持导出（附查询条件），打印可复用导出模板或提供 PDF 视图。

## 7. 前后端分工
- 后端（Django REST）：
  - 模型、迁移、业务校验（阈值、负库存拦截、超上限拦截）、单号生成、事务与并发安全（F 表达式）、权限与审计日志。
  - 预警判定与记录、盘点任务与调整、报表与导出。
- 前端（React + Ant Design）：
  - 页面：登录/权限守卫、物料管理、入库、出库、库存查询、预警、盘点、统计报表（趋势、排行、月结）、导入/导出/打印。
  - 交互：多条件筛选、分页、表格与图表（折线/柱状）、状态标签与告警提示、导出与打印按钮。

## 8. 业务规则补充
- 库存上限：`current_stock >= max_stock` 禁止入库，提示“已达/超上限”。
- 库存下限：`current_stock <= min_stock` 提示需订货；出库若不足则拒绝。
- 盘点差异：自动生成调整单，更新库存并触发预警判断。
- 撤销/删除：需权限，锁账后禁用；撤销需回滚库存并记录审计。
- 打印：打印内容包含查询条件、生成时间、操作人。

## 9. 验收要点
- 出/入库能生成单据并正确更新库存，阈值规则生效。
- 预警能在低/高库存时生成，列表/统计正确，可处理/导出/打印。
- 查询支持组合条件，结果可导出/打印。
- 盘点可提交实盘数，自动生成盘盈/盘亏调整，库存一致。
- 月结报表可按月生成，包含入库、出库、库存结存，支持打印导出。
- 权限与审计覆盖关键操作。
