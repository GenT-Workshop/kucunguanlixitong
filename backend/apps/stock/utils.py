"""
库存模块公共工具函数和常量
"""
import json
from decimal import Decimal

from django.http import JsonResponse
from django.utils import timezone


# ==================== 响应工具函数 ====================

def json_response(data=None, message="success", code=200):
    """统一 JSON 响应格式"""
    return JsonResponse({"code": code, "message": message, "data": data}, status=code if code < 500 else 200)


def json_error(message: str, code: int = 400):
    """错误响应"""
    return json_response(data=None, message=message, code=code)


def parse_json_body(request):
    """解析 JSON 请求体"""
    try:
        return json.loads(request.body.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        return None


# ==================== 单据号生成 ====================

def generate_bill_no(prefix, model_class):
    """生成单据号 (格式: 前缀-YYYYMMDD-####)"""
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


def generate_task_no(model_class):
    """生成盘点任务号 (格式: SC-YYYYMMDD-####)"""
    today = timezone.now().strftime('%Y%m%d')
    prefix_str = f"SC-{today}-"
    last_task = model_class.objects.filter(task_no__startswith=prefix_str).order_by('-task_no').first()
    new_num = int(last_task.task_no.split('-')[-1]) + 1 if last_task else 1
    return f"{prefix_str}{new_num:04d}"


# ==================== 库存状态计算 ====================

def get_stock_status(stock):
    """计算库存状态"""
    if stock.min_stock > 0 and stock.current_stock <= stock.min_stock:
        return 'low'
    elif stock.max_stock > 0 and stock.current_stock >= stock.max_stock:
        return 'high'
    return 'normal'


# ==================== 显示映射常量 ====================

STOCK_STATUS_DISPLAY = {
    'low': '库存不足',
    'high': '库存过高',
    'normal': '正常'
}

OUT_TYPE_DISPLAY = {
    'production': '生产领料',
    'sales': '销售提货',
    'other': '其他出库',
    'adjust_loss': '盘点盘亏'
}

WARNING_TYPE_DISPLAY = {
    'low': '库存不足',
    'high': '库存过高'
}

LEVEL_DISPLAY = {
    'warning': '警告',
    'danger': '危险'
}

STATUS_DISPLAY = {
    'pending': '待处理',
    'handled': '已处理',
    'ignored': '已忽略'
}

TASK_STATUS_DISPLAY = {
    'pending': '待盘点',
    'doing': '盘点中',
    'done': '已完成',
    'cancelled': '已取消'
}

DIFF_TYPE_DISPLAY = {
    'gain': '盘盈',
    'loss': '盘亏',
    'none': '无差异'
}
