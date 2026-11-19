import React, { useState, useEffect } from 'react';
import { useERP } from '../context/ERPContext.jsx';
import { api } from '../services/apiClient.js';
import { formatINR, getCGPABadge } from '../utils/formatters.js';
import { PageHeader, StatusBadge, EmptyState } from '../components/UiPrimitives.jsx';
import { Search, UserPlus, IdCard, CreditCard, ShieldCheck, ShieldOff } from 'lucide-react';

export const StudentsView = ({ onOpenEnroll, onOpenCollectFeeWithStudent, onViewStudentIDCard }) => {
  const { students, departments, can, refreshAll, showToast } = useERP();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [guardianLinks, setGuardianLinks] = useState([]);
  const [linkForm, setLinkForm] = useState({ studentId: '', guardianName: '', guardianEmail: '', relationship: 'Father' });

  const loadLinks = () => {
    api.get('/academics/guardian-links').then((d) => setGuardianLinks(d.links || [])).catch(() => {});
  };

  useEffect(() => {
    loadLinks();
  }, []);

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    const matchesQ =
      !q ||
      s.name?.toLowerCase().includes(q) ||
      s.rollNumber?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q);
    const matchesDept = deptFilter === 'ALL' || s.deptCode === deptFilter;
    return matchesQ && matchesDept;
  });

  const handleCreateGuardianLink = async (e) => {
    e.preventDefault();
    try {
      await api.post('/academics/guardian-links', {
        ...linkForm,
        studentId: linkForm.studentId || students[0]?._id
      });
      showToast('Pending guardian link created. Verify relationship to activate parent portal access.');
      setLinkForm({ studentId: '', guardianName: '', guardianEmail: '', relationship: 'Father' });
      loadLinks();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleGuardianDecision = async (id, decision) => {
    try {
      await api.post(`/academics/guardian-links/${id}/decision`, { decision });
      showToast(`Guardian link ${decision}.`);
      loadLinks();
      refreshAll();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Student Directory & Guardian Relationships"
        subtitle="MongoDB-persisted student records with role-scoped visibility and verified parent/guardian links"
        actions={
          can('students', 'create') && (
            <button type="button" onClick={onOpenEnroll} className="btn btn-primary btn-sm">
              <UserPlus size={15} /> Enroll Student
            </button>
          )
        }
      />

      <div className="erp-card" style={{ padding: '0.9rem 1.1rem', marginBottom: '1.25rem', display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
        <div className="input-with-icon" style={{ flex: 1, minWidth: '220px' }}>
          <span className="icon-prefix"><Search size={15} /></span>
          <input
            type="search"
            className="input-field"
            placeholder="Filter by name, roll number, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="select-field" style={{ width: 'auto' }} value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
          <option value="ALL">All Departments</option>
          {departments.map((d) => (
            <option key={d.code} value={d.code}>{d.code}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No student records match" description="Try clearing filters or enrolling a new student." />
      ) : (
        <div className="table-container" style={{ marginBottom: '1.5rem' }}>
          <table className="erp-table">
            <thead>
              <tr>
                <th>Roll / PRN</th>
                <th>Student</th>
                <th>Dept / Sem</th>
                <th>CGPA</th>
                <th>Attendance</th>
                <th>Fee Due</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const badge = getCGPABadge(s.cgpa);
                return (
                  <tr key={s._id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--palette-cyan)' }}>
                      {s.rollNumber}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{s.name}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{s.email}</div>
                    </td>
                    <td>
                      <div>{s.deptCode} • Sem {s.semesterNumber}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.batch}</div>
                    </td>
                    <td><span className={`badge ${badge.color}`}>{Number(s.cgpa || 0).toFixed(2)}</span></td>
                    <td>
                      <strong style={{ color: s.attendancePct < 75 ? 'var(--danger)' : 'var(--success)' }}>
                        {s.attendancePct}%
                      </strong>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{formatINR(s.dueFeeInr)}</div>
                      <StatusBadge status={s.feeStatus} />
                    </td>
                    <td><StatusBadge status={s.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => onViewStudentIDCard(s)}>
                          <IdCard size={14} /> ID
                        </button>
                        {(can('finance', 'create') || can('finance', 'submit')) && s.dueFeeInr > 0 && (
                          <button type="button" className="btn btn-success btn-sm" onClick={() => onOpenCollectFeeWithStudent(s)}>
                            <CreditCard size={14} /> Fee
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {can('students', 'edit') && (
        <section className="erp-card">
          <h2 style={{ fontSize: '1.05rem', marginBottom: '0.9rem' }}>Parent / Guardian Link Verification</h2>
          <form onSubmit={handleCreateGuardianLink} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.65rem', marginBottom: '1rem' }}>
            <select className="select-field" value={linkForm.studentId || students[0]?._id || ''} onChange={(e) => setLinkForm({ ...linkForm, studentId: e.target.value })}>
              {students.map((s) => (
                <option key={s._id} value={s._id}>{s.name} ({s.rollNumber})</option>
              ))}
            </select>
            <input className="input-field" placeholder="Guardian Name" required value={linkForm.guardianName} onChange={(e) => setLinkForm({ ...linkForm, guardianName: e.target.value })} />
            <input type="email" className="input-field" placeholder="Guardian Email" required value={linkForm.guardianEmail} onChange={(e) => setLinkForm({ ...linkForm, guardianEmail: e.target.value })} />
            <select className="select-field" value={linkForm.relationship} onChange={(e) => setLinkForm({ ...linkForm, relationship: e.target.value })}>
              <option value="Father">Father</option>
              <option value="Mother">Mother</option>
              <option value="LegalGuardian">Legal Guardian</option>
            </select>
            <button type="submit" className="btn btn-primary btn-sm">Link Guardian</button>
          </form>

          <div className="table-container">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Guardian</th>
                  <th>Student</th>
                  <th>Relation</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {guardianLinks.map((lnk) => (
                  <tr key={lnk._id}>
                    <td>{lnk.guardianUserId?.name} ({lnk.guardianUserId?.email})</td>
                    <td>{lnk.studentId?.name} ({lnk.studentId?.rollNumber})</td>
                    <td>{lnk.relationship}</td>
                    <td><StatusBadge status={lnk.verificationStatus} /></td>
                    <td style={{ display: 'flex', gap: '0.4rem' }}>
                      {lnk.verificationStatus !== 'verified' && (
                        <button type="button" className="btn btn-success btn-sm" onClick={() => handleGuardianDecision(lnk._id, 'verified')}>
                          <ShieldCheck size={14} /> Verify
                        </button>
                      )}
                      {lnk.verificationStatus !== 'revoked' && (
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => handleGuardianDecision(lnk._id, 'revoked')}>
                          <ShieldOff size={14} /> Revoke
                        </button>
                      )}
                    </td>
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
