@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

set "MEMORIES_DIR=%~dp0.."
set "MODULES_DIR=%MEMORIES_DIR%\modules"

if "%1"=="--list-modules" (
    echo 可用模块列表：
    for /d %%i in ("%MODULES_DIR%\*") do echo %%~ni
    exit /b 0
)

if "%1"=="" (
    echo 用法: %~nx0 ^<模块目录名^> [关键字...]
    echo       %~nx0 --list-modules
    exit /b 1
)

set "MODULE=%1"
shift

if not exist "%MODULES_DIR%\%MODULE%" (
    echo 错误: 模块 '%MODULE%' 不存在
    echo 使用 --list-modules 查看可用模块
    exit /b 1
)

if "%1"=="" (
    echo === 模块: %MODULE% ===
    type "%MODULES_DIR%\%MODULE%\README.md"
) else (
    echo === 在 %MODULE% 中搜索: %* ===
    findstr /s /n "%*" "%MODULES_DIR%\%MODULE%\*"
)
