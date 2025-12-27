from django.db import models
from django.contrib.auth.models import User


class Role(models.Model):
    """角色表"""
    ROLE_CHOICES = [
        ('stock_in_admin', '入库管理员'),
        ('stock_out_admin', '出库管理员'),
        ('warehouse_admin', '仓库管理员'),
        ('finance', '财务'),
        ('boss', '老板'),
    ]

    name = models.CharField(max_length=50, unique=True, verbose_name='角色标识')
    display_name = models.CharField(max_length=50, verbose_name='角色名称')
    description = models.TextField(blank=True, default='', verbose_name='角色描述')
    is_active = models.BooleanField(default=True, verbose_name='是否启用')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        db_table = 'role'
        verbose_name = '角色'
        verbose_name_plural = verbose_name
        ordering = ['id']

    def __str__(self):
        return self.display_name


class Permission(models.Model):
    """权限表"""
    MODULE_CHOICES = [
        ('stock_in', '入库管理'),
        ('stock_out', '出库管理'),
        ('stock_query', '库存查询'),
        ('stock_warning', '库存预警'),
        ('stock_count', '盘点管理'),
        ('statistics', '统计分析'),
        ('monthly_report', '月底结存'),
        ('user_manage', '用户管理'),
        ('material', '物料管理'),
    ]

    code = models.CharField(max_length=50, unique=True, verbose_name='权限代码')
    name = models.CharField(max_length=50, verbose_name='权限名称')
    module = models.CharField(max_length=50, verbose_name='所属模块')
    description = models.TextField(blank=True, default='', verbose_name='权限描述')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        db_table = 'permission'
        verbose_name = '权限'
        verbose_name_plural = verbose_name
        ordering = ['module', 'id']

    def __str__(self):
        return f"{self.module}:{self.name}"


class RolePermission(models.Model):
    """角色-权限关联表"""
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='role_permissions', verbose_name='角色')
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE, related_name='permission_roles', verbose_name='权限')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        db_table = 'role_permission'
        verbose_name = '角色权限'
        verbose_name_plural = verbose_name
        unique_together = ['role', 'permission']

    def __str__(self):
        return f"{self.role.display_name} - {self.permission.name}"


class UserRole(models.Model):
    """用户-角色关联表"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_roles', verbose_name='用户')
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='role_users', verbose_name='角色')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        db_table = 'user_role'
        verbose_name = '用户角色'
        verbose_name_plural = verbose_name
        unique_together = ['user', 'role']

    def __str__(self):
        return f"{self.user.username} - {self.role.display_name}"
