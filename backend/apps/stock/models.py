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


class StockIn(models.Model):
    """入库表"""
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, verbose_name='关联库存')
    material_code = models.CharField(max_length=50, verbose_name='物料编号')
    material_name = models.CharField(max_length=100, verbose_name='物料名称')
    in_time = models.DateTimeField(verbose_name='入库时间')
    in_quantity = models.IntegerField(verbose_name='入库数量')
    in_value = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='入库价值')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        db_table = 'stock_in'
        verbose_name = '入库记录'
        verbose_name_plural = verbose_name
        ordering = ['-in_time']

    def __str__(self):
        return f"{self.material_code} - {self.in_quantity}"


class StockOut(models.Model):
    """出库表"""
    OUT_TYPE_CHOICES = [
        ('production', '生产领料'),
        ('sales', '销售提货'),
        ('other', '其他出库'),
    ]

    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, verbose_name='关联库存')
    material_code = models.CharField(max_length=50, verbose_name='物料编号')
    material_name = models.CharField(max_length=100, verbose_name='物料名称')
    out_time = models.DateTimeField(verbose_name='出库时间')
    out_quantity = models.IntegerField(verbose_name='出库数量')
    out_value = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='出库价值')
    out_type = models.CharField(max_length=20, choices=OUT_TYPE_CHOICES, verbose_name='出库类型')
    operator = models.CharField(max_length=50, blank=True, verbose_name='操作人')
    remark = models.TextField(blank=True, verbose_name='备注')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        db_table = 'stock_out'
        verbose_name = '出库记录'
        verbose_name_plural = verbose_name
        ordering = ['-out_time']

    def __str__(self):
        return f"{self.material_code} - {self.out_quantity}"
