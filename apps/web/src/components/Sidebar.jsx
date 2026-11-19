import React from 'react';
import { useERP } from '../context/ERPContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  BookOpen,
  Calendar,
  CreditCard,
  ClipboardList,
  BellRing,
  Settings,
  ShieldCheck,
  ScanFace,
  CalendarOff,
  X,
  UserPlus,
  Award,
  Calculator,
  Library,
  Building,
  FileBadge,
  Briefcase,
  Package,
  MessageSquareWarning,
  Compass,
  BarChart3,
  UserCog,
  Building2
} from 'lucide-react';

export const Sidebar = ({ activeTab, onTabChange, isCollapsed, isOpenMobile, onCloseMobile }) => {
  const { students, can, settings } = useERP();
  const { t } = useLanguage();

  const dueCount = students.filter((s) => s.dueFeeInr > 0).length;

  const navSections = [
    {
      title: t('nav.overview'),
      items: [
        { id: 'dashboard', label: t('nav.dashboard'), icon: <LayoutDashboard size={18} />, visible: true }
      ]
    },
    {
      title: t('nav.academics'),
      items: [
        { id: 'admissions', label: t('nav.admissions'), icon: <UserPlus size={18} />, visible: can('admissions', 'view') || can('cms', 'edit') },
        { id: 'students', label: t('nav.students'), icon: <Users size={18} />, badge: students.length || null, visible: can('students', 'view') },
        { id: 'faculty', label: t('nav.faculty'), icon: <UserCheck size={18} />, visible: true },
        { id: 'courses', label: t('nav.courses'), icon: <BookOpen size={18} />, visible: can('academics', 'view') },
        { id: 'timetable', label: t('nav.timetable'), icon: <Calendar size={18} />, visible: true },
        { id: 'exams', label: t('nav.exams'), icon: <Award size={18} />, visible: can('exams', 'view') || can('lms', 'view') }
      ]
    },
    {
      title: t('nav.operations'),
      items: [
        {
          id: 'finance',
          label: t('nav.finance'),
          icon: <CreditCard size={18} />,
          badge: dueCount > 0 && can('finance', 'create') ? `${dueCount} Due` : null,
          badgeColor: 'badge-warning',
          visible: can('finance', 'view')
        },
        { id: 'accounting', label: t('nav.accounting'), icon: <Calculator size={18} />, visible: can('accounting', 'view') },
        { id: 'attendance', label: t('nav.attendance'), icon: <ClipboardList size={18} />, visible: can('attendance', 'view') },
        { id: 'faceAttendance', label: t('nav.faceAttendance'), icon: <ScanFace size={18} />, visible: can('attendance', 'view') },
        { id: 'leaveManagement', label: t('nav.leaveManagement'), icon: <CalendarOff size={18} />, visible: can('leave', 'view') },
        { id: 'notices', label: t('nav.notices'), icon: <BellRing size={18} />, visible: true }
      ]
    },
    {
      title: t('nav.ecosystem'),
      items: [
        { id: 'library', label: t('nav.library'), icon: <Library size={18} />, visible: can('library', 'view') },
        { id: 'hostel', label: t('nav.hostel'), icon: <Building size={18} />, visible: can('hostel', 'view') },
        { id: 'documents', label: t('nav.documents'), icon: <FileBadge size={18} />, visible: can('documents', 'view') || can('certificates', 'view') },
        { id: 'placement', label: t('nav.placement'), icon: <Briefcase size={18} />, visible: can('placement', 'view') },
        { id: 'inventory', label: t('nav.inventory'), icon: <Package size={18} />, visible: can('inventory', 'view') },
        { id: 'grievances', label: t('nav.grievances'), icon: <MessageSquareWarning size={18} />, visible: can('grievances', 'view') },
        { id: 'campusOps', label: t('nav.campusOps'), icon: <Compass size={18} />, visible: can('events', 'view') || can('research', 'view') || can('safety', 'view') }
      ]
    },
    {
      title: t('nav.governance'),
      items: [
        { id: 'reports', label: t('nav.reports'), icon: <BarChart3 size={18} />, visible: can('reports', 'view') || can('ai', 'submit') },
        { id: 'rbacAdmin', label: t('nav.rbacAdmin'), icon: <UserCog size={18} />, visible: can('rbac', 'view') || can('migration', 'view') },
        { id: 'audit', label: t('nav.audit'), icon: <ShieldCheck size={18} />, visible: can('audit', 'view') },
        { id: 'settings', label: t('nav.settings'), icon: <Settings size={18} />, visible: true }
      ]
    }
  ];

  const filteredSections = navSections
    .map((s) => ({ ...s, items: s.items.filter((i) => i.visible) }))
    .filter((s) => s.items.length > 0);

  const handleNavClick = (tabId) => {
    onTabChange(tabId);
    onCloseMobile?.();
  };

  return (
    <>
      {isOpenMobile && (
        <div
          className="sidebar-backdrop no-print"
          onClick={onCloseMobile}
          aria-label="Close navigation overlay"
        />
      )}

      <aside
        aria-label="Primary Sidebar Navigation"
        className={`sidebar-container no-print ${isOpenMobile ? 'open' : ''}`}
        style={{
          width: isCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)'
        }}
      >
        <div className="sidebar-mobile-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <a
              href="https://cas.res.in/"
              target="_blank"
              rel="noopener noreferrer"
              title="Visit Centre for Advanced Studies (cas.res.in)"
              style={{ display: 'inline-flex', cursor: 'pointer' }}
            >
              <img src="/cas-crest.png" alt="CAS Logo" style={{ width: '34px', height: '34px', objectFit: 'contain', borderRadius: '50%', background: '#ffffff', padding: '2px' }} />
            </a>
            <div>
              <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>cas.erp</span>
              <span style={{ fontSize: '0.68rem', color: 'var(--palette-cyan)', display: 'block' }}>
                CAS AKTU Lucknow
              </span>
            </div>
          </div>

          <button type="button" onClick={onCloseMobile} className="sidebar-close-btn" aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav style={{ padding: isCollapsed ? '1rem 0.5rem' : '1rem 0.8rem', flex: 1, overflowY: 'auto' }}>
          {filteredSections.map((sec, idx) => (
            <div key={idx} style={{ marginBottom: '1rem' }}>
              {(!isCollapsed || isOpenMobile) && (
                <div
                  style={{
                    fontSize: '0.66rem',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    letterSpacing: '0.07em',
                    padding: '0 0.65rem 0.35rem',
                    textTransform: 'uppercase'
                  }}
                >
                  {sec.title}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {sec.items.map((item) => {
                  const isActive = activeTab === item.id;
                  const showFull = !isCollapsed || isOpenMobile;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="sidebar-nav-btn"
                      onClick={() => handleNavClick(item.id)}
                      aria-current={isActive ? 'page' : undefined}
                      title={!showFull ? item.label : undefined}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: !showFull ? 'center' : 'space-between',
                        width: '100%',
                        padding: !showFull ? '0.65rem 0' : '0.55rem 0.7rem',
                        borderRadius: 'var(--radius-md)',
                        border: 'none',
                        background: isActive
                          ? 'linear-gradient(135deg, rgba(53, 135, 164, 0.22) 0%, rgba(45, 137, 139, 0.12) 100%)'
                          : 'transparent',
                        color: isActive ? 'var(--palette-cyan)' : 'var(--text-secondary)',
                        fontWeight: isActive ? 700 : 500,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        borderLeft: isActive ? '3px solid var(--palette-cyan)' : '3px solid transparent',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <span>{item.icon}</span>
                        {showFull && <span>{item.label}</span>}
                      </div>
                      {showFull && Boolean(item.badge) && (
                        <span className={`badge ${item.badgeColor || 'badge-neutral'}`} style={{ fontSize: '0.62rem' }}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {!isCollapsed && (
          <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ padding: '0.7rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', fontSize: '0.72rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700 }}>
                  <Building2 size={14} color="var(--palette-cyan)" /> Academic Session
                </span>
                <span className="badge badge-success" style={{ fontSize: '0.58rem' }}>Active</span>
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>
                {settings?.activeAcademicYear || '2026 - 2027'} • {settings?.activeSemesterLabel || 'Odd Sem'}
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
