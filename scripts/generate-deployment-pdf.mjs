import { chromium } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(__dirname, '../CAS_ERP_Deployment_Credentials.pdf');

const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CAS ERP — Production Deployment &amp; Credentials Directory</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700;800&display=swap');

    @page {
      size: A4;
      margin: 16mm 16mm 18mm 16mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #05131d;
      background: #ffffff;
      line-height: 1.5;
      font-size: 10pt;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page-break {
      page-break-before: always;
    }

    /* Institutional Header */
    .header {
      border-bottom: 3px solid #0b5e7e;
      padding-bottom: 14px;
      margin-bottom: 18px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .brand-title {
      font-size: 18pt;
      font-weight: 800;
      color: #04121b;
      letter-spacing: -0.02em;
      line-height: 1.2;
    }

    .brand-subtitle {
      font-size: 11pt;
      color: #0b5e7e;
      font-weight: 700;
      margin-top: 3px;
    }

    .brand-location {
      font-size: 9pt;
      color: #2c4454;
      margin-top: 4px;
      font-weight: 500;
    }

    .meta-badge {
      text-align: right;
      font-size: 8.8pt;
      color: #2c4454;
      line-height: 1.45;
    }

    .meta-badge strong {
      color: #04121b;
    }

    .status-pill {
      display: inline-block;
      background: #047857;
      color: #ffffff;
      border-radius: 6px;
      padding: 3px 10px;
      font-size: 8.5pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 6px;
    }

    /* Headings */
    h2 {
      font-size: 13pt;
      font-weight: 800;
      color: #051824;
      margin-top: 18px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 2px solid #b8d2e2;
      padding-bottom: 5px;
    }

    h2 .section-num {
      background: #0b5e7e;
      color: #ffffff;
      border-radius: 4px;
      padding: 2px 7px;
      font-size: 9.5pt;
      font-weight: 800;
    }

    /* Architecture Cards */
    .arch-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 18px;
    }

    .arch-card {
      border: 1.5px solid #94b8ce;
      border-radius: 8px;
      padding: 12px 14px;
      background: #f4f8fb;
      border-left: 5px solid #0b5e7e;
    }

    .arch-card.backend {
      border-left-color: #1a6268;
    }

    .arch-card.database {
      border-left-color: #047857;
    }

    .arch-card-title {
      font-size: 11pt;
      font-weight: 800;
      color: #04121b;
      margin-bottom: 3px;
    }

    .arch-card-platform {
      font-size: 8.5pt;
      color: #0b5e7e;
      font-weight: 800;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .arch-card-link {
      font-family: 'JetBrains Mono', monospace;
      font-size: 8.8pt;
      font-weight: 700;
      color: #0b4f6c;
      word-break: break-all;
      background: #ffffff;
      border: 1.5px solid #94b8ce;
      border-radius: 5px;
      padding: 6px 8px;
      display: block;
      margin-top: 6px;
      line-height: 1.35;
    }

    .arch-card-tech {
      font-size: 8.5pt;
      color: #1a3648;
      font-weight: 600;
      margin-top: 8px;
      line-height: 1.4;
    }

    /* Master Credentials Alert */
    .master-alert {
      background: #eef6fa;
      border: 2px solid #0b5e7e;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .master-alert-text {
      font-size: 10pt;
      color: #04121b;
      line-height: 1.4;
    }

    .master-pwd-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13pt;
      font-weight: 800;
      color: #04121b;
      background: #ffffff;
      border: 2px solid #0b5e7e;
      border-radius: 6px;
      padding: 6px 14px;
      letter-spacing: 0.04em;
    }

    /* Table */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.2pt;
      margin-top: 8px;
      margin-bottom: 14px;
      border: 1.5px solid #7ea4bd;
    }

    th {
      background: #09202f;
      color: #ffffff;
      text-align: left;
      padding: 8px 10px;
      font-weight: 800;
      font-size: 9.5pt;
      letter-spacing: 0.03em;
      border: 1px solid #09202f;
    }

    td {
      padding: 7px 10px;
      border: 1px solid #c0d5e2;
      color: #05131d;
      vertical-align: middle;
      line-height: 1.35;
    }

    tr:nth-child(even) td {
      background: #f3f8fc;
    }

    .role-badge {
      display: inline-block;
      font-family: 'JetBrains Mono', monospace;
      font-size: 8pt;
      font-weight: 800;
      background: #ddeef7;
      color: #064057;
      border: 1.5px solid #8db9d4;
      padding: 2px 7px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    .role-badge.super {
      background: #fee2e2;
      color: #991b1b;
      border-color: #f87171;
    }

    .role-badge.exec {
      background: #ede9fe;
      color: #5b21b6;
      border-color: #a78bfa;
    }

    .role-badge.student {
      background: #d1fae5;
      color: #065f46;
      border-color: #34d399;
    }

    .code-email {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9.2pt;
      color: #0b4f6c;
      font-weight: 700;
    }

    .code-pwd {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9pt;
      font-weight: 700;
      color: #05131d;
      background: #e2eef5;
      border: 1px solid #94b8ce;
      padding: 2px 7px;
      border-radius: 4px;
    }

    /* Key Modules Grid */
    .modules-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px 16px;
      font-size: 9.2pt;
      margin-top: 8px;
    }

    .module-item {
      display: flex;
      gap: 8px;
      align-items: baseline;
      background: #f7fafc;
      border: 1px solid #d2e3ed;
      border-radius: 6px;
      padding: 8px 10px;
    }

    .module-bullet {
      color: #0b5e7e;
      font-weight: 900;
      font-size: 11pt;
    }

    /* Footer */
    .doc-footer {
      border-top: 1.5px solid #94b8ce;
      padding-top: 10px;
      margin-top: 18px;
      display: flex;
      justify-content: space-between;
      font-size: 8pt;
      color: #2c4454;
      font-weight: 600;
    }
  </style>
