import mongoose, { Schema } from 'mongoose';

const feePlanSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    name: { type: String, required: true },
    programCode: { type: String, required: true, uppercase: true },
    semesterNumber: { type: Number, required: true, min: 1, max: 12 },
    tuitionInr: { type: Number, required: true, min: 0 },
    examFeeInr: { type: Number, default: 2500, min: 0 },
    developmentFeeInr: { type: Number, default: 10000, min: 0 },
    hostelFeeInr: { type: Number, default: 0, min: 0 },
    installmentsAllowed: { type: Number, default: 2, min: 1, max: 6 },
    lateFeePerDayInr: { type: Number, default: 50, min: 0 },
    active: { type: Boolean, default: true }
  },
  { timestamps: true, versionKey: false }
);
export const FeePlan = mongoose.model('FeePlan', feePlanSchema);

const invoiceSchema = new Schema(
  {
    invoiceNo: { type: String, required: true, unique: true, uppercase: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    studentName: { type: String, required: true },
    rollNumber: { type: String, required: true },
    academicYear: { type: String, required: true },
    semesterLabel: { type: String, required: true },
    feeHead: { type: String, required: true },
    grossAmountInr: { type: Number, required: true, min: 0 },
    concessionInr: { type: Number, default: 0, min: 0 },
    netAmountInr: { type: Number, required: true, min: 0 },
    paidAmountInr: { type: Number, default: 0, min: 0 },
    dueAmountInr: { type: Number, required: true, min: 0 },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Partial', 'Paid', 'Overdue', 'Voided'],
      default: 'Pending'
    }
  },
  { timestamps: true, versionKey: false }
);
invoiceSchema.index({ studentId: 1, status: 1 });
export const Invoice = mongoose.model('Invoice', invoiceSchema);

const paymentTransactionSchema = new Schema(
  {
    receiptNo: { type: String, required: true, unique: true, uppercase: true },
    orderId: { type: String, required: true, unique: true },
    idempotencyKey: { type: String, required: true, unique: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    studentName: { type: String, required: true },
    rollNumber: { type: String, required: true },
    feeHead: { type: String, required: true },
    amountInr: { type: Number, required: true, min: 1 },
    channel: {
      type: String,
      enum: ['cashfree', 'offline_cash', 'offline_challan', 'offline_neft', 'offline_upi'],
      required: true
    },
    status: {
      type: String,
      enum: ['initiated', 'paid', 'failed', 'refunded'],
      default: 'initiated'
    },
    gatewayOrderId: { type: String, default: '' },
    gatewayPaymentId: { type: String, default: '' },
    gatewaySessionId: { type: String, default: '' },
    webhookVerified: { type: Boolean, default: false },
    referenceCode: { type: String, default: '' },
    settledAt: { type: Date, default: null },
    recordedByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true, versionKey: false }
);
paymentTransactionSchema.index({ studentId: 1, createdAt: -1 });
paymentTransactionSchema.index({ status: 1, createdAt: -1 });
export const PaymentTransaction = mongoose.model('PaymentTransaction', paymentTransactionSchema);

const refundRequestSchema = new Schema(
  {
    refundNo: { type: String, required: true, unique: true },
    paymentId: { type: Schema.Types.ObjectId, ref: 'PaymentTransaction', required: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    amountInr: { type: Number, required: true, min: 1 },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending_approval', 'approved', 'rejected', 'processed'],
      default: 'pending_approval'
    },
    preparedByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approvedByUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    remarks: { type: String, default: '' },
    processedAt: { type: Date, default: null }
  },
  { timestamps: true, versionKey: false }
);
export const RefundRequest = mongoose.model('RefundRequest', refundRequestSchema);

const ledgerAccountSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    name: { type: String, required: true },
    accountType: { type: String, enum: ['Asset', 'Liability', 'Income', 'Expense'], required: true },
    gstApplicable: { type: Boolean, default: false },
    tdsSection: { type: String, default: '' },
    active: { type: Boolean, default: true }
  },
  { timestamps: true, versionKey: false }
);
export const LedgerAccount = mongoose.model('LedgerAccount', ledgerAccountSchema);

const ledgerEntrySchema = new Schema(
  {
    voucherNo: { type: String, required: true, unique: true, uppercase: true },
    voucherType: {
      type: String,
      enum: ['Receipt', 'Payment', 'Journal', 'Reversal', 'Payroll'],
      required: true
    },
    description: { type: String, required: true },
    costCentre: { type: String, default: 'GENERAL' },
    referenceType: { type: String, default: '' },
    referenceId: { type: String, default: '' },
    reversesEntryId: { type: Schema.Types.ObjectId, ref: 'LedgerEntry', default: null },
    lines: [
      {
        _id: false,
        accountCode: { type: String, required: true },
        accountName: { type: String, required: true },
        debitInr: { type: Number, required: true, min: 0 },
        creditInr: { type: Number, required: true, min: 0 }
      }
    ],
    totalDebitInr: { type: Number, required: true },
    totalCreditInr: { type: Number, required: true },
    postedByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    postedAt: { type: Date, default: () => new Date() }
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
);

ledgerEntrySchema.pre('validate', function (next) {
  const sumDebit = this.lines.reduce((s, l) => s + Number(l.debitInr || 0), 0);
  const sumCredit = this.lines.reduce((s, l) => s + Number(l.creditInr || 0), 0);
  this.totalDebitInr = Number(sumDebit.toFixed(2));
  this.totalCreditInr = Number(sumCredit.toFixed(2));
  if (this.lines.length < 2 || this.totalDebitInr <= 0 || this.totalDebitInr !== this.totalCreditInr) {
    next(new Error(`Unbalanced double-entry voucher: debit=${this.totalDebitInr}, credit=${this.totalCreditInr}`));
    return;
  }
  next();
});

const blockFinancialOverwrite = function (this: unknown, next: (err?: Error) => void) {
  next(new Error('Financial LedgerEntry records are strictly append-only. Post a Reversal entry instead.'));
};
ledgerEntrySchema.pre('updateOne', blockFinancialOverwrite);
ledgerEntrySchema.pre('updateMany', blockFinancialOverwrite);
ledgerEntrySchema.pre('findOneAndUpdate', blockFinancialOverwrite);
ledgerEntrySchema.pre('deleteOne', blockFinancialOverwrite);
ledgerEntrySchema.pre('deleteMany', blockFinancialOverwrite);
ledgerEntrySchema.pre('findOneAndDelete', blockFinancialOverwrite);

export const LedgerEntry = mongoose.model('LedgerEntry', ledgerEntrySchema);

