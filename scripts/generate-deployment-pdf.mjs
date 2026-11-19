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
  <title>CAS ERP — Production Deployment & Credentials Directory</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');

    @page {
      size: A4;
      margin: 14mm 14mm 16mm 14mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #0f2330;
      background: #ffffff;
      line-height: 1.45;
      font-size: 9pt;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Header */
    .header {
      border-bottom: 2.5px solid #3587A4;
      padding-bottom: 10px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .brand-title {
      font-size: 15pt;
      font-weight: 800;
      color: #0b1e2a;
      letter-spacing: -0.02em;
    }

    .brand-subtitle {
      font-size: 9pt;
      color: #2D848A;
      font-weight: 700;
      margin-top: 1px;
    }

    .brand-location {
      font-size: 7.8pt;
      color: #56768a;
      margin-top: 2px;
    }

    .meta-badge {
      text-align: right;
      font-size: 7.5pt;
      color: #56768a;
      line-height: 1.35;
    }

    .meta-badge strong {
      color: #0f2330;
    }

    .status-pill {
      display: inline-block;
      background: #e6f6ee;
      color: #0d8a54;
      border: 1px solid #a3e0c0;
      border-radius: 999px;
      padding: 2px 7px;
      font-size: 7.2pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 3px;
    }

    /* Section Styling */
    h2 {
      font-size: 10.5pt;
      font-weight: 800;
      color: #10212b;
      margin-top: 12px;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
      border-bottom: 1px solid #d8e5ee;
      padding-bottom: 4px;
    }

    h2 .section-num {
      background: #3587A4;
      color: #ffffff;
      border-radius: 4px;
      padding: 1px 5px;
      font-size: 7.5pt;
    }

    /* Architecture Cards */
    .arch-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 12px;
    }

    .arch-card {
      border: 1px solid #c9dbe7;
      border-radius: 6px;
      padding: 8px 10px;
      background: #f7fafc;
      border-left: 3.5px solid #3587A4;
    }

    .arch-card.backend {
      border-left-color: #2D848A;
    }

    .arch-card.database {
      border-left-color: #10b981;
    }

    .arch-card-title {
      font-size: 8.5pt;
      font-weight: 800;
      color: #0b1e2a;
      margin-bottom: 2px;
    }

    .arch-card-platform {
      font-size: 7.2pt;
      color: #56768a;
      font-weight: 600;
      margin-bottom: 5px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .arch-card-link {
      font-family: 'JetBrains Mono', monospace;
      font-size: 7.2pt;
      color: #2563eb;
      word-break: break-all;
      background: #ffffff;
      border: 1px solid #d3e2ed;
      border-radius: 4px;
      padding: 3px 5px;
      display: block;
      margin-top: 4px;
    }

    .arch-card-tech {
      font-size: 7.2pt;
      color: #4b6a7d;
      margin-top: 4px;
    }

    /* Master Credentials Alert */
    .master-alert {
      background: #f0f7fb;
      border: 1.5px dashed #3587A4;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .master-alert-text {
      font-size: 8.2pt;
      color: #0b1e2a;
    }

    .master-pwd-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9.5pt;
      font-weight: 700;
      color: #0b1e2a;
      background: #ffffff;
      border: 1px solid #3587A4;
      border-radius: 4px;
      padding: 3px 8px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.06);
    }

    /* Table */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7.8pt;
      margin-top: 4px;
      margin-bottom: 10px;
    }

    th {
      background: #10212b;
      color: #ffffff;
      text-align: left;
      padding: 5px 8px;
      font-weight: 700;
      letter-spacing: 0.02em;
      border-top: 1px solid #10212b;
      border-bottom: 1px solid #10212b;
    }

    td {
      padding: 4.8px 8px;
      border-bottom: 1px solid #e1ebf2;
      color: #1a3242;
      vertical-align: middle;
    }

    tr:nth-child(even) td {
      background: #f8fbfe;
    }

    .role-badge {
      display: inline-block;
      font-family: 'JetBrains Mono', monospace;
      font-size: 6.8pt;
      font-weight: 700;
      background: #e5f1f8;
      color: #1e5a73;
      border: 1px solid #bcd7e7;
      padding: 1.5px 5px;
      border-radius: 3px;
      text-transform: uppercase;
    }

    .role-badge.super {
      background: #fdf2f2;
      color: #b91c1c;
      border-color: #fecaca;
    }

    .role-badge.exec {
      background: #f5f3ff;
      color: #6d28d9;
      border-color: #ddd6fe;
    }

    .role-badge.student {
      background: #ecfdf5;
      color: #047857;
      border-color: #a7f3d0;
    }

    .code-email {
      font-family: 'JetBrains Mono', monospace;
      font-size: 7.3pt;
      color: #0f4c6e;
      font-weight: 600;
    }

    .code-pwd {
      font-family: 'JetBrains Mono', monospace;
      font-size: 7.2pt;
      color: #0f2330;
      background: #edf3f7;
      padding: 1.5px 5px;
      border-radius: 3px;
    }

    /* Key Modules Grid */
    .modules-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 6px 12px;
      font-size: 7.5pt;
      margin-top: 5px;
    }

    .module-item {
      display: flex;
      gap: 6px;
      align-items: baseline;
    }

    .module-bullet {
      color: #3587A4;
      font-weight: 800;
    }

    /* Footer */
    .doc-footer {
      border-top: 1px solid #d8e5ee;
      padding-top: 6px;
      margin-top: 10px;
      display: flex;
      justify-content: space-between;
      font-size: 7pt;
      color: #718a99;
    }
  </style>
