import React from 'react';
import { X, Printer, CheckCircle2 } from 'lucide-react';
import { formatDateTimeIST, formatINR } from '../utils/formatters.js';

export const FeeReceiptModal = ({ feeRecord, onClose }) => {
  if (!feeRecord) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '680px', background: '#ffffff', color: '#0f172a' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e3b4a' }}>
              CAS Fee Receipt & Ledger Voucher
            </span>
            <span style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>
              {String(feeRecord.status || 'paid').toUpperCase()}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button type="button" onClick={() => window.print()} className="btn btn-primary btn-sm">
              <Printer size={15} /> Print / PDF
            </button>
            <button type="button" onClick={onClose} className="btn btn-ghost btn-icon" aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        <div style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <a href="https://cas.res.in/" target="_blank" rel="noopener noreferrer" title="Visit Centre for Advanced Studies (cas.res.in)" style={{ display: 'inline-flex' }}>
                <img src="/cas-crest.png" alt="CAS Logo" style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '50%' }} />
              </a>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0d2531', margin: 0 }}>
                  CENTRE FOR ADVANCED STUDIES, AKTU LUCKNOW
                </h2>
                <div style={{ fontSize: '0.72rem', color: '#475569' }}>
                  Sector 11, Jankipuram Extension, Lucknow, Uttar Pradesh
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>RECEIPT NO.</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#3587A4', fontFamily: 'var(--font-mono)' }}>
                {feeRecord.receiptNo}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                {formatDateTimeIST(feeRecord.settledAt || feeRecord.createdAt)}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem', marginBottom: '1rem' }}>
            <div><strong>Student:</strong> {feeRecord.studentName}</div>
            <div><strong>Roll / PRN:</strong> {feeRecord.rollNumber}</div>
            <div><strong>Channel:</strong> {String(feeRecord.channel || '').replace(/_/g, ' ').toUpperCase()}</div>
            <div><strong>Reference:</strong> {feeRecord.referenceCode || feeRecord.gatewayPaymentId || feeRecord.orderId}</div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                <th style={{ textAlign: 'left', padding: '0.6rem' }}>Fee Head</th>
                <th style={{ textAlign: 'right', padding: '0.6rem' }}>Amount (INR)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '0.6rem' }}>{feeRecord.feeHead || 'Academic Tuition & Semester Fee'}</td>
                <td style={{ padding: '0.6rem', textAlign: 'right', fontWeight: 700 }}>{formatINR(feeRecord.amountInr)}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#166534', fontSize: '0.8rem', fontWeight: 600 }}>
            <CheckCircle2 size={16} />
            <span>Recorded in append-only institutional ledger (Order: {feeRecord.orderId})</span>
          </div>
        </div>
      </div>
    </div>
  );
};
