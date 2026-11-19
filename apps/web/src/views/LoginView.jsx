import React, { useState } from 'react';
import { useERP } from '../context/ERPContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { authService } from '../services/authService.js';
import {
  Lock,
  Mail,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Languages,
  ShieldCheck,
  ShieldAlert,
  Globe,
  Sparkles
} from 'lucide-react';

const SYNTHETIC_DEMO_ACCOUNTS = [
  { label: 'Super Admin', email: 'superadmin@cas.res.in' },
  { label: 'Principal', email: 'principal@cas.res.in' },
  { label: 'College Admin', email: 'admin@cas.res.in' },
  { label: 'HOD (CSE)', email: 'hod.cse@cas.res.in' },
  { label: 'Faculty', email: 'faculty@cas.res.in' },
  { label: 'Student', email: 'student@cas.res.in' },
  { label: 'Parent', email: 'parent@cas.res.in' },
  { label: 'Accountant', email: 'accounts@cas.res.in' },
  { label: 'Admissions', email: 'admissions@cas.res.in' },
  { label: 'Exam Controller', email: 'exam@cas.res.in' },
  { label: 'Librarian', email: 'library@cas.res.in' },
  { label: 'Hostel Warden', email: 'warden@cas.res.in' }
];

export const LoginView = ({ onOpenPublicPortal }) => {
  const { loginUser, showToast, theme, toggleTheme } = useERP();
  const { toggleLanguage, t } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot password modal state
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetNotice, setResetNotice] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both institutional email and password.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const data = await loginUser({ email, password, mfaCode: mfaRequired ? mfaCode : undefined });
      showToast(`Welcome to cas.erp, ${data.user.name}`);
    } catch (err) {
      if (err.code === 'MFA_REQUIRED') {
        setMfaRequired(true);
        setError('Multi-Factor Authentication is enabled on this account. Enter your 6-digit TOTP or recovery code.');
      } else {
        setError(err.message || 'Authentication failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    try {
      await authService.requestPasswordReset(resetEmail);
      setResetNotice('If that institutional account exists, a password recovery token has been queued via the configured communications adapter.');
    } catch (err) {
      setResetNotice(err.message);
    }
  };

  return (
    <div className="aktu-portal-bg">
      {/* Dual Gradient Overlay matching erp.aktu.ac.in */}
      <div className="aktu-portal-overlay" aria-hidden="true" />

      {/* Top Floating Utility Action Bar enters from Top */}
      <div
        className="anim-enter-top"
        style={{
          position: 'absolute',
          top: '1.2rem',
          right: '1.25rem',
          display: 'flex',
          gap: '0.5rem',
          zIndex: 30
        }}
      >
        <button
          type="button"
          onClick={onOpenPublicPortal}
          className="btn btn-secondary btn-sm"
        >
          <Globe size={14} /> {t('publicPortal')}
        </button>
        <button
          type="button"
          onClick={toggleLanguage}
          className="btn btn-secondary btn-sm"
          title="Change Language (English / Hindi)"
        >
          <Languages size={14} /> {t('languageLabel')}
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          className="btn btn-secondary btn-sm"
          aria-label="Toggle Color Theme"
          title="Switch Dark / Light Theme"
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
      </div>

      {/* Institutional Branding Masthead enters from Top */}
      <header className="aktu-masthead anim-enter-top">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
          <a
            href="https://erp.aktu.ac.in/"
            target="_blank"
            rel="noopener noreferrer"
            title="Visit AKTU ERP Portal (erp.aktu.ac.in)"
            style={{ display: 'inline-flex', cursor: 'pointer' }}
          >
            <img
              src="/aktu-logo.png"
              alt="AKTU Seal Emblem"
              style={{
                width: '62px',
                height: '62px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.2))'
              }}
            />
          </a>
          <a
            href="https://cas.res.in/"
            target="_blank"
            rel="noopener noreferrer"
            title="Visit Centre for Advanced Studies (cas.res.in)"
            style={{ display: 'inline-flex', cursor: 'pointer' }}
          >
            <img
              src="/cas-crest.png"
              alt="CAS Emblem"
              style={{
                width: '56px',
                height: '56px',
                objectFit: 'contain',
                borderRadius: '50%',
                background: '#ffffff',
                padding: '2px',
                border: '2px solid var(--accent-primary)'
              }}
            />
          </a>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--palette-cyan)', lineHeight: 1.25 }}>
              {t('auth.univFull')}
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {t('auth.title')} (CAS)
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {t('auth.centreTagline')}
            </div>
          </div>
        </div>
      </header>

      {/* Main Centered ERP Login Card */}
      <main className="aktu-login-card anim-scale-in">
        {/* Top Emblems (CAS & AKTU) converge from Top */}
        <div className="anim-enter-top anim-delay-1" style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
            <a
              href="https://cas.res.in/"
              target="_blank"
              rel="noopener noreferrer"
              title="Visit Centre for Advanced Studies (cas.res.in)"
              style={{ display: 'inline-flex', cursor: 'pointer' }}
            >
              <img
                src="/cas-crest.png"
                alt="Centre for Advanced Studies (CAS) Logo"
                style={{
                  height: '88px',
                  width: '88px',
                  objectFit: 'contain',
                  borderRadius: '50%',
                  background: '#ffffff',
                  padding: '4px',
                  border: '2px solid var(--accent-primary)',
                  filter: 'drop-shadow(0 6px 14px var(--accent-glow))'
                }}
              />
            </a>
            <a
              href="https://erp.aktu.ac.in/"
              target="_blank"
              rel="noopener noreferrer"
              title="Visit AKTU ERP Portal (erp.aktu.ac.in)"
              style={{ display: 'inline-flex', cursor: 'pointer' }}
            >
              <img
                src="/aktu-logo.png"
                alt="Dr. A.P.J. Abdul Kalam Technical University Logo"
                style={{
                  height: '88px',
                  width: '88px',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 6px 14px var(--accent-glow))'
                }}
              />
            </a>
          </div>
          <h1 className="aktu-login-title">{t('auth.portalHeading')}</h1>
          <h2 className="aktu-login-subtitle" style={{ fontSize: '1.05rem', margin: '0 0 0.25rem 0' }}>
            {t('auth.title')}
          </h2>
          <div className="aktu-login-univ">{t('auth.subtitle')}</div>
        </div>

        {/* Security Notice: Do not use official passwords */}
        <div
          role="note"
          style={{
            background: 'var(--warning-bg)',
            color: 'var(--warning)',
            border: '1.5px solid var(--warning-border)',
            borderRadius: 'var(--radius-md)',
            padding: '0.7rem 0.9rem',
            marginBottom: '1.1rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.6rem',
            fontSize: '0.8rem',
            lineHeight: 1.45,
            textAlign: 'left'
          }}
        >
          <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--warning)' }} />
          <div>
            <strong style={{ display: 'block', fontSize: '0.82rem', marginBottom: '2px', color: 'var(--warning)' }}>
              Security Notice
            </strong>
            Do not use your official or personal email passwords to log in to this website. Use only your designated CAS ERP portal credentials (e.g., demo password: <code style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>CasErp@2026!</code>).
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="anim-scale-in"
            style={{
              background: 'var(--danger-bg)',
              color: 'var(--danger)',
              padding: '0.75rem 0.9rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.82rem',
              border: '1px solid var(--danger-border)'
            }}
          >
            <AlertCircle size={16} /> <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Email / User ID converges from Left */}
          <div className="aktu-input-group anim-enter-left anim-delay-2">
            <label htmlFor="login-email" className="aktu-label">
              {t('auth.email')}
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Mail size={16} />
              </span>
              <input
                id="login-email"
                type="email"
                className="aktu-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@cas.res.in"
                autoComplete="username"
                required
              />
            </div>
          </div>

          {/* Password converges from Right */}
          <div className="aktu-input-group anim-enter-right anim-delay-2">
            <label htmlFor="login-password" className="aktu-label">
              {t('auth.password')}
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Lock size={16} />
              </span>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="aktu-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {mfaRequired && (
            <div className="aktu-input-group anim-scale-in">
              <label htmlFor="login-mfa" className="aktu-label">
                {t('auth.mfaCode')}
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <ShieldCheck size={16} />
                </span>
                <input
                  id="login-mfa"
                  type="text"
                  className="aktu-input"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  placeholder="6-digit TOTP code"
                  required
                />
              </div>
            </div>
          )}

          {/* Links converge from Left */}
          <div
            className="anim-enter-left anim-delay-3"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.8rem',
              marginBottom: '1.15rem'
            }}
          >
            <button
              type="button"
              onClick={() => setShowForgot(!showForgot)}
              style={{ background: 'none', border: 'none', color: 'var(--palette-cyan)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
            >
              {t('auth.forgotPassword')}
            </button>
            <button
              type="button"
              onClick={onOpenPublicPortal}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
            >
              {t('auth.publicPortalLink')}
            </button>
          </div>

          {/* Primary Sign-In Button rises from Bottom */}
          <button
            type="submit"
            disabled={isLoading}
            className="aktu-btn-submit anim-enter-bottom anim-delay-3"
            aria-label={t('auth.loginBtn')}
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <><Lock size={15} /> {t('auth.loginBtn')}</>}
          </button>
        </form>

        {showForgot && (
          <form
            onSubmit={handleRequestReset}
            className="anim-scale-in"
            style={{
              marginTop: '1rem',
              padding: '0.9rem',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              {t('auth.resetTitle')}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="email"
                className="aktu-input"
                style={{ height: '38px', paddingLeft: '0.75rem' }}
                placeholder="Institutional email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
              />
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                style={{ whiteSpace: 'nowrap' }}
              >
                {t('auth.sendReset')}
              </button>
            </div>
            {resetNotice && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{resetNotice}</p>
            )}
          </form>
        )}

        {/* Official ERP Disclaimer Footer */}
        <div className="aktu-footer-disclaimer anim-enter-bottom anim-delay-4">
          <p style={{ margin: '0 0 0.35rem 0', color: 'var(--text-secondary)', fontWeight: 600 }}>
            {t('auth.disclaimerPrimary')}
          </p>
          <p style={{ margin: '0 0 0.65rem 0', color: 'var(--text-muted)', fontSize: '0.68rem' }}>
            {t('auth.disclaimerSecondary')}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <span className="cas-developer-credit" title="Platform Architect & Engineering Lead">
              <Sparkles size={11} color="var(--palette-cyan)" />
              <span style={{ color: 'var(--text-secondary)' }}>Developed by</span>
              <strong className="cas-developer-credit-name">TechnoCat Arya</strong>
            </span>
          </div>
        </div>

        {/* Institutional Role Quick Select (Dev-Only, Pre-fills behind the scenes without displaying password) */}
        {import.meta.env.DEV && (
          <div
            className="anim-enter-bottom anim-delay-5"
            style={{
              marginTop: '1.25rem',
              paddingTop: '0.9rem',
              borderTop: '1px solid var(--border-color)'
            }}
          >
            <div
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                marginBottom: '0.45rem',
                letterSpacing: '0.04em'
              }}
            >
              INSTITUTIONAL ROLES (SELECT TO AUTO-FILL LOGIN)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {SYNTHETIC_DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  className="aktu-badge-role"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword('CasErp@2026!');
                    setMfaRequired(false);
                    setError('');
                  }}
                  title={`Select ${acc.label} role`}
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};