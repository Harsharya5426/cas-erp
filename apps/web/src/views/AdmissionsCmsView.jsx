import React, { useState, useEffect, useCallback } from 'react';
import { useERP } from '../context/ERPContext.jsx';
import { api } from '../services/apiClient.js';
import { PageHeader, StatusBadge } from '../components/UiPrimitives.jsx';
import { UserPlus, CheckCircle2, Globe } from 'lucide-react';

export const AdmissionsCmsView = () => {
  const { can, refreshAll, showToast } = useERP();
  const [applicants, setApplicants] = useState([]);
  const [cmsForm, setCmsForm] = useState({ slug: 'home', title: '', titleHi: '', summary: '', body: '', bodyHi: '', published: true });

  const loadData = useCallback(() => {
    if (can('admissions', 'view')) {
      api.get('/admissions/applicants').then((d) => setApplicants(d.applicants || [])).catch(() => {});
    }
    api.get('/public/cms/home').then((d) => {
      if (d.page) setCmsForm(d.page);
    }).catch(() => {});
  }, [can]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTransition = async (id, targetStatus) => {
    try {
      await api.post(`/admissions/applicants/${id}/transition`, { targetStatus });
      showToast(`Application moved to ${targetStatus}.`);
      loadData();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleEnroll = async (id) => {
    try {
      const res = await api.post(`/admissions/applicants/${id}/enroll`, { initialFeeInr: 165000 });
      showToast(`Applicant converted to Student ${res.student.rollNumber}!`);
      loadData();
      refreshAll();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleSaveCms = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admissions/cms/${cmsForm.slug || 'home'}`, cmsForm);
      showToast('Public CMS page updated.');
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Admissions Workflow & Public Website CMS"
        subtitle="Verify documents, review merit eligibility, approve seats, enroll students, and manage bilingual CMS pages"
      />

      {can('admissions', 'view') && (
        <div className="erp-card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.05rem', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <UserPlus size={17} color="var(--palette-cyan)" /> Admission Applications ({applicants.length})
          </h2>
          <div className="table-container">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Application No</th>
                  <th>Applicant</th>
                  <th>Dept / Program</th>
                  <th>Score (%)</th>
                  <th>Status</th>
                  <th>Workflow Actions</th>
                </tr>
              </thead>
              <tbody>
                {applicants.map((a) => (
                  <tr key={a._id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{a.applicationNo}</td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{a.fullName}</div>
                      <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{a.email}</div>
                    </td>
                    <td>{a.departmentId?.code} • {a.programCode}</td>
                    <td>{a.qualifyingScorePct}%</td>
                    <td><StatusBadge status={a.status} /></td>
                    <td style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {can('admissions', 'submit') && a.status === 'submitted' && (
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleTransition(a._id, 'docs_verified')}>
                          Verify Docs
                        </button>
                      )}
                      {can('admissions', 'approve') && (a.status === 'docs_verified' || a.status === 'merit_shortlisted') && (
                        <button type="button" className="btn btn-success btn-sm" onClick={() => handleTransition(a._id, 'approved')}>
                          Approve Seat
                        </button>
                      )}
                      {can('admissions', 'approve') && a.status === 'approved' && (
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => handleEnroll(a._id)}>
                          <CheckCircle2 size={14} /> Enroll Student
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {can('cms', 'edit') && (
        <form onSubmit={handleSaveCms} className="erp-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <h2 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Globe size={17} color="var(--palette-cyan)" /> Public Website CMS (`home`)
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <input className="input-field" placeholder="Title (EN)" value={cmsForm.title || ''} onChange={(e) => setCmsForm({ ...cmsForm, title: e.target.value })} />
            <input className="input-field" placeholder="Title (HI)" value={cmsForm.titleHi || ''} onChange={(e) => setCmsForm({ ...cmsForm, titleHi: e.target.value })} />
          </div>
          <textarea className="input-field" rows="3" placeholder="Body (EN)" value={cmsForm.body || ''} onChange={(e) => setCmsForm({ ...cmsForm, body: e.target.value })} />
          <textarea className="input-field" rows="2" placeholder="Body (HI)" value={cmsForm.bodyHi || ''} onChange={(e) => setCmsForm({ ...cmsForm, bodyHi: e.target.value })} />
          <button type="submit" className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }}>Save Public CMS Page</button>
        </form>
      )}
    </div>
  );
};
