import json
from decimal import Decimal
from datetime import datetime

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_GET, require_http_methods
from django.db.models import F, Q, Sum, Count
from django.db.models.functions import TruncDate, TruncMonth
from django.core.paginator import Paginator
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import Stock, StockIn, StockOut, StockWarning, StockCountTask, StockCountItem
from apps.accounts.permissions import require_permission, require_any_permission


def _json_response(data=None, message="success", code=200):
    return JsonResponse({"code": code, "message": message, "data": data}, status=code if code < 500 else 200)


def _json_error(message: str, code: int = 400):
    return _json_response(data=None, message=message, code=code)


def _parse_json_body(request):
    try:
        return json.loads(request.body.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        return None


def _generate_bill_no(prefix, model_class):
    today = timezone.now().strftime('%Y%m%d')
    prefix_str = f"{prefix}-{today}-"
    last_bill = model_class.objects.filter(bill_no__startswith=prefix_str).order_by('-bill_no').first()
    if last_bill:
        try:
            new_num = int(last_bill.bill_no.split('-')[-1]) + 1
        except (ValueError, IndexError):
            new_num = 1
    else:
        new_num = 1
    return f"{prefix_str}{new_num:04d}"


def _get_stock_status(stock):
    if stock.min_stock > 0 and stock.current_stock <= stock.min_stock:
        return 'low'
    elif stock.max_stock > 0 and stock.current_stock >= stock.max_stock:
        return 'high'
    return 'normal'


STOCK_STATUS_DISPLAY = {'low': '库存不足', 'high': '库存过高', 'normal': '正常'}
OUT_TYPE_DISPLAY = {'production': '生产领料', 'sales': '销售提货', 'other': '其他出库', 'adjust_loss': '盘点盘亏'}
WARNING_TYPE_DISPLAY = {'low': '库存不足', 'high': '库存过高'}
LEVEL_DISPLAY = {'warning': '警告', 'danger': '危险'}
STATUS_DISPLAY = {'pending': '待处理', 'handled': '已处理', 'ignored': '已忽略'}
TASK_STATUS_DISPLAY = {'pending': '待盘点', 'doing': '盘点中', 'done': '已完成', 'cancelled': '已取消'}
DIFF_TYPE_DISPLAY = {'gain': '盘盈', 'loss': '盘亏', 'none': '无差异'}


@csrf_exempt
@require_POST
@require_permission('material:create')
def stock_init_view(request):
    payload = _parse_json_body(request)
    if payload is None:
        return _json_error("请求体需要是 JSON", 400)

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
        return _json_error("物料编号不能为空", 400)
    if not material_name:
        return _json_error("物料名称不能为空", 400)
    if Stock.objects.filter(material_code=material_code).exists():
        return _json_error("物料编号已存在", 400)

    stock = Stock.objects.create(
        material_code=material_code, material_name=material_name, spec=spec,
        unit=unit, category=category, supplier=supplier,
        max_stock=max_stock, min_stock=min_stock, stock_value=Decimal(str(stock_value)),
    )

    return _json_response(
        data={"id": stock.id, "material_code": stock.material_code, "material_name": stock.material_name,
              "current_stock": stock.current_stock, "created_at": stock.created_at.strftime("%Y-%m-%dT%H:%M:%SZ")},
        message="物料初始化成功"
    )


@csrf_exempt
@require_GET
@require_permission('stock_query:view')
def stock_list_view(request):
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
        s_status = _get_stock_status(stock)
        if stock_status and s_status != stock_status:
            continue
        stock_list.append({
            "id": stock.id, "material_code": stock.material_code, "material_name": stock.material_name,
            "spec": stock.spec, "unit": stock.unit, "category": stock.category, "supplier": stock.supplier,
            "max_stock": stock.max_stock, "min_stock": stock.min_stock, "current_stock": stock.current_stock,
            "unit_price": str(stock.unit_price), "stock_value": str(stock.stock_value), "status": stock.status,
            "stock_status": s_status, "stock_status_display": STOCK_STATUS_DISPLAY.get(s_status, '正常'),
        })

    return _json_response(data={"total": paginator.count, "page": page, "page_size": page_size, "list": stock_list})


@csrf_exempt
@require_GET
@require_permission('stock_query:view')
def stock_detail_view(request, pk):
    stock = get_object_or_404(Stock, pk=pk)
    s_status = _get_stock_status(stock)
    return _json_response(data={
        "id": stock.id, "material_code": stock.material_code, "material_name": stock.material_name,
        "spec": stock.spec, "unit": stock.unit, "category": stock.category, "supplier": stock.supplier,
        "max_stock": stock.max_stock, "min_stock": stock.min_stock, "current_stock": stock.current_stock,
        "unit_price": str(stock.unit_price), "stock_value": str(stock.stock_value), "status": stock.status,
        "stock_status": s_status, "stock_status_display": STOCK_STATUS_DISPLAY.get(s_status, '正常'),
        "created_at": stock.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "updated_at": stock.updated_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
    })


@csrf_exempt
@require_POST
@require_permission('stock_in:create')
def stock_in_create_view(request):
    payload = _parse_json_body(request)
    if payload is None:
        return _json_error("请求体需要是 JSON", 400)

    material_code = (payload.get("material_code") or "").strip()
    in_quantity = payload.get("in_quantity")
    in_value = payload.get("in_value")
    in_time_str = payload.get("in_time")
    in_type = (payload.get("in_type") or "purchase").strip()
    operator = (payload.get("operator") or "").strip()
    remark = (payload.get("remark") or "").strip()
    supplier = (payload.get("supplier") or "").strip()

    if not material_code:
        return _json_error("物料编号不能为空", 400)
    if in_quantity is None or in_quantity <= 0:
        return _json_error("入库数量必须大于0", 400)
    if in_value is None:
        return _json_error("入库价值不能为空", 400)

    valid_in_types = ('purchase', 'production', 'return', 'other', 'adjust_gain')
    if in_type not in valid_in_types:
        return _json_error(f"入库类型无效，必须是 {'/'.join(valid_in_types)}", 400)

    stock = get_object_or_404(Stock, material_code=material_code)

    if in_type != 'adjust_gain' and stock.max_stock > 0:
        if stock.current_stock >= stock.max_stock:
            return _json_error(f"当前库存({stock.current_stock})已达到或超过最大库存量({stock.max_stock})，禁止入库", 400)
        if stock.current_stock + in_quantity > stock.max_stock:
            return _json_error(f"入库后将超过最大库存量({stock.max_stock})", 400)

    if in_time_str:
        try:
            in_time = datetime.fromisoformat(in_time_str.replace("Z", "+00:00"))
        except ValueError:
            in_time = datetime.now()
    else:
        in_time = datetime.now()

    bill_prefix = "ADJ" if in_type == 'adjust_gain' else "IN"
    bill_no = _generate_bill_no(bill_prefix, StockIn)

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
    stock_status = _get_stock_status(stock)
    message = "入库成功"
    if stock_status == 'low':
        message += f"，提示：当前库存({stock.current_stock})低于最小库存量({stock.min_stock})，建议补货"

    return _json_response(
        data={
            "id": stock_in.id, "bill_no": stock_in.bill_no, "material_code": stock_in.material_code,
            "material_name": stock_in.material_name, "in_quantity": stock_in.in_quantity,
            "in_value": str(stock_in.in_value), "in_type": stock_in.in_type,
            "in_type_display": dict(StockIn.IN_TYPE_CHOICES).get(stock_in.in_type, '其他入库'),
            "current_stock": stock.current_stock, "stock_status": stock_status,
        },
        message=message
    )


@csrf_exempt
@require_GET
@require_permission('stock_in:view')
def stock_in_list_view(request):
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
        "id": item.id, "bill_no": item.bill_no, "material_code": item.material_code,
        "material_name": item.material_name, "supplier": item.supplier,
        "in_time": item.in_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "in_quantity": item.in_quantity, "in_value": str(item.in_value),
        "in_type": item.in_type,
        "in_type_display": dict(StockIn.IN_TYPE_CHOICES).get(item.in_type, '其他入库'),
        "operator": item.operator,
    } for item in page_obj]

    return _json_response(data={"total": paginator.count, "page": page, "page_size": page_size, "list": stock_in_list})


