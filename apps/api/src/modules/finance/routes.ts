import { Router, type Request } from 'express';
import { z } from 'zod';
import { ERROR_CODES } from '@cas-erp/shared';
import {
  createCashfreeOrder,
  fetchCashfreeOrderStatus,
  getCashfreeStatus,
  verifyCashfreeWebhookSignature
} from '../../adapters/cashfree.js';
import { env } from '../../config/env.js';
import { recordAuditEvent } from '../../core/audit.js';
import { AppError, asyncHandler } from '../../core/errors.js';
import {
  type AuthenticatedRequest,
  requireAuth,
  requirePermission
} from '../../core/rbac.js';
import { sendSuccess, validateBody } from '../../core/requestContext.js';
import { assertWorkflowStepAuthority } from '../../core/workflow.js';
import { GuardianLink, Student } from '../academics/models.js';
import {
  FeePlan,
  Invoice,
  LedgerAccount,
  LedgerEntry,
  PaymentTransaction,
  RefundRequest
} from './models.js';

async function postBalancedLedgerReceipt(params: {
  receiptNo: string;
  studentName: string;
  rollNumber: string;
  amountInr: number;
  channel: string;
  postedByUserId: string;
}) {
  const voucherNo = `VCH-REC-${Date.now().toString().slice(-6)}`;
  const assetCode = params.channel === 'offline_cash' ? '1001' : '1002';
  const assetName = params.channel === 'offline_cash' ? 'Cash in Hand' : 'Bank / Gateway Clearing Account';
  return LedgerEntry.create({
    voucherNo,
    voucherType: 'Receipt',
    description: `Fee receipt ${params.receiptNo} for ${params.studentName} (${params.rollNumber})`,
    costCentre: 'ACADEMICS',
    referenceType: 'PaymentTransaction',
    referenceId: params.receiptNo,
    lines: [
      { accountCode: assetCode, accountName: assetName, debitInr: params.amountInr, creditInr: 0 },
      { accountCode: '4001', accountName: 'Student Tuition & Academic Fee Income', debitInr: 0, creditInr: params.amountInr }
    ],
    totalDebitInr: params.amountInr,
    totalCreditInr: params.amountInr,
    postedByUserId: params.postedByUserId
  });
}

async function applySettledPaymentToInvoiceAndStudent(
  payment: InstanceType<typeof PaymentTransaction>,
  postedByUserId: string
) {
  const invoice = await Invoice.findById(payment.invoiceId);
  if (invoice) {
    invoice.paidAmountInr += payment.amountInr;
    invoice.dueAmountInr = Math.max(0, invoice.netAmountInr - invoice.paidAmountInr);
    invoice.status =
      invoice.dueAmountInr === 0 ? 'Paid' : invoice.paidAmountInr > 0 ? 'Partial' : 'Pending';
    await invoice.save();
  }

  const student = await Student.findById(payment.studentId);
  if (student) {
    student.paidFeeInr += payment.amountInr;
    student.dueFeeInr = Math.max(0, student.totalFeeAssessedInr - student.paidFeeInr);
    student.feeStatus =
      student.dueFeeInr === 0 ? 'Paid' : student.paidFeeInr > 0 ? 'Partial' : 'Pending';
    await student.save();
  }

  await postBalancedLedgerReceipt({
    receiptNo: payment.receiptNo,
    studentName: payment.studentName,
    rollNumber: payment.rollNumber,
    amountInr: payment.amountInr,
    channel: payment.channel,
    postedByUserId
  });
}

export const financeRouter = Router();
financeRouter.use(requireAuth);

financeRouter.get(
  '/gateway-status',
  requirePermission('finance', 'view'),
  asyncHandler(async (req, res) => {
    sendSuccess(req, res, { cashfree: getCashfreeStatus() });
  })
);

financeRouter.get(
  '/fee-plans',
  requirePermission('finance', 'view'),
  asyncHandler(async (req, res) => {
    const feePlans = await FeePlan.find({ active: true }).sort({ programCode: 1, semesterNumber: 1 }).lean();
    sendSuccess(req, res, { feePlans });
  })
);

