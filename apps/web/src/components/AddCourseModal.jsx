import React, { useState } from 'react';
import { useERP } from '../context/ERPContext.jsx';
import { api } from '../services/apiClient.js';
import { X, BookOpen } from 'lucide-react';

export const AddCourseModal = ({ onClose }) => {
  const { departments, refreshAll, showToast } = useERP();
  const [form, setForm] = useState({
    code: '',
    name: '',
    nameHi: '',
    departmentId: departments[0]?._id || '',
    semesterNumber: 1,
    credits: 4,
    subjectType: 'Theory',
    facultyName: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await api.post('/org/subjects', {
        ...form,
        departmentId: form.departmentId || departments[0]?._id,
        semesterNumber: Number(form.semesterNumber),
        credits: Number(form.credits)
      });
      await refreshAll();
      showToast(`Subject ${res.subject.code} registered.`);
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
            <BookOpen size={20} color="var(--palette-cyan)" />
            <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Register Configurable Subject</h3>
          </div>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-icon" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {error && <div style={{ color: 'var(--danger)', fontSize: '0.82rem' }}>{error}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
              <div className="input-group">
                <label className="input-label">Subject Code *</label>
                <input className="input-field" required placeholder="CS-504" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Subject Name (EN) *</label>
                <input className="input-field" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Subject Name (Hindi)</label>
              <input className="input-field" value={form.nameHi} onChange={(e) => setForm({ ...form, nameHi: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div className="input-group">
                <label className="input-label">Department *</label>
                <select className="select-field" value={form.departmentId || departments[0]?._id || ''} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.code}</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Semester *</label>
                <input type="number" min="1" max="12" className="input-field" value={form.semesterNumber} onChange={(e) => setForm({ ...form, semesterNumber: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Credits *</label>
                <input type="number" min="0" max="20" className="input-field" value={form.credits} onChange={(e) => setForm({ ...form, credits: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="input-group">
                <label className="input-label">Type</label>
                <select className="select-field" value={form.subjectType} onChange={(e) => setForm({ ...form, subjectType: e.target.value })}>
                  <option value="Theory">Theory</option>
                  <option value="Practical">Practical</option>
                  <option value="Project">Project</option>
                  <option value="Audit">Audit</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Assigned Faculty Name</label>
                <input className="input-field" value={form.facultyName} onChange={(e) => setForm({ ...form, facultyName: e.target.value })} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn btn-primary btn-sm">
              {saving ? 'Saving...' : 'Add Subject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
