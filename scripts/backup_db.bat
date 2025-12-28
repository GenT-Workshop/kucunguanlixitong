@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

REM ============================================
REM 库存管理系统 - PostgreSQL 数据库备份脚本
REM ============================================

REM 数据库配置
set DB_NAME=kucun_db
set DB_USER=postgres
set DB_HOST=localhost
set DB_PORT=5432

REM PostgreSQL 安装路径
set PG_BIN=C:\Program Files\PostgreSQL\17\bin

REM 备份目录配置
set SCRIPT_DIR=%~dp0
set PROJECT_DIR=%SCRIPT_DIR%..
set BACKUP_DIR=%PROJECT_DIR%\backups
set DATE_STR=%date:~0,4%%date:~5,2%%date:~8,2%
set TIME_STR=%time:~0,2%%time:~3,2%%time:~6,2%
set TIME_STR=%TIME_STR: =0%
set BACKUP_FILE=%BACKUP_DIR%\%DB_NAME%_%DATE_STR%_%TIME_STR%.sql

REM 保留备份天数
set KEEP_DAYS=7

echo ============================================
echo   库存管理系统 - 数据库备份
echo ============================================
echo.

REM 创建备份目录
if not exist "%BACKUP_DIR%" (
    echo [INFO] 创建备份目录: %BACKUP_DIR%
    mkdir "%BACKUP_DIR%"
)

REM 执行备份
echo [INFO] 开始备份数据库: %DB_NAME%
echo [INFO] 备份文件: %BACKUP_FILE%
echo.

set PGPASSWORD=%DB_PASSWORD%
"%PG_BIN%\pg_dump" -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -F p -b -v -f "%BACKUP_FILE%" %DB_NAME%

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] 备份完成!

    REM 获取文件大小
    for %%A in ("%BACKUP_FILE%") do set SIZE=%%~zA
    set /a SIZE_KB=!SIZE!/1024
    echo [INFO] 文件大小: !SIZE_KB! KB
) else (
    echo.
    echo [ERROR] 备份失败! 错误代码: %ERRORLEVEL%
    exit /b 1
)

REM 清理旧备份
echo.
echo [INFO] 清理 %KEEP_DAYS% 天前的旧备份...
forfiles /p "%BACKUP_DIR%" /s /m *.sql /d -%KEEP_DAYS% /c "cmd /c del @path && echo [INFO] 已删除: @file" 2>nul

echo.
echo ============================================
echo   备份任务完成
echo ============================================

endlocal
