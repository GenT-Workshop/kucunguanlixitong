import json
from functools import wraps

from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.paginator import Paginator
from django.db.models import Q
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_GET, require_http_methods


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
    try:
        return json.loads(request.body.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        return None


def login_required_json(view_func):
    """登录验证装饰器"""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return _json_error("请先登录", 401)
        return view_func(request, *args, **kwargs)
    return wrapper


def admin_required(view_func):
    """管理员权限装饰器"""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return _json_error("请先登录", 401)
        if not request.user.is_staff:
            return _json_error("您没有权限执行此操作", 403)
        return view_func(request, *args, **kwargs)
    return wrapper


def _serialize_user(user, detail=False):
    """序列化用户对象"""
    data = {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "is_staff": user.is_staff,
    }
    if detail:
        data.update({
            "is_active": user.is_active,
            "date_joined": user.date_joined.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "last_login": user.last_login.strftime("%Y-%m-%dT%H:%M:%SZ") if user.last_login else None,
        })
    return data


@csrf_exempt
@require_POST
def login_view(request):
    """用户登录"""
    payload = _parse_json_body(request)
    if payload is None:
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
    return _json_response(data=_serialize_user(user), message="登录成功")


@csrf_exempt
@require_POST
def register_view(request):
    """用户注册"""
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

    try:
        validate_password(password)
    except ValidationError as e:
        return _json_error(e.messages[0], 400)

    if User.objects.filter(username=username).exists():
        return _json_error("用户名已存在", 400)
    if User.objects.filter(email=email).exists():
        return _json_error("邮箱已被注册", 400)

    user = User.objects.create_user(username=username, email=email, password=password)
    return _json_response(data=_serialize_user(user), message="注册成功")


@csrf_exempt
@require_POST
def logout_view(request):
    """用户登出"""
    logout(request)
    return _json_response(message="登出成功")


@csrf_exempt
@require_http_methods(["GET", "PUT"])
@login_required_json
def profile_view(request):
    """获取/更新用户信息"""
    user = request.user

    if request.method == "GET":
        return _json_response(data=_serialize_user(user, detail=True))

    payload = _parse_json_body(request)
    if payload is None:
        return _json_error("请求体需要是 JSON", 400)

    email = payload.get("email")
    if email:
        if User.objects.filter(email=email).exclude(id=user.id).exists():
            return _json_error("邮箱已被使用", 400)
        user.email = email

    username = payload.get("username")
    if username:
        if User.objects.filter(username=username).exclude(id=user.id).exists():
            return _json_error("用户名已被使用", 400)
        user.username = username

    user.save()
    return _json_response(data=_serialize_user(user), message="更新成功")


@csrf_exempt
@require_POST
@login_required_json
def change_password_view(request):
    """修改密码"""
    payload = _parse_json_body(request)
    if payload is None:
        return _json_error("请求体需要是 JSON", 400)

    old_password = payload.get("old_password") or ""
    new_password = payload.get("new_password") or ""

    if not old_password or not new_password:
        return _json_error("缺少旧密码或新密码", 400)

    user = request.user
    if not user.check_password(old_password):
        return _json_error("旧密码错误", 400)

    try:
        validate_password(new_password, user)
    except ValidationError as e:
        return _json_error(e.messages[0], 400)

    user.set_password(new_password)
    user.save()
    update_session_auth_hash(request, user)
    return _json_response(message="密码修改成功")


# ==================== 用户管理接口（管理员） ====================

@csrf_exempt
@require_GET
@admin_required
def user_list_view(request):
    """获取用户列表（管理员）"""
    page = int(request.GET.get("page", 1))
    page_size = int(request.GET.get("page_size", 10))
    search = request.GET.get("search", "").strip()
    is_staff = request.GET.get("is_staff", "").strip()
    is_active = request.GET.get("is_active", "").strip()

    queryset = User.objects.all().order_by('-date_joined')

    if search:
        queryset = queryset.filter(Q(username__icontains=search) | Q(email__icontains=search))
    if is_staff:
        queryset = queryset.filter(is_staff=(is_staff.lower() == 'true'))
    if is_active:
        queryset = queryset.filter(is_active=(is_active.lower() == 'true'))

    paginator = Paginator(queryset, page_size)
    page_obj = paginator.get_page(page)

    return _json_response(data={
        "total": paginator.count,
        "page": page,
        "page_size": page_size,
        "list": [_serialize_user(u, detail=True) for u in page_obj],
    })


@csrf_exempt
@require_GET
@admin_required
def user_detail_view(request, pk):
    """获取用户详情（管理员）"""
    u = get_object_or_404(User, pk=pk)
    return _json_response(data=_serialize_user(u, detail=True))


@csrf_exempt
@require_POST
@admin_required
def user_create_view(request):
    """创建用户（管理员）"""
    payload = _parse_json_body(request)
    if payload is None:
        return _json_error("请求体需要是 JSON", 400)

    username = (payload.get("username") or "").strip()
    email = (payload.get("email") or "").strip()
    password = payload.get("password") or ""
    is_staff = payload.get("is_staff", False)
    is_active = payload.get("is_active", True)

    if not username:
        return _json_error("用户名不能为空", 400)
    if not email:
        return _json_error("邮箱不能为空", 400)

    try:
        validate_password(password)
    except ValidationError as e:
        return _json_error(e.messages[0], 400)

    if User.objects.filter(username=username).exists():
        return _json_error("用户名已存在", 400)
    if User.objects.filter(email=email).exists():
        return _json_error("邮箱已被注册", 400)

    u = User.objects.create_user(username=username, email=email, password=password)
    u.is_staff = is_staff
    u.is_active = is_active
    u.save()

    return _json_response(data=_serialize_user(u, detail=True), message="用户创建成功")


@csrf_exempt
@require_http_methods(["PUT"])
@admin_required
def user_update_view(request, pk):
    """更新用户（管理员）"""
    u = get_object_or_404(User, pk=pk)

    payload = _parse_json_body(request)
    if payload is None:
        return _json_error("请求体需要是 JSON", 400)

    username = payload.get("username")
    if username:
        username = username.strip()
        if User.objects.filter(username=username).exclude(id=u.id).exists():
            return _json_error("用户名已被使用", 400)
        u.username = username

    email = payload.get("email")
    if email:
        email = email.strip()
        if User.objects.filter(email=email).exclude(id=u.id).exists():
            return _json_error("邮箱已被使用", 400)
        u.email = email

    if "is_staff" in payload:
        u.is_staff = payload["is_staff"]
    if "is_active" in payload:
        u.is_active = payload["is_active"]

    u.save()
    return _json_response(data=_serialize_user(u, detail=True), message="用户更新成功")


@csrf_exempt
@require_http_methods(["DELETE"])
@admin_required
def user_delete_view(request, pk):
    """删除用户（管理员）"""
    u = get_object_or_404(User, pk=pk)

    if u.id == request.user.id:
        return _json_error("不能删除自己的账户", 400)

    u.delete()
    return _json_response(message="用户删除成功")


@csrf_exempt
@require_POST
@admin_required
def user_reset_password_view(request, pk):
    """重置用户密码（管理员）"""
    u = get_object_or_404(User, pk=pk)

    payload = _parse_json_body(request)
    if payload is None:
        return _json_error("请求体需要是 JSON", 400)

    new_password = payload.get("new_password") or ""

    try:
        validate_password(new_password, u)
    except ValidationError as e:
        return _json_error(e.messages[0], 400)

    u.set_password(new_password)
    u.save()
    return _json_response(message="密码重置成功")