# Devbox CI/CD Deployment

这个仓库可以通过 GitHub Actions 部署到 Devbox。workflow 文件是 `.github/workflows/deploy-devbox.yml`。

## 1. 配置 GitHub Secrets

在 GitHub 仓库页面进入 `Settings -> Secrets and variables -> Actions`，添加：

| Secret | 说明 |
| --- | --- |
| `DEVBOX_HOST` | Devbox 的 SSH 主机名或 IP |
| `DEVBOX_USER` | SSH 用户名 |
| `DEVBOX_PORT` | SSH 端口，通常是 `22` |
| `DEVBOX_SSH_KEY` | Devbox 私钥内容 |
| `DEVBOX_DEPLOY_PATH` | 服务器部署目录，例如 `/home/devbox/kucun` |

你本机的私钥路径是：

```powershell
C:\Users\anan123sz\Downloads\hzh.sealos.run_ns-69ja4of0_devbox
```

GitHub Actions 不能直接读取这个本机路径。需要把文件内容复制到 `DEVBOX_SSH_KEY` 这个 secret 中：

```powershell
Get-Content -Raw "C:\Users\anan123sz\Downloads\hzh.sealos.run_ns-69ja4of0_devbox"
```

只复制输出内容，不要把私钥文件提交到仓库。

## 2. SQLite 部署方式

这个 CI/CD 配置默认使用 SQLite，数据库文件会保存在：

```bash
$DEVBOX_DEPLOY_PATH/shared/db.sqlite3
```

Devbox 部署时会优先使用 `backend/requirements-sqlite.txt`，避免为 SQLite 演示环境安装 PostgreSQL 驱动。

每次发布的新代码会放到：

```bash
$DEVBOX_DEPLOY_PATH/releases/<commit-sha>
```

当前运行版本会软链接到：

```bash
$DEVBOX_DEPLOY_PATH/current
```

## 3. 自动启动方式

默认 workflow 会执行仓库里的：

```bash
scripts/devbox-restart.sh
```

它会用 Django 自带的开发服务器启动一个演示服务：

```bash
0.0.0.0:8000
```

前端和后端都由 Django 同一个端口提供：

| 路径 | 说明 |
| --- | --- |
| `/` | React 前端 |
| `/assets/*` | Vite 构建资源 |
| `/api/*` | Django API |
| `/admin/` | Django Admin |

这是为了快速验证 CI/CD 流程，不是正式生产部署方式。

如果你以后想换成 `gunicorn`、`nginx`、`supervisor` 或 `systemd`，可以在 Devbox 上创建自己的：

```bash
$DEVBOX_DEPLOY_PATH/restart.sh
```

只要它是可执行文件，workflow 会优先执行它。

前端构建产物位置：

```bash
$DEVBOX_DEPLOY_PATH/current/frontend/dist
```

后端位置：

```bash
$DEVBOX_DEPLOY_PATH/current/backend
```

## 4. 触发部署

推送到 `main` 或 `andemo` 分支会自动部署，也可以在 GitHub Actions 页面手动点击 `Run workflow`。
