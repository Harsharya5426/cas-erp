import React, { useState, useEffect } from 'react';
import { useERP } from '../context/ERPContext.jsx';
import { api } from '../services/apiClient.js';
import { formatDateTimeIST, formatINR } from '../utils/formatters.js';
import { PageHeader } from '../components/UiPrimitives.jsx';
import { Calculator, PlusCircle } from 'lucide-react';

export const AccountingView = () => {
  const { can, showToast } = useERP();
  const [accounts, setAccounts] = useState([]);
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({
    voucherType: 'Journal',
    description: '',
    costCentre: 'ACADEMICS',
    debitCode: '1002',
    creditCode: '4001',
    amountInr: ''
  });

  const loadAccounting = () => {
    Promise.all([
      api.get('/finance/accounting/accounts'),
      api.get('/finance/accounting/vouchers')
    ])
      .then(([accRes, vchRes]) => {
        setAccounts(accRes.accounts || []);
        setEntries(vchRes.entries || []);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadAccounting();
  }, []);

  const handlePostVoucher = async (e) => {
    e.preventDefault();
    const debitAcc = accounts.find((a) => a.code === form.debitCode);
    const creditAcc = accounts.find((a) => a.code === form.creditCode);
    const amt = Number(form.amountInr);
    try {
      await api.post('/finance/accounting/vouchers', {
        voucherType: form.voucherType,
        description: form.description,
        costCentre: form.costCentre,
        lines: [
          { accountCode: form.debitCode, accountName: debitAcc?.name || form.debitCode, debitInr: amt, creditInr: 0 },
          { accountCode: form.creditCode, accountName: creditAcc?.name || form.creditCode, debitInr: 0, creditInr: amt }
        ]
      });
      showToast('Balanced double-entry voucher posted to append-only ledger.');
      setForm({ ...form, description: '', amountInr: '' });
      loadAccounting();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Double-Entry General Ledger & Vouchers"
        subtitle="Append-only financial accounting entries (debit === credit enforced server-side)"
      />

      {can('accounting', 'create') && accounts.length >= 2 && (
        <form onSubmit={handlePostVoucher} className="erp-card" style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <PlusCircle size={16} color="var(--palette-cyan)" /> Post Balanced Double-Entry Voucher
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.65rem' }}>
            <select className="select-field" value={form.voucherType} onChange={(e) => setForm({ ...form, voucherType: e.target.value })}>
              <option value="Journal">Journal</option>
              <option value="Receipt">Receipt</option>
              <option value="Payment">Payment</option>
              <option value="Reversal">Reversal</option>
            </select>
            <select className="select-field" value={form.debitCode} onChange={(e) => setForm({ ...form, debitCode: e.target.value })}>
              {accounts.map((a) => <option key={a.code} value={a.code}>Dr: {a.code} {a.name}</option>)}
            </select>
            <select className="select-field" value={form.creditCode} onChange={(e) => setForm({ ...form, creditCode: e.target.value })}>
              {accounts.map((a) => <option key={a.code} value={a.code}>Cr: {a.code} {a.name}</option>)}
            </select>
            <input type="number" min="1" className="input-field" placeholder="Amount (₹)" required value={form.amountInr} onChange={(e) => setForm({ ...form, amountInr: e.target.value })} />
            <input className="input-field" placeholder="Narration / Cost Centre" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <button type="submit" className="btn btn-primary btn-sm">Post Voucher</button>
          </div>
        </form>
      )}

      <div className="erp-card">
        <h2 style={{ fontSize: '1.05rem', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <Calculator size={17} color="var(--palette-cyan)" /> Append-Only Ledger Journal ({entries.length})
        </h2>
        <div className="table-container">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Voucher No</th>
                <th>Type</th>
                <th>Description</th>
                <th>Lines (Dr / Cr)</th>
                <th>Total</th>
                <th>Posted (IST)</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((ent) => (
                <tr key={ent._id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--palette-cyan)' }}>{ent.voucherNo}</td>
                  <td><span className="badge badge-info">{ent.voucherType}</span></td>
                  <td>{ent.description}</td>
                  <td style={{ fontSize: '0.76rem' }}>
                    {ent.lines.map((l, idx) => (
                      <div key={idx}>
                        {l.debitInr > 0 ? `Dr ${l.accountCode}: ${formatINR(l.debitInr)}` : `Cr ${l.accountCode}: ${formatINR(l.creditInr)}`}
                      </div>
                    ))}
                  </td>
                  <td style={{ fontWeight: 700 }}>{formatINR(ent.totalDebitInr)}</td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDateTimeIST(ent.postedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

