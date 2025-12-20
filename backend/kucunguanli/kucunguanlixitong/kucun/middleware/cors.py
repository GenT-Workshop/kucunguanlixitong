class CorsMiddleware:
    """
    简单的 CORS 中间件，允许跨域请求
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # 获取请求的 Origin
        origin = request.META.get('HTTP_ORIGIN', 'http://localhost:5173')

        # 处理 OPTIONS 预检请求
        if request.method == "OPTIONS":
            from django.http import HttpResponse
            response = HttpResponse()
            response["Access-Control-Allow-Origin"] = origin
            response["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
            response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
            response["Access-Control-Allow-Credentials"] = "true"
            response["Access-Control-Max-Age"] = "86400"
            return response

        response = self.get_response(request)

        # 添加 CORS 响应头
        response["Access-Control-Allow-Origin"] = origin
        response["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response["Access-Control-Allow-Credentials"] = "true"

        return response
