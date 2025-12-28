#!/bin/bash
# ============================================
# 库存管理系统 - PostgreSQL 数据库恢复脚本
# ============================================

# 数据库配置
DB_NAME="kucun_db"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"

# 备份目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_DIR/backups"

echo "============================================"
echo "  库存管理系统 - 数据库恢复"
echo "============================================"
echo ""

# 检查参数
if [ -z "$1" ]; then
    echo "[INFO] 可用的备份文件:"
    echo ""
    ls -lt "$BACKUP_DIR"/*.sql 2>/dev/null | head -10
    echo ""
    echo "[用法] ./restore_db.sh <备份文件名>"
    echo "[示例] ./restore_db.sh kucun_db_20251227_120000.sql"
    exit 1
fi

BACKUP_FILE="$BACKUP_DIR/$1"

# 检查文件是否存在
if [ ! -f "$BACKUP_FILE" ]; then
    echo "[ERROR] 备份文件不存在: $BACKUP_FILE"
    exit 1
fi

echo "[WARNING] 即将恢复数据库，当前数据将被覆盖!"
echo "[INFO] 备份文件: $BACKUP_FILE"
echo ""
read -p "确认恢复? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ]; then
    echo "[INFO] 已取消恢复操作"
    exit 0
fi

echo ""
echo "[INFO] 开始恢复数据库..."

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "[SUCCESS] 数据库恢复完成!"
else
    echo ""
    echo "[ERROR] 恢复失败!"
    exit 1
fi
