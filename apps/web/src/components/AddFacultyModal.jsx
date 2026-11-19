import React, { useState } from 'react';
import { useERP } from '../context/ERPContext.jsx';
import { api } from '../services/apiClient.js';
import { X, UserCheck } from 'lucide-react';

export const AddFacultyModal = ({ onClose }) => {
  const { departments, refreshAll, showToast } = useERP();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    employeeType: 'Faculty',
    deptCode: departments[0]?.code || 'CSE',
    designation: 'Assistant Professor',
    qualification: '',
    specialization: '',
    baseSalaryInr: 75000
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await api.post('/academics/employees', {
        ...form,
        baseSalaryInr: Number(form.baseSalaryInr)
      });
      await refreshAll();
      showToast(`Employee ${res.employee.name} (${res.employee.employeeCode}) added.`);
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
            <UserCheck size={20} color="var(--palette-cyan)" />
            <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Onboard Faculty / Staff Member</h3>
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
                <label className="input-label">Email *</label>
                <input type="email" className="input-field" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="input-group">
                <label className="input-label">Department *</label>
                <select className="select-field" value={form.deptCode} onChange={(e) => setForm({ ...form, deptCode: e.target.value })}>
                  {departments.map((d) => (
                    <option key={d.code} value={d.code}>{d.code} — {d.name}</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Employee Type</label>
                <select className="select-field" value={form.employeeType} onChange={(e) => setForm({ ...form, employeeType: e.target.value })}>
                  <option value="Faculty">Faculty</option>
                  <option value="Administrative">Administrative</option>
                  <option value="Technical">Technical</option>
                  <option value="Support">Support</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="input-group">
                <label className="input-label">Designation *</label>
                <input className="input-field" required value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Base Salary (₹/mo)</label>
                <input type="number" min="0" className="input-field" value={form.baseSalaryInr} onChange={(e) => setForm({ ...form, baseSalaryInr: e.target.value })} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn btn-primary btn-sm">
              {saving ? 'Saving...' : 'Create Employee Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
