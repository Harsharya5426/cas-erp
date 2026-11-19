import React, { useState, useEffect } from 'react';
import { useERP } from '../context/ERPContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api } from '../services/apiClient.js';
import { formatDateIST, formatINR } from '../utils/formatters.js';
import { PageHeader, StatCard, StatusBadge } from '../components/UiPrimitives.jsx';
import {
  Users,
  UserCheck,
  CreditCard,
  AlertTriangle,
  BellRing,
  CalendarOff,
  Calendar,
  Sparkles,
  ShieldCheck,
  Award,
  BookOpen,
  Cpu,
  ExternalLink
} from 'lucide-react';

export const DashboardView = ({
  onNavigate,
  onOpenEnroll,
  onOpenCollectFee,
  onViewReceipt
}) => {
  const {
    currentUser,
    currentRole,
    ROLES,
    can,
    students,
    publicFaculty,
    payments,
    announcements,
    settings
  } = useERP();
  const { lang, t } = useLanguage();
  const [summaryKpis, setSummaryKpis] = useState(null);
  const [guardianLinks, setGuardianLinks] = useState([]);

  const deanAnuj =
    publicFaculty.find((f) => f.name?.toLowerCase().includes('anuj kumar sharma')) || {
      name: 'Dr. Anuj Kumar Sharma',
      photoUrl: '/faculty/image005.jpg',
      designation: 'Associate Professor & Dean Academics',
      administrativeRoles: [
        'Dean Academics, Centre for Advanced Studies (CAS)',
        'Program Coordinator (Mechatronics & Manufacturing Technology & Automation)',
        'Associate Dean Innovation & Social Entrepreneurship, AKTU Lucknow',
        'Associate Dean Post Graduate Studies & Research, AKTU Lucknow'
      ],
      qualification: 'Ph.D. (IIT ISM Dhanbad, 2017) • M.Tech. (UPTU Lucknow, 2008) • B.E. (CCS University Meerut, 2003)',
      areasOfInterest: [
        'Metal Cutting Operations',
        'Electrical Discharge Machining (EDM)',
        'Machining Tribology & MQL Machining',
        'Nano-Cutting Fluids',
        'Thermocouples for Machining',
        'Soft Robotics & Bio-Inspired Robotics'
      ],
      bio: 'Associate Professor in Mechatronics and Dean Academics at CAS AKTU Lucknow. Principal Investigator for 4 funded projects (SERB DST, TEQIP-III CRIP human-inspired robotic hand, and AKTU VRPS online tool-wear monitoring). Authored 75+ SCIE/Scopus papers, 2 book chapters (Taylor & Francis, Springer), and 2 COVID-19 patents. Recipient of AKTU Best Teachers Award 2020, Research Excellence Award 2017, and AKTU Corona Warrior Award.',
      publicationsCount: 75,
      profilePageUrl: 'https://cas.res.in/home1/index.html',
      publicationsPdfUrl: 'https://cas.res.in/pdf/Dr.Anuj.pdf',
      scopusUrl: 'https://www.scopus.com/authid/detail.uri?authorId=59139955600',
      googleScholarUrl: 'https://scholar.google.com/citations?hl=en&user=Dy6t9FQAAAAJ'
    };

  useEffect(() => {
    if (can('reports', 'view')) {
      api.get('/reports/summary').then((d) => setSummaryKpis(d.kpis)).catch(() => {});
    }
    if (currentRole === 'PARENT') {
      api.get('/academics/guardian-links').then((d) => setGuardianLinks(d.links || [])).catch(() => {});
    }
  }, [can, currentRole]);

  return (
    <div className="page-wrapper">
      {/* Required test & standard header */}
      <PageHeader
        title={`${settings?.institutionName || 'Centre for Advanced Studies'} | cas.erp`}
        subtitle={`${ROLES[currentRole]?.label || currentRole} • ${settings?.activeAcademicYear || '2026 - 2027'} (${settings?.activeSemesterLabel || 'Odd Semester'})`}
        actions={
          <>
            {can('students', 'create') && (
              <button type="button" onClick={onOpenEnroll} className="btn btn-primary btn-sm">
                <Sparkles size={15} /> Enroll Student
              </button>
            )}
            {can('finance', 'create') && (
              <button type="button" onClick={onOpenCollectFee} className="btn btn-success btn-sm">
                <CreditCard size={15} /> Record Fee Payment
              </button>
            )}
          </>
        }
      />

      {/* Official Institutional Welcome Banner with Abstract Mesh Aesthetics */}
      <section
        className="erp-card abstract-mesh-bg"
        style={{
          marginBottom: '1.5rem',
          border: '1.5px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem',
          padding: '1.35rem 1.75rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div className="abstract-glow-orb" style={{ top: '-60px', right: '-40px' }} aria-hidden="true" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          <a
            href="https://erp.aktu.ac.in/"
            target="_blank"
            rel="noopener noreferrer"
            title="Visit AKTU ERP Portal (erp.aktu.ac.in)"
            style={{ display: 'inline-flex', cursor: 'pointer' }}
          >
            <img
              src="/aktu-logo.png"
              alt="AKTU Seal"
              style={{ width: '64px', height: '64px', objectFit: 'contain' }}
            />
          </a>
          <a
            href="https://cas.res.in/"
            target="_blank"
            rel="noopener noreferrer"
            title="Visit Centre for Advanced Studies (cas.res.in)"
            style={{ display: 'inline-flex', cursor: 'pointer' }}
          >
            <img
              src="/cas-crest.png"
              alt="CAS Emblem"
              style={{
                width: '60px',
                height: '60px',
                objectFit: 'contain',
                borderRadius: '50%',
                background: '#ffffff',
                padding: '3px',
                border: '2px solid var(--accent-primary)'
              }}
            />
          </a>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--palette-cyan)' }}>
              {t('auth.univFull')}
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {t('auth.title')} (CAS) — Institutional ERP
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              AKTU Main Campus, Sector-11, Jankipuram Vistar, Lucknow - 226031, Uttar Pradesh
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem', position: 'relative', zIndex: 1 }}>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '0.2rem 0.6rem',
              borderRadius: '4px',
              background: 'var(--accent-primary)',
              color: '#ffffff'
            }}
          >
            {t('auth.poweredByBadge')}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Session: <strong>{settings?.activeAcademicYear || '2026 - 2027'}</strong> • Odd Semester
          </span>
        </div>
      </section>

      {/* Executive Operations Abstract Capsule */}
      <section className="cas-institutional-abstract abstract-mesh-bg" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.65rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <ShieldCheck size={18} color="var(--palette-cyan)" />
            <h2 style={{ fontSize: '0.92rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0, color: 'var(--palette-cyan)' }}>
              Executive Operations Abstract • Real-Time Scope
            </h2>
          </div>
          <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>
            Role: {ROLES[currentRole]?.label || currentRole}
          </span>
        </div>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 0.85rem 0' }}>
          CAS ERP unifies university-level governance across academic scheduling, automated fee collection, biometrics/face attendance, and research computing. Operating under verified ordinances of AKTU Lucknow.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span className="abstract-stat-chip">🏛️ AKTU Ordinance Compliance: Active</span>
          <span className="abstract-stat-chip">⚡ Server Engine: Node.js + Express (MERN)</span>
          <span className="abstract-stat-chip">🔐 Security: RBAC + Stateless JWT &amp; HttpOnly Cookie</span>
          <span className="abstract-stat-chip">📊 Active Roster: {students.length || 0} Students Monitored</span>
          <span className="abstract-stat-chip">💳 Cashfree / Bank Treasury: Online &amp; Offline Audit</span>
        </div>
      </section>

      {/* Director's Desk & Research Leadership Card (Images from cas.res.in) */}
      <section
        className="erp-card"
        style={{
          marginBottom: '1.5rem',
          borderLeft: '4px solid var(--accent-primary)',
          padding: '1.25rem 1.6rem'
        }}
      >
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <img
            src="/cas-director.jpg"
            alt="Prof. S. P. Shukla, Director CAS"
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '3px solid var(--accent-primary)',
              boxShadow: '0 4px 12px var(--accent-glow)'
            }}
          />
          <div style={{ flex: 1, minWidth: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--palette-cyan)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                DIRECTOR'S DESK • LEADERSHIP
              </span>
              <span className="badge badge-success" style={{ fontSize: '0.62rem' }}>Verified Ordinance</span>
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.2rem' }}>
              Prof. S. P. Shukla <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>(Ph.D. IIT Kanpur) — Director, Centre for Advanced Studies</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
              "Centre for Advanced Studies (CAS) is the postgraduate and research hub of Dr. A.P.J. Abdul Kalam Technical University, focused on translational research and specialized master's curricula in Artificial Intelligence, Nanotechnology, Mechatronics, Energy Science, and Advanced Computing."
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            <div><strong>Dean Academics:</strong> Dr. Anuj Kumar Sharma</div>
            <div><strong>Controller of Exams:</strong> Examination Cell</div>
            <div><strong>CAS Main Portal:</strong> cas.res.in</div>
          </div>
        </div>
      </section>

      {/* Dean Academics Spotlight Card — Dr. Anuj Kumar Sharma (Official Details from cas.res.in/faculty.html) */}
      <section
        className="erp-card"
        style={{
          marginBottom: '1.5rem',
          borderLeft: '4px solid var(--palette-cyan)',
          padding: '1.35rem 1.6rem',
          background: 'linear-gradient(135deg, rgba(53, 135, 164, 0.1) 0%, rgba(16, 33, 43, 0.04) 100%)'
        }}
      >
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <img
            src={deanAnuj.photoUrl || '/faculty/image005.jpg'}
            alt="Dr. Anuj Kumar Sharma — Dean Academics, CAS AKTU"
            style={{
              width: '92px',
              height: '92px',
              borderRadius: '50%',
              objectFit: 'cover',
              objectPosition: 'top',
              border: '3px solid var(--palette-cyan)',
              boxShadow: '0 4px 14px var(--accent-glow)',
              flexShrink: 0
            }}
          />
          <div style={{ flex: 1, minWidth: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--palette-cyan)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                DEAN ACADEMICS • ACADEMIC & RESEARCH LEADERSHIP
              </span>
              <span className="badge badge-info" style={{ fontSize: '0.62rem' }}>AKTU Best Teachers Award 2020</span>
              <span className="badge badge-success" style={{ fontSize: '0.62rem' }}>{deanAnuj.publicationsCount || 75}+ SCIE & Scopus Papers</span>
            </div>

            <div style={{ fontWeight: 800, fontSize: '1.12rem', marginBottom: '0.2rem' }}>
              {deanAnuj.name}{' '}
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                — {deanAnuj.designation}
              </span>
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.45rem', lineHeight: 1.45 }}>
              <strong>Roles:</strong> {(deanAnuj.administrativeRoles || []).join(' • ')}
            </div>

            <div style={{ fontSize: '0.77rem', color: 'var(--text-muted)', marginBottom: '0.55rem' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Qualifications:</strong> {deanAnuj.qualification}
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 0.65rem 0' }}>
              {deanAnuj.bio}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.75rem' }}>
              {(deanAnuj.areasOfInterest || []).map((area, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '0.69rem',
                    padding: '0.18rem 0.5rem',
                    borderRadius: '4px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    fontWeight: 600
                  }}
                >
                  {area}
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              {deanAnuj.profilePageUrl && (
                <a href={deanAnuj.profilePageUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
                  Profile Page <ExternalLink size={12} />
                </a>
              )}
              {deanAnuj.publicationsPdfUrl && (
                <a href={deanAnuj.publicationsPdfUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                  Publications PDF <ExternalLink size={12} />
                </a>
              )}
              {deanAnuj.scopusUrl && (
                <a href={deanAnuj.scopusUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                  Scopus Profile <ExternalLink size={12} />
                </a>
              )}
              {deanAnuj.googleScholarUrl && (
                <a href={deanAnuj.googleScholarUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                  Google Scholar <ExternalLink size={12} />
                </a>
              )}
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => onNavigate('faculty')}>
                <UserCheck size={13} /> View All {publicFaculty.length || 21} CAS Faculty
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ERP Quick Services Bar */}
      <section style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          CAS ERP SERVICES & QUICK ACTIONS
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
          {can('students', 'view') && (
            <button
              type="button"
              className="erp-card"
              onClick={() => onNavigate('students')}
              style={{ padding: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', textAlign: 'left', border: '1px solid var(--border-color)' }}
            >
              <Users size={20} color="var(--palette-cyan)" />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>Student Directory</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Enrollment & Dossiers</div>
              </div>
            </button>
          )}

          {can('exams', 'view') && (
            <button
              type="button"
              className="erp-card"
              onClick={() => onNavigate('exams')}
              style={{ padding: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', textAlign: 'left', border: '1px solid var(--border-color)' }}
            >
              <Award size={20} color="var(--accent-primary)" />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>Examinations & LMS</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Marks Entry & Results</div>
              </div>
            </button>
          )}

          {can('finance', 'view') && (
            <button
              type="button"
              className="erp-card"
              onClick={() => onNavigate('finance')}
              style={{ padding: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', textAlign: 'left', border: '1px solid var(--border-color)' }}
            >
              <CreditCard size={20} color="#10b981" />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>Fee Ledger & Inflow</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Challans & Receipts</div>
              </div>
            </button>
          )}

          <button
            type="button"
            className="erp-card"
            onClick={() => onNavigate('timetable')}
            style={{ padding: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', textAlign: 'left', border: '1px solid var(--border-color)' }}
          >
            <Calendar size={20} color="#f59e0b" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>Timetable & Calendar</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>2026-27 Schedules & Holidays</div>
            </div>
          </button>

          <button
            type="button"
            className="erp-card"
            onClick={() => onNavigate('faculty')}
            style={{ padding: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', textAlign: 'left', border: '1px solid var(--border-color)' }}
          >
            <UserCheck size={20} color="var(--palette-cyan)" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>CAS Faculty ({publicFaculty.length || 21})</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Profiles & Research</div>
            </div>
          </button>

          {can('admissions', 'view') && (
            <button
              type="button"
              className="erp-card"
              onClick={() => onNavigate('admissions')}
              style={{ padding: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', textAlign: 'left', border: '1px solid var(--border-color)' }}
            >
              <BookOpen size={20} color="#3587a4" />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>Admissions & CMS</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Application Verifications</div>
              </div>
            </button>
          )}
        </div>
      </section>

      {/* Parent Portal Verified Student Banner */}
      {currentRole === 'PARENT' && (
        <section className="erp-card" style={{ marginBottom: '1.5rem', borderColor: 'var(--border-highlight)' }}>
          <h2 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={18} color="var(--success)" /> Verified Guardian-Linked Student(s)
          </h2>
          {guardianLinks.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No verified student links found.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              {guardianLinks.map((lnk) => (
                <div key={lnk._id} style={{ padding: '0.9rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <strong>{lnk.studentId?.name}</strong>
                    <StatusBadge status={lnk.verificationStatus} />
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Roll: {lnk.studentId?.rollNumber} • Dept: {lnk.studentId?.deptCode} • Sem {lnk.studentId?.semesterNumber}
                  </div>
                  <div style={{ fontSize: '0.8rem', marginTop: '0.4rem' }}>
                    Attendance: <strong>{lnk.studentId?.attendancePct}%</strong> • Fee Due: <strong>{formatINR(lnk.studentId?.dueFeeInr)}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Role-Scoped KPI Cards */}
      <div
        className="kpi-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}
      >
        <StatCard
          label="CAS Faculty & Staff"
          value={summaryKpis?.totalEmployees ?? publicFaculty.length}
          hint={`${summaryKpis?.departments ?? 6} academic departments`}
          icon={<UserCheck size={18} />}
          onClick={() => onNavigate('faculty')}
        />
        <StatCard
          label="Timetable & Academic Calendar"
          value="2026–27"
          hint="4 B.Tech 3rd Sem branches • 59 AKTU holidays"
          icon={<Calendar size={18} />}
          onClick={() => onNavigate('timetable')}
        />
        <StatCard
          label="Attendance Alerts (<75%)"
          value={summaryKpis?.attendanceShortageCount ?? students.filter((s) => s.attendancePct < 75).length}
          tone="warning"
          hint={`${summaryKpis?.pendingLeaves ?? 0} pending leave requests`}
          icon={<AlertTriangle size={18} />}
          onClick={can('attendance', 'view') ? () => onNavigate('attendance') : undefined}
        />
      </div>

      {/* Campus Research Infrastructure Showcase (Real Photos from cas.res.in) */}
      <section className="erp-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--palette-cyan)', fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase' }}>
              <Cpu size={16} /> CAS RESEARCH LABS & ADVANCED COMPUTING CLUSTERS
            </div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '0.2rem' }}>
              Specialized Laboratories & Infrastructure at CAS AKTU
            </h2>
          </div>
          <a
            href="https://cas.res.in/infra.html"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.72rem' }}
          >
            cas.res.in Infra <ExternalLink size={12} />
          </a>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '1rem'
          }}
        >
          <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
            <img src="/cas-ai-lab.jpeg" alt="CAS AI Lab" style={{ width: '100%', height: '130px', objectFit: 'cover' }} />
            <div style={{ padding: '0.75rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.84rem' }}>AI & Deep Learning Lab</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>NVIDIA GPU clusters & neural network training rigs</div>
            </div>
          </div>

          <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
            <img src="/cas-robotics-lab.jpeg" alt="Robotics Lab" style={{ width: '100%', height: '130px', objectFit: 'cover' }} />
            <div style={{ padding: '0.75rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.84rem' }}>Robotics & Automation Lab</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Autonomous robotic arms & industrial controllers</div>
            </div>
          </div>

          <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
            <img src="/cas-3d-lab.jpeg" alt="3D Printing Lab" style={{ width: '100%', height: '130px', objectFit: 'cover' }} />
            <div style={{ padding: '0.75rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.84rem' }}>3D Printing & Mechatronics</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Additive manufacturing & rapid prototyping rigs</div>
            </div>
          </div>

          <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
            <img src="/cas-nanofab.jpg" alt="Nanofabrication" style={{ width: '100%', height: '130px', objectFit: 'cover' }} />
            <div style={{ padding: '0.75rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.84rem' }}>Nanotechnology Cleanroom</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Chemical vapor deposition & thin film characterization</div>
            </div>
          </div>
        </div>
      </section>

      {/* Notices & Recent Activity (Alternating left and right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        <section className="erp-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
            <h2 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <BellRing size={17} color="var(--palette-cyan)" /> Campus Circulars & Ordinances
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <img src="/new-badge.gif" alt="Live" style={{ height: '15px' }} />
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => onNavigate('notices')}>
                View All
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            {announcements.slice(0, 4).map((a, idx) => (
              <div key={a._id} style={{ padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--accent-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <StatusBadge status={a.priority} />
                    {idx === 0 && <img src="/new-badge.gif" alt="New" style={{ height: '13px' }} />}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{formatDateIST(a.publishedAt)}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                  {lang === 'hi' && a.titleHi ? a.titleHi : a.title}
                </div>
              </div>
            ))}
            {announcements.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No notices posted yet.</p>
            )}
          </div>
        </section>

        {can('finance', 'view') && (
          <section className="erp-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
              <h2 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <CreditCard size={17} color="var(--success)" /> Recent Fee Receipts
              </h2>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => onNavigate('finance')}>
                Open Ledger
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {payments.slice(0, 5).map((p) => (
                <div
                  key={p._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.65rem 0.75rem',
                    background: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{p.studentName}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {p.receiptNo} • {formatDateIST(p.settledAt || p.createdAt)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong style={{ color: 'var(--success)', fontSize: '0.85rem' }}>{formatINR(p.amountInr)}</strong>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => onViewReceipt?.(p)}>
                      Receipt
                    </button>
                  </div>
                </div>
              ))}
              {payments.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No fee receipts visible in your scope.</p>
              )}
            </div>
          </section>
        )}

        {!can('finance', 'view') && (
          <section className="erp-card">
            <h2 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <CalendarOff size={17} color="var(--palette-cyan)" /> Self-Service & Profile
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
              Signed in as <strong>{currentUser?.name}</strong> ({currentUser?.email}). Use the sidebar to access your permitted modules.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {can('leave', 'view') && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => onNavigate('leaveManagement')}>
                  Leave & Outpass
                </button>
              )}
              {can('grievances', 'view') && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => onNavigate('grievances')}>
                  Grievance & Helpdesk
                </button>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};