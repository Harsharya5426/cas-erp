# Centre for Advanced Studies (AKTU Lucknow) — Enterprise Educational ERP (`cas.erp`)

> ### 💡 Why This Exists (The Problem Solved)
> **My institution had no centralized ERP system** — resulting in manual paperwork, fragmented academic records, and disconnected administrative operations.  
> **I engineered this platform from scratch to solve that problem**: delivering a single, unified digital ERP that connects **students, faculty, staff, and administration** with automated admissions, dynamic timetables, balanced fee accounting, and tamper-evident QR credentials.

A secure, bilingual (**English / हिन्दी**), WCAG 2.2 AA accessible, audit-logged educational ERP built on the **MERN stack** (**MongoDB Atlas, Express 5, React 18, Node.js**) with TypeScript, role-based access control (RBAC), and automated disaster recovery.

---

## 🚀 Live Cloud Deployments

| Component | Cloud Platform | Live Endpoint / Connection | Details |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | **Vercel** | `https://your-vercel-domain.vercel.app` | React 18, Vite 8, Light Theme Default, Responsive SPA |
| **Backend REST API** | **Render** | `https://cas-erp-api.onrender.com/api/v1` | Express 5, TypeScript 5.8, Ephemeral 256-bit Secrets |
| **Database Cluster** | **MongoDB Atlas** | `cluster0.rappkok.mongodb.net/cas_erp` | Multi-AZ ReplicaSet, 56 Collections, Strict Validation |