</head>
<body>

  <!-- Header, Architecture & Master Accounts -->
  <header class="header">
    <div>
      <div class="brand-title">Centre for Advanced Studies (CAS)</div>
      <div class="brand-subtitle">Dr. A.P.J. Abdul Kalam Technical University, Lucknow (AKTU)</div>
      <div class="brand-location">Sector-11, Jankipuram Vistar, Lucknow, Uttar Pradesh — 226031 • CAS Main Portal: cas.res.in</div>
    </div>
    <div class="meta-badge">
      <div class="status-pill">● System Live &amp; Verified</div><br/>
      <strong>Document:</strong> Deployment Manifest &amp; Access Directory<br/>
      <strong>Academic Year:</strong> 2026–2027<br/>
      <strong>Security Level:</strong> Operational Baseline
    </div>
  </header>

  <!-- Section 1: Cloud Architecture Endpoints -->
  <h2><span class="section-num">01</span> Production Cloud Endpoints &amp; Architecture</h2>
  <div class="arch-grid">
    <div class="arch-card">
      <div class="arch-card-title">Frontend Web Portal</div>
      <div class="arch-card-platform">Vercel Cloud Edge</div>
      <div class="arch-card-tech">React 18 • Vite 8 • High-Contrast Light Theme Default • WCAG 2.2 AA Compliant</div>
      <span class="arch-card-link">https://cas-erp-iota.vercel.app</span>
      <div style="font-size: 8pt; color: #2c4454; margin-top: 6px; font-weight: 600;">GitHub: Harsharya5426/cas-erp (main)</div>
    </div>

    <div class="arch-card backend">
      <div class="arch-card-title">Backend RESTful API</div>
      <div class="arch-card-platform">Render Web Service</div>
      <div class="arch-card-tech">Express 5 • TypeScript 5.8 • JWT Access &amp; Refresh • Ephemeral 256-Bit Secrets</div>
      <span class="arch-card-link">https://cas-erp-api.onrender.com/api/v1</span>
      <div style="font-size: 8pt; color: #2c4454; margin-top: 6px; font-weight: 600;">CORS Origins &amp; Rate-Limiting Active</div>
    </div>

    <div class="arch-card database">
      <div class="arch-card-title">Database Cluster</div>
      <div class="arch-card-platform">MongoDB Atlas Cloud</div>
      <div class="arch-card-tech">Cluster0 (AWS rappkok) • Multi-AZ ReplicaSet • Strict Schema Validation</div>
      <span class="arch-card-link">mongodb+srv://...rappkok.mongodb.net/cas_erp</span>
      <div style="font-size: 8pt; color: #047857; margin-top: 6px; font-weight: 700;">Network Whitelist: 0.0.0.0/0 Active</div>
    </div>
  </div>

  <!-- Section 2: Master Credentials Banner -->
  <h2><span class="section-num">02</span> Master Authentication Credential</h2>
  <div class="master-alert">
    <div class="master-alert-text">
      <strong style="font-size: 11pt; color: #04121b;">Universal Password for All Institutional Roles:</strong><br/>
      Every administrative, executive, departmental, faculty, and student seed account uses the single verified password below:
    </div>
    <div class="master-pwd-badge">CasErp@2026!</div>
  </div>

  <!-- Role Directory Table -->
  <h2><span class="section-num">03</span> Complete Institutional User Directory (All Roles)</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 17%;">Role / Authority</th>
        <th style="width: 27%;">User / Designation</th>
        <th style="width: 29%;">Login Username (Email)</th>
        <th style="width: 15%;">Default Password</th>
        <th style="width: 12%;">Access Scope</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="role-badge super">SUPER_ADMIN</span></td>
        <td><strong>Vikramaditya Dave</strong><br/><span style="font-size: 8pt; color: #2c4454;">Super Administrator</span></td>
        <td><span class="code-email">superadmin@cas.res.in</span></td>
        <td><span class="code-pwd">CasErp@2026!</span></td>
        <td>System-Wide / Audit</td>
      </tr>
      <tr>
        <td><span class="role-badge exec">PRINCIPAL</span></td>
        <td><strong>Prof. S. P. Shukla</strong><br/><span style="font-size: 8pt; color: #2c4454;">Director, CAS AKTU</span></td>
        <td><span class="code-email">principal@cas.res.in</span></td>
        <td><span class="code-pwd">CasErp@2026!</span></td>
        <td>Executive Dashboard</td>
      </tr>
      <tr>
        <td><span class="role-badge">COLLEGE_ADMIN</span></td>
        <td><strong>Dr. R. K. Tiwari</strong><br/><span style="font-size: 8pt; color: #2c4454;">Registrar / College Admin</span></td>
        <td><span class="code-email">admin@cas.res.in</span></td>
        <td><span class="code-pwd">CasErp@2026!</span></td>
        <td>College Operations</td>
      </tr>
      <tr>
        <td><span class="role-badge">HOD</span></td>
        <td><strong>Dr. Anuj Kumar Sharma</strong><br/><span style="font-size: 8pt; color: #2c4454;">Dean Academics &amp; HOD CSE</span></td>
        <td><span class="code-email">hod.cse@cas.res.in</span></td>
        <td><span class="code-pwd">CasErp@2026!</span></td>
        <td>CSE Academics &amp; Staff</td>
      </tr>
      <tr>
        <td><span class="role-badge">FACULTY</span></td>
        <td><strong>Dr. Saurabh Mishra</strong><br/><span style="font-size: 8pt; color: #2c4454;">Assistant Professor (Nano/CSE)</span></td>
        <td><span class="code-email">faculty@cas.res.in</span></td>
        <td><span class="code-pwd">CasErp@2026!</span></td>
        <td>Attendance &amp; LMS</td>
      </tr>
      <tr>
        <td><span class="role-badge student">STUDENT</span></td>
        <td><strong>Aarav Sharma</strong><br/><span style="font-size: 8pt; color: #2c4454;">M.Tech CSE, Batch 2026</span></td>
        <td><span class="code-email">student@cas.res.in</span></td>
        <td><span class="code-pwd">CasErp@2026!</span></td>
        <td>Student Dashboard</td>
      </tr>
      <tr>
        <td><span class="role-badge">PARENT</span></td>
        <td><strong>Manoj Sharma</strong><br/><span style="font-size: 8pt; color: #2c4454;">Guardian / Parent</span></td>
        <td><span class="code-email">parent@cas.res.in</span></td>
        <td><span class="code-pwd">CasErp@2026!</span></td>
        <td>Progress &amp; Fees</td>
      </tr>
      <tr>
        <td><span class="role-badge">ACCOUNTANT</span></td>
        <td><strong>R. Sharma</strong><br/><span style="font-size: 8pt; color: #2c4454;">Chief Accountant</span></td>
        <td><span class="code-email">accounts@cas.res.in</span></td>
        <td><span class="code-pwd">CasErp@2026!</span></td>
        <td>Fee Ledgers &amp; Cashfree</td>
      </tr>
      <tr>
        <td><span class="role-badge">ADMISSION</span></td>
        <td><strong>Neha Verma</strong><br/><span style="font-size: 8pt; color: #2c4454;">Admission Officer</span></td>
        <td><span class="code-email">admissions@cas.res.in</span></td>
        <td><span class="code-pwd">CasErp@2026!</span></td>
        <td>Applications &amp; Merit</td>
      </tr>
      <tr>
        <td><span class="role-badge">EXAM_CTRL</span></td>
        <td><strong>Dr. P. Mishra</strong><br/><span style="font-size: 8pt; color: #2c4454;">Controller of Examinations</span></td>
        <td><span class="code-email">exam@cas.res.in</span></td>
        <td><span class="code-pwd">CasErp@2026!</span></td>
        <td>Exams &amp; Results Lock</td>
      </tr>
      <tr>
        <td><span class="role-badge">LIBRARIAN</span></td>
        <td><strong>S. Kulkarni</strong><br/><span style="font-size: 8pt; color: #2c4454;">Central Library In-Charge</span></td>
        <td><span class="code-email">library@cas.res.in</span></td>
        <td><span class="code-pwd">CasErp@2026!</span></td>
        <td>Catalog &amp; Circulation</td>
      </tr>
      <tr>
        <td><span class="role-badge">HOSTEL_WARDEN</span></td>
        <td><strong>A. Chauhan</strong><br/><span style="font-size: 8pt; color: #2c4454;">Chief Hostel Warden</span></td>
        <td><span class="code-email">warden@cas.res.in</span></td>
        <td><span class="code-pwd">CasErp@2026!</span></td>
        <td>Bed Allocations</td>
      </tr>
    </tbody>
  </table>

  <!-- Section 4: Verified Capabilities & Key Operations -->
  <h2><span class="section-num">04</span> Verified Capabilities &amp; Institutional Governance</h2>
  <div class="modules-grid">
    <div class="module-item">
      <span class="module-bullet">✔</span>
      <div><strong>High-Contrast Light Theme Default:</strong> Instant zero-flash rendering with deep petroleum blue/navy typography (#081721 / #0b5e7e) meeting WCAG 2.2 AAA contrast standards.</div>
    </div>
    <div class="module-item">
      <span class="module-bullet">✔</span>
      <div><strong>Auto-Gliding Dropdown Ticker:</strong> Hovering navbar redirectors smoothly glides the news ticker 345px down so moving text is never covered by dropdown menus.</div>
    </div>
    <div class="module-item">
      <span class="module-bullet">✔</span>
      <div><strong>Cryptographic QR Verification:</strong> Tamper-evident HMAC-SHA256 student receipt and grade sheet verification for instant offline authentication.</div>
    </div>
    <div class="module-item">
      <span class="module-bullet">✔</span>
      <div><strong>Bilingual Public Portal:</strong> English and Hindi interface toggling adhering to AKTU Lucknow state university norms.</div>
    </div>
    <div class="module-item">
      <span class="module-bullet">✔</span>
      <div><strong>Double-Entry Accounting Ledger:</strong> Real-time reconciliation, Cashfree PG integration, and offline cashier receipting with full audit history.</div>
    </div>
    <div class="module-item">
      <span class="module-bullet">✔</span>
      <div><strong>Cloud Production Security:</strong> Automatic 256-bit cryptographic secrets, rate-limiting, Helmet CSP, strict CORS, and persistent audit trail recording.</div>
    </div>
  </div>

  <!-- Document Footer -->
  <footer class="doc-footer">
    <div>Centre for Advanced Studies • Dr. A.P.J. Abdul Kalam Technical University, Lucknow • https://cas.res.in</div>
    <div>Production Release v2.0.0 • Prepared for Harsh Arya</div>
  </footer>

</body>
</html>
`;

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle' });
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' }
  });
  await browser.close();
  console.log('High-contrast large-font PDF successfully generated at: ' + outputPath);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
