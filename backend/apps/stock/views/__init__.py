"""
库存模块视图包
导出所有视图函数供 urls.py 使用
"""

# 库存核心视图
from .stock import (
    stock_init_view,
    stock_list_view,
    stock_detail_view,
)

# 入库管理视图
from .stock_in import (
    stock_in_create_view,
    stock_in_list_view,
    stock_in_detail_view,
    stock_in_update_view,
    stock_in_delete_view,
)

# 出库管理视图
from .stock_out import (
    stock_out_create_view,
    stock_out_list_view,
    stock_out_detail_view,
    stock_out_update_view,
    stock_out_delete_view,
)

# 预警管理视图
from .warning import (
    warning_list_view,
    warning_statistics_view,
    warning_check_view,
)

# 盘点管理视图
from .stock_count import (
    stock_count_task_create_view,
    stock_count_task_list_view,
    stock_count_task_detail_view,
    stock_count_item_submit_view,
    stock_count_task_complete_view,
    stock_count_task_cancel_view,
)

# 统计分析视图
from .statistics import (
    statistics_overview_view,
    statistics_trend_view,
    statistics_ranking_view,
    statistics_category_view,
)

# 月报视图
from .monthly_report import (
    monthly_report_list_view,
    monthly_report_detail_view,
)
