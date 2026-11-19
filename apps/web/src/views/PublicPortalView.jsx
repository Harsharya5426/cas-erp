import React, { useState, useEffect } from 'react';
import { api } from '../services/apiClient.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { formatDateIST } from '../utils/formatters.js';
import { StatusBadge } from '../components/UiPrimitives.jsx';
import { FacultyDirectoryGrid } from '../components/FacultyDirectoryGrid.jsx';
import { InstitutionalFooter } from '../components/InstitutionalFooter.jsx';
import { PublicNavbar } from '../components/PublicNavbar.jsx';
import {
  Building2,
  Send,
  Search,
  ShieldCheck,
  BellRing,
  CheckCircle2,
  Cpu,
  GraduationCap,
  BookOpen,
  Award,
  ExternalLink,
  Compass,
  FlaskConical,
  FileText
} from 'lucide-react';

const CAS_FOCUS_AREAS = [
  {
    dept: 'CSE',
    title: 'Computer Science & Engineering',
    link: 'https://cas.res.in/Mtechcse.html',
    topics: ['Artificial Intelligence (ML & Deep Learning)', 'Cyber Security', 'Data Science & Analytics', 'Internet of Things (IoT)', 'Computer Vision & Cloud Computing']
  },
  {
    dept: 'MECHA',
    title: 'Mechatronics Engineering',
    link: 'https://cas.res.in/mtechmecha.html',
    topics: ['Robotics & Soft Robotics', 'PLC & SCADA Automation', 'AI-Based Autonomous Systems', 'Drones & Aerial Systems']
  },
  {
    dept: 'NANO',
    title: 'Nanotechnology & VLSI',
    link: 'https://cas.res.in/mtechnano.html',
    topics: ['Nanomaterial Synthesis & Characterization', 'Nano-Fabrication Cleanroom', 'MEMS / NEMS Devices', 'Microfluidics & Organic VLSI']
  },
  {
    dept: 'EST',
    title: 'Energy Science & Technology',
    link: 'https://cas.res.in/mtechenergy.html',
    topics: ['Unconventional & Renewable Energy', 'Energy Conversion & Storage Systems', 'Alternate Energy & Solar Photovoltaics', 'Industrial Energy Management']
  },
  {
    dept: 'MTA',
    title: 'Manufacturing Technology & Automation',
    link: 'https://cas.res.in/mtechmanufacturing.html',
    topics: ['Industry 4.0 Smart Factories', '3D Printing & Additive Manufacturing', 'Micro & Nano Manufacturing', 'CNC & Robotics Automation']
  },
  {
    dept: 'BTECH / PHD',
    title: 'B.Tech & Doctoral (Ph.D.) Programmes',
    link: 'https://cas.res.in/csephd.html',
    topics: ['B.Tech CSE, CSE (AIML), VLSI & MECHA', 'Ph.D. in Engineering & Technology', 'NVIDIA DGX-2 Supercomputing Access', 'SERB DST / AICTE / TEQIP-III Projects']
  }
];

const CAS_PUBLICATIONS = [
  {
    authors: 'Ramkrishna Sahoo, Tae Hoon Lee, Duy Tho Pham, Thi Hoai Thuong Luu & Young Hee Lee',
    title: 'Fast-Charging High-Energy Battery–Supercapacitor Hybrid: Anodic Reduced Graphene Oxide–Vanadium(IV) Oxide Sheet-on-Sheet Heterostructure',
    journal: 'ACS Nano (SCI Indexed)',
    impact: 'IF 15.881'
  },
  {
    authors: 'Abhilasha Singh & Malay Kishore Dutta',
    title: 'A Robust Zero-Watermarking Scheme for Tele-Ophthalmological Applications',
    journal: 'Information Sciences, Elsevier (SCI Indexed)',
    impact: 'IF 13.473'
  },
  {
    authors: 'A. V. Ullas & B. Jaiswal',
    title: 'Halloysite Nanotubes Reinforced Epoxy Glass Microballoons Syntactic Foams',
    journal: 'Composites Communications, Elsevier (SCI Indexed)',
    impact: 'IF 6.617'
  },
  {
    authors: 'Vaibhav Singh, Anuj Kumar Sharma, Ranjeet Kumar Sahu & Jitendra Kumar Katiyar',
    title: 'Novel Application of Graphite-Talc Hybrid Nanoparticle Enriched Cutting Fluid in Turning Operation',
    journal: 'Journal of Manufacturing Processes, Elsevier (SCI Indexed)',
    impact: 'IF 5.010'
  },
  {
    authors: 'Ritesh Maurya, Vinay Kumar Pathak, Radim Burget & Malay Kishore Dutta',
    title: 'Automated Detection of Bioimages Using Novel Deep Feature Fusion Algorithm and High-Dimensional Feature Selection',
    journal: 'Computers in Biology and Medicine, Elsevier (SCI Indexed)',
    impact: 'IF 4.589'
  }
];

