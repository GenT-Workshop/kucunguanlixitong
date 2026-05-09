from django.contrib import admin
from django.conf import settings
from django.http import FileResponse, Http404
from django.urls import include, path
from django.views.static import serve

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("apps.accounts.urls")),
    path("api/", include("apps.stock.urls")),
    path(
        "assets/<path:path>",
        serve,
        {"document_root": settings.FRONTEND_DIST_DIR / "assets"},
    ),
]


def frontend_index(_request):
    index_path = settings.FRONTEND_DIST_DIR / "index.html"
    if not index_path.exists():
        raise Http404("frontend build not found")
    return FileResponse(index_path.open("rb"), content_type="text/html")


def frontend_file_or_index(request, _path):
    file_path = (settings.FRONTEND_DIST_DIR / _path).resolve()
    frontend_dir = settings.FRONTEND_DIST_DIR.resolve()
    if file_path.is_file() and frontend_dir in file_path.parents:
        return FileResponse(file_path.open("rb"))
    return frontend_index(request)


urlpatterns += [
    path("", frontend_index),
    path("<path:_path>", frontend_file_or_index),
]
