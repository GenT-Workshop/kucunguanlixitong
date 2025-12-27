"""
权限检查模块
"""
from functools import wraps
from django.http import JsonResponse

from .models import UserRole, RolePermission


def _json_error(message: str, code: int = 403):
    """错误响应"""
    return JsonResponse({
        "code": code,
        "message": message,
        "data": None
    }, status=code if code < 500 else 200)


def get_user_permissions(user):
    """获取用户所有权限"""
    if not user.is_authenticated:
        return set()

    # 超级管理员拥有所有权限
    if user.is_superuser:
        return {'*'}

    # 获取用户所有角色
    user_roles = UserRole.objects.filter(
        user=user,
        role__is_active=True
    ).select_related('role')

    role_ids = [ur.role_id for ur in user_roles]

    # 获取这些角色的所有权限
    role_permissions = RolePermission.objects.filter(
        role_id__in=role_ids
    ).select_related('permission')

    permissions = set()
    for rp in role_permissions:
        permissions.add(rp.permission.code)

    return permissions


def get_user_roles(user):
    """获取用户所有角色"""
    if not user.is_authenticated:
        return []

    user_roles = UserRole.objects.filter(
        user=user,
        role__is_active=True
    ).select_related('role')

    return [ur.role for ur in user_roles]


def get_user_modules(user):
    """获取用户可访问的模块列表"""
    if not user.is_authenticated:
        return []

    if user.is_superuser:
        return ['stock_in', 'stock_out', 'stock_query', 'stock_warning',
                'stock_count', 'statistics', 'monthly_report', 'user_manage', 'material']

    permissions = get_user_permissions(user)
    modules = set()

    for perm in permissions:
        if ':' in perm:
            module = perm.split(':')[0]
            modules.add(module)

    return list(modules)


def has_permission(user, permission_code):
    """检查用户是否有指定权限"""
    if not user.is_authenticated:
        return False

    if user.is_superuser:
        return True

    permissions = get_user_permissions(user)
    return permission_code in permissions


def has_module_access(user, module):
    """检查用户是否有模块访问权限"""
    if not user.is_authenticated:
        return False

    if user.is_superuser:
        return True

    modules = get_user_modules(user)
    return module in modules


def require_permission(permission_code):
    """权限检查装饰器"""
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return _json_error("请先登录", 401)

            if not has_permission(request.user, permission_code):
                return _json_error("您没有权限执行此操作", 403)

            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


def require_module(module):
    """模块访问权限装饰器"""
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return _json_error("请先登录", 401)

            if not has_module_access(request.user, module):
                return _json_error(f"您没有访问{module}模块的权限", 403)

            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


def require_any_permission(*permission_codes):
    """任一权限检查装饰器（满足其中一个即可）"""
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return _json_error("请先登录", 401)

            for code in permission_codes:
                if has_permission(request.user, code):
                    return view_func(request, *args, **kwargs)

            return _json_error("您没有权限执行此操作", 403)
        return wrapper
    return decorator
