import React, { useState, useEffect } from 'react';
import { useERP } from '../context/ERPContext.jsx';
import { api } from '../services/apiClient.js';
import { formatDateIST, formatINR, formatLakhsCrores } from '../utils/formatters.js';
import { PageHeader, StatCard, StatusBadge } from '../components/UiPrimitives.jsx';
import { CreditCard, Download, RotateCcw, CheckCircle2, ShieldAlert } from 'lucide-react';

export const FinanceView = ({ onOpenCollectFee, onViewReceipt }) => {
  const { invoices, payments, students, can, refreshAll, showToast } = useERP();
  const [refunds, setRefunds] = useState([]);
  const [gateway, setGateway] = useState(null);
  const [refundForm, setRefundForm] = useState({ paymentId: '', amountInr: '', reason: '' });

  const loadExtras = () => {
    api.get('/finance/gateway-status').then((d) => setGateway(d.cashfree)).catch(() => {});
    api.get('/finance/refunds').then((d) => setRefunds(d.refunds || [])).catch(() => {});
  };

  useEffect(() => {
    loadExtras();
  }, []);

  const totalCollected = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + (p.amountInr || 0), 0);
  const totalDue = students.reduce((s, st) => s + (st.dueFeeInr || 0), 0);

  const handleRequestRefund = async (e) => {
    e.preventDefault();
    try {
      await api.post('/finance/refunds', {
        paymentId: refundForm.paymentId || payments[0]?._id,
        amountInr: Number(refundForm.amountInr),
        reason: refundForm.reason
      });
      showToast('Refund prepared for independent approver review.');
      setRefundForm({ paymentId: '', amountInr: '', reason: '' });
      loadExtras();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleRefundDecision = async (id, decision) => {
    try {
      await api.post(`/finance/refunds/${id}/decision`, { decision });
      showToast(`Refund ${decision}.`);
      loadExtras();
      refreshAll();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const exportCsv = async () => {
    try {
      const res = await api.post('/reports/export', { dataset: 'payments', format: 'csv' });
      const blob = new Blob([res.csv || ''], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cas_payments_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Fees, Cashfree Checkout & Treasury Ledger"
        subtitle={`Server-verified payments, invoices, and dual-control refunds • Cashfree Mode: ${gateway?.mode || 'checking...'}`}
        actions={
          <>
            {can('reports', 'export') && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={exportCsv}>
                <Download size={15} /> Audited CSV Export
              </button>
            )}
            {(can('finance', 'create') || can('finance', 'submit')) && (
              <button type="button" className="btn btn-success btn-sm" onClick={onOpenCollectFee}>
                <CreditCard size={15} /> Record / Pay Fee
              </button>
            )}
          </>
        }
      />

      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatCard label="Realized Inflow" value={formatLakhsCrores(totalCollected)} tone="success" />
        <StatCard label="Outstanding Dues" value={formatLakhsCrores(totalDue)} tone={totalDue > 0 ? 'warning' : 'success'} />
        <StatCard label="Invoices Issued" value={invoices.length} />
        <StatCard label="Pending Refunds" value={refunds.filter((r) => r.status === 'pending_approval').length} tone="accent" />
      </div>

      {/* Invoices & Payments */}
      <div className="erp-card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.05rem', marginBottom: '0.85rem' }}>Payment Transactions & Verified Receipts</h2>
        <div className="table-container">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Receipt No</th>
                <th>Student</th>
                <th>Fee Head</th>
                <th>Channel</th>
                <th>Amount</th>
                <th>Settled Date (IST)</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p._id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--palette-cyan)' }}>{p.receiptNo}</td>
                  <td>{p.studentName} ({p.rollNumber})</td>
                  <td>{p.feeHead}</td>
                  <td>{String(p.channel).replace(/_/g, ' ').toUpperCase()}</td>
                  <td style={{ fontWeight: 700 }}>{formatINR(p.amountInr)}</td>
                  <td>{formatDateIST(p.settledAt || p.createdAt)}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => onViewReceipt(p)}>
                      View Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dual-Control Refunds (SoD enforced server-side) */}
      {(can('finance', 'create') || can('finance', 'approve')) && (
        <section className="erp-card">
          <h2 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <ShieldAlert size={17} color="var(--warning)" /> Dual-Control Refunds (SoD Enforced)
          </h2>
          {can('finance', 'create') && payments.some((p) => p.status === 'paid') && (
            <form onSubmit={handleRequestRefund} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem', marginBottom: '1rem' }}>
              <select aria-label="Select settled payment for refund" className="select-field" value={refundForm.paymentId || payments.find((p) => p.status === 'paid')?._id || ''} onChange={(e) => setRefundForm({ ...refundForm, paymentId: e.target.value })}>
                {payments.filter((p) => p.status === 'paid').map((p) => (
                  <option key={p._id} value={p._id}>{p.receiptNo} — {formatINR(p.amountInr)}</option>
                ))}
              </select>
              <input type="number" min="1" className="input-field" placeholder="Refund Amount (₹)" required value={refundForm.amountInr} onChange={(e) => setRefundForm({ ...refundForm, amountInr: e.target.value })} />
              <input className="input-field" placeholder="Justification / Reason" required value={refundForm.reason} onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })} />
              <button type="submit" className="btn btn-warning btn-sm"><RotateCcw size={14} /> Prepare Refund</button>
            </form>
          )}

          <div className="table-container">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Refund No</th>
                  <th>Amount</th>
                  <th>Reason</th>
                  <th>Status</th>
                  {can('finance', 'approve') && <th>Independent Approval</th>}
                </tr>
              </thead>
              <tbody>
                {refunds.map((r) => (
                  <tr key={r._id}>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{r.refundNo}</td>
                    <td style={{ fontWeight: 700 }}>{formatINR(r.amountInr)}</td>
                    <td>{r.reason}</td>
                    <td><StatusBadge status={r.status} /></td>
                    {can('finance', 'approve') && (
                      <td style={{ display: 'flex', gap: '0.4rem' }}>
                        {r.status === 'pending_approval' && (
                          <>
                            <button type="button" className="btn btn-success btn-sm" onClick={() => handleRefundDecision(r._id, 'approved')}>
                              <CheckCircle2 size={14} /> Approve
                            </button>
                            <button type="button" className="btn btn-danger btn-sm" onClick={() => handleRefundDecision(r._id, 'rejected')}>
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};
