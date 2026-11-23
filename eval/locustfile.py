from locust import HttpUser, task, between
import random


class HelpdeskUser(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        self.login()

    def login(self):
        payload = {
            "email": "user@aihas.local",
            "password": "User123!"
        }
        resp = self.client.post("/api/v1/auth/login", json=payload)
        if resp.status_code == 200:
            self.token = resp.json().get("access_token")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            self.headers = {}

    @task(3)
    def check_health(self):
        self.client.get("/api/v1/health")

    @task(2)
    def get_conversations(self):
        self.client.get("/api/v1/chat/conversations", headers=self.headers)

    @task(1)
    def query_kb(self):
        queries = [
            "How do I fix the VPN Gateway Not Reachable error?",
            "What are the Active Directory password requirements?",
            "What is the approval process for Docker Desktop Pro?"
        ]
        self.client.post(
            "/api/v1/kb/query",
            json={"query": random.choice(queries)},
            headers=self.headers
        )
