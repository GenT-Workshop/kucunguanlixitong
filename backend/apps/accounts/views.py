import json

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt


def _json_response(data=None, message="success", code=200):
    """统一响应格式"""
    return JsonResponse({
        "code": code,
        "message": message,
        "data": data
    }, status=code if code < 500 else 200)


def _json_error(message: str, code: int = 400):
    """错误响应"""
    return _json_response(data=None, message=message, code=code)


def _parse_json_body(request):
    """解析JSON请求体"""
    content_type = request.content_type or ""
    if "application/json" in content_type:
        try:
            return json.loads(request.body.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            return None
    return None


@csrf_exempt
def login_view(request):
    """用户登录"""
    if request.method != "POST":
        return _json_error("仅支持 POST 请求", 405)

    payload = _parse_json_body(request)
    if payload is None:
        # 尝试从表单获取
        username = (request.POST.get("username") or "").strip()
        password = request.POST.get("password") or ""
    else:
        username = (payload.get("username") or "").strip()
        password = payload.get("password") or ""

    if not username or not password:
        return _json_error("缺少用户名或密码", 400)

    user = authenticate(request, username=username, password=password)
    if user is None:
        return _json_error("用户名或密码错误", 401)

    login(request, user)
    return _json_response(
        data={
            "id": user.id,
            "username": user.get_username(),
            "email": user.email,
            "is_staff": user.is_staff,
        },
        message="登录成功"
    )


@csrf_exempt
def register_view(request):
    """用户注册"""
    if request.method != "POST":
        return _json_error("仅支持 POST 请求", 405)

    payload = _parse_json_body(request)
    if payload is None:
        return _json_error("请求体需要是 JSON", 400)

    username = (payload.get("username") or "").strip()
    email = (payload.get("email") or "").strip()
    password = payload.get("password") or ""

    if not username:
        return _json_error("用户名不能为空", 400)
    if not email:
        return _json_error("邮箱不能为空", 400)
    if not password:
        return _json_error("密码不能为空", 400)
    if len(password) < 8:
        return _json_error("密码长度至少8位", 400)

    # 检查用户名是否已存在
    if User.objects.filter(username=username).exists():
        return _json_error("用户名已存在", 400)

    # 检查邮箱是否已存在
    if User.objects.filter(email=email).exists():
        return _json_error("邮箱已被注册", 400)

    # 创建用户
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password
    )

    return _json_response(
        data={
            "id": user.id,
            "username": user.username,
            "email": user.email,
        },
        message="注册成功"
    )


@csrf_exempt
def logout_view(request):
    """用户登出"""
    if request.method != "POST":
        return _json_error("仅支持 POST 请求", 405)

    logout(request)
    return _json_response(message="登出成功")


@csrf_exempt
def profile_view(request):
    """获取/更新用户信息"""
    if not request.user.is_authenticated:
        return _json_error("请先登录", 401)

    if request.method == "GET":
        user = request.user
        return _json_response(data={
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_staff": user.is_staff,
            "date_joined": user.date_joined.strftime("%Y-%m-%d %H:%M:%S"),
            "last_login": user.last_login.strftime("%Y-%m-%d %H:%M:%S") if user.last_login else None,
        })

    elif request.method == "PUT":
        payload = _parse_json_body(request)
        if payload is None:
            return _json_error("请求体需要是 JSON", 400)

        user = request.user

        # 更新邮箱
        email = payload.get("email")
        if email:
            if User.objects.filter(email=email).exclude(id=user.id).exists():
                return _json_error("邮箱已被使用", 400)
            user.email = email

        # 更新用户名
        username = payload.get("username")
        if username:
            if User.objects.filter(username=username).exclude(id=user.id).exists():
                return _json_error("用户名已被使用", 400)
            user.username = username

        user.save()

        return _json_response(
            data={
                "id": user.id,
                "username": user.username,
                "email": user.email,
            },
            message="更新成功"
        )

    return _json_error("不支持的请求方法", 405)


@csrf_exempt
def change_password_view(request):
    """修改密码"""
    if request.method != "POST":
        return _json_error("仅支持 POST 请求", 405)

    if not request.user.is_authenticated:
        return _json_error("请先登录", 401)

    payload = _parse_json_body(request)
    if payload is None:
        return _json_error("请求体需要是 JSON", 400)

    old_password = payload.get("old_password") or ""
    new_password = payload.get("new_password") or ""

    if not old_password or not new_password:
        return _json_error("缺少旧密码或新密码", 400)

    if len(new_password) < 8:
        return _json_error("新密码长度至少8位", 400)

    user = request.user
    if not user.check_password(old_password):
        return _json_error("旧密码错误", 400)

    user.set_password(new_password)
    user.save()

    return _json_response(message="密码修改成功")
