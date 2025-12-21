from django.db import models
from django.utils import timezone


def generate_bill_no(prefix):
    """生成单据号: 前缀-YYYYMMDD-####"""
    today = timezone.now().strftime('%Y%m%d')
    return f"{prefix}-{today}-"


class Stock(models.Model):
    """库存表"""
    material_code = models.CharField(max_length=50, unique=True, verbose_name='物料编号')
    material_name = models.CharField(max_length=100, verbose_name='物料名称')
    spec = models.CharField(max_length=100, blank=True, default='', verbose_name='规格型号')
    unit = models.CharField(max_length=20, blank=True, default='', verbose_name='单位')
    category = models.CharField(max_length=50, blank=True, default='', verbose_name='类别')
    supplier = models.CharField(max_length=100, blank=True, default='', verbose_name='供应商')
    max_stock = models.IntegerField(default=0, verbose_name='最大库存量')
    min_stock = models.IntegerField(default=0, verbose_name='最小库存量')
    current_stock = models.IntegerField(default=0, verbose_name='当前库存量')
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='单价')
    stock_value = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='库存价值')
    status = models.CharField(max_length=10, choices=[('active', '启用'), ('inactive', '停用')], default='active', verbose_name='状态')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        db_table = 'stock'
        verbose_name = '库存'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.material_code} - {self.material_name}"

    @property
    def stock_status(self):
        """计算库存状态"""
        if self.current_stock <= self.min_stock:
            return 'low'
        elif self.current_stock >= self.max_stock:
            return 'high'
        return 'normal'

    @property
    def stock_status_display(self):
        """库存状态显示名称"""
        status_map = {
            'low': '库存不足',
            'high': '库存过高',
            'normal': '正常',
        }
        return status_map.get(self.stock_status, '正常')


class StockIn(models.Model):
    """入库表"""
    IN_TYPE_CHOICES = [
        ('purchase', '采购入库'),
        ('production', '生产入库'),
        ('return', '退货入库'),
        ('other', '其他入库'),
        ('adjust_gain', '盘点盘盈'),
    ]

    bill_no = models.CharField(max_length=30, unique=True, default='', verbose_name='单据号')
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, verbose_name='关联库存')
    material_code = models.CharField(max_length=50, verbose_name='物料编号')
    material_name = models.CharField(max_length=100, verbose_name='物料名称')
    supplier = models.CharField(max_length=100, blank=True, default='', verbose_name='供应商')
    in_time = models.DateTimeField(verbose_name='入库时间')
    in_quantity = models.IntegerField(verbose_name='入库数量')
    in_value = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='入库价值')
    in_type = models.CharField(max_length=20, choices=IN_TYPE_CHOICES, default='purchase', verbose_name='入库类型')
    operator = models.CharField(max_length=50, blank=True, default='', verbose_name='操作人')
    remark = models.TextField(blank=True, default='', verbose_name='备注')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        db_table = 'stock_in'
        verbose_name = '入库记录'
        verbose_name_plural = verbose_name
        ordering = ['-in_time']

    def __str__(self):
        return f"{self.material_code} - {self.in_quantity}"

    @property
    def in_type_display(self):
        """入库类型显示名称"""
        return dict(self.IN_TYPE_CHOICES).get(self.in_type, '其他入库')


class StockOut(models.Model):
    """出库表"""
    OUT_TYPE_CHOICES = [
        ('production', '生产领料'),
        ('sales', '销售提货'),
        ('other', '其他出库'),
        ('adjust_loss', '盘点盘亏'),
    ]

    bill_no = models.CharField(max_length=30, unique=True, default='', verbose_name='单据号')
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, verbose_name='关联库存')
    material_code = models.CharField(max_length=50, verbose_name='物料编号')
    material_name = models.CharField(max_length=100, verbose_name='物料名称')
    out_time = models.DateTimeField(verbose_name='出库时间')
    out_quantity = models.IntegerField(verbose_name='出库数量')
    out_value = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='出库价值')
    out_type = models.CharField(max_length=20, choices=OUT_TYPE_CHOICES, verbose_name='出库类型')
    operator = models.CharField(max_length=50, blank=True, default='', verbose_name='操作人')
    remark = models.TextField(blank=True, default='', verbose_name='备注')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        db_table = 'stock_out'
        verbose_name = '出库记录'
        verbose_name_plural = verbose_name
        ordering = ['-out_time']

    def __str__(self):
        return f"{self.material_code} - {self.out_quantity}"


