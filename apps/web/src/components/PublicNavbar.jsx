import React, { useState } from 'react';
import { useERP } from '../context/ERPContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import {
  ChevronDown,
  ExternalLink,
  Languages,
  ArrowLeft,
  Menu,
  X,
  BellRing,
  Sun,
  Moon
} from 'lucide-react';

export const PublicNavbar = ({
  cmsHome,
  notices = [],
  facultyCount = 21,
  onGoToLogin,
  onSelectPortalSection
}) => {
  const { theme, toggleTheme } = useERP();
  const { lang, toggleLanguage, t } = useLanguage();
  const [openMenu, setOpenMenu] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const jumpTo = (sectionId, portalTab = null) => {
    setOpenMenu(null);
    setMobileMenuOpen(false);
    if (portalTab && onSelectPortalSection) {
      onSelectPortalSection(portalTab);
    }
    if (sectionId === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    requestAnimationFrame(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    });
  };

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      onClick: () => jumpTo('top')
    },
    {
      id: 'people',
      label: 'People',
      children: [
        { label: 'Director — Prof. S. P. Shukla', onClick: () => jumpTo('about-cas') },
        { label: 'Dean Academics — Dr. Anuj Kumar Sharma', onClick: () => jumpTo('about-cas') },
        { label: `Current Faculty (${facultyCount})`, onClick: () => jumpTo('admissions-services', 'faculty') },
        { label: 'Visiting Faculty', href: 'https://cas.res.in/visitingfaculty.html' },
        { label: 'Past Faculty', href: 'https://cas.res.in/pastfaculty.html' },
        { label: 'Staff Directory', href: 'https://cas.res.in/staff.html' }
      ]
    },
    {
      id: 'programs',
      label: 'Programs',
      children: [
        { label: 'M.Tech — Computer Science & Engineering', href: 'https://cas.res.in/Mtechcse.html' },
        { label: 'M.Tech — Nanotechnology', href: 'https://cas.res.in/mtechnano.html' },
        { label: 'M.Tech — Energy Science & Technology', href: 'https://cas.res.in/mtechenergy.html' },
        { label: 'M.Tech — Mechatronics', href: 'https://cas.res.in/mtechmecha.html' },
        { label: 'M.Tech — Manufacturing Tech & Automation', href: 'https://cas.res.in/mtechmanufacturing.html' },
        { label: 'Ph.D. Programme', href: 'https://cas.res.in/csephd.html' },
        { label: 'M.Tech Ordinance (PDF)', href: 'https://cas.res.in/pdf/CAS%20M.Tech%20Ordinance%20-%20Revised%20after%20BOS.pdf' },
        { label: 'Ph.D. Ordinance (PDF)', href: 'https://cas.res.in/pdf/Ph.D%20ordinance.pdf' }
      ]
    },
    {
      id: 'academics',
      label: 'Academics',
      children: [
        { label: 'All Academic Schools & Focus Areas', onClick: () => jumpTo('focus-areas') },
        { label: 'B.Tech 3rd Sem Timetable 2026–27 (PDF)', href: '/docs/cas-timetable-2026-27.pdf' },
        { label: 'AKTU Holiday Calendar 2026 (PDF)', href: '/docs/aktu-holiday-calendar-2026.pdf' },
        { label: 'Computer Science & Engineering', href: 'https://cas.res.in/cse1.html' },
        { label: 'Nanotechnology', href: 'https://cas.res.in/nano1.html' },
        { label: 'Energy Science & Technology', href: 'https://cas.res.in/est1.html' },
        { label: 'Mechatronics', href: 'https://cas.res.in/mecha1.html' },
        { label: 'Manufacturing Tech & Automation', href: 'https://cas.res.in/manu1.html' }
      ]
    },
    {
      id: 'admission',
      label: 'Admission',
      children: [
        { label: 'Online Admission Application (2026–27)', onClick: () => jumpTo('admissions-services', 'apply') },
        { label: 'Track Application Status', onClick: () => jumpTo('admissions-services', 'track') },
        { label: 'Verify QR Certificate', onClick: () => jumpTo('admissions-services', 'verify') },
        { label: 'Apply to M.Tech (cas.res.in)', href: 'https://cas.res.in/apply-to-M.Tech.html' },
        { label: 'Apply to Ph.D. (cas.res.in)', href: 'https://cas.res.in/apply-to-PhD.html' },
        { label: 'Fee Structure Details', href: 'https://cas.res.in/feedetails.html' },
        { label: 'Hostel Details', href: 'https://cas.res.in/hostel.html' }
      ]
    },
    {
      id: 'research',
      label: 'Research',
      onClick: () => jumpTo('research-publications')
    },
    {
      id: 'infrastructure',
      label: 'Infrastructure',
      children: [
        { label: 'Specialized Research Labs', onClick: () => jumpTo('campus-labs') },
        { label: 'Major Equipments', href: 'https://cas.res.in/equip.html' },
        { label: 'Central Library', href: 'https://cas.res.in/library.html' },
        { label: 'General Infrastructure', href: 'https://cas.res.in/geninfra.html' },
        { label: 'Virtual Campus Tour', href: 'https://cas.res.in/campustour/index.html' },
        { label: 'Campus Video Tour', href: 'https://youtu.be/wuBRMYGzK8g' }
      ]
    },
    {
      id: 'students-corner',
      label: "Student's Corner",
      children: [
        { label: "Student's Life", href: 'https://cas.res.in/studentlyf.html' },
        { label: "Student's Publications", onClick: () => jumpTo('research-publications') },
        { label: 'Alumni Network', href: 'https://cas.res.in/alumni.html' },
        { label: 'Innovation Gallery', href: 'https://cas.res.in/studentinno.html' },
        { label: 'AKTU One View / ERP Portal', href: 'https://erp.aktu.ac.in/' },
        { label: 'Circulars & Notices', onClick: () => jumpTo('admissions-services') }
      ]
    },
    {
      id: 'contact',
      label: 'Contact',
      onClick: () => jumpTo('campus-location')
    }
  ];

  const tickerItems =
    notices.length > 0
      ? notices.map((n) => (lang === 'hi' && n.titleHi ? n.titleHi : n.title))
      : [
          'M.Tech & B.Tech Admissions Open for Session 2026–27 — Apply Online via CAS ERP',
          'B.Tech 3rd Semester Timetable (w.e.f. 5th Oct 2026) Published',
          'AKTU Lucknow Academic & Holiday Calendar 2026 Available for Download',
          'NVIDIA DGX-2 High-Performance AI Supercomputing Lab Open for PG & Ph.D. Scholars'
        ];

  return (
    <div className={`cas-pub-header-wrap no-print ${openMenu ? 'has-dropdown-open' : ''}`}>
      {/* Row 1: Institutional Masthead Bar (CAS + AKTU Branding & Utility Controls) */}
      <header className="cas-pub-masthead">
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.85rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
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
                  width: '50px',
                  height: '50px',
                  objectFit: 'contain',
                  borderRadius: '50%',
                  background: '#ffffff',
                  padding: '2px',
                  border: '2px solid var(--accent-primary)'
                }}
              />
            </a>
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
                style={{ width: '50px', height: '50px', objectFit: 'contain' }}
              />
            </a>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.12rem', color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {lang === 'hi' && cmsHome?.titleHi ? cmsHome.titleHi : cmsHome?.title || `${t('auth.title')} (CAS)`}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--palette-cyan)', fontWeight: 600 }}>
                In-campus Institution of {t('auth.subtitle')}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                A Research &amp; Innovation Driven Institution • Sector-11, Jankipuram Vistar, Lucknow
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.55rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={toggleTheme}
              aria-label="Toggle Color Theme"
              title="Switch Dark / Light Theme"
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={toggleLanguage}
              title="Change Language (English / Hindi)"
            >
              <Languages size={14} /> {t('languageLabel')}
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={onGoToLogin}>
              <ArrowLeft size={14} /> {t('signIn')}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-icon cas-pub-mobile-toggle"
              aria-label="Toggle Public Navigation Menu"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Row 2: Official cas.res.in Style Multi-Dropdown Navigation Menu */}
      <nav aria-label="Centre for Advanced Studies Primary Navigation" className="cas-pub-menubar">
        <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 1rem' }}>
          <ul className={`cas-pub-menu-list ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            {navItems.map((item) => {
              const hasChildren = Boolean(item.children?.length);
              const isOpen = openMenu === item.id;

              return (
                <li
                  key={item.id}
                  className={`cas-pub-menu-item ${isOpen ? 'open' : ''}`}
                  onMouseEnter={() => {
                    if (window.innerWidth > 960) {
                      setOpenMenu(hasChildren ? item.id : null);
                    }
                  }}
                  onMouseLeave={() => {
                    if (window.innerWidth > 960) setOpenMenu(null);
                  }}
                >
                  {hasChildren ? (
                    <>
                      <button
                        type="button"
                        className="cas-pub-menu-trigger"
                        aria-expanded={isOpen}
                        onClick={() => setOpenMenu(isOpen ? null : item.id)}
                      >
                        <span>{item.label}</span>
                        <ChevronDown size={13} className="cas-pub-chevron" />
                      </button>

                      <div className="cas-pub-dropdown" role="menu">
                        {item.children.map((sub, idx) =>
                          sub.href ? (
                            <a
                              key={idx}
                              href={sub.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="cas-pub-dropdown-link"
                              role="menuitem"
                              onClick={() => {
                                setOpenMenu(null);
                                setMobileMenuOpen(false);
                              }}
                            >
                              <span>{sub.label}</span>
                              <ExternalLink size={11} style={{ opacity: 0.7, flexShrink: 0 }} />
                            </a>
                          ) : (
                            <button
                              key={idx}
                              type="button"
                              className="cas-pub-dropdown-link"
                              role="menuitem"
                              onClick={sub.onClick}
                            >
                              <span>{sub.label}</span>
                            </button>
                          )
                        )}
                      </div>
                    </>
                  ) : (
                    <button type="button" className="cas-pub-menu-trigger" onClick={item.onClick}>
                      {item.label}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Row 3: Live CAS Circulars & News Ticker (matching cas.res.in) */}
      <div className="cas-ticker-bar">
        <div className="cas-ticker-label">
          <BellRing size={13} /> LATEST UPDATES
        </div>
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <div className="cas-ticker-track">
            {[...tickerItems, ...tickerItems].map((text, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => jumpTo('admissions-services')}
                className="cas-link"
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '0.78rem',
                  padding: 0,
                  whiteSpace: 'nowrap'
                }}
              >
                <img src="/new-badge.gif" alt="New" style={{ height: '13px' }} />
                <span>{text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