</head>
<body>

  <!-- Institutional Header -->
  <header class="header">
    <div>
      <div class="brand-title">Centre for Advanced Studies (CAS)</div>
      <div class="brand-subtitle">Dr. A.P.J. Abdul Kalam Technical University, Lucknow (AKTU)</div>
      <div class="brand-location">Sector-11, Jankipuram Vistar, Lucknow, Uttar Pradesh — 226031 • cas.res.in</div>
    </div>
    <div class="meta-badge">
      <div class="status-pill">● System Live &amp; Verified</div><br/>
      <strong>Document:</strong> Deployment Manifest &amp; Access Directory<br/>
      <strong>Academic Year:</strong> 2026–2027<br/>
      <strong>Security Level:</strong> Internal Operational Baseline
    </div>
  </header>

  <!-- Section 1: Cloud Architecture Endpoints -->
  <h2><span class="section-num">01</span> Production Cloud Endpoints &amp; Architecture</h2>
  <div class="arch-grid">
    <div class="arch-card">
      <div class="arch-card-title">Frontend Web Portal</div>
      <div class="arch-card-platform">Vercel Cloud Edge</div>
      <div class="arch-card-tech">React 18 • Vite 8 • Light Theme Default • WCAG 2.2 AA</div>
      <span class="arch-card-link">https://cas-erp-iota.vercel.app</span>
      <div style="font-size: 6.8pt; color: #718a99; margin-top: 3px;">Linked to GitHub: Harsharya5426/cas-erp (main)</div>
    </div>

    <div class="arch-card backend">
      <div class="arch-card-title">Backend RESTful API</div>
      <div class="arch-card-platform">Render Web Service</div>
      <div class="arch-card-tech">Express 5 • TypeScript 5.8 • JWT Access/Refresh • RBAC</div>
      <span class="arch-card-link">https://cas-erp-api.onrender.com/api/v1</span>
      <div style="font-size: 6.8pt; color: #718a99; margin-top: 3px;">Auto-deploy enabled • Cryptographic ephemeral secrets</div>
    </div>

    <div class="arch-card database">
      <div class="arch-card-title">Database Cluster</div>
      <div class="arch-card-platform">MongoDB Atlas Cloud</div>
      <div class="arch-card-tech">Cluster0 (AWS rappkok) • ReplicaSet • Strict Query</div>
      <span class="arch-card-link">mongodb+srv://...rappkok.mongodb.net/cas_erp</span>
      <div style="font-size: 6.8pt; color: #718a99; margin-top: 3px;">Network Whitelist: 0.0.0.0/0 Active</div>
    </div>
  </div>

  <!-- Section 2: Master Credentials Banner -->
  <h2><span class="section-num">02</span> Institutional Roles &amp; Authentication Directory</h2>
  <div class="master-alert">
    <div class="master-alert-text">
      <strong>Universal Seed Password for All Roles:</strong><br/>
      Every pre-configured administrative, faculty, and student test profile is initialized with the standard master credential.
    </div>
    <div class="master-pwd-badge">CasErp@2026!</div>
  </div>

  <!-- Role Directory Table -->
  <table>
    <thead>
      <tr>
        <th style="width: 17%;">Role / Authority</th>
        <th style="width: 28%;">Official User / Title</th>
        <th style="width: 28%;">Login Username (Email)</th>
        <th style="width: 15%;">Default Password</th>
        <th style="width: 12%;">Module Scope</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="role-badge super">SUPER_ADMIN</span></td>
        <td><strong>Vikramaditya Dave</strong> (Super Admin)</td>
        <td><span class="code-email">superadmin@cas.res.in</span></td>
        <td><span class="code-pwd">CasErp@2026!</span></td>
        <td>System-Wide / Audit</td>
      </tr>
      <tr>
        <td><span class="role-badge exec">PRINCIPAL</span></td>
        <td><strong>Prof. S. P. Shukla</strong> (Director, CAS AKTU)</td>
        <td><span class="code-email">principal@cas.res.in</span></td>
        <td><span class="code-pwd">CasErp@2026!</span></td>
        <td>Executive Portal</td>
      </tr>
      <tr>
        <td><span class="role-badge">COLLEGE_ADMIN</span></td>
        <td><strong>Dr. R. K. Tiwari</strong> (Registrar / Admin)</td>
        <td><span class="code-email">admin@cas.res.in</span></td>
        <td><span class="code-pwd">CasErp@2026!</span></td>
        <td>College Operations</td>
      </tr>
      <tr>
        <td><span class="role-badge">HOD</span></td>
        <td><strong>Dr. Anuj Kumar Sharma</strong> (Dean &amp; HOD CSE)</td>
        <td><span class="code-email">hod.cse@cas.res.in</span></td>
        <td><span class="code-pwd">CasErp@2026!</span></td>
        <td>CSE Academics &amp; Staff</td>
      </tr>
      <tr>
        <td><span class="role-badge">FACULTY</span></td>
        <td><strong>Dr. Saurabh Mishra</strong> (Assistant Professor)</td>
        <td><span class="code-email">faculty@cas.res.in</span></td>
        <td><span class="code-pwd">CasErp@2026!</span></td>
        <td>Attendance &amp; LMS</td>
      </tr>
      <tr>
        <td><span class="role-badge student">STUDENT</span></td>
        <td><strong>Aarav Sharma</strong> (M.Tech CSE, 2026)</td>
        <td><span class="code-email">student@cas.res.in</span></td>
        <td><span class="code-pwd">CasErp@2026!</span></td>
        <td>Student Dashboard</td>
      </tr>
      <tr>
        <td><span class="role-badge">PARENT</span></td>
        <td><strong>Manoj Sharma</strong> (Guardian)</td>
        <td><span class="code-email">parent@cas.res.in</span></td>
        <td><span class="code-pwd">CasErp@2026!</span></td>
        <td>Progress &amp; Fees</td>
      </tr>
      <tr>
        <td><span class="role-badge">ACCOUNTANT</span></td>
        <td><strong>R. Sharma</strong> (Head Accountant)</td>
        <td><span class="code-email">accounts@cas.res.in</span></td>
        <td><span class="code-pwd">CasErp@2026!</span></td>
        <td>Fee Ledgers &amp; Cashfree</td>
      </tr>
      <tr>
        <td><span class="role-badge">ADMISSION</span></td>
        <td><strong>Neha Verma</strong> (Admission Officer)</td>
        <td><span class="code-email">admissions@cas.res.in</span></td>
        <td><span class="code-pwd">CasErp@2026!</span></td>
        <td>Applications &amp; Merit</td>
      </tr>
      <tr>
        <td><span class="role-badge">EXAM_CTRL</span></td>
        <td><strong>Dr. P. Mishra</strong> (Controller of Exams)</td>
        <td><span class="code-email">exam@cas.res.in</span></td>
        <td><span class="code-pwd">CasErp@2026!</span></td>
        <td>Exams &amp; Results Lock</td>
      </tr>
      <tr>
        <td><span class="role-badge">LIBRARIAN</span></td>
        <td><strong>S. Kulkarni</strong> (Central Library)</td>
        <td><span class="code-email">library@cas.res.in</span></td>
        <td><span class="code-pwd">CasErp@2026!</span></td>
        <td>Circulation &amp; Catalog</td>
      </tr>
      <tr>
        <td><span class="role-badge">HOSTEL_WARDEN</span></td>
        <td><strong>A. Chauhan</strong> (Chief Warden)</td>
        <td><span class="code-email">warden@cas.res.in</span></td>
        <td><span class="code-pwd">CasErp@2026!</span></td>
        <td>Bed Allocations</td>
      </tr>
    </tbody>
  </table>

  <!-- Section 3: Key Verified Features & Policies -->
  <h2><span class="section-num">03</span> Enterprise Capabilities &amp; System Highlights</h2>
  <div class="modules-grid">
    <div class="module-item">
      <span class="module-bullet">✔</span>
      <div><strong>Institutional Light Mode Default:</strong> High-contrast crisp maritime theme, instantly applied before React mount.</div>
    </div>
    <div class="module-item">
      <span class="module-bullet">✔</span>
      <div><strong>Auto-Gliding Dropdown Ticker:</strong> Hovering navbar redirectors glides the ticker bar smoothly below expanded menus.</div>
    </div>
    <div class="module-item">
      <span class="module-bullet">✔</span>
      <div><strong>Cryptographic QR Verification:</strong> Tamper-evident HMAC-SHA256 student receipt and grade sheet verification.</div>
    </div>
    <div class="module-item">
      <span class="module-bullet">✔</span>
      <div><strong>Bilingual Public Portal:</strong> English / Hindi interface toggling compliant with AKTU state university guidelines.</div>
    </div>
    <div class="module-item">
      <span class="module-bullet">✔</span>
      <div><strong>Double-Entry Fee Ledger:</strong> Real-time reconciliation, Cashfree PG integration, and offline cashier receipting.</div>
    </div>
    <div class="module-item">
      <span class="module-bullet">✔</span>
      <div><strong>Security &amp; Resilience:</strong> Rate-limiting, Helmet CSP, strict CORS, and persistent audit trail recording.</div>
    </div>
  </div>

  <!-- Document Footer -->
  <footer class="doc-footer">
    <div>Centre for Advanced Studies • Dr. A.P.J. Abdul Kalam Technical University, Lucknow • https://cas.res.in</div>
    <div>Generated for Harsh Arya • cas-erp monorepo v2.0.0</div>
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
  console.log('PDF successfully generated at: ' + outputPath);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
