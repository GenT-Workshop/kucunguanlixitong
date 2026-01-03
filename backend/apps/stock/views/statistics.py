"""
统计分析视图
"""
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET
from django.db.models import Sum, Count
from django.db.models.functions import TruncDate
from django.utils import timezone

from ..models import Stock, StockIn, StockOut, StockWarning
from ..utils import json_response
from apps.accounts.permissions import require_permission


@csrf_exempt
@require_GET
@require_permission('statistics:view')
def statistics_overview_view(request):
    """统计概览"""
    active_stocks = Stock.objects.filter(status='active')
    stock_stats = active_stocks.aggregate(
        total_count=Count('id'),
        total_value=Sum('stock_value'),
        total_qty=Sum('current_stock'),
    )

    # 计算库存状态分布
    low_count = 0
    normal_count = 0
    high_count = 0
    for s in active_stocks:
        if s.current_stock < s.min_stock:
            low_count += 1
        elif s.current_stock > s.max_stock:
            high_count += 1
        else:
            normal_count += 1

    stock_stats['status_distribution'] = {
        'low': low_count,
        'normal': normal_count,
        'high': high_count
    }

    today = timezone.now().date()
    today_in = StockIn.objects.filter(in_time__date=today).aggregate(
        count=Count('id'),
        qty=Sum('in_quantity'),
        value=Sum('in_value'),
    )
    today_out = StockOut.objects.filter(out_time__date=today).aggregate(
        count=Count('id'),
        qty=Sum('out_quantity'),
        value=Sum('out_value'),
    )

    return json_response(data={
        "stock": stock_stats,
        "today_in": today_in,
        "today_out": today_out,
        "pending_warnings": StockWarning.objects.filter(status='pending').count(),
    })


@csrf_exempt
@require_GET
@require_permission('statistics:view')
def statistics_trend_view(request):
    """出入库趋势"""
    days = int(request.GET.get("days", 7))
    end_date = timezone.now().date()
    start_date = end_date - timezone.timedelta(days=days - 1)

    in_trend = list(StockIn.objects.filter(in_time__date__gte=start_date).annotate(
        date=TruncDate('in_time')).values('date').annotate(
        qty=Sum('in_quantity'), value=Sum('in_value')).order_by('date'))

    out_trend = list(StockOut.objects.filter(out_time__date__gte=start_date).annotate(
        date=TruncDate('out_time')).values('date').annotate(
        qty=Sum('out_quantity'), value=Sum('out_value')).order_by('date'))

    return json_response(data={"in_trend": in_trend, "out_trend": out_trend})


@csrf_exempt
@require_GET
@require_permission('statistics:view')
def statistics_ranking_view(request):
    """物料排行"""
    rank_type = request.GET.get("type", "in")
    limit = int(request.GET.get("limit", 10))

    if rank_type == "in":
        ranking = list(StockIn.objects.values('material_code', 'material_name').annotate(
            total_qty=Sum('in_quantity')).order_by('-total_qty')[:limit])
    else:
        ranking = list(StockOut.objects.values('material_code', 'material_name').annotate(
            total_qty=Sum('out_quantity')).order_by('-total_qty')[:limit])

    for idx, item in enumerate(ranking, 1):
        item['rank'] = idx

    return json_response(data={"list": ranking})


@csrf_exempt
@require_GET
@require_permission('statistics:view')
def statistics_category_view(request):
    """分类统计"""
    stats = list(Stock.objects.filter(status='active').values('category').annotate(
        count=Count('id'),
        total_qty=Sum('current_stock'),
        total_value=Sum('stock_value'),
    ).order_by('-total_value'))
    return json_response(data=stats)