financeRouter.post(
  '/fee-plans',
  requirePermission('finance', 'configure'),
  validateBody(
    z.object({
      code: z.string().trim().min(2),
      name: z.string().trim().min(2),
      programCode: z.string().trim().min(2),
      semesterNumber: z.number().int().min(1).max(12),
      tuitionInr: z.number().min(0),
      examFeeInr: z.number().min(0).default(2500),
      developmentFeeInr: z.number().min(0).default(10000),
      hostelFeeInr: z.number().min(0).default(0),
      installmentsAllowed: z.number().int().min(1).max(6).default(2),
      lateFeePerDayInr: z.number().min(0).default(50)
    })
  ),
  asyncHandler(async (req, res) => {
    const plan = await FeePlan.create(req.body);
    await recordAuditEvent({
      req,
      action: `Created fee plan ${plan.code}`,
      category: 'finance',
      resourceType: 'FeePlan',
      resourceId: String(plan._id)
    });
    sendSuccess(req, res, { feePlan: plan }, 201);
  })
);

financeRouter.get(
  '/invoices',
  requirePermission('finance', 'view'),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const scope = res.locals.permissionScope as string;
    const filter: Record<string, unknown> = {};
    if (scope === 'own' && auth.linkedStudentId) {
      filter.studentId = auth.linkedStudentId;
    } else if (scope === 'linked-student') {
      const links = await GuardianLink.find({
        guardianUserId: auth.userId,
        verificationStatus: 'verified',
        allowFeeViewAndPay: true
      }).lean();
      filter.studentId = { $in: links.map((l) => l.studentId) };
    }
    const invoices = await Invoice.find(filter).sort({ createdAt: -1 }).limit(150).lean();
    sendSuccess(req, res, { invoices });
  })
);

financeRouter.post(
  '/invoices',
  requirePermission('finance', 'create'),
  validateBody(
    z.object({
      studentId: z.string().min(10),
      academicYear: z.string().default('2026 - 2027'),
      semesterLabel: z.string().min(2),
      feeHead: z.string().min(2),
      grossAmountInr: z.number().positive(),
      concessionInr: z.number().min(0).default(0),
      dueDate: z.string()
    })
  ),
  asyncHandler(async (req, res) => {
    const student = await Student.findById(req.body.studentId);
    if (!student) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Student not found');
    const netAmountInr = Math.max(0, req.body.grossAmountInr - req.body.concessionInr);

    const invoice = await Invoice.create({
      invoiceNo: `INV-2026-${String(Date.now()).slice(-6)}`,
      studentId: student._id,
      studentName: student.name,
      rollNumber: student.rollNumber,
      academicYear: req.body.academicYear,
      semesterLabel: req.body.semesterLabel,
      feeHead: req.body.feeHead,
      grossAmountInr: req.body.grossAmountInr,
      concessionInr: req.body.concessionInr,
      netAmountInr,
      paidAmountInr: 0,
      dueAmountInr: netAmountInr,
      dueDate: new Date(req.body.dueDate),
      status: netAmountInr === 0 ? 'Paid' : 'Pending'
    });

    student.totalFeeAssessedInr += netAmountInr;
    student.dueFeeInr = Math.max(0, student.totalFeeAssessedInr - student.paidFeeInr);
    student.feeStatus = student.dueFeeInr === 0 ? 'Paid' : student.paidFeeInr > 0 ? 'Partial' : 'Pending';
    await student.save();

    await recordAuditEvent({
      req,
      action: `Issued invoice ${invoice.invoiceNo} (₹${netAmountInr}) for ${student.rollNumber}`,
      category: 'finance',
      resourceType: 'Invoice',
      resourceId: String(invoice._id)
    });

    sendSuccess(req, res, { invoice }, 201);
  })
);

financeRouter.get(
  '/payments',
  requirePermission('finance', 'view'),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const scope = res.locals.permissionScope as string;
    const filter: Record<string, unknown> = {};
    if (scope === 'own' && auth.linkedStudentId) {
      filter.studentId = auth.linkedStudentId;
    } else if (scope === 'linked-student') {
      const links = await GuardianLink.find({
        guardianUserId: auth.userId,
        verificationStatus: 'verified',
        allowFeeViewAndPay: true
      }).lean();
      filter.studentId = { $in: links.map((l) => l.studentId) };
    }
    const payments = await PaymentTransaction.find(filter).sort({ createdAt: -1 }).limit(150).lean();
    sendSuccess(req, res, { payments });
  })
);