@csrf_exempt
@require_GET
@require_permission('stock_in:view')
def stock_in_detail_view(request, pk):
    stock_in = get_object_or_404(StockIn, pk=pk)
    return _json_response(data={
        "id": stock_in.id, "bill_no": stock_in.bill_no, "material_code": stock_in.material_code,
        "material_name": stock_in.material_name, "supplier": stock_in.supplier,
        "in_time": stock_in.in_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "in_quantity": stock_in.in_quantity, "in_value": str(stock_in.in_value),
        "in_type": stock_in.in_type,
        "in_type_display": dict(StockIn.IN_TYPE_CHOICES).get(stock_in.in_type, '其他入库'),
        "operator": stock_in.operator, "remark": stock_in.remark,
        "created_at": stock_in.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
    })


@csrf_exempt
@require_http_methods(["DELETE"])
@require_permission('stock_in:delete')
def stock_in_delete_view(request, pk):
    stock_in = get_object_or_404(StockIn, pk=pk)
    stock = stock_in.stock
    if stock.current_stock < stock_in.in_quantity:
        return _json_error(f"撤销失败：撤销后库存将变为负数", 400)

    with transaction.atomic():
        Stock.objects.filter(pk=stock_in.stock_id).update(
            current_stock=F('current_stock') - stock_in.in_quantity,
            stock_value=F('stock_value') - stock_in.in_value,
        )
        stock_in.delete()
    return _json_response(message="撤销成功，库存已扣减")


