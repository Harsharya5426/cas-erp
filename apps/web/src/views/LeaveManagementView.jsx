import React, { useState, useEffect } from 'react';
import { LEAVE_CATEGORIES } from '@cas-erp/shared';
import { useERP } from '../context/ERPContext.jsx';
import { api } from '../services/apiClient.js';
import { formatDateIST } from '../utils/formatters.js';
import { PageHeader, StatusBadge } from '../components/UiPrimitives.jsx';
import { CalendarOff, CheckCircle2, XCircle } from 'lucide-react';

export const LeaveManagementView = () => {
  const { authContext, can, currentRole, showToast } = useERP();
  const [requests, setRequests] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [form, setForm] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      applicantType: authContext?.linkedStudentId ? 'student' : 'employee',
      leaveType: authContext?.linkedStudentId ? 'MEDICAL' : 'CL',
      fromDate: today,
      toDate: today,
      halfDay: false,
      urgency: 'normal',
      reason: '',
      isHostelOutpass: false,
      parentApprovalRequired: false
    };
  });

  const loadLeave = () => {
    api.get('/hr/leave/requests').then((d) => setRequests(d.requests || [])).catch(() => {});
    api.get('/hr/holidays').then((d) => setHolidays(d.holidays || [])).catch(() => {});
  };

  useEffect(() => {
    loadLeave();
  }, []);

  const categories =
    form.applicantType === 'student' ? LEAVE_CATEGORIES.STUDENT : LEAVE_CATEGORIES.EMPLOYEE;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/hr/leave/requests', form);
      showToast('Leave / outpass request submitted to configured approval workflow.');
      setForm({ ...form, reason: '' });
      loadLeave();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleDecision = async (id, decision) => {
    try {
      await api.post(`/hr/leave/requests/${id}/decision`, { decision });
      showToast(`Leave request ${decision}.`);
      loadLeave();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Unified Employee & Student Leave / Hostel Outpass"
        subtitle="Configurable leave categories, balance deduction, parent consent flags, and holiday calendar"
      />

      <div className="card-grid-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {can('leave', 'create') && currentRole !== 'PARENT' && (
          <form onSubmit={handleSubmit} className="erp-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <h2 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <CalendarOff size={17} color="var(--palette-cyan)" /> Apply for Leave / Outpass
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <select className="select-field" value={form.applicantType} onChange={(e) => setForm({ ...form, applicantType: e.target.value })}>
                <option value="student">Student Leave / Outpass</option>
                <option value="employee">Employee HR Leave</option>
              </select>
              <select className="select-field" value={form.leaveType} onChange={(e) => setForm({ ...form, leaveType: e.target.value })}>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.labelEn}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <input type="date" className="input-field" value={form.fromDate} onChange={(e) => setForm({ ...form, fromDate: e.target.value })} />
              <input type="date" className="input-field" value={form.toDate} onChange={(e) => setForm({ ...form, toDate: e.target.value })} />
            </div>
            <textarea className="input-field" rows="2" required placeholder="Reason / supporting details..." value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <input type="checkbox" checked={form.halfDay} onChange={(e) => setForm({ ...form, halfDay: e.target.checked })} /> Half-day
              </label>
              {form.applicantType === 'student' && (
                <>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <input type="checkbox" checked={form.isHostelOutpass} onChange={(e) => setForm({ ...form, isHostelOutpass: e.target.checked })} /> Hostel Outpass
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <input type="checkbox" checked={form.parentApprovalRequired} onChange={(e) => setForm({ ...form, parentApprovalRequired: e.target.checked })} /> Require Parent Approval
                  </label>
                </>
              )}
            </div>
            <button type="submit" className="btn btn-primary btn-sm">Submit Leave Request</button>
          </form>
        )}

        <div className="erp-card">
          <h2 style={{ fontSize: '1.05rem', marginBottom: '0.75rem' }}>Institutional Holiday Calendar</h2>
          {holidays.map((h) => (
            <div key={h._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>
              <span>{h.name}</span>
              <span style={{ color: 'var(--text-muted)' }}>{formatDateIST(h.date)} ({h.type})</span>
            </div>
          ))}
        </div>
      </div>

      <div className="erp-card">
        <h2 style={{ fontSize: '1.05rem', marginBottom: '0.85rem' }}>Leave & Outpass Queue</h2>
        <div className="table-container">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Request No</th>
                <th>Applicant</th>
                <th>Type / Dates</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
                {can('leave', 'approve') && <th>Decision</th>}
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r._id}>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{r.requestNo}</td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{r.applicantName}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{r.applicantType.toUpperCase()} • {r.applicantCode}</div>
                  </td>
                  <td>
                    <div>{r.leaveType} {r.isHostelOutpass ? '(Outpass)' : ''}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {formatDateIST(r.fromDate)} → {formatDateIST(r.toDate)}
                    </div>
                  </td>
                  <td>{r.days}</td>
                  <td style={{ maxWidth: '240px', fontSize: '0.8rem' }}>{r.reason}</td>
                  <td><StatusBadge status={r.status} /></td>
                  {can('leave', 'approve') && (
                    <td style={{ display: 'flex', gap: '0.35rem' }}>
                      {r.status === 'pending' && (
                        <>
                          <button type="button" className="btn btn-success btn-sm" onClick={() => handleDecision(r._id, 'approved')}>
                            <CheckCircle2 size={14} /> Approve
                          </button>
                          <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDecision(r._id, 'rejected')}>
                            <XCircle size={14} /> Reject
                          </button>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
