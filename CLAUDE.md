# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此仓库中工作时提供指导。

## 项目概述

这是一个全栈库存管理系统，前后端分离架构。

## 项目架构

```
├── backend/           # Django REST API (Python 3.12)
│   └── CLAUDE.md      # 后端详细文档
├── frontend/          # React + TypeScript + Vite
├── scripts/           # Git hooks 和数据库备份工具
└── backups/           # 数据库备份存储
```

**后端**: Django 4.2+ + Django REST Framework, PostgreSQL/SQLite
**前端**: React 19, TypeScript, Vite, Ant Design 6

## 开发命令

### 后端（在 `backend/` 目录下）
```bash
python manage.py runserver              # 启动开发服务器 (端口 8000)
python manage.py makemigrations         # 创建迁移文件
python manage.py migrate                # 执行迁移
python manage.py init_permissions       # 初始化角色和权限
python init_data.py                     # 加载测试数据
```

### 前端（在 `frontend/` 目录下）
```bash
npm run dev      # 启动开发服务器 (端口 5173)
npm run build    # 生产构建 (执行 tsc -b && vite build)
npm run lint     # 运行 ESLint
npm run preview  # 预览生产构建
```

## 开发环境配置

1. 后端运行在 `http://127.0.0.1:8000`
2. 前端运行在 `http://localhost:5173`
3. 前端自动代理 `/api/*` 请求到后端（配置在 `vite.config.ts`）

## Git 工作流

- **主分支**: `main`
- **PR 目标分支**: `andemo`
- **分支命名规范**（由 pre-push hook 强制执行）：
  - `feature/xxx` - 新功能
  - `fix/xxx` - Bug 修复
  - `refactor/xxx` - 重构
  - `hotfix/xxx` - 紧急修复
  - `test/xxx`, `docs/xxx`, `release/xxx` - 其他标准前缀

安装 git hooks: `scripts/install-git-hooks.sh` (Linux/Mac) 或 `scripts/install-git-hooks.bat` (Windows)

## 数据库

- **生产环境**: PostgreSQL (`kucun_db`, 用户: `kucun_user`)
- **开发环境**: SQLite3 (`backend/db.sqlite3`)
- **备份脚本**: `scripts/backup_db.sh` / `scripts/restore_db.sh`

## 后端详细文档

详细信息请查看 `backend/CLAUDE.md`：
- API 路由和接口
- 数据模型 (Stock, StockIn, StockOut, StockWarning, StockCountTask)
- 权限系统和基于角色的访问控制
- 权限装饰器 (`@require_permission`, `@require_module`)
- 入库/出库类型
