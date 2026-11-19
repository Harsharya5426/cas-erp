import React, { useState, useEffect } from 'react';
import { api } from '../services/apiClient.js';
import { formatDateTimeIST } from '../utils/formatters.js';
import { PageHeader, StatusBadge } from '../components/UiPrimitives.jsx';
import { ShieldCheck, Search } from 'lucide-react';

export const AuditLogsView = () => {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');

  useEffect(() => {
    const params = new URLSearchParams({ limit: '50' });
    if (category !== 'ALL') params.set('category', category);
    if (search) params.set('search', search);
    api.get(`/rbac/audit-events?${params.toString()}`).then((d) => setEvents(d.events || [])).catch(() => {});
  }, [search, category]);

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Immutable Security & Operations Audit Trail"
        subtitle="Append-only AuditEvent records enforced at the Mongoose database layer"
        actions={
          <span className="badge badge-success" style={{ gap: '0.35rem', padding: '0.4rem 0.75rem' }}>
            <ShieldCheck size={14} /> Append-Only Enforced
          </span>
        }
      />

      <div className="erp-card" style={{ marginBottom: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div className="input-with-icon" style={{ flex: 1, minWidth: '220px' }}>
          <span className="icon-prefix"><Search size={15} /></span>
          <input className="input-field" placeholder="Search actor, action, resource..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="select-field" style={{ width: 'auto' }} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="ALL">All Categories</option>
          <option value="identity">Identity / Auth</option>
          <option value="rbac">RBAC / Access Denied</option>
          <option value="academic">Academic</option>
          <option value="admissions">Admissions</option>
          <option value="attendance">Attendance</option>
          <option value="finance">Finance & Cashfree</option>
          <option value="accounting">Accounting</option>
          <option value="exams">Exams & Results</option>
          <option value="grievance">Grievance</option>
          <option value="system">System & Exports</option>
        </select>
      </div>

      <div className="table-container">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Timestamp (IST)</th>
              <th>Actor & Role</th>
              <th>Category</th>
              <th>Action</th>
              <th>Resource</th>
              <th>Outcome</th>
            </tr>
          </thead>
          <tbody>
            {events.map((ev) => (
              <tr key={ev._id}>
                <td style={{ fontSize: '0.76rem', whiteSpace: 'nowrap' }}>{formatDateTimeIST(ev.createdAt)}</td>
                <td>
                  <div style={{ fontWeight: 700 }}>{ev.actorName}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{ev.actorRole} • {ev.actorEmail}</div>
                </td>
                <td><span className="badge badge-info">{ev.category}</span></td>
                <td>{ev.action}</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{ev.resourceType}</td>
                <td><StatusBadge status={ev.outcome === 'success' ? 'verified' : ev.outcome === 'denied' ? 'rejected' : 'failed'} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