class StockWarning(models.Model):
    """库存预警表"""
    WARNING_TYPE_CHOICES = [
        ('low', '库存不足'),
        ('high', '库存过高'),
    ]

    LEVEL_CHOICES = [
        ('warning', '警告'),
        ('danger', '危险'),
    ]

    STATUS_CHOICES = [
        ('pending', '待处理'),
        ('handled', '已处理'),
        ('ignored', '已忽略'),
    ]

    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, verbose_name='关联库存')
    material_code = models.CharField(max_length=50, verbose_name='物料编号')
    material_name = models.CharField(max_length=100, verbose_name='物料名称')
    warning_type = models.CharField(max_length=10, choices=WARNING_TYPE_CHOICES, verbose_name='预警类型')
    level = models.CharField(max_length=10, choices=LEVEL_CHOICES, default='warning', verbose_name='预警级别')
    current_stock = models.IntegerField(verbose_name='当前库存')
    min_stock = models.IntegerField(default=0, verbose_name='最小库存')
    max_stock = models.IntegerField(default=0, verbose_name='最大库存')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending', verbose_name='处理状态')
    handled_by = models.CharField(max_length=50, blank=True, default='', verbose_name='处理人')
    handled_at = models.DateTimeField(null=True, blank=True, verbose_name='处理时间')
    remark = models.TextField(blank=True, default='', verbose_name='备注')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        db_table = 'stock_warning'
        verbose_name = '库存预警'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.material_code} - {self.get_warning_type_display()}"

    @property
    def warning_type_display(self):
        return dict(self.WARNING_TYPE_CHOICES).get(self.warning_type, '')

    @property
    def level_display(self):
        return dict(self.LEVEL_CHOICES).get(self.level, '')

    @property
    def status_display(self):
        return dict(self.STATUS_CHOICES).get(self.status, '')


class StockCountTask(models.Model):
    """盘点任务表"""
    STATUS_CHOICES = [
        ('pending', '待盘点'),
        ('doing', '盘点中'),
        ('done', '已完成'),
        ('cancelled', '已取消'),
    ]

    task_no = models.CharField(max_length=30, unique=True, verbose_name='任务号')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending', verbose_name='状态')
    created_by = models.CharField(max_length=50, verbose_name='创建人')
    remark = models.TextField(blank=True, default='', verbose_name='备注')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='完成时间')

    class Meta:
        db_table = 'stock_count_task'
        verbose_name = '盘点任务'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.task_no}"

    @property
    def status_display(self):
        return dict(self.STATUS_CHOICES).get(self.status, '')


class StockCountItem(models.Model):
    """盘点明细表"""
    DIFF_TYPE_CHOICES = [
        ('gain', '盘盈'),
        ('loss', '盘亏'),
        ('none', '无差异'),
    ]

    task = models.ForeignKey(StockCountTask, on_delete=models.CASCADE, related_name='items', verbose_name='盘点任务')
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, verbose_name='关联库存')
    material_code = models.CharField(max_length=50, verbose_name='物料编号')
    material_name = models.CharField(max_length=100, verbose_name='物料名称')
    book_qty = models.IntegerField(verbose_name='账面数量')
    real_qty = models.IntegerField(null=True, blank=True, verbose_name='实盘数量')
    diff_qty = models.IntegerField(default=0, verbose_name='差异数量')
    diff_type = models.CharField(max_length=10, choices=DIFF_TYPE_CHOICES, default='none', verbose_name='差异类型')
    remark = models.TextField(blank=True, default='', verbose_name='备注')
    operator = models.CharField(max_length=50, blank=True, default='', verbose_name='操作人')
    operated_at = models.DateTimeField(null=True, blank=True, verbose_name='操作时间')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        db_table = 'stock_count_item'
        verbose_name = '盘点明细'
        verbose_name_plural = verbose_name
        ordering = ['id']

    def __str__(self):
        return f"{self.task.task_no} - {self.material_code}"

    @property
    def diff_type_display(self):
        return dict(self.DIFF_TYPE_CHOICES).get(self.diff_type, '')
