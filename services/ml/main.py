"""
CAS ERP Advisory-Only ML Microservice (Python / FastAPI)
Per PRD 04, 08, 12, 18:
- Isolated behind authenticated internal API (X-Internal-Service-Token)
- Outputs strictly advisory risk insights and requires human review
- Never autonomously decides admissions, grades, employment, discipline, or grievances
"""

import os
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel

app = FastAPI(title="CAS ERP Advisory ML Service", version="1.0.0")

INTERNAL_TOKEN = os.getenv("ML_SERVICE_TOKEN", "dev_only_internal_ml_token")


class AttendanceRiskRequest(BaseModel):
    role: str
    domain: str


@app.get("/healthz")
def healthz():
    return {"status": "ok", "service": "cas-erp-ml", "advisory_only": True}


@app.post("/v1/advisory/attendance-risk")
def attendance_risk_advisory(
    payload: AttendanceRiskRequest,
    x_internal_service_token: str | None = Header(default=None),
):
    if x_internal_service_token != INTERNAL_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid internal service token")

    return {
        "modelName": "cas-attendance-threshold-heuristic",
        "modelVersion": "1.0.0",
        "advisoryOnly": True,
        "humanReviewRequired": True,
        "note": (
            f"Advisory insight prepared for {payload.role} ({payload.domain}). "
            "Verify shortage notices with faculty and HOD prior to action."
        ),
    }