@csrf_exempt
@require_POST
@require_permission('stock_out:create')
def stock_out_create_view(request):
    payload = _parse_json_body(request)
    if payload is None:
        return _json_error("请求体需要是 JSON", 400)

    material_code = (payload.get("material_code") or "").strip()
    out_quantity = payload.get("out_quantity")
    out_value = payload.get("out_value")
    out_type = (payload.get("out_type") or "").strip()
    out_time_str = payload.get("out_time")
    operator = (payload.get("operator") or "").strip()
    remark = (payload.get("remark") or "").strip()

    if not material_code:
        return _json_error("物料编号不能为空", 400)
    if out_quantity is None or out_quantity <= 0:
        return _json_error("出库数量必须大于0", 400)
    if out_value is None:
        return _json_error("出库价值不能为空", 400)

    valid_out_types = ('production', 'sales', 'other', 'adjust_loss')
    if out_type not in valid_out_types:
        return _json_error(f"出库类型无效", 400)

    stock = get_object_or_404(Stock, material_code=material_code)

    if stock.current_stock < out_quantity:
        return _json_error(f"库存不足，当前库存量为{stock.current_stock}", 400)

    if out_time_str:
        try:
            out_time = datetime.fromisoformat(out_time_str.replace("Z", "+00:00"))
        except ValueError:
            out_time = datetime.now()
    else:
        out_time = datetime.now()

    bill_prefix = "ADJ" if out_type == 'adjust_loss' else "OUT"
    bill_no = _generate_bill_no(bill_prefix, StockOut)

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
    stock_status = _get_stock_status(stock)
    message = "出库成功"
    if stock_status == 'low':
        message += f"，警告：当前库存({stock.current_stock})已低于最小库存量({stock.min_stock})"

    return _json_response(
        data={
            "id": stock_out.id, "bill_no": stock_out.bill_no,
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
        queryset = queryset.filter(Q(material_code__icontains=search) | Q(material_name__icontains=search))
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
        "id": item.id, "bill_no": item.bill_no,
        "material_code": item.material_code, "material_name": item.material_name,
        "out_time": item.out_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "out_quantity": item.out_quantity, "out_value": str(item.out_value),
        "out_type": item.out_type,
        "out_type_display": OUT_TYPE_DISPLAY.get(item.out_type, item.out_type),
        "operator": item.operator,
    } for item in page_obj]

    return _json_response(data={"total": paginator.count, "page": page, "page_size": page_size, "list": stock_out_list})


