#!/bin/bash
# ============================================
# 库存管理系统 - PostgreSQL 数据库备份脚本
# ============================================

# 数据库配置
DB_NAME="kucun_db"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"

# 备份目录配置
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_DIR/backups"
DATE_STR=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${DATE_STR}.sql"

# 保留备份天数
KEEP_DAYS=7

echo "============================================"
echo "  库存管理系统 - 数据库备份"
echo "============================================"
echo ""

# 创建备份目录
if [ ! -d "$BACKUP_DIR" ]; then
    echo "[INFO] 创建备份目录: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
fi

# 执行备份
echo "[INFO] 开始备份数据库: $DB_NAME"
echo "[INFO] 备份文件: $BACKUP_FILE"
echo ""

pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" \
    -F p -b -v -f "$BACKUP_FILE" "$DB_NAME"

if [ $? -eq 0 ]; then
    echo ""
    echo "[SUCCESS] 备份完成!"
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "[INFO] 文件大小: $SIZE"
else
    echo ""
    echo "[ERROR] 备份失败!"
    exit 1
fi

# 清理旧备份
echo ""
echo "[INFO] 清理 ${KEEP_DAYS} 天前的旧备份..."
find "$BACKUP_DIR" -name "*.sql" -mtime +$KEEP_DAYS -delete -print

echo ""
echo "============================================"
echo "  备份任务完成"
echo "============================================"
