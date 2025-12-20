from django.db import models


class Stock(models.Model):
    """库存表"""
    material_code = models.CharField(max_length=50, unique=True, verbose_name='物料编号')
    material_name = models.CharField(max_length=100, verbose_name='物料名称')
    max_stock = models.IntegerField(default=0, verbose_name='最大库存量')
    min_stock = models.IntegerField(default=0, verbose_name='最小库存量')
    current_stock = models.IntegerField(default=0, verbose_name='当前库存量')
    stock_value = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='库存价值')
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
    ]

    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, verbose_name='关联库存')
    material_code = models.CharField(max_length=50, verbose_name='物料编号')
    material_name = models.CharField(max_length=100, verbose_name='物料名称')
    in_time = models.DateTimeField(verbose_name='入库时间')
    in_quantity = models.IntegerField(verbose_name='入库数量')
    in_value = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='入库价值')
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
