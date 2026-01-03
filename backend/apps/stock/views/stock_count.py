"""
盘点管理视图
"""
from decimal import Decimal
from datetime import datetime

from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_GET
from django.db.models import F
from django.core.paginator import Paginator
from django.db import transaction
from django.shortcuts import get_object_or_404

from ..models import Stock, StockIn, StockOut, StockCountTask, StockCountItem
from ..utils import (
    json_response, json_error, parse_json_body,
    generate_bill_no, generate_task_no,
    TASK_STATUS_DISPLAY, DIFF_TYPE_DISPLAY
)
from apps.accounts.permissions import require_permission


@csrf_exempt
@require_POST
@require_permission('stock_count:create')
def stock_count_task_create_view(request):
    """创建盘点任务"""
    payload = parse_json_body(request)
    if payload is None:
        return json_error("请求体需要是 JSON", 400)

    created_by = (payload.get("created_by") or "").strip()
    remark = (payload.get("remark") or "").strip()
    if not created_by:
        return json_error("创建人不能为空", 400)

    with transaction.atomic():
        task = StockCountTask.objects.create(
            task_no=generate_task_no(StockCountTask),
            created_by=created_by,
            remark=remark,
            status='pending'
        )
        items = [
            StockCountItem(
                task=task, stock=s,
                material_code=s.material_code,
                material_name=s.material_name,
                book_qty=s.current_stock
            )
            for s in Stock.objects.filter(status='active')
        ]
        StockCountItem.objects.bulk_create(items)

    return json_response(
        data={
            "id": task.id,
            "task_no": task.task_no,
            "item_count": len(items)
        },
        message="盘点任务创建成功"
    )


@csrf_exempt
@require_GET
@require_permission('stock_count:view')
def stock_count_task_list_view(request):
    """盘点任务列表"""
    page = int(request.GET.get("page", 1))
    page_size = int(request.GET.get("page_size", 10))
    status = request.GET.get("status", "").strip()

    queryset = StockCountTask.objects.all()
    if status:
        queryset = queryset.filter(status=status)

    paginator = Paginator(queryset, page_size)
    page_obj = paginator.get_page(page)

    task_list = [{
        "id": task.id,
        "task_no": task.task_no,
        "status": task.status,
        "status_display": TASK_STATUS_DISPLAY.get(task.status, ''),
        "created_by": task.created_by,
        "created_at": task.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "completed_at": task.completed_at.strftime("%Y-%m-%dT%H:%M:%SZ") if task.completed_at else None,
        "item_count": task.items.count(),
        "counted_count": task.items.filter(real_qty__isnull=False).count(),
    } for task in page_obj]

    return json_response(data={
        "total": paginator.count,
        "page": page,
        "page_size": page_size,
        "list": task_list
    })


@csrf_exempt
@require_GET
@require_permission('stock_count:view')
def stock_count_task_detail_view(request, pk):
    """盘点任务详情"""
    task = get_object_or_404(StockCountTask, pk=pk)
    items = [{
        "id": item.id,
        "material_code": item.material_code,
        "material_name": item.material_name,
        "book_qty": item.book_qty,
        "real_qty": item.real_qty,
        "diff_qty": item.diff_qty,
        "diff_type": item.diff_type,
        "diff_type_display": DIFF_TYPE_DISPLAY.get(item.diff_type, ''),
        "operator": item.operator,
        "operated_at": item.operated_at.strftime("%Y-%m-%dT%H:%M:%SZ") if item.operated_at else None,
    } for item in task.items.all()]

    return json_response(data={
        "id": task.id,
        "task_no": task.task_no,
        "status": task.status,
        "status_display": TASK_STATUS_DISPLAY.get(task.status, ''),
        "created_by": task.created_by,
        "remark": task.remark,
        "created_at": task.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "completed_at": task.completed_at.strftime("%Y-%m-%dT%H:%M:%SZ") if task.completed_at else None,
        "items": items,
    })


