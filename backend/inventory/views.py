import json
from decimal import Decimal
from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.utils import timezone
from django.db.models import F, Q
from django.core.paginator import Paginator
from .models import Stock, StockIn


@method_decorator(csrf_exempt, name='dispatch')
class StockInitView(View):
    """物料初始化接口"""

    def post(self, request):
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'code': 400, 'message': '无效的JSON格式', 'data': None})

        material_code = data.get('material_code')
        material_name = data.get('material_name')

        if not material_code or not material_name:
            return JsonResponse({'code': 400, 'message': '物料编号和物料名称为必填项', 'data': None})

        if Stock.objects.filter(material_code=material_code).exists():
            return JsonResponse({'code': 400, 'message': '物料编号已存在', 'data': None})

        stock = Stock.objects.create(
            material_code=material_code,
            material_name=material_name,
            max_stock=data.get('max_stock', 0),
            min_stock=data.get('min_stock', 0),
            stock_value=Decimal(str(data.get('stock_value', 0)))
        )

        return JsonResponse({
            'code': 200,
            'message': '物料初始化成功',
            'data': {
                'id': stock.id,
                'material_code': stock.material_code,
                'material_name': stock.material_name,
                'max_stock': stock.max_stock,
                'min_stock': stock.min_stock,
                'current_stock': stock.current_stock,
                'stock_value': str(stock.stock_value),
                'created_at': stock.created_at.isoformat()
            }
        })


@method_decorator(csrf_exempt, name='dispatch')
class StockListView(View):
    """获取库存列表接口"""

    def get(self, request):
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 10))
        search = request.GET.get('search', '')

        queryset = Stock.objects.all()

        if search:
            queryset = queryset.filter(
                Q(material_code__icontains=search) | Q(material_name__icontains=search)
            )

        queryset = queryset.order_by('-created_at')
        total = queryset.count()

        paginator = Paginator(queryset, page_size)
        stocks = paginator.get_page(page)

        stock_list = [{
            'id': stock.id,
            'material_code': stock.material_code,
            'material_name': stock.material_name,
            'max_stock': stock.max_stock,
            'min_stock': stock.min_stock,
            'current_stock': stock.current_stock,
            'stock_value': str(stock.stock_value)
        } for stock in stocks]

        return JsonResponse({
            'code': 200,
            'message': 'success',
            'data': {
                'total': total,
                'page': page,
                'page_size': page_size,
                'list': stock_list
            }
        })


@method_decorator(csrf_exempt, name='dispatch')
class StockDetailView(View):
    """获取库存详情接口"""

    def get(self, request, pk):
        try:
            stock = Stock.objects.get(pk=pk)
        except Stock.DoesNotExist:
            return JsonResponse({'code': 404, 'message': '库存记录不存在', 'data': None})

        return JsonResponse({
            'code': 200,
            'message': 'success',
            'data': {
                'id': stock.id,
                'material_code': stock.material_code,
                'material_name': stock.material_name,
                'max_stock': stock.max_stock,
                'min_stock': stock.min_stock,
                'current_stock': stock.current_stock,
                'stock_value': str(stock.stock_value),
                'created_at': stock.created_at.isoformat(),
                'updated_at': stock.updated_at.isoformat()
            }
        })


@method_decorator(csrf_exempt, name='dispatch')
class StockInView(View):
    """入库记录接口 - GET获取列表，POST创建记录"""

    def get(self, request):
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 10))
        search = request.GET.get('search', '')
        start_time = request.GET.get('start_time')
        end_time = request.GET.get('end_time')

        queryset = StockIn.objects.all()

        if search:
            queryset = queryset.filter(
                Q(material_code__icontains=search) | Q(material_name__icontains=search)
            )

        if start_time:
            queryset = queryset.filter(in_time__gte=start_time)

        if end_time:
            queryset = queryset.filter(in_time__lte=end_time)

        queryset = queryset.order_by('-in_time')
        total = queryset.count()

        paginator = Paginator(queryset, page_size)
        stock_ins = paginator.get_page(page)

        stock_in_list = [{
            'id': si.id,
            'material_code': si.material_code,
            'material_name': si.material_name,
            'in_time': si.in_time.isoformat(),
            'in_quantity': si.in_quantity,
            'in_value': str(si.in_value)
        } for si in stock_ins]

        return JsonResponse({
            'code': 200,
            'message': 'success',
            'data': {
                'total': total,
                'page': page,
                'page_size': page_size,
                'list': stock_in_list
            }
        })

    def post(self, request):
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'code': 400, 'message': '无效的JSON格式', 'data': None})

        material_code = data.get('material_code')
        in_quantity = data.get('in_quantity')
        in_value = data.get('in_value')

        if not material_code or in_quantity is None or in_value is None:
            return JsonResponse({'code': 400, 'message': '物料编号、入库数量和入库价值为必填项', 'data': None})

        try:
            stock = Stock.objects.get(material_code=material_code)
        except Stock.DoesNotExist:
            return JsonResponse({'code': 400, 'message': '物料编号不存在，请先初始化物料', 'data': None})

        # 检查是否超过最大库存量
        if stock.max_stock > 0 and stock.current_stock + in_quantity > stock.max_stock:
            return JsonResponse({'code': 400, 'message': '入库后将超过最大库存量', 'data': None})

        # 解析入库时间
        in_time_str = data.get('in_time')
        if in_time_str:
            in_time = timezone.datetime.fromisoformat(in_time_str.replace('Z', '+00:00'))
        else:
            in_time = timezone.now()

        # 创建入库记录
        stock_in = StockIn.objects.create(
            stock=stock,
            material_code=material_code,
            material_name=stock.material_name,
            in_time=in_time,
            in_quantity=in_quantity,
            in_value=Decimal(str(in_value))
        )

        # 使用F()表达式原子更新库存
        Stock.objects.filter(pk=stock.pk).update(
            current_stock=F('current_stock') + in_quantity,
            stock_value=F('stock_value') + Decimal(str(in_value))
        )

        return JsonResponse({
            'code': 200,
            'message': '入库成功',
            'data': {
                'id': stock_in.id,
                'material_code': stock_in.material_code,
                'material_name': stock_in.material_name,
                'in_time': stock_in.in_time.isoformat(),
                'in_quantity': stock_in.in_quantity,
                'in_value': str(stock_in.in_value),
                'created_at': stock_in.created_at.isoformat()
            }
        })


@method_decorator(csrf_exempt, name='dispatch')
class StockInDetailView(View):
    """获取入库记录详情接口"""

    def get(self, request, pk):
        try:
            stock_in = StockIn.objects.get(pk=pk)
        except StockIn.DoesNotExist:
            return JsonResponse({'code': 404, 'message': '入库记录不存在', 'data': None})

        return JsonResponse({
            'code': 200,
            'message': 'success',
            'data': {
                'id': stock_in.id,
                'material_code': stock_in.material_code,
                'material_name': stock_in.material_name,
                'in_time': stock_in.in_time.isoformat(),
                'in_quantity': stock_in.in_quantity,
                'in_value': str(stock_in.in_value),
                'created_at': stock_in.created_at.isoformat()
            }
        })
