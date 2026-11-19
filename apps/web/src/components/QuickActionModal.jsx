import React from 'react';
import { X, UserPlus, CreditCard, UserCheck, BookOpen, BellRing, Sparkles } from 'lucide-react';
import { useERP } from '../context/ERPContext.jsx';

export const QuickActionModal = ({
  onClose,
  onOpenEnroll,
  onOpenCollectFee,
  onOpenAddFaculty,
  onOpenAddCourse,
  onOpenBroadcast
}) => {
  const { can } = useERP();

  const actions = [
    can('students', 'create') && {
      title: 'Enroll Student',
      desc: 'Create persisted student record in MongoDB.',
      icon: <UserPlus size={20} color="var(--palette-cyan)" />,
      onClick: () => { onClose(); onOpenEnroll(); }
    },
    (can('finance', 'create') || can('finance', 'submit')) && {
      title: 'Collect / Pay Fee',
      desc: 'Post offline receipt or initiate Cashfree checkout.',
      icon: <CreditCard size={20} color="var(--success)" />,
      onClick: () => { onClose(); onOpenCollectFee(); }
    },
    can('faculty', 'create') && {
      title: 'Onboard Employee / Faculty',
      desc: 'Create faculty or administrative employee profile.',
      icon: <UserCheck size={20} color="var(--info)" />,
      onClick: () => { onClose(); onOpenAddFaculty(); }
    },
    can('academics', 'create') && {
      title: 'Register Subject',
      desc: 'Add subject to configurable curriculum catalog.',
      icon: <BookOpen size={20} color="var(--warning)" />,
      onClick: () => { onClose(); onOpenAddCourse(); }
    },
    can('notifications', 'create') && {
      title: 'Publish Circular',
      desc: 'Broadcast notice to targeted campus roles or public site.',
      icon: <BellRing size={20} color="var(--danger)" />,
      onClick: () => { onClose(); onOpenBroadcast(); }
    }
  ].filter(Boolean);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--palette-cyan)" />
            <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Role-Scoped Quick Actions</h3>
          </div>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-icon" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          {actions.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No creation actions are assigned to your current role. Use the sidebar to view your self-service records.
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
              {actions.map((act, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={act.onClick}
                  className="erp-card erp-card-interactive"
                  style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}
                >
                  <div>{act.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{act.title}</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{act.desc}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
