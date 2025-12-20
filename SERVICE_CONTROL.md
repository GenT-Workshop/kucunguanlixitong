# 服务启动与关闭指南

本文档说明如何启动和关闭前后端开发服务器。

---

## 目录

- [快速启动](#快速启动)
- [快速关闭](#快速关闭)
- [详细说明](#详细说明)

---

## 快速启动

### 启动后端服务

```bash
# 进入后端目录
cd backend/kucunguanli/kucunguanlixitong

# 激活虚拟环境 (Windows)
.venv\Scripts\activate

# 启动 Django 开发服务器
python manage.py runserver 0.0.0.0:8111
```

后端服务地址: `http://127.0.0.1:8111`

### 启动前端服务

```bash
# 进入前端目录
cd frontend

# 启动 Vite 开发服务器
npm run dev
```

前端服务地址: `http://localhost:5173`

---

## 快速关闭

### 方法一：在终端中关闭

在运行服务的终端窗口中按 `Ctrl + C` 即可停止服务。

### 方法二：通过端口查找并关闭进程

#### Windows (CMD)

```cmd
:: 查找占用端口的进程
netstat -ano | findstr ":8111 :5173"

:: 关闭指定 PID 的进程
taskkill /PID <进程ID> /F
```

#### Windows (PowerShell)

```powershell
# 查找并关闭后端服务 (端口 8111)
Get-NetTCPConnection -LocalPort 8111 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

# 查找并关闭前端服务 (端口 5173)
Get-NetTCPConnection -LocalPort 5173 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

#### Linux/Mac

```bash
# 查找占用端口的进程
lsof -i :8111
lsof -i :5173

# 关闭指定端口的进程
kill -9 $(lsof -t -i:8111)
kill -9 $(lsof -t -i:5173)
```

---

## 详细说明

### 后端服务 (Django)

| 项目 | 说明 |
|------|------|
| 框架 | Django |
| 默认端口 | 8111 |
| 目录 | `backend/kucunguanli/kucunguanlixitong` |
| 启动命令 | `python manage.py runserver 0.0.0.0:8111` |

#### 启动步骤

1. 打开终端，进入后端目录：
   ```bash
   cd backend/kucunguanli/kucunguanlixitong
   ```

2. 激活 Python 虚拟环境：
   ```bash
   # Windows
   .venv\Scripts\activate

   # Linux/Mac
   source .venv/bin/activate
   ```

3. 启动开发服务器：
   ```bash
   python manage.py runserver 0.0.0.0:8111
   ```

4. 看到以下输出表示启动成功：
   ```
   Starting development server at http://0.0.0.0:8111/
   Quit the server with CTRL-BREAK.
   ```

### 前端服务 (Vite + React)

| 项目 | 说明 |
|------|------|
| 框架 | React + Vite |
| 默认端口 | 5173 |
| 目录 | `frontend` |
| 启动命令 | `npm run dev` |

#### 启动步骤

1. 打开新终端，进入前端目录：
   ```bash
   cd frontend
   ```

2. 安装依赖（首次运行或依赖更新后）：
   ```bash
   npm install
   ```

3. 启动开发服务器：
   ```bash
   npm run dev
   ```

4. 看到以下输出表示启动成功：
   ```
   VITE v7.x.x  ready in xxx ms

   ➜  Local:   http://localhost:5173/
   ➜  Network: http://xxx.xxx.xxx.xxx:5173/
   ```

---

## 常见问题

### Q1: 端口被占用怎么办？

**A**: 使用上述"快速关闭"中的命令查找并关闭占用端口的进程，或者修改服务端口：

- 后端：`python manage.py runserver 0.0.0.0:8112`
- 前端：修改 `vite.config.js` 中的 `server.port`

### Q2: 虚拟环境激活失败？

**A**: 确保已创建虚拟环境：
```bash
cd backend/kucunguanli/kucunguanlixitong
python -m venv .venv
```

### Q3: npm 命令找不到？

**A**: 确保已安装 Node.js，可从 https://nodejs.org 下载安装。

---

## 一键脚本

### Windows 批处理脚本

创建 `start-services.bat`：
```batch
@echo off
echo Starting backend service...
start cmd /k "cd /d %~dp0backend\kucunguanli\kucunguanlixitong && .venv\Scripts\activate && python manage.py runserver 0.0.0.0:8111"

echo Starting frontend service...
start cmd /k "cd /d %~dp0frontend && npm run dev"

echo Services started!
```

创建 `stop-services.bat`：
```batch
@echo off
echo Stopping services...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8111.*LISTENING"') do (
    taskkill /PID %%a /F 2>nul
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173.*LISTENING"') do (
    taskkill /PID %%a /F 2>nul
)

echo Services stopped!
```

---

**文档版本**: v1.0.0
**最后更新**: 2025-12-20
