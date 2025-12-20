import json
from decimal import Decimal
from datetime import datetime

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db.models import F, Q
from django.core.paginator import Paginator

from .models import Stock, StockIn, StockOut


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

    queryset = Stock.objects.all()

    # 搜索
    if search:
        queryset = queryset.filter(
            Q(material_code__icontains=search) | Q(material_name__icontains=search)
        )

    # 分页
    paginator = Paginator(queryset, page_size)
    page_obj = paginator.get_page(page)

    stock_list = [
        {
            "id": stock.id,
            "material_code": stock.material_code,
            "material_name": stock.material_name,
            "max_stock": stock.max_stock,
            "min_stock": stock.min_stock,
            "current_stock": stock.current_stock,
            "stock_value": str(stock.stock_value),
        }
        for stock in page_obj
    ]

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

    return _json_response(data={
        "id": stock.id,
        "material_code": stock.material_code,
        "material_name": stock.material_name,
        "max_stock": stock.max_stock,
        "min_stock": stock.min_stock,
        "current_stock": stock.current_stock,
        "stock_value": str(stock.stock_value),
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

    if not material_code:
        return _json_error("物料编号不能为空", 400)
    if in_quantity is None or in_quantity <= 0:
        return _json_error("入库数量必须大于0", 400)
    if in_value is None:
        return _json_error("入库价值不能为空", 400)

    # 查找库存记录
    try:
        stock = Stock.objects.get(material_code=material_code)
    except Stock.DoesNotExist:
        return _json_error("物料编号不存在，请先初始化物料", 400)

    # 检查是否超过最大库存量
    if stock.max_stock > 0 and stock.current_stock + in_quantity > stock.max_stock:
        return _json_error("入库后将超过最大库存量", 400)

    # 解析入库时间
    if in_time_str:
        try:
            in_time = datetime.fromisoformat(in_time_str.replace("Z", "+00:00"))
        except ValueError:
            in_time = datetime.now()
    else:
        in_time = datetime.now()

    # 创建入库记录
    stock_in = StockIn.objects.create(
        stock=stock,
        material_code=material_code,
        material_name=stock.material_name,
        in_time=in_time,
        in_quantity=in_quantity,
        in_value=Decimal(str(in_value)),
    )

    # 更新库存（使用F()表达式保证原子操作）
    Stock.objects.filter(pk=stock.pk).update(
        current_stock=F('current_stock') + in_quantity,
        stock_value=F('stock_value') + Decimal(str(in_value)),
    )

    return _json_response(
        data={
            "id": stock_in.id,
            "material_code": stock_in.material_code,
            "material_name": stock_in.material_name,
            "in_time": stock_in.in_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "in_quantity": stock_in.in_quantity,
            "in_value": str(stock_in.in_value),
            "created_at": stock_in.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
        },
        message="入库成功"
    )


@csrf_exempt
def stock_in_list_view(request):
    """获取入库记录列表"""
    if request.method != "GET":
        return _json_error("仅支持 GET 请求", 405)

    page = int(request.GET.get("page", 1))
    page_size = int(request.GET.get("page_size", 10))
    search = request.GET.get("search", "").strip()
    start_time = request.GET.get("start_time")
    end_time = request.GET.get("end_time")

    queryset = StockIn.objects.all()

    # 搜索
    if search:
        queryset = queryset.filter(
            Q(material_code__icontains=search) | Q(material_name__icontains=search)
        )

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
            "material_code": item.material_code,
            "material_name": item.material_name,
            "in_time": item.in_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "in_quantity": item.in_quantity,
            "in_value": str(item.in_value),
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
        "material_code": stock_in.material_code,
        "material_name": stock_in.material_name,
        "in_time": stock_in.in_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "in_quantity": stock_in.in_quantity,
        "in_value": str(stock_in.in_value),
        "created_at": stock_in.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
    })


# ==================== 出库接口 ====================

OUT_TYPE_DISPLAY = {
    'production': '生产领料',
    'sales': '销售提货',
    'other': '其他出库',
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
    if out_type not in ('production', 'sales', 'other'):
        return _json_error("出库类型无效，必须是 production/sales/other", 400)

    # 查找库存记录
    try:
        stock = Stock.objects.get(material_code=material_code)
    except Stock.DoesNotExist:
        return _json_error("物料编号不存在", 400)

    # 检查库存是否充足
    if stock.current_stock < out_quantity:
        return _json_error(f"库存不足，当前库存量为{stock.current_stock}", 400)

    # 解析出库时间
    if out_time_str:
        try:
            out_time = datetime.fromisoformat(out_time_str.replace("Z", "+00:00"))
        except ValueError:
            out_time = datetime.now()
    else:
        out_time = datetime.now()

    # 创建出库记录
    stock_out = StockOut.objects.create(
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

    # 检查库存预警
    stock.refresh_from_db()
    warning_message = ""
    if stock.min_stock > 0 and stock.current_stock <= stock.min_stock:
        warning_message = f"，警告：当前库存({stock.current_stock})已低于最小库存量({stock.min_stock})"

    return _json_response(
        data={
            "id": stock_out.id,
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
        },
        message="出库成功" + warning_message
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
    start_time = request.GET.get("start_time")
    end_time = request.GET.get("end_time")

    queryset = StockOut.objects.all()

    # 搜索
    if search:
        queryset = queryset.filter(
            Q(material_code__icontains=search) | Q(material_name__icontains=search)
        )

    # 出库类型筛选
    if out_type:
        queryset = queryset.filter(out_type=out_type)

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
    """删除出库记录（同时恢复库存）"""
    if request.method != "DELETE":
        return _json_error("仅支持 DELETE 请求", 405)

    try:
        stock_out = StockOut.objects.get(pk=pk)
    except StockOut.DoesNotExist:
        return _json_error("出库记录不存在", 404)

    # 恢复库存
    Stock.objects.filter(pk=stock_out.stock_id).update(
        current_stock=F('current_stock') + stock_out.out_quantity,
        stock_value=F('stock_value') + stock_out.out_value,
    )

    # 删除出库记录
    stock_out.delete()

    return _json_response(message="删除成功，库存已恢复")
