import React, { useState } from 'react';
import { useERP } from '../context/ERPContext.jsx';
import { api } from '../services/apiClient.js';
import { X, UserPlus } from 'lucide-react';

export const EnrollStudentModal = ({ onClose }) => {
  const { departments, refreshAll, showToast } = useERP();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    rollNumber: '',
    deptCode: departments[0]?.code || 'CSE',
    programCode: 'MTECH-CSE',
    semesterNumber: 1,
    batch: '2026 - 2030',
    totalFeeAssessedInr: 165000,
    guardianName: '',
    guardianPhone: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await api.post('/academics/students', {
        ...form,
        semesterNumber: Number(form.semesterNumber),
        totalFeeAssessedInr: Number(form.totalFeeAssessedInr)
      });
      await refreshAll();
      showToast(`Student ${res.student.name} (${res.student.rollNumber}) enrolled.`);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={20} color="var(--palette-cyan)" />
            <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Enroll Student Record</h3>
          </div>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-icon" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {error && <div style={{ color: 'var(--danger)', fontSize: '0.82rem' }}>{error}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="input-group">
                <label className="input-label">Full Name *</label>
                <input className="input-field" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Roll Number / PRN *</label>
                <input className="input-field" required placeholder="26BCE1001" value={form.rollNumber} onChange={(e) => setForm({ ...form, rollNumber: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="input-group">
                <label className="input-label">Institutional Email *</label>
                <input type="email" className="input-field" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Phone</label>
                <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div className="input-group">
                <label className="input-label">Department *</label>
                <select className="select-field" value={form.deptCode} onChange={(e) => setForm({ ...form, deptCode: e.target.value })}>
                  {departments.map((d) => (
                    <option key={d.code} value={d.code}>{d.code}</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Semester *</label>
                <input type="number" min="1" max="12" className="input-field" value={form.semesterNumber} onChange={(e) => setForm({ ...form, semesterNumber: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Assessed Fee (₹)</label>
                <input type="number" min="0" className="input-field" value={form.totalFeeAssessedInr} onChange={(e) => setForm({ ...form, totalFeeAssessedInr: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="input-group">
                <label className="input-label">Guardian Name</label>
                <input className="input-field" value={form.guardianName} onChange={(e) => setForm({ ...form, guardianName: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Guardian Phone</label>
                <input className="input-field" value={form.guardianPhone} onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn btn-primary btn-sm">
              {saving ? 'Saving...' : 'Save Student Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
