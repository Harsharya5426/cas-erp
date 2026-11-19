import React from 'react';
import { useERP } from '../context/ERPContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer = () => {
  const { toasts, removeToast } = useERP();

  if (toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '380px'
      }}
    >
      {toasts.map((toast) => {
        let icon = <CheckCircle2 size={18} color="#10b981" />;
        let borderColor = 'rgba(16, 185, 129, 0.4)';

        if (toast.type === 'warning' || toast.type === 'danger') {
          icon = <AlertCircle size={18} color="#ef4444" />;
          borderColor = 'rgba(239, 68, 68, 0.4)';
        } else if (toast.type === 'info') {
          icon = <Info size={18} color="#3b82f6" />;
          borderColor = 'rgba(59, 130, 246, 0.4)';
        }

        return (
          <div
            key={toast.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              padding: '12px 16px',
              background: 'var(--bg-secondary)',
              border: `1px solid ${borderColor}`,
              borderLeft: `4px solid ${toast.type === 'warning' ? '#ef4444' : '#10b981'}`,
              borderRadius: '8px',
              boxShadow: 'var(--shadow-lg)',
              backdropFilter: 'blur(8px)',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {icon}
              <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                {toast.message}
              </span>
            </div>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '2px'
              }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