📄 **Institutional Credentials & Deployment PDF**: [CAS_ERP_Deployment_Credentials.pdf](file:///d:/ACADEMICS/KHATARNAK/cas.ERP/CAS_ERP_Deployment_Credentials.pdf)

---

## 🔑 Master Credentials & 12 Institutional Roles

> **Universal Master Password for All Seed Accounts:** `CasErp@2026!`

| Role / Authority | Official User / Designation | Login Email (Username) | Default Password | Module Access Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | Vikramaditya Dave | `superadmin@cas.res.in` | `CasErp@2026!` | Global System Config, Audit Logs, Module Toggles |
| **Director / Principal** | Prof. S. P. Shukla | `principal@cas.res.in` | `CasErp@2026!` | Institutional Executive Dashboard, Merit Approvals |
| **College Admin** | Dr. R. K. Tiwari | `admin@cas.res.in` | `CasErp@2026!` | College Operations, Timetables, Departments, Programs |
| **Dean Academics / HOD** | Dr. Anuj Kumar Sharma | `hod.cse@cas.res.in` | `CasErp@2026!` | Academic Affairs, Faculty Allocations, Syllabi |
| **Faculty / Assistant Prof** | Dr. Saurabh Mishra | `faculty@cas.res.in` | `CasErp@2026!` | Attendance Marking, Assignment Grading, Internal Marks |
| **Student** | Aarav Sharma | `student@cas.res.in` | `CasErp@2026!` | Student Dashboard, Attendance, Fee Receipts, QR Verifications |
| **Parent / Guardian** | Manoj Sharma | `parent@cas.res.in` | `CasErp@2026!` | Student Progress, Fee Invoices, Academic Notices |
| **Accountant / Finance** | R. Sharma | `accounts@cas.res.in` | `CasErp@2026!` | Fee Plans, Invoices, Cashfree & Offline Ledgers |
| **Admission Officer** | Neha Verma | `admissions@cas.res.in` | `CasErp@2026!` | Application Verification, Merit Roster, Seat Allotment |
| **Controller of Exams** | Dr. P. Mishra | `exam@cas.res.in` | `CasErp@2026!` | Exam Schedules, Marks Entry Lock, Result Publishing |
| **Librarian** | S. Kulkarni | `library@cas.res.in` | `CasErp@2026!` | Book Catalog, Circulation, Overdue Tracking |
| **Hostel Warden** | A. Chauhan | `warden@cas.res.in` | `CasErp@2026!` | Room Allocations, Hostel Invoices, Grievances |

---

## 🏛️ Institutional Standards & Architecture Baseline
- **Institution**: Centre for Advanced Studies, Dr. A.P.J. Abdul Kalam Technical University (AKTU), Sector 11, Jankipuram Extension, Lucknow, Uttar Pradesh, India
- **Currency**: `INR` (`₹`, Indian numbering formatting via `formatINR`)
- **Timezone & Date Display**: Stored in **UTC**, rendered in `Asia/Kolkata` as `DD-MM-YYYY` / `DD-MM-YYYY HH:mm IST`
- **Localization**: Native bilingual English (`en`) and Hindi (`hi`) with `Noto Sans Devanagari`
- **Accessibility Target**: WCAG 2.2 AA (`skip-link`, `:focus-visible`, `prefers-reduced-motion`, labeled form controls, verified with `@axe-core/playwright`)
- **Visual Design**: High-contrast Light Theme by default with zero-flash rendering, interactive stationary navbar with moving updates ticker stacking cleanly underneath expanded dropdowns.

---

## 📁 Repository Structure

```text
cas.ERP/
├── apps/
│   ├── api/                  # @cas-erp/api: Express 5 modular monolith (/api/v1), TypeScript, Mongoose
│   └── web/                  # @cas-erp/web: React 18 + Vite 8 + Tailwind CSS bilingual web portal
├── packages/
│   └── shared/               # @cas-erp/shared: 12 role templates, permission verbs, formatters, Zod schemas
├── scripts/
│   ├── create-backup.mjs     # Automated JSON database backup with SHA-256 integrity hashing
│   ├── restore-backup.mjs    # Verified database restore utility
│   ├── verify-backup-restore.mjs # Disaster Recovery (DR) simulation engine
│   └── generate-deployment-pdf.mjs # High-contrast credentials PDF generator
├── tests/
│   └── e2e/                  # Playwright + @axe-core/playwright WCAG 2.2 AA E2E test suites
├── render.yaml               # One-click Render Blueprint definition
├── vercel.json               # Root Vercel monorepo routing configuration
└── CAS_ERP_Deployment_Credentials.pdf # Compiled institutional access & deployment manifest
```

---

## ⚙️ Core Modules & Functional Capabilities

1. **Identity & Granular RBAC**:
   - `scrypt` password hashing, 5-attempt account lockout, rotating `HttpOnly` refresh cookies, session revocation.
   - 12 role profiles + ABAC scopes, emergency break-glass access, and append-only `AuditEvent` logging.
2. **Public Institutional Portal & Admissions**:
   - Bilingual public home, circulars, announcements, and program details.
   - Self-service online applicant intake, PIN tracking, document upload, and automatic Student + Invoice conversion upon approval.
3. **Academics, Dynamic Timetable & Portals**:
   - Full Department $\rightarrow$ Program $\rightarrow$ Subject academic catalogue.
   - Room, faculty, and batch conflict-checked timetable engine with printable PDF schedules.
4. **Attendance Management**:
   - Lecture attendance tracking (`manual`, `qr`, `device`), duplicate idempotency check, threshold alerts (`<75%`), and employee biometric punch simulator.
5. **Double-Entry Accounting & Fee Management**:
   - Fee plans, student invoices, offline cashier receipts with `Idempotency-Key`, Cashfree hosted payment verification, and **append-only balanced `LedgerEntry` vouchers** (`totalDebit === totalCredit`).
6. **Examinations & Basic LMS**:
   - Exam schedules, marks entry, HOD/Controller verification, audit-locked SGPA/CGPA publication, and course note downloads.
7. **Tamper-Evident QR Verification**:
   - HMAC-SHA256 encrypted verification for offline validation of transcripts, admit cards, and fee receipts.

---

## 🛠️ Local Setup & Quick Start

### Prerequisites
- Node.js `>= 22` and npm `>= 10`
- MongoDB running locally on `127.0.0.1:27017` or MongoDB Atlas URI

### Installation & Run
```bash
# 1. Clone the repository
git clone https://github.com/Harsharya5426/cas-erp.git
cd cas-erp

# 2. Install dependencies across all monorepo workspaces
npm install

# 3. Build packages and seed initial demo data
npm run build
npm run seed

# 4. Start local development servers (Frontend: 5173, Backend: 4000)
npm run dev
```

---

## 🔒 Backup, Disaster Recovery & Verification Commands

```bash
# Run static analysis and linting
npm run lint

# Typecheck TypeScript packages
npm run typecheck

# Full production monorepo build
npm run build

# Take an instant SHA-256 verified database backup
npm run backup

# Restore the latest database backup
npm run restore

# Run automated Disaster Recovery (DR) simulation (RTO < 750ms)
npm run verify:dr

# Run Playwright E2E and WCAG 2.2 AA accessibility tests
npm run test:e2e
```

---

## 📜 License
Developed for the Centre for Advanced Studies (Dr. A.P.J. Abdul Kalam Technical University, Lucknow). Created by Harsh Arya.
