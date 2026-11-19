import React from 'react';
import {
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  ShieldCheck,
  GraduationCap,
  Building2,
  FileText,
  Globe,
  Sparkles
} from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export const InstitutionalFooter = ({ onNavigateSection, compact = false }) => {
  const mapEmbedUrl =
    'https://maps.google.com/maps?q=Centre+for+Advanced+Studies+AKTU+Sector+11+Jankipuram+Vistar+Lucknow+226031&t=&z=15&ie=UTF8&iwloc=&output=embed';
  const mapDirectionsUrl =
    'https://www.google.com/maps/search/?api=1&query=Centre+for+Advanced+Studies+AKTU+Sector+11+Jankipuram+Vistar+Lucknow+226031';

  return (
    <footer
      id="campus-location"
      className="cas-corp-footer no-print"
      style={{ marginTop: compact ? '2rem' : '3rem' }}
    >
      <div
        style={{
          maxWidth: compact ? '1600px' : '1240px',
          margin: '0 auto',
          padding: compact ? '2.25rem 2rem 1.5rem' : '3.25rem 1.5rem 2rem'
        }}
      >
        {/* Top 4-Column Corporate Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(235px, 1fr))',
            gap: '2rem',
            marginBottom: '2.25rem'
          }}
        >
          {/* Column 1: Institutional Brand & Identity */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
              <a
                href="https://cas.res.in/"
                target="_blank"
                rel="noopener noreferrer"
                title="Visit Centre for Advanced Studies (cas.res.in)"
                style={{ display: 'inline-flex', transition: 'transform 0.4s ease' }}
              >
                <img
                  src="/cas-crest.png"
                  alt="CAS Crest"
                  style={{
                    width: '48px',
                    height: '48px',
                    objectFit: 'contain',
                    borderRadius: '50%',
                    background: '#ffffff',
                    padding: '3px',
                    border: '2px solid var(--accent-primary)'
                  }}
                />
              </a>
              <a
                href="https://erp.aktu.ac.in/"
                target="_blank"
                rel="noopener noreferrer"
                title="Visit AKTU ERP Portal (erp.aktu.ac.in)"
                style={{ display: 'inline-flex', transition: 'transform 0.4s ease' }}
              >
                <img
                  src="/aktu-logo.png"
                  alt="AKTU Seal"
                  style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                />
              </a>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.02rem', color: 'var(--text-primary)', lineHeight: 1.2 }}>
                  Centre for Advanced Studies
                </div>
                <div style={{ fontSize: '0.73rem', color: 'var(--palette-cyan)', fontWeight: 600 }}>
                  AKTU Lucknow • Constituent Research Hub
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              An in-campus autonomous research &amp; innovation institution of Dr. A.P.J. Abdul Kalam Technical University (AKTU), Lucknow offering specialized B.Tech, M.Tech, and Ph.D. programmes in emerging engineering disciplines.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              <span className="badge badge-info" style={{ fontSize: '0.62rem' }}>
                <Building2 size={10} /> AKTU Constituent
              </span>
              <span className="badge badge-success" style={{ fontSize: '0.62rem' }}>
                <ShieldCheck size={10} /> AICTE Approved
              </span>
              <span className="badge badge-neutral" style={{ fontSize: '0.62rem' }}>
                <Globe size={10} /> cas.res.in
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.78rem', marginTop: '0.2rem' }}>
              <a href="tel:05222336808" className="cas-footer-link">
                <Phone size={13} color="var(--palette-cyan)" /> 0522-2336808
              </a>
              <a href="mailto:director@cas.res.in" className="cas-footer-link">
                <Mail size={13} color="var(--palette-cyan)" /> director@cas.res.in (Director)
              </a>
              <a href="mailto:info@cas.res.in" className="cas-footer-link">
                <Mail size={13} color="var(--palette-cyan)" /> info@cas.res.in (Admissions &amp; Info)
              </a>
              <a href="mailto:examcontrol@cas.res.in" className="cas-footer-link">
                <Mail size={13} color="var(--palette-cyan)" /> examcontrol@cas.res.in (Exam Cell)
              </a>
            </div>
          </div>

          {/* Column 2: Academic Schools & Focus Areas */}
          <div>
            <h3
              style={{
                fontSize: '0.84rem',
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                color: 'var(--palette-cyan)',
                marginBottom: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <GraduationCap size={15} /> Academic Schools
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.52rem', fontSize: '0.82rem' }}>
              <li>
                <a href="https://cas.res.in/Mtechcse.html" target="_blank" rel="noopener noreferrer" className="cas-footer-link">
                  Computer Science &amp; Engineering (AI/ML &amp; Cyber)
                </a>
              </li>
              <li>
                <a href="https://cas.res.in/mtechmecha.html" target="_blank" rel="noopener noreferrer" className="cas-footer-link">
                  Mechatronics, Robotics &amp; Aerial Systems
                </a>
              </li>
              <li>
                <a href="https://cas.res.in/mtechnano.html" target="_blank" rel="noopener noreferrer" className="cas-footer-link">
                  Nanotechnology, VLSI &amp; MEMS/NEMS
                </a>
              </li>
              <li>
                <a href="https://cas.res.in/mtechenergy.html" target="_blank" rel="noopener noreferrer" className="cas-footer-link">
                  Energy Science &amp; Renewable Technology
                </a>
              </li>
              <li>
                <a href="https://cas.res.in/mtechmanufacturing.html" target="_blank" rel="noopener noreferrer" className="cas-footer-link">
                  Manufacturing Tech &amp; Industry 4.0 Automation
                </a>
              </li>
              <li>
                <a href="https://cas.res.in/csephd.html" target="_blank" rel="noopener noreferrer" className="cas-footer-link">
                  Ph.D. &amp; B.Tech Honours Programmes
                </a>
              </li>
              <li>
                <a href="https://cas.res.in/faculty.html" target="_blank" rel="noopener noreferrer" className="cas-footer-link">
                  CAS Faculty Directory <ExternalLink size={11} />
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Resources, Downloads & Governance */}
          <div>
            <h3
              style={{
                fontSize: '0.84rem',
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                color: 'var(--palette-cyan)',
                marginBottom: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <FileText size={15} /> Governance &amp; Resources
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.52rem', fontSize: '0.82rem' }}>
              {onNavigateSection && (
                <>
                  <li>
                    <button
                      type="button"
                      onClick={() => onNavigateSection('apply')}
                      className="cas-footer-link"
                      style={{ background: 'none', border: 'none', padding: 0, font: 'inherit' }}
                    >
                      Online Admissions 2026–27
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => onNavigateSection('verify')}
                      className="cas-footer-link"
                      style={{ background: 'none', border: 'none', padding: 0, font: 'inherit' }}
                    >
                      Verify QR Academic Certificate
                    </button>
                  </li>
                </>
              )}
              <li>
                <a href="/docs/cas-timetable-2026-27.pdf" target="_blank" rel="noopener noreferrer" className="cas-footer-link">
                  B.Tech 3rd Sem Timetable (PDF) <ExternalLink size={11} />
                </a>
              </li>
              <li>
                <a href="/docs/aktu-holiday-calendar-2026.pdf" target="_blank" rel="noopener noreferrer" className="cas-footer-link">
                  AKTU Holiday Calendar 2026 (PDF) <ExternalLink size={11} />
                </a>
              </li>
              <li>
                <a href="https://erp.aktu.ac.in/" target="_blank" rel="noopener noreferrer" className="cas-footer-link">
                  AKTU University ERP Portal <ExternalLink size={11} />
                </a>
              </li>
              <li>
                <a href="https://cas.res.in/infra.html" target="_blank" rel="noopener noreferrer" className="cas-footer-link">
                  Research Labs &amp; Major Equipment <ExternalLink size={11} />
                </a>
              </li>
              <li>
                <a href="https://cas.res.in/hostel.html" target="_blank" rel="noopener noreferrer" className="cas-footer-link">
                  Campus Hostels &amp; Student Life <ExternalLink size={11} />
                </a>
              </li>
              <li>
                <a href="mailto:career@cas.res.in" className="cas-footer-link">
                  Careers &amp; Recruitment (career@cas.res.in)
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Interactive Google Maps Campus Location */}
          <div>
            <h3
              style={{
                fontSize: '0.84rem',
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                color: 'var(--palette-cyan)',
                marginBottom: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <MapPin size={15} /> Institute Location
            </h3>

            <iframe
              title="Centre for Advanced Studies, AKTU Lucknow — Google Maps Location"
              src={mapEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="cas-map-frame"
            />

            <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '0.6rem', marginBottom: '0.65rem', lineHeight: 1.45 }}>
              <strong>Centre for Advanced Studies (CAS)</strong>, Dr. A.P.J. Abdul Kalam Technical University, New Campus, Sector-11, Jankipuram Vistar Yojna, Lucknow, Uttar Pradesh – 226031
            </p>

            <a
              href={mapDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm"
              style={{ width: '100%' }}
            >
              <MapPin size={14} /> Open Directions in Google Maps <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* Corporate Legal & Compliance Bottom Bar */}
        <div
          style={{
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.85rem',
            fontSize: '0.75rem',
            color: 'var(--text-muted)'
          }}
        >
          <div>
            © {CURRENT_YEAR} <strong>Centre for Advanced Studies (CAS)</strong>, Dr. A.P.J. Abdul Kalam Technical University, Lucknow. All Rights Reserved.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.15rem', flexWrap: 'wrap' }}>
            <span className="cas-developer-credit" title="Platform Architect & Engineering Lead">
              <Sparkles size={11} color="var(--palette-cyan)" />
              <span style={{ color: 'var(--text-secondary)' }}>Developed by</span>
              <strong className="cas-developer-credit-name">TechnoCat Arya</strong>
            </span>
            <a href="https://cas.res.in/" target="_blank" rel="noopener noreferrer" className="cas-footer-link" style={{ fontSize: '0.74rem' }}>
              CAS Main Website (cas.res.in)
            </a>
            <a href="https://erp.aktu.ac.in/" target="_blank" rel="noopener noreferrer" className="cas-footer-link" style={{ fontSize: '0.74rem' }}>
              AKTU-SDC Portal
            </a>
            <span style={{ color: 'var(--palette-cyan)', fontWeight: 600 }}>
              WCAG 2.2 AA Accessible • cas.erp v2.0
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
