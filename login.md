# 登录接口说明

已实现接口：
- `POST /api/login`：接受 JSON 或表单提交的 `username`、`password`，验证成功后创建会话并返回当前用户名。

使用步骤：
1. 安装依赖：`pip install -r requirements.txt`
2. 初始化数据库：`python manage.py migrate`
3. 创建用户：`python manage.py createsuperuser`（或在 admin 后台创建）
4. 启动服务：`python manage.py runserver 0.0.0.0:8000`
5. 调用示例（本地）：
   - JSON：
     ```bash
     curl -X POST http://127.0.0.1:8000/api/login \
       -H "Content-Type: application/json" \
       -d '{"username": "你的用户名", "password": "你的密码"}'
     ```
   - 表单：
     ```bash
     curl -X POST http://127.0.0.1:8000/api/login \
       -d "username=你的用户名&password=你的密码"
     ```