@csrf_exempt
@require_GET
@require_permission('stock_out:view')
def stock_out_detail_view(request, pk):
    stock_out = get_object_or_404(StockOut, pk=pk)
    return _json_response(data={
        "id": stock_out.id, "bill_no": stock_out.bill_no,
        "material_code": stock_out.material_code, "material_name": stock_out.material_name,
        "out_time": stock_out.out_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "out_quantity": stock_out.out_quantity, "out_value": str(stock_out.out_value),
        "out_type": stock_out.out_type,
        "out_type_display": OUT_TYPE_DISPLAY.get(stock_out.out_type, stock_out.out_type),
        "operator": stock_out.operator, "remark": stock_out.remark,
        "created_at": stock_out.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
    })


@csrf_exempt
@require_http_methods(["DELETE"])
@require_permission('stock_out:delete')
def stock_out_delete_view(request, pk):
    stock_out = get_object_or_404(StockOut, pk=pk)
    with transaction.atomic():
        Stock.objects.filter(pk=stock_out.stock_id).update(
            current_stock=F('current_stock') + stock_out.out_quantity,
            stock_value=F('stock_value') + stock_out.out_value,
        )
        stock_out.delete()
    return _json_response(message="撤销成功，库存已恢复")


# ==================== 预警接口 ====================

@csrf_exempt
@require_GET
@require_permission('stock_warning:view')
def warning_list_view(request):
    page = int(request.GET.get("page", 1))
    page_size = int(request.GET.get("page_size", 10))
    search = request.GET.get("search", "").strip()
    warning_type = request.GET.get("warning_type", "").strip()
    level = request.GET.get("level", "").strip()

    queryset = StockWarning.objects.all()
    if search:
        queryset = queryset.filter(Q(material_code__icontains=search) | Q(material_name__icontains=search))
    if warning_type:
        queryset = queryset.filter(warning_type=warning_type)
    if level:
        queryset = queryset.filter(level=level)

    paginator = Paginator(queryset, page_size)
    page_obj = paginator.get_page(page)

    warning_list = [{
        "id": item.id, "material_code": item.material_code, "material_name": item.material_name,
        "warning_type": item.warning_type, "warning_type_display": WARNING_TYPE_DISPLAY.get(item.warning_type, ''),
        "level": item.level, "level_display": LEVEL_DISPLAY.get(item.level, ''),
        "current_stock": item.current_stock, "min_stock": item.min_stock, "max_stock": item.max_stock,
        "created_at": item.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
    } for item in page_obj]

    return _json_response(data={"total": paginator.count, "page": page, "page_size": page_size, "list": warning_list})


@csrf_exempt
@require_GET
@require_permission('stock_warning:view')
def warning_statistics_view(request):
    return _json_response(data={
        "by_type": {"low": StockWarning.objects.filter(warning_type='low').count(),
                    "high": StockWarning.objects.filter(warning_type='high').count()},
        "by_level": {"warning": StockWarning.objects.filter(level='warning').count(),
                     "danger": StockWarning.objects.filter(level='danger').count()},
        "by_status": {"pending": StockWarning.objects.filter(status='pending').count(),
                      "handled": StockWarning.objects.filter(status='handled').count(),
                      "ignored": StockWarning.objects.filter(status='ignored').count()},
        "total": StockWarning.objects.count(),
    })


