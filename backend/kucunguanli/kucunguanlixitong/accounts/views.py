import json
from functools import wraps

from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from django.http import HttpRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import IntegrityError


def _json_error(message: str, status: int) -> JsonResponse:
    return JsonResponse({"success": False, "message": message}, status=status)


def require_post_json(view_func):
    """
    Decorator to enforce POST requests while keeping a consistent JSON error body.
    """

    @wraps(view_func)
    def wrapper(request: HttpRequest, *args, **kwargs):
        if request.method != "POST":
            return _json_error("仅支持 POST 请求", 405)
        return view_func(request, *args, **kwargs)

    return wrapper


@csrf_exempt
@require_post_json
def login_view(request: HttpRequest):

    content_type = request.content_type or ""

    if "application/json" in content_type:
        try:
            payload = json.loads(request.body.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            return _json_error("请求体需要是 JSON", 400)
        username = (payload.get("username") or "").strip()
        password = payload.get("password") or ""
    else:
        username = (request.POST.get("username") or "").strip()
        password = request.POST.get("password") or ""

    if not username or not password:
        return _json_error("缺少用户名或密码", 400)

    user = authenticate(request, username=username, password=password)
    if user is None:
        return _json_error("用户名或密码错误", 401)

    login(request, user)
    return JsonResponse(
        {
            "success": True,
            "message": "登录成功",
            "data": {
                "username": user.get_username(),
                "email": user.email or ""
            }
        }
    )


@csrf_exempt
@require_post_json
def register_view(request: HttpRequest):
    """
    用户注册接口
    """
    content_type = request.content_type or ""

    if "application/json" in content_type:
        try:
            payload = json.loads(request.body.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            return _json_error("请求体需要是 JSON", 400)
        username = (payload.get("username") or "").strip()
        password = payload.get("password") or ""
        email = (payload.get("email") or "").strip()
    else:
        username = (request.POST.get("username") or "").strip()
        password = request.POST.get("password") or ""
        email = (request.POST.get("email") or "").strip()

    # 验证必填字段
    if not username or not password:
        return _json_error("缺少用户名或密码", 400)

    # 验证用户名长度
    if len(username) < 3:
        return _json_error("用户名至少3个字符", 400)

    # 验证密码长度
    if len(password) < 6:
        return _json_error("密码至少6个字符", 400)

    # 验证用户名格式（只允许字母、数字和下划线）
    if not username.replace('_', '').isalnum():
        return _json_error("用户名只能包含字母、数字和下划线", 400)

    try:
        # 创建新用户
        user = User.objects.create_user(
            username=username,
            password=password,
            email=email if email else ""
        )

        # 自动登录新注册的用户
        login(request, user)

        return JsonResponse({
            "success": True,
            "message": "注册成功",
            "data": {
                "username": user.username,
                "email": user.email
            }
        })

    except IntegrityError:
        return _json_error("用户名已存在", 400)
    except Exception as e:
        return _json_error(f"注册失败: {str(e)}", 500)

