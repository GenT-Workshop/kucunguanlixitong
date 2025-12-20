from django.contrib import admin
from .models import Stock, StockIn


@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
    list_display = ['material_code', 'material_name', 'current_stock', 'max_stock', 'min_stock', 'stock_value', 'updated_at']
    search_fields = ['material_code', 'material_name']
    list_filter = ['created_at']


@admin.register(StockIn)
class StockInAdmin(admin.ModelAdmin):
    list_display = ['material_code', 'material_name', 'in_quantity', 'in_value', 'in_time']
    search_fields = ['material_code', 'material_name']
    list_filter = ['in_time']
