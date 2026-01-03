"""
预警管理视图
"""
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_GET
from django.db.models import Q
from django.core.paginator import Paginator

from ..models import Stock, StockWarning
from ..utils import (
    json_response, parse_json_body,
    WARNING_TYPE_DISPLAY, LEVEL_DISPLAY
)
from apps.accounts.permissions import require_permission


@csrf_exempt
@require_GET
@require_permission('stock_warning:view')
def warning_list_view(request):
    """预警列表"""
    page = int(request.GET.get("page", 1))
    page_size = int(request.GET.get("page_size", 10))
    search = request.GET.get("search", "").strip()
    warning_type = request.GET.get("warning_type", "").strip()
    level = request.GET.get("level", "").strip()

    queryset = StockWarning.objects.all()
    if search:
        queryset = queryset.filter(
            Q(material_code__icontains=search) | Q(material_name__icontains=search)
        )
    if warning_type:
        queryset = queryset.filter(warning_type=warning_type)
    if level:
        queryset = queryset.filter(level=level)

    paginator = Paginator(queryset, page_size)
    page_obj = paginator.get_page(page)

    warning_list = [{
        "id": item.id,
        "material_code": item.material_code,
        "material_name": item.material_name,
        "warning_type": item.warning_type,
        "warning_type_display": WARNING_TYPE_DISPLAY.get(item.warning_type, ''),
        "level": item.level,
        "level_display": LEVEL_DISPLAY.get(item.level, ''),
        "current_stock": item.current_stock,
        "min_stock": item.min_stock,
        "max_stock": item.max_stock,
        "created_at": item.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
    } for item in page_obj]

    return json_response(data={
        "total": paginator.count,
        "page": page,
        "page_size": page_size,
        "list": warning_list
    })


@csrf_exempt
@require_GET
@require_permission('stock_warning:view')
def warning_statistics_view(request):
    """预警统计"""
    return json_response(data={
        "by_type": {
            "low": StockWarning.objects.filter(warning_type='low').count(),
            "high": StockWarning.objects.filter(warning_type='high').count()
        },
        "by_level": {
            "warning": StockWarning.objects.filter(level='warning').count(),
            "danger": StockWarning.objects.filter(level='danger').count()
        },
        "by_status": {
            "pending": StockWarning.objects.filter(status='pending').count(),
            "handled": StockWarning.objects.filter(status='handled').count(),
            "ignored": StockWarning.objects.filter(status='ignored').count()
        },
        "total": StockWarning.objects.count(),
    })


@csrf_exempt
@require_POST
@require_permission('stock_warning:check')
def warning_check_view(request):
    """检查预警"""
    new_warnings = []
    cleared_warnings = []

    # 清理库存已恢复正常的预警记录
    for warning in StockWarning.objects.select_related('stock').all():
        stock = warning.stock
        is_normal = True

        if warning.warning_type == 'low':
            if stock.min_stock > 0 and stock.current_stock <= stock.min_stock:
                is_normal = False
        elif warning.warning_type == 'high':
            if stock.max_stock > 0 and stock.current_stock >= stock.max_stock:
                is_normal = False

        if is_normal:
            cleared_warnings.append({
                "id": warning.id,
                "material_code": warning.material_code,
                "type": warning.warning_type
            })
            warning.delete()

    # 检查并创建或更新预警
    for stock in Stock.objects.filter(status='active'):
        # 低库存预警
        if stock.min_stock > 0 and stock.current_stock <= stock.min_stock:
            existing = StockWarning.objects.filter(stock=stock, warning_type='low').first()
            level = 'danger' if stock.current_stock == 0 or stock.current_stock < stock.min_stock * 0.5 else 'warning'
            if existing:
                existing.current_stock = stock.current_stock
                existing.level = level
                existing.save()
            else:
                w = StockWarning.objects.create(
                    stock=stock, material_code=stock.material_code,
                    material_name=stock.material_name,
                    warning_type='low', level=level,
                    current_stock=stock.current_stock,
                    min_stock=stock.min_stock, max_stock=stock.max_stock,
                )
                new_warnings.append({
                    "id": w.id,
                    "material_code": w.material_code,
                    "type": "low"
                })

        # 高库存预警
        if stock.max_stock > 0 and stock.current_stock >= stock.max_stock:
            existing = StockWarning.objects.filter(stock=stock, warning_type='high').first()
            level = 'danger' if stock.current_stock > stock.max_stock * 1.1 else 'warning'
            if existing:
                existing.current_stock = stock.current_stock
                existing.level = level
                existing.save()
            else:
                w = StockWarning.objects.create(
                    stock=stock, material_code=stock.material_code,
                    material_name=stock.material_name,
                    warning_type='high', level=level,
                    current_stock=stock.current_stock,
                    min_stock=stock.min_stock, max_stock=stock.max_stock,
                )
                new_warnings.append({
                    "id": w.id,
                    "material_code": w.material_code,
                    "type": "high"
                })

    return json_response(
        data={
            "new_count": len(new_warnings),
            "new_warnings": new_warnings,
            "cleared_count": len(cleared_warnings),
            "cleared_warnings": cleared_warnings
        },
        message=f"检查完成，新增 {len(new_warnings)} 条预警，清理 {len(cleared_warnings)} 条已恢复正常的预警"
    )
