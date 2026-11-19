import React from 'react';
import { AlertCircle, RefreshCw, Inbox } from 'lucide-react';

export const PageHeader = ({ title, subtitle, actions }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.5rem',
      flexWrap: 'wrap',
      gap: '1rem'
    }}
  >
    <div>
      <h1 style={{ fontSize: '1.55rem', fontWeight: 800, marginBottom: '0.2rem' }}>{title}</h1>
      {subtitle && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>{subtitle}</p>
      )}
    </div>
    {actions && (
      <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
        {actions}
      </div>
    )}
  </div>
);

export const StatCard = ({ label, value, hint, tone = 'default', icon, onClick }) => {
  const color =
    tone === 'success'
      ? 'var(--success)'
      : tone === 'warning'
      ? 'var(--warning)'
      : tone === 'danger'
      ? 'var(--danger)'
      : tone === 'accent'
      ? 'var(--palette-cyan)'
      : 'var(--text-primary)';

  return (
    <div
      className={`erp-card ${onClick ? 'erp-card-interactive' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.5rem' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}
        >
          {label}
        </span>
        {icon && <span style={{ color: 'var(--palette-cyan)' }}>{icon}</span>}
      </div>
      <div style={{ fontSize: '1.65rem', fontWeight: 800, color }}>{value}</div>
      {hint && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{hint}</div>}
    </div>
  );
};

export const ErrorBanner = ({ message, onRetry }) => (
  <div
    role="alert"
    style={{
      background: 'var(--danger-bg)',
      border: '1px solid var(--danger-border)',
      color: 'var(--danger)',
      padding: '0.9rem 1rem',
      borderRadius: 'var(--radius-md)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '1rem',
      marginBottom: '1rem'
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
      <AlertCircle size={18} />
      <span>{message}</span>
    </div>
    {onRetry && (
      <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
        <RefreshCw size={14} /> Retry
      </button>
    )}
  </div>
);

export const EmptyState = ({ title, description, action }) => (
  <div
    className="erp-card anim-scale-in"
    style={{
      textAlign: 'center',
      padding: '2.5rem 1.5rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.65rem'
    }}
  >
    <Inbox size={32} color="var(--text-muted)" />
    <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{title}</h3>
    {description && (
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '460px' }}>
        {description}
      </p>
    )}
    {action}
  </div>
);

export const StatusBadge = ({ status }) => {
  const s = String(status || '').toLowerCase();
  const cls =
    ['paid', 'approved', 'active', 'verified', 'published', 'signed_issued', 'enrolled', 'present', 'resolved', 'completed', 'processed'].includes(s)
      ? 'badge-success'
      : ['partial', 'pending', 'pending_approval', 'submitted', 'under_review', 'docs_verified', 'late', 'marks_open', 'in_review', 'draft', 'requested'].includes(s)
      ? 'badge-warning'
      : ['overdue', 'rejected', 'absent', 'failed', 'revoked', 'suspended', 'escalated'].includes(s)
      ? 'badge-danger'
      : 'badge-info';

  return (
    <span className={`badge ${cls}`} style={{ textTransform: 'capitalize' }}>
      {String(status || 'unknown').replace(/_/g, ' ')}
    </span>
  );
};