@csrf_exempt
@require_POST
@require_permission('stock_count:submit')
def stock_count_item_submit_view(request):
    """提交盘点明细"""
    payload = parse_json_body(request)
    if payload is None:
        return json_error("请求体需要是 JSON", 400)

    item_id = payload.get("item_id")
    real_qty = payload.get("real_qty")
    operator = (payload.get("operator") or "").strip()
    remark = (payload.get("remark") or "").strip()

    if item_id is None:
        return json_error("item_id 不能为空", 400)
    if real_qty is None or real_qty < 0:
        return json_error("实盘数量不能为空且不能为负数", 400)

    item = get_object_or_404(StockCountItem, pk=item_id)
    task = item.task
    if task.status == 'done':
        return json_error("该盘点任务已完成", 400)
    if task.status == 'cancelled':
        return json_error("该盘点任务已取消", 400)

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

    return json_response(
        data={
            "id": item.id,
            "diff_qty": item.diff_qty,
            "diff_type": item.diff_type
        },
        message="盘点明细提交成功"
    )


@csrf_exempt
@require_POST
@require_permission('stock_count:complete')
def stock_count_task_complete_view(request, pk):
    """完成盘点"""
    task = get_object_or_404(StockCountTask, pk=pk)
    if task.status == 'done':
        return json_error("该盘点任务已完成", 400)
    if task.status == 'cancelled':
        return json_error("该盘点任务已取消", 400)

    uncounted = task.items.filter(real_qty__isnull=True).count()
    if uncounted > 0:
        return json_error(f"还有 {uncounted} 项未盘点", 400)

    adjust_records = []
    with transaction.atomic():
        for item in task.items.all():
            if item.diff_qty == 0:
                continue
            stock = item.stock
            unit_price = float(stock.unit_price) if stock.unit_price else 0
            adjust_value = abs(item.diff_qty) * unit_price

            if item.diff_type == 'gain':
                bill_no = generate_bill_no("ADJ", StockIn)
                StockIn.objects.create(
                    bill_no=bill_no, stock=stock,
                    material_code=item.material_code,
                    material_name=item.material_name,
                    in_time=datetime.now(),
                    in_quantity=abs(item.diff_qty),
                    in_value=Decimal(str(adjust_value)),
                    in_type='adjust_gain',
                    operator=item.operator or task.created_by,
                    remark=f"盘点任务 {task.task_no} 盘盈调整",
                )
                Stock.objects.filter(pk=stock.pk).update(
                    current_stock=F('current_stock') + abs(item.diff_qty),
                    stock_value=F('stock_value') + Decimal(str(adjust_value)),
                )
                adjust_records.append({
                    "material_code": item.material_code,
                    "type": "gain",
                    "qty": abs(item.diff_qty)
                })

            elif item.diff_type == 'loss':
                bill_no = generate_bill_no("ADJ", StockOut)
                StockOut.objects.create(
                    bill_no=bill_no, stock=stock,
                    material_code=item.material_code,
                    material_name=item.material_name,
                    out_time=datetime.now(),
                    out_quantity=abs(item.diff_qty),
                    out_value=Decimal(str(adjust_value)),
                    out_type='adjust_loss',
                    operator=item.operator or task.created_by,
                    remark=f"盘点任务 {task.task_no} 盘亏调整",
                )
                Stock.objects.filter(pk=stock.pk).update(
                    current_stock=F('current_stock') - abs(item.diff_qty),
                    stock_value=F('stock_value') - Decimal(str(adjust_value)),
                )
                adjust_records.append({
                    "material_code": item.material_code,
                    "type": "loss",
                    "qty": abs(item.diff_qty)
                })

        task.status = 'done'
        task.completed_at = datetime.now()
        task.save()

    return json_response(
        data={
            "id": task.id,
            "adjust_count": len(adjust_records),
            "adjust_records": adjust_records
        },
        message="盘点完成"
    )


@csrf_exempt
@require_POST
@require_permission('stock_count:complete')
def stock_count_task_cancel_view(request, pk):
    """取消盘点任务"""
    task = get_object_or_404(StockCountTask, pk=pk)
    if task.status == 'done':
        return json_error("该盘点任务已完成，无法取消", 400)
    if task.status == 'cancelled':
        return json_error("该盘点任务已取消", 400)

    task.status = 'cancelled'
    task.save()
    return json_response(message="盘点任务已取消")
