"""
入库管理视图
"""
from decimal import Decimal
from datetime import datetime

from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_GET, require_http_methods
from django.db.models import F, Q
from django.core.paginator import Paginator
from django.db import transaction
from django.shortcuts import get_object_or_404

from ..models import Stock, StockIn
from ..utils import (
    json_response, json_error, parse_json_body,
    generate_bill_no, get_stock_status
)
from apps.accounts.permissions import require_permission


@csrf_exempt
@require_POST
@require_permission('stock_in:create')
def stock_in_create_view(request):
    """创建入库记录"""
    payload = parse_json_body(request)
    if payload is None:
        return json_error("请求体需要是 JSON", 400)

    material_code = (payload.get("material_code") or "").strip()
    in_quantity = payload.get("in_quantity")
    in_value = payload.get("in_value")
    in_time_str = payload.get("in_time")
    in_type = (payload.get("in_type") or "purchase").strip()
    operator = (payload.get("operator") or "").strip()
    remark = (payload.get("remark") or "").strip()
    supplier = (payload.get("supplier") or "").strip()

    if not material_code:
        return json_error("物料编号不能为空", 400)
    if in_quantity is None or in_quantity <= 0:
        return json_error("入库数量必须大于0", 400)
    if in_value is None:
        return json_error("入库价值不能为空", 400)

    valid_in_types = ('purchase', 'production', 'return', 'other', 'adjust_gain')
    if in_type not in valid_in_types:
        return json_error(f"入库类型无效，必须是 {'/'.join(valid_in_types)}", 400)

    stock = get_object_or_404(Stock, material_code=material_code)

    if in_type != 'adjust_gain' and stock.max_stock > 0:
        if stock.current_stock >= stock.max_stock:
            return json_error(f"当前库存({stock.current_stock})已达到或超过最大库存量({stock.max_stock})，禁止入库", 400)
        if stock.current_stock + in_quantity > stock.max_stock:
            return json_error(f"入库后将超过最大库存量({stock.max_stock})", 400)

    if in_time_str:
        try:
            in_time = datetime.fromisoformat(in_time_str.replace("Z", "+00:00"))
        except ValueError:
            in_time = datetime.now()
    else:
        in_time = datetime.now()

    bill_prefix = "ADJ" if in_type == 'adjust_gain' else "IN"
    bill_no = generate_bill_no(bill_prefix, StockIn)

    with transaction.atomic():
        stock_in = StockIn.objects.create(
            bill_no=bill_no, stock=stock, material_code=material_code,
            material_name=stock.material_name, supplier=supplier or stock.supplier,
            in_time=in_time, in_quantity=in_quantity, in_value=Decimal(str(in_value)),
            in_type=in_type, operator=operator, remark=remark,
        )
        Stock.objects.filter(pk=stock.pk).update(
            current_stock=F('current_stock') + in_quantity,
            stock_value=F('stock_value') + Decimal(str(in_value)),
        )

    stock.refresh_from_db()
    stock_status = get_stock_status(stock)
    message = "入库成功"
    if stock_status == 'low':
        message += f"，提示：当前库存({stock.current_stock})低于最小库存量({stock.min_stock})，建议补货"

    return json_response(
        data={
            "id": stock_in.id,
            "bill_no": stock_in.bill_no,
            "material_code": stock_in.material_code,
            "material_name": stock_in.material_name,
            "in_quantity": stock_in.in_quantity,
            "in_value": str(stock_in.in_value),
            "in_type": stock_in.in_type,
            "in_type_display": dict(StockIn.IN_TYPE_CHOICES).get(stock_in.in_type, '其他入库'),
            "current_stock": stock.current_stock,
            "stock_status": stock_status,
        },
        message=message
    )