@csrf_exempt
@require_POST
@require_permission('stock_warning:check')
def warning_check_view(request):
    new_warnings = []
    cleared_warnings = []

    # 清理库存已恢复正常的预警记录
    for warning in StockWarning.objects.select_related('stock').all():
        stock = warning.stock
        is_normal = True

        if warning.warning_type == 'low':
            # 库存不足预警：检查当前库存是否已高于最小库存
            if stock.min_stock > 0 and stock.current_stock <= stock.min_stock:
                is_normal = False
        elif warning.warning_type == 'high':
            # 库存过高预警：检查当前库存是否已低于最大库存
            if stock.max_stock > 0 and stock.current_stock >= stock.max_stock:
                is_normal = False

        if is_normal:
            cleared_warnings.append({"id": warning.id, "material_code": warning.material_code, "type": warning.warning_type})
            warning.delete()

    # 检查并创建或更新预警
    for stock in Stock.objects.filter(status='active'):
        if stock.min_stock > 0 and stock.current_stock <= stock.min_stock:
            existing = StockWarning.objects.filter(stock=stock, warning_type='low').first()
            level = 'danger' if stock.current_stock == 0 or stock.current_stock < stock.min_stock * 0.5 else 'warning'
            if existing:
                # 更新现有预警的当前库存值
                existing.current_stock = stock.current_stock
                existing.level = level
                existing.save()
            else:
                w = StockWarning.objects.create(
                    stock=stock, material_code=stock.material_code, material_name=stock.material_name,
                    warning_type='low', level=level, current_stock=stock.current_stock,
                    min_stock=stock.min_stock, max_stock=stock.max_stock,
                )
                new_warnings.append({"id": w.id, "material_code": w.material_code, "type": "low"})

        if stock.max_stock > 0 and stock.current_stock >= stock.max_stock:
            existing = StockWarning.objects.filter(stock=stock, warning_type='high').first()
            level = 'danger' if stock.current_stock > stock.max_stock * 1.1 else 'warning'
            if existing:
                # 更新现有预警的当前库存值
                existing.current_stock = stock.current_stock
                existing.level = level
                existing.save()
            else:
                w = StockWarning.objects.create(
                    stock=stock, material_code=stock.material_code, material_name=stock.material_name,
                    warning_type='high', level=level, current_stock=stock.current_stock,
                    min_stock=stock.min_stock, max_stock=stock.max_stock,
                )
                new_warnings.append({"id": w.id, "material_code": w.material_code, "type": "high"})

    return _json_response(
        data={"new_count": len(new_warnings), "new_warnings": new_warnings,
              "cleared_count": len(cleared_warnings), "cleared_warnings": cleared_warnings},
        message=f"检查完成，新增 {len(new_warnings)} 条预警，清理 {len(cleared_warnings)} 条已恢复正常的预警"
    )


# ==================== 盘点接口 ====================

def _generate_task_no():
    today = timezone.now().strftime('%Y%m%d')
    prefix_str = f"SC-{today}-"
    last_task = StockCountTask.objects.filter(task_no__startswith=prefix_str).order_by('-task_no').first()
    new_num = int(last_task.task_no.split('-')[-1]) + 1 if last_task else 1
    return f"{prefix_str}{new_num:04d}"


@csrf_exempt
@require_POST
@require_permission('stock_count:create')
def stock_count_task_create_view(request):
    payload = _parse_json_body(request)
    if payload is None:
        return _json_error("请求体需要是 JSON", 400)

    created_by = (payload.get("created_by") or "").strip()
    remark = (payload.get("remark") or "").strip()
    if not created_by:
        return _json_error("创建人不能为空", 400)

    with transaction.atomic():
        task = StockCountTask.objects.create(task_no=_generate_task_no(), created_by=created_by, remark=remark, status='pending')
        items = [StockCountItem(task=task, stock=s, material_code=s.material_code,
                 material_name=s.material_name, book_qty=s.current_stock)
                 for s in Stock.objects.filter(status='active')]
        StockCountItem.objects.bulk_create(items)

    return _json_response(
        data={"id": task.id, "task_no": task.task_no, "item_count": len(items)},
        message="盘点任务创建成功"
    )


@csrf_exempt
@require_GET
@require_permission('stock_count:view')
def stock_count_task_list_view(request):
    page = int(request.GET.get("page", 1))
    page_size = int(request.GET.get("page_size", 10))
    status = request.GET.get("status", "").strip()

    queryset = StockCountTask.objects.all()
    if status:
        queryset = queryset.filter(status=status)

    paginator = Paginator(queryset, page_size)
    page_obj = paginator.get_page(page)

    task_list = [{
        "id": task.id, "task_no": task.task_no, "status": task.status,
        "status_display": TASK_STATUS_DISPLAY.get(task.status, ''),
        "created_by": task.created_by,
        "created_at": task.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "completed_at": task.completed_at.strftime("%Y-%m-%dT%H:%M:%SZ") if task.completed_at else None,
        "item_count": task.items.count(),
        "counted_count": task.items.filter(real_qty__isnull=False).count(),
    } for task in page_obj]

    return _json_response(data={"total": paginator.count, "page": page, "page_size": page_size, "list": task_list})