// Offline / Challan / NEFT Receipt Recording (Accountant / Admin)
financeRouter.post(
  '/payments/offline',
  requirePermission('finance', 'create'),
  validateBody(
    z.object({
      studentId: z.string().min(10),
      invoiceId: z.string().optional(),
      amountInr: z.number().positive(),
      channel: z.enum(['offline_cash', 'offline_challan', 'offline_neft', 'offline_upi']),
      referenceCode: z.string().trim().min(3),
      feeHead: z.string().trim().default('Academic Tuition & Semester Fee')
    })
  ),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const idempotencyKey =
      req.header('idempotency-key') || `OFFLINE:${req.body.studentId}:${req.body.referenceCode}`;

    const existing = await PaymentTransaction.findOne({ idempotencyKey }).lean();
    if (existing) {
      sendSuccess(req, res, { payment: existing, idempotentReplay: true });
      return;
    }

    const student = await Student.findById(req.body.studentId);
    if (!student) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Student not found');

    let invoice = req.body.invoiceId
      ? await Invoice.findById(req.body.invoiceId)
      : await Invoice.findOne({ studentId: student._id, status: { $in: ['Pending', 'Partial', 'Overdue'] } }).sort({ createdAt: 1 });

    if (!invoice) {
      invoice = await Invoice.create({
        invoiceNo: `INV-2026-${String(Date.now()).slice(-6)}`,
        studentId: student._id,
        studentName: student.name,
        rollNumber: student.rollNumber,
        academicYear: '2026 - 2027',
        semesterLabel: `Semester ${student.semesterNumber}`,
        feeHead: req.body.feeHead,
        grossAmountInr: req.body.amountInr,
        concessionInr: 0,
        netAmountInr: req.body.amountInr,
        paidAmountInr: 0,
        dueAmountInr: req.body.amountInr,
        dueDate: new Date(),
        status: 'Pending'
      });
    }

    const rand = String(Math.floor(100000 + Math.random() * 899999));
    const payment = await PaymentTransaction.create({
      receiptNo: `REC-2026-${rand}`,
      orderId: `ORD-OFF-${Date.now()}-${rand.slice(0, 3)}`,
      idempotencyKey,
      invoiceId: invoice._id,
      studentId: student._id,
      studentName: student.name,
      rollNumber: student.rollNumber,
      feeHead: req.body.feeHead,
      amountInr: req.body.amountInr,
      channel: req.body.channel,
      status: 'paid',
      webhookVerified: false,
      referenceCode: req.body.referenceCode,
      settledAt: new Date(),
      recordedByUserId: auth.userId
    });

    await applySettledPaymentToInvoiceAndStudent(payment, auth.userId);

    await recordAuditEvent({
      req,
      action: `Recorded offline fee receipt ${payment.receiptNo} (₹${payment.amountInr}) for ${student.rollNumber}`,
      category: 'finance',
      resourceType: 'PaymentTransaction',
      resourceId: String(payment._id)
    });

    sendSuccess(req, res, { payment }, 201);
  })
);

// Cashfree Hosted Checkout Order Initiation (Server-side verification required)
financeRouter.post(
  '/payments/cashfree/order',
  requirePermission('finance', 'submit'),
  validateBody(
    z.object({
      studentId: z.string().min(10),
      invoiceId: z.string().min(10),
      amountInr: z.number().positive()
    })
  ),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const invoice = await Invoice.findById(req.body.invoiceId);
    const student = await Student.findById(req.body.studentId);
    if (!invoice || !student) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Invoice or student not found');

    const orderId = `CAS_CF_${Date.now()}_${Math.floor(1000 + Math.random() * 8999)}`;
    const cfOrder = await createCashfreeOrder({
      orderId,
      orderAmount: req.body.amountInr,
      customerId: String(student._id),
      customerName: student.name,
      customerEmail: student.email,
      customerPhone: student.phone.replace(/\D/g, '').slice(-10) || '9999999999',
      returnUrl: `${env.APP_ORIGIN}/#finance?order_id=${orderId}`,
      notifyUrl: `${env.APP_ORIGIN}/api/v1/webhooks/cashfree`
    });

    const payment = await PaymentTransaction.create({
      receiptNo: `REC-CF-${Date.now().toString().slice(-6)}`,
      orderId,
      idempotencyKey: req.header('idempotency-key') || `CF:${orderId}`,
      invoiceId: invoice._id,
      studentId: student._id,
      studentName: student.name,
      rollNumber: student.rollNumber,
      feeHead: invoice.feeHead,
      amountInr: req.body.amountInr,
      channel: 'cashfree',
      status: 'initiated',
      gatewayOrderId: cfOrder.cf_order_id,
      gatewaySessionId: cfOrder.payment_session_id,
      recordedByUserId: auth.userId
    });

    sendSuccess(req, res, { payment, cashfreeOrder: cfOrder }, 201);
  })
);

