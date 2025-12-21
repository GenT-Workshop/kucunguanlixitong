import json
from decimal import Decimal
from datetime import datetime

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db.models import F, Q
from django.core.paginator import Paginator
from django.db import transaction

from .models import Stock, StockIn, StockOut, StockWarning, StockCountTask, StockCountItem


def _json_response(data=None, message="success", code=200):
    """统一响应格式"""
    return JsonResponse({
        "code": code,
        "message": message,
        "data": data
    }, status=code if code < 500 else 200)


def _json_error(message: str, code: int = 400):
    """错误响应"""
    return _json_response(data=None, message=message, code=code)


def _parse_json_body(request):
    """解析JSON请求体"""
    content_type = request.content_type or ""
    if "application/json" in content_type:
        try:
            return json.loads(request.body.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            return None
    return None


def _generate_bill_no(prefix, model_class):
    """生成单据号: 前缀-YYYYMMDD-####"""
    from django.utils import timezone
    today = timezone.now().strftime('%Y%m%d')
    prefix_str = f"{prefix}-{today}-"

    # 查找今天最大的单据号
    last_bill = model_class.objects.filter(
        bill_no__startswith=prefix_str
    ).order_by('-bill_no').first()

    if last_bill:
        try:
            last_num = int(last_bill.bill_no.split('-')[-1])
            new_num = last_num + 1
        except (ValueError, IndexError):
            new_num = 1
    else:
        new_num = 1

    return f"{prefix_str}{new_num:04d}"


def _get_stock_status(stock):
    """获取库存状态"""
    if stock.min_stock > 0 and stock.current_stock <= stock.min_stock:
        return 'low'
    elif stock.max_stock > 0 and stock.current_stock >= stock.max_stock:
        return 'high'
    return 'normal'


def _get_stock_status_display(status):
    """获取库存状态显示名称"""
    status_map = {
        'low': '库存不足',
        'high': '库存过高',
        'normal': '正常',
    }
    return status_map.get(status, '正常')


@csrf_exempt
def stock_init_view(request):
    """物料初始化"""
    if request.method != "POST":
        return _json_error("仅支持 POST 请求", 405)

    payload = _parse_json_body(request)
    if payload is None:
        return _json_error("请求体需要是 JSON", 400)

    material_code = (payload.get("material_code") or "").strip()
    material_name = (payload.get("material_name") or "").strip()
    max_stock = payload.get("max_stock", 0)
    min_stock = payload.get("min_stock", 0)
    stock_value = payload.get("stock_value", 0)

    if not material_code:
        return _json_error("物料编号不能为空", 400)
    if not material_name:
        return _json_error("物料名称不能为空", 400)

    # 检查物料编号是否已存在
    if Stock.objects.filter(material_code=material_code).exists():
        return _json_error("物料编号已存在", 400)

    # 创建库存记录
    stock = Stock.objects.create(
        material_code=material_code,
        material_name=material_name,
        max_stock=max_stock,
        min_stock=min_stock,
        stock_value=Decimal(str(stock_value)),
    )

    return _json_response(
        data={
            "id": stock.id,
            "material_code": stock.material_code,
            "material_name": stock.material_name,
            "max_stock": stock.max_stock,
            "min_stock": stock.min_stock,
            "current_stock": stock.current_stock,
            "stock_value": str(stock.stock_value),
            "created_at": stock.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
        },
        message="物料初始化成功"
    )


@csrf_exempt
def stock_list_view(request):
    """获取库存列表"""
    if request.method != "GET":
        return _json_error("仅支持 GET 请求", 405)

    page = int(request.GET.get("page", 1))
    page_size = int(request.GET.get("page_size", 10))
    search = request.GET.get("search", "").strip()
    supplier = request.GET.get("supplier", "").strip()
    category = request.GET.get("category", "").strip()
    status = request.GET.get("status", "").strip()
    stock_status = request.GET.get("stock_status", "").strip()

    queryset = Stock.objects.all()

    # 搜索（物料编号/名称）
    if search:
        queryset = queryset.filter(
            Q(material_code__icontains=search) | Q(material_name__icontains=search)
        )

    # 供应商筛选
    if supplier:
        queryset = queryset.filter(supplier__icontains=supplier)

    # 类别筛选
    if category:
        queryset = queryset.filter(category__icontains=category)

    # 状态筛选（启用/停用）
    if status:
        queryset = queryset.filter(status=status)

    # 分页
    paginator = Paginator(queryset, page_size)
    page_obj = paginator.get_page(page)

    stock_list = []
    for stock in page_obj:
        s_status = _get_stock_status(stock)
        # 库存状态筛选（在内存中过滤，因为是计算字段）
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
            "stock_status_display": _get_stock_status_display(s_status),
        })

    return _json_response(data={
        "total": paginator.count,
        "page": page,
        "page_size": page_size,
        "list": stock_list,
    })


@csrf_exempt
def stock_detail_view(request, pk):
    """获取库存详情"""
    if request.method != "GET":
        return _json_error("仅支持 GET 请求", 405)

    try:
        stock = Stock.objects.get(pk=pk)
    except Stock.DoesNotExist:
        return _json_error("库存记录不存在", 404)

    s_status = _get_stock_status(stock)
    return _json_response(data={
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
        "stock_status_display": _get_stock_status_display(s_status),
        "created_at": stock.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "updated_at": stock.updated_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
    })


