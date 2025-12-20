from django.db import models
from django.contrib.auth.models import User


class Token(models.Model):
    """用户Token表"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, verbose_name='用户')
    key = models.CharField(max_length=100, unique=True, verbose_name='Token')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        db_table = 'auth_token'
        verbose_name = '用户Token'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f"{self.user.username} - {self.key}"
