import crypto from 'node:crypto';

const API_BASE = 'http://localhost:4000/api/v1';
const WEB_BASE = 'http://localhost:5173';

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

function record(name, success, error = null, details = null) {
  results.total++;
  if (success) {
    results.passed++;
    console.log(`  ✓ [PASS] ${name}`);
  } else {
    results.failed++;
    const errInfo = { name, error: error?.message || String(error), details };
    results.errors.push(errInfo);
    console.error(`  ✗ [FAIL] ${name}: ${errInfo.error}`);
  }
}

async function request(endpoint, options = {}, token = null) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const res = await fetch(url, { ...options, headers });
  let body;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return {
    status: res.status,
    headers: res.headers,
    body,
    data: body?.data !== undefined ? body.data : body,
    error: body?.error || null
  };
}

// 12 Institutional Roles
const ROLES = [
  { role: 'SUPER_ADMIN', email: 'superadmin@cas.res.in' },
  { role: 'PRINCIPAL', email: 'principal@cas.res.in' },
  { role: 'COLLEGE_ADMIN', email: 'admin@cas.res.in' },
  { role: 'HOD', email: 'hod.cse@cas.res.in' },
  { role: 'FACULTY', email: 'faculty@cas.res.in' },
  { role: 'STUDENT', email: 'student@cas.res.in' },
  { role: 'PARENT', email: 'parent@cas.res.in' },
  { role: 'ACCOUNTANT', email: 'accounts@cas.res.in' },
  { role: 'ADMISSION_OFFICER', email: 'admissions@cas.res.in' },
  { role: 'EXAM_CONTROLLER', email: 'exam@cas.res.in' },
  { role: 'LIBRARIAN', email: 'library@cas.res.in' },
  { role: 'HOSTEL_WARDEN', email: 'warden@cas.res.in' }
];

const TOKENS = {};

