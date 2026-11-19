import React, { useState, useEffect, useCallback } from 'react';
import { useERP } from '../context/ERPContext.jsx';
import { api } from '../services/apiClient.js';
import { formatINR } from '../utils/formatters.js';
import { PageHeader, StatusBadge } from '../components/UiPrimitives.jsx';
import { FacultyDirectoryGrid } from '../components/FacultyDirectoryGrid.jsx';
import { UserCheck, Wallet, CheckCircle2 } from 'lucide-react';

export const FacultyView = ({ onOpenAddFaculty }) => {
  const { employees, publicFaculty, can, showToast } = useERP();
  const [payrollRuns, setPayrollRuns] = useState([]);
  const [monthKey, setMonthKey] = useState('2026-11');

  const loadPayroll = useCallback(() => {
    if (can('payroll', 'view')) {
      api.get('/hr/payroll').then((d) => setPayrollRuns(d.payrollRuns || [])).catch(() => {});
    }
  }, [can]);

  useEffect(() => {
    loadPayroll();
  }, [loadPayroll]);

  const handlePreparePayroll = async () => {
    try {
      const res = await api.post('/hr/payroll/prepare', { monthKey });
      showToast(`Prepared ${res.createdCount} payroll draft(s) for ${monthKey}.`);
      loadPayroll();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleApprovePayroll = async (id) => {
    try {
      await api.post(`/hr/payroll/${id}/approve`);
      showToast('Payroll approved with segregation-of-duties verification.');
      loadPayroll();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  return (
    <div className="page-wrapper">
      <PageHeader
        title="CAS Faculty Directory, Staff HR & Payroll"
        subtitle="Official CAS AKTU faculty profiles from cas.res.in/faculty.html, employee records, and dual-control payroll"
        actions={
          can('faculty', 'create') && (
            <button type="button" onClick={onOpenAddFaculty} className="btn btn-primary btn-sm">
              <UserCheck size={15} /> Onboard Employee
            </button>
          )
        }
      />

      <FacultyDirectoryGrid
        faculty={publicFaculty}
        title="CAS Current Faculty Directory"
        subtitle="Verified faculty roster from https://cas.res.in/faculty.html with qualifications, research interests & Scholar/Scopus links"
      />

      {can('faculty', 'view') && employees.length > 0 && (
        <div className="table-container" style={{ marginBottom: '1.5rem' }}>
          <table className="erp-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Type / Dept</th>
                <th>Designation</th>
                <th>Gross Base + Allow.</th>
                <th>Leave Balances (CL/SL/EL)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e._id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--palette-cyan)' }}>{e.employeeCode}</td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{e.name}</div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{e.email}</div>
                  </td>
                  <td>{e.employeeType} • {e.deptCode}</td>
                  <td>{e.designation}</td>
                  <td>{formatINR((e.baseSalaryInr || 0) + (e.hraInr || 0) + (e.daInr || 0))}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                    {e.leaveBalances?.CL ?? 0} / {e.leaveBalances?.SL ?? 0} / {e.leaveBalances?.EL ?? 0}
                  </td>
                  <td><StatusBadge status={e.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {can('payroll', 'view') && (
        <section className="erp-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Wallet size={18} color="var(--success)" /> Payroll Runs & Payslips
            </h2>
            {can('payroll', 'create') && (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input type="month" className="input-field" value={monthKey} onChange={(e) => setMonthKey(e.target.value)} style={{ width: 'auto' }} />
                <button type="button" className="btn btn-primary btn-sm" onClick={handlePreparePayroll}>
                  Prepare Monthly Payroll
                </button>
              </div>
            )}
          </div>

          <div className="table-container">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Payroll No</th>
                  <th>Month</th>
                  <th>Employee</th>
                  <th>Gross</th>
                  <th>Deductions</th>
                  <th>Net Pay</th>
                  <th>Status</th>
                  {can('payroll', 'approve') && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {payrollRuns.map((pr) => (
                  <tr key={pr._id}>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{pr.payrollNo}</td>
                    <td>{pr.monthKey}</td>
                    <td>{pr.employeeName} ({pr.employeeCode})</td>
                    <td>{formatINR(pr.grossInr)}</td>
                    <td>{formatINR(pr.deductionsInr)}</td>
                    <td style={{ fontWeight: 700, color: 'var(--success)' }}>{formatINR(pr.netInr)}</td>
                    <td><StatusBadge status={pr.status} /></td>
                    {can('payroll', 'approve') && (
                      <td>
                        {pr.status === 'draft' && (
                          <button type="button" className="btn btn-success btn-sm" onClick={() => handleApprovePayroll(pr._id)}>
                            <CheckCircle2 size={14} /> Approve
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};
