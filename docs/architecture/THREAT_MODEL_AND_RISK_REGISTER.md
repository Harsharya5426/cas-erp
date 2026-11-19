# Threat Model & Risk Register (`08_Security_Privacy_PRD.md`, `16_Risk_Register.md`)

## 1. STRIDE Threat Model & Implemented Controls

| Threat Vector | Target | Mitigation Implemented |
|---|---|---|
| **Spoofing / Credential Stuffing** | `/api/v1/auth/*` | `scrypt` per-user salted hashes, 5-attempt account lockout (15m), TOTP RFC 6238 MFA + single-use recovery codes, short-lived JWT + rotating `HttpOnly` refresh cookies, session revocation. |
| **Tampering / Ledger & Audit Mutability** | `AuditEvent`, `LedgerEntry`, `ExamMark` | Mongoose `pre('updateOne'/'deleteOne'/...)` hooks block modification/deletion of audit & financial ledger rows; published exam marks become immutable; double-entry debit==credit pre-validation. |
| **Repudiation** | Privileged Operations | Immutable `AuditEvent` records capture actor, role, action, resource, outcome (`success`/`denied`/`failure`), request ID, IP, and UTC timestamp on mutations, denials, exports, and break-glass entries. |
| **Information Disclosure** | Grievances, PII, Logs, Storage | Confidential grievances isolated to Principal or assigned pool (Super Admin excluded); Pino redaction masks tokens/passwords/secrets; private object storage + MIME/magic-byte validation; Guardian access strictly verified-link scoped. |
| **Denial of Service / Abuse** | Public APIs & Uploads | Helmet security headers, strict CORS allowlist, express-rate-limit on `/api/v1` and `/auth/login`, 2 MB JSON limit, 10 MB upload limit, idempotency keys on payments and attendance ingest. |
| **Elevation of Privilege** | Role Switching, Workflows, AI | Server-side `requirePermission` + ABAC scoping on every route; role switch restricted to DB-assigned roles; workflow SoD prevents self-approval on refunds/payroll/marks/admissions; AI strictly advisory with PII minimization & admin kill switch. |

## 2. Active Risk Register (Mapped to `16_Risk_Register.md`)

| Risk | Severity | Current Control / Mitigation |
|---|---|---|
| Legacy ERP schema/data quality unknown | High | Dry-run migration profiler (`POST /api/v1/org/migration/batches`) logs row-level rejections & SHA-256 checksums before commit. |
| Unverified AKTU official APIs | High | No scraping or fabricated AKTU integration; configurable versioned `aktuConfig` rules + explicit manual/file import-export workflows. |
| Biometric privacy/legal non-compliance | High | Face matching disabled by default (`BIOMETRIC_POLICY_APPROVED=false` + settings gate); penalty-free Manual/QR/RFID active. |
| Cashfree webhook replay / signature bypass | High | Raw-body HMAC-SHA256 verification, server-to-server order check, unique `idempotencyKey`, and duplicate-settled guard. |
| AI error / bias / prompt injection | High | Advisory-only responses with human-review notice, record citations, and global kill switch. |
| Cloud data residency & subprocessor scope | High | AWS Terraform defaults to `ap-south-1` with KMS encryption and private S3 buckets; legal/subprocessor assessment required before production. |