@csrf_exempt
@require_GET
@require_permission('stock_in:view')
def stock_in_list_view(request):
    """入库列表"""
    page = int(request.GET.get("page", 1))
    page_size = int(request.GET.get("page_size", 10))
    search = request.GET.get("search", "").strip()
    in_type = request.GET.get("in_type", "").strip()
    supplier = request.GET.get("supplier", "").strip()
    bill_no = request.GET.get("bill_no", "").strip()
    operator = request.GET.get("operator", "").strip()
    start_time = request.GET.get("start_time")
    end_time = request.GET.get("end_time")

    queryset = StockIn.objects.all()
    if search:
        queryset = queryset.filter(Q(material_code__icontains=search) | Q(material_name__icontains=search))
    if in_type:
        queryset = queryset.filter(in_type=in_type)
    if supplier:
        queryset = queryset.filter(supplier__icontains=supplier)
    if bill_no:
        queryset = queryset.filter(bill_no__icontains=bill_no)
    if operator:
        queryset = queryset.filter(operator__icontains=operator)
    if start_time:
        queryset = queryset.filter(in_time__gte=start_time)
    if end_time:
        queryset = queryset.filter(in_time__lte=end_time)

    paginator = Paginator(queryset, page_size)
    page_obj = paginator.get_page(page)

    stock_in_list = [{
        "id": item.id,
        "bill_no": item.bill_no,
        "material_code": item.material_code,
        "material_name": item.material_name,
        "supplier": item.supplier,
        "in_time": item.in_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "in_quantity": item.in_quantity,
        "in_value": str(item.in_value),
        "in_type": item.in_type,
        "in_type_display": dict(StockIn.IN_TYPE_CHOICES).get(item.in_type, '其他入库'),
        "operator": item.operator,
    } for item in page_obj]

    return json_response(data={
        "total": paginator.count,
        "page": page,
        "page_size": page_size,
        "list": stock_in_list
    })


@csrf_exempt
@require_GET
@require_permission('stock_in:view')
def stock_in_detail_view(request, pk):
    """入库详情"""
    stock_in = get_object_or_404(StockIn, pk=pk)
    return json_response(data={
        "id": stock_in.id,
        "bill_no": stock_in.bill_no,
        "material_code": stock_in.material_code,
        "material_name": stock_in.material_name,
        "supplier": stock_in.supplier,
        "in_time": stock_in.in_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "in_quantity": stock_in.in_quantity,
        "in_value": str(stock_in.in_value),
        "in_type": stock_in.in_type,
        "in_type_display": dict(StockIn.IN_TYPE_CHOICES).get(stock_in.in_type, '其他入库'),
        "operator": stock_in.operator,
        "remark": stock_in.remark,
        "created_at": stock_in.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
    })


@csrf_exempt
@require_http_methods(["PUT"])
@require_permission('stock_in:update')
def stock_in_update_view(request, pk):
    """编辑入库记录"""
    payload = parse_json_body(request)
    if payload is None:
        return json_error("请求体需要是 JSON", 400)

    stock_in = get_object_or_404(StockIn, pk=pk)
    old_quantity = stock_in.in_quantity
    old_value = stock_in.in_value

    new_quantity = payload.get("in_quantity")
    new_value = payload.get("in_value")
    in_type = payload.get("in_type")
    operator = payload.get("operator")
    remark = payload.get("remark")
    supplier = payload.get("supplier")

    quantity_diff = 0
    value_diff = Decimal('0')

    if new_quantity is not None and new_quantity != old_quantity:
        if new_quantity <= 0:
            return json_error("入库数量必须大于0", 400)
        quantity_diff = new_quantity - old_quantity
        stock_in.in_quantity = new_quantity

    if new_value is not None:
        new_value_decimal = Decimal(str(new_value))
        value_diff = new_value_decimal - old_value
        stock_in.in_value = new_value_decimal

    if in_type is not None:
        stock_in.in_type = in_type
    if operator is not None:
        stock_in.operator = operator
    if remark is not None:
        stock_in.remark = remark
    if supplier is not None:
        stock_in.supplier = supplier

    stock = stock_in.stock
    if quantity_diff < 0 and stock.current_stock + quantity_diff < 0:
        return json_error("修改后库存将变为负数", 400)

    with transaction.atomic():
        stock_in.save()
        if quantity_diff != 0 or value_diff != 0:
            Stock.objects.filter(pk=stock.pk).update(
                current_stock=F('current_stock') + quantity_diff,
                stock_value=F('stock_value') + value_diff,
            )

    return json_response(
        data={"id": stock_in.id, "bill_no": stock_in.bill_no},
        message="入库记录更新成功"
    )


@csrf_exempt
@require_http_methods(["DELETE"])
@require_permission('stock_in:delete')
def stock_in_delete_view(request, pk):
    """删除入库记录"""
    stock_in = get_object_or_404(StockIn, pk=pk)
    stock = stock_in.stock
    if stock.current_stock < stock_in.in_quantity:
        return json_error(f"撤销失败：撤销后库存将变为负数", 400)

    with transaction.atomic():
        Stock.objects.filter(pk=stock_in.stock_id).update(
            current_stock=F('current_stock') - stock_in.in_quantity,
            stock_value=F('stock_value') - stock_in.in_value,
        )
        stock_in.delete()
    return json_response(message="撤销成功，库存已扣减")
