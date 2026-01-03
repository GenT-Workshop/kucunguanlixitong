"""
出库管理视图
"""
from decimal import Decimal
from datetime import datetime

from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_GET, require_http_methods
from django.db.models import F, Q
from django.core.paginator import Paginator
from django.db import transaction
from django.shortcuts import get_object_or_404

from ..models import Stock, StockOut
from ..utils import (
    json_response, json_error, parse_json_body,
    generate_bill_no, get_stock_status, OUT_TYPE_DISPLAY
)
from apps.accounts.permissions import require_permission


@csrf_exempt
@require_POST
@require_permission('stock_out:create')
def stock_out_create_view(request):
    """创建出库记录"""
    payload = parse_json_body(request)
    if payload is None:
        return json_error("请求体需要是 JSON", 400)

    material_code = (payload.get("material_code") or "").strip()
    out_quantity = payload.get("out_quantity")
    out_value = payload.get("out_value")
    out_type = (payload.get("out_type") or "").strip()
    out_time_str = payload.get("out_time")
    operator = (payload.get("operator") or "").strip()
    remark = (payload.get("remark") or "").strip()

    if not material_code:
        return json_error("物料编号不能为空", 400)
    if out_quantity is None or out_quantity <= 0:
        return json_error("出库数量必须大于0", 400)
    if out_value is None:
        return json_error("出库价值不能为空", 400)

    valid_out_types = ('production', 'sales', 'other', 'adjust_loss')
    if out_type not in valid_out_types:
        return json_error(f"出库类型无效", 400)

    stock = get_object_or_404(Stock, material_code=material_code)

    if stock.current_stock < out_quantity:
        return json_error(f"库存不足，当前库存量为{stock.current_stock}", 400)

    if out_time_str:
        try:
            out_time = datetime.fromisoformat(out_time_str.replace("Z", "+00:00"))
        except ValueError:
            out_time = datetime.now()
    else:
        out_time = datetime.now()

    bill_prefix = "ADJ" if out_type == 'adjust_loss' else "OUT"
    bill_no = generate_bill_no(bill_prefix, StockOut)

    with transaction.atomic():
        stock_out = StockOut.objects.create(
            bill_no=bill_no, stock=stock, material_code=material_code,
            material_name=stock.material_name, out_time=out_time,
            out_quantity=out_quantity, out_value=Decimal(str(out_value)),
            out_type=out_type, operator=operator, remark=remark,
        )
        Stock.objects.filter(pk=stock.pk).update(
            current_stock=F('current_stock') - out_quantity,
            stock_value=F('stock_value') - Decimal(str(out_value)),
        )

    stock.refresh_from_db()
    stock_status = get_stock_status(stock)
    message = "出库成功"
    if stock_status == 'low':
        message += f"，警告：当前库存({stock.current_stock})已低于最小库存量({stock.min_stock})"

    return json_response(
        data={
            "id": stock_out.id,
            "bill_no": stock_out.bill_no,
            "material_code": stock_out.material_code,
            "out_quantity": stock_out.out_quantity,
            "current_stock": stock.current_stock,
        },
        message=message
    )


@csrf_exempt
@require_GET
@require_permission('stock_out:view')
def stock_out_list_view(request):
    """出库列表"""
    page = int(request.GET.get("page", 1))
    page_size = int(request.GET.get("page_size", 10))
    search = request.GET.get("search", "").strip()
    out_type = request.GET.get("out_type", "").strip()
    bill_no = request.GET.get("bill_no", "").strip()
    operator = request.GET.get("operator", "").strip()
    start_time = request.GET.get("start_time")
    end_time = request.GET.get("end_time")

    queryset = StockOut.objects.all()
    if search:
        queryset = queryset.filter(
            Q(material_code__icontains=search) | Q(material_name__icontains=search)
        )
    if out_type:
        queryset = queryset.filter(out_type=out_type)
    if bill_no:
        queryset = queryset.filter(bill_no__icontains=bill_no)
    if operator:
        queryset = queryset.filter(operator__icontains=operator)
    if start_time:
        queryset = queryset.filter(out_time__gte=start_time)
    if end_time:
        queryset = queryset.filter(out_time__lte=end_time)

    paginator = Paginator(queryset, page_size)
    page_obj = paginator.get_page(page)

    stock_out_list = [{
        "id": item.id,
        "bill_no": item.bill_no,
        "material_code": item.material_code,
        "material_name": item.material_name,
        "out_time": item.out_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "out_quantity": item.out_quantity,
        "out_value": str(item.out_value),
        "out_type": item.out_type,
        "out_type_display": OUT_TYPE_DISPLAY.get(item.out_type, item.out_type),
        "operator": item.operator,
    } for item in page_obj]

    return json_response(data={
        "total": paginator.count,
        "page": page,
        "page_size": page_size,
        "list": stock_out_list
    })