@csrf_exempt
@require_GET
@require_permission('stock_count:view')
def stock_count_task_detail_view(request, pk):
    task = get_object_or_404(StockCountTask, pk=pk)
    items = [{
        "id": item.id, "material_code": item.material_code, "material_name": item.material_name,
        "book_qty": item.book_qty, "real_qty": item.real_qty, "diff_qty": item.diff_qty,
        "diff_type": item.diff_type, "diff_type_display": DIFF_TYPE_DISPLAY.get(item.diff_type, ''),
        "operator": item.operator,
        "operated_at": item.operated_at.strftime("%Y-%m-%dT%H:%M:%SZ") if item.operated_at else None,
    } for item in task.items.all()]

    return _json_response(data={
        "id": task.id, "task_no": task.task_no, "status": task.status,
        "status_display": TASK_STATUS_DISPLAY.get(task.status, ''),
        "created_by": task.created_by, "remark": task.remark,
        "created_at": task.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "completed_at": task.completed_at.strftime("%Y-%m-%dT%H:%M:%SZ") if task.completed_at else None,
        "items": items,
    })


@csrf_exempt
@require_POST
@require_permission('stock_count:submit')
def stock_count_item_submit_view(request):
    payload = _parse_json_body(request)
    if payload is None:
        return _json_error("请求体需要是 JSON", 400)

    item_id = payload.get("item_id")
    real_qty = payload.get("real_qty")
    operator = (payload.get("operator") or "").strip()
    remark = (payload.get("remark") or "").strip()

    if item_id is None:
        return _json_error("item_id 不能为空", 400)
    if real_qty is None or real_qty < 0:
        return _json_error("实盘数量不能为空且不能为负数", 400)

    item = get_object_or_404(StockCountItem, pk=item_id)
    task = item.task
    if task.status == 'done':
        return _json_error("该盘点任务已完成", 400)
    if task.status == 'cancelled':
        return _json_error("该盘点任务已取消", 400)

    diff_qty = real_qty - item.book_qty
    item.real_qty = real_qty
    item.diff_qty = diff_qty
    item.diff_type = 'gain' if diff_qty > 0 else ('loss' if diff_qty < 0 else 'none')
    item.operator = operator
    item.remark = remark
    item.operated_at = datetime.now()
    item.save()

    if task.status == 'pending':
        task.status = 'doing'
        task.save()

    return _json_response(
        data={"id": item.id, "diff_qty": item.diff_qty, "diff_type": item.diff_type},
        message="盘点明细提交成功"
    )


@csrf_exempt
@require_POST
@require_permission('stock_count:complete')
def stock_count_task_complete_view(request, pk):
    task = get_object_or_404(StockCountTask, pk=pk)
    if task.status == 'done':
        return _json_error("该盘点任务已完成", 400)
    if task.status == 'cancelled':
        return _json_error("该盘点任务已取消", 400)

    uncounted = task.items.filter(real_qty__isnull=True).count()
    if uncounted > 0:
        return _json_error(f"还有 {uncounted} 项未盘点", 400)

    adjust_records = []
    with transaction.atomic():
        for item in task.items.all():
            if item.diff_qty == 0:
                continue
            stock = item.stock
            unit_price = float(stock.unit_price) if stock.unit_price else 0
            adjust_value = abs(item.diff_qty) * unit_price

            if item.diff_type == 'gain':
                bill_no = _generate_bill_no("ADJ", StockIn)
                StockIn.objects.create(
                    bill_no=bill_no, stock=stock, material_code=item.material_code,
                    material_name=item.material_name, in_time=datetime.now(),
                    in_quantity=abs(item.diff_qty), in_value=Decimal(str(adjust_value)),
                    in_type='adjust_gain', operator=item.operator or task.created_by,
                    remark=f"盘点任务 {task.task_no} 盘盈调整",
                )
                Stock.objects.filter(pk=stock.pk).update(
                    current_stock=F('current_stock') + abs(item.diff_qty),
                    stock_value=F('stock_value') + Decimal(str(adjust_value)),
                )
                adjust_records.append({"material_code": item.material_code, "type": "gain", "qty": abs(item.diff_qty)})

            elif item.diff_type == 'loss':
                bill_no = _generate_bill_no("ADJ", StockOut)
                StockOut.objects.create(
                    bill_no=bill_no, stock=stock, material_code=item.material_code,
                    material_name=item.material_name, out_time=datetime.now(),
                    out_quantity=abs(item.diff_qty), out_value=Decimal(str(adjust_value)),
                    out_type='adjust_loss', operator=item.operator or task.created_by,
                    remark=f"盘点任务 {task.task_no} 盘亏调整",
                )
                Stock.objects.filter(pk=stock.pk).update(
                    current_stock=F('current_stock') - abs(item.diff_qty),
                    stock_value=F('stock_value') - Decimal(str(adjust_value)),
                )
                adjust_records.append({"material_code": item.material_code, "type": "loss", "qty": abs(item.diff_qty)})

        task.status = 'done'
        task.completed_at = datetime.now()
        task.save()

    return _json_response(
        data={"id": task.id, "adjust_count": len(adjust_records), "adjust_records": adjust_records},
        message="盘点完成"
    )


