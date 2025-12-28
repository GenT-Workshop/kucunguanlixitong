@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

REM ============================================
REM 库存管理系统 - PostgreSQL 数据库恢复脚本
REM ============================================

REM 数据库配置
set DB_NAME=kucun_db
set DB_USER=postgres
set DB_HOST=localhost
set DB_PORT=5432

REM 备份目录
set SCRIPT_DIR=%~dp0
set PROJECT_DIR=%SCRIPT_DIR%..
set BACKUP_DIR=%PROJECT_DIR%\backups

echo ============================================
echo   库存管理系统 - 数据库恢复
echo ============================================
echo.

REM 检查参数
if "%~1"=="" (
    echo [INFO] 可用的备份文件:
    echo.
    dir /b /o-d "%BACKUP_DIR%\*.sql" 2>nul
    echo.
    echo [用法] restore_db.bat ^<备份文件名^>
    echo [示例] restore_db.bat kucun_db_20251227_120000.sql
    exit /b 1
)

set BACKUP_FILE=%BACKUP_DIR%\%~1

REM 检查文件是否存在
if not exist "%BACKUP_FILE%" (
    echo [ERROR] 备份文件不存在: %BACKUP_FILE%
    exit /b 1
)

echo [WARNING] 即将恢复数据库，当前数据将被覆盖!
echo [INFO] 备份文件: %BACKUP_FILE%
echo.
set /p CONFIRM=确认恢复? (y/n):

if /i not "%CONFIRM%"=="y" (
    echo [INFO] 已取消恢复操作
    exit /b 0
)

echo.
echo [INFO] 开始恢复数据库...

set PGPASSWORD=%DB_PASSWORD%
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "%BACKUP_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] 数据库恢复完成!
) else (
    echo.
    echo [ERROR] 恢复失败! 错误代码: %ERRORLEVEL%
    exit /b 1
)

endlocal
