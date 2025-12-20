from django.urls import path
from .views import (
    StockInitView,
    StockListView,
    StockDetailView,
    StockInView,
    StockInDetailView
)

urlpatterns = [
    # 库存相关接口
    path('stock/init/', StockInitView.as_view(), name='stock-init'),
    path('stock/', StockListView.as_view(), name='stock-list'),
    path('stock/<int:pk>/', StockDetailView.as_view(), name='stock-detail'),

    # 入库相关接口 - GET获取列表，POST创建记录
    path('stock-in/', StockInView.as_view(), name='stock-in'),
    path('stock-in/<int:pk>/', StockInDetailView.as_view(), name='stock-in-detail'),
]
