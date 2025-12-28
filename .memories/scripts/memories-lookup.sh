#!/bin/bash
# 记忆文件速查脚本

MEMORIES_DIR="$(dirname "$0")/.."
MODULES_DIR="$MEMORIES_DIR/modules"

# 列出所有模块
if [ "$1" = "--list-modules" ]; then
    echo "可用模块列表："
    ls -d "$MODULES_DIR"/*/ 2>/dev/null | xargs -n1 basename
    exit 0
fi

# 检查参数
if [ -z "$1" ]; then
    echo "用法: $0 <模块目录名> [关键字...]"
    echo "      $0 --list-modules"
    exit 1
fi

MODULE="$1"
shift

# 检查模块是否存在
if [ ! -d "$MODULES_DIR/$MODULE" ]; then
    echo "错误: 模块 '$MODULE' 不存在"
    echo "使用 --list-modules 查看可用模块"
    exit 1
fi

# 搜索关键字
if [ $# -eq 0 ]; then
    echo "=== 模块: $MODULE ==="
    cat "$MODULES_DIR/$MODULE/README.md"
else
    echo "=== 在 $MODULE 中搜索: $* ==="
    grep -rn "$*" "$MODULES_DIR/$MODULE/"
fi
