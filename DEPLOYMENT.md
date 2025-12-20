# 部署指南

本文档详细说明如何将用户管理系统部署到生产环境。

## 目录

- [开发环境部署](#开发环境部署)
- [生产环境部署](#生产环境部署)
- [Docker 部署](#docker-部署)
- [常见问题](#常见问题)

---

## 开发环境部署

### 前置要求

- Node.js 16+
- Python 3.12+
- Git

### 1. 克隆项目

```bash
git clone <repository-url>
cd <project-directory>
```

### 2. 后端部署

#### 2.1 创建虚拟环境

```bash
cd backend/kucunguanli/kucunguanlixitong

# 创建虚拟环境
python -m venv .venv

# 激活虚拟环境
# Linux/Mac:
source .venv/bin/activate
# Windows:
.venv\Scripts\activate
```

#### 2.2 安装依赖

```bash
pip install -r requirements.txt
```

如果没有 `requirements.txt`，手动安装：

```bash
pip install django
```

#### 2.3 数据库迁移

```bash
# 创建迁移文件
python manage.py makemigrations

# 执行迁移
python manage.py migrate
```

#### 2.4 创建超级用户（可选）

```bash
python manage.py createsuperuser
```

按提示输入用户名、邮箱和密码。

#### 2.5 启动后端服务

```bash
# 开发环境（端口 8111）
python manage.py runserver 0.0.0.0:8111

# 或使用默认端口 8000
python manage.py runserver
```

后端服务将运行在：`http://127.0.0.1:8111`

### 3. 前端部署

#### 3.1 安装依赖

```bash
cd frontend

# 使用 npm
npm install

# 或使用 yarn
yarn install

# 或使用 pnpm
pnpm install
```

#### 3.2 配置 API 地址

确认 `src/api/api.js` 中的 API 地址正确：

```javascript
const API_BASE_URL = 'http://127.0.0.1:8111'
```

#### 3.3 启动开发服务器

```bash
npm run dev
```

前端服务将运行在：`http://localhost:5173`

### 4. 访问应用

在浏览器中打开：`http://localhost:5173`

---

## 生产环境部署

### 前端生产部署

#### 1. 构建生产版本

```bash
cd frontend

# 构建
npm run build

# 构建产物在 dist/ 目录
```

#### 2. 部署到静态服务器

**方式一：使用 Nginx**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /path/to/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:8111;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**方式二：使用 Apache**

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /path/to/frontend/dist

    <Directory /path/to/frontend/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        # SPA 路由支持
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    # API 代理
    ProxyPass /api/ http://127.0.0.1:8111/api/
    ProxyPassReverse /api/ http://127.0.0.1:8111/api/
</VirtualHost>
```

**方式三：使用 CDN**

将 `dist/` 目录上传到 CDN 或对象存储服务（如阿里云 OSS、腾讯云 COS）。

### 后端生产部署

#### 1. 配置生产环境

编辑 `kucun/settings.py`：

```python
# 关闭调试模式
DEBUG = False

# 设置允许的主机
ALLOWED_HOSTS = ['your-domain.com', 'www.your-domain.com']

# 设置安全的 SECRET_KEY
SECRET_KEY = 'your-production-secret-key'

# 配置静态文件
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATIC_URL = '/static/'

# 配置数据库（推荐使用 PostgreSQL 或 MySQL）
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'your_database',
        'USER': 'your_user',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

#### 2. 收集静态文件

```bash
python manage.py collectstatic --noinput
```

#### 3. 使用 Gunicorn 运行

安装 Gunicorn：

```bash
pip install gunicorn
```

启动服务：

```bash
gunicorn kucun.wsgi:application \
    --bind 0.0.0.0:8111 \
    --workers 4 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -
```

#### 4. 使用 Supervisor 管理进程

安装 Supervisor：

```bash
sudo apt-get install supervisor
```

创建配置文件 `/etc/supervisor/conf.d/django-app.conf`：

```ini
[program:django-app]
command=/path/to/.venv/bin/gunicorn kucun.wsgi:application --bind 0.0.0.0:8111 --workers 4
directory=/path/to/backend/kucunguanli/kucunguanlixitong
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/django-app.log
```

启动服务：

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start django-app
```

#### 5. 配置 Nginx 反向代理

```nginx
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8111;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /path/to/backend/staticfiles/;
    }
}
```

---

## Docker 部署

### 1. 创建 Dockerfile

**后端 Dockerfile** (`backend/Dockerfile`):

```dockerfile
FROM python:3.12-slim

WORKDIR /app

# 安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制项目文件
COPY . .

# 收集静态文件
RUN python manage.py collectstatic --noinput

# 暴露端口
EXPOSE 8111

# 启动命令
CMD ["gunicorn", "kucun.wsgi:application", "--bind", "0.0.0.0:8111"]
```

**前端 Dockerfile** (`frontend/Dockerfile`):

```dockerfile
FROM node:18-alpine as builder

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci

# 构建
COPY . .
RUN npm run build

# 使用 Nginx 提供静态文件
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 2. 创建 docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build: ./backend/kucunguanli/kucunguanlixitong
    ports:
      - "8111:8111"
    environment:
      - DEBUG=False
      - SECRET_KEY=your-secret-key
    volumes:
      - ./backend/kucunguanli/kucunguanlixitong:/app
    command: gunicorn kucun.wsgi:application --bind 0.0.0.0:8111

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=userdb
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 3. 启动服务

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

---

## 环境变量配置

### 后端环境变量

创建 `.env` 文件：

```env
DEBUG=False
SECRET_KEY=your-production-secret-key
ALLOWED_HOSTS=your-domain.com,www.your-domain.com

# 数据库配置
DB_ENGINE=django.db.backends.postgresql
DB_NAME=userdb
DB_USER=dbuser
DB_PASSWORD=dbpassword
DB_HOST=localhost
DB_PORT=5432

# CORS 配置
CORS_ALLOWED_ORIGINS=https://your-domain.com
```

### 前端环境变量

创建 `.env.production` 文件：

```env
VITE_API_BASE_URL=https://api.your-domain.com
```

---

## 性能优化

### 前端优化

1. **代码分割**：Vite 自动进行代码分割
2. **资源压缩**：生产构建自动压缩
3. **CDN 加速**：将静态资源上传到 CDN
4. **缓存策略**：配置合理的缓存头

### 后端优化

1. **数据库连接池**：配置数据库连接池
2. **缓存**：使用 Redis 缓存热点数据
3. **静态文件**：使用 CDN 或对象存储
4. **负载均衡**：使用 Nginx 进行负载均衡

---

## 安全配置

### HTTPS 配置

使用 Let's Encrypt 免费证书：

```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

### 安全头配置

在 Nginx 中添加安全头：

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
```

---

## 监控和日志

### 日志配置

Django 日志配置：

```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': '/var/log/django/app.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}
```

### 监控工具

推荐使用：
- **Sentry**: 错误追踪
- **Prometheus + Grafana**: 性能监控
- **ELK Stack**: 日志分析

---

## 常见问题

### Q1: 静态文件无法加载

**A**:
1. 确认已运行 `collectstatic`
2. 检查 Nginx 配置中的静态文件路径
3. 确认文件权限正确

### Q2: 数据库连接失败

**A**:
1. 检查数据库服务是否启动
2. 确认数据库配置正确
3. 检查防火墙规则

### Q3: CORS 错误

**A**:
1. 确认 CORS 中间件已配置
2. 检查允许的源地址
3. 确认请求头配置正确

### Q4: 502 Bad Gateway

**A**:
1. 检查后端服务是否运行
2. 确认端口配置正确
3. 查看 Nginx 错误日志

---

## 备份策略

### 数据库备份

```bash
# PostgreSQL 备份
pg_dump -U user -d userdb > backup.sql

# 恢复
psql -U user -d userdb < backup.sql
```

### 定时备份

使用 cron 定时备份：

```bash
# 编辑 crontab
crontab -e

# 每天凌晨 2 点备份
0 2 * * * /path/to/backup-script.sh
```

---

## 更新和维护

### 更新流程

1. 备份数据库和代码
2. 拉取最新代码
3. 安装新依赖
4. 运行数据库迁移
5. 重启服务
6. 验证功能

### 回滚流程

1. 停止服务
2. 恢复代码到上一版本
3. 恢复数据库
4. 重启服务

---

**文档版本**: v1.0.0
**最后更新**: 2025-12-20
