import { fileURLToPath } from 'node:url';
import { DEFAULT_ROLE_TEMPLATES } from '@cas-erp/shared';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { env } from '../config/env.js';
import { hashPassword, sha256Hex } from '../core/crypto.js';
import { ApprovalWorkflow, DEFAULT_WORKFLOWS } from '../core/workflow.js';
import { Employee, GuardianLink, Student, TimetableSlot } from '../modules/academics/models.js';
import { Applicant, CmsPage } from '../modules/admissions/models.js';
import { AttendanceEvent } from '../modules/attendance/models.js';
import {
  AlumniProfile,
  BedAllocation,
  CampusEvent,
  CertificateRecord,
  CirculationRecord,
  DocumentRecord,
  GrievanceTicket,
  Hostel,
  InventoryAsset,
  LibraryItem,
  PlacementDrive,
  ProcurementRequest,
  ResearchProject,
  SafetyIncident,
  VisitorLog
} from '../modules/campus/models.js';
import {
  AssignmentSubmission,
  ExamMark,
  ExamSchedule,
  LmsMaterial,
  PublishedResult
} from '../modules/exams/models.js';
import {
  FeePlan,
  Invoice,
  LedgerAccount,
  LedgerEntry,
  PaymentTransaction,
  RefundRequest
} from '../modules/finance/models.js';
import { HolidayCalendar, LeaveRequest, PayrollRun } from '../modules/hr/models.js';
import { RoleAssignment, RoleTemplate, User } from '../modules/identity/models.js';
import { Announcement, Notification } from '../modules/notifications/models.js';
import { CAS_OFFICIAL_FACULTY } from './casFacultyData.js';
import {
  AcademicSession,
  Department,
  InstitutionSettings,
  Program,
  Subject
} from '../modules/org/models.js';

const DEV_SYNTHETIC_PASSWORD = 'CasErp@2026!';

export async function ensureBaselineSeed(): Promise<void> {
  // Always ensure all 12 configurable RoleTemplates and 6 Workflows exist
  for (const tpl of DEFAULT_ROLE_TEMPLATES) {
    await RoleTemplate.updateOne(
      { key: tpl.key },
      { $set: { name: tpl.name, nameHi: tpl.nameHi, description: tpl.description, permissions: tpl.permissions } },
      { upsert: true }
    );
  }
  for (const wf of DEFAULT_WORKFLOWS) {
    await ApprovalWorkflow.updateOne(
      { domain: wf.domain, version: wf.version },
      { $set: { name: wf.name, steps: wf.steps, active: wf.active } },
      { upsert: true }
    );
  }

  const userCount = await User.countDocuments();
  if (userCount > 0) return;

  await seedFullSyntheticDataset();
}

