from django.urls import path

from .views import (
    login_view,
    register_view,
    logout_view,
    profile_view,
    change_password_view,
    user_list_view,
    user_detail_view,
    user_create_view,
    user_update_view,
    user_delete_view,
    user_reset_password_view,
    role_list_view,
    permission_list_view,
    user_role_view,
)

urlpatterns = [
    path("login/", login_view, name="login"),
    path("register/", register_view, name="register"),
    path("logout/", logout_view, name="logout"),
    path("profile/", profile_view, name="profile"),
    path("change-password/", change_password_view, name="change_password"),
    # 用户管理（管理员）
    path("users/", user_list_view, name="user_list"),
    path("users/create/", user_create_view, name="user_create"),
    path("users/<int:pk>/", user_detail_view, name="user_detail"),
    path("users/<int:pk>/update/", user_update_view, name="user_update"),
    path("users/<int:pk>/delete/", user_delete_view, name="user_delete"),
    path("users/<int:pk>/reset-password/", user_reset_password_view, name="user_reset_password"),
    # 角色管理
    path("roles/", role_list_view, name="role_list"),
    path("permissions/", permission_list_view, name="permission_list"),
    path("users/<int:pk>/roles/", user_role_view, name="user_role"),
]
