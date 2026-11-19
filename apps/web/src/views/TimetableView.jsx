import React, { useState } from 'react';
import { useERP } from '../context/ERPContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api } from '../services/apiClient.js';
import { PageHeader, EmptyState } from '../components/UiPrimitives.jsx';
import {
  TIMETABLE_PERIODS,
  OFFICIAL_TIMETABLES,
  AKTU_HOLIDAY_CALENDAR_2026
} from '../data/officialScheduleCalendar.js';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  PlusCircle,
  FileText,
  Download,
  ExternalLink,
  CalendarDays,
  BookOpen,
  Search
} from 'lucide-react';

export const TimetableView = () => {
  const { timetableSlots, departments, subjects, publicFaculty, can, refreshAll, showToast } = useERP();
  const { lang } = useLanguage();

  const [activeTab, setActiveTab] = useState('officialTimetable'); // 'officialTimetable' | 'calendar2026' | 'pdfViewer' | 'customSlots'
  const [selectedBranchId, setSelectedBranchId] = useState('MECHA');
  const [holidayType, setHolidayType] = useState('public'); // 'public' | 'restricted'
  const [holidaySearch, setHolidaySearch] = useState('');
  const [selectedPdfDoc, setSelectedPdfDoc] = useState('timetable'); // 'timetable' | 'calendar'

  const [selectedDay, setSelectedDay] = useState('ALL');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    semesterNumber: 3,
    batch: '2025 - 2029',
    section: 'A',
    dayOfWeek: 'Monday',
    slotTime: '11:10 AM - 12:00 PM',
    subjectCode: subjects[0]?.code || 'CS-501',
    subjectName: subjects[0]?.name || 'Design & Analysis of Algorithms',
    room: 'Room 416',
    deptCode: departments[0]?.code || 'CSE',
    facultyName: publicFaculty[0]?.name || 'Dr. Anuj Kumar Sharma'
  });
  const [error, setError] = useState('');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const activeBranch = OFFICIAL_TIMETABLES.find((b) => b.id === selectedBranchId) || OFFICIAL_TIMETABLES[0];

  const holidayRows = (
    holidayType === 'public'
      ? AKTU_HOLIDAY_CALENDAR_2026.publicHolidays
      : AKTU_HOLIDAY_CALENDAR_2026.restrictedHolidays
  ).filter((h) => {
    const q = holidaySearch.trim().toLowerCase();
    if (!q) return true;
    return (
      h.name.toLowerCase().includes(q) ||
      h.nameHi.toLowerCase().includes(q) ||
      h.date.includes(q) ||
      h.day.toLowerCase().includes(q)
    );
  });

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/academics/timetable', {
        ...form,
        semesterNumber: Number(form.semesterNumber)
      });
      await refreshAll();
      showToast('Timetable slot scheduled (no conflicts detected).');
      setShowAdd(false);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page-wrapper">
      <PageHeader
        title="CAS Timetable & AKTU Academic Calendar (2026–27)"
        subtitle="B.Tech 3rd Semester timetables (w.e.f. 5th Oct 2026), AKTU 2026 Holiday Calendar, embedded PDFs & live clash-checked scheduler"
        actions={
          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'officialTimetable' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('officialTimetable')}
            >
              <Calendar size={14} /> B.Tech Timetable
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'calendar2026' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('calendar2026')}
            >
              <CalendarDays size={14} /> Holiday Calendar 2026
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'pdfViewer' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('pdfViewer')}
            >
              <FileText size={14} /> Embedded PDFs
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'customSlots' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('customSlots')}
            >
              <Clock size={14} /> Live Slots ({timetableSlots.length})
            </button>
          </div>
        }
      />

      {/* TAB 1: OFFICIAL CAS B.TECH 3RD SEMESTER TIMETABLES (4 BRANCHES) */}
      {activeTab === 'officialTimetable' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.65rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
              {OFFICIAL_TIMETABLES.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBranchId(b.id)}
                  className={`btn btn-sm ${selectedBranchId === b.id ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {b.shortLabel}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSelectedPdfDoc('timetable');
                  setActiveTab('pdfViewer');
                }}
              >
                <FileText size={14} /> View Embedded PDF
              </button>
              <a
                href="/docs/cas-timetable-2026-27.pdf"
                download="CAS-BTech-3rd-Sem-Timetable-2026-27.pdf"
                className="btn btn-secondary btn-sm"
              >
                <Download size={14} /> Download PDF
              </a>
            </div>
          </div>

          <section className="erp-card" style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>
                  {activeBranch.branchTitle} — {activeBranch.semester}
                </h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {activeBranch.session} • <strong>Branch Coordinator:</strong> {activeBranch.coordinator} • <strong>Class Room No.:</strong> {activeBranch.room}
                </div>
              </div>
              <span className="badge badge-info">Approved: Dr. Anuj Kumar Sharma (Dean Academics, CAS)</span>
            </div>

            <div className="table-container" style={{ marginBottom: '1.25rem' }}>
              <table className="erp-table" style={{ fontSize: '0.78rem', textAlign: 'center' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', minWidth: '105px' }}>DAY \ TIME</th>
                    {TIMETABLE_PERIODS.map((p, i) => (
                      <th key={i} style={{ textAlign: 'center', minWidth: i === 4 ? '95px' : '110px' }}>
                        {p}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeBranch.days.map((row, rowIdx) => (
                    <tr key={row.day}>
                      <td style={{ fontWeight: 800, textAlign: 'left', color: 'var(--palette-cyan)', whiteSpace: 'nowrap' }}>
                        {row.day}
                      </td>
                      {row.morning.map((cell, cIdx) => (
                        <td
                          key={`m-${cIdx}`}
                          colSpan={cell.span}
                          style={{
                            fontWeight: cell.label === '—' ? 400 : 700,
                            background: cell.isLab
                              ? 'rgba(53, 135, 164, 0.16)'
                              : cell.isActivity
                                ? 'rgba(45, 137, 139, 0.12)'
                                : 'transparent',
                            color: cell.label === '—' ? 'var(--text-muted)' : 'var(--text-primary)',
                            borderLeft: '1px solid var(--border-subtle)',
                            borderRight: '1px solid var(--border-subtle)'
                          }}
                        >
                          {cell.label}
                        </td>
                      ))}

                      {rowIdx === 0 && (
                        <td
                          rowSpan={activeBranch.days.length}
                          style={{
                            fontWeight: 800,
                            letterSpacing: '0.12em',
                            color: 'var(--palette-cyan)',
                            background: 'var(--bg-tertiary)',
                            writingMode: 'vertical-rl',
                            textOrientation: 'upright',
                            textAlign: 'center',
                            verticalAlign: 'middle'
                          }}
                        >
                          LUNCH
                        </td>
                      )}

                      {row.afternoon.map((cell, cIdx) => (
                        <td
                          key={`a-${cIdx}`}
                          colSpan={cell.span}
                          style={{
                            fontWeight: cell.label === '—' ? 400 : 700,
                            background: cell.isLab
                              ? 'rgba(53, 135, 164, 0.16)'
                              : cell.isActivity
                                ? 'rgba(45, 137, 139, 0.12)'
                                : 'transparent',
                            color: cell.label === '—' ? 'var(--text-muted)' : 'var(--text-primary)',
                            borderLeft: '1px solid var(--border-subtle)',
                            borderRight: '1px solid var(--border-subtle)'
                          }}
                        >
                          {cell.label}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 style={{ fontSize: '0.96rem', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <BookOpen size={16} color="var(--palette-cyan)" /> Subject & Faculty In-Charge Mapping ({activeBranch.shortLabel})
            </h3>
            <div className="table-container">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Subject Code</th>
                    <th>Subject Name</th>
                    <th>Faculty In-Charge</th>
                    <th>Lab Staff</th>
                  </tr>
                </thead>
                <tbody>
                  {activeBranch.subjects.map((sub) => (
                    <tr key={sub.code}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--palette-cyan)' }}>{sub.code}</td>
                      <td style={{ fontWeight: 600 }}>{sub.name}</td>
                      <td>{sub.faculty}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{sub.labStaff || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* TAB 2: OFFICIAL AKTU 2026 ACADEMIC & HOLIDAY CALENDAR */}
      {activeTab === 'calendar2026' && (
        <section className="erp-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>
                AKTU Lucknow Academic & Holiday Calendar — 2026
              </h2>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Letter No.: <strong>{AKTU_HOLIDAY_CALENDAR_2026.letterNo}</strong> • Issued: {AKTU_HOLIDAY_CALENDAR_2026.issuedDate} • {AKTU_HOLIDAY_CALENDAR_2026.signatory}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSelectedPdfDoc('calendar');
                  setActiveTab('pdfViewer');
                }}
              >
                <FileText size={14} /> View Original PDF
              </button>
              <a
                href="/docs/aktu-holiday-calendar-2026.pdf"
                download="AKTU-Holiday-Calendar-2026.pdf"
                className="btn btn-secondary btn-sm"
              >
                <Download size={14} /> Download PDF
              </a>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem' }}>
            <button
              type="button"
              className={`btn btn-sm ${holidayType === 'public' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setHolidayType('public')}
            >
              Public / Gazetted Holidays ({AKTU_HOLIDAY_CALENDAR_2026.publicHolidays.length})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${holidayType === 'restricted' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setHolidayType('restricted')}
            >
              Restricted Holidays ({AKTU_HOLIDAY_CALENDAR_2026.restrictedHolidays.length})
            </button>

            <div className="input-with-icon" style={{ flex: 1, minWidth: '220px' }}>
              <span className="icon-prefix">
                <Search size={14} />
              </span>
              <input
                type="search"
                className="input-field"
                placeholder="Search festival, date (2026-MM-DD), or day..."
                value={holidaySearch}
                onChange={(e) => setHolidaySearch(e.target.value)}
              />
            </div>
          </div>

          <div className="table-container" style={{ marginBottom: '1rem' }}>
            <table className="erp-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Day</th>
                  <th>Festival / Holiday Name</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                {holidayRows.map((h) => (
                  <tr key={`${holidayType}-${h.sr}`}>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{h.sr}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--palette-cyan)' }}>{h.date}</td>
                    <td>{h.day}</td>
                    <td style={{ fontWeight: 600 }}>
                      {lang === 'hi' ? h.nameHi : h.name}
                    </td>
                    <td>
                      <span className={`badge ${holidayType === 'public' ? 'badge-success' : 'badge-info'}`}>
                        {holidayType === 'public' ? 'Gazetted / Public' : 'Restricted (RH)'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            <strong style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
              AKTU Registrar Notes:
            </strong>
            <ul style={{ paddingLeft: '1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {AKTU_HOLIDAY_CALENDAR_2026.notes.map((n, idx) => (
                <li key={idx}>{n}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* TAB 3: EMBEDDED ORIGINAL OFFICIAL PDF DOCUMENTS */}
      {activeTab === 'pdfViewer' && (
        <section className="erp-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.65rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`btn btn-sm ${selectedPdfDoc === 'timetable' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedPdfDoc('timetable')}
              >
                <FileText size={14} /> CAS B.Tech 3rd Sem Timetable PDF (4 Pages)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${selectedPdfDoc === 'calendar' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedPdfDoc('calendar')}
              >
                <CalendarDays size={14} /> AKTU Holiday Calendar 2026 PDF (3 Pages)
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.45rem' }}>
              <a
                href={selectedPdfDoc === 'timetable' ? '/docs/cas-timetable-2026-27.pdf' : '/docs/aktu-holiday-calendar-2026.pdf'}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
              >
                Open in New Tab <ExternalLink size={13} />
              </a>
              <a
                href={selectedPdfDoc === 'timetable' ? '/docs/cas-timetable-2026-27.pdf' : '/docs/aktu-holiday-calendar-2026.pdf'}
                download
                className="btn btn-primary btn-sm"
              >
                <Download size={13} /> Download PDF
              </a>
            </div>
          </div>

          <iframe
            title={selectedPdfDoc === 'timetable' ? 'CAS B.Tech 3rd Semester Timetable PDF' : 'AKTU Holiday Calendar 2026 PDF'}
            src={selectedPdfDoc === 'timetable' ? '/docs/cas-timetable-2026-27.pdf' : '/docs/aktu-holiday-calendar-2026.pdf'}
            style={{
              width: '100%',
              height: '760px',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              background: '#ffffff'
            }}
          />
        </section>
      )}

      {/* TAB 4: LIVE MONGODB TIMETABLE SLOTS & SERVER CONFLICT GUARD */}
      {activeTab === 'customSlots' && (
        <>
          {can('timetable', 'create') && (
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowAdd(!showAdd)}>
                <PlusCircle size={15} /> Schedule Slot
              </button>
            </div>
          )}

          {showAdd && (
            <form onSubmit={handleCreateSlot} className="erp-card" style={{ marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Schedule Lecture Slot (Server Clash Guard)</h2>
              {error && <div style={{ color: 'var(--danger)', fontSize: '0.82rem', marginBottom: '0.6rem' }}>{error}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.65rem' }}>
                <select className="select-field" value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}>
                  {days.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <input className="input-field" placeholder="Time Slot" required value={form.slotTime} onChange={(e) => setForm({ ...form, slotTime: e.target.value })} />
                <input className="input-field" placeholder="Subject Code" required value={form.subjectCode} onChange={(e) => setForm({ ...form, subjectCode: e.target.value })} />
                <input className="input-field" placeholder="Subject Name" required value={form.subjectName} onChange={(e) => setForm({ ...form, subjectName: e.target.value })} />
                <input className="input-field" placeholder="Room / Lab" required value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} />
                <select className="select-field" value={form.facultyName} onChange={(e) => setForm({ ...form, facultyName: e.target.value })}>
                  {(publicFaculty.length ? publicFaculty : [{ name: 'Dr. Anuj Kumar Sharma', deptCode: 'MECHA' }]).map((f) => (
                    <option key={f._id || f.name} value={f.name}>
                      {f.name} ({f.deptCode})
                    </option>
                  ))}
                </select>
                <select className="select-field" value={form.deptCode} onChange={(e) => setForm({ ...form, deptCode: e.target.value })}>
                  {departments.map((d) => <option key={d.code} value={d.code}>{d.code}</option>)}
                </select>
                <button type="submit" className="btn btn-success btn-sm">Check Conflict & Save</button>
              </div>
            </form>
          )}

          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            <button type="button" className={`btn btn-sm ${selectedDay === 'ALL' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSelectedDay('ALL')}>
              All Days
            </button>
            {days.map((d) => (
              <button key={d} type="button" className={`btn btn-sm ${selectedDay === d ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSelectedDay(d)}>
                {d}
              </button>
            ))}
          </div>

          {timetableSlots.length === 0 ? (
            <EmptyState title="No timetable slots found" description="Schedule a lecture slot above to populate the weekly grid." />
          ) : (
            <div className="card-grid-stagger" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {days
                .filter((d) => selectedDay === 'ALL' || selectedDay === d)
                .map((day) => {
                  const slots = timetableSlots.filter((s) => s.dayOfWeek === day);
                  if (slots.length === 0) return null;
                  return (
                    <div key={day} className="erp-card">
                      <h3 style={{ fontSize: '1.05rem', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={16} color="var(--palette-cyan)" /> {day}
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.85rem' }}>
                        {slots.map((slot) => (
                          <div key={slot._id} style={{ padding: '0.85rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.3rem' }}>
                              <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--palette-cyan)' }}>{slot.subjectCode}</strong>
                              <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={12} /> {slot.slotTime}
                              </span>
                            </div>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.4rem' }}>{slot.subjectName}</div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                              <span><User size={12} style={{ display: 'inline' }} /> {slot.facultyName}</span>
                              <span><MapPin size={12} style={{ display: 'inline' }} /> {slot.room}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
