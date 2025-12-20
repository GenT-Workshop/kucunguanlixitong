import json

from django.contrib.auth import get_user_model
from django.test import Client, TestCase


class LoginViewTests(TestCase):
    def setUp(self) -> None:
        user_model = get_user_model()
        self.user = user_model.objects.create_user(
            username="tester",
            email="tester@example.com",
            password="StrongPass123"
        )
        self.client = Client()

    def test_json_login_succeeds(self) -> None:
        response = self.client.post(
            "/api/login/",
            data=json.dumps({"username": "tester", "password": "StrongPass123"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["code"], 200)
        self.assertEqual(payload["data"]["username"], "tester")

    def test_invalid_credentials_return_401(self) -> None:
        response = self.client.post(
            "/api/login/",
            data=json.dumps({"username": "tester", "password": "wrong-password"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 401)

    def test_missing_fields_return_400(self) -> None:
        response = self.client.post(
            "/api/login/",
            data=json.dumps({"username": "tester"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)


class RegisterViewTests(TestCase):
    def setUp(self) -> None:
        self.client = Client()

    def test_register_succeeds(self) -> None:
        response = self.client.post(
            "/api/register/",
            data=json.dumps({
                "username": "newuser",
                "email": "newuser@example.com",
                "password": "StrongPass123"
            }),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["code"], 200)
        self.assertEqual(payload["data"]["username"], "newuser")

    def test_duplicate_username_return_400(self) -> None:
        # 先创建用户
        user_model = get_user_model()
        user_model.objects.create_user(
            username="existuser",
            email="exist@example.com",
            password="StrongPass123"
        )

        response = self.client.post(
            "/api/register/",
            data=json.dumps({
                "username": "existuser",
                "email": "new@example.com",
                "password": "StrongPass123"
            }),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
