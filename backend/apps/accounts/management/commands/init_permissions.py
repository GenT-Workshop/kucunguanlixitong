"""
初始化权限和角色数据
"""
from django.core.management.base import BaseCommand
from apps.accounts.models import Role, Permission, RolePermission


class Command(BaseCommand):
    help = '初始化权限和角色数据'

    def handle(self, *args, **options):
        self.stdout.write('开始初始化权限数据...')
        self._create_permissions()
        self.stdout.write('开始初始化角色数据...')
        self._create_roles()
        self.stdout.write('开始配置角色权限...')
        self._assign_permissions()
        self.stdout.write(self.style.SUCCESS('初始化完成！'))

    def _create_permissions(self):
        """创建权限"""
        permissions = [
            # 入库管理
            ('stock_in:view', '查看入库', 'stock_in'),
            ('stock_in:create', '创建入库', 'stock_in'),
            ('stock_in:delete', '删除入库', 'stock_in'),
            # 出库管理
            ('stock_out:view', '查看出库', 'stock_out'),
            ('stock_out:create', '创建出库', 'stock_out'),
            ('stock_out:delete', '删除出库', 'stock_out'),
            # 库存查询
            ('stock_query:view', '查看库存', 'stock_query'),
            # 库存预警
            ('stock_warning:view', '查看预警', 'stock_warning'),
            ('stock_warning:check', '检查预警', 'stock_warning'),
            # 盘点管理
            ('stock_count:view', '查看盘点', 'stock_count'),
            ('stock_count:create', '创建盘点', 'stock_count'),
            ('stock_count:submit', '提交盘点', 'stock_count'),
            ('stock_count:complete', '完成盘点', 'stock_count'),
            # 统计分析
            ('statistics:view', '查看统计', 'statistics'),
            # 月底结存
            ('monthly_report:view', '查看月报', 'monthly_report'),
            # 用户管理
            ('user_manage:view', '查看用户', 'user_manage'),
            ('user_manage:create', '创建用户', 'user_manage'),
            ('user_manage:update', '更新用户', 'user_manage'),
            ('user_manage:delete', '删除用户', 'user_manage'),
            # 物料管理
            ('material:view', '查看物料', 'material'),
            ('material:create', '创建物料', 'material'),
            ('material:update', '更新物料', 'material'),
        ]
        for code, name, module in permissions:
            Permission.objects.get_or_create(
                code=code, defaults={'name': name, 'module': module}
            )
        self.stdout.write(f'  创建了 {len(permissions)} 个权限')

    def _create_roles(self):
        """创建角色"""
        roles = [
            ('stock_in_admin', '入库管理员', '负责入库操作'),
            ('stock_out_admin', '出库管理员', '负责出库操作'),
            ('warehouse_admin', '仓库管理员', '负责仓库日常管理'),
            ('finance', '财务', '负责财务相关查询'),
            ('boss', '老板', '拥有所有权限'),
        ]
        for name, display, desc in roles:
            Role.objects.get_or_create(
                name=name,
                defaults={'display_name': display, 'description': desc}
            )
        self.stdout.write(f'  创建了 {len(roles)} 个角色')

    def _assign_permissions(self):
        """分配角色权限"""
        # 入库管理员权限
        stock_in_perms = [
            'stock_in:view', 'stock_in:create', 'stock_in:delete',
            'stock_query:view', 'stock_warning:view',
        ]
        # 出库管理员权限
        stock_out_perms = [
            'stock_out:view', 'stock_out:create', 'stock_out:delete',
            'stock_query:view', 'stock_warning:view',
        ]
        # 仓库管理员权限
        warehouse_perms = [
            'stock_in:view', 'stock_in:create', 'stock_in:delete',
            'stock_out:view', 'stock_out:create', 'stock_out:delete',
            'stock_query:view', 'stock_warning:view', 'stock_warning:check',
            'stock_count:view', 'stock_count:submit',
        ]
        # 财务权限
        finance_perms = [
            'stock_query:view', 'stock_warning:view',
            'stock_count:view',
            'statistics:view', 'monthly_report:view',
        ]
        # 老板权限（全部）
        boss_perms = [
            'stock_in:view', 'stock_in:create', 'stock_in:delete',
            'stock_out:view', 'stock_out:create', 'stock_out:delete',
            'stock_query:view',
            'stock_warning:view', 'stock_warning:check',
            'stock_count:view', 'stock_count:create',
            'stock_count:submit', 'stock_count:complete',
            'statistics:view', 'monthly_report:view',
            'user_manage:view', 'user_manage:create',
            'user_manage:update', 'user_manage:delete',
            'material:view', 'material:create', 'material:update',
        ]

        # 角色权限映射
        role_perms_map = {
            'stock_in_admin': stock_in_perms,
            'stock_out_admin': stock_out_perms,
            'warehouse_admin': warehouse_perms,
            'finance': finance_perms,
            'boss': boss_perms,
        }

        count = 0
        for role_name, perm_codes in role_perms_map.items():
            role = Role.objects.get(name=role_name)
            for code in perm_codes:
                perm = Permission.objects.get(code=code)
                _, created = RolePermission.objects.get_or_create(
                    role=role, permission=perm
                )
                if created:
                    count += 1
        self.stdout.write(f'  分配了 {count} 个角色权限')
