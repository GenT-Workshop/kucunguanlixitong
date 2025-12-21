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
    warning_list_view,
    warning_handle_view,
    warning_statistics_view,
    warning_check_view,
    stock_count_task_create_view,
    stock_count_task_list_view,
    stock_count_task_detail_view,
    stock_count_item_submit_view,
    stock_count_task_complete_view,
    stock_count_task_cancel_view,
    statistics_overview_view,
    statistics_trend_view,
    statistics_ranking_view,
    statistics_category_view,
    monthly_report_list_view,
    monthly_report_detail_view,
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
    # 预警接口
    path("warnings/", warning_list_view, name="warning_list"),
    path("warnings/<int:pk>/handle/", warning_handle_view, name="warning_handle"),
    path("warnings/statistics/", warning_statistics_view, name="warning_statistics"),
    path("warnings/check/", warning_check_view, name="warning_check"),
    # 盘点接口
    path("stock-count/tasks/", stock_count_task_list_view, name="stock_count_task_list"),
    path("stock-count/tasks/create/", stock_count_task_create_view, name="stock_count_task_create"),
    path("stock-count/tasks/<int:pk>/", stock_count_task_detail_view, name="stock_count_task_detail"),
    path("stock-count/tasks/<int:pk>/complete/", stock_count_task_complete_view, name="stock_count_task_complete"),
    path("stock-count/tasks/<int:pk>/cancel/", stock_count_task_cancel_view, name="stock_count_task_cancel"),
    path("stock-count/items/submit/", stock_count_item_submit_view, name="stock_count_item_submit"),
    # 统计分析接口
    path("statistics/overview/", statistics_overview_view, name="statistics_overview"),
    path("statistics/trend/", statistics_trend_view, name="statistics_trend"),
    path("statistics/ranking/", statistics_ranking_view, name="statistics_ranking"),
    path("statistics/category/", statistics_category_view, name="statistics_category"),
    # 月底结存接口
    path("monthly-report/", monthly_report_list_view, name="monthly_report_list"),
    path("monthly-report/detail/", monthly_report_detail_view, name="monthly_report_detail"),
]
