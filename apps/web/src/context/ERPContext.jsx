import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DEFAULT_ROLE_TEMPLATES, hasRolePermission } from '@cas-erp/shared';
import { api } from '../services/apiClient.js';
import { authService } from '../services/authService.js';
import { useLanguage } from './LanguageContext.jsx';

const ERPContext = createContext();

export const ROLE_META = Object.fromEntries(
  DEFAULT_ROLE_TEMPLATES.map((r) => [
    r.key,
    {
      label: r.name,
      labelHi: r.nameHi,
      badge: r.key.replace(/_/g, ' '),
      color:
        r.key === 'SUPER_ADMIN' || r.key === 'PRINCIPAL'
          ? 'badge-purple'
          : r.key === 'ACCOUNTANT'
          ? 'badge-warning'
          : r.key === 'FACULTY' || r.key === 'HOD'
          ? 'badge-success'
          : r.key === 'STUDENT' || r.key === 'PARENT'
          ? 'badge-neutral'
          : 'badge-info'
    }
  ])
);

const ALLOWED_ACCENTS = ['#3587A4', '#2D898B', '#2563EB', '#0F766E', '#6D28D9'];

export const ERPProvider = ({ children }) => {
  const { setLang } = useLanguage();
  const [currentUser, setCurrentUser] = useState(null);
  const [authContext, setAuthContext] = useState(null);

  const [themeMode, setThemeMode] = useState(() => {
    try {
      const saved = window.localStorage.getItem('cas_erp_theme');
      if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    } catch {
      // Ignore storage access errors
    }
    return 'dark';
  });
  const [accentColor, setAccentColor] = useState('#3587A4');
  const [toasts, setToasts] = useState([]);

  // Server-backed domain caches
  const [settings, setSettings] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [publicFaculty, setPublicFaculty] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [timetableSlots, setTimetableSlots] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).slice(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Apply theme ('dark' | 'light' | 'system') & accent color safely
  useEffect(() => {
    const applyTheme = () => {
      const resolved =
        themeMode === 'system'
          ? window.matchMedia?.('(prefers-color-scheme: light)').matches
            ? 'light'
            : 'dark'
          : themeMode;
      document.documentElement.setAttribute('data-theme', resolved);
      document.documentElement.style.setProperty('--accent-primary', accentColor);
      try {
        window.localStorage.setItem('cas_erp_theme', themeMode);
      } catch {
        // Ignore storage errors
      }
    };
    applyTheme();
    if (themeMode === 'system' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: light)');
      mq.addEventListener?.('change', applyTheme);
      return () => mq.removeEventListener?.('change', applyTheme);
    }
  }, [themeMode, accentColor]);

  const can = useCallback(
    (moduleName, verb = 'view') => {
      if (!authContext?.permissions) return false;
      return Boolean(hasRolePermission(authContext.permissions, moduleName, verb));
    },
    [authContext]
  );

  const loadCoreData = useCallback(async (auth) => {
    if (!auth) return;
    const tasks = [];

    tasks.push(
      api.get('/org/departments').then((d) => setDepartments(d.departments || [])).catch(() => {}),
      api.get('/org/programs').then((d) => setPrograms(d.programs || [])).catch(() => {}),
      api.get('/org/subjects').then((d) => setSubjects(d.subjects || [])).catch(() => {}),
      api.get('/public/faculty').then((d) => setPublicFaculty(d.faculty || [])).catch(() => {}),
      api
        .get('/notifications')
        .then((d) => {
          setNotifications(d.notifications || []);
          setUnreadNotificationCount(d.unreadCount || 0);
        })
        .catch(() => {}),
      api
        .get('/notifications/announcements')
        .then((d) => setAnnouncements(d.announcements || []))
        .catch(() => {})
    );

    if (hasRolePermission(auth.permissions, 'settings', 'view')) {
      tasks.push(api.get('/org/settings').then((d) => setSettings(d.settings)).catch(() => {}));
    }
    if (hasRolePermission(auth.permissions, 'students', 'view') || hasRolePermission(auth.permissions, 'academics', 'view')) {
      tasks.push(
        api.get('/academics/students?limit=100').then((d) => setStudents(d.students || [])).catch(() => {})
      );
    }
    if (hasRolePermission(auth.permissions, 'faculty', 'view')) {
      tasks.push(api.get('/academics/employees').then((d) => setEmployees(d.employees || [])).catch(() => {}));
    }
    if (hasRolePermission(auth.permissions, 'timetable', 'view')) {
      tasks.push(api.get('/academics/timetable').then((d) => setTimetableSlots(d.slots || [])).catch(() => {}));
    }
    if (hasRolePermission(auth.permissions, 'finance', 'view')) {
      tasks.push(
        api.get('/finance/invoices').then((d) => setInvoices(d.invoices || [])).catch(() => {}),
        api.get('/finance/payments').then((d) => setPayments(d.payments || [])).catch(() => {})
      );
    }

    await Promise.all(tasks);
  }, []);

  const applyAuthenticatedPayload = useCallback(
    async (data) => {
      setCurrentUser(data.user);
      setAuthContext(data.auth);
      if (data.user?.preferences) {
        setThemeMode(data.user.preferences.theme || 'dark');
        setAccentColor(data.user.preferences.accentColor || '#3587A4');
        setLang(data.user.preferences.language || 'en');
      }
      await loadCoreData(data.auth);
    },
    [loadCoreData, setLang]
  );

  // On reload/fresh visit, permanently defaults to login screen without auto-restoring into dashboard
  const loginUser = async (credentials) => {
    const data = await authService.login(credentials);
    await applyAuthenticatedPayload(data);
    return data;
  };

  const logoutUser = async () => {
    await authService.logout().catch(() => {});
    setCurrentUser(null);
    setAuthContext(null);
    setStudents([]);
    setEmployees([]);
    setInvoices([]);
    setPayments([]);
    window.history.replaceState(null, '', '/login');
    showToast('Signed out securely', 'info');
  };

  const switchRole = async (roleKey) => {
    const data = await authService.switchRole(roleKey);
    await applyAuthenticatedPayload(data);
    showToast(`Switched active role to ${ROLE_META[roleKey]?.label || roleKey}`);
  };

  const updateUserPreferences = async (prefs) => {
    if (prefs.theme) setThemeMode(prefs.theme);
    if (prefs.accentColor) setAccentColor(prefs.accentColor);
    if (prefs.language) setLang(prefs.language);
    if (currentUser) {
      await authService.updatePreferences(prefs).catch(() => {});
    }
  };

  const refreshAll = useCallback(async () => {
    if (authContext) await loadCoreData(authContext);
  }, [authContext, loadCoreData]);

  const currentRole = authContext?.activeRole || 'STUDENT';
  const theme = themeMode === 'system'
    ? (window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    : themeMode;

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    updateUserPreferences({ theme: next });
  };

  return (
    <ERPContext.Provider
      value={{
        isInitializing: false,
        isAuthenticated: Boolean(currentUser && authContext),
        currentUser,
        authContext,
        currentRole,
        assignedRoles: authContext?.assignedRoles || [],
        can,
        ROLES: ROLE_META,
        ALLOWED_ACCENTS,
        theme,
        themeMode,
        accentColor,
        toggleTheme,
        updateUserPreferences,
        loginUser,
        logoutUser,
        switchRole,
        refreshAll,
        toasts,
        showToast,
        removeToast,
        settings,
        setSettings,
        departments,
        programs,
        subjects,
        students,
        employees,
        publicFaculty,
        invoices,
        payments,
        announcements,
        notifications,
        unreadNotificationCount,
        timetableSlots
      }}
    >
      {children}
    </ERPContext.Provider>
  );
};

export const useERP = () => {
  const ctx = useContext(ERPContext);
  if (!ctx) throw new Error('useERP must be used within ERPProvider');
  return ctx;
};
