import React, { useState, useEffect } from 'react';
import { useERP } from '../context/ERPContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api } from '../services/apiClient.js';
import { formatDateTimeIST } from '../utils/formatters.js';
import { PageHeader } from '../components/UiPrimitives.jsx';
import { Shield, Save, KeyRound, Laptop, Palette } from 'lucide-react';

export const SettingsView = () => {
  const {
    currentUser,
    settings,
    can,
    themeMode,
    accentColor,
    ALLOWED_ACCENTS,
    updateUserPreferences,
    refreshAll,
    showToast
  } = useERP();
  const { lang } = useLanguage();

  const [instDraft, setInstDraft] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [mfaSetup, setMfaSetup] = useState(null);
  const [mfaCode, setMfaCode] = useState('');

  const instForm = instDraft ?? {
    institutionName: settings?.institutionName || '',
    activeAcademicYear: settings?.activeAcademicYear || '',
    activeSemesterLabel: settings?.activeSemesterLabel || '',
    regulatoryCode: settings?.regulatoryCode || '',
    treasuryEmail: settings?.treasuryEmail || '',
    attendanceShortageThresholdPct: settings?.attendanceShortageThresholdPct ?? 75,
    aiEnabled: settings?.aiGovernance?.enabled ?? true
  };
  const setInstForm = (next) => setInstDraft(next);

  const loadSessions = () => {
    api.get('/auth/sessions').then((d) => setSessions(d.sessions || [])).catch(() => {});
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleSaveInst = async (e) => {
    e.preventDefault();
    try {
      await api.patch('/org/settings', {
        institutionName: instForm.institutionName,
        activeAcademicYear: instForm.activeAcademicYear,
        activeSemesterLabel: instForm.activeSemesterLabel,
        regulatoryCode: instForm.regulatoryCode,
        treasuryEmail: instForm.treasuryEmail,
        attendanceShortageThresholdPct: Number(instForm.attendanceShortageThresholdPct),
        aiGovernance: { enabled: instForm.aiEnabled, advisoryOnlyEnforced: true, requireHumanReviewForActions: true }
      });
      await refreshAll();
      showToast('Institutional settings saved to MongoDB.');
    } catch (err) { showToast(err.message, 'danger'); }
  };

  const handleStartMfa = async () => {
    try {
      const res = await api.post('/auth/mfa/setup');
      setMfaSetup(res);
    } catch (err) { showToast(err.message, 'danger'); }
  };

  const handleEnableMfa = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/mfa/enable', { code: mfaCode });
      showToast('TOTP Multi-Factor Authentication enabled on your account.');
      setMfaSetup(null);
      setMfaCode('');
    } catch (err) { showToast(err.message, 'danger'); }
  };

  const handleRevokeSession = async (id) => {
    try {
      await api.delete(`/auth/sessions/${id}`);
      showToast('Session revoked.');
      loadSessions();
    } catch (err) { showToast(err.message, 'danger'); }
  };

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Platform Settings, Security & Personal Preferences"
        subtitle="Persisted theme/accent/language preferences, TOTP MFA, session revocation, and institutional governance"
      />

      <div className="card-grid-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* User Theme, Accent & Language Preferences */}
        <section className="erp-card">
          <h2 style={{ fontSize: '1.05rem', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Palette size={17} color="var(--palette-cyan)" /> Appearance & Localization
          </h2>
          <div className="input-group" style={{ marginBottom: '0.85rem' }}>
            <label className="input-label">Theme Preference</label>
            <select className="select-field" value={themeMode} onChange={(e) => updateUserPreferences({ theme: e.target.value })}>
              <option value="dark">Dark Mode</option>
              <option value="light">Light Mode</option>
              <option value="system">System Preference</option>
            </select>
          </div>
          <div className="input-group" style={{ marginBottom: '0.85rem' }}>
            <label className="input-label">Accessible Brand Accent</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {ALLOWED_ACCENTS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  aria-label={`Select accent ${hex}`}
                  onClick={() => updateUserPreferences({ accentColor: hex })}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: hex,
                    border: accentColor === hex ? '3px solid #ffffff' : '1px solid var(--border-color)',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Portal Language</label>
            <select className="select-field" value={lang} onChange={(e) => updateUserPreferences({ language: e.target.value })}>
              <option value="en">English (IN)</option>
              <option value="hi">हिन्दी (Hindi)</option>
            </select>
          </div>
        </section>

        {/* MFA & Active Sessions */}
        <section className="erp-card">
          <h2 style={{ fontSize: '1.05rem', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <KeyRound size={17} color="var(--success)" /> Security, TOTP MFA & Sessions
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            MFA Status: <strong>{currentUser?.mfaEnabled ? 'Enabled' : 'Not Enabled'}</strong>
          </p>
          {!currentUser?.mfaEnabled && !mfaSetup && (
            <button type="button" className="btn btn-primary btn-sm" onClick={handleStartMfa}>
              <Shield size={14} /> Configure TOTP Authenticator
            </button>
          )}
          {mfaSetup && (
            <form onSubmit={handleEnableMfa} style={{ padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', marginBottom: '0.85rem' }}>
              <div style={{ fontSize: '0.75rem', marginBottom: '0.35rem' }}>Secret: <code>{mfaSetup.secret}</code></div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Recovery Codes: {mfaSetup.recoveryCodes.join(' | ')}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input className="input-field" placeholder="Enter 6-digit code" required value={mfaCode} onChange={(e) => setMfaCode(e.target.value)} />
                <button type="submit" className="btn btn-success btn-sm">Verify & Enable</button>
              </div>
            </form>
          )}

          <div style={{ marginTop: '1rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Laptop size={14} /> Active Authenticated Sessions ({sessions.length})
            </div>
            {sessions.map((s) => (
              <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', padding: '0.45rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <div>
                  <div>{s.deviceLabel} • {s.activeRoleKey}</div>
                  <div style={{ color: 'var(--text-muted)' }}>Last active: {formatDateTimeIST(s.lastUsedAt)}</div>
                </div>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => handleRevokeSession(s._id)}>Revoke</button>
              </div>
            ))}
          </div>
        </section>

        {/* Institutional Settings (Admin/Principal) */}
        {can('settings', 'configure') && (
          <form onSubmit={handleSaveInst} className="erp-card" style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <h2 style={{ fontSize: '1.05rem', margin: 0 }}>Institutional Registry & Governance Switches</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
              <div className="input-group">
                <label className="input-label">Institution Name</label>
                <input className="input-field" value={instForm.institutionName} onChange={(e) => setInstForm({ ...instForm, institutionName: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Active Academic Year</label>
                <input className="input-field" value={instForm.activeAcademicYear} onChange={(e) => setInstForm({ ...instForm, activeAcademicYear: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Active Semester</label>
                <input className="input-field" value={instForm.activeSemesterLabel} onChange={(e) => setInstForm({ ...instForm, activeSemesterLabel: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Attendance Threshold (%)</label>
                <input type="number" min="0" max="100" className="input-field" value={instForm.attendanceShortageThresholdPct} onChange={(e) => setInstForm({ ...instForm, attendanceShortageThresholdPct: e.target.value })} />
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem' }}>
              <input type="checkbox" checked={instForm.aiEnabled} onChange={(e) => setInstForm({ ...instForm, aiEnabled: e.target.checked })} />
              Enable Governed Advisory-Only AI Assistant (Kill Switch)
            </label>
            <button type="submit" className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }}>
              <Save size={14} /> Persist Governance Settings
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
