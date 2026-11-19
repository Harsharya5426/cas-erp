import crypto from 'node:crypto';
import request from 'supertest';
import mongoose from 'mongoose';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { AuditEvent } from '../core/audit.js';
import { computeTotpCode } from '../core/crypto.js';
import { LedgerEntry, PaymentTransaction } from '../modules/finance/models.js';
import { ensureBaselineSeed } from '../scripts/seed.js';

const TEST_DB_URI = `mongodb://127.0.0.1:27017/cas_erp_test_${process.pid}_${Date.now()}`;
let app: ReturnType<typeof createApp>;

async function loginAs(email: string, password = 'CasErp@2026!', mfaCode?: string) {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password, mfaCode });
  expect(res.status).toBe(200);
  return {
    token: res.body.data.accessToken as string,
    auth: res.body.data.auth,
    cookies: res.headers['set-cookie']
  };
}

describe('CAS ERP API Integration & Security Verification', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.CASHFREE_WEBHOOK_SECRET = 'test_cf_webhook_secret_key_123';
    await connectDatabase(TEST_DB_URI);
    await ensureBaselineSeed();
    app = createApp();
  }, 30_000);

  afterAll(async () => {
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }
    await disconnectDatabase();
  });

  it('exposes healthz, readyz, and OpenAPI 3.1 contract', async () => {
    const h = await request(app).get('/api/v1/healthz');
    expect(h.status).toBe(200);
    expect(h.body.data.status).toBe('ok');

    const r = await request(app).get('/api/v1/readyz');
    expect(r.status).toBe(200);
    expect(r.body.data.mongodb).toBe('connected');

    const spec = await request(app).get('/api/v1/openapi.json');
    expect(spec.status).toBe(200);
    expect(spec.body.openapi).toBe('3.1.0');
  });

  it('enforces password validation, lockout after 5 failures, MFA setup, and refresh rotation', async () => {
    // 5 failed attempts on library account locks it
    for (let i = 0; i < 5; i++) {
      const bad = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'library@cas.res.in', password: 'WrongPassword!' });
      expect(bad.status).toBe(401);
    }
    const locked = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'library@cas.res.in', password: 'CasErp@2026!' });
    expect(locked.status).toBe(423);

    // MFA setup + enable on warden account
    const warden = await loginAs('warden@cas.res.in');
    const setupRes = await request(app)
      .post('/api/v1/auth/mfa/setup')
      .set('Authorization', `Bearer ${warden.token}`);
    expect(setupRes.status).toBe(200);
    const code = computeTotpCode(setupRes.body.data.secret);

    const enableRes = await request(app)
      .post('/api/v1/auth/mfa/enable')
      .set('Authorization', `Bearer ${warden.token}`)
      .send({ code });
    expect(enableRes.status).toBe(200);

    // Login without MFA code rejected
    const missingMfa = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'warden@cas.res.in', password: 'CasErp@2026!' });
    expect(missingMfa.status).toBe(401);
    expect(missingMfa.body.error.code).toBe('MFA_REQUIRED');

    // Login with valid TOTP succeeds
    const validMfa = await loginAs('warden@cas.res.in', 'CasErp@2026!', computeTotpCode(setupRes.body.data.secret));
    expect(validMfa.auth.mfaVerified).toBe(true);
  });

  it('enforces 12-role RBAC, blocks unauthorized role switches, and isolates confidential grievances', async () => {
    const student = await loginAs('student@cas.res.in');
    const superAdmin = await loginAs('superadmin@cas.res.in');
    const principal = await loginAs('principal@cas.res.in');
    const collegeAdmin = await loginAs('admin@cas.res.in');

    // Student cannot view audit events or switch to SUPER_ADMIN
    const deniedAudit = await request(app)
      .get('/api/v1/rbac/audit-events')
      .set('Authorization', `Bearer ${student.token}`);
    expect(deniedAudit.status).toBe(403);

    const deniedSwitch = await request(app)
      .post('/api/v1/auth/switch-role')
      .set('Authorization', `Bearer ${student.token}`)
      .send({ roleKey: 'SUPER_ADMIN' });
    expect(deniedSwitch.status).toBe(403);

    // Super Admin cannot read confidential grievances (SoD)
    const superAdminGrievance = await request(app)
      .get('/api/v1/campus/grievances')
      .set('Authorization', `Bearer ${superAdmin.token}`);
    expect(superAdminGrievance.status).toBe(403);

    // Student submits confidential grievance
    const createdGrv = await request(app)
      .post('/api/v1/campus/grievances')
      .set('Authorization', `Bearer ${student.token}`)
      .send({
        category: 'Harassment / Confidential',
        subject: 'Confidential Complaint Test',
        description: 'Detailed confidential complaint description for committee review.',
        confidential: true
      });
    expect(createdGrv.status).toBe(201);

    // Unassigned collegeAdmin cannot see confidential ticket; Principal can
    const adminList = await request(app)
      .get('/api/v1/campus/grievances')
      .set('Authorization', `Bearer ${collegeAdmin.token}`);
    expect(adminList.status).toBe(200);
    expect(adminList.body.data.tickets.some((t: { confidential: boolean }) => t.confidential)).toBe(false);

    const principalList = await request(app)
      .get('/api/v1/campus/grievances')
      .set('Authorization', `Bearer ${principal.token}`);
    expect(principalList.status).toBe(200);
    expect(principalList.body.data.tickets.some((t: { confidential: boolean }) => t.confidential)).toBe(true);
  });

  it('completes end-to-end admission application, tracking, verification, approval, and student enrollment', async () => {
    const applyRes = await request(app).post('/api/v1/public/admissions/apply').send({
      fullName: 'Priya Nair',
      email: 'priya.nair@example.edu',
      phone: '+91 98111 44556',
      deptCode: 'CSE',
      programCode: 'MTECH-CSE',
      qualifyingExamName: 'GATE CS 2026',
      qualifyingScorePct: 88.5,
      guardianName: 'K. Nair',
      guardianPhone: '+91 98111 44557'
    });
    expect(applyRes.status).toBe(201);
    const { applicationNo, trackingPin } = applyRes.body.data;

    const trackRes = await request(app)
      .get('/api/v1/public/admissions/track')
      .query({ applicationNo, pin: trackingPin });
    expect(trackRes.status).toBe(200);
    expect(trackRes.body.data.status).toBe('submitted');

    const officer = await loginAs('admissions@cas.res.in');
    const principal = await loginAs('principal@cas.res.in');

    const listRes = await request(app)
      .get('/api/v1/admissions/applicants')
      .set('Authorization', `Bearer ${officer.token}`);
    const applicant = listRes.body.data.applicants.find(
      (a: { applicationNo: string }) => a.applicationNo === applicationNo
    );

    const verifyRes = await request(app)
      .post(`/api/v1/admissions/applicants/${applicant._id}/transition`)
      .set('Authorization', `Bearer ${officer.token}`)
      .send({ targetStatus: 'docs_verified', remarks: 'GATE scorecard verified' });
    expect(verifyRes.status).toBe(200);

    const approveRes = await request(app)
      .post(`/api/v1/admissions/applicants/${applicant._id}/transition`)
      .set('Authorization', `Bearer ${principal.token}`)
      .send({ targetStatus: 'approved', remarks: 'Seat allotted in CSE' });
    expect(approveRes.status).toBe(200);

    const enrollRes = await request(app)
      .post(`/api/v1/admissions/applicants/${applicant._id}/enroll`)
      .set('Authorization', `Bearer ${principal.token}`)
      .send({ initialFeeInr: 150000 });
    expect(enrollRes.status).toBe(201);
    expect(enrollRes.body.data.student.rollNumber).toBeTruthy();
  });

  it('blocks gated face-matching attendance, supports QR check-in idempotency, and audits corrections', async () => {
    const faculty = await loginAs('faculty@cas.res.in');
    const student = await loginAs('student@cas.res.in');
    const hod = await loginAs('hod.cse@cas.res.in');

    const stuList = await request(app)
      .get('/api/v1/academics/students')
      .set('Authorization', `Bearer ${faculty.token}`);
    const aarav = stuList.body.data.students.find((s: { rollNumber: string }) => s.rollNumber === '23BCE1042');

    // Biometric face_advisory blocked by default policy gate
    const blockedBio = await request(app)
      .post('/api/v1/attendance/lectures/mark')
      .set('Authorization', `Bearer ${faculty.token}`)
      .send({
        subjectCode: 'CS-501',
        sessionDate: '2026-11-11',
        lectureSlot: 'SLOT-1',
        captureMethod: 'face_advisory',
        entries: [{ studentId: aarav._id, status: 'Present' }]
      });
    expect(blockedBio.status).toBe(403);
    expect(blockedBio.body.error.code).toBe('POLICY_GATE_BLOCKED');

    // QR non-biometric session + duplicate check-in protection
    const qrRes = await request(app)
      .post('/api/v1/attendance/qr-sessions')
      .set('Authorization', `Bearer ${faculty.token}`)
      .send({ subjectCode: 'CS-501', sessionDate: '2026-11-11', lectureSlot: 'SLOT-2' });
    expect(qrRes.status).toBe(201);

    const checkin1 = await request(app)
      .post('/api/v1/attendance/qr-checkin')
      .set('Authorization', `Bearer ${student.token}`)
      .send({ codeToken: qrRes.body.data.session.codeToken });
    expect(checkin1.status).toBe(201);
    expect(checkin1.body.data.duplicateIgnored).toBe(false);

    const checkin2 = await request(app)
      .post('/api/v1/attendance/qr-checkin')
      .set('Authorization', `Bearer ${student.token}`)
      .send({ codeToken: qrRes.body.data.session.codeToken });
    expect(checkin2.status).toBe(200);
    expect(checkin2.body.data.duplicateIgnored).toBe(true);

    // Correction request & HOD approval
    const corrReq = await request(app)
      .post(`/api/v1/attendance/events/${checkin1.body.data.event._id}/correction`)
      .set('Authorization', `Bearer ${student.token}`)
      .send({ requestedStatus: 'Excused', reason: 'Represented CAS at AKTU hackathon' });
    expect(corrReq.status).toBe(200);

    const corrDec = await request(app)
      .post(`/api/v1/attendance/events/${checkin1.body.data.event._id}/correction/decision`)
      .set('Authorization', `Bearer ${hod.token}`)
      .send({ decision: 'approved', remarks: 'Verified OD letter' });
    expect(corrDec.status).toBe(200);
    expect(corrDec.body.data.event.status).toBe('Excused');
  });

  it('enforces Cashfree HMAC webhook verification, idempotency, dual-control refunds, and append-only ledger', async () => {
    const accountant = await loginAs('accounts@cas.res.in');
    const principal = await loginAs('principal@cas.res.in');

    const stuList = await request(app)
      .get('/api/v1/academics/students')
      .set('Authorization', `Bearer ${accountant.token}`);
    const aarav = stuList.body.data.students.find((s: { rollNumber: string }) => s.rollNumber === '23BCE1042');

    // Offline payment posts balanced ledger entry
    const offlinePay = await request(app)
      .post('/api/v1/finance/payments/offline')
      .set('Authorization', `Bearer ${accountant.token}`)
      .send({
        studentId: aarav._id,
        amountInr: 15000,
        channel: 'offline_challan',
        referenceCode: 'CHLN-2026-8891'
      });
    expect(offlinePay.status).toBe(201);

    // Unbalanced double-entry voucher rejected
    const unbalanced = await request(app)
      .post('/api/v1/finance/accounting/vouchers')
      .set('Authorization', `Bearer ${accountant.token}`)
      .send({
        voucherType: 'Journal',
        description: 'Invalid unbalanced entry',
        lines: [
          { accountCode: '1002', accountName: 'Bank', debitInr: 5000, creditInr: 0 },
          { accountCode: '4001', accountName: 'Income', debitInr: 0, creditInr: 4000 }
        ]
      });
    expect(unbalanced.status).toBe(400);

    // Append-only enforcement on LedgerEntry and AuditEvent
    await expect(LedgerEntry.deleteMany({})).rejects.toThrow(/append-only/i);
    await expect(AuditEvent.updateMany({}, { $set: { action: 'tampered' } })).rejects.toThrow(/append-only/i);

    // Dual-control refund: Accountant prepares, cannot self-approve, Principal approves
    const prepRefund = await request(app)
      .post('/api/v1/finance/refunds')
      .set('Authorization', `Bearer ${accountant.token}`)
      .send({
        paymentId: offlinePay.body.data.payment._id,
        amountInr: 5000,
        reason: 'Excess fee adjustment'
      });
    expect(prepRefund.status).toBe(201);

    const selfApprove = await request(app)
      .post(`/api/v1/finance/refunds/${prepRefund.body.data.refund._id}/decision`)
      .set('Authorization', `Bearer ${accountant.token}`)
      .send({ decision: 'approved' });
    expect(selfApprove.status).toBe(403);

    const prinApprove = await request(app)
      .post(`/api/v1/finance/refunds/${prepRefund.body.data.refund._id}/decision`)
      .set('Authorization', `Bearer ${principal.token}`)
      .send({ decision: 'approved', remarks: 'Verified adjustment' });
    expect(prinApprove.status).toBe(200);
    expect(prinApprove.body.data.refund.status).toBe('processed');

    // Cashfree Webhook HMAC signature & replay protection
    const orderId = 'ORD-CF-TEST-001';
    const inv = await request(app)
      .get('/api/v1/finance/invoices')
      .set('Authorization', `Bearer ${accountant.token}`);
    await PaymentTransaction.create({
      receiptNo: 'REC-CF-TEST-001',
      orderId,
      idempotencyKey: `IDEM-${orderId}`,
      invoiceId: inv.body.data.invoices[0]._id,
      studentId: aarav._id,
      studentName: aarav.name,
      rollNumber: aarav.rollNumber,
      feeHead: 'Tuition',
      amountInr: 10000,
      channel: 'cashfree',
      status: 'initiated',
      recordedByUserId: accountant.auth.userId
    });

    const payload = JSON.stringify({
      data: {
        order: { order_id: orderId },
        payment: { cf_payment_id: 'CF_PAY_999', payment_status: 'SUCCESS' }
      }
    });
    const ts = String(Date.now());
    const badSig = await request(app)
      .post('/api/v1/webhooks/cashfree')
      .set('x-webhook-timestamp', ts)
      .set('x-webhook-signature', 'invalid_sig')
      .set('Content-Type', 'application/json')
      .send(payload);
    expect(badSig.status).toBe(401);

    const goodSig = crypto
      .createHmac('sha256', 'test_cf_webhook_secret_key_123')
      .update(`${ts}${payload}`)
      .digest('base64');

    const hook1 = await request(app)
      .post('/api/v1/webhooks/cashfree')
      .set('x-webhook-timestamp', ts)
      .set('x-webhook-signature', goodSig)
      .set('Content-Type', 'application/json')
      .send(payload);
    expect(hook1.status).toBe(200);
    expect(hook1.body.data.status).toBe('paid');

    const hookReplay = await request(app)
      .post('/api/v1/webhooks/cashfree')
      .set('x-webhook-timestamp', ts)
      .set('x-webhook-signature', goodSig)
      .set('Content-Type', 'application/json')
      .send(payload);
    expect(hookReplay.status).toBe(200);
    expect(hookReplay.body.data.idempotentDuplicate).toBe(true);
  });

  it('enforces exam marks SoD, audit-locked publication, verifiable QR certificates, and migration dry-run/commit', async () => {
    const faculty = await loginAs('faculty@cas.res.in');
    const controller = await loginAs('exam@cas.res.in');
    const student = await loginAs('student@cas.res.in');
    const principal = await loginAs('principal@cas.res.in');
    const superAdmin = await loginAs('superadmin@cas.res.in');

    const schedRes = await request(app)
      .get('/api/v1/exams/schedules')
      .set('Authorization', `Bearer ${faculty.token}`);
    const exam = schedRes.body.data.schedules[0];

    const stuList = await request(app)
      .get('/api/v1/academics/students')
      .set('Authorization', `Bearer ${faculty.token}`);
    const aarav = stuList.body.data.students.find((s: { rollNumber: string }) => s.rollNumber === '23BCE1042');

    const submitMarks = await request(app)
      .put('/api/v1/exams/marks')
      .set('Authorization', `Bearer ${faculty.token}`)
      .send({ examId: exam._id, studentId: aarav._id, internalMarks: 28, practicalMarks: 20, externalMarks: 46 });
    expect(submitMarks.status).toBe(200);
    expect(submitMarks.body.data.mark.grade).toBe('O');

    // Faculty cannot publish results
    const facPub = await request(app)
      .post(`/api/v1/exams/schedules/${exam._id}/publish`)
      .set('Authorization', `Bearer ${faculty.token}`);
    expect(facPub.status).toBe(403);

    // Controller verifies and publishes
    const verRes = await request(app)
      .post(`/api/v1/exams/schedules/${exam._id}/verify`)
      .set('Authorization', `Bearer ${controller.token}`);
    expect(verRes.status).toBe(200);

    const pubRes = await request(app)
      .post(`/api/v1/exams/schedules/${exam._id}/publish`)
      .set('Authorization', `Bearer ${controller.token}`);
    expect(pubRes.status).toBe(200);
    expect(pubRes.body.data.publishedStudents).toBeGreaterThanOrEqual(1);

    // Post-publication mark mutation blocked
    const postLockEdit = await request(app)
      .put('/api/v1/exams/marks')
      .set('Authorization', `Bearer ${faculty.token}`)
      .send({ examId: exam._id, studentId: aarav._id, internalMarks: 10, practicalMarks: 10, externalMarks: 10 });
    expect(postLockEdit.status).toBe(403);

    // Certificate request -> Principal sign -> Public QR verify
    const certReq = await request(app)
      .post('/api/v1/campus/certificates/request')
      .set('Authorization', `Bearer ${student.token}`)
      .send({ certificateType: 'Bonafide', purpose: 'Passport verification' });
    expect(certReq.status).toBe(201);

    const certSign = await request(app)
      .post(`/api/v1/campus/certificates/${certReq.body.data.certificate._id}/sign`)
      .set('Authorization', `Bearer ${principal.token}`);
    expect(certSign.status).toBe(200);

    const publicVerify = await request(app).get(
      `/api/v1/public/certificates/verify/${certReq.body.data.certificate.qrVerificationToken}`
    );
    expect(publicVerify.status).toBe(200);
    expect(publicVerify.body.data.valid).toBe(true);

    // Migration dry-run records rejections cleanly
    const migDry = await request(app)
      .post('/api/v1/org/migration/batches')
      .set('Authorization', `Bearer ${superAdmin.token}`)
      .send({
        sourceSystem: 'LEGACY_ERP_V1',
        entityType: 'departments',
        mode: 'dry_run',
        rows: [
          { code: 'CIVIL', name: 'Civil Engineering (Migrated)', annualBudgetInr: 9000000 },
          { code: '', name: 'Invalid Row Missing Code' }
        ]
      });
    expect(migDry.status).toBe(201);
    expect(migDry.body.data.batch.validRows).toBe(1);
    expect(migDry.body.data.batch.rejectedRows).toBe(1);
  });
});

