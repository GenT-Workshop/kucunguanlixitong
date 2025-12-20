import json
from functools import wraps

from django.contrib.auth import authenticate, login
from django.http import HttpRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt


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
        {"success": True, "message": "登录成功", "data": {"username": user.get_username()}}
    )

