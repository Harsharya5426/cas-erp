# Centre for Advanced Studies (AKTU Lucknow) — Enterprise Educational ERP (`cas.erp`)

A secure, bilingual (**English / हिन्दी**), responsive, audit-logged educational ERP built on **MERN** (**MongoDB/Mongoose, Express 5, React 19, Node.js**) with an optional isolated **Python FastAPI** advisory ML service and portable **AWS Infrastructure-as-Code**.

Built and upgraded against the complete 21-document PRD specification in [docs/prd/](file:///d:/ACADEMICS/ANTIGRAVITY/docs/prd).

---

## 1. Institutional Baseline & Standards
- **Institution**: Centre for Advanced Studies, Dr. A.P.J. Abdul Kalam Technical University (AKTU), Sector 11, Jankipuram Extension, Lucknow, Uttar Pradesh, India
- **Currency**: `INR` (`₹`, Indian numbering formatting via `formatINR`)
- **Timezone & Date Display**: Stored in **UTC**, rendered in `Asia/Kolkata` as `DD-MM-YYYY` / `DD-MM-YYYY HH:mm IST`
- **Localization**: Native bilingual `i18next` English (`en`) and Hindi (`hi`) with `Noto Sans Devanagari` (no external machine-translation widget)
- **Accessibility Target**: WCAG 2.2 AA (`skip-link`, `:focus-visible`, `prefers-reduced-motion`, labeled form controls, verified with `@axe-core/playwright`)
- **Initial Scope Exclusions** (`13_Functional_Module_PRDs.md`): Dedicated transport management, native mobile apps, live classroom video/AI tutor/integrated proctored online exams

---

## 2. Repository Structure

```text
d:\ACADEMICS\ANTIGRAVITY\
├── docs/
│   ├── prd/                  # Complete 21-document PRD package + manifest
│   ├── architecture/         # Architecture reference, RTM, Design System, Threat Model & Risk Register
│   └── runbooks/             # Operations, incident response & DR restore runbook
├── packages/shared/          # @cas-erp/shared: 12 role templates, permission verbs, formatters, Zod schemas
├── apps/
│   ├── api/                  # @cas-erp/api: Express 5 modular monolith (/api/v1), OpenAPI 3.1, Mongoose
│   └── web/                  # @cas-erp/web: React 19 + Vite 8 + Tailwind CSS bilingual web portal
├── services/ml/              # Optional isolated Python FastAPI advisory-only ML service
├── infra/                    # Non-root Dockerfiles, docker-compose.yml, AWS Terraform IaC
├── scripts/                  # DR backup/restore verification script
├── tests/e2e/                # Playwright + @axe-core/playwright WCAG 2.2 AA E2E suites
└── .github/workflows/        # GitHub Actions DevSecOps CI pipeline
```

---

## 3. Implemented Functional Modules & Safeguards
- **Identity, Scoped RBAC & Governance**: `scrypt` password hashing, 5-attempt account lockout, TOTP MFA + recovery codes, rotating `HttpOnly` refresh cookies, session listing/revocation, 12 configurable roles + ABAC scopes, versioned approval workflows, emergency break-glass access, and append-only `AuditEvent` logging.
- **Public Website/CMS & Admissions**: Public CMS pages, notices, online applicant intake with tracking PIN, document upload (magic-byte check + private storage adapter), verification -> approval workflow, and atomic Student + Invoice conversion.
- **Academics, Timetable & Portals**: Configurable `Department -> Program -> Subject` catalogue, scoped Student & Employee directories, relationship-verified/revocable `GuardianLink` parent portal, room/faculty/batch conflict-checked timetable.
- **Attendance & Biometric Safeguards**: Lecture attendance (`manual`, `qr`, `rfid`, `device`), QR session check-in with duplicate idempotency, correction requests + HOD approval, shortage threshold alerts (`<75%`), employee check-in/out punches, and **hard policy gate** disabling facial matching (`BIOMETRIC_POLICY_APPROVED=false`) until privacy assessment and consent are approved.
- **Fees, Cashfree & Double-Entry Accounting**: Fee plans, invoices, offline receipts (`Idempotency-Key`), Cashfree hosted order/server-to-server verification + raw-body HMAC-SHA256 webhooks, dual-control refunds, and **append-only balanced `LedgerEntry` vouchers** (`totalDebitInr === totalCreditInr`).
- **Exams & Basic LMS**: Exam schedules, marks entry, HOD/Controller verification, audit-locked SGPA/CGPA publication, admit-card eligibility, revaluation requests, and course notes/assignments/submissions.
- **HR, Unified Leave & Payroll**: Unified student leave/outpass & employee leave (`CL`, `SL`, `EL`, `MEDICAL`, `MATERNITY`, `PATERNITY`, `UNPAID`, `SPECIAL`) with balance deduction, holiday calendar, and SoD-enforced payroll runs.
- **Campus Ecosystem & Governed AI**: Library catalogue & circulation, Hostel & Mess allocations, Documents & QR-verifiable certificates, Confidentiality-isolated Grievances & Helpdesk, Placement & Alumni, Inventory & 2-step Procurement, Events, Research, Safety incidents & minimal-PII Visitor Register (`90`-day TTL), Audited CSV exports, and Advisory-only AI assistant with admin kill switch.

---

## 4. Local Setup & Verification

### Prerequisites
- Node.js `>= 22` and npm `>= 10`
- MongoDB `8.x` running on `127.0.0.1:27017`
- Python `3.12+` *(optional, for `services/ml`)*

### Quick Start
1. Copy the environment template (never commit `.env` or real secrets):
   ```bash
   cp .env.example .env
   ```
2. Install dependencies, build all workspaces, and seed synthetic placeholder data:
   ```bash
   npm install
   npm run build
   npm run seed
   ```
3. Launch API (`http://localhost:4000`) and Web (`http://localhost:5173`):
   ```bash
   npm run dev
   ```
   - **Public Portal & Online Admissions**: `http://localhost:5173/#public`
   - **API Health / Readiness / OpenAPI Docs**:
     - `http://localhost:4000/api/v1/healthz`
     - `http://localhost:4000/api/v1/readyz`
     - `http://localhost:4000/api/v1/docs` (`openapi.json` at `/api/v1/openapi.json`)

### Optional Python ML Sidecar
```bash
cd services/ml
python -m venv .venv
# Windows: .venv\Scripts\activate  |  Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8001
```

### Synthetic Development Seed Accounts (All 12 PRD Roles)
Password for all synthetic seed accounts: `CasErp@2026!`
- `superadmin@cas.res.in` (`SUPER_ADMIN`)
- `principal@cas.res.in` (`PRINCIPAL`)
- `admin@cas.res.in` (`COLLEGE_ADMIN`)
- `hod.cse@cas.res.in` (`HOD` — CSE)
- `faculty@cas.res.in` (`FACULTY`)
- `student@cas.res.in` (`STUDENT` — linked to `23BCE1042`)
- `parent@cas.res.in` (`PARENT` — verified guardian link to `23BCE1042`)
- `accounts@cas.res.in` (`ACCOUNTANT`)
- `admissions@cas.res.in` (`ADMISSION_OFFICER`)
- `exam@cas.res.in` (`EXAM_CONTROLLER`)
- `library@cas.res.in` (`LIBRARIAN`)
- `warden@cas.res.in` (`HOSTEL_WARDEN`)

### Quality, Security & DR Verification Commands
```bash
npm run lint
npm run typecheck
npm run build
npm test
npm run verify:dr
npm run test:e2e
npm audit --audit-level=high
```

---

## 5. Known Limitations & Pending Institutional Discovery
Per [15_Open_Questions_and_Discovery.md](file:///d:/ACADEMICS/ANTIGRAVITY/docs/prd/15_Open_Questions_and_Discovery.md) and [19_Configuration_Checklist.md](file:///d:/ACADEMICS/ANTIGRAVITY/docs/prd/19_Configuration_Checklist.md):
1. Seeded departments, programs, subjects, and accounts are **synthetic placeholders** until the verified CAS AKTU academic catalogue and legacy ERP extracts are supplied.
2. **Cashfree**, **Email/SMS/WhatsApp**, **Google/Microsoft SSO**, and **AKTU import/export** run behind disabled/sandbox adapters until merchant/vendor credentials and written authorizations are provisioned in AWS Secrets Manager.
3. **Biometric face matching** stays blocked by default (`BIOMETRIC_POLICY_APPROVED=false`) pending privacy impact review, legal sign-off, and hardware SDK selection.
4. Cloud residency, RTO/RPO SLA targets, and statutory payroll/GST/TDS rules require institutional legal and finance sign-off prior to production go-live.
