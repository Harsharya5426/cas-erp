import React, { useState } from 'react';
import { useERP } from '../context/ERPContext.jsx';
import { api } from '../services/apiClient.js';
import { X, BellRing } from 'lucide-react';

export const BroadcastModal = ({ onClose }) => {
  const { refreshAll, showToast } = useERP();
  const [form, setForm] = useState({
    title: '',
    titleHi: '',
    content: '',
    contentHi: '',
    category: 'Academic Circular',
    priority: 'Normal',
    targetRole: 'ALL',
    isPublic: false
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/notifications/announcements', form);
      await refreshAll();
      showToast('Campus announcement published.');
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
            <BellRing size={20} color="var(--warning)" />
            <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Publish Official Notice / Circular</h3>
          </div>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-icon" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {error && <div style={{ color: 'var(--danger)', fontSize: '0.82rem' }}>{error}</div>}
            <div className="input-group">
              <label className="input-label">Title (English) *</label>
              <input className="input-field" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="input-group">
              <label className="input-label">Title (Hindi)</label>
              <input className="input-field" value={form.titleHi} onChange={(e) => setForm({ ...form, titleHi: e.target.value })} />
            </div>
            <div className="input-group">
              <label className="input-label">Circular Body (English) *</label>
              <textarea className="input-field" rows="3" required value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div className="input-group">
                <label className="input-label">Priority</label>
                <select className="select-field" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Target Role</label>
                <select className="select-field" value={form.targetRole} onChange={(e) => setForm({ ...form, targetRole: e.target.value })}>
                  <option value="ALL">All Campus Roles</option>
                  <option value="STUDENT">Students</option>
                  <option value="FACULTY">Faculty</option>
                  <option value="PARENT">Parents</option>
                </select>
              </div>
              <div className="input-group" style={{ justifyContent: 'flex-end' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.isPublic} onChange={(e) => setForm({ ...form, isPublic: e.target.checked })} />
                  Show on Public Website
                </label>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn btn-primary btn-sm">
              {saving ? 'Publishing...' : 'Publish Circular'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