export const PublicPortalView = ({ onGoToLogin }) => {
  const { lang } = useLanguage();
  const [cmsHome, setCmsHome] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [notices, setNotices] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [activeSection, setActiveSection] = useState('apply'); // 'apply' | 'track' | 'verify' | 'faculty'

  // Admission Application Form
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    deptCode: 'CSE',
    programCode: 'MTECH-CSE',
    qualifyingExamName: 'GATE / AKTU Entrance',
    qualifyingScorePct: '',
    guardianName: '',
    guardianPhone: ''
  });
  const [applyReceipt, setApplyReceipt] = useState(null);
  const [applyError, setApplyError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Tracker
  const [trackNo, setTrackNo] = useState('');
  const [trackPin, setTrackPin] = useState('');
  const [trackResult, setTrackResult] = useState(null);
  const [trackError, setTrackError] = useState('');

  // Certificate QR Verify
  const [certToken, setCertToken] = useState('');
  const [certResult, setCertResult] = useState(null);
  const [certError, setCertError] = useState('');

  useEffect(() => {
    api.get('/public/cms').then((d) => {
      setDepartments(d.departments || []);
      if (d.departments?.[0]?.code) {
        setForm((prev) => ({ ...prev, deptCode: d.departments[0].code }));
      }
    }).catch(() => { });
    api.get('/public/cms/home').then((d) => setCmsHome(d.page)).catch(() => { });
    api.get('/public/notices').then((d) => setNotices(d.notices || [])).catch(() => { });
    api.get('/public/faculty').then((d) => setFacultyList(d.faculty || [])).catch(() => { });
  }, []);

  const handleApply = async (e) => {
    e.preventDefault();
    setApplyError('');
    setSubmitting(true);
    try {
      const res = await api.post('/public/admissions/apply', {
        ...form,
        qualifyingScorePct: Number(form.qualifyingScorePct)
      });
      setApplyReceipt(res);
    } catch (err) {
      setApplyError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrack = async (e) => {
    e.preventDefault();
    setTrackError('');
    setTrackResult(null);
    try {
      const res = await api.get(
        `/public/admissions/track?applicationNo=${encodeURIComponent(trackNo)}&pin=${encodeURIComponent(trackPin)}`
      );
      setTrackResult(res);
    } catch (err) {
      setTrackError(err.message);
    }
  };

  const handleVerifyCert = async (e) => {
    e.preventDefault();
    setCertError('');
    setCertResult(null);
    try {
      const res = await api.get(`/public/certificates/verify/${encodeURIComponent(certToken.trim())}`);
      setCertResult(res);
    } catch (err) {
      setCertError(err.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Official cas.res.in-Style Multi-Dropdown Public Navbar & Live Ticker */}
      <PublicNavbar
        cmsHome={cmsHome}
        notices={notices}
        facultyCount={facultyList.length || 21}
        onGoToLogin={onGoToLogin}
        onSelectPortalSection={setActiveSection}
      />

      {/* Main Container */}
      <main className="page-wrapper" style={{ maxWidth: '1240px' }}>
        {/* Institutional Hero Banner with Abstract Mesh Aesthetics */}
        <section
          className="erp-card cas-hero-banner abstract-mesh-bg"
          style={{
            marginBottom: '1.75rem',
            position: 'relative',
            overflow: 'hidden',
            padding: '2.25rem 2.25rem'
          }}
        >
          <div className="abstract-glow-orb" style={{ top: '-80px', right: '-40px' }} aria-hidden="true" />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem', color: 'var(--palette-cyan)', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.05em', position: 'relative', zIndex: 1 }}>
            <Building2 size={16} /> PUBLIC INSTITUTIONAL PORTAL • CENTRE FOR ADVANCED STUDIES
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.6rem', lineHeight: 1.25, position: 'relative', zIndex: 1 }}>
            {lang === 'hi' && cmsHome?.titleHi ? cmsHome.titleHi : cmsHome?.title || 'Centre for Advanced Studies — AKTU Lucknow'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', maxWidth: '880px', marginBottom: '1.25rem', lineHeight: 1.6, position: 'relative', zIndex: 1 }}>
            {lang === 'hi' && cmsHome?.bodyHi ? cmsHome.bodyHi : cmsHome?.body || 'An in-campus research & innovation driven institution of Dr. A.P.J. Abdul Kalam Technical University, Lucknow offering specialized B.Tech, M.Tech & Ph.D. programs in Engineering and Technology.'}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.7rem', marginBottom: '1.5rem', position: 'relative', zIndex: 1 }}>
            <a
              href="#admissions-services"
              onClick={() => setActiveSection('apply')}
              className="btn btn-primary btn-sm"
            >
              <Send size={14} /> Apply for 2026–27 Admissions
            </a>
            <a href="#focus-areas" className="btn btn-secondary btn-sm">
              <Compass size={14} /> Explore Academic Schools
            </a>
            <a href="/docs/cas-timetable-2026-27.pdf" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
              <FileText size={14} /> B.Tech Timetable PDF <ExternalLink size={12} />
            </a>
            <a href="/docs/aktu-holiday-calendar-2026.pdf" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
              <FileText size={14} /> AKTU Calendar 2026 PDF <ExternalLink size={12} />
            </a>
          </div>

          {/* Institutional Highlight Counters */}
          <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', position: 'relative', zIndex: 1 }}>
            <div className="cas-reveal-card" style={{ padding: '0.9rem 1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--palette-cyan)' }}>5+ Schools</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>M.Tech, B.Tech &amp; Ph.D. Specializations</div>
            </div>
            <div className="cas-reveal-card" style={{ padding: '0.9rem 1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#10b981' }}>{facultyList.length || 21}+ Faculty</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Ph.D. Mentors from IITs, NITs &amp; IISER</div>
            </div>
            <div className="cas-reveal-card" style={{ padding: '0.9rem 1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--palette-cyan)' }}>NVIDIA DGX-2</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Supercomputing &amp; Cleanroom Labs</div>
            </div>
            <div className="cas-reveal-card" style={{ padding: '0.9rem 1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f59e0b' }}>150 Rooms</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Single-Seater Boys &amp; Girls Hostels</div>
            </div>
          </div>
        </section>

        {/* Institutional Abstract & Executive Overview Capsule */}
        <section className="cas-institutional-abstract abstract-mesh-bg" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} color="var(--palette-cyan)" />
              <h2 style={{ fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0, color: 'var(--palette-cyan)' }}>
                Institutional Abstract • Centre for Advanced Studies (AKTU)
              </h2>
            </div>
            <span className="badge badge-success" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
              Research Hub Ordinance
            </span>
          </div>

          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: '0 0 1rem 0' }}>
            Established under the legislative framework of <span style={{ fontWeight: 700 }}>Dr. A.P.J. Abdul Kalam Technical University (AKTU)</span> at Sector-11 Jankipuram Vistar, Lucknow, Centre for Advanced Studies (CAS) functions as the university's autonomous post-graduate centre for frontier technology inquiry. With interdisciplinary departments spanning Mechatronics, Nanotechnology, Energy Science, Computer Science &amp; AI, and Manufacturing Automation, CAS fosters translational patent output, high-impact SCIE literature, and direct access to supercomputing infrastructure.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem' }}>
            <span className="abstract-stat-chip">🏛️ Apex AKTU Constituent Institute</span>
            <span className="abstract-stat-chip">⚡ NVIDIA DGX-2 AI Supercomputer</span>
            <span className="abstract-stat-chip">🔬 Class 1000/10000 Nanofab Cleanroom</span>
            <span className="abstract-stat-chip">🎓 5 M.Tech &amp; Ph.D. Disciplines</span>
            <span className="abstract-stat-chip">📍 100-Acre Campus, Jankipuram, Lucknow</span>
            <span className="abstract-stat-chip">📑 75+ SCI/Scopus Publications</span>
          </div>
        </section>

        {/* About CAS, Vision, Mission & Institutional Leadership (Alternating left and right) */}
        <section id="about-cas" style={{ marginBottom: '2rem' }}>
          <div className="card-grid-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '1.15rem', marginBottom: '1.25rem' }}>
            <div className="erp-card cas-reveal-card">
              <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--palette-cyan)', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                ABOUT THE INSTITUTION
              </div>
              <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Research &amp; Innovation Hub of AKTU</h2>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                Established by Dr. A.P.J. Abdul Kalam Technical University (AKTU) at its Sector-11 Jankipuram Vistar campus in Lucknow, Centre for Advanced Studies (CAS) pioneers translational engineering research, interdisciplinary postgraduate training, and industry-aligned innovation labs.
              </p>
            </div>

            <div className="erp-card cas-reveal-card">
              <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#10b981', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                OUR VISION
              </div>
              <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Global Excellence in Frontier Tech</h2>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                To evolve as a premier centre of scientific inquiry and technological excellence driving indigenous innovation in Artificial Intelligence, Mechatronics, Nanotechnology, Clean Energy, and Smart Manufacturing.
              </p>
            </div>

            <div className="erp-card cas-reveal-card">
              <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#f59e0b', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                INSTITUTIONAL LEADERSHIP
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.35rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <img src="/cas-director.jpg" alt="Prof. S. P. Shukla" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-primary)' }} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>Prof. S. P. Shukla</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Director, CAS (Ph.D. IIT Kanpur)</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <img src="/faculty/image005.jpg" alt="Dr. Anuj Kumar Sharma" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', objectPosition: 'top', border: '2px solid var(--palette-cyan)' }} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>Dr. Anuj Kumar Sharma</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Dean Academics, CAS (Ph.D. IIT ISM Dhanbad)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Official Focus Areas & Academic Programs from cas.res.in */}
        <section id="focus-areas" className="erp-card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--palette-cyan)', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <GraduationCap size={15} /> ACADEMIC SCHOOLS &amp; RESEARCH FOCUS AREAS
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '0.2rem' }}>
                Programmes Offered at Centre for Advanced Studies
              </h2>
            </div>
            <a href="https://cas.res.in/" target="_blank" rel="noopener noreferrer" className="cas-link" style={{ fontSize: '0.82rem' }}>
              Explore Academic Ordinances on cas.res.in <ExternalLink size={13} />
            </a>
          </div>

          <div className="card-grid-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1rem' }}>
            {CAS_FOCUS_AREAS.map((area) => (
              <div
                key={area.dept}
                className="cas-reveal-card"
                style={{
                  padding: '1.15rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.55rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-info" style={{ fontSize: '0.66rem' }}>{area.dept}</span>
                  <a href={area.link} target="_blank" rel="noopener noreferrer" className="cas-link" style={{ fontSize: '0.74rem' }}>
                    Syllabus <ExternalLink size={11} />
                  </a>
                </div>
                <h3 style={{ fontSize: '0.98rem', fontWeight: 800, margin: 0 }}>{area.title}</h3>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {area.topics.map((topic, idx) => (
                    <li key={idx}>{topic}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Action Navigation Switcher */}
        <div id="admissions-services" style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn btn-sm ${activeSection === 'apply' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSection('apply')}
          >
            <Send size={14} /> Online Admission Application
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeSection === 'track' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSection('track')}
          >
            <Search size={14} /> Track Application Status
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeSection === 'verify' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSection('verify')}
          >
            <ShieldCheck size={14} /> Verify QR Certificate
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeSection === 'faculty' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSection('faculty')}
          >
            <GraduationCap size={14} /> CAS Faculty ({facultyList.length || 21})
          </button>
        </div>

        {activeSection === 'faculty' && (
          <div>
            <FacultyDirectoryGrid
              faculty={facultyList}
              title="Centre for Advanced Studies — Current Faculty"
              subtitle="Faculty directory verified from https://cas.res.in/faculty.html"
            />
          </div>
        )}

        {/* Main Grid: Interactive Action Column (Left) + Public Notices Column (Right) */}
        {activeSection !== 'faculty' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Primary Interactive Column */}
          <div className="erp-card">
            {activeSection === 'apply' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.15rem' }}>New Admission Application (2026–27)</h2>
                  <img src="/new-badge.gif" alt="New" style={{ height: '18px' }} />
                </div>
                {applyError && (
                  <div style={{ color: 'var(--danger)', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                    {applyError}
                  </div>
                )}
                {applyReceipt ? (
                  <div style={{ padding: '1rem', background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontWeight: 700, marginBottom: '0.5rem' }}>
                      <CheckCircle2 size={18} /> Application Submitted Successfully
                    </div>
                    <p style={{ fontSize: '0.88rem', marginBottom: '0.4rem' }}>
                      Application Number: <strong style={{ fontFamily: 'var(--font-mono)' }}>{applyReceipt.applicationNo}</strong>
                    </p>
                    <p style={{ fontSize: '0.88rem', marginBottom: '0.75rem' }}>
                      Tracking PIN (save securely): <strong style={{ fontFamily: 'var(--font-mono)' }}>{applyReceipt.trackingPin}</strong>
                    </p>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setTrackNo(applyReceipt.applicationNo);
                        setTrackPin(applyReceipt.trackingPin);
                        setApplyReceipt(null);
                        setActiveSection('track');
                      }}
                    >
                      Track This Application
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div className="input-group">
                      <label htmlFor="apply-fullName" className="input-label">Applicant Full Name *</label>
                      <input id="apply-fullName" className="input-field" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Enter candidate full name" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div className="input-group">
                        <label htmlFor="apply-email" className="input-label">Email *</label>
                        <input id="apply-email" type="email" className="input-field" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="applicant@example.com" />
                      </div>
                      <div className="input-group">
                        <label htmlFor="apply-phone" className="input-label">Phone (+91) *</label>
                        <input id="apply-phone" className="input-field" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="9876543210" />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div className="input-group">
                        <label htmlFor="apply-dept" className="input-label">Department *</label>
                        <select id="apply-dept" className="select-field" value={form.deptCode} onChange={(e) => setForm({ ...form, deptCode: e.target.value })}>
                          {(departments.length ? departments : [{ code: 'CSE', name: 'Computer Science & Engineering' }]).map((d) => (
                            <option key={d.code} value={d.code}>{d.code} — {d.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="input-group">
                        <label htmlFor="apply-score" className="input-label">Qualifying Score (%) *</label>
                        <input id="apply-score" type="number" step="0.1" min="0" max="100" className="input-field" required value={form.qualifyingScorePct} onChange={(e) => setForm({ ...form, qualifyingScorePct: e.target.value })} placeholder="e.g. 84.5" />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div className="input-group">
                        <label htmlFor="apply-guardianName" className="input-label">Guardian Name *</label>
                        <input id="apply-guardianName" className="input-field" required value={form.guardianName} onChange={(e) => setForm({ ...form, guardianName: e.target.value })} placeholder="Father / Mother name" />
                      </div>
                      <div className="input-group">
                        <label htmlFor="apply-guardianPhone" className="input-label">Guardian Phone *</label>
                        <input id="apply-guardianPhone" className="input-field" required value={form.guardianPhone} onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })} placeholder="Guardian contact" />
                      </div>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                      {submitting ? 'Submitting Application...' : 'Submit Application'}
                    </button>
                  </form>
                )}
              </>
            )}

            {activeSection === 'track' && (
              <>
                <h2 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Track Admission Application</h2>
                <form onSubmit={handleTrack} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div className="input-group">
                    <label className="input-label">Application Number</label>
                    <input className="input-field" placeholder="APP-2026-0001" required value={trackNo} onChange={(e) => setTrackNo(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Tracking PIN</label>
                    <input className="input-field" placeholder="6-digit PIN" required value={trackPin} onChange={(e) => setTrackPin(e.target.value)} />
                  </div>
                  <button type="submit" className="btn btn-primary">Check Application Status</button>
                </form>
                {trackError && <p style={{ color: 'var(--danger)', marginTop: '0.75rem', fontSize: '0.85rem' }}>{trackError}</p>}
                {trackResult && (
                  <div style={{ marginTop: '1rem', padding: '0.85rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <strong>{trackResult.fullName}</strong>
                      <StatusBadge status={trackResult.status} />
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Program: {trackResult.programCode} • Updated: {formatDateIST(trackResult.updatedAt)}
                    </div>
                    {trackResult.remarks && <div style={{ fontSize: '0.8rem', marginTop: '0.35rem' }}>Remarks: {trackResult.remarks}</div>}
                  </div>
                )}
              </>
            )}

            {activeSection === 'verify' && (
              <>
                <h2 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Public Certificate Verification</h2>
                <form onSubmit={handleVerifyCert} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div className="input-group">
                    <label className="input-label">QR Verification Token</label>
                    <input className="input-field" placeholder="Paste certificate QR token" required value={certToken} onChange={(e) => setCertToken(e.target.value)} />
                  </div>
                  <button type="submit" className="btn btn-primary">Verify Authenticity</button>
                </form>
                {certError && <p style={{ color: 'var(--danger)', marginTop: '0.75rem', fontSize: '0.85rem' }}>{certError}</p>}
                {certResult && (
                  <div style={{ marginTop: '1rem', padding: '0.85rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <strong>{certResult.serialNo}</strong>
                      <StatusBadge status={certResult.valid ? 'verified' : certResult.status} />
                    </div>
                    <div style={{ fontSize: '0.82rem' }}>
                      Student: {certResult.studentName} ({certResult.rollNumber}) • Type: {certResult.certificateType}
                    </div>
                    {certResult.signedByName && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Digitally signed by {certResult.signedByName} on {formatDateIST(certResult.issuedAt)}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Public Notices Column with new-badge.gif */}
          <div className="erp-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BellRing size={18} color="var(--palette-cyan)" />
                <h2 style={{ fontSize: '1.15rem' }}>Public Circulars & Notices</h2>
              </div>
              <img src="/new-badge.gif" alt="Live updates" style={{ height: '16px' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {notices.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No public notices posted yet.</p>
              ) : (
                notices.map((n, idx) => (
                  <div key={n._id || idx} style={{ padding: '0.85rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--palette-cyan)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', fontSize: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <StatusBadge status={n.priority} />
                        {idx < 2 && <img src="/new-badge.gif" alt="New" style={{ height: '14px' }} />}
                      </div>
                      <span style={{ color: 'var(--text-muted)' }}>{formatDateIST(n.publishedAt)}</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '0.25rem' }}>
                      {lang === 'hi' && n.titleHi ? n.titleHi : n.title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {lang === 'hi' && n.contentHi ? n.contentHi : n.content}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        )}

        {/* Recent High-Impact SCI Publications & Patents (Verified from cas.res.in) */}
        <section id="research-publications" className="erp-card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--palette-cyan)', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.05em' }}>
                <FlaskConical size={15} /> RESEARCH IMPACT • SCI-INDEXED JOURNALS &amp; PATENTS
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.2rem' }}>
                Featured Publications by CAS Faculty &amp; Scholars
              </h2>
            </div>
            <a href="https://cas.res.in/research1.html" target="_blank" rel="noopener noreferrer" className="cas-link" style={{ fontSize: '0.82rem' }}>
              <BookOpen size={14} /> Full Research Repository <ExternalLink size={12} />
            </a>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {CAS_PUBLICATIONS.map((pub, idx) => (
              <div
                key={idx}
                className="cas-reveal-card"
                style={{
                  padding: '0.95rem 1.1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ flex: 1, minWidth: '260px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
                    “{pub.title}”
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                    {pub.authors}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {pub.journal}
                  </div>
                </div>
                <span className="badge badge-success" style={{ fontSize: '0.68rem', flexShrink: 0 }}>
                  <Award size={11} /> {pub.impact}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Real Campus & Research Infrastructure Gallery (Images from cas.res.in) */}
        <section id="campus-labs" className="erp-card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', color: 'var(--palette-cyan)', fontWeight: 700, fontSize: '0.8rem' }}>
            <Cpu size={16} /> CAS RESEARCH & CAMPUS INFRASTRUCTURE
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.35rem' }}>
            Advanced Laboratories & Campus Facilities
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginBottom: '1.25rem' }}>
            Centre for Advanced Studies (CAS) houses state-of-the-art supercomputing clusters, advanced nanotechnology testbeds, robotics workshops, and residential facilities on the AKTU Lucknow main campus.
          </p>

          <div className="cas-gallery-grid">
            <div className="cas-gallery-card">
              <img src="/cas-infra.png" alt="CAS AI & Supercomputing Lab" />
              <div className="cas-gallery-info">
                <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.25rem' }}>
                  AI & High Performance Computing Lab
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  NVIDIA GPU clusters, deep learning rigs, and high-throughput data processing servers.
                </div>
              </div>
            </div>

            <div className="cas-gallery-card">
              <img src="/cas-robotics-lab.jpeg" alt="Robotics Lab" />
              <div className="cas-gallery-info">
                <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.25rem' }}>
                  Robotics & Automation Lab
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Autonomous robotic arms, industrial PLCs, and mechatronic drive systems.
                </div>
              </div>
            </div>

            <div className="cas-gallery-card">
              <img src="/cas-3d-lab.jpeg" alt="3D Printing Lab" />
              <div className="cas-gallery-info">
                <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.25rem' }}>
                  3D Printing & Rapid Prototyping
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Additive manufacturing rigs and mechanical design simulation workstations.
                </div>
              </div>
            </div>

            <div className="cas-gallery-card">
              <img src="/cas-nanofab.jpg" alt="Nanofabrication Cleanroom" />
              <div className="cas-gallery-info">
                <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.25rem' }}>
                  Nanotechnology Cleanroom & Nanofab
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Thin-film deposition, chemical vapor synthesis, and nanomaterials characterization.
                </div>
              </div>
            </div>

            <div className="cas-gallery-card">
              <img src="/cas-cyber-center.jpg" alt="Cyber City Center" />
              <div className="cas-gallery-info">
                <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.25rem' }}>
                  Cyber City Computing Center
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  High-speed campus network core, cloud server racks, and cyber security testbeds.
                </div>
              </div>
            </div>

            <div className="cas-gallery-card">
              <img src="/cas-campus-1.jpeg" alt="Academic Complex" />
              <div className="cas-gallery-info">
                <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.25rem' }}>
                  Academic Complex & Research Wings
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Specialized lecture theatres, smart classrooms, and post-graduate seminar wings.
                </div>
              </div>
            </div>

            <div className="cas-gallery-card">
              <img src="/cas-campus-2.jpeg" alt="Auditorium and Seminar Halls" />
              <div className="cas-gallery-info">
                <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.25rem' }}>
                  Research Auditoriums & Seminar Halls
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Acoustically treated halls for international symposia, viva-voce, and keynote sessions.
                </div>
              </div>
            </div>

            <div className="cas-gallery-card">
              <img src="/cas-campus-3.jpg" alt="Campus Amenities and Hostels" />
              <div className="cas-gallery-info">
                <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.25rem' }}>
                  Residential Hostels & Green Campus
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  75 single-seater boys hostel and 75 single-seater girls hostel with mess and recreation.
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Enterprise Corporate Footer with Embedded Google Maps Campus Location */}
      <InstitutionalFooter
        onNavigateSection={(sec) => {
          setActiveSection(sec);
          document.getElementById('admissions-services')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />
    </div>
  );
};
