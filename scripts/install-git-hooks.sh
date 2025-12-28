#!/bin/bash
# Git Hooks 安装脚本 - Linux/macOS版本
# 自动安装所有Git钩子到.git/hooks目录

set -e

echo "========================================"
echo "Git Hooks 安装脚本 (Linux/macOS)"
echo "========================================"
echo ""

# 检查是否在项目根目录
if [ ! -d ".git" ]; then
    echo "[错误] 未找到.git目录，请在项目根目录运行此脚本"
    exit 1
fi

# 创建.git/hooks目录（如果不存在）
if [ ! -d ".git/hooks" ]; then
    echo "[创建] .git/hooks 目录..."
    mkdir -p .git/hooks
fi

# 统计变量
INSTALLED=0
UPDATED=0
SKIPPED=0

echo "[安装] 正在安装Git钩子..."
echo ""

# 安装钩子的通用函数
install_hook() {
    local hook_name=$1
    local source_file="scripts/$hook_name"
    local target_file=".git/hooks/$hook_name"

    if [ ! -f "$source_file" ]; then
        echo "[跳过] $source_file 不存在"
        SKIPPED=$((SKIPPED + 1))
        return
    fi

    # 检查目标文件是否存在
    if [ -f "$target_file" ]; then
        # 比较文件内容是否相同
        if cmp -s "$source_file" "$target_file"; then
            echo "[跳过] $hook_name 钩子已是最新版本"
            SKIPPED=$((SKIPPED + 1))
        else
            echo "[更新] $hook_name 钩子..."
            cp "$source_file" "$target_file"
            chmod +x "$target_file"
            echo "[完成] $hook_name 钩子已更新 🔄"
            UPDATED=$((UPDATED + 1))
        fi
    else
        echo "[安装] $hook_name 钩子..."
        cp "$source_file" "$target_file"
        chmod +x "$target_file"
        echo "[完成] $hook_name 钩子已安装 ✅"
        INSTALLED=$((INSTALLED + 1))
    fi
}

echo ""

# 使用通用函数安装所有钩子
install_hook "post-merge"
install_hook "pre-commit"
install_hook "commit-msg"
install_hook "pre-push"

echo ""
echo "========================================"
echo "Git Hooks 安装完成!"
echo "========================================"
echo ""
echo "📊 安装统计:"
echo "  ✅ 新安装: $INSTALLED 个"
echo "  🔄 已更新: $UPDATED 个"
echo "  ⏭️  跳过: $SKIPPED 个"
echo ""
echo "已安装的钩子:"
ls -1 .git/hooks/ 2>/dev/null | grep -v ".sample" || echo "  (无)"
echo ""
echo "功能说明:"
echo "  post-merge: 拉取代码后自动处理迁移和依赖"
echo "    - 自动检测并解决迁移序号冲突"
echo "    - 自动应用数据库迁移"
echo "    - 自动安装npm依赖（如果package.json变化）"
echo ""
echo "  commit-msg: 提交前检查commit信息格式"
echo "    - 强制使用规范格式: <type>(<scope>): <subject>"
echo "    - 支持类型: feat, fix, docs, style, refactor, test, chore, perf"
echo ""
echo "  pre-push: 推送前检查分支命名规范"
echo "    - 标准格式: feature/xxx, fix/xxx, refactor/xxx, test/xxx, docs/xxx"
echo "    - 豁免历史遗留分支"
echo "    - 可使用 --no-verify 跳过检查"
echo ""
echo "💡 提示:"
echo "  - 钩子有更新时，重新运行此脚本即可自动更新"
echo "  - 如需禁用钩子，可将 .git/hooks/ 中的文件重命名或删除"
echo ""
