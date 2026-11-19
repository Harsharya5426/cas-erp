import React, { useState, useEffect, useCallback } from 'react';
import { GRIEVANCE_CATEGORIES, CERTIFICATE_TYPES } from '@cas-erp/shared';
import { useERP } from '../context/ERPContext.jsx';
import { api } from '../services/apiClient.js';
import { formatDateIST, formatINR } from '../utils/formatters.js';
import { PageHeader, StatusBadge } from '../components/UiPrimitives.jsx';

export const CampusServicesView = ({ activeModule }) => {
  const { students, can, showToast } = useERP();
  const [libraryData, setLibraryData] = useState({ items: [], circulations: [] });
  const [hostelData, setHostelData] = useState({ hostels: [], allocations: [] });
  const [certs, setCerts] = useState([]);
  const [grievances, setGrievances] = useState([]);
  const [placementData, setPlacementData] = useState({ drives: [], alumni: [] });
  const [inventoryData, setInventoryData] = useState({ assets: [], procurements: [] });
  const [opsData, setOpsData] = useState({ events: [], research: [], visitors: [], incidents: [] });

  // Forms
  const [certForm, setCertForm] = useState({ certificateType: CERTIFICATE_TYPES[0], purpose: '' });
  const [grvForm, setGrvForm] = useState({ category: GRIEVANCE_CATEGORIES[0], subject: '', description: '', confidential: false });
  const [visitorForm, setVisitorForm] = useState({ visitorName: '', contactPhone: '', purpose: '', hostName: '' });
  const [allocForm, setAllocForm] = useState({ hostelId: '', studentId: '', roomNumber: 'A-101', bedNumber: 'B1' });
  const [assetForm, setAssetForm] = useState({ assetTag: '', name: '', category: 'Lab Equipment', departmentCode: 'CSE', quantity: 1, unitCostInr: 25000 });

  const refreshModule = useCallback(() => {
    if (activeModule === 'library') api.get('/campus/library/items').then(setLibraryData).catch(() => { });
    if (activeModule === 'hostel') {
      api.get('/campus/hostels').then((d) => {
        setHostelData(d);
        if (d.hostels?.[0]?._id) setAllocForm((f) => ({ ...f, hostelId: f.hostelId || d.hostels[0]._id }));
      }).catch(() => { });
    }
    if (activeModule === 'documents') api.get('/campus/certificates').then((d) => setCerts(d.certificates || [])).catch(() => { });
    if (activeModule === 'grievances') api.get('/campus/grievances').then((d) => setGrievances(d.tickets || [])).catch(() => { });
    if (activeModule === 'placement') api.get('/campus/placements').then(setPlacementData).catch(() => { });
    if (activeModule === 'inventory') api.get('/campus/inventory').then(setInventoryData).catch(() => { });
    if (activeModule === 'campusOps') api.get('/campus/operations-hub').then(setOpsData).catch(() => { });
  }, [activeModule]);

  useEffect(() => {
    refreshModule();
  }, [refreshModule]);

  const handleRequestCert = async (e) => {
    e.preventDefault();
    try {
      await api.post('/campus/certificates/request', certForm);
      showToast('Certificate request submitted.');
      setCertForm({ ...certForm, purpose: '' });
      refreshModule();
    } catch (err) { showToast(err.message, 'danger'); }
  };

  const handleSignCert = async (id) => {
    try {
      await api.post(`/campus/certificates/${id}/sign`);
      showToast('Certificate digitally signed and QR token activated.');
      refreshModule();
    } catch (err) { showToast(err.message, 'danger'); }
  };

  const handleSubmitGrievance = async (e) => {
    e.preventDefault();
    try {
      await api.post('/campus/grievances', grvForm);
      showToast('Grievance ticket submitted with SLA tracking.');
      setGrvForm({ ...grvForm, subject: '', description: '', confidential: false });
      refreshModule();
    } catch (err) { showToast(err.message, 'danger'); }
  };

  const handleAllocateBed = async (e) => {
    e.preventDefault();
    try {
      await api.post('/campus/hostels/allocate', {
        ...allocForm,
        hostelId: allocForm.hostelId || hostelData.hostels[0]?._id,
        studentId: allocForm.studentId || students[0]?._id
      });
      showToast('Hostel bed allocated.');
      refreshModule();
    } catch (err) { showToast(err.message, 'danger'); }
  };

  const handleAddAsset = async (e) => {
    e.preventDefault();
    try {
      await api.post('/campus/inventory/assets', {
        ...assetForm,
        quantity: Number(assetForm.quantity),
        unitCostInr: Number(assetForm.unitCostInr)
      });
      showToast('Asset registered.');
      setAssetForm({ ...assetForm, assetTag: '', name: '' });
      refreshModule();
    } catch (err) { showToast(err.message, 'danger'); }
  };

  const handleAddVisitor = async (e) => {
    e.preventDefault();
    try {
      await api.post('/campus/operations/visitors', visitorForm);
      showToast('Visitor logged (minimal PII, 90-day retention TTL).');
      setVisitorForm({ visitorName: '', contactPhone: '', purpose: '', hostName: '' });
      refreshModule();
    } catch (err) { showToast(err.message, 'danger'); }
  };

  const handleApplyDrive = async (id) => {
    try {
      await api.post(`/campus/placements/drives/${id}/apply`);
      showToast('Applied to placement drive.');
      refreshModule();
    } catch (err) { showToast(err.message, 'danger'); }
  };

  return (
    <div className="page-wrapper">
      {activeModule === 'library' && (
        <>
          <PageHeader title="Library Catalogue & Circulation" subtitle="ISBN inventory, copies tracking, issue/return & overdue fines" />
          <div className="table-container">
            <table className="erp-table">
              <thead><tr><th>Barcode</th><th>Title & Author</th><th>ISBN</th><th>Copies (Avail/Total)</th></tr></thead>
              <tbody>
                {libraryData.items.map((it) => (
                  <tr key={it._id}>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{it.barcode}</td>
                    <td><strong>{it.title}</strong><div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{it.author}</div></td>
                    <td>{it.isbn}</td>
                    <td>{it.availableCopies} / {it.totalCopies}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeModule === 'hostel' && (
        <>
          <PageHeader title="Hostel, Mess & Bed Allocation" subtitle="Hostel capacity, mess schedules, and warden-approved room/bed allotment" />
          {can('hostel', 'approve') && hostelData.hostels.length > 0 && students.length > 0 && (
            <form onSubmit={handleAllocateBed} className="erp-card" style={{ marginBottom: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.65rem' }}>
              <select className="select-field" value={allocForm.hostelId || hostelData.hostels[0]?._id} onChange={(e) => setAllocForm({ ...allocForm, hostelId: e.target.value })}>
                {hostelData.hostels.map((h) => <option key={h._id} value={h._id}>{h.name}</option>)}
              </select>
              <select className="select-field" value={allocForm.studentId || students[0]?._id} onChange={(e) => setAllocForm({ ...allocForm, studentId: e.target.value })}>
                {students.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.rollNumber})</option>)}
              </select>
              <input className="input-field" placeholder="Room No" value={allocForm.roomNumber} onChange={(e) => setAllocForm({ ...allocForm, roomNumber: e.target.value })} />
              <input className="input-field" placeholder="Bed No" value={allocForm.bedNumber} onChange={(e) => setAllocForm({ ...allocForm, bedNumber: e.target.value })} />
              <button type="submit" className="btn btn-primary btn-sm">Allocate Bed</button>
            </form>
          )}
          <div className="table-container">
            <table className="erp-table">
              <thead><tr><th>Hostel</th><th>Student</th><th>Room / Bed</th><th>Status</th></tr></thead>
              <tbody>
                {hostelData.allocations.map((a) => (
                  <tr key={a._id}>
                    <td>{a.hostelName}</td>
                    <td>{a.studentName}</td>
                    <td>{a.roomNumber} / {a.bedNumber}</td>
                    <td><StatusBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeModule === 'documents' && (
        <>
          <PageHeader title="Documents & Verifiable QR Certificates" subtitle="Request Bonafide/Character/Transfer/Migration certificates and verify QR authenticity tokens" />
          {can('certificates', 'create') && (
            <form onSubmit={handleRequestCert} className="erp-card" style={{ marginBottom: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '0.65rem' }}>
              <select className="select-field" value={certForm.certificateType} onChange={(e) => setCertForm({ ...certForm, certificateType: e.target.value })}>
                {CERTIFICATE_TYPES.map((ct) => <option key={ct} value={ct}>{ct}</option>)}
              </select>
              <input className="input-field" placeholder="Purpose (e.g., Passport / Scholarship)" value={certForm.purpose} onChange={(e) => setCertForm({ ...certForm, purpose: e.target.value })} />
              <button type="submit" className="btn btn-primary btn-sm">Request Certificate</button>
            </form>
          )}
          <div className="table-container">
            <table className="erp-table">
              <thead><tr><th>Serial No</th><th>Student</th><th>Type</th><th>QR Token</th><th>Status</th>{can('certificates', 'approve') && <th>Action</th>}</tr></thead>
              <tbody>
                {certs.map((c) => (
                  <tr key={c._id}>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{c.serialNo}</td>
                    <td>{c.studentName} ({c.rollNumber})</td>
                    <td>{c.certificateType}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{c.qrVerificationToken}</td>
                    <td><StatusBadge status={c.status} /></td>
                    {can('certificates', 'approve') && (
                      <td>
                        {c.status !== 'signed_issued' && (
                          <button type="button" className="btn btn-success btn-sm" onClick={() => handleSignCert(c._id)}>Sign & Issue</button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeModule === 'grievances' && (
        <>
          <PageHeader title="Grievance Redressal & Confidential Helpdesk" subtitle="SLA-tracked submissions with strict server-side access isolation for confidential complaints" />
          {can('grievances', 'create') && (
            <form onSubmit={handleSubmitGrievance} className="erp-card" style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.65rem' }}>
                <select className="select-field" value={grvForm.category} onChange={(e) => setGrvForm({ ...grvForm, category: e.target.value })}>
                  {GRIEVANCE_CATEGORIES.map((gc) => <option key={gc} value={gc}>{gc}</option>)}
                </select>
                <input className="input-field" placeholder="Subject" required value={grvForm.subject} onChange={(e) => setGrvForm({ ...grvForm, subject: e.target.value })} />
              </div>
              <textarea className="input-field" rows="2" placeholder="Describe your grievance..." required value={grvForm.description} onChange={(e) => setGrvForm({ ...grvForm, description: e.target.value })} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem' }}>
                  <input type="checkbox" checked={grvForm.confidential} onChange={(e) => setGrvForm({ ...grvForm, confidential: e.target.checked })} />
                  Mark Confidential (restricted to Principal / assigned committee only)
                </label>
                <button type="submit" className="btn btn-primary btn-sm">Submit Ticket</button>
              </div>
            </form>
          )}
          <div className="table-container">
            <table className="erp-table">
              <thead><tr><th>Ticket No</th><th>Category</th><th>Subject</th><th>Confidential</th><th>SLA Due</th><th>Status</th></tr></thead>
              <tbody>
                {grievances.map((g) => (
                  <tr key={g._id}>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{g.ticketNo}</td>
                    <td>{g.category}</td>
                    <td>{g.subject}</td>
                    <td>{g.confidential ? <span className="badge badge-danger">Confidential</span> : 'Standard'}</td>
                    <td>{formatDateIST(g.slaDueAt)}</td>
                    <td><StatusBadge status={g.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeModule === 'placement' && (
        <>
          <PageHeader title="Placement Drives & Alumni Network" subtitle="Eligibility-checked campus placement drives and privacy-aware alumni directory" />
          <div className="table-container">
            <table className="erp-table">
              <thead><tr><th>Drive Code</th><th>Company & Role</th><th>Package</th><th>Min CGPA</th><th>Date</th><th>Action</th></tr></thead>
              <tbody>
                {placementData.drives.map((d) => (
                  <tr key={d._id}>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{d.driveCode}</td>
                    <td><strong>{d.companyName}</strong> — {d.roleTitle}</td>
                    <td>₹{d.packageLpa} LPA</td>
                    <td>{d.minCgpa}</td>
                    <td>{formatDateIST(d.driveDate)}</td>
                    <td>
                      {can('placement', 'submit') && (
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => handleApplyDrive(d._id)}>Apply</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeModule === 'inventory' && (
        <>
          <PageHeader title="Inventory, Lab Assets & Procurement" subtitle="Asset tagging, stock ledger, and multi-stage procurement approvals" />
          {can('inventory', 'create') && (
            <form onSubmit={handleAddAsset} className="erp-card" style={{ marginBottom: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.65rem' }}>
              <input className="input-field" placeholder="Asset Tag (AST-01)" required value={assetForm.assetTag} onChange={(e) => setAssetForm({ ...assetForm, assetTag: e.target.value })} />
              <input className="input-field" placeholder="Asset Name" required value={assetForm.name} onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })} />
              <input className="input-field" placeholder="Dept Code" value={assetForm.departmentCode} onChange={(e) => setAssetForm({ ...assetForm, departmentCode: e.target.value })} />
              <input type="number" min="1" className="input-field" placeholder="Qty" value={assetForm.quantity} onChange={(e) => setAssetForm({ ...assetForm, quantity: e.target.value })} />
              <input type="number" min="0" className="input-field" placeholder="Unit Cost ₹" value={assetForm.unitCostInr} onChange={(e) => setAssetForm({ ...assetForm, unitCostInr: e.target.value })} />
              <button type="submit" className="btn btn-primary btn-sm">Add Asset</button>
            </form>
          )}
          <div className="table-container">
            <table className="erp-table">
              <thead><tr><th>Asset Tag</th><th>Name</th><th>Category</th><th>Dept</th><th>Qty</th><th>Unit Cost</th><th>Status</th></tr></thead>
              <tbody>
                {inventoryData.assets.map((a) => (
                  <tr key={a._id}>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{a.assetTag}</td>
                    <td>{a.name}</td>
                    <td>{a.category}</td>
                    <td>{a.departmentCode}</td>
                    <td>{a.quantity}</td>
                    <td>{formatINR(a.unitCostInr)}</td>
                    <td><StatusBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeModule === 'campusOps' && (
        <>
          <PageHeader title="Events, Research, Sports & Safety / Visitor Register" subtitle="Campus events, grants/publications, and minimal-PII visitor tracking (90-day retention TTL)" />
          {can('safety', 'create') && (
            <form onSubmit={handleAddVisitor} className="erp-card" style={{ marginBottom: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.65rem' }}>
              <input className="input-field" placeholder="Visitor Name" required value={visitorForm.visitorName} onChange={(e) => setVisitorForm({ ...visitorForm, visitorName: e.target.value })} />
              <input className="input-field" placeholder="Phone (+91)" required value={visitorForm.contactPhone} onChange={(e) => setVisitorForm({ ...visitorForm, contactPhone: e.target.value })} />
              <input className="input-field" placeholder="Purpose" required value={visitorForm.purpose} onChange={(e) => setVisitorForm({ ...visitorForm, purpose: e.target.value })} />
              <input className="input-field" placeholder="Host / Dept" required value={visitorForm.hostName} onChange={(e) => setVisitorForm({ ...visitorForm, hostName: e.target.value })} />
              <button type="submit" className="btn btn-primary btn-sm">Log Visitor Entry</button>
            </form>
          )}
          <div className="table-container">
            <table className="erp-table">
              <thead><tr><th>Visitor</th><th>Phone</th><th>Purpose</th><th>Host</th><th>Entry Date</th></tr></thead>
              <tbody>
                {opsData.visitors.map((v) => (
                  <tr key={v._id}>
                    <td>{v.visitorName}</td>
                    <td>{v.contactPhone}</td>
                    <td>{v.purpose}</td>
                    <td>{v.hostName}</td>
                    <td>{formatDateIST(v.entryAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

