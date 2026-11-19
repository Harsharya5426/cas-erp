import React from 'react';
import { X, Printer, Shield } from 'lucide-react';

export const StudentIDCardModal = ({ student, onClose }) => {
  if (!student) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '420px', padding: 0, overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.9rem 1.25rem',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-tertiary)'
          }}
        >
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>CAS Student Identity Card</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" onClick={() => window.print()} className="btn btn-primary btn-sm">
              <Printer size={14} /> Print
            </button>
            <button type="button" onClick={onClose} className="btn btn-ghost btn-icon" aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              width: '320px',
              borderRadius: '16px',
              background: 'linear-gradient(145deg, #10212b 0%, #0b161c 100%)',
              border: '1px solid rgba(136, 204, 241, 0.3)',
              padding: '1.25rem',
              color: '#ffffff'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <a href="https://cas.res.in/" target="_blank" rel="noopener noreferrer" title="Visit Centre for Advanced Studies (cas.res.in)" style={{ display: 'inline-flex' }}>
                <img src="/cas-crest.png" alt="CAS Logo" style={{ width: '34px', height: '34px', background: '#ffffff', borderRadius: '50%', padding: '2px', objectFit: 'contain' }} />
              </a>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 800 }}>CAS AKTU LUCKNOW</div>
                <div style={{ fontSize: '0.62rem', color: '#C1DFF0' }}>STUDENT PASS / ID</div>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{ width: '76px', height: '76px', borderRadius: '50%', margin: '0 auto 0.65rem', background: 'linear-gradient(135deg, #3587A4, #2D898B)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 800 }}>
                {student.name?.charAt(0) || 'S'}
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>{student.name}</div>
              <div style={{ fontSize: '0.8rem', color: '#88CCF1', fontFamily: 'var(--font-mono)' }}>{student.rollNumber}</div>
            </div>

            <div style={{ fontSize: '0.76rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', background: 'rgba(255,255,255,0.06)', padding: '0.75rem', borderRadius: '8px' }}>
              <div><strong>Student ID:</strong> {student.studentCode}</div>
              <div><strong>Department:</strong> {student.deptCode}</div>
              <div><strong>Program / Sem:</strong> {student.programCode} • Sem {student.semesterNumber}</div>
              <div><strong>Batch:</strong> {student.batch}</div>
            </div>

            <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.68rem', color: '#C1DFF0' }}>
              <Shield size={13} /> Valid for campus library, attendance & lab access
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
