# 项目启动指南

## 后端服务器启动

1. 打开终端，进入 backend 目录：
```bash
cd backend
```

2. 使用虚拟环境启动 Django 服务器：
```bash
venv/bin/python manage.py runserver 8000
```

3. 后端服务运行在：http://127.0.0.1:8000/

4. 如果拉取了新代码，先执行数据库迁移：
```bash
venv/bin/python manage.py migrate
```

## 前端服务器启动

1. 打开终端，进入 frontend 目录：
```bash
cd frontend
```

2. 安装依赖（首次运行或依赖更新时）：
```bash
npm install
```

3. 启动开发服务器：
```bash
npm run dev
```

4. 前端服务运行在：http://localhost:5173/（默认端口）

## 注意事项

- 前后端需要同时启动才能正常使用
- 建议先启动后端，再启动前端
- 按 `Ctrl+C` 可停止服务器
