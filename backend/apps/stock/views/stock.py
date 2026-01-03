"""
库存核心管理视图
"""
from decimal import Decimal

from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_GET
from django.db.models import Q
from django.core.paginator import Paginator
from django.shortcuts import get_object_or_404

from ..models import Stock
from ..utils import (
    json_response, json_error, parse_json_body,
    get_stock_status, STOCK_STATUS_DISPLAY
)
from apps.accounts.permissions import require_permission


@csrf_exempt
@require_POST
@require_permission('material:create')
def stock_init_view(request):
    """初始化物料/创建库存"""
    payload = parse_json_body(request)
    if payload is None:
        return json_error("请求体需要是 JSON", 400)

    material_code = (payload.get("material_code") or "").strip()
    material_name = (payload.get("material_name") or "").strip()
    spec = (payload.get("spec") or "").strip()
    unit = (payload.get("unit") or "").strip()
    category = (payload.get("category") or "").strip()
    supplier = (payload.get("supplier") or "").strip()
    max_stock = payload.get("max_stock", 0)
    min_stock = payload.get("min_stock", 0)
    stock_value = payload.get("stock_value", 0)

    if not material_code:
        return json_error("物料编号不能为空", 400)
    if not material_name:
        return json_error("物料名称不能为空", 400)
    if Stock.objects.filter(material_code=material_code).exists():
        return json_error("物料编号已存在", 400)

    stock = Stock.objects.create(
        material_code=material_code, material_name=material_name, spec=spec,
        unit=unit, category=category, supplier=supplier,
        max_stock=max_stock, min_stock=min_stock, stock_value=Decimal(str(stock_value)),
    )

    return json_response(
        data={
            "id": stock.id,
            "material_code": stock.material_code,
            "material_name": stock.material_name,
            "current_stock": stock.current_stock,
            "created_at": stock.created_at.strftime("%Y-%m-%dT%H:%M:%SZ")
        },
        message="物料初始化成功"
    )


@csrf_exempt
@require_GET
@require_permission('stock_query:view')
def stock_list_view(request):
    """库存列表"""
    page = int(request.GET.get("page", 1))
    page_size = int(request.GET.get("page_size", 10))
    search = request.GET.get("search", "").strip()
    supplier = request.GET.get("supplier", "").strip()
    category = request.GET.get("category", "").strip()
    status = request.GET.get("status", "").strip()
    stock_status = request.GET.get("stock_status", "").strip()

    queryset = Stock.objects.all()
    if search:
        queryset = queryset.filter(Q(material_code__icontains=search) | Q(material_name__icontains=search))
    if supplier:
        queryset = queryset.filter(supplier__icontains=supplier)
    if category:
        queryset = queryset.filter(category__icontains=category)
    if status:
        queryset = queryset.filter(status=status)

    paginator = Paginator(queryset, page_size)
    page_obj = paginator.get_page(page)

    stock_list = []
    for stock in page_obj:
        s_status = get_stock_status(stock)
        if stock_status and s_status != stock_status:
            continue
        stock_list.append({
            "id": stock.id,
            "material_code": stock.material_code,
            "material_name": stock.material_name,
            "spec": stock.spec,
            "unit": stock.unit,
            "category": stock.category,
            "supplier": stock.supplier,
            "max_stock": stock.max_stock,
            "min_stock": stock.min_stock,
            "current_stock": stock.current_stock,
            "unit_price": str(stock.unit_price),
            "stock_value": str(stock.stock_value),
            "status": stock.status,
            "stock_status": s_status,
            "stock_status_display": STOCK_STATUS_DISPLAY.get(s_status, '正常'),
        })

    return json_response(data={
        "total": paginator.count,
        "page": page,
        "page_size": page_size,
        "list": stock_list
    })


@csrf_exempt
@require_GET
@require_permission('stock_query:view')
def stock_detail_view(request, pk):
    """库存详情"""
    stock = get_object_or_404(Stock, pk=pk)
    s_status = get_stock_status(stock)
    return json_response(data={
        "id": stock.id,
        "material_code": stock.material_code,
        "material_name": stock.material_name,
        "spec": stock.spec,
        "unit": stock.unit,
        "category": stock.category,
        "supplier": stock.supplier,
        "max_stock": stock.max_stock,
        "min_stock": stock.min_stock,
        "current_stock": stock.current_stock,
        "unit_price": str(stock.unit_price),
        "stock_value": str(stock.stock_value),
        "status": stock.status,
        "stock_status": s_status,
        "stock_status_display": STOCK_STATUS_DISPLAY.get(s_status, '正常'),
        "created_at": stock.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "updated_at": stock.updated_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
    })
