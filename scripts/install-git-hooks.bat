@echo off
REM Git Hooks 安装脚本 - Windows版本
REM 自动安装所有Git钩子到.git/hooks目录

setlocal enabledelayedexpansion

echo ========================================
echo Git Hooks 安装脚本 (Windows)
echo ========================================
echo.

REM 检查是否在项目根目录
if not exist ".git" (
    echo [错误] 未找到.git目录，请在项目根目录运行此脚本
    pause
    exit /b 1
)

REM 创建.git/hooks目录（如果不存在）
if not exist ".git\hooks" (
    echo [创建] .git\hooks 目录...
    mkdir .git\hooks
)

REM 统计变量
set INSTALLED=0
set UPDATED=0
set SKIPPED=0

echo [安装] 正在安装Git钩子...
echo.

REM 安装钩子的通用函数（通过标签模拟）
goto :install_all_hooks

:install_hook
set hook_name=%~1
set source_file=scripts\%hook_name%
set target_file=.git\hooks\%hook_name%

if not exist "%source_file%" (
    echo [跳过] %source_file% 不存在
    set /a SKIPPED+=1
    goto :eof
)

if exist "%target_file%" (
    REM 比较文件内容
    fc /b "%source_file%" "%target_file%" >nul 2>&1
    if !errorlevel! equ 0 (
        echo [跳过] %hook_name% 钩子已是最新版本
        set /a SKIPPED+=1
    ) else (
        echo [更新] %hook_name% 钩子...
        copy /Y "%source_file%" "%target_file%" >nul
        echo [完成] %hook_name% 钩子已更新 🔄
        set /a UPDATED+=1
    )
) else (
    echo [安装] %hook_name% 钩子...
    copy /Y "%source_file%" "%target_file%" >nul
    echo [完成] %hook_name% 钩子已安装 ✅
    set /a INSTALLED+=1
)
goto :eof

:install_all_hooks
echo.

REM 使用通用函数安装所有钩子
call :install_hook post-merge
call :install_hook pre-commit
call :install_hook commit-msg
call :install_hook pre-push

echo.
echo ========================================
echo Git Hooks 安装完成!
echo ========================================
echo.
echo 📊 安装统计:
echo   ✅ 新安装: %INSTALLED% 个
echo   🔄 已更新: %UPDATED% 个
echo   ⏭️  跳过: %SKIPPED% 个
echo.
echo 已安装的钩子:
dir /B .git\hooks 2>nul | findstr /V ".sample"
echo.
echo 功能说明:
echo   post-merge: 拉取代码后自动处理迁移和依赖
echo   - 自动检测并解决迁移序号冲突
echo   - 自动应用数据库迁移
echo   - 自动安装npm依赖（如果package.json变化）
echo.
echo   commit-msg: 提交前检查commit信息格式
echo   - 强制使用规范格式: ^<type^>(^<scope^>): ^<subject^>
echo   - 支持类型: feat, fix, docs, style, refactor, test, chore, perf
echo.
echo   pre-push: 推送前检查分支命名规范
echo   - 标准格式: feature/xxx, fix/xxx, refactor/xxx, test/xxx, docs/xxx
echo   - 豁免历史遗留分支
echo   - 可使用 --no-verify 跳过检查
echo.
echo 💡 提示:
echo   - 钩子有更新时，重新运行此脚本即可自动更新
echo   - 如需禁用钩子，可将 .git\hooks\ 中的文件重命名或删除
echo.
pause
