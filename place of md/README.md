# 库存管理系统 - 数据库备份与恢复

## 概述

本目录包含 PostgreSQL 数据库的备份与恢复脚本。

## 数据库配置

| 参数 | 值 |
|------|------|
| 数据库名 | kucun_db |
| 用户名 | kucun_user |
| 密码 | kucun123 |
| 主机 | localhost |
| 端口 | 5432 |

## 脚本文件

| 文件 | 说明 |
|------|------|
| `scripts/backup_db.bat` | Windows 备份脚本 |
| `scripts/backup_db.sh` | Linux/Mac 备份脚本 |
| `scripts/restore_db.bat` | Windows 恢复脚本 |
| `scripts/restore_db.sh` | Linux/Mac 恢复脚本 |

## 快速备份

### Windows

```cmd
set PGPASSWORD=kucun123
"C:\Program Files\PostgreSQL\17\bin\pg_dump" -h localhost -p 5432 -U kucun_user -F p -f backups\backup.sql kucun_db
```

### Linux/Mac

```bash
export PGPASSWORD='kucun123'
pg_dump -h localhost -p 5432 -U kucun_user -F p -f backups/backup.sql kucun_db
```

## 快速恢复

### Windows

```cmd
set PGPASSWORD=kucun123
"C:\Program Files\PostgreSQL\17\bin\psql" -h localhost -p 5432 -U kucun_user -d kucun_db -f backups\backup.sql
```

### Linux/Mac

```bash
export PGPASSWORD='kucun123'
psql -h localhost -p 5432 -U kucun_user -d kucun_db -f backups/backup.sql
```

## 备份文件

- 位置：`backups/` 目录
- 命名格式：`kucun_db_YYYYMMDD_HHMMSS.sql`
- 自动清理：7 天前的备份会被自动删除

## 定时备份

### Windows 任务计划程序

1. 打开「任务计划程序」
2. 创建基本任务
3. 设置触发器（如每天凌晨 2:00）
4. 程序路径：`scripts\backup_db.bat` 的完整路径

### Linux Crontab

```bash
# 每天凌晨 2:00 执行备份
0 2 * * * /path/to/scripts/backup_db.sh >> /var/log/db_backup.log 2>&1
```

## 注意事项

1. 确保 PostgreSQL 的 bin 目录在系统 PATH 中
2. 恢复数据前建议先备份当前数据
3. 定期检查备份目录的磁盘空间

---

*更新时间：2025-12-27*