@csrf_exempt
def stock_in_create_view(request):
    """创建入库记录"""
    if request.method != "POST":
        return _json_error("仅支持 POST 请求", 405)

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

    # 参数校验
    if not material_code:
        return _json_error("物料编号不能为空", 400)
    if in_quantity is None or in_quantity <= 0:
        return _json_error("入库数量必须大于0", 400)
    if in_value is None:
        return _json_error("入库价值不能为空", 400)

    # 校验入库类型
    valid_in_types = ('purchase', 'production', 'return', 'other', 'adjust_gain')
    if in_type not in valid_in_types:
        return _json_error(f"入库类型无效，必须是 {'/'.join(valid_in_types)}", 400)

    # 查找库存记录
    try:
        stock = Stock.objects.get(material_code=material_code)
    except Stock.DoesNotExist:
        return _json_error("物料编号不存在，请先初始化物料", 400)

    # 检查是否超过最大库存量（盘盈调整除外）
    if in_type != 'adjust_gain' and stock.max_stock > 0:
        if stock.current_stock >= stock.max_stock:
            return _json_error(f"当前库存({stock.current_stock})已达到或超过最大库存量({stock.max_stock})，禁止入库", 400)
        if stock.current_stock + in_quantity > stock.max_stock:
            return _json_error(f"入库后将超过最大库存量({stock.max_stock})，当前库存{stock.current_stock}，入库数量{in_quantity}", 400)

    # 解析入库时间
    if in_time_str:
        try:
            in_time = datetime.fromisoformat(in_time_str.replace("Z", "+00:00"))
        except ValueError:
            in_time = datetime.now()
    else:
        in_time = datetime.now()

    # 生成单据号（盘盈用ADJ前缀，其他用IN前缀）
    bill_prefix = "ADJ" if in_type == 'adjust_gain' else "IN"
    bill_no = _generate_bill_no(bill_prefix, StockIn)

    # 使用事务确保数据一致性
    with transaction.atomic():
        # 创建入库记录
        stock_in = StockIn.objects.create(
            bill_no=bill_no,
            stock=stock,
            material_code=material_code,
            material_name=stock.material_name,
            supplier=supplier or stock.supplier,
            in_time=in_time,
            in_quantity=in_quantity,
            in_value=Decimal(str(in_value)),
            in_type=in_type,
            operator=operator,
            remark=remark,
        )

        # 更新库存（使用F()表达式保证原子操作）
        Stock.objects.filter(pk=stock.pk).update(
            current_stock=F('current_stock') + in_quantity,
            stock_value=F('stock_value') + Decimal(str(in_value)),
        )

    # 刷新库存数据获取最新状态
    stock.refresh_from_db()
    stock_status = _get_stock_status(stock)
    stock_status_display = _get_stock_status_display(stock_status)

    # 构建提示信息
    message = "入库成功"
    if stock_status == 'low':
        message += f"，提示：当前库存({stock.current_stock})低于最小库存量({stock.min_stock})，建议补货"

    return _json_response(
        data={
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
            "current_stock": stock.current_stock,
            "stock_status": stock_status,
            "stock_status_display": stock_status_display,
        },
        message=message
    )


@csrf_exempt
def stock_in_list_view(request):
    """获取入库记录列表"""
    if request.method != "GET":
        return _json_error("仅支持 GET 请求", 405)

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

    # 搜索（物料编号/名称）
    if search:
        queryset = queryset.filter(
            Q(material_code__icontains=search) | Q(material_name__icontains=search)
        )

    # 入库类型筛选
    if in_type:
        queryset = queryset.filter(in_type=in_type)

    # 供应商筛选
    if supplier:
        queryset = queryset.filter(supplier__icontains=supplier)

    # 单据号筛选
    if bill_no:
        queryset = queryset.filter(bill_no__icontains=bill_no)

    # 操作人筛选
    if operator:
        queryset = queryset.filter(operator__icontains=operator)

    # 时间筛选
    if start_time:
        queryset = queryset.filter(in_time__gte=start_time)
    if end_time:
        queryset = queryset.filter(in_time__lte=end_time)

    # 分页
    paginator = Paginator(queryset, page_size)
    page_obj = paginator.get_page(page)

    stock_in_list = [
        {
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
        }
        for item in page_obj
    ]

    return _json_response(data={
        "total": paginator.count,
        "page": page,
        "page_size": page_size,
        "list": stock_in_list,
    })


