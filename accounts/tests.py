import json

from django.contrib.auth import get_user_model
from django.test import Client, TestCase


class LoginViewTests(TestCase):
    def setUp(self) -> None:
        user_model = get_user_model()
        self.user = user_model.objects.create_user(
            username="tester", password="StrongPass123"
        )
        self.client = Client()

    def test_form_login_succeeds(self) -> None:
        response = self.client.post(
            "/api/login", {"username": "tester", "password": "StrongPass123"}
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload["success"])
        self.assertEqual(payload["data"]["username"], "tester")

    def test_json_login_succeeds(self) -> None:
        response = self.client.post(
            "/api/login",
            data=json.dumps({"username": "tester", "password": "StrongPass123"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload["success"])
        self.assertEqual(payload["data"]["username"], "tester")

    def test_invalid_credentials_return_401(self) -> None:
        response = self.client.post(
            "/api/login", {"username": "tester", "password": "wrong-password"}
        )

        self.assertEqual(response.status_code, 401)
        self.assertFalse(response.json()["success"])

    def test_missing_fields_return_400(self) -> None:
        response = self.client.post("/api/login", {"username": "tester"})

        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.json()["success"])

    def test_non_post_request_not_allowed(self) -> None:
        response = self.client.get("/api/login")

        self.assertEqual(response.status_code, 405)
        self.assertFalse(response.json()["success"])
