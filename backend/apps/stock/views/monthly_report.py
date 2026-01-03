"""
月底结存视图
"""
from datetime import datetime

from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET
from django.db.models import Sum, Count
from django.db.models.functions import TruncMonth
from django.utils import timezone

from ..models import Stock, StockIn, StockOut
from ..utils import json_response, json_error
from apps.accounts.permissions import require_permission


@csrf_exempt
@require_GET
@require_permission('monthly_report:view')
def monthly_report_list_view(request):
    """月报列表"""
    end_date = timezone.now().date()
    start_date = end_date.replace(day=1) - timezone.timedelta(days=365)

    in_by_month = {
        item['month'].strftime('%Y-%m'): item
        for item in StockIn.objects.filter(
            in_time__date__gte=start_date
        ).annotate(month=TruncMonth('in_time')).values('month').annotate(
            in_count=Count('id'),
            in_qty=Sum('in_quantity'),
            in_value=Sum('in_value')
        )
    }

    out_by_month = {
        item['month'].strftime('%Y-%m'): item
        for item in StockOut.objects.filter(
            out_time__date__gte=start_date
        ).annotate(month=TruncMonth('out_time')).values('month').annotate(
            out_count=Count('id'),
            out_qty=Sum('out_quantity'),
            out_value=Sum('out_value')
        )
    }

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

    return json_response(data=result)


@csrf_exempt
@require_GET
@require_permission('monthly_report:view')
def monthly_report_detail_view(request):
    """月报详情"""
    month_str = request.GET.get("month", timezone.now().strftime('%Y-%m'))
    try:
        year, month = map(int, month_str.split('-'))
        start_date = datetime(year, month, 1).date()
        next_month = start_date.replace(day=28) + timezone.timedelta(days=4)
        end_date = next_month.replace(day=1)
    except (ValueError, TypeError):
        return json_error("月份格式错误，应为 YYYY-MM", 400)

    in_details = {
        item['material_code']: item
        for item in StockIn.objects.filter(
            in_time__date__gte=start_date, in_time__date__lt=end_date
        ).values('material_code', 'material_name').annotate(
            in_qty=Sum('in_quantity'), in_value=Sum('in_value')
        )
    }

    out_details = {
        item['material_code']: item
        for item in StockOut.objects.filter(
            out_time__date__gte=start_date, out_time__date__lt=end_date
        ).values('material_code', 'material_name').annotate(
            out_qty=Sum('out_quantity'), out_value=Sum('out_value')
        )
    }

    all_codes = set(in_details.keys()) | set(out_details.keys())
    details = []
    total_in_qty, total_in_value = 0, 0
    total_out_qty, total_out_value = 0, 0

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

    return json_response(data={
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