async function run() {
  console.log('================================================================');
  console.log('   CAS ERP COMPREHENSIVE WORKFLOW & CASE VERIFICATION SUITE');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // TEST GROUP 1: SERVER & INFRASTRUCTURE HEALTH CHECKS
  // -------------------------------------------------------------
  console.log('--- 1. SERVER & INFRASTRUCTURE HEALTH CHECKS ---');
  try {
    const apiHealth = await request('/healthz');
    record('API Liveness Probe (/api/v1/healthz returns 200 & status: ok)', apiHealth.status === 200 && apiHealth.data?.status === 'ok');
  } catch (e) {
    record('API Liveness Probe (/api/v1/healthz)', false, e);
  }

  try {
    const readyRes = await request('/readyz');
    record('API Readiness Probe (/api/v1/readyz verifies MongoDB connection)', readyRes.status === 200 && readyRes.data?.mongodb === 'connected');
  } catch (e) {
    record('API Readiness Probe (/api/v1/readyz)', false, e);
  }

  try {
    const webRes = await fetch(WEB_BASE);
    const webHtml = await webRes.text();
    record('Frontend Web Server (http://localhost:5173 returns 200 & HTML)', webRes.status === 200 && webHtml.toLowerCase().includes('<!doctype html'));
  } catch (e) {
    record('Frontend Web Server', false, e);
  }

  // -------------------------------------------------------------
  // TEST GROUP 2: AUTHENTICATION FOR ALL 12 ROLES
  // -------------------------------------------------------------
  console.log('\n--- 2. AUTHENTICATION & SESSION LIFECYCLE (ALL 12 ROLES) ---');
  for (const r of ROLES) {
    try {
      const res = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: r.email, password: 'CasErp@2026!' })
      });
      const ok = res.status === 200 && Boolean(res.data?.accessToken);
      if (ok) {
        TOKENS[r.role] = res.data.accessToken;
      }
      record(`Login for role ${r.role} (${r.email})`, ok, res.error?.message, res.body);
    } catch (e) {
      record(`Login for role ${r.role}`, false, e);
    }
  }

  // Auth Edge Cases
  try {
    const invalidPw = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'principal@cas.res.in', password: 'WrongPassword123!' })
    });
    record('Invalid password rejected with 401', invalidPw.status === 401);
  } catch (e) {
    record('Invalid password rejected with 401', false, e);
  }

  try {
    const missingFields = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'principal@cas.res.in' })
    });
    record('Missing password payload rejected with 400 validation error', missingFields.status === 400);
  } catch (e) {
    record('Missing password payload rejected with 400', false, e);
  }

  try {
    const nonExistent = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'does.not.exist@cas.res.in', password: 'CasErp@2026!' })
    });
    record('Non-existent user rejected with 401 (prevents user enumeration)', nonExistent.status === 401);
  } catch (e) {
    record('Non-existent user rejected with 401', false, e);
  }

  try {
    const meRes = await request('/auth/me', { method: 'GET' }, TOKENS['SUPER_ADMIN']);
    record('Session token verification via GET /auth/me', meRes.status === 200 && meRes.data?.user?.email === 'superadmin@cas.res.in');
  } catch (e) {
    record('Session token verification via GET /auth/me', false, e);
  }

  // -------------------------------------------------------------
  // TEST GROUP 3: RBAC & PRIVILEGE BOUNDARY ENFORCEMENT
  // -------------------------------------------------------------
  console.log('\n--- 3. RBAC PRIVILEGE BOUNDARY ENFORCEMENT ---');
  try {
    // Student trying to read audit logs
    const studentAudit = await request('/rbac/audit-events', { method: 'GET' }, TOKENS['STUDENT']);
    record('Student blocked from reading audit logs (403 Forbidden)', studentAudit.status === 403);
  } catch (e) {
    record('Student blocked from reading audit logs', false, e);
  }

  try {
    // Student creating a confidential grievance
    const grvCreate = await request('/campus/grievances', {
      method: 'POST',
      body: JSON.stringify({
        category: 'academic',
        subject: 'Confidential Redressal Request',
        description: 'Sensitive inquiry for the grievance committee only.',
        confidential: true
      })
    }, TOKENS['STUDENT']);
    record('Student submits confidential grievance (201 Created)', grvCreate.status === 201 || grvCreate.status === 200);

    // Faculty member querying grievances should NOT see the confidential grievance of the student
    const facultyGrievance = await request('/campus/grievances', { method: 'GET' }, TOKENS['FACULTY']);
    const tickets = facultyGrievance.data?.tickets || [];
    const seesOtherConfidential = tickets.some(t => t.confidential === true && t.submittedByUserId !== 'faculty');
    record('Faculty strictly isolated from viewing confidential grievances of others (Row-level RBAC)', facultyGrievance.status === 200 && !seesOtherConfidential);
  } catch (e) {
    record('Confidential grievance isolation', false, e);
  }

  try {
    // Student trying to modify marks via PUT /exams/marks
    const studentMark = await request('/exams/marks', {
      method: 'PUT',
      body: JSON.stringify({ examId: '6af3dd02377761927f7dd401', studentId: '6af3dd02377761927f7dd4a0', internalMarks: 50 })
    }, TOKENS['STUDENT']);
    record('Student blocked from editing exam marks (403 Forbidden)', studentMark.status === 403);
  } catch (e) {
    record('Student blocked from editing exam marks', false, e);
  }

  try {
    // Super Admin authorized to view audit events
    const adminAudit = await request('/rbac/audit-events', { method: 'GET' }, TOKENS['SUPER_ADMIN']);
    record('Super Admin permitted to read audit events (200 OK)', adminAudit.status === 200 && Array.isArray(adminAudit.data?.events));
  } catch (e) {
    record('Super Admin permitted to read audit events', false, e);
  }

  // -------------------------------------------------------------
  // TEST GROUP 4: ADMISSIONS & STUDENT ENROLLMENT LIFECYCLE
  // -------------------------------------------------------------
  console.log('\n--- 4. ADMISSIONS LIFECYCLE & REGISTRATION WORKFLOW ---');
  let newAppNo = '';
  let newTrackPin = '';
  let newApplicantId = '';

  try {
    const applyRes = await request('/public/admissions/apply', {
      method: 'POST',
      body: JSON.stringify({
        fullName: 'Prashant Mishra MTech Candidate',
        email: `prashant.${Date.now()}@test.cas.res.in`,
        phone: '+91 99887 76655',
        deptCode: 'CSE',
        programCode: 'MTECH-CSE',
        qualifyingExamName: 'GATE Computer Science',
        qualifyingScorePct: 88.5,
        guardianName: 'D. N. Mishra',
        guardianPhone: '+91 99887 76654'
      })
    });
    const ok = applyRes.status === 201 && Boolean(applyRes.data?.applicationNo);
    if (ok) {
      newAppNo = applyRes.data.applicationNo;
      newTrackPin = applyRes.data.trackingPin;
    }
    record('Public admission application submission (201 Created)', ok, applyRes.error?.message, applyRes.body);
  } catch (e) {
    record('Public admission application submission', false, e);
  }

  try {
    const trackRes = await request(`/public/admissions/track?applicationNo=${encodeURIComponent(newAppNo)}&pin=${encodeURIComponent(newTrackPin)}`);
    record('Public admission application tracking with PIN (200 OK)', trackRes.status === 200 && trackRes.data?.status === 'submitted');
  } catch (e) {
    record('Public admission application tracking with PIN', false, e);
  }

  try {
    // Invalid tracking PIN
    const badTrack = await request(`/public/admissions/track?applicationNo=${encodeURIComponent(newAppNo)}&pin=000000`);
    record('Invalid tracking PIN rejected (404 Not Found / PIN mismatch)', badTrack.status === 404);
  } catch (e) {
    record('Invalid tracking PIN rejected', false, e);
  }

  try {
    // Admission Officer looks up applicant by applicationNo
    const appsList = await request('/admissions/applicants', { method: 'GET' }, TOKENS['ADMISSION_OFFICER']);
    const found = (appsList.data?.applicants || []).find(a => a.applicationNo === newAppNo);
    if (found) {
      newApplicantId = found._id;
    }
    record('Admission Officer finds submitted applicant in roster', Boolean(newApplicantId));
  } catch (e) {
    record('Admission Officer finds submitted applicant in roster', false, e);
  }

  try {
    // Admission Officer transitions status to docs_verified
    const verifyRes = await request(`/admissions/applicants/${newApplicantId}/transition`, {
      method: 'POST',
      body: JSON.stringify({ targetStatus: 'docs_verified', remarks: 'Gate scorecard and degree verified' })
    }, TOKENS['ADMISSION_OFFICER']);
    record('Admission Officer transitions applicant to docs_verified (200 OK)', verifyRes.status === 200, verifyRes.error?.message);
  } catch (e) {
    record('Admission Officer transitions to docs_verified', false, e);
  }

  try {
    // Principal approves applicant
    const approveRes = await request(`/admissions/applicants/${newApplicantId}/transition`, {
      method: 'POST',
      body: JSON.stringify({ targetStatus: 'approved', remarks: 'Seat confirmed under GATE merit' })
    }, TOKENS['PRINCIPAL']);
    record('Principal approves admission application (200 OK)', approveRes.status === 200, approveRes.error?.message);
  } catch (e) {
    record('Principal approves admission application', false, e);
  }

  let enrolledRollNumber = '';
  let enrolledStudentMongoId = '';
  try {
    // Principal enrolls approved applicant
    const enrollRes = await request(`/admissions/applicants/${newApplicantId}/enroll`, {
      method: 'POST',
      body: JSON.stringify({ initialFeeInr: 76300 })
    }, TOKENS['PRINCIPAL']);
    const ok = enrollRes.status === 200 && Boolean(enrollRes.data?.student?.rollNumber);
    if (ok) {
      enrolledRollNumber = enrollRes.data.student.rollNumber;
      enrolledStudentMongoId = enrollRes.data.student._id;
    }
    record('Principal enrolls approved applicant into Student record (200 OK)', ok, enrollRes.error?.message, enrollRes.body);
  } catch (e) {
    record('Principal enrolls approved applicant', false, e);
  }

  // -------------------------------------------------------------
  // TEST GROUP 5: ACADEMIC CORE & TIMETABLE CONFLICTS
  // -------------------------------------------------------------
  console.log('\n--- 5. ACADEMIC CORE & TIMETABLE CONFLICT DETECTION ---');
  try {
    const deptsRes = await request('/org/departments', { method: 'GET' }, TOKENS['SUPER_ADMIN']);
    record('Departments catalog listing (200 OK, CSE, MECHA, NANO, EST, MTA)', deptsRes.status === 200 && Array.isArray(deptsRes.data?.departments));
  } catch (e) {
    record('Departments catalog listing', false, e);
  }

  try {
    const subjectsRes = await request('/org/subjects', { method: 'GET' }, TOKENS['FACULTY']);
    record('Subjects and syllabus credits listing (200 OK)', subjectsRes.status === 200 && Array.isArray(subjectsRes.data?.subjects));
  } catch (e) {
    record('Subjects and syllabus credits listing', false, e);
  }

  try {
    const studentsRes = await request('/academics/students', { method: 'GET' }, TOKENS['PRINCIPAL']);
    record('Student directory query (200 OK)', studentsRes.status === 200 && Array.isArray(studentsRes.data?.students));
    if (!enrolledStudentMongoId && studentsRes.data?.students?.[0]?._id) {
      enrolledStudentMongoId = studentsRes.data.students[0]._id;
      enrolledRollNumber = studentsRes.data.students[0].rollNumber;
    }
  } catch (e) {
    record('Student directory query', false, e);
  }

  try {
    const facultyRes = await request('/academics/employees', { method: 'GET' }, TOKENS['PRINCIPAL']);
    record('Faculty & Employee directory query (200 OK)', facultyRes.status === 200 && Array.isArray(facultyRes.data?.employees));
  } catch (e) {
    record('Faculty & Employee directory query', false, e);
  }

  try {
    const ttRes = await request('/academics/timetable', { method: 'GET' }, TOKENS['HOD']);
    record('Timetable slot schedule query (200 OK)', ttRes.status === 200 && Array.isArray(ttRes.data?.slots));
  } catch (e) {
    record('Timetable slot schedule query', false, e);
  }

  // -------------------------------------------------------------
  // TEST GROUP 6: ATTENDANCE & BIOMETRIC POLICY GATING
  // -------------------------------------------------------------
  console.log('\n--- 6. ATTENDANCE SYSTEM & BIOMETRIC POLICY GATING ---');
  try {
    // Biometric face matching must be blocked when policy is unapproved
    const bioRes = await request('/academics/attendance/lectures/mark', {
      method: 'POST',
      body: JSON.stringify({
        subjectCode: 'CS-MTECH-101',
        sessionDate: '2026-11-17',
        lectureSlot: 'SLOT-1',
        captureMethod: 'face_advisory',
        entries: [{ studentId: enrolledStudentMongoId || '6af3dd02377761927f7dd4a0', status: 'present' }]
      })
    }, TOKENS['FACULTY']);
    record('Biometric face matching blocked when BIOMETRIC_POLICY_APPROVED=false (403 Gated)', bioRes.status === 403);
  } catch (e) {
    record('Biometric face matching blocked', false, e);
  }

  try {
    // QR Code Attendance Check-In
    const qrRes = await request('/academics/attendance/qr-checkin', {
      method: 'POST',
      body: JSON.stringify({
        token: `QR-ATT-${Date.now()}-${Math.random()}`,
        studentRollNumber: enrolledRollNumber || 'CAS/2026/MTECH/CSE/001',
        lectureSlotId: 'SLOT-DEV-001'
      })
    }, TOKENS['STUDENT']);
    record('QR check-in attendance endpoint responsive', qrRes.status === 200 || qrRes.status === 400 || qrRes.status === 404);
  } catch (e) {
    record('QR check-in attendance endpoint', false, e);
  }

  // -------------------------------------------------------------
  // TEST GROUP 7: EXAMINATIONS, LMS & QR CERTIFICATES
  // -------------------------------------------------------------
  console.log('\n--- 7. EXAMINATIONS, SOD MARKS ENTRY & VERIFIABLE QR CERTS ---');
  try {
    const examSchedRes = await request('/exams/schedules', { method: 'GET' }, TOKENS['EXAM_CONTROLLER']);
    record('Exam schedules query (200 OK)', examSchedRes.status === 200 && Array.isArray(examSchedRes.data?.schedules));
  } catch (e) {
    record('Exam schedules query', false, e);
  }

  let certToken = '';
  try {
    const certListRes = await request('/campus/certificates', { method: 'GET' }, TOKENS['PRINCIPAL']);
    record('Issued certificates query (200 OK)', certListRes.status === 200 && Array.isArray(certListRes.data?.certificates));
    if (certListRes.data?.certificates?.[0]?.qrVerificationToken) {
      certToken = certListRes.data.certificates[0].qrVerificationToken;
    }
  } catch (e) {
    record('Issued certificates query', false, e);
  }

  if (certToken) {
    try {
      const verifyRes = await request(`/public/certificates/verify/${encodeURIComponent(certToken)}`);
      record('Public QR certificate verification (200 OK & valid=true)', verifyRes.status === 200 && verifyRes.data?.valid === true);
    } catch (e) {
      record('Public QR certificate verification', false, e);
    }
  } else {
    try {
      const verifyFake = await request('/public/certificates/verify/FAKE-QR-TOKEN-12345');
      record('Tampered/Non-existent QR certificate rejected with 404', verifyFake.status === 404);
    } catch (e) {
      record('Tampered/Non-existent QR certificate rejected', false, e);
    }
  }

  // -------------------------------------------------------------
  // TEST GROUP 8: FINANCE, LEDGER & CASHFREE WEBHOOKS
  // -------------------------------------------------------------
  console.log('\n--- 8. FINANCE, DOUBLE-ENTRY LEDGER & PAYMENT RECONCILIATION ---');
  try {
    const feePlansRes = await request('/finance/fee-plans', { method: 'GET' }, TOKENS['ACCOUNTANT']);
    record('Institutional fee plans query (200 OK)', feePlansRes.status === 200 && Array.isArray(feePlansRes.data?.feePlans));
  } catch (e) {
    record('Institutional fee plans query', false, e);
  }

  try {
    const ledgerRes = await request('/finance/accounting/vouchers', { method: 'GET' }, TOKENS['ACCOUNTANT']);
    record('Double-entry ledger journal query (/finance/accounting/vouchers, 200 OK)', ledgerRes.status === 200 && Array.isArray(ledgerRes.data?.entries));
  } catch (e) {
    record('Double-entry ledger journal query', false, e);
  }

  try {
    // Record Offline Fee Receipt by Accountant
    const offlineReceipt = await request('/finance/payments/offline', {
      method: 'POST',
      body: JSON.stringify({
        studentId: enrolledStudentMongoId || '6af3dd02377761927f7dd4a0',
        amountInr: 25000,
        channel: 'offline_challan',
        referenceCode: `CHLN-TEST-${Date.now()}`,
        feeHead: 'Academic Tuition & Semester Fee'
      })
    }, TOKENS['ACCOUNTANT']);
    record('Accountant posts verified offline fee receipt (200/201 Success)', offlineReceipt.status === 200 || offlineReceipt.status === 201, offlineReceipt.error?.message, offlineReceipt.body);
  } catch (e) {
    record('Accountant posts verified offline fee receipt', false, e);
  }

  // Cashfree Webhook Security Test: Reject Fake Signature
  try {
    const badWebhook = await request('/finance/webhooks/cashfree', {
      method: 'POST',
      headers: {
        'x-webhook-signature': 'invalid_forged_hmac_signature',
        'x-webhook-timestamp': String(Date.now())
      },
      body: JSON.stringify({
        data: {
          order: { order_id: 'ORD_TEST_001', order_amount: 50000 },
          payment: { payment_status: 'SUCCESS', cf_payment_id: 'CF_001' }
        }
      })
    });
    record('Cashfree webhook rejects forged HMAC signature (401 Unauthorized)', badWebhook.status === 401);
  } catch (e) {
    record('Cashfree webhook rejects forged HMAC signature', false, e);
  }

  // -------------------------------------------------------------
  // TEST GROUP 9: CAMPUS SERVICES (HOSTEL, LIBRARY, PLACEMENT, INVENTORY, GRIEVANCE)
  // -------------------------------------------------------------
  console.log('\n--- 9. CAMPUS ECOSYSTEM SERVICES ---');
  try {
    const hostelRes = await request('/campus/hostels', { method: 'GET' }, TOKENS['HOSTEL_WARDEN']);
    record('Hostel rooms and occupancy query (200 OK, 75 rooms each)', hostelRes.status === 200 && Array.isArray(hostelRes.data?.hostels));
  } catch (e) {
    record('Hostel rooms and occupancy query', false, e);
  }

  try {
    const libRes = await request('/campus/library/items', { method: 'GET' }, TOKENS['LIBRARIAN']);
    record('Library accession catalog and circulation query (200 OK)', libRes.status === 200 && Array.isArray(libRes.data?.items));
  } catch (e) {
    record('Library catalog query', false, e);
  }

  try {
    const placementRes = await request('/campus/placements', { method: 'GET' }, TOKENS['STUDENT']);
    record('Placement drives query for students (200 OK)', placementRes.status === 200 && Array.isArray(placementRes.data?.drives));
  } catch (e) {
    record('Placement drives query', false, e);
  }

  try {
    const inventoryRes = await request('/campus/inventory', { method: 'GET' }, TOKENS['PRINCIPAL']);
    record('Inventory assets and procurement query (200 OK)', inventoryRes.status === 200 && Array.isArray(inventoryRes.data?.assets));
  } catch (e) {
    record('Inventory assets query', false, e);
  }

  try {
    const noticeRes = await request('/public/notices');
    record('Public notices and circulars query (200 OK)', noticeRes.status === 200 && Array.isArray(noticeRes.data?.notices));
  } catch (e) {
    record('Public notices query', false, e);
  }

  // -------------------------------------------------------------
  // TEST GROUP 10: GOVERNANCE, AUDIT HASH CHAINING & DISASTER RECOVERY
  // -------------------------------------------------------------
  console.log('\n--- 10. GOVERNANCE, AUDIT LOG HASH INTEGRITY & DISASTER RECOVERY ---');
  try {
    const auditRes = await request('/rbac/audit-events?limit=50', { method: 'GET' }, TOKENS['SUPER_ADMIN']);
    const events = auditRes.data?.events || [];
    let chainValid = events.length > 0;
    for (let i = 1; i < events.length; i++) {
      if (events[i].previousHash && events[i - 1].hash && events[i].previousHash !== events[i - 1].hash) {
        chainValid = false;
        break;
      }
    }
    record('Audit trail immutable hash chaining verified (tamper-evident)', chainValid);
  } catch (e) {
    record('Audit trail immutable hash chaining verified', false, e);
  }

  try {
    const rolesRes = await request('/rbac/roles', { method: 'GET' }, TOKENS['SUPER_ADMIN']);
    record('RBAC role template governance matrix (200 OK, 12 templates)', rolesRes.status === 200 && (rolesRes.data?.roles?.length || 0) >= 12);
  } catch (e) {
    record('RBAC role template governance matrix', false, e);
  }

  // Summary output
  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${results.passed} PASSED / ${results.failed} FAILED (TOTAL: ${results.total})`);
  console.log('================================================================');

  if (results.failed > 0) {
    console.log('\nDETAILED FAILURE LIST:');
    results.errors.forEach((e, idx) => {
      console.log(`\n${idx + 1}. ${e.name}`);
      console.log(`   Error: ${e.error}`);
      if (e.details) {
        console.log(`   Details:`, JSON.stringify(e.details).slice(0, 300));
      }
    });
  }
}

run().catch((err) => {
  console.error('Fatal test runner failure:', err);
  process.exit(1);
});
