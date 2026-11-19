import React, { useState, useEffect } from 'react';
import { ROLE_KEYS } from '@cas-erp/shared';
import { useERP } from '../context/ERPContext.jsx';
import { api } from '../services/apiClient.js';
import { PageHeader, StatusBadge } from '../components/UiPrimitives.jsx';
import { BarChart3, Bot, Download, UserCog, Database } from 'lucide-react';

export const ReportsAiAdminView = ({ mode }) => {
  const { can, showToast, refreshAll } = useERP();
  const [aiPrompt, setAiPrompt] = useState('Summarize current attendance shortage risks');
  const [aiDomain, setAiDomain] = useState('attendance_risk');
  const [aiResponse, setAiResponse] = useState(null);

  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', roleKey: 'FACULTY' });

  const [migJson, setMigJson] = useState('[\n  { "code": "CIVIL", "name": "Civil Engineering", "annualBudgetInr": 9500000 }\n]');
  const [migMode, setMigMode] = useState('dry_run');
  const [migBatches, setMigBatches] = useState([]);

  useEffect(() => {
    if (mode === 'rbacAdmin') {
      if (can('rbac', 'view')) api.get('/rbac/roles').then((d) => setRoles(d.roles || [])).catch(() => {});
      if (can('identity', 'view')) api.get('/rbac/users').then((d) => setUsers(d.users || [])).catch(() => {});
      if (can('migration', 'view')) api.get('/org/migration/batches').then((d) => setMigBatches(d.batches || [])).catch(() => {});
    }
  }, [mode, can]);

  const handleExport = async (dataset) => {
    try {
      const res = await api.post('/reports/export', { dataset, format: 'csv' });
      const blob = new Blob([res.csv || ''], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cas_${dataset}_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Exported ${res.rowCount} rows (bulk export logged to audit trail).`);
    } catch (err) { showToast(err.message, 'danger'); }
  };

  const handleAskAi = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/reports/ai/assist', { prompt: aiPrompt, contextDomain: aiDomain });
      setAiResponse(res);
    } catch (err) { showToast(err.message, 'danger'); }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/rbac/users', newUser);
      showToast(`Provisioned ${newUser.email} as ${newUser.roleKey}.`);
      setNewUser({ name: '', email: '', password: '', roleKey: 'FACULTY' });
      api.get('/rbac/users').then((d) => setUsers(d.users || [])).catch(() => {});
    } catch (err) { showToast(err.message, 'danger'); }
  };

  const handleRunMigration = async (e) => {
    e.preventDefault();
    try {
      const rows = JSON.parse(migJson);
      const res = await api.post('/org/migration/batches', {
        sourceSystem: 'LEGACY_ERP_EXTRACT',
        entityType: 'departments',
        mode: migMode,
        rows
      });
      showToast(`Migration ${migMode}: ${res.batch.validRows} valid, ${res.batch.rejectedRows} rejected.`);
      api.get('/org/migration/batches').then((d) => setMigBatches(d.batches || [])).catch(() => {});
      if (migMode === 'committed') refreshAll();
    } catch (err) { showToast(err.message, 'danger'); }
  };

  if (mode === 'rbacAdmin') {
    return (
      <div className="page-wrapper">
        <PageHeader
          title="12-Role RBAC Templates, User Provisioning & Legacy Migration"
          subtitle="Configurable role policies, user-role assignments, and checksum-verified migration dry-runs"
        />

        {can('identity', 'manage-users') && (
          <form onSubmit={handleCreateUser} className="erp-card" style={{ marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <UserCog size={17} color="var(--palette-cyan)" /> Provision Institutional User
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.65rem' }}>
              <input className="input-field" placeholder="Full Name" required value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
              <input type="email" className="input-field" placeholder="Email (@cas.res.in)" required value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
              <input type="password" className="input-field" placeholder="Initial Password (8+ chars)" required value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
              <select className="select-field" value={newUser.roleKey} onChange={(e) => setNewUser({ ...newUser, roleKey: e.target.value })}>
                {ROLE_KEYS.map((rk) => <option key={rk} value={rk}>{rk}</option>)}
              </select>
              <button type="submit" className="btn btn-primary btn-sm">Provision User</button>
            </div>
          </form>
        )}

        <div className="erp-card" style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.05rem', marginBottom: '0.75rem' }}>Configured Role Templates ({roles.length})</h2>
          <div className="table-container">
            <table className="erp-table">
              <thead><tr><th>Role Key</th><th>Display Name (EN / HI)</th><th>MFA Recommended</th><th>Permission Rules</th></tr></thead>
              <tbody>
                {roles.map((r) => (
                  <tr key={r.key}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{r.key}</td>
                    <td>{r.name} / {r.nameHi}</td>
                    <td>{r.requiresMfaRecommended ? 'Yes' : 'Optional'}</td>
                    <td>{r.permissions?.length || 0} modules</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {users.length > 0 && (
          <div className="erp-card" style={{ marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.05rem', marginBottom: '0.75rem' }}>Active Directory & Assigned Roles</h2>
            <div className="table-container">
              <table className="erp-table">
                <thead><tr><th>Name</th><th>Email</th><th>Assigned Role(s)</th><th>MFA</th><th>Status</th></tr></thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{(u.roles || []).map((r) => r.roleKey).join(', ')}</td>
                      <td>{u.mfaEnabled ? 'Enabled' : 'Off'}</td>
                      <td><StatusBadge status={u.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {can('migration', 'create') && (
          <form onSubmit={handleRunMigration} className="erp-card">
            <h2 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Database size={17} color="var(--palette-cyan)" /> Legacy Data Migration Harness (Departments JSON)
            </h2>
            <textarea className="input-field" rows="4" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', marginBottom: '0.75rem' }} value={migJson} onChange={(e) => setMigJson(e.target.value)} />
            <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', marginBottom: '1rem' }}>
              <select className="select-field" style={{ width: 'auto' }} value={migMode} onChange={(e) => setMigMode(e.target.value)}>
                <option value="dry_run">Dry Run (Validate & Profile Only)</option>
                <option value="committed">Commit Valid Records</option>
              </select>
              <button type="submit" className="btn btn-primary btn-sm">Execute Batch</button>
            </div>
            {migBatches.length > 0 && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Last Batch: {migBatches[0].mode} • Valid: {migBatches[0].validRows} • Rejected: {migBatches[0].rejectedRows} • SHA-256: {migBatches[0].fileChecksumSha256?.slice(0, 16)}...
              </div>
            )}
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Role-Scoped Reports & Governed Advisory AI"
        subtitle="Audited CSV exports + human-reviewed AI advisory assistant (never autonomous decision-making)"
      />

      {can('reports', 'export') && (
        <div className="erp-card" style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <BarChart3 size={17} color="var(--palette-cyan)" /> Audited Institutional Exports (CSV)
          </h2>
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleExport('students')}><Download size={14} /> Students</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleExport('defaulters')}><Download size={14} /> Attendance Defaulters</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleExport('payments')}><Download size={14} /> Settled Payments</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleExport('attendance')}><Download size={14} /> Attendance Logs</button>
          </div>
        </div>
      )}

      {can('ai', 'submit') && (
        <div className="erp-card">
          <h2 style={{ fontSize: '1.05rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Bot size={18} color="var(--palette-cyan)" /> Governed AI Advisory Assistant
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--warning)', marginBottom: '0.85rem' }}>
            Advisory Notice: Outputs require human review and cannot autonomously decide grades, admissions, finance, or grievances.
          </p>
          <form onSubmit={handleAskAi} style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <select className="select-field" style={{ width: 'auto' }} value={aiDomain} onChange={(e) => setAiDomain(e.target.value)}>
              <option value="attendance_risk">Attendance Risk Insights</option>
              <option value="general_helpdesk">Governance & Helpdesk</option>
              <option value="timetable_advice">Timetable Guidance</option>
            </select>
            <input className="input-field" style={{ flex: 1, minWidth: '220px' }} value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} />
            <button type="submit" className="btn btn-primary btn-sm">Run Advisory Query</button>
          </form>

          {aiResponse && (
            <div style={{ padding: '0.9rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', fontSize: '0.84rem' }}>
              <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.4rem' }}>
                <span className="badge badge-warning">ADVISORY ONLY</span>
                <span className="badge badge-info">{aiResponse.modelMetadata?.provider}</span>
              </div>
              <p style={{ marginBottom: '0.5rem' }}>{aiResponse.summary}</p>
              {aiResponse.citations?.length > 0 && (
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  Citations: {aiResponse.citations.map((c) => `${c.rollNumber} (${c.attendancePct}%)`).join(', ')}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