@csrf_exempt
@require_POST
@require_permission('stock_count:complete')
def stock_count_task_cancel_view(request, pk):
    task = get_object_or_404(StockCountTask, pk=pk)
    if task.status == 'done':
        return _json_error("该盘点任务已完成，无法取消", 400)
    if task.status == 'cancelled':
        return _json_error("该盘点任务已取消", 400)

    task.status = 'cancelled'
    task.save()
    return _json_response(message="盘点任务已取消")


# ==================== 统计接口 ====================

@csrf_exempt
@require_GET
@require_permission('statistics:view')
def statistics_overview_view(request):
    active_stocks = Stock.objects.filter(status='active')
    stock_stats = active_stocks.aggregate(
        total_count=Count('id'), total_value=Sum('stock_value'), total_qty=Sum('current_stock'),
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
    stock_stats['status_distribution'] = {'low': low_count, 'normal': normal_count, 'high': high_count}

    today = timezone.now().date()
    today_in = StockIn.objects.filter(in_time__date=today).aggregate(
        count=Count('id'), qty=Sum('in_quantity'), value=Sum('in_value'),
    )
    today_out = StockOut.objects.filter(out_time__date=today).aggregate(
        count=Count('id'), qty=Sum('out_quantity'), value=Sum('out_value'),
    )
    return _json_response(data={
        "stock": stock_stats, "today_in": today_in, "today_out": today_out,
        "pending_warnings": StockWarning.objects.filter(status='pending').count(),
    })


@csrf_exempt
@require_GET
@require_permission('statistics:view')
def statistics_trend_view(request):
    days = int(request.GET.get("days", 7))
    end_date = timezone.now().date()
    start_date = end_date - timezone.timedelta(days=days - 1)

    in_trend = list(StockIn.objects.filter(in_time__date__gte=start_date).annotate(
        date=TruncDate('in_time')).values('date').annotate(
        qty=Sum('in_quantity'), value=Sum('in_value')).order_by('date'))

    out_trend = list(StockOut.objects.filter(out_time__date__gte=start_date).annotate(
        date=TruncDate('out_time')).values('date').annotate(
        qty=Sum('out_quantity'), value=Sum('out_value')).order_by('date'))

    return _json_response(data={"in_trend": in_trend, "out_trend": out_trend})


@csrf_exempt
@require_GET
@require_permission('statistics:view')
def statistics_ranking_view(request):
      rank_type = request.GET.get("type", "in")
      limit = int(request.GET.get("limit", 10))

      if rank_type == "in":
          ranking = list(StockIn.objects.values('material_code', 'material_name').annotate(
              total_qty=Sum('in_quantity')).order_by('-total_qty')[:limit])
      else:
          ranking = list(StockOut.objects.values('material_code', 'material_name').annotate(
              total_qty=Sum('out_quantity')).order_by('-total_qty')[:limit])

      # 添加排名字段
      for idx, item in enumerate(ranking, 1):
          item['rank'] = idx

      return _json_response(data={"list": ranking})


@csrf_exempt
@require_GET
@require_permission('statistics:view')
def statistics_category_view(request):
    stats = list(Stock.objects.filter(status='active').values('category').annotate(
        count=Count('id'), total_qty=Sum('current_stock'), total_value=Sum('stock_value'),
    ).order_by('-total_value'))
    return _json_response(data=stats)


# ==================== 月底结存接口 ====================

@csrf_exempt
@require_GET
@require_permission('monthly_report:view')
def monthly_report_list_view(request):
    end_date = timezone.now().date()
    start_date = end_date.replace(day=1) - timezone.timedelta(days=365)

    in_by_month = {item['month'].strftime('%Y-%m'): item for item in StockIn.objects.filter(
        in_time__date__gte=start_date).annotate(month=TruncMonth('in_time')).values('month').annotate(
        in_count=Count('id'), in_qty=Sum('in_quantity'), in_value=Sum('in_value'))}

    out_by_month = {item['month'].strftime('%Y-%m'): item for item in StockOut.objects.filter(
        out_time__date__gte=start_date).annotate(month=TruncMonth('out_time')).values('month').annotate(
        out_count=Count('id'), out_qty=Sum('out_quantity'), out_value=Sum('out_value'))}

    all_months = sorted(set(in_by_month.keys()) | set(out_by_month.keys()), reverse=True)
    result = []
    for m in all_months:
        in_data = in_by_month.get(m, {})
        out_data = out_by_month.get(m, {})
        result.append({
            'month': m,
            'in_count': in_data.get('in_count', 0),
            'in_qty': in_data.get('in_qty', 0),
            'in_value': str(in_data.get('in_value') or 0),
            'out_count': out_data.get('out_count', 0),
            'out_qty': out_data.get('out_qty', 0),
            'out_value': str(out_data.get('out_value') or 0),
        })

    return _json_response(data=result)


@csrf_exempt
@require_GET
@require_permission('monthly_report:view')
def monthly_report_detail_view(request):
    month_str = request.GET.get("month", timezone.now().strftime('%Y-%m'))
    try:
        year, month = map(int, month_str.split('-'))
        start_date = datetime(year, month, 1).date()
        next_month = start_date.replace(day=28) + timezone.timedelta(days=4)
        end_date = next_month.replace(day=1)
    except (ValueError, TypeError):
        return _json_error("月份格式错误，应为 YYYY-MM", 400)

    in_details = {item['material_code']: item for item in StockIn.objects.filter(
        in_time__date__gte=start_date, in_time__date__lt=end_date
    ).values('material_code', 'material_name').annotate(
        in_qty=Sum('in_quantity'), in_value=Sum('in_value'))}

    out_details = {item['material_code']: item for item in StockOut.objects.filter(
        out_time__date__gte=start_date, out_time__date__lt=end_date
    ).values('material_code', 'material_name').annotate(
        out_qty=Sum('out_quantity'), out_value=Sum('out_value'))}

    all_codes = set(in_details.keys()) | set(out_details.keys())
    details = []
    total_in_qty, total_in_value, total_out_qty, total_out_value = 0, 0, 0, 0

    for code in all_codes:
        in_data = in_details.get(code, {})
        out_data = out_details.get(code, {})
        name = in_data.get('material_name') or out_data.get('material_name', '')
        in_q = in_data.get('in_qty') or 0
        in_v = in_data.get('in_value') or 0
        out_q = out_data.get('out_qty') or 0
        out_v = out_data.get('out_value') or 0

        stock = Stock.objects.filter(material_code=code).first()
        details.append({
            'material_code': code,
            'material_name': name,
            'in_qty': in_q,
            'in_value': str(in_v),
            'out_qty': out_q,
            'out_value': str(out_v),
            'current_stock': stock.current_stock if stock else 0,
            'stock_value': str(stock.stock_value if stock else 0),
        })
        total_in_qty += in_q
        total_in_value += in_v
        total_out_qty += out_q
        total_out_value += out_v

    return _json_response(data={
        "month": month_str,
        "summary": {
            "material_count": len(all_codes),
            "total_in_qty": total_in_qty,
            "total_in_value": str(total_in_value),
            "total_out_qty": total_out_qty,
            "total_out_value": str(total_out_value),
        },
        "details": details,
    })