export async function seedFullSyntheticDataset(): Promise<void> {
  await InstitutionSettings.updateOne(
    { singletonKey: 'CAS_PRIMARY' },
    {
      $setOnInsert: {
        singletonKey: 'CAS_PRIMARY',
        institutionName: 'Centre for Advanced Studies',
        institutionNameHi: 'सेंटर फॉर एडवांस्ड स्टडीज',
        affiliation: 'Dr. A.P.J. Abdul Kalam Technical University (AKTU), Lucknow',
        campusAddress: 'AKTU Main Campus, Sec-11, Jankipuram, Vistar Yojna, Lucknow, Uttar Pradesh - 226031',
        domain: 'cas.res.in',
        activeAcademicYear: '2026 - 2027',
        activeSemesterLabel: 'Odd Semester 2026-27',
        regulatoryCode: 'AKTU-CAS-LKO-2017',
        treasuryEmail: 'accounts@cas.res.in',
        attendanceShortageThresholdPct: 75
      }
    },
    { upsert: true }
  );

  // Official Departments verified from cas.res.in
  const deptSeeds = [
    { code: 'CSE', name: 'Computer Science & Engineering', nameHi: 'कंप्यूटर विज्ञान एवं अभियांत्रिकी', hodName: 'Dr. Anuj Kumar Sharma (Dean Academics)', annualBudgetInr: 22000000, isSyntheticPlaceholder: false },
    { code: 'MECHA', name: 'Mechatronics', nameHi: 'मेकाट्रॉनिक्स', hodName: 'Dr. Anuj Kumar Sharma', annualBudgetInr: 18000000, isSyntheticPlaceholder: false },
    { code: 'NANO', name: 'Nanotechnology', nameHi: 'नैनोटेक्नोलॉजी', hodName: 'Dr. Saurabh Mishra', annualBudgetInr: 16500000, isSyntheticPlaceholder: false },
    { code: 'EST', name: 'Energy Science & Technology', nameHi: 'ऊर्जा विज्ञान एवं प्रौद्योगिकी', hodName: 'Dr. Biswajit Mandal', annualBudgetInr: 15000000, isSyntheticPlaceholder: false },
    { code: 'MTA', name: 'Manufacturing Technology & Automation', nameHi: 'विनिर्माण प्रौद्योगिकी एवं स्वचालन', hodName: 'Dr. Siddharth Yadav', annualBudgetInr: 14000000, isSyntheticPlaceholder: false },
    { code: 'BTECH', name: 'Undergraduate Studies (B.Tech)', nameHi: 'स्नातक अध्ययन (बी.टेक)', hodName: 'Dr. Vibhu Kumar Tripathi', annualBudgetInr: 25000000, isSyntheticPlaceholder: false }
  ];

  const depts: Record<string, InstanceType<typeof Department>> = {};
  for (const d of deptSeeds) {
    depts[d.code] = await Department.findOneAndUpdate(
      { code: d.code },
      { $set: d },
      { upsert: true, new: true }
    );
  }

  await AcademicSession.updateOne(
    { code: 'AY-2026-27' },
    {
      $setOnInsert: {
        code: 'AY-2026-27',
        label: 'Academic Session 2026 - 2027',
        startDate: new Date('2026-07-15T00:00:00Z'),
        endDate: new Date('2027-06-30T00:00:00Z'),
        active: true
      }
    },
    { upsert: true }
  );

  // Official Academic Programs verified from cas.res.in
  const programSeeds = [
    { code: 'MTECH-CSE', name: 'M.Tech. in Computer Science and Engineering', programType: 'PG' as const, departmentId: depts.CSE._id, durationSemesters: 4, totalCredits: 80 },
    { code: 'MTECH-MECHA', name: 'M.Tech. in Mechatronics', programType: 'PG' as const, departmentId: depts.MECHA._id, durationSemesters: 4, totalCredits: 80 },
    { code: 'MTECH-NANO', name: 'M.Tech. in Nanotechnology', programType: 'PG' as const, departmentId: depts.NANO._id, durationSemesters: 4, totalCredits: 80 },
    { code: 'MTECH-EST', name: 'M.Tech. in Energy Science & Technology', programType: 'PG' as const, departmentId: depts.EST._id, durationSemesters: 4, totalCredits: 80 },
    { code: 'MTECH-MTA', name: 'M.Tech. in Manufacturing Technology & Automation', programType: 'PG' as const, departmentId: depts.MTA._id, durationSemesters: 4, totalCredits: 80 },
    { code: 'BTECH-CSE', name: 'B.Tech. in Computer Science & Engineering', programType: 'UG' as const, departmentId: depts.BTECH._id, durationSemesters: 8, totalCredits: 160 },
    { code: 'PHD-ENGG', name: 'Doctor of Philosophy (Ph.D.) in Engineering & Technology', programType: 'PhD' as const, departmentId: depts.CSE._id, durationSemesters: 6, totalCredits: 24 }
  ];

  for (const prog of programSeeds) {
    await Program.findOneAndUpdate(
      { code: prog.code },
      { $set: prog },
      { upsert: true, new: true }
    );
  }

  const subjectSeeds = [
    { code: 'CS-501', name: 'Design & Analysis of Algorithms', nameHi: 'एल्गोरिदम का डिजाइन एवं विश्लेषण', departmentId: depts.CSE._id, semesterNumber: 1, credits: 4, syllabusProgressPct: 75, facultyName: 'Dr. Anuj Kumar Sharma' },
    { code: 'CS-502', name: 'Machine Learning & Pattern Recognition (NVIDIA DGX-2 Lab)', nameHi: 'मशीन लर्निंग और पैटर्न पहचान', departmentId: depts.CSE._id, semesterNumber: 1, credits: 4, syllabusProgressPct: 70, facultyName: 'Dr. Vibhu Kumar Tripathi' },
    { code: 'MC-501', name: 'Robotics, Sensors & Actuators', nameHi: 'रोबोटिक्स, सेंसर और एक्चुएटर', departmentId: depts.MECHA._id, semesterNumber: 1, credits: 4, syllabusProgressPct: 68, facultyName: 'Dr. Anuj Kumar Sharma' },
    { code: 'NT-501', name: 'Synthesis & Characterization of Nanomaterials', nameHi: 'नैनोपदार्थों का संश्लेषण एवं लक्षण वर्णन', departmentId: depts.NANO._id, semesterNumber: 1, credits: 4, syllabusProgressPct: 65, facultyName: 'Dr. Saurabh Mishra' },
    { code: 'ES-501', name: 'Renewable Energy Systems & Energy Audit', nameHi: 'नवीकरणीय ऊर्जा प्रणालियाँ', departmentId: depts.EST._id, semesterNumber: 1, credits: 4, syllabusProgressPct: 72, facultyName: 'Dr. Biswajit Mandal' }
  ];
  for (const s of subjectSeeds) {
    await Subject.updateOne({ code: s.code }, { $set: s }, { upsert: true });
  }

  // Create users covering all 12 PRD roles with official CAS leadership names
  const passwordHash = await hashPassword(DEV_SYNTHETIC_PASSWORD);
  const roleUsers = [
    { email: 'superadmin@cas.res.in', name: 'Vikramaditya Dave (Super Admin)', roleKey: 'SUPER_ADMIN' },
    { email: 'principal@cas.res.in', name: 'Prof. S. P. Shukla (Director, CAS AKTU)', roleKey: 'PRINCIPAL' },
    { email: 'admin@cas.res.in', name: 'Dr. R. K. Tiwari (College Admin)', roleKey: 'COLLEGE_ADMIN' },
    { email: 'hod.cse@cas.res.in', name: 'Dr. Anuj Kumar Sharma (Dean Academics & HOD)', roleKey: 'HOD', deptId: depts.CSE._id },
    { email: 'faculty@cas.res.in', name: 'Dr. Saurabh Mishra (Assistant Professor)', roleKey: 'FACULTY', deptId: depts.NANO._id },
    { email: 'student@cas.res.in', name: 'Aarav Sharma', roleKey: 'STUDENT', deptId: depts.CSE._id },
    { email: 'parent@cas.res.in', name: 'Manoj Sharma (Guardian)', roleKey: 'PARENT' },
    { email: 'accounts@cas.res.in', name: 'R. Sharma (Accountant)', roleKey: 'ACCOUNTANT' },
    { email: 'admissions@cas.res.in', name: 'Neha Verma (Admission Officer)', roleKey: 'ADMISSION_OFFICER' },
    { email: 'exam@cas.res.in', name: 'Dr. P. Mishra (Exam Controller)', roleKey: 'EXAM_CONTROLLER' },
    { email: 'library@cas.res.in', name: 'S. Kulkarni (Librarian)', roleKey: 'LIBRARIAN' },
    { email: 'warden@cas.res.in', name: 'A. Chauhan (Hostel Warden)', roleKey: 'HOSTEL_WARDEN' }
  ];

  const userMap: Record<string, InstanceType<typeof User>> = {};
  for (const ru of roleUsers) {
    const user = await User.findOneAndUpdate(
      { email: ru.email },
      {
        $setOnInsert: {
          email: ru.email,
          name: ru.name,
          passwordHash,
          status: 'active',
          preferences: { theme: 'light', accentColor: '#3587A4', language: 'en' }
        }
      },
      { upsert: true, new: true }
    );
    userMap[ru.roleKey] = user;

    await RoleAssignment.updateOne(
      { userId: user._id, roleKey: ru.roleKey },
      {
        $setOnInsert: {
          userId: user._id,
          roleKey: ru.roleKey,
          scope: {
            departmentIds: ru.deptId ? [ru.deptId] : [],
            programIds: [],
            subjectIds: [],
            hostelIds: []
          },
          isPrimary: true,
          active: true
        }
      },
      { upsert: true }
    );
  }

  // Synthetic Students
  const stu1 = await Student.findOneAndUpdate(
    { rollNumber: '23BCE1042' },
    {
      $setOnInsert: {
        studentCode: 'STU-2026-0001',
        rollNumber: '23BCE1042',
        userId: userMap.STUDENT._id,
        name: 'Aarav Sharma',
        email: 'student@cas.res.in',
        phone: '+91 98765 43210',
        departmentId: depts.CSE._id,
        deptCode: 'CSE',
        programCode: 'MTECH-CSE',
        semesterNumber: 5,
        batch: '2023 - 2027',
        section: 'A',
        cgpa: 9.42,
        attendancePct: 92,
        status: 'Active',
        enrolledSubjectCodes: ['CS-501', 'AI-501'],
        guardianSummary: { name: 'Manoj Sharma', relation: 'Father', phone: '+91 98765 11223' },
        totalFeeAssessedInr: 165000,
        paidFeeInr: 120000,
        dueFeeInr: 45000,
        feeStatus: 'Partial',
        isSyntheticPlaceholder: true
      }
    },
    { upsert: true, new: true }
  );

  await User.findByIdAndUpdate(userMap.STUDENT._id, { $set: { linkedStudentId: stu1._id } });

  await Student.findOneAndUpdate(
    { rollNumber: '23BAI1088' },
    {
      $setOnInsert: {
        studentCode: 'STU-2026-0002',
        rollNumber: '23BAI1088',
        name: 'Ananya Iyer',
        email: 'ananya.iyer@cas.res.in',
        phone: '+91 98451 23456',
        departmentId: depts.CSE._id,
        deptCode: 'CSE',
        programCode: 'MTECH-CSE',
        semesterNumber: 5,
        batch: '2023 - 2027',
        section: 'A',
        cgpa: 9.65,
        attendancePct: 71, // below 75% to demonstrate defaulter alerts cleanly
        status: 'Active',
        enrolledSubjectCodes: ['AI-501', 'CS-501'],
        totalFeeAssessedInr: 175000,
        paidFeeInr: 175000,
        dueFeeInr: 0,
        feeStatus: 'Paid',
        isSyntheticPlaceholder: true
      }
    },
    { upsert: true, new: true }
  );

  // Verified Guardian Link for Parent Portal
  await GuardianLink.updateOne(
    { guardianUserId: userMap.PARENT._id, studentId: stu1._id },
    {
      $setOnInsert: {
        guardianUserId: userMap.PARENT._id,
        studentId: stu1._id,
        relationship: 'Father',
        verificationStatus: 'verified',
        verifiedByUserId: userMap.COLLEGE_ADMIN._id,
        verifiedAt: new Date()
      }
    },
    { upsert: true }
  );

  // Synthetic Employees
  const empFac = await Employee.findOneAndUpdate(
    { employeeCode: 'EMP-2026-0001' },
    {
      $setOnInsert: {
        employeeCode: 'EMP-2026-0001',
        userId: userMap.FACULTY._id,
        name: 'Dr. Saurabh Mishra',
        email: 'faculty@cas.res.in',
        phone: '+91 98111 22334',
        employeeType: 'Faculty',
        departmentId: depts.NANO._id,
        deptCode: 'NANO',
        designation: 'Assistant Professor',
        qualification: 'Ph.D (IIT ISM Dhanbad)',
        specialization: 'Nanotechnology & Nanomaterials',
        publicationsCount: 24,
        baseSalaryInr: 110000,
        hraInr: 22000,
        daInr: 15000,
        deductionsInr: 12000,
        isSyntheticPlaceholder: true
      }
    },
    { upsert: true, new: true }
  );
  await User.findByIdAndUpdate(userMap.FACULTY._id, { $set: { linkedEmployeeId: empFac._id } });

  // Timetable Slots
  await TimetableSlot.updateOne(
    { dayOfWeek: 'Monday', slotTime: '09:30 AM - 11:00 AM', room: 'Seminar Hall A' },
    {
      $setOnInsert: {
        semesterNumber: 5,
        batch: '2023 - 2027',
        section: 'A',
        dayOfWeek: 'Monday',
        slotTime: '09:30 AM - 11:00 AM',
        subjectCode: 'CS-501',
        subjectName: 'Design & Analysis of Algorithms',
        room: 'Seminar Hall A',
        departmentId: depts.CSE._id,
        facultyName: 'Dr. Rajesh Ramanathan'
      }
    },
    { upsert: true }
  );

  // Finance Seed: Accounts, FeePlan, Invoice, Settled Payment + Balanced Ledger
  const ledgerAccounts = [
    { code: '1001', name: 'Cash in Hand', accountType: 'Asset' },
    { code: '1002', name: 'Bank / Gateway Clearing Account', accountType: 'Asset' },
    { code: '4001', name: 'Student Tuition & Academic Fee Income', accountType: 'Income' },
    { code: '5001', name: 'Staff Payroll Expense', accountType: 'Expense' }
  ];
  for (const acc of ledgerAccounts) {
    await LedgerAccount.updateOne({ code: acc.code }, { $setOnInsert: acc }, { upsert: true });
  }

  await FeePlan.updateOne(
    { code: 'FP-MTECH-Y1' },
    {
      $set: {
        code: 'FP-MTECH-Y1',
        name: 'M.Tech / Ph.D. First Year Fee Plan (Official CAS Structure)',
        programCode: 'MTECH-CSE',
        semesterNumber: 1,
        tuitionInr: 40100,
        examFeeInr: 10000,
        developmentFeeInr: 21200 // 19500 usage + 1700 other
      }
    },
    { upsert: true }
  );

  await FeePlan.updateOne(
    { code: 'FP-MTECH-Y2' },
    {
      $set: {
        code: 'FP-MTECH-Y2',
        name: 'M.Tech Second Year Fee Plan (Official CAS Structure)',
        programCode: 'MTECH-CSE',
        semesterNumber: 3,
        tuitionInr: 40100,
        examFeeInr: 10000,
        developmentFeeInr: 19500
      }
    },
    { upsert: true }
  );

  const inv1 = await Invoice.findOneAndUpdate(
    { invoiceNo: 'INV-2026-000001' },
    {
      $setOnInsert: {
        invoiceNo: 'INV-2026-000001',
        studentId: stu1._id,
        studentName: stu1.name,
        rollNumber: stu1.rollNumber,
        academicYear: '2026 - 2027',
        semesterLabel: 'Semester V',
        feeHead: 'Academic Tuition & Semester Fee',
        grossAmountInr: 165000,
        concessionInr: 0,
        netAmountInr: 165000,
        paidAmountInr: 120000,
        dueAmountInr: 45000,
        dueDate: new Date('2026-11-30T00:00:00Z'),
        status: 'Partial'
      }
    },
    { upsert: true, new: true }
  );

  await PaymentTransaction.updateOne(
    { receiptNo: 'REC-2026-100001' },
    {
      $setOnInsert: {
        receiptNo: 'REC-2026-100001',
        orderId: 'ORD-SEED-100001',
        idempotencyKey: 'SEED-TXN-100001',
        invoiceId: inv1._id,
        studentId: stu1._id,
        studentName: stu1.name,
        rollNumber: stu1.rollNumber,
        feeHead: 'Academic Tuition & Semester Fee',
        amountInr: 120000,
        channel: 'offline_neft',
        status: 'paid',
        referenceCode: 'NEFT-SBI-9001122',
        settledAt: new Date(),
        recordedByUserId: userMap.ACCOUNTANT._id
      }
    },
    { upsert: true }
  );

  const existingSeedVoucher = await LedgerEntry.exists({ voucherNo: 'VCH-SEED-0001' });
  if (!existingSeedVoucher) {
    await LedgerEntry.create({
      voucherNo: 'VCH-SEED-0001',
      voucherType: 'Receipt',
      description: 'Seed fee receipt REC-2026-100001 for Aarav Sharma (23BCE1042)',
      costCentre: 'ACADEMICS',
      referenceType: 'PaymentTransaction',
      referenceId: 'REC-2026-100001',
      lines: [
        { accountCode: '1002', accountName: 'Bank / Gateway Clearing Account', debitInr: 120000, creditInr: 0 },
        { accountCode: '4001', accountName: 'Student Tuition & Academic Fee Income', debitInr: 0, creditInr: 120000 }
      ],
      totalDebitInr: 120000,
      totalCreditInr: 120000,
      postedByUserId: userMap.ACCOUNTANT._id
    });
  }

  // Public CMS Pages, Holidays, Notices, Exam, Leave, Library, Hostel, Placement
  await CmsPage.updateOne(
    { slug: 'home' },
    {
      $setOnInsert: {
        slug: 'home',
        title: 'Centre for Advanced Studies — AKTU Lucknow',
        titleHi: 'सेंटर फॉर एडवांस्ड स्टडीज — एकेटीयू लखनऊ',
        summary: 'Official academic and administrative portal for Centre for Advanced Studies, Dr. A.P.J. Abdul Kalam Technical University, Lucknow.',
        summaryHi: 'डॉ. ए.पी.जे. अब्दुल कलाम प्राविधिक विश्वविद्यालय, लखनऊ के सेंटर फॉर एडवांस्ड स्टडीज का आधिकारिक शैक्षणिक एवं प्रशासनिक पोर्टल।',
        body: 'Welcome to the Centre for Advanced Studies (CAS), Jankipuram Extension, Lucknow. Prospective applicants may submit applications online and track verification status directly through this portal.',
        bodyHi: 'सेंटर फॉर एडवांस्ड स्टडीज (CAS), जानकीपुरम विस्तार, लखनऊ में आपका स्वागत है। भावी आवेदक ऑनलाइन आवेदन कर सकते हैं और अपनी स्थिति ट्रैक कर सकते हैं।',
        published: true,
        updatedByUserId: userMap.COLLEGE_ADMIN._id
      }
    },
    { upsert: true }
  );

  await Announcement.updateOne(
    { code: 'ANN-2026-001' },
    {
      $set: {
        code: 'ANN-2026-001',
        title: 'Counselling & Provisional Registration for M.Tech & B.Tech 2026-27',
        titleHi: 'शैक्षणिक सत्र 2026-27 एम.टेक एवं बी.टेक प्रवेश व पंजीकरण',
        content: 'Candidates allotted seats through AKTU/GATE counselling must submit required original certificates, deposit prescribed fees, and complete odd semester verification.',
        contentHi: 'एकेटीयू/गेट काउंसलिंग के माध्यम से सीट पाने वाले सभी छात्र अपने मूल प्रमाणपत्र जमा कर ऑड सेमेस्टर पंजीकरण पूर्ण करें।',
        category: 'Admissions & Academic Calendar',
        priority: 'High',
        isPublic: true,
        authorId: userMap.COLLEGE_ADMIN._id,
        authorName: userMap.COLLEGE_ADMIN.name
      }
    },
    { upsert: true }
  );

  await Announcement.updateOne(
    { code: 'ANN-2026-002' },
    {
      $set: {
        code: 'ANN-2026-002',
        title: 'Mandatory Minimum 75% Attendance Circular for B.Tech & M.Tech',
        titleHi: 'बी.टेक और एम.टेक छात्रों के लिए अनिवार्य 75% न्यूनतम उपस्थिति',
        content: 'Per AKTU academic regulations and CAS ordinance, minimum 75% lecture and lab attendance is mandatory to appear in end-semester examinations.',
        contentHi: 'एकेटीयू एवं सीएएस अध्यादेश के अनुसार अंतिम सेमेस्टर परीक्षा में बैठने के लिए न्यूनतम 75% उपस्थिति अनिवार्य है।',
        category: 'Academic Compliance',
        priority: 'High',
        isPublic: true,
        authorId: userMap.COLLEGE_ADMIN._id,
        authorName: userMap.COLLEGE_ADMIN.name
      }
    },
    { upsert: true }
  );

  await Announcement.updateOne(
    { code: 'ANN-2026-003' },
    {
      $set: {
        code: 'ANN-2026-003',
        title: 'NVIDIA DGX-2 High-Performance AI Lab Compute Allocation for PG & PhD Scholars',
        titleHi: 'एनवीडिया डीजीएक्स-2 आर्टिफिशियल इंटेलिजेंस लैब कम्प्यूट आवंटन',
        content: 'Postgraduate and doctoral scholars conducting research in deep learning, pattern recognition, and robotics may submit GPU job proposals for DGX-2 execution.',
        contentHi: 'डीप लर्निंग और रोबोटिक्स में शोध कर रहे छात्र डीजीएक्स-2 सुपरकंप्यूटिंग क्लस्टर पर उपयोग के लिए प्रस्ताव जमा करें।',
        category: 'Research & Labs',
        priority: 'Normal',
        isPublic: true,
        authorId: userMap.COLLEGE_ADMIN._id,
        authorName: userMap.COLLEGE_ADMIN.name
      }
    },
    { upsert: true }
  );

  await HolidayCalendar.updateOne(
    { date: '2026-01-26' },
    { $setOnInsert: { date: '2026-01-26', name: 'Republic Day', nameHi: 'गणतंत्र दिवस', type: 'Gazetted' } },
    { upsert: true }
  );

  await ExamSchedule.updateOne(
    { examCode: 'ENDSEM-CS501-2026' },
    {
      $setOnInsert: {
        examCode: 'ENDSEM-CS501-2026',
        title: 'Odd Semester End-Term Examination (CS-501)',
        academicYear: '2026 - 2027',
        semesterNumber: 5,
        subjectCode: 'CS-501',
        subjectName: 'Design & Analysis of Algorithms',
        departmentId: depts.CSE._id,
        examDate: '2026-12-14',
        slotTime: '10:00 AM - 01:00 PM',
        room: 'Exam Hall 101',
        invigilatorName: 'Dr. K. S. Venkatesh',
        state: 'marks_open'
      }
    },
    { upsert: true }
  );

  await LeaveRequest.updateOne(
    { requestNo: 'LV-2026-000001' },
    {
      $setOnInsert: {
        requestNo: 'LV-2026-000001',
        applicantType: 'student',
        applicantUserId: userMap.STUDENT._id,
        applicantName: stu1.name,
        applicantCode: stu1.rollNumber,
        studentId: stu1._id,
        departmentId: depts.CSE._id,
        deptCode: 'CSE',
        leaveType: 'MEDICAL',
        fromDate: '2026-11-15',
        toDate: '2026-11-16',
        days: 2,
        reason: 'Seasonal viral fever; medical slip submitted for review.',
        urgency: 'high',
        status: 'pending'
      }
    },
    { upsert: true }
  );

  await LibraryItem.updateOne(
    { barcode: 'LIB-CAS-0001' },
    {
      $setOnInsert: {
        isbn: '978-0262046305',
        barcode: 'LIB-CAS-0001',
        title: 'Introduction to Algorithms (4th Edition)',
        author: 'Cormen, Leiserson, Rivest, Stein',
        publisher: 'MIT Press',
        category: 'Computer Science',
        totalCopies: 10,
        availableCopies: 10
      }
    },
    { upsert: true }
  );

  await Hostel.updateOne(
    { code: 'HST-BOYS' },
    {
      $set: {
        code: 'HST-BOYS',
        name: "CAS Boy's Hostel (Single Seater, AKTU Campus)",
        genderPolicy: 'Boys',
        wardenUserId: userMap.HOSTEL_WARDEN._id,
        wardenName: userMap.HOSTEL_WARDEN.name,
        totalRooms: 75,
        totalBeds: 75,
        messMenuSummary: 'Student-managed mess | 24x7 CCTV & Security | High-speed Wi-Fi',
        monthlyFeeInr: 6500
      }
    },
    { upsert: true }
  );

  await Hostel.updateOne(
    { code: 'HST-GIRLS' },
    {
      $set: {
        code: 'HST-GIRLS',
        name: "CAS Girl's Hostel (Single Seater, AKTU Campus)",
        genderPolicy: 'Girls',
        wardenUserId: userMap.HOSTEL_WARDEN._id,
        wardenName: userMap.HOSTEL_WARDEN.name,
        totalRooms: 75,
        totalBeds: 75,
        messMenuSummary: 'Student-managed mess | 24x7 CCTV & Security | High-speed Wi-Fi',
        monthlyFeeInr: 6500
      }
    },
    { upsert: true }
  );

  await PlacementDrive.updateOne(
    { driveCode: 'DRV-2026-01' },
    {
      $setOnInsert: {
        driveCode: 'DRV-2026-01',
        companyName: 'Bharat Semiconductor Systems',
        roleTitle: 'Systems & Firmware Engineer',
        packageLpa: 12.5,
        minCgpa: 7.5,
        maxBacklogs: 0,
        driveDate: '2026-12-05',
        status: 'open'
      }
    },
    { upsert: true }
  );

  // ============================================================================
  // Expanded Multi-User Complete Dataset Across EVERY ERP Module (6+ Users/Module)
  // ============================================================================
  const extraSubjects = [
    { code: 'AI-501', name: 'Deep Learning & Computer Vision', nameHi: 'डीप लर्निंग एवं कंप्यूटर विज़न', departmentId: depts.CSE._id, semesterNumber: 3, credits: 4, syllabusProgressPct: 78, facultyName: 'Dr. Vibhu Kumar Tripathi' },
    { code: 'MT-501', name: 'Additive Manufacturing & CNC Automation', nameHi: 'एडिटिव मैन्युफैक्चरिंग एवं सीएनसी', departmentId: depts.MTA._id, semesterNumber: 1, credits: 4, syllabusProgressPct: 71, facultyName: 'Dr. Siddharth Yadav' },
    { code: 'MC-502', name: 'Embedded Control Systems & Actuation', nameHi: 'एम्बेडेड कंट्रोल सिस्टम्स', departmentId: depts.MECHA._id, semesterNumber: 3, credits: 4, syllabusProgressPct: 69, facultyName: 'Dr. Pooja Srivastava' }
  ];
  for (const s of extraSubjects) {
    await Subject.updateOne({ code: s.code }, { $set: s }, { upsert: true });
  }

  // 1. Additional Student Users (Total 6 distinct student accounts with full dossiers + linked parents)
  const additionalStudents = [
    {
      email: 'ananya.iyer@cas.res.in',
      name: 'Ananya Iyer',
      phone: '+91 98451 23456',
      studentCode: 'STU-2026-0002',
      rollNumber: '23BAI1088',
      deptCode: 'CSE',
      programCode: 'MTECH-CSE',
      semesterNumber: 5,
      batch: '2023 - 2027',
      cgpa: 9.65,
      attendancePct: 71,
      subjects: ['CS-501', 'AI-501', 'CS-502'],
      parentEmail: 'parent.ananya@cas.res.in',
      parentName: 'Suresh Iyer',
      parentPhone: '+91 98451 11002',
      relation: 'Father',
      totalFee: 175000,
      paidFee: 175000,
      feeStatus: 'Paid',
      hostelCode: 'HST-GIRLS',
      roomNo: 'G-104'
    },
    {
      email: 'rohan.verma@cas.res.in',
      name: 'Rohan Verma',
      phone: '+91 98390 45120',
      studentCode: 'STU-2026-0103',
      rollNumber: '24MCH2011',
      deptCode: 'MECHA',
      programCode: 'MTECH-MECHA',
      semesterNumber: 3,
      batch: '2024 - 2026',
      cgpa: 8.94,
      attendancePct: 86,
      subjects: ['MC-501', 'MC-502'],
      parentEmail: 'parent.rohan@cas.res.in',
      parentName: 'Rajesh Verma',
      parentPhone: '+91 98390 11003',
      relation: 'Father',
      totalFee: 76300,
      paidFee: 50000,
      feeStatus: 'Partial',
      hostelCode: 'HST-BOYS',
      roomNo: 'B-205'
    },
    {
      email: 'priya.singh@cas.res.in',
      name: 'Priya Singh',
      phone: '+91 99192 67810',
      studentCode: 'STU-2026-0104',
      rollNumber: '24NAN2025',
      deptCode: 'NANO',
      programCode: 'MTECH-NANO',
      semesterNumber: 3,
      batch: '2024 - 2026',
      cgpa: 9.18,
      attendancePct: 89,
      subjects: ['NT-501', 'CS-502'],
      parentEmail: 'parent.priya@cas.res.in',
      parentName: 'Sunita Singh',
      parentPhone: '+91 99192 11004',
      relation: 'Mother',
      totalFee: 76300,
      paidFee: 76300,
      feeStatus: 'Paid',
      hostelCode: 'HST-GIRLS',
      roomNo: 'G-208'
    },
    {
      email: 'kabir.mishra@cas.res.in',
      name: 'Kabir Mishra',
      phone: '+91 97940 33412',
      studentCode: 'STU-2026-0105',
      rollNumber: '25EST3009',
      deptCode: 'EST',
      programCode: 'MTECH-EST',
      semesterNumber: 1,
      batch: '2025 - 2027',
      cgpa: 8.75,
      attendancePct: 78,
      subjects: ['ES-501', 'CS-501'],
      parentEmail: 'parent.kabir@cas.res.in',
      parentName: 'Deepak Mishra',
      parentPhone: '+91 97940 11005',
      relation: 'Father',
      totalFee: 76300,
      paidFee: 38000,
      feeStatus: 'Partial',
      hostelCode: 'HST-BOYS',
      roomNo: 'B-112'
    },
    {
      email: 'meera.pandey@cas.res.in',
      name: 'Meera Pandey',
      phone: '+91 96215 88901',
      studentCode: 'STU-2026-0106',
      rollNumber: '25MTA3014',
      deptCode: 'MTA',
      programCode: 'MTECH-MTA',
      semesterNumber: 1,
      batch: '2025 - 2027',
      cgpa: 9.05,
      attendancePct: 94,
      subjects: ['MT-501', 'MC-501'],
      parentEmail: 'parent.meera@cas.res.in',
      parentName: 'Alok Pandey',
      parentPhone: '+91 96215 11006',
      relation: 'Father',
      totalFee: 76300,
      paidFee: 76300,
      feeStatus: 'Paid',
      hostelCode: 'HST-GIRLS',
      roomNo: 'G-302'
    }
  ];

  const allStudents: Array<{ student: InstanceType<typeof Student>; user: InstanceType<typeof User>; hostelCode: string; roomNo: string }> = [
    { student: stu1, user: userMap.STUDENT, hostelCode: 'HST-BOYS', roomNo: 'B-101' }
  ];

  for (const s of additionalStudents) {
    const dept = depts[s.deptCode] || depts.CSE;
    const stuUser = await User.findOneAndUpdate(
      { email: s.email },
      {
        $setOnInsert: {
          email: s.email,
          name: s.name,
          phone: s.phone,
          passwordHash,
          status: 'active',
          preferences: { theme: 'light', accentColor: '#3587A4', language: 'en' }
        }
      },
      { upsert: true, new: true }
    );
    await RoleAssignment.updateOne(
      { userId: stuUser._id, roleKey: 'STUDENT' },
      {
        $setOnInsert: {
          userId: stuUser._id,
          roleKey: 'STUDENT',
          scope: { departmentIds: [dept._id], programIds: [], subjectIds: [], hostelIds: [] },
          isPrimary: true,
          active: true
        }
      },
      { upsert: true }
    );

    const stuDoc = await Student.findOneAndUpdate(
      { rollNumber: s.rollNumber },
      {
        $set: {
          userId: stuUser._id,
          guardianSummary: { name: s.parentName, relation: s.relation, phone: s.parentPhone }
        },
        $setOnInsert: {
          studentCode: s.studentCode,
          rollNumber: s.rollNumber,
          name: s.name,
          email: s.email,
          phone: s.phone,
          departmentId: dept._id,
          deptCode: s.deptCode,
          programCode: s.programCode,
          semesterNumber: s.semesterNumber,
          batch: s.batch,
          section: 'A',
          cgpa: s.cgpa,
          attendancePct: s.attendancePct,
          status: 'Active',
          enrolledSubjectCodes: s.subjects,
          totalFeeAssessedInr: s.totalFee,
          paidFeeInr: s.paidFee,
          dueFeeInr: Math.max(0, s.totalFee - s.paidFee),
          feeStatus: s.feeStatus,
          isSyntheticPlaceholder: false
        }
      },
      { upsert: true, new: true }
    );
    await User.findByIdAndUpdate(stuUser._id, { $set: { linkedStudentId: stuDoc._id } });

    const parentUser = await User.findOneAndUpdate(
      { email: s.parentEmail },
      {
        $setOnInsert: {
          email: s.parentEmail,
          name: `${s.parentName} (Guardian)`,
          phone: s.parentPhone,
          passwordHash,
          status: 'active',
          preferences: { theme: 'light', accentColor: '#3587A4', language: 'en' }
        }
      },
      { upsert: true, new: true }
    );
    await RoleAssignment.updateOne(
      { userId: parentUser._id, roleKey: 'PARENT' },
      {
        $setOnInsert: {
          userId: parentUser._id,
          roleKey: 'PARENT',
          scope: { departmentIds: [], programIds: [], subjectIds: [], hostelIds: [] },
          isPrimary: true,
          active: true
        }
      },
      { upsert: true }
    );
    await GuardianLink.updateOne(
      { guardianUserId: parentUser._id, studentId: stuDoc._id },
      {
        $setOnInsert: {
          guardianUserId: parentUser._id,
          studentId: stuDoc._id,
          relationship: s.relation,
          verificationStatus: 'verified',
          verifiedByUserId: userMap.COLLEGE_ADMIN._id,
          verifiedAt: new Date()
        }
      },
      { upsert: true }
    );

    allStudents.push({ student: stuDoc, user: stuUser, hostelCode: s.hostelCode, roomNo: s.roomNo });
  }

  // 2. Additional Faculty / Employee Profiles (Total 6 distinct faculty across departments + Payroll Runs)
  const additionalFaculty = [
    {
      employeeCode: 'EMP-2026-0002',
      email: 'hod.cse@cas.res.in',
      name: 'Dr. Anuj Kumar Sharma',
      phone: '+91 94150 22002',
      deptCode: 'CSE',
      designation: 'Professor & Dean Academics',
      qualification: 'Ph.D (IIT Roorkee)',
      specialization: 'Algorithms, Mechatronics & Advanced Computing',
      publicationsCount: 52,
      baseSalaryInr: 148000,
      hraInr: 29600,
      daInr: 22000,
      deductionsInr: 18500,
      roleKey: 'HOD'
    },
    {
      employeeCode: 'EMP-2026-0003',
      email: 'faculty.vibhu@cas.res.in',
      name: 'Dr. Vibhu Kumar Tripathi',
      phone: '+91 94150 22003',
      deptCode: 'CSE',
      designation: 'Associate Professor',
      qualification: 'Ph.D (IIT BHU)',
      specialization: 'Artificial Intelligence & Deep Learning (DGX-2)',
      publicationsCount: 38,
      baseSalaryInr: 131400,
      hraInr: 26280,
      daInr: 19000,
      deductionsInr: 15200,
      roleKey: 'FACULTY'
    },
    {
      employeeCode: 'EMP-2026-0004',
      email: 'faculty.biswajit@cas.res.in',
      name: 'Dr. Biswajit Mandal',
      phone: '+91 94150 22004',
      deptCode: 'EST',
      designation: 'Associate Professor',
      qualification: 'Ph.D (IIT Kharagpur)',
      specialization: 'Solar Photovoltaics & Energy Storage',
      publicationsCount: 31,
      baseSalaryInr: 126000,
      hraInr: 25200,
      daInr: 18000,
      deductionsInr: 14400,
      roleKey: 'FACULTY'
    },
    {
      employeeCode: 'EMP-2026-0005',
      email: 'faculty.siddharth@cas.res.in',
      name: 'Dr. Siddharth Yadav',
      phone: '+91 94150 22005',
      deptCode: 'MTA',
      designation: 'Assistant Professor',
      qualification: 'Ph.D (IIT Kanpur)',
      specialization: 'Additive Manufacturing & Industrial Robotics',
      publicationsCount: 19,
      baseSalaryInr: 108000,
      hraInr: 21600,
      daInr: 15000,
      deductionsInr: 11800,
      roleKey: 'FACULTY'
    },
    {
      employeeCode: 'EMP-2026-0006',
      email: 'faculty.pooja@cas.res.in',
      name: 'Dr. Pooja Srivastava',
      phone: '+91 94150 22006',
      deptCode: 'MECHA',
      designation: 'Assistant Professor',
      qualification: 'Ph.D (MNNIT Allahabad)',
      specialization: 'Embedded Control Systems & Autonomous Drones',
      publicationsCount: 22,
      baseSalaryInr: 112000,
      hraInr: 22400,
      daInr: 15600,
      deductionsInr: 12100,
      roleKey: 'FACULTY'
    }
  ];

  const allEmployees: Array<InstanceType<typeof Employee>> = [empFac];
  for (const f of additionalFaculty) {
    const dept = depts[f.deptCode] || depts.CSE;
    const fUser = await User.findOneAndUpdate(
      { email: f.email },
      {
        $setOnInsert: {
          email: f.email,
          name: f.name,
          phone: f.phone,
          passwordHash,
          status: 'active',
          preferences: { theme: 'light', accentColor: '#3587A4', language: 'en' }
        }
      },
      { upsert: true, new: true }
    );
    await RoleAssignment.updateOne(
      { userId: fUser._id, roleKey: f.roleKey },
      {
        $setOnInsert: {
          userId: fUser._id,
          roleKey: f.roleKey,
          scope: { departmentIds: [dept._id], programIds: [], subjectIds: [], hostelIds: [] },
          isPrimary: true,
          active: true
        }
      },
      { upsert: true }
    );

    const empDoc = await Employee.findOneAndUpdate(
      { employeeCode: f.employeeCode },
      {
        $setOnInsert: {
          employeeCode: f.employeeCode,
          userId: fUser._id,
          name: f.name,
          email: f.email,
          phone: f.phone,
          employeeType: 'Faculty',
          departmentId: dept._id,
          deptCode: f.deptCode,
          designation: f.designation,
          qualification: f.qualification,
          specialization: f.specialization,
          publicationsCount: f.publicationsCount,
          baseSalaryInr: f.baseSalaryInr,
          hraInr: f.hraInr,
          daInr: f.daInr,
          deductionsInr: f.deductionsInr,
          isSyntheticPlaceholder: false
        }
      },
      { upsert: true, new: true }
    );
    await User.findByIdAndUpdate(fUser._id, { $set: { linkedEmployeeId: empDoc._id } });
    allEmployees.push(empDoc);
  }

  // Payroll Runs for all 6 faculty (October 2026)
  for (let i = 0; i < allEmployees.length; i += 1) {
    const emp = allEmployees[i];
    const gross = (emp.baseSalaryInr || 100000) + (emp.hraInr || 20000) + (emp.daInr || 15000);
    const net = gross - (emp.deductionsInr || 12000);
    await PayrollRun.updateOne(
      { payrollNo: `PAY-202610-00${i + 1}` },
      {
        $setOnInsert: {
          payrollNo: `PAY-202610-00${i + 1}`,
          monthKey: '2026-10',
          employeeId: emp._id,
          employeeCode: emp.employeeCode,
          employeeName: emp.name,
          baseSalaryInr: emp.baseSalaryInr,
          hraInr: emp.hraInr,
          daInr: emp.daInr,
          grossInr: gross,
          deductionsInr: emp.deductionsInr,
          unpaidLeaveDeductionInr: 0,
          netInr: net,
          status: i < 4 ? 'paid' : 'approved',
          preparedByUserId: userMap.ACCOUNTANT._id,
          approvedByUserId: userMap.PRINCIPAL._id,
          approvedAt: new Date('2026-10-30T10:00:00Z')
        }
      },
      { upsert: true }
    );
  }

  // 3. Expanded Timetable Slots (6+ conflict-free slots across departments)
  const extraSlots = [
    { dayOfWeek: 'Monday', slotTime: '11:15 AM - 12:45 PM', room: 'NVIDIA DGX-2 AI Lab', subjectCode: 'CS-502', subjectName: 'Machine Learning & Pattern Recognition (NVIDIA DGX-2 Lab)', dept: depts.CSE, facultyName: 'Dr. Vibhu Kumar Tripathi', sem: 1 },
    { dayOfWeek: 'Tuesday', slotTime: '09:30 AM - 11:00 AM', room: 'Robotics Lab 201', subjectCode: 'MC-501', subjectName: 'Robotics, Sensors & Actuators', dept: depts.MECHA, facultyName: 'Dr. Anuj Kumar Sharma', sem: 3 },
    { dayOfWeek: 'Wednesday', slotTime: '10:00 AM - 11:30 AM', room: 'Nano Cleanroom Lab', subjectCode: 'NT-501', subjectName: 'Synthesis & Characterization of Nanomaterials', dept: depts.NANO, facultyName: 'Dr. Saurabh Mishra', sem: 3 },
    { dayOfWeek: 'Thursday', slotTime: '11:30 AM - 01:00 PM', room: 'Energy Systems Hall', subjectCode: 'ES-501', subjectName: 'Renewable Energy Systems & Energy Audit', dept: depts.EST, facultyName: 'Dr. Biswajit Mandal', sem: 1 },
    { dayOfWeek: 'Friday', slotTime: '02:00 PM - 03:30 PM', room: '3D Printing & CNC Bay', subjectCode: 'MT-501', subjectName: 'Additive Manufacturing & CNC Automation', dept: depts.MTA, facultyName: 'Dr. Siddharth Yadav', sem: 1 },
    { dayOfWeek: 'Friday', slotTime: '03:45 PM - 05:15 PM', room: 'Control Systems Lab', subjectCode: 'MC-502', subjectName: 'Embedded Control Systems & Actuation', dept: depts.MECHA, facultyName: 'Dr. Pooja Srivastava', sem: 3 }
  ];
  for (const sl of extraSlots) {
    await TimetableSlot.updateOne(
      { dayOfWeek: sl.dayOfWeek, slotTime: sl.slotTime, room: sl.room },
      {
        $setOnInsert: {
          semesterNumber: sl.sem,
          batch: '2025 - 2027',
          section: 'A',
          dayOfWeek: sl.dayOfWeek,
          slotTime: sl.slotTime,
          subjectCode: sl.subjectCode,
          subjectName: sl.subjectName,
          room: sl.room,
          departmentId: sl.dept._id,
          facultyName: sl.facultyName
        }
      },
      { upsert: true }
    );
  }

  // 4. Admissions Module: 6 Applicants across every lifecycle state
  const applicantSeeds = [
    { appNo: 'APP-2026-1001', fullName: 'Siddharth Tiwari', email: 'siddharth.tiwari@applicant.in', phone: '+91 98101 55001', dept: depts.CSE, prog: 'MTECH-CSE', exam: 'GATE CS 2026', score: 91.4, gName: 'R. K. Tiwari', gPhone: '+91 98101 55011', status: 'submitted', remarks: 'Awaiting initial document verification' },
    { appNo: 'APP-2026-1002', fullName: 'Nandini Gupta', email: 'nandini.gupta@applicant.in', phone: '+91 98101 55002', dept: depts.MECHA, prog: 'MTECH-MECHA', exam: 'GATE ME 2026', score: 87.2, gName: 'P. Gupta', gPhone: '+91 98101 55012', status: 'docs_verified', remarks: 'GATE scorecard & B.Tech marksheet verified' },
    { appNo: 'APP-2026-1003', fullName: 'Harshvardhan Joshi', email: 'harsh.joshi@applicant.in', phone: '+91 98101 55003', dept: depts.NANO, prog: 'MTECH-NANO', exam: 'GATE PH 2026', score: 84.8, gName: 'V. Joshi', gPhone: '+91 98101 55013', status: 'merit_shortlisted', remarks: 'Shortlisted in Round-1 CAS merit roster' },
    { appNo: 'APP-2026-1004', fullName: 'Ritika Srivastava', email: 'ritika.srivastava@applicant.in', phone: '+91 98101 55004', dept: depts.EST, prog: 'MTECH-EST', exam: 'GATE EE 2026', score: 89.6, gName: 'A. Srivastava', gPhone: '+91 98101 55014', status: 'approved', remarks: 'Director approved seat allotment for M.Tech EST' },
    { appNo: 'APP-2026-1005', fullName: 'Aditya Kulkarni', email: 'aditya.kulkarni@applicant.in', phone: '+91 98101 55005', dept: depts.MTA, prog: 'MTECH-MTA', exam: 'GATE PI 2026', score: 82.0, gName: 'M. Kulkarni', gPhone: '+91 98101 55015', status: 'enrolled', remarks: 'Enrolled into M.Tech MTA 2026 batch' },
    { appNo: 'APP-2026-1006', fullName: 'Kunal Saxena', email: 'kunal.saxena@applicant.in', phone: '+91 98101 55006', dept: depts.CSE, prog: 'PHD-ENGG', exam: 'AKTU PhD Entrance 2026', score: 79.5, gName: 'D. Saxena', gPhone: '+91 98101 55016', status: 'docs_verified', remarks: 'Research proposal forwarded to DRC panel' }
  ];
  for (const a of applicantSeeds) {
    await Applicant.updateOne(
      { applicationNo: a.appNo },
      {
        $setOnInsert: {
          applicationNo: a.appNo,
          trackingPinHash: sha256Hex('123456'),
          fullName: a.fullName,
          email: a.email,
          phone: a.phone,
          departmentId: a.dept._id,
          programCode: a.prog,
          qualifyingExamName: a.exam,
          qualifyingScorePct: a.score,
          guardianName: a.gName,
          guardianPhone: a.gPhone,
          status: a.status,
          remarks: a.remarks,
          verifiedByUserId: a.status !== 'submitted' ? userMap.ADMISSION_OFFICER._id : null,
          approvedByUserId: a.status === 'approved' || a.status === 'enrolled' ? userMap.PRINCIPAL._id : null
        }
      },
      { upsert: true }
    );
  }

  // 5. Attendance Events across all 6 students + faculty punches
  const attendanceDates = ['2026-11-16', '2026-11-17'];
  for (const dt of attendanceDates) {
    for (let i = 0; i < allStudents.length; i += 1) {
      const { student } = allStudents[i];
      const subj = student.enrolledSubjectCodes?.[0] || 'CS-501';
      const status = i === 1 && dt === '2026-11-16' ? 'Absent' : i === 4 && dt === '2026-11-17' ? 'Late' : 'Present';
      const method = i % 3 === 0 ? 'qr' : i % 3 === 1 ? 'manual' : 'rfid';
      const key = `STU:${student._id}:${subj}:${dt}:SLOT-1`;
      await AttendanceEvent.updateOne(
        { idempotencyKey: key },
        {
          $setOnInsert: {
            personType: 'student',
            personId: student._id,
            personCode: student.rollNumber,
            personName: student.name,
            departmentId: student.departmentId,
            subjectCode: subj,
            sessionDate: dt,
            lectureSlot: 'SLOT-1',
            status,
            captureMethod: method,
            idempotencyKey: key,
            markedByUserId: userMap.FACULTY._id,
            checkInAt: new Date(`${dt}T04:00:00Z`)
          }
        },
        { upsert: true }
      );
    }
  }

  // 6. Finance & Double-Entry Accounting across all 6 students (FeePlans, Invoices, Payments, Vouchers, Refunds)
  const extraFeePlans = [
    { code: 'FP-MTECH-MECHA', name: 'M.Tech Mechatronics Annual Fee Plan', programCode: 'MTECH-MECHA', semesterNumber: 1, tuitionInr: 40100, examFeeInr: 10000, developmentFeeInr: 26200 },
    { code: 'FP-MTECH-NANO', name: 'M.Tech Nanotechnology Annual Fee Plan', programCode: 'MTECH-NANO', semesterNumber: 1, tuitionInr: 40100, examFeeInr: 10000, developmentFeeInr: 26200 },
    { code: 'FP-MTECH-EST', name: 'M.Tech Energy Science Annual Fee Plan', programCode: 'MTECH-EST', semesterNumber: 1, tuitionInr: 40100, examFeeInr: 10000, developmentFeeInr: 26200 }
  ];
  for (const fp of extraFeePlans) {
    await FeePlan.updateOne({ code: fp.code }, { $set: fp }, { upsert: true });
  }

  const seededPayments: Array<InstanceType<typeof PaymentTransaction>> = [];
  for (let i = 1; i < allStudents.length; i += 1) {
    const { student } = allStudents[i];
    const invNo = `INV-2026-00000${i + 1}`;
    const netAmt = student.totalFeeAssessedInr || 76300;
    const paidAmt = student.paidFeeInr || 0;
    const dueAmt = Math.max(0, netAmt - paidAmt);
    const inv = await Invoice.findOneAndUpdate(
      { invoiceNo: invNo },
      {
        $setOnInsert: {
          invoiceNo: invNo,
          studentId: student._id,
          studentName: student.name,
          rollNumber: student.rollNumber,
          academicYear: '2026 - 2027',
          semesterLabel: `Semester ${student.semesterNumber}`,
          feeHead: 'Academic Tuition & Lab Fee',
          grossAmountInr: netAmt,
          concessionInr: 0,
          netAmountInr: netAmt,
          paidAmountInr: paidAmt,
          dueAmountInr: dueAmt,
          dueDate: new Date('2026-12-15T00:00:00Z'),
          status: dueAmt === 0 ? 'Paid' : paidAmt > 0 ? 'Partial' : 'Pending'
        }
      },
      { upsert: true, new: true }
    );

    if (paidAmt > 0) {
      const recNo = `REC-2026-10000${i + 1}`;
      const payDoc = await PaymentTransaction.findOneAndUpdate(
        { receiptNo: recNo },
        {
          $setOnInsert: {
            receiptNo: recNo,
            orderId: `ORD-SEED-10000${i + 1}`,
            idempotencyKey: `SEED-TXN-10000${i + 1}`,
            invoiceId: inv._id,
            studentId: student._id,
            studentName: student.name,
            rollNumber: student.rollNumber,
            feeHead: 'Academic Tuition & Lab Fee',
            amountInr: paidAmt,
            channel: i % 2 === 0 ? 'offline_neft' : 'offline_challan',
            status: 'paid',
            referenceCode: `UTR-CAS-20260${i + 1}`,
            settledAt: new Date(),
            recordedByUserId: userMap.ACCOUNTANT._id
          }
        },
        { upsert: true, new: true }
      );
      seededPayments.push(payDoc);

      const vchNo = `VCH-SEED-000${i + 1}`;
      if (!(await LedgerEntry.exists({ voucherNo: vchNo }))) {
        await LedgerEntry.create({
          voucherNo: vchNo,
          voucherType: 'Receipt',
          description: `Fee receipt ${recNo} for ${student.name} (${student.rollNumber})`,
          costCentre: student.deptCode,
          referenceType: 'PaymentTransaction',
          referenceId: recNo,
          lines: [
            { accountCode: '1002', accountName: 'Bank / Gateway Clearing Account', debitInr: paidAmt, creditInr: 0 },
            { accountCode: '4001', accountName: 'Student Tuition & Academic Fee Income', debitInr: 0, creditInr: paidAmt }
          ],
          totalDebitInr: paidAmt,
          totalCreditInr: paidAmt,
          postedByUserId: userMap.ACCOUNTANT._id
        });
      }
    }
  }

  if (seededPayments[0]) {
    await RefundRequest.updateOne(
      { refundNo: 'REF-2026-0001' },
      {
        $setOnInsert: {
          refundNo: 'REF-2026-0001',
          paymentId: seededPayments[0]._id,
          studentId: seededPayments[0].studentId,
          studentName: seededPayments[0].studentName,
          amountInr: 5000,
          reason: 'Caution money / excess lab deposit adjustment',
          status: 'pending_approval',
          preparedByUserId: userMap.ACCOUNTANT._id
        }
      },
      { upsert: true }
    );
  }

  // 7. Examinations, Marks, Published Results & LMS Materials across 5+ schedules & students
  const extraExams = [
    { examCode: 'ENDSEM-CS502-2026', title: 'Odd Semester End-Term (CS-502 Machine Learning)', subjectCode: 'CS-502', subjectName: 'Machine Learning & Pattern Recognition (NVIDIA DGX-2 Lab)', dept: depts.CSE, date: '2026-12-15', room: 'Exam Hall 102', invigilator: 'Dr. Vibhu Kumar Tripathi', state: 'verified' },
    { examCode: 'ENDSEM-MC501-2026', title: 'Odd Semester End-Term (MC-501 Robotics)', subjectCode: 'MC-501', subjectName: 'Robotics, Sensors & Actuators', dept: depts.MECHA, date: '2026-12-16', room: 'Exam Hall 103', invigilator: 'Dr. Pooja Srivastava', state: 'published' },
    { examCode: 'ENDSEM-NT501-2026', title: 'Odd Semester End-Term (NT-501 Nanomaterials)', subjectCode: 'NT-501', subjectName: 'Synthesis & Characterization of Nanomaterials', dept: depts.NANO, date: '2026-12-17', room: 'Exam Hall 104', invigilator: 'Dr. Saurabh Mishra', state: 'published' },
    { examCode: 'ENDSEM-ES501-2026', title: 'Odd Semester End-Term (ES-501 Renewable Energy)', subjectCode: 'ES-501', subjectName: 'Renewable Energy Systems & Energy Audit', dept: depts.EST, date: '2026-12-18', room: 'Exam Hall 105', invigilator: 'Dr. Biswajit Mandal', state: 'marks_open' },
    { examCode: 'ENDSEM-MT501-2026', title: 'Odd Semester End-Term (MT-501 Additive Mfg)', subjectCode: 'MT-501', subjectName: 'Additive Manufacturing & CNC Automation', dept: depts.MTA, date: '2026-12-19', room: 'Exam Hall 106', invigilator: 'Dr. Siddharth Yadav', state: 'marks_open' }
  ];
  const examDocs: Array<InstanceType<typeof ExamSchedule>> = [];
  for (const ex of extraExams) {
    const doc = await ExamSchedule.findOneAndUpdate(
      { examCode: ex.examCode },
      {
        $setOnInsert: {
          examCode: ex.examCode,
          title: ex.title,
          academicYear: '2026 - 2027',
          semesterNumber: 3,
          subjectCode: ex.subjectCode,
          subjectName: ex.subjectName,
          departmentId: ex.dept._id,
          examDate: ex.date,
          slotTime: '10:00 AM - 01:00 PM',
          room: ex.room,
          invigilatorName: ex.invigilator,
          state: ex.state,
          verifiedByUserId: ex.state === 'verified' || ex.state === 'published' ? userMap.EXAM_CONTROLLER._id : null,
          publishedByUserId: ex.state === 'published' ? userMap.EXAM_CONTROLLER._id : null,
          publishedAt: ex.state === 'published' ? new Date() : null
        }
      },
      { upsert: true, new: true }
    );
    examDocs.push(doc);
  }

  // Seed ExamMarks & PublishedResults for 5 students
  const publishedExam = examDocs[1]; // MC-501 published
  for (let i = 0; i < Math.min(5, allStudents.length); i += 1) {
    const { student } = allStudents[i];
    const total = 82 + i * 3;
    const grade = total >= 90 ? 'O' : 'A+';
    await ExamMark.updateOne(
      { examId: publishedExam._id, studentId: student._id },
      {
        $setOnInsert: {
          examId: publishedExam._id,
          studentId: student._id,
          studentName: student.name,
          rollNumber: student.rollNumber,
          subjectCode: publishedExam.subjectCode,
          credits: 4,
          internalMarks: 26,
          practicalMarks: 18,
          externalMarks: total - 44,
          totalMarks: total,
          grade,
          moderationStatus: 'published_locked',
          submittedByUserId: userMap.FACULTY._id,
          verifiedByUserId: userMap.EXAM_CONTROLLER._id
        }
      },
      { upsert: true }
    );

    await PublishedResult.updateOne(
      { studentId: student._id, academicYear: '2025 - 2026', semesterNumber: Math.max(1, student.semesterNumber - 1) },
      {
        $setOnInsert: {
          studentId: student._id,
          rollNumber: student.rollNumber,
          academicYear: '2025 - 2026',
          semesterNumber: Math.max(1, student.semesterNumber - 1),
          subjects: [
            { subjectCode: 'CS-501', subjectName: 'Design & Analysis of Algorithms', credits: 4, totalMarks: total, grade },
            { subjectCode: 'MC-501', subjectName: 'Robotics, Sensors & Actuators', credits: 4, totalMarks: total - 2, grade }
          ],
          sgpa: Number((student.cgpa || 8.9).toFixed(2)),
          cgpa: Number((student.cgpa || 8.9).toFixed(2)),
          earnedCredits: 20,
          totalCredits: 20,
          backlogCount: 0,
          auditLockHash: sha256Hex(`RES:${student.rollNumber}:2025-26`),
          publishedByUserId: userMap.EXAM_CONTROLLER._id
        }
      },
      { upsert: true }
    );
  }

  // LMS Materials (6 items) & Assignment Submissions (5 students)
  const lmsSeeds = [
    { subjectCode: 'CS-501', title: 'Unit 1–3 Dynamic Programming & Graph Algorithms Notes', materialType: 'notes', description: 'Lecture slides and complexity proofs for M.Tech CSE.' },
    { subjectCode: 'CS-502', title: 'Assignment 1: PyTorch CNN Training on NVIDIA DGX-2', materialType: 'assignment', description: 'Submit notebook + benchmark loss curve.' },
    { subjectCode: 'MC-501', title: 'Kinematics & Inverse Dynamics Lab Manual', materialType: 'syllabus', description: '6-DOF robotic arm Denavit-Hartenberg lab manual.' },
    { subjectCode: 'NT-501', title: 'CVD Thin-Film Deposition Characterization Guide', materialType: 'notes', description: 'SEM/XRD characterization protocol in CAS cleanroom.' },
    { subjectCode: 'ES-501', title: 'Assignment 2: Campus Solar Microgrid Energy Audit', materialType: 'assignment', description: 'Calculate rooftop PV yield for AKTU Jankipuram block.' },
    { subjectCode: 'MT-501', title: 'Additive Manufacturing G-Code & SLS Tolerances', materialType: 'notes', description: 'Reference notes for rapid prototyping bay.' }
  ];
  let firstAssignment: InstanceType<typeof LmsMaterial> | null = null;
  for (const lm of lmsSeeds) {
    const mat = await LmsMaterial.findOneAndUpdate(
      { subjectCode: lm.subjectCode, title: lm.title },
      {
        $setOnInsert: {
          ...lm,
          dueDate: lm.materialType === 'assignment' ? new Date('2026-12-01T18:00:00Z') : null,
          maxScore: 20,
          uploadedByUserId: userMap.FACULTY._id,
          uploadedByName: userMap.FACULTY.name
        }
      },
      { upsert: true, new: true }
    );
    if (lm.materialType === 'assignment' && !firstAssignment) firstAssignment = mat;
  }
  if (firstAssignment) {
    for (let i = 0; i < Math.min(5, allStudents.length); i += 1) {
      const { student } = allStudents[i];
      await AssignmentSubmission.updateOne(
        { materialId: firstAssignment._id, studentId: student._id },
        {
          $setOnInsert: {
            materialId: firstAssignment._id,
            studentId: student._id,
            studentName: student.name,
            notes: `Submitted benchmark report by ${student.name} (${student.rollNumber}).`,
            marksAwarded: 16 + (i % 4),
            feedback: 'Well-structured experimental evaluation.',
            gradedByUserId: userMap.FACULTY._id
          }
        },
        { upsert: true }
      );
    }
  }

  // 8. Leave Requests (6 requests across students & faculty) & Official AKTU 2026 Holidays (28 Gazetted)
  const extraHolidays = [
    { date: '2026-01-03', name: 'Hazrat Ali Birthday', nameHi: 'मो० हजरत अली का जन्म दिवस', type: 'Gazetted' },
    { date: '2026-02-15', name: 'Mahashivratri', nameHi: 'महाशिवरात्रि', type: 'Gazetted' },
    { date: '2026-03-02', name: 'Holika Dahan', nameHi: 'होलिका दहन', type: 'Gazetted' },
    { date: '2026-03-04', name: 'Holi', nameHi: 'होली', type: 'Gazetted' },
    { date: '2026-03-05', name: 'Holi (Local Holiday)', nameHi: 'होली (स्थानीय अवकाश)', type: 'Gazetted' },
    { date: '2026-03-11', name: 'Sheetala Ashtami', nameHi: 'शीतलाष्टमी', type: 'Gazetted' },
    { date: '2026-03-21', name: 'Eid-ul-Fitr', nameHi: 'ईद-उल-फितर', type: 'Gazetted' },
    { date: '2026-03-26', name: 'Ram Navami', nameHi: 'राम नवमी', type: 'Gazetted' },
    { date: '2026-03-31', name: 'Mahavir Jayanti', nameHi: 'महावीर जयंती', type: 'Gazetted' },
    { date: '2026-04-03', name: 'Good Friday', nameHi: 'गुड फ्राइडे', type: 'Gazetted' },
    { date: '2026-04-14', name: 'Dr. Bhimrao Ambedkar Jayanti', nameHi: 'डा० भीमराव अम्बेडकर जयंती', type: 'Gazetted' },
    { date: '2026-05-01', name: 'Buddha Purnima', nameHi: 'बुद्ध पूर्णिमा', type: 'Gazetted' },
    { date: '2026-05-05', name: 'Mahavir Ji Fair (Bada Mangal)', nameHi: 'बड़ा मंगल', type: 'Gazetted' },
    { date: '2026-05-27', name: 'Eid-ul-Zuha (Bakrid)', nameHi: 'ईदुज्जुहा (बकरीद)', type: 'Gazetted' },
    { date: '2026-06-26', name: 'Muharram', nameHi: 'मोहर्रम', type: 'Gazetted' },
    { date: '2026-08-15', name: 'Independence Day', nameHi: 'स्वतंत्रता दिवस', type: 'Gazetted' },
    { date: '2026-08-26', name: 'Eid-e-Milad / Barawafat', nameHi: 'ईद-ए-मिलाद / बारावफात', type: 'Gazetted' },
    { date: '2026-08-28', name: 'Raksha Bandhan', nameHi: 'रक्षा बंधन', type: 'Gazetted' },
    { date: '2026-09-04', name: 'Janmashtami', nameHi: 'जन्माष्टमी', type: 'Gazetted' },
    { date: '2026-10-02', name: 'Mahatma Gandhi Jayanti', nameHi: 'महात्मा गांधी जयंती', type: 'Gazetted' },
    { date: '2026-10-20', name: 'Dussehra (Vijayadashami)', nameHi: 'दशहरा (विजयदशमी)', type: 'Gazetted' },
    { date: '2026-11-08', name: 'Deepawali (Diwali)', nameHi: 'दीपावली', type: 'Gazetted' },
    { date: '2026-11-09', name: 'Govardhan Puja', nameHi: 'गोवर्धन पूजा', type: 'Gazetted' },
    { date: '2026-11-11', name: 'Bhai Dooj / Chitragupta Jayanti', nameHi: 'भईयादूज / चित्रगुप्त जयन्ती', type: 'Gazetted' },
    { date: '2026-11-24', name: 'Guru Nanak Jayanti / Kartik Purnima', nameHi: 'गुरु नानक जयंती / कार्तिक पूर्णिमा', type: 'Gazetted' },
    { date: '2026-12-25', name: 'Christmas Day', nameHi: 'क्रिसमस-डे', type: 'Gazetted' }
  ];
  for (const h of extraHolidays) {
    await HolidayCalendar.updateOne({ date: h.date }, { $setOnInsert: h }, { upsert: true });
  }

  const extraLeaves = [
    { no: 'LV-2026-000002', idx: 1, type: 'ACADEMIC_OD', from: '2026-11-20', to: '2026-11-21', days: 2, reason: 'Presenting IEEE conference paper at IIT Kanpur', status: 'approved', outpass: true },
    { no: 'LV-2026-000003', idx: 2, type: 'OUTPASS', from: '2026-11-22', to: '2026-11-23', days: 2, reason: 'Weekend home visit to Kanpur', status: 'pending', outpass: true },
    { no: 'LV-2026-000004', idx: 3, type: 'MEDICAL', from: '2026-11-12', to: '2026-11-13', days: 2, reason: 'Dental procedure and rest advised by campus clinic', status: 'approved', outpass: false },
    { no: 'LV-2026-000005', idx: 4, type: 'CASUAL', from: '2026-11-25', to: '2026-11-26', days: 2, reason: 'Family wedding ceremony in Prayagraj', status: 'pending', outpass: true },
    { no: 'LV-2026-000006', idx: 5, type: 'ACADEMIC_OD', from: '2026-11-28', to: '2026-11-29', days: 2, reason: 'Industrial visit to HAL Lucknow division', status: 'approved', outpass: false }
  ];
  for (const lv of extraLeaves) {
    const entry = allStudents[lv.idx];
    if (!entry) continue;
    await LeaveRequest.updateOne(
      { requestNo: lv.no },
      {
        $setOnInsert: {
          requestNo: lv.no,
          applicantType: 'student',
          applicantUserId: entry.user._id,
          applicantName: entry.student.name,
          applicantCode: entry.student.rollNumber,
          studentId: entry.student._id,
          departmentId: entry.student.departmentId,
          deptCode: entry.student.deptCode,
          leaveType: lv.type,
          fromDate: lv.from,
          toDate: lv.to,
          days: lv.days,
          reason: lv.reason,
          urgency: 'normal',
          isHostelOutpass: lv.outpass,
          parentApprovalRequired: lv.outpass,
          parentApproved: lv.status === 'approved',
          status: lv.status,
          reviewedByUserId: lv.status === 'approved' ? userMap.HOD._id : null,
          reviewedByName: lv.status === 'approved' ? userMap.HOD.name : ''
        }
      },
      { upsert: true }
    );
  }

  // 9. Library Catalog (6 Books) + Circulation Records (5 students)
  const extraBooks = [
    { isbn: '978-0262035613', barcode: 'LIB-CAS-0002', title: 'Deep Learning', author: 'Ian Goodfellow, Yoshua Bengio, Aaron Courville', publisher: 'MIT Press', category: 'Artificial Intelligence', totalCopies: 8, availableCopies: 6 },
    { isbn: '978-0134685991', barcode: 'LIB-CAS-0003', title: 'Introduction to Robotics: Mechanics and Control', author: 'John J. Craig', publisher: 'Pearson', category: 'Mechatronics', totalCopies: 6, availableCopies: 5 },
    { isbn: '978-0470929643', barcode: 'LIB-CAS-0004', title: 'Introduction to Nanotechnology', author: 'Charles P. Poole Jr., Frank J. Owens', publisher: 'Wiley', category: 'Nanotechnology', totalCopies: 7, availableCopies: 6 },
    { isbn: '978-0123859341', barcode: 'LIB-CAS-0005', title: 'Renewable Energy: Power for a Sustainable Future', author: 'Godfrey Boyle', publisher: 'Oxford Press', category: 'Energy Science', totalCopies: 6, availableCopies: 5 },
    { isbn: '978-1493921126', barcode: 'LIB-CAS-0006', title: 'Additive Manufacturing Technologies', author: 'Ian Gibson, David Rosen, Brent Stucker', publisher: 'Springer', category: 'Manufacturing', totalCopies: 5, availableCopies: 4 }
  ];
  const libItems: Array<InstanceType<typeof LibraryItem>> = [];
  for (const b of extraBooks) {
    const doc = await LibraryItem.findOneAndUpdate({ barcode: b.barcode }, { $setOnInsert: b }, { upsert: true, new: true });
    libItems.push(doc);
  }
  for (let i = 0; i < Math.min(5, allStudents.length, libItems.length); i += 1) {
    const { user, student } = allStudents[i];
    const item = libItems[i];
    if (!(await CirculationRecord.exists({ itemId: item._id, borrowerUserId: user._id }))) {
      await CirculationRecord.create({
        itemId: item._id,
        itemTitle: item.title,
        borrowerUserId: user._id,
        borrowerName: student.name,
        dueDate: new Date(Date.now() + (10 + i) * 86_400_000),
        status: i === 4 ? 'returned' : 'issued',
        returnedAt: i === 4 ? new Date() : null
      });
    }
  }

  // 10. Hostel Bed Allocations (all 6 students across Boys & Girls Hostels)
  const boysHostel = await Hostel.findOne({ code: 'HST-BOYS' });
  const girlsHostel = await Hostel.findOne({ code: 'HST-GIRLS' });
  for (const entry of allStudents) {
    const hostelDoc = entry.hostelCode === 'HST-GIRLS' ? girlsHostel : boysHostel;
    if (!hostelDoc) continue;
    await BedAllocation.updateOne(
      { studentId: entry.student._id },
      {
        $setOnInsert: {
          hostelId: hostelDoc._id,
          hostelName: hostelDoc.name,
          roomNumber: entry.roomNo,
          bedNumber: 'Bed-1',
          studentId: entry.student._id,
          studentName: entry.student.name,
          status: 'allocated',
          allocatedByUserId: userMap.HOSTEL_WARDEN._id
        }
      },
      { upsert: true }
    );
  }

  // 11. Documents (6) & Verifiable QR Certificates (6) across all 6 students
  const certTypes = ['Bonafide', 'Character Certificate', 'Fee Structure Certificate', 'Provisional Degree', 'Academic Transcript', 'Migration Certificate'];
  for (let i = 0; i < allStudents.length; i += 1) {
    const { student, user } = allStudents[i];
    const docKey = `seed/docs/${student.rollNumber}-gate-scorecard.pdf`;
    await DocumentRecord.updateOne(
      { objectKey: docKey },
      {
        $setOnInsert: {
          ownerUserId: user._id,
          ownerName: student.name,
          category: 'Academic',
          title: `GATE Scorecard & B.Tech Degree (${student.rollNumber})`,
          version: 1,
          objectKey: docKey,
          sha256: sha256Hex(docKey),
          mimeType: 'application/pdf',
          verificationStatus: i < 5 ? 'verified' : 'pending',
          verifiedByUserId: i < 5 ? userMap.ADMISSION_OFFICER._id : null
        }
      },
      { upsert: true }
    );

    const serialNo = `CAS-CERT-2026-000${i + 1}`;
    await CertificateRecord.updateOne(
      { serialNo },
      {
        $setOnInsert: {
          serialNo,
          studentId: student._id,
          studentName: student.name,
          rollNumber: student.rollNumber,
          certificateType: certTypes[i % certTypes.length],
          purpose: 'AICTE PG Scholarship & Institutional Verification',
          status: i < 4 ? 'signed_issued' : 'requested',
          qrVerificationToken: `CASQR-CERT-2026-000${i + 1}`,
          verifiedByUserId: i < 4 ? userMap.COLLEGE_ADMIN._id : null,
          signedByUserId: i < 4 ? userMap.PRINCIPAL._id : null,
          signedByName: i < 4 ? userMap.PRINCIPAL.name : '',
          issuedAt: i < 4 ? new Date() : null
        }
      },
      { upsert: true }
    );
  }

  // 12. Placement Drives (5) with Student Applications + Alumni Mentors (5)
  const extraDrives = [
    { driveCode: 'DRV-2026-02', companyName: 'Tata Elxsi Robotics & AI', roleTitle: 'Autonomous Systems Engineer', packageLpa: 14.0, minCgpa: 8.0, driveDate: '2026-12-09' },
    { driveCode: 'DRV-2026-03', companyName: 'CSIR-CDRI Nanomedicine Lab', roleTitle: 'Junior Research Associate', packageLpa: 9.6, minCgpa: 7.5, driveDate: '2026-12-12' },
    { driveCode: 'DRV-2026-04', companyName: 'NTPC Green Energy Ltd.', roleTitle: 'Energy Storage Engineer', packageLpa: 11.8, minCgpa: 7.0, driveDate: '2026-12-15' },
    { driveCode: 'DRV-2026-05', companyName: 'HAL Aerospace Division Lucknow', roleTitle: 'Additive Manufacturing Specialist', packageLpa: 13.2, minCgpa: 8.0, driveDate: '2026-12-20' }
  ];
  for (let i = 0; i < extraDrives.length; i += 1) {
    const d = extraDrives[i];
    const stuEntry = allStudents[i % allStudents.length];
    await PlacementDrive.updateOne(
      { driveCode: d.driveCode },
      {
        $setOnInsert: {
          ...d,
          maxBacklogs: 0,
          status: 'open',
          applicants: [
            { studentId: stuEntry.student._id, studentName: stuEntry.student.name, rollNumber: stuEntry.student.rollNumber, status: i % 2 === 0 ? 'shortlisted' : 'applied' }
          ]
        }
      },
      { upsert: true }
    );
  }

  const alumniSeeds = [
    { fullName: 'Dr. Abhishek Shukla', graduationYear: 2021, departmentCode: 'CSE', currentOrganization: 'Google Research India', roleTitle: 'Senior ML Engineer' },
    { fullName: 'Shreya Chatterjee', graduationYear: 2022, departmentCode: 'MECHA', currentOrganization: 'ISRO SAC Ahmedabad', roleTitle: 'Scientist / Engineer SC' },
    { fullName: 'Pranav Agarwal', graduationYear: 2020, departmentCode: 'NANO', currentOrganization: 'Applied Materials', roleTitle: 'Process Integration Engineer' },
    { fullName: 'Nikhil Dwivedi', graduationYear: 2023, departmentCode: 'EST', currentOrganization: 'Tata Power Solar', roleTitle: 'Lead Microgrid Architect' },
    { fullName: 'Divya Tripathi', graduationYear: 2022, departmentCode: 'MTA', currentOrganization: 'Siemens Digital Industries', roleTitle: 'Automation Consultant' }
  ];
  for (const al of alumniSeeds) {
    await AlumniProfile.updateOne(
      { fullName: al.fullName, graduationYear: al.graduationYear },
      { $setOnInsert: { ...al, openToMentorship: true, directoryVisible: true } },
      { upsert: true }
    );
  }

  // 13. Inventory Assets (6) & Procurement Requests (5)
  const assetSeeds = [
    { assetTag: 'CAS-AI-DGX01', name: 'NVIDIA DGX-2 AI Supercomputing Server', category: 'HPC Compute', departmentCode: 'CSE', quantity: 1, unitCostInr: 32000000, vendorName: 'NVIDIA Enterprise India', status: 'allocated' },
    { assetTag: 'CAS-ROB-002', name: 'KUKA 6-DOF Industrial Robotic Arm', category: 'Robotics Hardware', departmentCode: 'MECHA', quantity: 2, unitCostInr: 1850000, vendorName: 'KUKA Robotics India', status: 'allocated' },
    { assetTag: 'CAS-3DP-003', name: 'Stratasys Industrial Metal/Polymer 3D Printer', category: 'Additive Mfg', departmentCode: 'MTA', quantity: 2, unitCostInr: 1450000, vendorName: 'Stratasys India', status: 'in_stock' },
    { assetTag: 'CAS-NAN-004', name: 'Plasma Enhanced CVD Cleanroom Chamber', category: 'Nanofabrication', departmentCode: 'NANO', quantity: 1, unitCostInr: 4200000, vendorName: 'Oxford Instruments', status: 'allocated' },
    { assetTag: 'CAS-EST-005', name: 'Solar Photovoltaic I-V Curve Characterization Rig', category: 'Energy Lab', departmentCode: 'EST', quantity: 3, unitCostInr: 480000, vendorName: 'Keysight Technologies', status: 'in_stock' },
    { assetTag: 'CAS-CYB-006', name: 'Cyber Security SIEM & Threat Simulation Rack', category: 'Cyber Lab', departmentCode: 'CSE', quantity: 4, unitCostInr: 620000, vendorName: 'Cisco Systems India', status: 'allocated' }
  ];
  for (const ast of assetSeeds) {
    await InventoryAsset.updateOne({ assetTag: ast.assetTag }, { $setOnInsert: ast }, { upsert: true });
  }

  const procSeeds = [
    { requestNo: 'PR-2026-0001', itemName: 'High-Resolution Thermal Camera for Mechatronics Lab', quantity: 2, estimatedCostInr: 240000, departmentCode: 'MECHA', status: 'requested' },
    { requestNo: 'PR-2026-0002', itemName: 'Silicon Wafer Substrates (100mm Cleanroom Grade)', quantity: 50, estimatedCostInr: 125000, departmentCode: 'NANO', status: 'budget_approved' },
    { requestNo: 'PR-2026-0003', itemName: 'NVIDIA RTX 6000 Ada Workstation Nodes', quantity: 3, estimatedCostInr: 1950000, departmentCode: 'CSE', status: 'approved' },
    { requestNo: 'PR-2026-0004', itemName: 'Lithium-Ion Battery Cell Cycler', quantity: 2, estimatedCostInr: 360000, departmentCode: 'EST', status: 'received' },
    { requestNo: 'PR-2026-0005', itemName: 'CNC Carbide Tooling Kit & Calipers', quantity: 10, estimatedCostInr: 85000, departmentCode: 'MTA', status: 'approved' }
  ];
  for (const pr of procSeeds) {
    await ProcurementRequest.updateOne(
      { requestNo: pr.requestNo },
      {
        $setOnInsert: {
          ...pr,
          requestedByUserId: userMap.HOD._id,
          budgetApprovedByUserId: pr.status !== 'requested' ? userMap.ACCOUNTANT._id : null,
          finalApprovedByUserId: pr.status === 'approved' || pr.status === 'received' ? userMap.PRINCIPAL._id : null
        }
      },
      { upsert: true }
    );
  }

  // 14. Grievances (5 general non-confidential tickets across 5 students; preserves confidentiality integration test!)
  const grievanceSeeds = [
    { ticketNo: 'GRV-2026-0001', idx: 0, category: 'IT & Wi-Fi', subject: 'DGX-2 Lab SSH tunnel port request', description: 'Requesting SSH access port whitelist for M.Tech thesis training jobs.', status: 'in_review' },
    { ticketNo: 'GRV-2026-0002', idx: 1, category: 'Hostel & Mess', subject: 'Water cooler filter service in Girls Hostel', description: 'RO filter indicator on 2nd floor Girls Hostel needs routine cartridge replacement.', status: 'open' },
    { ticketNo: 'GRV-2026-0003', idx: 2, category: 'Library', subject: 'Request IEEE Xplore remote VPN renewal', description: 'Remote journal authentication for Robotics transactions needs semester renewal.', status: 'resolved' },
    { ticketNo: 'GRV-2026-0004', idx: 3, category: 'Lab Equipment', subject: 'Cleanroom nitrogen cylinder refill', description: 'Nitrogen purge line pressure is below threshold in Nanofab Bay 2.', status: 'in_review' },
    { ticketNo: 'GRV-2026-0005', idx: 4, category: 'Academic', subject: 'Elective subject mapping correction', description: 'Kindly reflect ES-501 lab elective credits on student timetable sheet.', status: 'open' }
  ];
  for (const g of grievanceSeeds) {
    const stuEntry = allStudents[g.idx];
    if (!stuEntry) continue;
    await GrievanceTicket.updateOne(
      { ticketNo: g.ticketNo },
      {
        $setOnInsert: {
          ticketNo: g.ticketNo,
          submittedByUserId: stuEntry.user._id,
          category: g.category,
          subject: g.subject,
          description: g.description,
          confidential: false,
          assignedPool: 'ADMIN_HELPDESK',
          slaDueAt: new Date(Date.now() + 72 * 3600_000),
          status: g.status,
          resolutionNotes: g.status === 'resolved' ? 'Renewed institutional IEEE Xplore proxy credentials.' : ''
        }
      },
      { upsert: true }
    );
  }

  // 15. Campus Ops: Events (5), Research Projects (5), Visitor Logs (5), Safety Incidents (5)
  const eventSeeds = [
    { eventCode: 'EVT-2026-01', title: 'AKTU National Symposium on AI & Robotics', category: 'Academic', eventDate: '2026-12-02', venue: 'CAS Auditorium', budgetInr: 150000, status: 'approved' },
    { eventCode: 'EVT-2026-02', title: 'Hands-on Workshop: NVIDIA CUDA & Deep Learning', category: 'Workshop', eventDate: '2026-12-06', venue: 'AI & DGX-2 Lab', budgetInr: 65000, status: 'approved' },
    { eventCode: 'EVT-2026-03', title: 'Inter-Department Nanotechnology Poster Colloquium', category: 'Academic', eventDate: '2026-12-10', venue: 'Seminar Hall B', budgetInr: 45000, status: 'proposed' },
    { eventCode: 'EVT-2026-04', title: 'CAS Annual Badminton & Table Tennis Meet', category: 'Sports', eventDate: '2026-12-18', venue: 'AKTU Indoor Complex', budgetInr: 80000, status: 'approved' },
    { eventCode: 'EVT-2026-05', title: 'Clean Energy & Smart Grid Hackathon 2026', category: 'Club', eventDate: '2026-12-22', venue: 'Innovation Centre', budgetInr: 120000, status: 'approved' }
  ];
  for (const ev of eventSeeds) {
    await CampusEvent.updateOne({ eventCode: ev.eventCode }, { $setOnInsert: ev }, { upsert: true });
  }

  const researchSeeds = [
    { projectCode: 'RES-CAS-001', title: 'Edge AI Vision Models for Autonomous Agricultural Drones', principalInvestigator: 'Dr. Vibhu Kumar Tripathi', fundingAgency: 'DST SERB Core Grant', grantAmountInr: 3800000, ethicsApproved: true, publicationsCount: 6, patentsCount: 2, status: 'active' },
    { projectCode: 'RES-CAS-002', title: 'Flexible Perovskite-Nanowire Hybrid Solar Cells', principalInvestigator: 'Dr. Saurabh Mishra', fundingAgency: 'MNRE Research Scheme', grantAmountInr: 4500000, ethicsApproved: true, publicationsCount: 9, patentsCount: 1, status: 'active' },
    { projectCode: 'RES-CAS-003', title: 'Collaborative Exoskeleton Actuators for Rehabilitation', principalInvestigator: 'Dr. Anuj Kumar Sharma', fundingAgency: 'AICTE RPS Grant', grantAmountInr: 2400000, ethicsApproved: true, publicationsCount: 5, patentsCount: 1, status: 'active' },
    { projectCode: 'RES-CAS-004', title: 'Phase-Change Thermal Storage for Smart Microgrids', principalInvestigator: 'Dr. Biswajit Mandal', fundingAgency: 'UPCST Lucknow', grantAmountInr: 1650000, ethicsApproved: true, publicationsCount: 4, patentsCount: 0, status: 'active' },
    { projectCode: 'RES-CAS-005', title: 'AI-Guided Laser Cladding for Aerospace Alloys', principalInvestigator: 'Dr. Siddharth Yadav', fundingAgency: 'DRDO Extramural Research', grantAmountInr: 5200000, ethicsApproved: false, publicationsCount: 3, patentsCount: 1, status: 'proposal' }
  ];
  for (const rp of researchSeeds) {
    await ResearchProject.updateOne({ projectCode: rp.projectCode }, { $setOnInsert: rp }, { upsert: true });
  }

  const visitorSeeds = [
    { visitorName: 'Prof. R. S. Verma (IIT Kanpur)', contactPhone: '+91 98391 10001', purpose: 'Ph.D. Viva-Voce External Examiner', hostName: 'Prof. S. P. Shukla' },
    { visitorName: 'Mr. Vikram Sen (NVIDIA India)', contactPhone: '+91 98391 10002', purpose: 'DGX-2 Annual Maintenance Inspection', hostName: 'Dr. Vibhu Kumar Tripathi' },
    { visitorName: 'Ms. Aditi Rao (Tata Elxsi)', contactPhone: '+91 98391 10003', purpose: 'Pre-Placement Talk & Campus Hiring', hostName: 'Dr. R. K. Tiwari' },
    { visitorName: 'Dr. P. K. Singh (CSIR-NBRI)', contactPhone: '+91 98391 10004', purpose: 'Joint Nanotechnology MoU Meeting', hostName: 'Dr. Saurabh Mishra' },
    { visitorName: 'Er. Manoj Dubey (UPPCL)', contactPhone: '+91 98391 10005', purpose: 'Campus Solar Net-Metering Audit', hostName: 'Dr. Biswajit Mandal' }
  ];
  for (const vis of visitorSeeds) {
    if (!(await VisitorLog.exists({ visitorName: vis.visitorName, purpose: vis.purpose }))) {
      await VisitorLog.create({ ...vis, recordedByUserId: userMap.HOSTEL_WARDEN._id });
    }
  }

  const safetySeeds = [
    { incidentNo: 'SAF-2026-001', title: 'Quarterly Fire Extinguisher Pressure Audit', severity: 'Low', location: 'Academic Block A & B', description: 'All 24 CO2 & ABC cylinders inspected and tagged compliant.', status: 'resolved' },
    { incidentNo: 'SAF-2026-002', title: 'Cleanroom Fume Hood Airflow Sensor Calibration', severity: 'Medium', location: 'Nanotechnology Lab', description: 'Scheduled laminar flow calibration completed with zero drift.', status: 'resolved' },
    { incidentNo: 'SAF-2026-003', title: 'Boys Hostel Main Gate RFID Turnstile Check', severity: 'Low', location: 'Hostel Gate 1', description: 'Card reader firmware updated for evening entry logging.', status: 'investigating' },
    { incidentNo: 'SAF-2026-004', title: 'UPS Battery Bank Thermal Inspection', severity: 'Medium', location: 'Server & DGX-2 Room', description: 'Checked ambient cooling at 20°C; backup runtime verified at 45 mins.', status: 'resolved' },
    { incidentNo: 'SAF-2026-005', title: 'Emergency First-Aid Kit Replenishment', severity: 'Low', location: 'Robotics & 3D Printing Lab', description: 'Restocked burn gel, sterile gauze, and eyewash bottles.', status: 'reported' }
  ];
  for (const saf of safetySeeds) {
    await SafetyIncident.updateOne(
      { incidentNo: saf.incidentNo },
      { $setOnInsert: { ...saf, reportedByUserId: userMap.HOSTEL_WARDEN._id } },
      { upsert: true }
    );
  }

  // 16. Additional Campus Notices (Total 6) & In-App Notifications across users
  const extraAnnouncements = [
    { code: 'ANN-2026-004', title: 'Odd Semester End-Term Examination Schedule Released (Dec 2026)', titleHi: 'ऑड सेमेस्टर अंतिम परीक्षा समय सारणी जारी (दिसंबर 2026)', content: 'End-semester examinations for M.Tech & Ph.D. coursework commence from 14 Dec 2026. Download admit cards from the Exams & LMS portal.', contentHi: 'एम.टेक एवं पीएचडी की अंतिम सेमेस्टर परीक्षाएं 14 दिसंबर 2026 से प्रारंभ होंगी।', category: 'Examinations', priority: 'High' },
    { code: 'ANN-2026-005', title: 'Campus Placement Drives Open: Tata Elxsi, HAL & Bharat Semiconductor', titleHi: 'कैंपस प्लेसमेंट ड्राइव प्रारंभ: टाटा एलेक्सी, एचएएल एवं भारत सेमीकंडक्टर', content: 'Eligible final-year M.Tech students with CGPA >= 7.5 may register online via the Placement & Alumni module before 30 Nov 2026.', contentHi: 'योग्य अंतिम वर्ष के छात्र 30 नवंबर 2026 से पूर्व प्लेसमेंट पोर्टल पर आवेदन करें।', category: 'Placements', priority: 'High' },
    { code: 'ANN-2026-006', title: 'Face Recognition & QR Smart Attendance Enabled for Odd Semester', titleHi: 'ऑड सेमेस्टर हेतु फेस रिकग्निशन एवं क्यूआर स्मार्ट उपस्थिति सक्रिय', content: 'Students and faculty can now enroll privacy-preserving face vectors under Mark Attendance or use penalty-free QR session tokens.', contentHi: 'छात्र और शिक्षक अब उपस्थिति दर्ज करें मॉड्यूल के माध्यम से फेस रिकग्निशन या क्यूआर टोकन का उपयोग कर सकते हैं।', category: 'Campus Operations', priority: 'Normal' }
  ];
  for (const ann of extraAnnouncements) {
    await Announcement.updateOne(
      { code: ann.code },
      {
        $set: {
          ...ann,
          isPublic: true,
          authorId: userMap.COLLEGE_ADMIN._id,
          authorName: userMap.COLLEGE_ADMIN.name
        }
      },
      { upsert: true }
    );
  }

  // Seed ALL 21 Official CAS Faculty Members verified from https://cas.res.in/faculty.html
  for (const cf of CAS_OFFICIAL_FACULTY) {
    const dept = depts[cf.deptCode] || depts.CSE;
    const fUser = await User.findOneAndUpdate(
      { email: cf.email },
      {
        $setOnInsert: {
          email: cf.email,
          name: cf.name,
          passwordHash,
          status: 'active',
          preferences: { theme: 'light', accentColor: '#3587A4', language: 'en' }
        }
      },
      { upsert: true, new: true }
    );
    const assignedRole = cf.roleKey || 'FACULTY';
    await RoleAssignment.updateOne(
      { userId: fUser._id, roleKey: assignedRole },
      {
        $setOnInsert: {
          userId: fUser._id,
          roleKey: assignedRole,
          scope: { departmentIds: [dept._id], programIds: [], subjectIds: [], hostelIds: [] },
          isPrimary: true,
          active: true
        }
      },
      { upsert: true }
    );

    const empDoc = await Employee.findOneAndUpdate(
      { employeeCode: cf.employeeCode },
      {
        $set: {
          userId: fUser._id,
          name: cf.name,
          email: cf.email,
          employeeType: 'Faculty',
          departmentId: dept._id,
          deptCode: cf.deptCode,
          designation: cf.designation,
          administrativeRoles: cf.administrativeRoles,
          qualification: cf.qualification,
          specialization: cf.specialization,
          areasOfInterest: cf.areasOfInterest,
          bio: cf.bio,
          photoUrl: cf.photoUrl,
          publicationsCount: cf.publicationsCount,
          googleScholarUrl: cf.googleScholarUrl || '',
          scopusUrl: cf.scopusUrl || '',
          orcidUrl: cf.orcidUrl || '',
          researchGateUrl: cf.researchGateUrl || '',
          publicationsPdfUrl: cf.publicationsPdfUrl || '',
          profilePageUrl: cf.profilePageUrl || '',
          status: 'Active',
          isSyntheticPlaceholder: false
        },
        $setOnInsert: {
          employeeCode: cf.employeeCode,
          baseSalaryInr: cf.baseSalaryInr,
          hraInr: Math.round(cf.baseSalaryInr * 0.2),
          daInr: Math.round(cf.baseSalaryInr * 0.14),
          deductionsInr: Math.round(cf.baseSalaryInr * 0.11)
        }
      },
      { upsert: true, new: true }
    );
    await User.findByIdAndUpdate(fUser._id, { $set: { linkedEmployeeId: empDoc._id } });
  }

  // Enrich Courses & Timetable with official CAS faculty instructors from cas.res.in/faculty.html
  const casSubjects = [
    { code: 'CS-503', name: 'Distributed & Mobile Real-Time Databases', nameHi: 'वितरित एवं रियल-टाइम डेटाबेस', departmentId: depts.CSE._id, semesterNumber: 2, credits: 4, syllabusProgressPct: 74, facultyName: 'Mrs. Divya Gupta' },
    { code: 'CS-504', name: 'Cryptography, Network Security & Data Analytics', nameHi: 'क्रिप्टोग्राफी एवं नेटवर्क सुरक्षा', departmentId: depts.CSE._id, semesterNumber: 2, credits: 4, syllabusProgressPct: 71, facultyName: 'Mrs. Pushpanjali Pandey' },
    { code: 'CS-505', name: 'Natural Language Processing & Wireless Networks', nameHi: 'नेचुरल लैंग्वेज प्रोसेसिंग', departmentId: depts.CSE._id, semesterNumber: 3, credits: 4, syllabusProgressPct: 76, facultyName: 'Mrs. Sneh Lata Singh' },
    { code: 'NT-502', name: 'Organic Electronics, VLSI & Thin-Film Transistors', nameHi: 'ऑर्गेनिक इलेक्ट्रॉनिक्स एवं वीएलएसआई', departmentId: depts.NANO._id, semesterNumber: 2, credits: 4, syllabusProgressPct: 68, facultyName: 'Dr. Shagun Pal' },
    { code: 'NT-503', name: 'Optical Sensors, Plasmonics & 2D Metamaterials', nameHi: 'ऑप्टिकल सेंसर एवं प्लाज़्मोनिक्स', departmentId: depts.NANO._id, semesterNumber: 3, credits: 4, syllabusProgressPct: 72, facultyName: 'Dr. Narendra Pal' },
    { code: 'PH-501', name: 'Photonic Crystals & Optical Biosensors', nameHi: 'फोटोनिक क्रिस्टल एवं ऑप्टिकल बायोसेंसर', departmentId: depts.BTECH._id, semesterNumber: 1, credits: 4, syllabusProgressPct: 80, facultyName: 'Dr. Asish Kumar' }
  ];
  for (const s of casSubjects) {
    await Subject.updateOne({ code: s.code }, { $set: s }, { upsert: true });
  }

  for (const { user, student } of allStudents) {
    if (!(await Notification.exists({ userId: user._id, title: 'Welcome to CAS ERP Odd Semester 2026-27' }))) {
      await Notification.create({
        userId: user._id,
        title: 'Welcome to CAS ERP Odd Semester 2026-27',
        body: `Hello ${student.name} (${student.rollNumber}), your timetable, fee ledger, LMS materials, and Mark Attendance portal are active.`,
        category: 'academic',
        channel: 'in_app'
      });
    }
  }
}

// Run standalone CLI seed when invoked directly
const isDirectRun =
  process.argv[1] && fileURLToPath(import.meta.url).toLowerCase() === process.argv[1].toLowerCase();

if (isDirectRun) {
  connectDatabase(env.MONGODB_URI)
    .then(async () => {
      await ensureBaselineSeed();
      await seedFullSyntheticDataset();
      console.log('CAS ERP synthetic seed complete.');
      await disconnectDatabase();
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}
