import mongoose, { Schema } from 'mongoose';
import { ERROR_CODES } from '@cas-erp/shared';
import { AppError } from './errors.js';

export interface IApprovalStep {
  order: number;
  name: string;
  allowedRoleKeys: string[];
  preventSelfApproval: boolean;
}

export interface IApprovalWorkflow {
  domain: 'admissions' | 'leave' | 'marks' | 'refunds' | 'procurement' | 'certificates';
  version: number;
  name: string;
  active: boolean;
  steps: IApprovalStep[];
  updatedBy?: mongoose.Types.ObjectId;
}

const approvalWorkflowSchema = new Schema<IApprovalWorkflow>(
  {
    domain: {
      type: String,
      required: true,
      enum: ['admissions', 'leave', 'marks', 'refunds', 'procurement', 'certificates']
    },
    version: { type: Number, required: true, default: 1 },
    name: { type: String, required: true },
    active: { type: Boolean, default: true },
    steps: [
      {
        _id: false,
        order: { type: Number, required: true },
        name: { type: String, required: true },
        allowedRoleKeys: { type: [String], required: true },
        preventSelfApproval: { type: Boolean, default: true }
      }
    ],
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true, versionKey: false }
);

approvalWorkflowSchema.index({ domain: 1, version: -1 });
approvalWorkflowSchema.index({ domain: 1, active: 1 });
export const ApprovalWorkflow = mongoose.model<IApprovalWorkflow>(
  'ApprovalWorkflow',
  approvalWorkflowSchema
);

export const DEFAULT_WORKFLOWS: IApprovalWorkflow[] = [
  {
    domain: 'admissions',
    version: 1,
    name: 'Standard Admission Approval Chain',
    active: true,
    steps: [
      { order: 1, name: 'Document Verification', allowedRoleKeys: ['ADMISSION_OFFICER', 'COLLEGE_ADMIN'], preventSelfApproval: true },
      { order: 2, name: 'Final Seat Approval', allowedRoleKeys: ['PRINCIPAL', 'COLLEGE_ADMIN'], preventSelfApproval: true }
    ]
  },
  {
    domain: 'leave',
    version: 1,
    name: 'Department & Principal Leave Chain',
    active: true,
    steps: [
      { order: 1, name: 'HOD / Warden Review', allowedRoleKeys: ['HOD', 'HOSTEL_WARDEN', 'COLLEGE_ADMIN'], preventSelfApproval: true },
      { order: 2, name: 'Final Approver', allowedRoleKeys: ['PRINCIPAL', 'COLLEGE_ADMIN', 'HOD'], preventSelfApproval: true }
    ]
  },
  {
    domain: 'marks',
    version: 1,
    name: 'Exam Marks Moderation & Publication',
    active: true,
    steps: [
      { order: 1, name: 'Department Verification', allowedRoleKeys: ['HOD', 'EXAM_CONTROLLER'], preventSelfApproval: true },
      { order: 2, name: 'Controller Result Publication', allowedRoleKeys: ['EXAM_CONTROLLER', 'PRINCIPAL'], preventSelfApproval: true }
    ]
  },
  {
    domain: 'refunds',
    version: 1,
    name: 'Dual-Control Finance Refund Approval',
    active: true,
    steps: [
      { order: 1, name: 'Independent Finance Approval', allowedRoleKeys: ['PRINCIPAL', 'COLLEGE_ADMIN'], preventSelfApproval: true }
    ]
  },
  {
    domain: 'procurement',
    version: 1,
    name: 'Procurement Budget & Purchase Approval',
    active: true,
    steps: [
      { order: 1, name: 'Budget Owner Review', allowedRoleKeys: ['ACCOUNTANT', 'HOD'], preventSelfApproval: true },
      { order: 2, name: 'Purchase Approver', allowedRoleKeys: ['PRINCIPAL', 'COLLEGE_ADMIN'], preventSelfApproval: true }
    ]
  },
  {
    domain: 'certificates',
    version: 1,
    name: 'Certificate Verification & Signing',
    active: true,
    steps: [
      { order: 1, name: 'Record Verification', allowedRoleKeys: ['COLLEGE_ADMIN', 'EXAM_CONTROLLER'], preventSelfApproval: true },
      { order: 2, name: 'Authorized Digital Sign-off', allowedRoleKeys: ['PRINCIPAL', 'EXAM_CONTROLLER'], preventSelfApproval: true }
    ]
  }
];

export async function assertWorkflowStepAuthority(
  domain: IApprovalWorkflow['domain'],
  stepOrder: number,
  actorUserId: string,
  actorRole: string,
  requesterUserId?: string | null
): Promise<void> {
  const workflow = await ApprovalWorkflow.findOne({ domain, active: true }).sort({ version: -1 }).lean();
  const step = workflow?.steps.find((s) => s.order === stepOrder);
  if (step) {
    if (!step.allowedRoleKeys.includes(actorRole)) {
      throw new AppError(
        403,
        ERROR_CODES.FORBIDDEN,
        `Role ${actorRole} is not authorized for ${domain} workflow step "${step.name}"`
      );
    }
    if (step.preventSelfApproval && requesterUserId && String(requesterUserId) === String(actorUserId)) {
      throw new AppError(
        403,
        ERROR_CODES.FORBIDDEN,
        'Segregation of duties violation: self-approval is not permitted for this workflow step'
      );
    }
  }
}

