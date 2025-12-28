# Git Hooks 说明文档

## 概述

本项目配置了 Git 钩子（Git Hooks）来自动化开发流程，提高团队协作效率和代码质量。

## 已安装的钩子

### 1. post-merge（合并后钩子）

**触发时机**：执行 `git pull` 或 `git merge` 后自动触发

**主要功能**：

| 功能 | 说明 |
|------|------|
| 迁移冲突检测 | 自动检测数据库迁移文件是否存在序号冲突 |
| 迁移冲突解决 | 自动执行 `makemigrations --merge` 合并冲突 |
| 数据库迁移 | 自动执行 `migrate` 应用新的迁移 |
| 依赖安装 | 检测 `package.json` 变化后自动执行 `npm install` |

**工作流程**：

```
git pull
    ↓
检测迁移文件是否变化
    ↓
[是] → 检测迁移冲突 → [有冲突] → 自动合并迁移
    ↓
应用数据库迁移
    ↓
检测 package.json 是否变化
    ↓
[是] → 自动安装 npm 依赖
    ↓
完成
```

---

## Django 数据库迁移流程详解

### 什么是数据库迁移？

Django 的迁移系统用于将模型（Model）的变更同步到数据库结构中。

**核心文件**：
- `models.py` - 定义数据模型（Python 类）
- `migrations/*.py` - 迁移文件（记录模型变更历史）
- 数据库表 `django_migrations` - 记录已执行的迁移

### 迁移的完整流程

```
┌─────────────────────────────────────────────────────────────┐
│                    开发者修改 models.py                      │
│                 （添加字段、修改字段、删除模型等）              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              python manage.py makemigrations                │
│                                                             │
│  作用：检测 models.py 的变更，生成迁移文件                    │
│  结果：创建 migrations/0002_xxx.py（记录变更操作）            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                python manage.py migrate                     │
│                                                             │
│  作用：执行迁移文件，修改数据库表结构                          │
│  结果：数据库表结构与 models.py 保持一致                      │
└─────────────────────────────────────────────────────────────┘
```

### 迁移文件的依赖关系

每个迁移文件都有 `dependencies` 属性，指向它的父迁移：

```python
# migrations/0003_add_supplier.py
class Migration(migrations.Migration):
    dependencies = [
        ('stock', '0002_add_category'),  # 依赖 0002
    ]
    operations = [
        migrations.AddField(
            model_name='stock',
            name='supplier',
            field=models.CharField(max_length=100),
        ),
    ]
```

### 迁移序号冲突是如何产生的？

**场景**：开发者 A 和 B 同时基于 `0002` 创建新迁移

```
                    0002_add_category.py
                           │
           ┌───────────────┴───────────────┐
           │                               │
           ▼                               ▼
  0003_add_supplier.py            0003_add_status.py
     （开发者 A）                     （开发者 B）
```

**问题**：两个 `0003` 都依赖 `0002`，Django 不知道先执行哪个

**合并后的状态**：

```bash
$ python manage.py showmigrations stock
stock
 [X] 0001_initial
 [X] 0002_add_category
 [ ] 0003_add_supplier    # 未执行
 [ ] 0003_add_status      # 未执行，序号冲突！
```

### post-merge 钩子如何解决冲突？

**第一步：检测冲突**

```bash
python manage.py showmigrations --plan
# 如果出现分叉，说明有冲突
```

**第二步：自动合并**

```bash
python manage.py makemigrations --merge --noinput
```

生成合并迁移文件：

```python
# migrations/0004_merge_20251227.py
class Migration(migrations.Migration):
    dependencies = [
        ('stock', '0003_add_supplier'),
        ('stock', '0003_add_status'),
    ]
    operations = []  # 空操作，仅用于合并依赖
```

**合并后的依赖关系**：

```
                    0002_add_category.py
                           │
           ┌───────────────┴───────────────┐
           │                               │
           ▼                               ▼
  0003_add_supplier.py            0003_add_status.py
           │                               │
           └───────────────┬───────────────┘
                           │
                           ▼
                 0004_merge_20251227.py
```

