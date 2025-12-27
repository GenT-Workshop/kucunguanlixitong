import json

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .permissions import get_user_roles, get_user_modules, get_user_permissions


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

    # 获取用户角色和权限
    roles = get_user_roles(user)
    modules = get_user_modules(user)
    permissions = list(get_user_permissions(user))

    return _json_response(
        data={
            "id": user.id,
            "username": user.get_username(),
            "email": user.email,
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
            "roles": [{"name": r.name, "display_name": r.display_name} for r in roles],
            "modules": modules,
            "permissions": permissions,
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
        roles = get_user_roles(user)
        modules = get_user_modules(user)
        permissions = list(get_user_permissions(user))
        return _json_response(data={
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
            "date_joined": user.date_joined.strftime("%Y-%m-%d %H:%M:%S"),
            "last_login": user.last_login.strftime("%Y-%m-%d %H:%M:%S") if user.last_login else None,
            "roles": [{"name": r.name, "display_name": r.display_name} for r in roles],
            "modules": modules,
            "permissions": permissions,
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


# ==================== 用户管理接口（管理员） ====================

def _check_admin(request):
    """检查是否为管理员"""
    if not request.user.is_authenticated:
        return False, _json_error("请先登录", 401)
    if not request.user.is_staff:
        return False, _json_error("您没有权限执行此操作", 403)
    return True, None


@csrf_exempt
def user_list_view(request):
    """获取用户列表（管理员）"""
    if request.method != "GET":
        return _json_error("仅支持 GET 请求", 405)

    is_admin, error = _check_admin(request)
    if not is_admin:
        return error

    from django.core.paginator import Paginator
    from django.db.models import Q

    page = int(request.GET.get("page", 1))
    page_size = int(request.GET.get("page_size", 10))
    search = request.GET.get("search", "").strip()
    is_staff = request.GET.get("is_staff", "").strip()
    is_active = request.GET.get("is_active", "").strip()

    queryset = User.objects.all().order_by('-date_joined')

    # 搜索
    if search:
        queryset = queryset.filter(
            Q(username__icontains=search) | Q(email__icontains=search)
        )

    # 角色筛选
    if is_staff:
        queryset = queryset.filter(is_staff=(is_staff.lower() == 'true'))

    # 状态筛选
    if is_active:
        queryset = queryset.filter(is_active=(is_active.lower() == 'true'))

    # 分页
    paginator = Paginator(queryset, page_size)
    page_obj = paginator.get_page(page)

    user_list = [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "is_staff": u.is_staff,
            "is_active": u.is_active,
            "date_joined": u.date_joined.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "last_login": u.last_login.strftime("%Y-%m-%dT%H:%M:%SZ") if u.last_login else None,
        }
        for u in page_obj
    ]

    return _json_response(data={
        "total": paginator.count,
        "page": page,
        "page_size": page_size,
        "list": user_list,
    })


@csrf_exempt
def user_detail_view(request, pk):
    """获取用户详情（管理员）"""
    if request.method != "GET":
        return _json_error("仅支持 GET 请求", 405)

    is_admin, error = _check_admin(request)
    if not is_admin:
        return error

    try:
        u = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return _json_error("用户不存在", 404)

    return _json_response(data={
        "id": u.id,
        "username": u.username,
        "email": u.email,
        "is_staff": u.is_staff,
        "is_active": u.is_active,
        "date_joined": u.date_joined.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "last_login": u.last_login.strftime("%Y-%m-%dT%H:%M:%SZ") if u.last_login else None,
    })


@csrf_exempt
def user_create_view(request):
    """创建用户（管理员）"""
    if request.method != "POST":
        return _json_error("仅支持 POST 请求", 405)

    is_admin, error = _check_admin(request)
    if not is_admin:
        return error

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
    if not password or len(password) < 8:
        return _json_error("密码长度至少8位", 400)

    # 检查用户名是否已存在
    if User.objects.filter(username=username).exists():
        return _json_error("用户名已存在", 400)

    # 检查邮箱是否已存在
    if User.objects.filter(email=email).exists():
        return _json_error("邮箱已被注册", 400)

    # 创建用户
    u = User.objects.create_user(
        username=username,
        email=email,
        password=password
    )
    u.is_staff = is_staff
    u.is_active = is_active
    u.save()

    return _json_response(
        data={
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "is_staff": u.is_staff,
            "is_active": u.is_active,
            "date_joined": u.date_joined.strftime("%Y-%m-%dT%H:%M:%SZ"),
        },
        message="用户创建成功"
    )


@csrf_exempt
def user_update_view(request, pk):
    """更新用户（管理员）"""
    if request.method != "PUT":
        return _json_error("仅支持 PUT 请求", 405)

    is_admin, error = _check_admin(request)
    if not is_admin:
        return error

    try:
        u = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return _json_error("用户不存在", 404)

    payload = _parse_json_body(request)
    if payload is None:
        return _json_error("请求体需要是 JSON", 400)

    # 更新用户名
    username = payload.get("username")
    if username:
        username = username.strip()
        if User.objects.filter(username=username).exclude(id=u.id).exists():
            return _json_error("用户名已被使用", 400)
        u.username = username

    # 更新邮箱
    email = payload.get("email")
    if email:
        email = email.strip()
        if User.objects.filter(email=email).exclude(id=u.id).exists():
            return _json_error("邮箱已被使用", 400)
        u.email = email

    # 更新角色
    if "is_staff" in payload:
        u.is_staff = payload["is_staff"]

    # 更新状态
    if "is_active" in payload:
        u.is_active = payload["is_active"]

    u.save()

    return _json_response(
        data={
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "is_staff": u.is_staff,
            "is_active": u.is_active,
        },
        message="用户更新成功"
    )


@csrf_exempt
def user_delete_view(request, pk):
    """删除用户（管理员）"""
    if request.method != "DELETE":
        return _json_error("仅支持 DELETE 请求", 405)

    is_admin, error = _check_admin(request)
    if not is_admin:
        return error

    try:
        u = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return _json_error("用户不存在", 404)

    # 不能删除自己
    if u.id == request.user.id:
        return _json_error("不能删除自己的账户", 400)

    u.delete()
    return _json_response(message="用户删除成功")


@csrf_exempt
def user_reset_password_view(request, pk):
    """重置用户密码（管理员）"""
    if request.method != "POST":
        return _json_error("仅支持 POST 请求", 405)

    is_admin, error = _check_admin(request)
    if not is_admin:
        return error

    try:
        u = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return _json_error("用户不存在", 404)

    payload = _parse_json_body(request)
    if payload is None:
        return _json_error("请求体需要是 JSON", 400)

    new_password = payload.get("new_password") or ""
    if len(new_password) < 8:
        return _json_error("新密码长度至少8位", 400)

    u.set_password(new_password)
    u.save()

    return _json_response(message="密码重置成功")


# ==================== 角色管理接口 ====================

from .models import Role, Permission, RolePermission, UserRole


@csrf_exempt
def role_list_view(request):
    """获取角色列表"""
    if request.method != "GET":
        return _json_error("仅支持 GET 请求", 405)

    is_admin, error = _check_admin(request)
    if not is_admin:
        return error

    roles = Role.objects.all()
    role_list = [{
        "id": r.id,
        "name": r.name,
        "display_name": r.display_name,
        "description": r.description,
        "is_active": r.is_active,
    } for r in roles]

    return _json_response(data={"list": role_list})


@csrf_exempt
def permission_list_view(request):
    """获取权限列表"""
    if request.method != "GET":
        return _json_error("仅支持 GET 请求", 405)

    is_admin, error = _check_admin(request)
    if not is_admin:
        return error

    permissions = Permission.objects.all()
    perm_list = [{
        "id": p.id,
        "code": p.code,
        "name": p.name,
        "module": p.module,
    } for p in permissions]

    return _json_response(data={"list": perm_list})


@csrf_exempt
def user_role_view(request, pk):
    """获取/设置用户角色"""
    is_admin, error = _check_admin(request)
    if not is_admin:
        return error

    try:
        u = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return _json_error("用户不存在", 404)

    if request.method == "GET":
        user_roles = UserRole.objects.filter(user=u).select_related('role')
        roles = [{"id": ur.role.id, "name": ur.role.name, "display_name": ur.role.display_name} for ur in user_roles]
        return _json_response(data={"roles": roles})

    elif request.method == "POST":
        payload = _parse_json_body(request)
        if payload is None:
            return _json_error("请求体需要是 JSON", 400)

        role_ids = payload.get("role_ids", [])
        UserRole.objects.filter(user=u).delete()
        for rid in role_ids:
            try:
                role = Role.objects.get(pk=rid)
                UserRole.objects.create(user=u, role=role)
            except Role.DoesNotExist:
                pass

        return _json_response(message="用户角色更新成功")

    return _json_error("不支持的请求方法", 405)