financeRouter.post(
  '/payments/cashfree/:orderId/verify',
  requirePermission('finance', 'view'),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const orderId = String(req.params.orderId);
    const payment = await PaymentTransaction.findOne({ orderId });
    if (!payment) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Order not found');
    if (payment.status === 'paid') {
      sendSuccess(req, res, { payment, alreadySettled: true });
      return;
    }

    const cfStatus = await fetchCashfreeOrderStatus(orderId);
    if (cfStatus.order_status === 'PAID') {
      payment.status = 'paid';
      payment.webhookVerified = true;
      payment.settledAt = new Date();
      await payment.save();
      await applySettledPaymentToInvoiceAndStudent(payment, auth.userId);
    }

    sendSuccess(req, res, { payment, gatewayStatus: cfStatus.order_status });
  })
);

// Dual-Control Refund Preparation & Independent Approval
financeRouter.get(
  '/refunds',
  requirePermission('finance', 'view'),
  asyncHandler(async (req, res) => {
    const refunds = await RefundRequest.find().sort({ createdAt: -1 }).lean();
    sendSuccess(req, res, { refunds });
  })
);

financeRouter.post(
  '/refunds',
  requirePermission('finance', 'create'),
  validateBody(
    z.object({
      paymentId: z.string().min(10),
      amountInr: z.number().positive(),
      reason: z.string().trim().min(5)
    })
  ),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const payment = await PaymentTransaction.findById(req.body.paymentId);
    if (!payment || payment.status !== 'paid') {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Only settled payments can be refunded');
    }
    if (req.body.amountInr > payment.amountInr) {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Refund cannot exceed paid amount');
    }

    const refund = await RefundRequest.create({
      refundNo: `REF-2026-${String(Date.now()).slice(-6)}`,
      paymentId: payment._id,
      invoiceId: payment.invoiceId,
      studentId: payment.studentId,
      amountInr: req.body.amountInr,
      reason: req.body.reason,
      preparedByUserId: auth.userId
    });

    await recordAuditEvent({
      req,
      action: `Prepared refund ${refund.refundNo} (₹${refund.amountInr})`,
      category: 'finance',
      resourceType: 'RefundRequest',
      resourceId: String(refund._id)
    });

    sendSuccess(req, res, { refund }, 201);
  })
);

financeRouter.post(
  '/refunds/:id/decision',
  requirePermission('finance', 'approve'),
  validateBody(z.object({ decision: z.enum(['approved', 'rejected']), remarks: z.string().optional() })),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const refund = await RefundRequest.findById(req.params.id);
    if (!refund || refund.status !== 'pending_approval') {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Pending refund request not found');
    }

    await assertWorkflowStepAuthority('refunds', 1, auth.userId, auth.activeRole, String(refund.preparedByUserId));

    refund.status = req.body.decision === 'approved' ? 'processed' : 'rejected';
    refund.approvedByUserId = auth.userId as never;
    refund.remarks = req.body.remarks || '';
    if (req.body.decision === 'approved') {
      refund.processedAt = new Date();
      await LedgerEntry.create({
        voucherNo: `VCH-REV-${Date.now().toString().slice(-6)}`,
        voucherType: 'Reversal',
        description: `Approved refund ${refund.refundNo}: ${refund.reason}`,
        costCentre: 'ACADEMICS',
        referenceType: 'RefundRequest',
        referenceId: refund.refundNo,
        lines: [
          { accountCode: '4001', accountName: 'Student Tuition & Academic Fee Income', debitInr: refund.amountInr, creditInr: 0 },
          { accountCode: '1002', accountName: 'Bank / Gateway Clearing Account', debitInr: 0, creditInr: refund.amountInr }
        ],
        totalDebitInr: refund.amountInr,
        totalCreditInr: refund.amountInr,
        postedByUserId: auth.userId
      });
    }
    await refund.save();

    await recordAuditEvent({
      req,
      action: `${req.body.decision.toUpperCase()} refund ${refund.refundNo}`,
      category: 'finance',
      resourceType: 'RefundRequest',
      resourceId: String(refund._id)
    });

    sendSuccess(req, res, { refund });
  })
);

