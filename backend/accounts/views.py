import json
from functools import wraps

from django.contrib.auth import authenticate, login
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .models import Token


def _json_error(message: str, status: int) -> JsonResponse:
    return JsonResponse({"success": False, "message": message}, status=status)


def token_required(view_func):
    """Token 认证装饰器"""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token_key = auth_header[7:]
        elif auth_header.startswith('Token '):
            token_key = auth_header[6:]
        else:
            token_key = request.GET.get('token', '')

        if not token_key:
            return JsonResponse({'code': 401, 'message': '未提供认证Token', 'data': None}, status=401)

        try:
            token = Token.objects.select_related('user').get(key=token_key)
            request.user = token.user
        except Token.DoesNotExist:
            return JsonResponse({'code': 401, 'message': 'Token无效', 'data': None}, status=401)

        return view_func(request, *args, **kwargs)
    return wrapper


@csrf_exempt
def login_view(request):
    if request.method != "POST":
        return _json_error("仅支持 POST 请求", 405)

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

    # 获取或创建用户的 token
    token, _ = Token.objects.get_or_create(user=user, defaults={'key': f'token_{user.id}_{user.username}'})

    return JsonResponse({
        "success": True,
        "message": "登录成功",
        "data": {
            "username": user.get_username(),
            "token": token.key
        }
    })
