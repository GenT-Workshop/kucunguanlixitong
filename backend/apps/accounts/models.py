from django.db import models  # 导入Django的模型模块，用于定义数据库模型
from django.contrib.auth.models import User  # 导入Django内置的User模型，用于用户认证


class Role(models.Model):  # 定义角色模型类，继承自Django的Model基类
    """角色表"""  # 模型的文档字符串，说明这是角色表
    ROLE_CHOICES = [  # 定义角色选项列表，用于限制角色的可选值
        ('stock_in_admin', '入库管理员'),  # 入库管理员角色
        ('stock_out_admin', '出库管理员'),  # 出库管理员角色
        ('warehouse_admin', '仓库管理员'),  # 仓库管理员角色
        ('finance', '财务'),  # 财务角色
        ('boss', '老板'),  # 老板角色（拥有全部权限）
    ]  # 角色选项列表结束

    name = models.CharField(max_length=50, unique=True, verbose_name='角色标识')  # 角色标识字段，字符串类型，最大50字符，唯一约束
    display_name = models.CharField(max_length=50, verbose_name='角色名称')  # 角色显示名称字段，用于前端展示
    description = models.TextField(blank=True, default='', verbose_name='角色描述')  # 角色描述字段，文本类型，可为空
    is_active = models.BooleanField(default=True, verbose_name='是否启用')  # 是否启用字段，布尔类型，默认为True
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')  # 创建时间字段，自动设置为创建时的时间
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')  # 更新时间字段，每次保存时自动更新

    class Meta:  # 模型的元数据类，用于配置模型的行为
        db_table = 'role'  # 指定数据库表名为'role'
        verbose_name = '角色'  # 模型的可读名称（单数）
        verbose_name_plural = verbose_name  # 模型的可读名称（复数），与单数相同
        ordering = ['id']  # 默认按id字段升序排序

    def __str__(self):  # 定义模型的字符串表示方法
        return self.display_name  # 返回角色的显示名称


class Permission(models.Model):  # 定义权限模型类，继承自Django的Model基类
    """权限表"""  # 模型的文档字符串，说明这是权限表
    MODULE_CHOICES = [  # 定义模块选项列表，用于分类权限
        ('stock_in', '入库管理'),  # 入库管理模块
        ('stock_out', '出库管理'),  # 出库管理模块
        ('stock_query', '库存查询'),  # 库存查询模块
        ('stock_warning', '库存预警'),  # 库存预警模块
        ('stock_count', '盘点管理'),  # 盘点管理模块
        ('statistics', '统计分析'),  # 统计分析模块
        ('monthly_report', '月底结存'),  # 月底结存模块
        ('user_manage', '用户管理'),  # 用户管理模块
        ('material', '物料管理'),  # 物料管理模块
    ]  # 模块选项列表结束

    code = models.CharField(max_length=50, unique=True, verbose_name='权限代码')  # 权限代码字段，唯一标识一个权限
    name = models.CharField(max_length=50, verbose_name='权限名称')  # 权限名称字段，用于前端展示
    module = models.CharField(max_length=50, verbose_name='所属模块')  # 所属模块字段，标识权限属于哪个功能模块
    description = models.TextField(blank=True, default='', verbose_name='权限描述')  # 权限描述字段，可为空
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')  # 创建时间字段，自动设置

    class Meta:  # 模型的元数据类
        db_table = 'permission'  # 指定数据库表名为'permission'
        verbose_name = '权限'  # 模型的可读名称（单数）
        verbose_name_plural = verbose_name  # 模型的可读名称（复数）
        ordering = ['module', 'id']  # 默认先按模块排序，再按id排序

    def __str__(self):  # 定义模型的字符串表示方法
        return f"{self.module}:{self.name}"  # 返回"模块:权限名称"格式的字符串


class RolePermission(models.Model):  # 定义角色-权限关联模型，用于实现多对多关系
    """角色-权限关联表"""  # 模型的文档字符串
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='role_permissions', verbose_name='角色')  # 外键关联角色表，级联删除
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE, related_name='permission_roles', verbose_name='权限')  # 外键关联权限表，级联删除
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')  # 创建时间字段

    class Meta:  # 模型的元数据类
        db_table = 'role_permission'  # 指定数据库表名
        verbose_name = '角色权限'  # 模型的可读名称
        verbose_name_plural = verbose_name  # 复数名称
        unique_together = ['role', 'permission']  # 联合唯一约束，防止重复分配

    def __str__(self):  # 字符串表示方法
        return f"{self.role.display_name} - {self.permission.name}"  # 返回"角色名 - 权限名"格式


class UserRole(models.Model):  # 定义用户-角色关联模型，用于实现用户和角色的多对多关系
    """用户-角色关联表"""  # 模型的文档字符串
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_roles', verbose_name='用户')  # 外键关联Django内置User表，级联删除
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='role_users', verbose_name='角色')  # 外键关联角色表，级联删除
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')  # 创建时间字段

    class Meta:  # 模型的元数据类
        db_table = 'user_role'  # 指定数据库表名
        verbose_name = '用户角色'  # 模型的可读名称
        verbose_name_plural = verbose_name  # 复数名称
        unique_together = ['user', 'role']  # 联合唯一约束，防止同一用户重复分配同一角色

    def __str__(self):  # 字符串表示方法
        return f"{self.user.username} - {self.role.display_name}"  # 返回"用户名 - 角色名"格式
