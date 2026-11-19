import React, { useState, useEffect } from 'react';
import { useERP } from '../context/ERPContext.jsx';
import { api } from '../services/apiClient.js';
import { formatDateIST } from '../utils/formatters.js';
import { PageHeader, StatusBadge } from '../components/UiPrimitives.jsx';
import { ClipboardList, QrCode, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

export const AttendanceGradesView = () => {
  const { students, subjects, employees, can, refreshAll, showToast } = useERP();
  const [activeTab, setActiveTab] = useState('mark'); // 'mark' | 'qr' | 'events' | 'defaulters'
  const [subjectCode, setSubjectCode] = useState(subjects[0]?.code || 'CS-501');
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [lectureSlot, setLectureSlot] = useState('SLOT-1');
  const [captureMethod, setCaptureMethod] = useState('manual');
  const [statusMap, setStatusMap] = useState({});
  const [events, setEvents] = useState([]);
  const [defaulters, setDefaulters] = useState([]);
  const [qrSession, setQrSession] = useState(null);
  const [qrCheckinCode, setQrCheckinCode] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');

  const loadAttendanceData = () => {
    api.get('/attendance/events').then((d) => setEvents(d.events || [])).catch(() => {});
    api.get('/attendance/defaulters').then((d) => setDefaulters(d.defaulters || [])).catch(() => {});
  };

  useEffect(() => {
    loadAttendanceData();
  }, []);

  const handleSaveLecture = async () => {
    try {
      const entries = students.map((s) => ({
        studentId: s._id,
        status: statusMap[s._id] || 'Present'
      }));
      const res = await api.post('/attendance/lectures/mark', {
        subjectCode,
        sessionDate,
        lectureSlot,
        captureMethod,
        entries
      });
      showToast(`Saved lecture attendance for ${res.count} student(s) via ${captureMethod}.`);
      loadAttendanceData();
      refreshAll();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleGenerateQr = async () => {
    try {
      const res = await api.post('/attendance/qr-sessions', {
        subjectCode,
        sessionDate,
        lectureSlot,
        ttlMinutes: 15
      });
      setQrSession(res.session);
      showToast(`QR Check-in Token generated: ${res.session.codeToken}`);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleQrCheckin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/attendance/qr-checkin', { codeToken: qrCheckinCode });
      showToast(res.duplicateIgnored ? 'Attendance already recorded for this session.' : 'QR attendance marked Present!');
      setQrCheckinCode('');
      loadAttendanceData();
      refreshAll();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleRequestCorrection = async (eventId) => {
    const reason = correctionReason || window.prompt('Enter justification for attendance correction:');
    if (!reason) return;
    try {
      await api.post(`/attendance/events/${eventId}/correction`, {
        requestedStatus: 'Excused',
        reason
      });
      showToast('Correction appeal submitted for HOD/Admin approval.');
      setCorrectionReason('');
      loadAttendanceData();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleCorrectionDecision = async (eventId, decision) => {
    try {
      await api.post(`/attendance/events/${eventId}/correction/decision`, { decision });
      showToast(`Correction ${decision} and audited.`);
      loadAttendanceData();
      refreshAll();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleEmployeePunch = async (employeeId, punchType) => {
    try {
      await api.post('/attendance/employee/punch', {
        employeeId,
        punchType,
        sessionDate,
        captureMethod: 'manual'
      });
      showToast(`Employee ${punchType.toUpperCase()} punch recorded.`);
      loadAttendanceData();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Lecture & Employee Attendance Console"
        subtitle="Persisted lecture-wise attendance, QR non-biometric check-in, correction appeals, and shortage alerts"
      />

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {can('attendance', 'create') && (
          <button type="button" className={`btn btn-sm ${activeTab === 'mark' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('mark')}>
            <ClipboardList size={14} /> Mark Lecture Attendance
          </button>
        )}
        <button type="button" className={`btn btn-sm ${activeTab === 'qr' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('qr')}>
          <QrCode size={14} /> QR Check-In & Staff Punch
        </button>
        <button type="button" className={`btn btn-sm ${activeTab === 'events' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('events')}>
          History & Corrections ({events.length})
        </button>
        <button type="button" className={`btn btn-sm ${activeTab === 'defaulters' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('defaulters')}>
          <AlertTriangle size={14} /> Shortage Alerts ({defaulters.length})
        </button>
      </div>

      {activeTab === 'mark' && can('attendance', 'create') && (
        <div className="erp-card">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.65rem', marginBottom: '1rem' }}>
            <select className="select-field" value={subjectCode} onChange={(e) => setSubjectCode(e.target.value)}>
              {subjects.map((s) => <option key={s.code} value={s.code}>{s.code} — {s.name}</option>)}
            </select>
            <input type="date" className="input-field" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} />
            <input className="input-field" value={lectureSlot} onChange={(e) => setLectureSlot(e.target.value)} placeholder="SLOT-1" />
            <select className="select-field" value={captureMethod} onChange={(e) => setCaptureMethod(e.target.value)}>
              <option value="manual">Manual Faculty Entry</option>
              <option value="qr">QR Session Mode</option>
              <option value="rfid">RFID / Smart ID</option>
              <option value="device">Approved Biometric Device</option>
            </select>
            <button type="button" className="btn btn-success btn-sm" onClick={handleSaveLecture}>
              <CheckCircle2 size={14} /> Persist Attendance
            </button>
          </div>

          <div className="table-container">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Student</th>
                  <th>Dept</th>
                  <th>Overall %</th>
                  <th>Lecture Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((st) => (
                  <tr key={st._id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{st.rollNumber}</td>
                    <td>{st.name}</td>
                    <td>{st.deptCode}</td>
                    <td>{st.attendancePct}%</td>
                    <td>
                      <select
                        className="select-field"
                        style={{ width: 'auto', padding: '0.3rem 0.6rem' }}
                        value={statusMap[st._id] || 'Present'}
                        onChange={(e) => setStatusMap({ ...statusMap, [st._id]: e.target.value })}
                      >
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                        <option value="Late">Late</option>
                        <option value="Excused">Excused</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'qr' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {can('attendance', 'create') && (
            <div className="erp-card">
              <h2 style={{ fontSize: '1.05rem', marginBottom: '0.75rem' }}>Generate Non-Biometric QR Session</h2>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleGenerateQr}>
                <QrCode size={15} /> Create 15-Min QR Code Token
              </button>
              {qrSession && (
                <div style={{ marginTop: '1rem', padding: '0.9rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Share code with class ({qrSession.subjectCode}):</div>
                  <div style={{ fontSize: '1.35rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--palette-cyan)' }}>
                    {qrSession.codeToken}
                  </div>
                </div>
              )}
            </div>
          )}

          {can('attendance', 'submit') && (
            <div className="erp-card">
              <h2 style={{ fontSize: '1.05rem', marginBottom: '0.75rem' }}>Student QR Attendance Check-In</h2>
              <form onSubmit={handleQrCheckin} style={{ display: 'flex', gap: '0.5rem' }}>
                <input className="input-field" placeholder="Enter QR Token (CASQR-...)" required value={qrCheckinCode} onChange={(e) => setQrCheckinCode(e.target.value)} />
                <button type="submit" className="btn btn-success btn-sm">Check In</button>
              </form>
            </div>
          )}

          {employees.length > 0 && (
            <div className="erp-card">
              <h2 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Clock size={16} /> Employee Shift Check-In / Out
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {employees.slice(0, 5).map((emp) => (
                  <div key={emp._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.55rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '0.84rem' }}>{emp.name} ({emp.employeeCode})</span>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button type="button" className="btn btn-success btn-sm" onClick={() => handleEmployeePunch(emp._id, 'in')}>In</button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleEmployeePunch(emp._id, 'out')}>Out</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'events' && (
        <div className="erp-card">
          <div className="table-container">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Date (IST)</th>
                  <th>Person</th>
                  <th>Subject / Slot</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Correction Appeal</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr key={ev._id}>
                    <td>{formatDateIST(ev.sessionDate)}</td>
                    <td>{ev.personName} ({ev.personCode})</td>
                    <td>{ev.subjectCode || 'SHIFT'} • {ev.lectureSlot}</td>
                    <td><span className="badge badge-info">{ev.captureMethod}</span></td>
                    <td><StatusBadge status={ev.status} /></td>
                    <td>
                      {ev.correctionRequest?.status && ev.correctionRequest.status !== 'none' ? (
                        <StatusBadge status={ev.correctionRequest.status} />
                      ) : '—'}
                    </td>
                    <td style={{ display: 'flex', gap: '0.35rem' }}>
                      {(!ev.correctionRequest || ev.correctionRequest.status === 'none') && (
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleRequestCorrection(ev._id)}>
                          Appeal
                        </button>
                      )}
                      {can('attendance', 'approve') && ev.correctionRequest?.status === 'pending' && (
                        <>
                          <button type="button" className="btn btn-success btn-sm" onClick={() => handleCorrectionDecision(ev._id, 'approved')}>Approve</button>
                          <button type="button" className="btn btn-danger btn-sm" onClick={() => handleCorrectionDecision(ev._id, 'rejected')}>Reject</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'defaulters' && (
        <div className="erp-card">
          <h2 style={{ fontSize: '1.05rem', marginBottom: '0.75rem' }}>Students Below Institutional Shortage Threshold (&lt;75%)</h2>
          <div className="table-container">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Student</th>
                  <th>Department</th>
                  <th>Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {defaulters.map((d) => (
                  <tr key={d._id}>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{d.rollNumber}</td>
                    <td>{d.name}</td>
                    <td>{d.deptCode}</td>
                    <td style={{ color: 'var(--danger)', fontWeight: 800 }}>{d.attendancePct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