@csrf_exempt
def stock_in_detail_view(request, pk):
    """获取入库记录详情"""
    if request.method != "GET":
        return _json_error("仅支持 GET 请求", 405)

    try:
        stock_in = StockIn.objects.get(pk=pk)
    except StockIn.DoesNotExist:
        return _json_error("入库记录不存在", 404)

    return _json_response(data={
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


# ==================== 出库接口 ====================

OUT_TYPE_DISPLAY = {
    'production': '生产领料',
    'sales': '销售提货',
    'other': '其他出库',
    'adjust_loss': '盘点盘亏',
}


@csrf_exempt
def stock_out_create_view(request):
    """创建出库记录"""
    if request.method != "POST":
        return _json_error("仅支持 POST 请求", 405)

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

    # 参数校验
    if not material_code:
        return _json_error("物料编号不能为空", 400)
    if out_quantity is None or out_quantity <= 0:
        return _json_error("出库数量必须大于0", 400)
    if out_value is None:
        return _json_error("出库价值不能为空", 400)

    # 校验出库类型
    valid_out_types = ('production', 'sales', 'other', 'adjust_loss')
    if out_type not in valid_out_types:
        return _json_error(f"出库类型无效，必须是 {'/'.join(valid_out_types)}", 400)

    # 查找库存记录
    try:
        stock = Stock.objects.get(material_code=material_code)
    except Stock.DoesNotExist:
        return _json_error("物料编号不存在", 400)

    # 检查库存是否充足
    if stock.current_stock < out_quantity:
        return _json_error(f"库存不足，当前库存量为{stock.current_stock}，出库数量为{out_quantity}", 400)

    # 盘亏不得导致负库存
    if out_type == 'adjust_loss' and stock.current_stock - out_quantity < 0:
        return _json_error(f"盘亏调整后库存不能为负数，当前库存{stock.current_stock}", 400)

    # 解析出库时间
    if out_time_str:
        try:
            out_time = datetime.fromisoformat(out_time_str.replace("Z", "+00:00"))
        except ValueError:
            out_time = datetime.now()
    else:
        out_time = datetime.now()

    # 生成单据号（盘亏用ADJ前缀，其他用OUT前缀）
    bill_prefix = "ADJ" if out_type == 'adjust_loss' else "OUT"
    bill_no = _generate_bill_no(bill_prefix, StockOut)

    # 使用事务确保数据一致性
    with transaction.atomic():
        # 创建出库记录
        stock_out = StockOut.objects.create(
            bill_no=bill_no,
            stock=stock,
            material_code=material_code,
            material_name=stock.material_name,
            out_time=out_time,
            out_quantity=out_quantity,
            out_value=Decimal(str(out_value)),
            out_type=out_type,
            operator=operator,
            remark=remark,
        )

        # 更新库存（使用F()表达式保证原子操作）
        Stock.objects.filter(pk=stock.pk).update(
            current_stock=F('current_stock') - out_quantity,
            stock_value=F('stock_value') - Decimal(str(out_value)),
        )

    # 刷新库存数据获取最新状态
    stock.refresh_from_db()
    stock_status = _get_stock_status(stock)
    stock_status_display = _get_stock_status_display(stock_status)

    # 构建提示信息
    message = "出库成功"
    if stock_status == 'low':
        message += f"，警告：当前库存({stock.current_stock})已低于最小库存量({stock.min_stock})，建议补货"

    return _json_response(
        data={
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
            "current_stock": stock.current_stock,
            "stock_status": stock_status,
            "stock_status_display": stock_status_display,
        },
        message=message
    )


@csrf_exempt
def stock_out_list_view(request):
    """获取出库记录列表"""
    if request.method != "GET":
        return _json_error("仅支持 GET 请求", 405)

    page = int(request.GET.get("page", 1))
    page_size = int(request.GET.get("page_size", 10))
    search = request.GET.get("search", "").strip()
    out_type = request.GET.get("out_type", "").strip()
    bill_no = request.GET.get("bill_no", "").strip()
    operator = request.GET.get("operator", "").strip()
    start_time = request.GET.get("start_time")
    end_time = request.GET.get("end_time")

    queryset = StockOut.objects.all()

    # 搜索（物料编号/名称）
    if search:
        queryset = queryset.filter(
            Q(material_code__icontains=search) | Q(material_name__icontains=search)
        )

    # 出库类型筛选
    if out_type:
        queryset = queryset.filter(out_type=out_type)

    # 单据号筛选
    if bill_no:
        queryset = queryset.filter(bill_no__icontains=bill_no)

    # 操作人筛选
    if operator:
        queryset = queryset.filter(operator__icontains=operator)

    # 时间筛选
    if start_time:
        queryset = queryset.filter(out_time__gte=start_time)
    if end_time:
        queryset = queryset.filter(out_time__lte=end_time)

    # 分页
    paginator = Paginator(queryset, page_size)
    page_obj = paginator.get_page(page)

    stock_out_list = [
        {
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
        }
        for item in page_obj
    ]

    return _json_response(data={
        "total": paginator.count,
        "page": page,
        "page_size": page_size,
        "list": stock_out_list,
    })


@csrf_exempt
def stock_out_detail_view(request, pk):
    """获取出库记录详情"""
    if request.method != "GET":
        return _json_error("仅支持 GET 请求", 405)

    try:
        stock_out = StockOut.objects.get(pk=pk)
    except StockOut.DoesNotExist:
        return _json_error("出库记录不存在", 404)

    return _json_response(data={
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
def stock_out_delete_view(request, pk):
    """删除出库记录（撤销，同时恢复库存）"""
    if request.method != "DELETE":
        return _json_error("仅支持 DELETE 请求", 405)

    try:
        stock_out = StockOut.objects.get(pk=pk)
    except StockOut.DoesNotExist:
        return _json_error("出库记录不存在", 404)

    # 使用事务确保数据一致性
    with transaction.atomic():
        # 恢复库存
        Stock.objects.filter(pk=stock_out.stock_id).update(
            current_stock=F('current_stock') + stock_out.out_quantity,
            stock_value=F('stock_value') + stock_out.out_value,
        )

        # 删除出库记录
        stock_out.delete()

    return _json_response(message="撤销成功，库存已恢复")


@csrf_exempt
def stock_in_delete_view(request, pk):
    """删除入库记录（撤销，同时扣减库存）"""
    if request.method != "DELETE":
        return _json_error("仅支持 DELETE 请求", 405)

    try:
        stock_in = StockIn.objects.get(pk=pk)
    except StockIn.DoesNotExist:
        return _json_error("入库记录不存在", 404)

    # 检查撤销后库存是否会变成负数
    stock = stock_in.stock
    if stock.current_stock < stock_in.in_quantity:
        return _json_error(f"撤销失败：撤销后库存将变为负数（当前库存{stock.current_stock}，入库数量{stock_in.in_quantity}）", 400)

    # 使用事务确保数据一致性
    with transaction.atomic():
        # 扣减库存
        Stock.objects.filter(pk=stock_in.stock_id).update(
            current_stock=F('current_stock') - stock_in.in_quantity,
            stock_value=F('stock_value') - stock_in.in_value,
        )

        # 删除入库记录
        stock_in.delete()

    return _json_response(message="撤销成功，库存已扣减")


# ==================== 预警接口 ====================

WARNING_TYPE_DISPLAY = {
    'low': '库存不足',
    'high': '库存过高',
}

LEVEL_DISPLAY = {
    'warning': '警告',
    'danger': '危险',
}

STATUS_DISPLAY = {
    'pending': '待处理',
    'handled': '已处理',
    'ignored': '已忽略',
}


@csrf_exempt
def warning_list_view(request):
    """获取预警列表"""
    if request.method != "GET":
        return _json_error("仅支持 GET 请求", 405)

    page = int(request.GET.get("page", 1))
    page_size = int(request.GET.get("page_size", 10))
    search = request.GET.get("search", "").strip()
    warning_type = request.GET.get("warning_type", "").strip()
    level = request.GET.get("level", "").strip()
    status = request.GET.get("status", "").strip()

    queryset = StockWarning.objects.all()

    # 搜索（物料编号/名称）
    if search:
        queryset = queryset.filter(
            Q(material_code__icontains=search) | Q(material_name__icontains=search)
        )

    # 预警类型筛选
    if warning_type:
        queryset = queryset.filter(warning_type=warning_type)

    # 级别筛选
    if level:
        queryset = queryset.filter(level=level)

    # 状态筛选
    if status:
        queryset = queryset.filter(status=status)

    # 分页
    paginator = Paginator(queryset, page_size)
    page_obj = paginator.get_page(page)

    warning_list = [
        {
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
            "status": item.status,
            "status_display": STATUS_DISPLAY.get(item.status, ''),
            "handled_by": item.handled_by,
            "handled_at": item.handled_at.strftime("%Y-%m-%dT%H:%M:%SZ") if item.handled_at else None,
            "remark": item.remark,
            "created_at": item.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
        }
        for item in page_obj
    ]

    return _json_response(data={
        "total": paginator.count,
        "page": page,
        "page_size": page_size,
        "list": warning_list,
    })


@csrf_exempt
def warning_handle_view(request, pk):
    """处理预警"""
    if request.method != "POST":
        return _json_error("仅支持 POST 请求", 405)

    payload = _parse_json_body(request)
    if payload is None:
        return _json_error("请求体需要是 JSON", 400)

    action = (payload.get("action") or "").strip()
    handled_by = (payload.get("handled_by") or "").strip()
    remark = (payload.get("remark") or "").strip()

    if action not in ('handle', 'ignore'):
        return _json_error("action 必须是 handle 或 ignore", 400)

    try:
        warning = StockWarning.objects.get(pk=pk)
    except StockWarning.DoesNotExist:
        return _json_error("预警记录不存在", 404)

    if warning.status != 'pending':
        return _json_error("该预警已处理或已忽略", 400)

    # 更新预警状态
    warning.status = 'handled' if action == 'handle' else 'ignored'
    warning.handled_by = handled_by
    warning.handled_at = datetime.now()
    warning.remark = remark
    warning.save()

    return _json_response(
        data={
            "id": warning.id,
            "status": warning.status,
            "status_display": STATUS_DISPLAY.get(warning.status, ''),
            "handled_by": warning.handled_by,
            "handled_at": warning.handled_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
        },
        message="处理成功"
    )


@csrf_exempt
def warning_statistics_view(request):
    """预警统计"""
    if request.method != "GET":
        return _json_error("仅支持 GET 请求", 405)

    # 按类型统计
    low_count = StockWarning.objects.filter(warning_type='low').count()
    high_count = StockWarning.objects.filter(warning_type='high').count()

    # 按级别统计
    warning_level_count = StockWarning.objects.filter(level='warning').count()
    danger_level_count = StockWarning.objects.filter(level='danger').count()

    # 按状态统计
    pending_count = StockWarning.objects.filter(status='pending').count()
    handled_count = StockWarning.objects.filter(status='handled').count()
    ignored_count = StockWarning.objects.filter(status='ignored').count()

    return _json_response(data={
        "by_type": {
            "low": low_count,
            "high": high_count,
        },
        "by_level": {
            "warning": warning_level_count,
            "danger": danger_level_count,
        },
        "by_status": {
            "pending": pending_count,
            "handled": handled_count,
            "ignored": ignored_count,
        },
        "total": low_count + high_count,
    })


@csrf_exempt
def warning_check_view(request):
    """检查并生成预警（扫描所有库存，生成新的预警记录）"""
    if request.method != "POST":
        return _json_error("仅支持 POST 请求", 405)

    new_warnings = []
    stocks = Stock.objects.filter(status='active')

    for stock in stocks:
        # 检查低库存预警
        if stock.min_stock > 0 and stock.current_stock <= stock.min_stock:
            # 检查是否已有未处理的同类型预警
            existing = StockWarning.objects.filter(
                stock=stock,
                warning_type='low',
                status='pending'
            ).exists()

            if not existing:
                # 判断级别：库存为0或低于50%最小库存为危险级别
                level = 'danger' if stock.current_stock == 0 or stock.current_stock < stock.min_stock * 0.5 else 'warning'
                warning = StockWarning.objects.create(
                    stock=stock,
                    material_code=stock.material_code,
                    material_name=stock.material_name,
                    warning_type='low',
                    level=level,
                    current_stock=stock.current_stock,
                    min_stock=stock.min_stock,
                    max_stock=stock.max_stock,
                )
                new_warnings.append({
                    "id": warning.id,
                    "material_code": warning.material_code,
                    "material_name": warning.material_name,
                    "warning_type": "low",
                    "level": level,
                })

        # 检查高库存预警
        if stock.max_stock > 0 and stock.current_stock >= stock.max_stock:
            existing = StockWarning.objects.filter(
                stock=stock,
                warning_type='high',
                status='pending'
            ).exists()

            if not existing:
                # 判断级别：超过最大库存10%为危险级别
                level = 'danger' if stock.current_stock > stock.max_stock * 1.1 else 'warning'
                warning = StockWarning.objects.create(
                    stock=stock,
                    material_code=stock.material_code,
                    material_name=stock.material_name,
                    warning_type='high',
                    level=level,
                    current_stock=stock.current_stock,
                    min_stock=stock.min_stock,
                    max_stock=stock.max_stock,
                )
                new_warnings.append({
                    "id": warning.id,
                    "material_code": warning.material_code,
                    "material_name": warning.material_name,
                    "warning_type": "high",
                    "level": level,
                })

    return _json_response(
        data={
            "new_count": len(new_warnings),
            "new_warnings": new_warnings,
        },
        message=f"检查完成，新增 {len(new_warnings)} 条预警"
    )


# ==================== 盘点接口 ====================

TASK_STATUS_DISPLAY = {
    'pending': '待盘点',
    'doing': '盘点中',
    'done': '已完成',
    'cancelled': '已取消',
}

DIFF_TYPE_DISPLAY = {
    'gain': '盘盈',
    'loss': '盘亏',
    'none': '无差异',
}


def _generate_task_no():
    """生成盘点任务号: SC-YYYYMMDD-####"""
    from django.utils import timezone
    today = timezone.now().strftime('%Y%m%d')
    prefix_str = f"SC-{today}-"

    last_task = StockCountTask.objects.filter(
        task_no__startswith=prefix_str
    ).order_by('-task_no').first()

    if last_task:
        try:
            last_num = int(last_task.task_no.split('-')[-1])
            new_num = last_num + 1
        except (ValueError, IndexError):
            new_num = 1
    else:
        new_num = 1

    return f"{prefix_str}{new_num:04d}"


@csrf_exempt
def stock_count_task_create_view(request):
    """创建盘点任务"""
    if request.method != "POST":
        return _json_error("仅支持 POST 请求", 405)

    payload = _parse_json_body(request)
    if payload is None:
        return _json_error("请求体需要是 JSON", 400)

    created_by = (payload.get("created_by") or "").strip()
    remark = (payload.get("remark") or "").strip()

    if not created_by:
        return _json_error("创建人不能为空", 400)

    # 生成任务号
    task_no = _generate_task_no()

    with transaction.atomic():
        # 创建盘点任务
        task = StockCountTask.objects.create(
            task_no=task_no,
            created_by=created_by,
            remark=remark,
            status='pending',
        )

        # 自动添加所有启用状态的库存物料到盘点明细
        stocks = Stock.objects.filter(status='active')
        items = []
        for stock in stocks:
            items.append(StockCountItem(
                task=task,
                stock=stock,
                material_code=stock.material_code,
                material_name=stock.material_name,
                book_qty=stock.current_stock,
            ))
        StockCountItem.objects.bulk_create(items)

    return _json_response(
        data={
            "id": task.id,
            "task_no": task.task_no,
            "status": task.status,
            "status_display": TASK_STATUS_DISPLAY.get(task.status, ''),
            "created_by": task.created_by,
            "remark": task.remark,
            "created_at": task.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "item_count": len(items),
        },
        message="盘点任务创建成功"
    )


@csrf_exempt
def stock_count_task_list_view(request):
    """获取盘点任务列表"""
    if request.method != "GET":
        return _json_error("仅支持 GET 请求", 405)

    page = int(request.GET.get("page", 1))
    page_size = int(request.GET.get("page_size", 10))
    status = request.GET.get("status", "").strip()

    queryset = StockCountTask.objects.all()

    if status:
        queryset = queryset.filter(status=status)

    paginator = Paginator(queryset, page_size)
    page_obj = paginator.get_page(page)

    task_list = []
    for task in page_obj:
        item_count = task.items.count()
        counted_count = task.items.filter(real_qty__isnull=False).count()
        task_list.append({
            "id": task.id,
            "task_no": task.task_no,
            "status": task.status,
            "status_display": TASK_STATUS_DISPLAY.get(task.status, ''),
            "created_by": task.created_by,
            "remark": task.remark,
            "created_at": task.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "completed_at": task.completed_at.strftime("%Y-%m-%dT%H:%M:%SZ") if task.completed_at else None,
            "item_count": item_count,
            "counted_count": counted_count,
        })

    return _json_response(data={
        "total": paginator.count,
        "page": page,
        "page_size": page_size,
        "list": task_list,
    })


@csrf_exempt
def stock_count_task_detail_view(request, pk):
    """获取盘点任务详情（含明细）"""
    if request.method != "GET":
        return _json_error("仅支持 GET 请求", 405)

    try:
        task = StockCountTask.objects.get(pk=pk)
    except StockCountTask.DoesNotExist:
        return _json_error("盘点任务不存在", 404)

    items = task.items.all()
    item_list = [
        {
            "id": item.id,
            "material_code": item.material_code,
            "material_name": item.material_name,
            "book_qty": item.book_qty,
            "real_qty": item.real_qty,
            "diff_qty": item.diff_qty,
            "diff_type": item.diff_type,
            "diff_type_display": DIFF_TYPE_DISPLAY.get(item.diff_type, ''),
            "remark": item.remark,
            "operator": item.operator,
            "operated_at": item.operated_at.strftime("%Y-%m-%dT%H:%M:%SZ") if item.operated_at else None,
        }
        for item in items
    ]

    return _json_response(data={
        "id": task.id,
        "task_no": task.task_no,
        "status": task.status,
        "status_display": TASK_STATUS_DISPLAY.get(task.status, ''),
        "created_by": task.created_by,
        "remark": task.remark,
        "created_at": task.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "completed_at": task.completed_at.strftime("%Y-%m-%dT%H:%M:%SZ") if task.completed_at else None,
        "items": item_list,
    })


@csrf_exempt
def stock_count_item_submit_view(request):
    """提交盘点明细（录入实盘数量）"""
    if request.method != "POST":
        return _json_error("仅支持 POST 请求", 405)

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

    try:
        item = StockCountItem.objects.get(pk=item_id)
    except StockCountItem.DoesNotExist:
        return _json_error("盘点明细不存在", 404)

    task = item.task
    if task.status == 'done':
        return _json_error("该盘点任务已完成，无法修改", 400)
    if task.status == 'cancelled':
        return _json_error("该盘点任务已取消", 400)

    # 计算差异
    diff_qty = real_qty - item.book_qty
    if diff_qty > 0:
        diff_type = 'gain'
    elif diff_qty < 0:
        diff_type = 'loss'
    else:
        diff_type = 'none'

    # 更新盘点明细
    item.real_qty = real_qty
    item.diff_qty = diff_qty
    item.diff_type = diff_type
    item.operator = operator
    item.remark = remark
    item.operated_at = datetime.now()
    item.save()

    # 如果任务状态是待盘点，更新为盘点中
    if task.status == 'pending':
        task.status = 'doing'
        task.save()

    return _json_response(
        data={
            "id": item.id,
            "material_code": item.material_code,
            "book_qty": item.book_qty,
            "real_qty": item.real_qty,
            "diff_qty": item.diff_qty,
            "diff_type": item.diff_type,
            "diff_type_display": DIFF_TYPE_DISPLAY.get(item.diff_type, ''),
        },
        message="盘点明细提交成功"
    )


@csrf_exempt
def stock_count_task_complete_view(request, pk):
    """完成盘点任务（生成调整单并更新库存）"""
    if request.method != "POST":
        return _json_error("仅支持 POST 请求", 405)

    try:
        task = StockCountTask.objects.get(pk=pk)
    except StockCountTask.DoesNotExist:
        return _json_error("盘点任务不存在", 404)

    if task.status == 'done':
        return _json_error("该盘点任务已完成", 400)
    if task.status == 'cancelled':
        return _json_error("该盘点任务已取消", 400)

    # 检查是否所有明细都已盘点
    uncounted = task.items.filter(real_qty__isnull=True).count()
    if uncounted > 0:
        return _json_error(f"还有 {uncounted} 项未盘点，请先完成所有盘点", 400)

    adjust_records = []

    with transaction.atomic():
        for item in task.items.all():
            if item.diff_qty == 0:
                continue

            stock = item.stock
            unit_price = float(stock.unit_price) if stock.unit_price else 0

            if item.diff_type == 'gain':
                # 盘盈：创建入库记录
                bill_no = _generate_bill_no("ADJ", StockIn)
                adjust_value = abs(item.diff_qty) * unit_price
                StockIn.objects.create(
                    bill_no=bill_no,
                    stock=stock,
                    material_code=item.material_code,
                    material_name=item.material_name,
                    in_time=datetime.now(),
                    in_quantity=abs(item.diff_qty),
                    in_value=Decimal(str(adjust_value)),
                    in_type='adjust_gain',
                    operator=item.operator or task.created_by,
                    remark=f"盘点任务 {task.task_no} 盘盈调整",
                )
                # 更新库存
                Stock.objects.filter(pk=stock.pk).update(
                    current_stock=F('current_stock') + abs(item.diff_qty),
                    stock_value=F('stock_value') + Decimal(str(adjust_value)),
                )
                adjust_records.append({
                    "material_code": item.material_code,
                    "type": "gain",
                    "qty": abs(item.diff_qty),
                    "bill_no": bill_no,
                })

            elif item.diff_type == 'loss':
                # 盘亏：创建出库记录
                bill_no = _generate_bill_no("ADJ", StockOut)
                adjust_value = abs(item.diff_qty) * unit_price
                StockOut.objects.create(
                    bill_no=bill_no,
                    stock=stock,
                    material_code=item.material_code,
                    material_name=item.material_name,
                    out_time=datetime.now(),
                    out_quantity=abs(item.diff_qty),
                    out_value=Decimal(str(adjust_value)),
                    out_type='adjust_loss',
                    operator=item.operator or task.created_by,
                    remark=f"盘点任务 {task.task_no} 盘亏调整",
                )
                # 更新库存
                Stock.objects.filter(pk=stock.pk).update(
                    current_stock=F('current_stock') - abs(item.diff_qty),
                    stock_value=F('stock_value') - Decimal(str(adjust_value)),
                )
                adjust_records.append({
                    "material_code": item.material_code,
                    "type": "loss",
                    "qty": abs(item.diff_qty),
                    "bill_no": bill_no,
                })

        # 更新任务状态
        task.status = 'done'
        task.completed_at = datetime.now()
        task.save()

    return _json_response(
        data={
            "task_no": task.task_no,
            "adjust_count": len(adjust_records),
            "adjust_records": adjust_records,
        },
        message=f"盘点完成，生成 {len(adjust_records)} 条调整记录"
    )


@csrf_exempt
def stock_count_task_cancel_view(request, pk):
    """取消盘点任务"""
    if request.method != "POST":
        return _json_error("仅支持 POST 请求", 405)

    try:
        task = StockCountTask.objects.get(pk=pk)
    except StockCountTask.DoesNotExist:
        return _json_error("盘点任务不存在", 404)

    if task.status == 'done':
        return _json_error("该盘点任务已完成，无法取消", 400)
    if task.status == 'cancelled':
        return _json_error("该盘点任务已取消", 400)

    task.status = 'cancelled'
    task.save()

    return _json_response(message="盘点任务已取消")


# ==================== 统计分析接口 ====================

@csrf_exempt
def statistics_overview_view(request):
    """统计概览"""
    if request.method != "GET":
        return _json_error("仅支持 GET 请求", 405)

    from django.db.models import Sum, Count

    # 库存统计
    stock_stats = Stock.objects.filter(status='active').aggregate(
        total_count=Count('id'),
        total_value=Sum('stock_value'),
        total_qty=Sum('current_stock'),
    )

    # 库存状态分布
    all_stocks = Stock.objects.filter(status='active')
    low_count = sum(1 for s in all_stocks if s.stock_status == 'low')
    high_count = sum(1 for s in all_stocks if s.stock_status == 'high')
    normal_count = stock_stats['total_count'] - low_count - high_count

    # 今日入库统计
    from django.utils import timezone
    today = timezone.now().date()
    today_in = StockIn.objects.filter(in_time__date=today).aggregate(
        count=Count('id'),
        qty=Sum('in_quantity'),
        value=Sum('in_value'),
    )

    # 今日出库统计
    today_out = StockOut.objects.filter(out_time__date=today).aggregate(
        count=Count('id'),
        qty=Sum('out_quantity'),
        value=Sum('out_value'),
    )

    # 待处理预警数
    pending_warnings = StockWarning.objects.filter(status='pending').count()

    return _json_response(data={
        "stock": {
            "total_count": stock_stats['total_count'] or 0,
            "total_value": str(stock_stats['total_value'] or 0),
            "total_qty": stock_stats['total_qty'] or 0,
            "status_distribution": {
                "low": low_count,
                "normal": normal_count,
                "high": high_count,
            },
        },
        "today_in": {
            "count": today_in['count'] or 0,
            "qty": today_in['qty'] or 0,
            "value": str(today_in['value'] or 0),
        },
        "today_out": {
            "count": today_out['count'] or 0,
            "qty": today_out['qty'] or 0,
            "value": str(today_out['value'] or 0),
        },
        "pending_warnings": pending_warnings,
    })


@csrf_exempt
def statistics_trend_view(request):
    """出入库趋势（最近7天/30天）"""
    if request.method != "GET":
        return _json_error("仅支持 GET 请求", 405)

    from django.utils import timezone
    from django.db.models import Sum, Count
    from django.db.models.functions import TruncDate

    days = int(request.GET.get("days", 7))
    if days not in (7, 30):
        days = 7

    end_date = timezone.now().date()
    start_date = end_date - timezone.timedelta(days=days - 1)

    # 入库趋势
    in_trend = StockIn.objects.filter(
        in_time__date__gte=start_date,
        in_time__date__lte=end_date
    ).annotate(
        date=TruncDate('in_time')
    ).values('date').annotate(
        qty=Sum('in_quantity'),
        value=Sum('in_value'),
        count=Count('id'),
    ).order_by('date')

    # 出库趋势
    out_trend = StockOut.objects.filter(
        out_time__date__gte=start_date,
        out_time__date__lte=end_date
    ).annotate(
        date=TruncDate('out_time')
    ).values('date').annotate(
        qty=Sum('out_quantity'),
        value=Sum('out_value'),
        count=Count('id'),
    ).order_by('date')

    # 构建日期列表
    date_list = []
    current = start_date
    while current <= end_date:
        date_list.append(current.strftime('%Y-%m-%d'))
        current += timezone.timedelta(days=1)

    # 转换为字典便于查找
    in_dict = {item['date'].strftime('%Y-%m-%d'): item for item in in_trend}
    out_dict = {item['date'].strftime('%Y-%m-%d'): item for item in out_trend}

    # 构建结果
    result = []
    for date_str in date_list:
        in_data = in_dict.get(date_str, {})
        out_data = out_dict.get(date_str, {})
        result.append({
            "date": date_str,
            "in_qty": in_data.get('qty', 0) or 0,
            "in_value": str(in_data.get('value', 0) or 0),
            "in_count": in_data.get('count', 0) or 0,
            "out_qty": out_data.get('qty', 0) or 0,
            "out_value": str(out_data.get('value', 0) or 0),
            "out_count": out_data.get('count', 0) or 0,
        })

    return _json_response(data=result)


@csrf_exempt
def statistics_ranking_view(request):
    """物料排行（出入库数量/金额排行）"""
    if request.method != "GET":
        return _json_error("仅支持 GET 请求", 405)

    from django.db.models import Sum
    from django.utils import timezone

    rank_type = request.GET.get("type", "in")  # in/out
    order_by = request.GET.get("order_by", "qty")  # qty/value
    days = int(request.GET.get("days", 30))
    limit = int(request.GET.get("limit", 10))

    end_date = timezone.now().date()
    start_date = end_date - timezone.timedelta(days=days - 1)

    if rank_type == "in":
        queryset = StockIn.objects.filter(
            in_time__date__gte=start_date,
            in_time__date__lte=end_date
        ).values('material_code', 'material_name').annotate(
            total_qty=Sum('in_quantity'),
            total_value=Sum('in_value'),
        )
        order_field = '-total_qty' if order_by == 'qty' else '-total_value'
    else:
        queryset = StockOut.objects.filter(
            out_time__date__gte=start_date,
            out_time__date__lte=end_date
        ).values('material_code', 'material_name').annotate(
            total_qty=Sum('out_quantity'),
            total_value=Sum('out_value'),
        )
        order_field = '-total_qty' if order_by == 'qty' else '-total_value'

    ranking = queryset.order_by(order_field)[:limit]

    result = [
        {
            "rank": idx + 1,
            "material_code": item['material_code'],
            "material_name": item['material_name'],
            "total_qty": item['total_qty'] or 0,
            "total_value": str(item['total_value'] or 0),
        }
        for idx, item in enumerate(ranking)
    ]

    return _json_response(data={
        "type": rank_type,
        "order_by": order_by,
        "days": days,
        "list": result,
    })


@csrf_exempt
def statistics_category_view(request):
    """按类别统计库存"""
    if request.method != "GET":
        return _json_error("仅支持 GET 请求", 405)

    from django.db.models import Sum, Count

    category_stats = Stock.objects.filter(status='active').values('category').annotate(
        count=Count('id'),
        total_qty=Sum('current_stock'),
        total_value=Sum('stock_value'),
    ).order_by('-total_value')

    result = [
        {
            "category": item['category'] or '未分类',
            "count": item['count'] or 0,
            "total_qty": item['total_qty'] or 0,
            "total_value": str(item['total_value'] or 0),
        }
        for item in category_stats
    ]

    return _json_response(data=result)


# ==================== 月底结存接口 ====================

@csrf_exempt
def monthly_report_list_view(request):
    """获取月度报表列表（按月份汇总）"""
    if request.method != "GET":
        return _json_error("仅支持 GET 请求", 405)

    from django.db.models import Sum, Count
    from django.db.models.functions import TruncMonth
    from django.utils import timezone

    # 获取最近12个月的数据
    end_date = timezone.now().date()
    start_date = end_date.replace(day=1) - timezone.timedelta(days=365)

    # 按月统计入库
    in_by_month = StockIn.objects.filter(
        in_time__date__gte=start_date
    ).annotate(
        month=TruncMonth('in_time')
    ).values('month').annotate(
        in_qty=Sum('in_quantity'),
        in_value=Sum('in_value'),
        in_count=Count('id'),
    ).order_by('-month')

    # 按月统计出库
    out_by_month = StockOut.objects.filter(
        out_time__date__gte=start_date
    ).annotate(
        month=TruncMonth('out_time')
    ).values('month').annotate(
        out_qty=Sum('out_quantity'),
        out_value=Sum('out_value'),
        out_count=Count('id'),
    ).order_by('-month')

    # 合并数据
    in_dict = {item['month'].strftime('%Y-%m'): item for item in in_by_month}
    out_dict = {item['month'].strftime('%Y-%m'): item for item in out_by_month}

    # 获取所有月份
    all_months = set(in_dict.keys()) | set(out_dict.keys())
    all_months = sorted(all_months, reverse=True)

    result = []
    for month in all_months:
        in_data = in_dict.get(month, {})
        out_data = out_dict.get(month, {})
        result.append({
            "month": month,
            "in_qty": in_data.get('in_qty', 0) or 0,
            "in_value": str(in_data.get('in_value', 0) or 0),
            "in_count": in_data.get('in_count', 0) or 0,
            "out_qty": out_data.get('out_qty', 0) or 0,
            "out_value": str(out_data.get('out_value', 0) or 0),
            "out_count": out_data.get('out_count', 0) or 0,
        })

    return _json_response(data=result)


@csrf_exempt
def monthly_report_detail_view(request):
    """获取指定月份的详细报表"""
    if request.method != "GET":
        return _json_error("仅支持 GET 请求", 405)

    from django.db.models import Sum
    from django.utils import timezone

    month_str = request.GET.get("month", "")
    if not month_str:
        # 默认当前月
        month_str = timezone.now().strftime('%Y-%m')

    try:
        year, month = map(int, month_str.split('-'))
        start_date = timezone.datetime(year, month, 1).date()
        if month == 12:
            end_date = timezone.datetime(year + 1, 1, 1).date()
        else:
            end_date = timezone.datetime(year, month + 1, 1).date()
    except (ValueError, TypeError):
        return _json_error("月份格式错误，应为 YYYY-MM", 400)

    # 按物料统计入库
    in_by_material = StockIn.objects.filter(
        in_time__date__gte=start_date,
        in_time__date__lt=end_date
    ).values('material_code', 'material_name').annotate(
        in_qty=Sum('in_quantity'),
        in_value=Sum('in_value'),
    )

    # 按物料统计出库
    out_by_material = StockOut.objects.filter(
        out_time__date__gte=start_date,
        out_time__date__lt=end_date
    ).values('material_code', 'material_name').annotate(
        out_qty=Sum('out_quantity'),
        out_value=Sum('out_value'),
    )

    # 合并数据
    in_dict = {item['material_code']: item for item in in_by_material}
    out_dict = {item['material_code']: item for item in out_by_material}

    all_codes = set(in_dict.keys()) | set(out_dict.keys())

    # 获取当前库存信息
    stocks = Stock.objects.filter(material_code__in=all_codes)
    stock_dict = {s.material_code: s for s in stocks}

    details = []
    for code in all_codes:
        in_data = in_dict.get(code, {})
        out_data = out_dict.get(code, {})
        stock = stock_dict.get(code)

        details.append({
            "material_code": code,
            "material_name": in_data.get('material_name') or out_data.get('material_name') or '',
            "in_qty": in_data.get('in_qty', 0) or 0,
            "in_value": str(in_data.get('in_value', 0) or 0),
            "out_qty": out_data.get('out_qty', 0) or 0,
            "out_value": str(out_data.get('out_value', 0) or 0),
            "current_stock": stock.current_stock if stock else 0,
            "stock_value": str(stock.stock_value) if stock else '0',
        })

    # 按入库数量排序
    details.sort(key=lambda x: x['in_qty'] + x['out_qty'], reverse=True)

    # 汇总
    total_in_qty = sum(item['in_qty'] for item in details)
    total_in_value = sum(float(item['in_value']) for item in details)
    total_out_qty = sum(item['out_qty'] for item in details)
    total_out_value = sum(float(item['out_value']) for item in details)

    return _json_response(data={
        "month": month_str,
        "summary": {
            "total_in_qty": total_in_qty,
            "total_in_value": str(total_in_value),
            "total_out_qty": total_out_qty,
            "total_out_value": str(total_out_value),
            "material_count": len(details),
        },
        "details": details,
    })