// Double-Entry Accounting (FM-09)
financeRouter.get(
  '/accounting/accounts',
  requirePermission('accounting', 'view'),
  asyncHandler(async (req, res) => {
    const accounts = await LedgerAccount.find({ active: true }).sort({ code: 1 }).lean();
    sendSuccess(req, res, { accounts });
  })
);

financeRouter.get(
  '/accounting/vouchers',
  requirePermission('accounting', 'view'),
  asyncHandler(async (req, res) => {
    const entries = await LedgerEntry.find().sort({ postedAt: -1 }).limit(100).lean();
    sendSuccess(req, res, { entries });
  })
);

financeRouter.post(
  '/accounting/vouchers',
  requirePermission('accounting', 'create'),
  validateBody(
    z.object({
      voucherType: z.enum(['Receipt', 'Payment', 'Journal', 'Reversal']),
      description: z.string().trim().min(4),
      costCentre: z.string().trim().default('GENERAL'),
      lines: z
        .array(
          z.object({
            accountCode: z.string().trim().min(2),
            accountName: z.string().trim().min(2),
            debitInr: z.number().min(0),
            creditInr: z.number().min(0)
          })
        )
        .min(2)
    })
  ),
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthenticatedRequest;
    const sumDebit = req.body.lines.reduce((s: number, l: { debitInr: number }) => s + l.debitInr, 0);
    const sumCredit = req.body.lines.reduce((s: number, l: { creditInr: number }) => s + l.creditInr, 0);
    if (sumDebit <= 0 || Number(sumDebit.toFixed(2)) !== Number(sumCredit.toFixed(2))) {
      throw new AppError(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        `Double-entry imbalance: debit (${sumDebit}) must equal credit (${sumCredit})`
      );
    }

    const entry = await LedgerEntry.create({
      voucherNo: `VCH-${Date.now().toString().slice(-6)}`,
      voucherType: req.body.voucherType,
      description: req.body.description,
      costCentre: req.body.costCentre,
      lines: req.body.lines,
      totalDebitInr: sumDebit,
      totalCreditInr: sumCredit,
      postedByUserId: auth.userId
    });

    await recordAuditEvent({
      req,
      action: `Posted double-entry voucher ${entry.voucherNo} (₹${entry.totalDebitInr})`,
      category: 'accounting',
      resourceType: 'LedgerEntry',
      resourceId: String(entry._id)
    });

    sendSuccess(req, res, { entry }, 201);
  })
);

// ============================================================================
// Cashfree Signed Webhook Router (Mounted with rawBody preservation)
// ============================================================================
export const webhooksRouter = Router();

webhooksRouter.post(
  '/cashfree',
  asyncHandler(async (req, res) => {
    const timestamp = req.header('x-webhook-timestamp') || '';
    const signature = req.header('x-webhook-signature') || '';
    const rawBody = (req as Request & { rawBody?: string }).rawBody || JSON.stringify(req.body);

    if (!verifyCashfreeWebhookSignature(timestamp, rawBody, signature)) {
      await recordAuditEvent({
        req,
        actor: { email: 'cashfree-webhook', name: 'Cashfree Webhook', role: 'EXTERNAL' },
        action: 'Rejected invalid Cashfree webhook signature',
        category: 'finance',
        resourceType: 'Webhook',
        resourceId: 'cashfree',
        outcome: 'denied'
      });
      throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Invalid webhook signature');
    }

    const orderId = req.body?.data?.order?.order_id;
    const cfPaymentId = req.body?.data?.payment?.cf_payment_id;
    const paymentStatus = req.body?.data?.payment?.payment_status;

    if (!orderId) {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Missing order_id in webhook payload');
    }

    const payment = await PaymentTransaction.findOne({ orderId });
    if (!payment) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Payment order not found');
    }

    if (payment.status === 'paid') {
      sendSuccess(req, res, { received: true, idempotentDuplicate: true });
      return;
    }

    if (paymentStatus === 'SUCCESS') {
      payment.status = 'paid';
      payment.gatewayPaymentId = String(cfPaymentId || '');
      payment.webhookVerified = true;
      payment.settledAt = new Date();
      await payment.save();
      await applySettledPaymentToInvoiceAndStudent(payment, String(payment.recordedByUserId));
    } else if (paymentStatus === 'FAILED') {
      payment.status = 'failed';
      await payment.save();
    }

    sendSuccess(req, res, { received: true, status: payment.status });
  })
);

