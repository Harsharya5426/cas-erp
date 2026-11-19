import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useERP } from '../context/ERPContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api } from '../services/apiClient.js';
import {
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  LogOut,
  PlusCircle,
  Languages,
  Check
} from 'lucide-react';
import { formatDateTimeIST, formatINR } from '../utils/formatters.js';

export const Navbar = ({
  onOpenQuickAction,
  onGlobalSearchSelect,
  onToggleSidebar,
  onToggleMobileSidebar,
  isOpenMobile
}) => {
  const {
    currentUser,
    currentRole,
    assignedRoles,
    switchRole,
    ROLES,
    theme,
    toggleTheme,
    updateUserPreferences,
    logoutUser,
    students,
    employees,
    subjects,
    payments,
    notifications,
    unreadNotificationCount,
    refreshAll
  } = useERP();
  const { lang, toggleLanguage, t } = useLanguage();

  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const roleMenuRef = useRef(null);
  const notifMenuRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(event.target)) setIsRoleMenuOpen(false);
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target)) setIsNotificationsOpen(false);
      if (searchRef.current && !searchRef.current.contains(event.target)) setIsSearchFocused(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const results = [];
    students.forEach((s) => {
      if (
        s.name?.toLowerCase().includes(q) ||
        s.rollNumber?.toLowerCase().includes(q) ||
        s.deptCode?.toLowerCase().includes(q)
      ) {
        results.push({ type: 'Student', title: s.name, subtitle: `${s.rollNumber} • ${s.deptCode}`, data: s, tab: 'students' });
      }
    });
    employees.forEach((emp) => {
      if (emp.name?.toLowerCase().includes(q) || emp.designation?.toLowerCase().includes(q)) {
        results.push({ type: 'Employee', title: emp.name, subtitle: `${emp.designation} • ${emp.deptCode}`, data: emp, tab: 'faculty' });
      }
    });
    subjects.forEach((sub) => {
      if (sub.name?.toLowerCase().includes(q) || sub.code?.toLowerCase().includes(q)) {
        results.push({ type: 'Course', title: `${sub.code}: ${sub.name}`, subtitle: `${sub.credits} Credits`, data: sub, tab: 'courses' });
      }
    });
    payments.forEach((p) => {
      if (p.receiptNo?.toLowerCase().includes(q) || p.studentName?.toLowerCase().includes(q)) {
        results.push({ type: 'Receipt', title: `${p.receiptNo} (${formatINR(p.amountInr)})`, subtitle: `${p.studentName} • ${p.rollNumber}`, data: p, tab: 'finance' });
      }
    });
    return results.slice(0, 8);
  }, [searchQuery, students, employees, subjects, payments]);

  const handleHamburgerClick = () => {
    if (window.innerWidth < 1024 && onToggleMobileSidebar) {
      onToggleMobileSidebar();
    } else if (onToggleSidebar) {
      onToggleSidebar();
    }
  };

  const handleToggleLanguage = () => {
    const next = toggleLanguage();
    updateUserPreferences({ language: next });
  };

  const handleMarkNotifRead = async (id) => {
    await api.patch(`/notifications/${id}/read`).catch(() => {});
    refreshAll();
  };

  return (
    <header
      className="no-print"
      style={{
        height: 'var(--header-height)',
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.25rem',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(10px)'
      }}
    >
      {/* Left: Menu Toggle + CAS Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <button
          type="button"
          onClick={handleHamburgerClick}
          className="btn btn-ghost btn-icon"
          aria-label="Toggle Navigation Menu"
          aria-expanded={isOpenMobile}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '18px' }}>
            <span style={{ height: '2px', backgroundColor: 'var(--text-primary)', borderRadius: '2px' }} />
            <span style={{ height: '2px', backgroundColor: 'var(--text-primary)', borderRadius: '2px' }} />
            <span style={{ height: '2px', backgroundColor: 'var(--text-primary)', borderRadius: '2px' }} />
          </div>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
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
              style={{ width: '38px', height: '38px', objectFit: 'contain' }}
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
              alt="CAS Crest"
              style={{
                width: '36px',
                height: '36px',
                objectFit: 'contain',
                borderRadius: '50%',
                background: '#ffffff',
                padding: '2px',
                border: '1.5px solid #3587a4'
              }}
            />
          </a>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ fontWeight: 800, fontSize: '1.02rem', letterSpacing: '-0.02em' }}>
                {t('brandName')}
              </span>
              <span
                style={{
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  padding: '0.12rem 0.45rem',
                  borderRadius: '4px',
                  background: 'var(--accent-primary)',
                  color: '#ffffff'
                }}
              >
                AKTU-SDC
              </span>
            </div>
            <span className="navbar-brand-subtitle" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', lineHeight: 1.1 }}>
              {t('institutionTitle')}
            </span>
          </div>
        </div>
      </div>

      {/* Center Omnisearch */}
      <div ref={searchRef} className="navbar-search-container" style={{ position: 'relative', width: '360px', maxWidth: '100%' }}>
        <div className="input-with-icon">
          <span className="icon-prefix">
            <Search size={16} />
          </span>
          <input
            type="search"
            className="input-field"
            aria-label={t('searchPlaceholder')}
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            style={{ borderRadius: 'var(--radius-full)', paddingRight: '2rem' }}
          />
        </div>

        {isSearchFocused && searchResults.length > 0 && (
          <div
            role="listbox"
            className="anim-scale-in"
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              right: 0,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-xl)',
              overflow: 'hidden',
              zIndex: 100
            }}
          >
            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
              {searchResults.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onGlobalSearchSelect?.(item.tab, item.data);
                    setIsSearchFocused(false);
                    setSearchQuery('');
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--border-subtle)',
                    padding: '0.65rem 1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: 'var(--text-primary)'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{item.title}</div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{item.subtitle}</div>
                  </div>
                  <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>
                    {item.type}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Controls: EN/HI i18n, Theme, Notifications, Quick Action, Account */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
        <button
          type="button"
          onClick={handleToggleLanguage}
          className="btn btn-secondary btn-sm"
          title="Switch Language (English / Hindi)"
          style={{ gap: '0.35rem' }}
        >
          <Languages size={15} />
          <span>{lang === 'en' ? 'हिन्दी' : 'English'}</span>
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          className="btn btn-secondary btn-sm"
          aria-label="Toggle Color Theme"
          title="Switch Dark / Light Theme"
          style={{ gap: '0.35rem' }}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          <span className="navbar-action-btn-text">{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>

        {/* Notification Bell */}
        <div ref={notifMenuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="btn btn-ghost btn-icon"
            aria-label="Notifications"
            style={{ position: 'relative' }}
          >
            <Bell size={18} />
            {unreadNotificationCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '5px',
                  right: '5px',
                  minWidth: '16px',
                  height: '16px',
                  borderRadius: '999px',
                  backgroundColor: 'var(--danger)',
                  color: '#fff',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px'
                }}
              >
                {unreadNotificationCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div
              className="anim-scale-in"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '320px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-xl)',
                zIndex: 100,
                overflow: 'hidden'
              }}
            >
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', fontWeight: 700, fontSize: '0.85rem' }}>
                Notification Centre ({unreadNotificationCount} unread)
              </div>
              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      style={{
                        padding: '0.7rem 1rem',
                        borderBottom: '1px solid var(--border-subtle)',
                        background: n.readAt ? 'transparent' : 'rgba(53, 135, 164, 0.08)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '0.5rem'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{n.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{n.body}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {formatDateTimeIST(n.createdAt)}
                        </div>
                      </div>
                      {!n.readAt && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon"
                          title="Mark read"
                          onClick={() => handleMarkNotifRead(n._id)}
                        >
                          <Check size={14} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenQuickAction}
          className="btn btn-primary btn-sm"
          style={{ gap: '0.35rem', fontWeight: 600 }}
        >
          <PlusCircle size={15} />
          <span className="navbar-action-btn-text">Quick Action</span>
        </button>

        {/* Account & Assigned-Role Switcher */}
        <div ref={roleMenuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
            className="btn btn-secondary btn-sm"
            style={{ gap: '0.45rem', borderColor: 'var(--border-highlight)' }}
          >
            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>
              {currentUser?.name?.split(' ')[0] || 'Account'}
            </span>
            <span className={`badge ${ROLES[currentRole]?.color || 'badge-info'}`} style={{ fontSize: '0.62rem' }}>
              {lang === 'hi' ? ROLES[currentRole]?.labelHi : ROLES[currentRole]?.label || currentRole}
            </span>
            <ChevronDown size={14} />
          </button>

          {isRoleMenuOpen && (
            <div
              className="anim-scale-in"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '270px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-xl)',
                padding: '0.6rem',
                zIndex: 100
              }}
            >
              <div style={{ padding: '0.4rem 0.6rem', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{currentUser?.name}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{currentUser?.email}</div>
              </div>

              {assignedRoles.length > 1 && (
                <div style={{ padding: '0.5rem 0.4rem', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    ASSIGNED ROLES
                  </div>
                  {assignedRoles.map((rk) => (
                    <button
                      key={rk}
                      type="button"
                      onClick={() => {
                        switchRole(rk);
                        setIsRoleMenuOpen(false);
                      }}
                      className="btn btn-ghost btn-sm"
                      style={{
                        width: '100%',
                        justifyContent: 'space-between',
                        background: rk === currentRole ? 'var(--bg-tertiary)' : 'transparent'
                      }}
                    >
                      <span>{ROLES[rk]?.label || rk}</span>
                      {rk === currentRole && <Check size={14} color="var(--success)" />}
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={logoutUser}
                className="btn btn-danger btn-sm"
                style={{ width: '100%', marginTop: '0.5rem', justifyContent: 'center', gap: '0.4rem' }}
              >
                <LogOut size={15} /> {t('signOut')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
