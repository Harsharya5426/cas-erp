import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import AttendanceRiskRequest, INTERNAL_TOKEN, app


class TestAdvisoryMlService(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_healthz(self):
        res = self.client.get("/healthz")
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()["advisory_only"])

    def test_rejects_missing_or_invalid_internal_token(self):
        res = self.client.post(
            "/v1/advisory/attendance-risk",
            json={"role": "HOD", "domain": "attendance_risk"},
        )
        self.assertEqual(res.status_code, 401)

    def test_advisory_response_requires_human_review(self):
        req_model = AttendanceRiskRequest(role="HOD", domain="attendance_risk")
        res = self.client.post(
            "/v1/advisory/attendance-risk",
            headers={"X-Internal-Service-Token": INTERNAL_TOKEN},
            json=req_model.model_dump(),
        )
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertTrue(body["advisoryOnly"])
        self.assertTrue(body["humanReviewRequired"])


if __name__ == "__main__":
    unittest.main()