@csrf_exempt
@require_GET
@require_permission('stock_out:view')
def stock_out_detail_view(request, pk):
    """出库详情"""
    stock_out = get_object_or_404(StockOut, pk=pk)
    return json_response(data={
        "id": stock_out.id,
        "bill_no": stock_out.bill_no,
        "material_code": stock_out.material_code,
        "material_name": stock_out.material_name,
        "out_time": stock_out.out_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "out_quantity": stock_out.out_quantity,
        "out_value": str(stock_out.out_value),
        "out_type": stock_out.out_type,
        "out_type_display": OUT_TYPE_DISPLAY.get(stock_out.out_type, stock_out.out_type),
        "operator": stock_out.operator,
        "remark": stock_out.remark,
        "created_at": stock_out.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
    })


@csrf_exempt
@require_http_methods(["PUT"])
@require_permission('stock_out:update')
def stock_out_update_view(request, pk):
    """编辑出库记录"""
    payload = parse_json_body(request)
    if payload is None:
        return json_error("请求体需要是 JSON", 400)

    stock_out = get_object_or_404(StockOut, pk=pk)
    old_quantity = stock_out.out_quantity
    old_value = stock_out.out_value

    new_quantity = payload.get("out_quantity")
    new_value = payload.get("out_value")
    out_type = payload.get("out_type")
    operator = payload.get("operator")
    remark = payload.get("remark")

    quantity_diff = 0
    value_diff = Decimal('0')

    if new_quantity is not None and new_quantity != old_quantity:
        if new_quantity <= 0:
            return json_error("出库数量必须大于0", 400)
        quantity_diff = new_quantity - old_quantity
        stock_out.out_quantity = new_quantity

    if new_value is not None:
        new_value_decimal = Decimal(str(new_value))
        value_diff = new_value_decimal - old_value
        stock_out.out_value = new_value_decimal

    if out_type is not None:
        stock_out.out_type = out_type
    if operator is not None:
        stock_out.operator = operator
    if remark is not None:
        stock_out.remark = remark

    stock = stock_out.stock
    if quantity_diff > 0 and stock.current_stock < quantity_diff:
        return json_error("库存不足，无法增加出库数量", 400)

    with transaction.atomic():
        stock_out.save()
        if quantity_diff != 0 or value_diff != 0:
            Stock.objects.filter(pk=stock.pk).update(
                current_stock=F('current_stock') - quantity_diff,
                stock_value=F('stock_value') - value_diff,
            )

    return json_response(
        data={"id": stock_out.id, "bill_no": stock_out.bill_no},
        message="出库记录更新成功"
    )


@csrf_exempt
@require_http_methods(["DELETE"])
@require_permission('stock_out:delete')
def stock_out_delete_view(request, pk):
    """删除出库记录"""
    stock_out = get_object_or_404(StockOut, pk=pk)
    with transaction.atomic():
        Stock.objects.filter(pk=stock_out.stock_id).update(
            current_stock=F('current_stock') + stock_out.out_quantity,
            stock_value=F('stock_value') + stock_out.out_value,
        )
        stock_out.delete()
    return json_response(message="撤销成功，库存已恢复")
