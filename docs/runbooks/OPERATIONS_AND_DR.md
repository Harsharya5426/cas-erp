# CAS ERP Operations, Security & Disaster Recovery Runbook

## 1. Health & Readiness Endpoints
- **Liveness**: `GET /api/v1/healthz` -> `200 OK`
- **Readiness**: `GET /api/v1/readyz` -> `200 OK` when MongoDB connection `readyState === 1`, otherwise `503`.

## 2. Backup & Restore Drill Verification
Run the automated DR restore exercise (Acceptance Criteria Journey #12):
```bash
npm run seed
npm run verify:dr
```
The script snapshots all MongoDB collections with SHA-256 checksums, restores into an isolated temporary database (`cas_erp_dr_verify_*`), verifies exact document counts and double-entry ledger balance (`totalDebitInr === totalCreditInr`), measures RTO latency, and cleans up the verification database.

## 3. Incident Response & Break-Glass Policy
- Rotate compromised `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` / `CASHFREE_WEBHOOK_SECRET` immediately in AWS Secrets Manager and restart ECS tasks.
- Revoke active user sessions via `DELETE /api/v1/auth/sessions/:id` or suspend compromised accounts via `PATCH /api/v1/rbac/users/:id/status` (auto-revokes all active sessions).
- Inspect `GET /api/v1/rbac/audit-events` for denied access attempts, failed logins, webhook signature rejections, and bulk exports.