**第三步：应用迁移**

```bash
python manage.py migrate
```

### 钩子的完整工作流程

```
git pull（拉取远程代码）
        │
        ▼
┌───────────────────────────────────┐
│  post-merge 钩子自动触发           │
└───────────────────────────────────┘
        │
        ▼
检测 migrations/ 目录是否有变化？
        │
        ├── 否 → 跳过迁移处理
        │
        └── 是 ↓
                │
                ▼
        检测是否存在迁移序号冲突？
                │
                ├── 否 → 直接执行 migrate
                │
                └── 是 ↓
                        │
                        ▼
                执行 makemigrations --merge
                （自动生成合并迁移文件）
                        │
                        ▼
                执行 migrate
                （应用所有未执行的迁移）
                        │
                        ▼
                    完成 ✅
```

### 为什么需要这个钩子？

| 没有钩子 | 有钩子 |
|----------|--------|
| 手动检查迁移状态 | 自动检测 |
| 手动解决冲突 | 自动合并 |
| 容易忘记执行 migrate | 自动执行 |
| 数据库与代码不同步 | 始终保持同步 |

---

### 2. pre-push（推送前钩子）

**触发时机**：执行 `git push` 前自动触发

**主要功能**：检查分支命名是否符合团队规范

**允许的分支命名格式**：

| 类型 | 格式 | 用途 |
|------|------|------|
| feature | `feature/xxx` | 新功能开发 |
| fix | `fix/xxx` | Bug 修复 |
| refactor | `refactor/xxx` | 代码重构 |
| test | `test/xxx` | 测试相关 |
| docs | `docs/xxx` | 文档更新 |
| hotfix | `hotfix/xxx` | 紧急修复 |
| release | `release/xxx` | 发布版本 |

**保护分支**：

- `main` - 主分支
- `develop` - 开发分支
- `production` - 生产环境分支

**示例**：

```bash
# 正确的分支命名
feature/user-authentication
fix/login-bug
refactor/api-optimization
docs/readme-update

# 错误的分支命名（会被拒绝）
my-branch
test123
新功能分支
```

**跳过检查**（不推荐）：

```bash
git push --no-verify
```

---

## 安装方法

### Windows

```batch
cd 项目根目录
scripts\install-git-hooks.bat
```

### Linux/Mac

```bash
cd 项目根目录
chmod +x scripts/install-git-hooks.sh
./scripts/install-git-hooks.sh
```

---

## 常见问题

### Q: 如何禁用某个钩子？

删除或重命名 `.git/hooks/` 目录下对应的钩子文件：

```bash
# 禁用 pre-push 钩子
mv .git/hooks/pre-push .git/hooks/pre-push.disabled
```

### Q: 如何更新钩子？

重新运行安装脚本即可自动更新：

```bash
scripts/install-git-hooks.bat  # Windows
./scripts/install-git-hooks.sh # Linux/Mac
```

### Q: 分支命名不符合规范怎么办？

重命名分支后再推送：

```bash
git branch -m 旧分支名 feature/新分支名
git push -u origin feature/新分支名
```

### Q: 迁移冲突无法自动解决怎么办？

手动解决迁移冲突：

```bash
python manage.py makemigrations --merge
python manage.py migrate
```

---

## 钩子文件位置

| 文件 | 位置 |
|------|------|
| 源文件 | `scripts/post-merge`, `scripts/pre-push` |
| 安装位置 | `.git/hooks/post-merge`, `.git/hooks/pre-push` |

---

## 注意事项

1. 钩子脚本需要有执行权限（Linux/Mac）
2. 首次克隆项目后需要手动运行安装脚本
3. 钩子不会随 Git 仓库一起克隆，需要每个开发者单独安装
4. 历史遗留分支已加入豁免列表，不受命名规范限制
