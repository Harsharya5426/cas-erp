import React, { useState, useEffect } from 'react';
import { useERP } from '../context/ERPContext.jsx';
import { api } from '../services/apiClient.js';
import { X, CreditCard, AlertTriangle } from 'lucide-react';
import { formatINR } from '../utils/formatters.js';

export const CollectFeeModal = ({ initialStudent, onClose, onPaymentComplete }) => {
  const { students, invoices, can, refreshAll, showToast } = useERP();

  const defaultStudent =
    initialStudent ||
    students.find((s) => (s.dueFeeInr || 0) > 0) ||
    students[0] ||
    null;

  const [selectedStudentId, setSelectedStudentId] = useState(defaultStudent?._id || '');
  const [amountInr, setAmountInr] = useState(
    defaultStudent?.dueFeeInr > 0 ? String(defaultStudent.dueFeeInr) : ''
  );
  const [feeHead, setFeeHead] = useState('Academic Tuition & Semester Fee');
  const [mode, setMode] = useState(can('finance', 'create') ? 'offline' : 'cashfree');
  const [channel, setChannel] = useState('offline_challan');
  const [referenceCode, setReferenceCode] = useState('');
  const [gatewayStatus, setGatewayStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const activeStudent = students.find((s) => s._id === selectedStudentId);
  const studentInvoices = invoices.filter((i) => String(i.studentId) === String(selectedStudentId) && i.dueAmountInr > 0);

  useEffect(() => {
    api.get('/finance/gateway-status').then((d) => setGatewayStatus(d.cashfree)).catch(() => {});
  }, []);

  const handleStudentChange = (nextId) => {
    setSelectedStudentId(nextId);
    const nextStu = students.find((s) => s._id === nextId);
    setAmountInr(nextStu?.dueFeeInr > 0 ? String(nextStu.dueFeeInr) : '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeStudent || !amountInr || Number(amountInr) <= 0) return;
    setError('');
    setSubmitting(true);

    try {
      if (mode === 'offline') {
        const res = await api.post(
          '/finance/payments/offline',
          {
            studentId: activeStudent._id,
            invoiceId: studentInvoices[0]?._id,
            amountInr: Number(amountInr),
            channel,
            referenceCode,
            feeHead
          },
          { idempotencyKey: `UI-${activeStudent._id}-${referenceCode}-${amountInr}` }
        );
        await refreshAll();
        showToast(`Receipt ${res.payment.receiptNo} recorded and posted to ledger.`);
        onPaymentComplete?.(res.payment);
      } else {
        if (!studentInvoices[0]) {
          throw new Error('No pending invoice found for Cashfree checkout.');
        }
        const res = await api.post('/finance/payments/cashfree/order', {
          studentId: activeStudent._id,
          invoiceId: studentInvoices[0]._id,
          amountInr: Number(amountInr)
        });
        showToast(`Cashfree Order ${res.payment.orderId} initiated (Session ID ready).`);
        await refreshAll();
        onClose();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard size={20} color="var(--warning)" />
            <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Record Fee Payment / Cashfree Checkout</h3>
          </div>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-icon" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {error && <div style={{ color: 'var(--danger)', fontSize: '0.82rem' }}>{error}</div>}

            <div className="input-group">
              <label className="input-label">Student Account</label>
              <select className="select-field" value={selectedStudentId} onChange={(e) => handleStudentChange(e.target.value)}>
                {students.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.rollNumber}) — Due: {formatINR(s.dueFeeInr)}
                  </option>
                ))}
              </select>
            </div>

            {activeStudent && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem', padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Assessed</div>
                  <div style={{ fontWeight: 700 }}>{formatINR(activeStudent.totalFeeAssessedInr)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Paid</div>
                  <div style={{ fontWeight: 700, color: 'var(--success)' }}>{formatINR(activeStudent.paidFeeInr)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Balance Due</div>
                  <div style={{ fontWeight: 800, color: activeStudent.dueFeeInr > 0 ? 'var(--danger)' : 'var(--success)' }}>
                    {formatINR(activeStudent.dueFeeInr)}
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {can('finance', 'create') && (
                <button type="button" onClick={() => setMode('offline')} className={`btn btn-sm ${mode === 'offline' ? 'btn-primary' : 'btn-secondary'}`}>
                  Offline / Bank Challan / NEFT
                </button>
              )}
              <button type="button" onClick={() => setMode('cashfree')} className={`btn btn-sm ${mode === 'cashfree' ? 'btn-primary' : 'btn-secondary'}`}>
                Cashfree Online Gateway
              </button>
            </div>

            {mode === 'cashfree' && gatewayStatus && !gatewayStatus.configured && (
              <div style={{ padding: '0.7rem', background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'var(--warning)', display: 'flex', gap: '0.45rem' }}>
                <AlertTriangle size={16} />
                <span>
                  Cashfree merchant credentials are currently disabled (`CASHFREE_MODE={gatewayStatus.mode}`). Configure sandbox/production credentials in Secrets Manager / `.env` to initiate live checkout orders.
                </span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="input-group">
                <label className="input-label">Amount (₹ INR) *</label>
                <input type="number" min="1" required className="input-field" value={amountInr} onChange={(e) => setAmountInr(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Fee Head</label>
                <input className="input-field" value={feeHead} onChange={(e) => setFeeHead(e.target.value)} />
              </div>
            </div>

            {mode === 'offline' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="input-group">
                  <label className="input-label">Settlement Channel *</label>
                  <select className="select-field" value={channel} onChange={(e) => setChannel(e.target.value)}>
                    <option value="offline_challan">Bank Challan</option>
                    <option value="offline_neft">NEFT / RTGS / IMPS</option>
                    <option value="offline_upi">Verified Desk UPI</option>
                    <option value="offline_cash">Cash Counter</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Bank Ref / Challan No *</label>
                  <input className="input-field" required placeholder="UTR / Challan Ref" value={referenceCode} onChange={(e) => setReferenceCode(e.target.value)} />
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">Cancel</button>
            <button type="submit" disabled={submitting} className="btn btn-success btn-sm">
              {submitting ? 'Processing...' : mode === 'offline' ? 'Post Verified Receipt' : 'Initiate Cashfree Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
