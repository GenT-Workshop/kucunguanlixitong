from django.urls import path

from .views import (
    stock_init_view,
    stock_list_view,
    stock_detail_view,
    stock_in_create_view,
    stock_in_list_view,
    stock_in_detail_view,
    stock_in_delete_view,
    stock_out_create_view,
    stock_out_list_view,
    stock_out_detail_view,
    stock_out_delete_view,
)

urlpatterns = [
    # 库存接口
    path("stock/init/", stock_init_view, name="stock_init"),
    path("stock/", stock_list_view, name="stock_list"),
    path("stock/<int:pk>/", stock_detail_view, name="stock_detail"),
    # 入库接口
    path("stock-in/", stock_in_list_view, name="stock_in_list"),
    path("stock-in/create/", stock_in_create_view, name="stock_in_create"),
    path("stock-in/<int:pk>/", stock_in_detail_view, name="stock_in_detail"),
    path("stock-in/<int:pk>/delete/", stock_in_delete_view, name="stock_in_delete"),
    # 出库接口
    path("stock-out/", stock_out_list_view, name="stock_out_list"),
    path("stock-out/create/", stock_out_create_view, name="stock_out_create"),
    path("stock-out/<int:pk>/", stock_out_detail_view, name="stock_out_detail"),
    path("stock-out/<int:pk>/delete/", stock_out_delete_view, name="stock_out_delete"),
]
