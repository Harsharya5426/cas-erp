import React, { useState, useEffect } from 'react';
import { ERPProvider, useERP } from './context/ERPContext.jsx';
import { LanguageProvider, useLanguage } from './context/LanguageContext.jsx';
import { Navbar } from './components/Navbar.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { ToastContainer } from './components/ToastContainer.jsx';
import { InstitutionalFooter } from './components/InstitutionalFooter.jsx';

import { LoginView } from './views/LoginView.jsx';
import { PublicPortalView } from './views/PublicPortalView.jsx';
import { DashboardView } from './views/DashboardView.jsx';
import { AdmissionsCmsView } from './views/AdmissionsCmsView.jsx';
import { StudentsView } from './views/StudentsView.jsx';
import { FacultyView } from './views/FacultyView.jsx';
import { CoursesView } from './views/CoursesView.jsx';
import { TimetableView } from './views/TimetableView.jsx';
import { ExamsLmsView } from './views/ExamsLmsView.jsx';
import { FinanceView } from './views/FinanceView.jsx';
import { AccountingView } from './views/AccountingView.jsx';
import { AttendanceGradesView } from './views/AttendanceGradesView.jsx';
import { FaceAttendanceView } from './views/FaceAttendanceView.jsx';
import { LeaveManagementView } from './views/LeaveManagementView.jsx';
import { NoticeBoardView } from './views/NoticeBoardView.jsx';
import { CampusServicesView } from './views/CampusServicesView.jsx';
import { ReportsAiAdminView } from './views/ReportsAiAdminView.jsx';
import { AuditLogsView } from './views/AuditLogsView.jsx';
import { SettingsView } from './views/SettingsView.jsx';

import { EnrollStudentModal } from './components/EnrollStudentModal.jsx';
import { CollectFeeModal } from './components/CollectFeeModal.jsx';
import { FeeReceiptModal } from './components/FeeReceiptModal.jsx';
import { StudentIDCardModal } from './components/StudentIDCardModal.jsx';
import { AddFacultyModal } from './components/AddFacultyModal.jsx';
import { AddCourseModal } from './components/AddCourseModal.jsx';
import { BroadcastModal } from './components/BroadcastModal.jsx';
import { QuickActionModal } from './components/QuickActionModal.jsx';

const CAMPUS_SERVICE_TABS = new Set([
  'library',
  'hostel',
  'documents',
  'placement',
  'inventory',
  'grievances',
  'campusOps'
]);

const VALID_WORKSPACE_TABS = new Set([
  'dashboard',
  'admissions',
  'students',
  'faculty',
  'courses',
  'timetable',
  'exams',
  'finance',
  'accounting',
  'attendance',
  'faceAttendance',
  'leaveManagement',
  'notices',
  'library',
  'hostel',
  'documents',
  'placement',
  'inventory',
  'grievances',
  'campusOps',
  'reports',
  'rbacAdmin',
  'audit',
  'settings'
]);

function canAccessTab(tab, can) {
  switch (tab) {
    case 'dashboard':
    case 'notices':
    case 'settings':
      return true;
    case 'admissions':
      return can('admissions', 'view') || can('cms', 'edit');
    case 'students':
      return can('students', 'view');
    case 'faculty':
      return true;
    case 'courses':
      return can('academics', 'view');
    case 'timetable':
      return true;
    case 'exams':
      return can('exams', 'view') || can('lms', 'view');
    case 'finance':
      return can('finance', 'view');
    case 'accounting':
      return can('accounting', 'view');
    case 'attendance':
    case 'faceAttendance':
      return can('attendance', 'view');
    case 'leaveManagement':
      return can('leave', 'view');
    case 'library':
      return can('library', 'view');
    case 'hostel':
      return can('hostel', 'view');
    case 'documents':
      return can('documents', 'view') || can('certificates', 'view');
    case 'placement':
      return can('placement', 'view');
    case 'inventory':
      return can('inventory', 'view');
    case 'grievances':
      return can('grievances', 'view');
    case 'campusOps':
      return can('events', 'view') || can('research', 'view') || can('safety', 'view');
    case 'reports':
      return can('reports', 'view') || can('ai', 'submit');
    case 'rbacAdmin':
      return can('rbac', 'view') || can('migration', 'view');
    case 'audit':
      return can('audit', 'view');
    default:
      return false;
  }
}

const ERPApp = () => {
  const { isAuthenticated, isInitializing, can } = useERP();
  const { t } = useLanguage();
  const [showPublicPortal, setShowPublicPortal] = useState(
    () => window.location.hash === '#public' || window.location.pathname === '/public'
  );
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return VALID_WORKSPACE_TABS.has(hash) ? hash : 'dashboard';
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [isCollectFeeOpen, setIsCollectFeeOpen] = useState(false);
  const [collectFeeInitialStudent, setCollectFeeInitialStudent] = useState(null);
  const [activeFeeForReceipt, setActiveFeeForReceipt] = useState(null);
  const [activeStudentForIDCard, setActiveStudentForIDCard] = useState(null);
  const [isAddFacultyOpen, setIsAddFacultyOpen] = useState(false);
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);

  useEffect(() => {
    const syncRoute = () => {
      const hash = window.location.hash.replace('#', '');
      const path = window.location.pathname;
      if (hash === 'public' || path === '/public') {
        setShowPublicPortal(true);
      } else if (hash === 'login' || path === '/login') {
        setShowPublicPortal(false);
      } else if (VALID_WORKSPACE_TABS.has(hash) && (!isAuthenticated || canAccessTab(hash, can))) {
        setShowPublicPortal(false);
        setActiveTab(hash);
      } else {
        setShowPublicPortal(false);
        setActiveTab('dashboard');
        if (isAuthenticated) {
          window.history.replaceState(null, '', '/#dashboard');
        }
      }
    };
    window.addEventListener('hashchange', syncRoute);
    window.addEventListener('popstate', syncRoute);
    return () => {
      window.removeEventListener('hashchange', syncRoute);
      window.removeEventListener('popstate', syncRoute);
    };
  }, [isAuthenticated, can]);

  const resolvedTab = isAuthenticated
    ? (VALID_WORKSPACE_TABS.has(activeTab) && canAccessTab(activeTab, can) ? activeTab : 'dashboard')
    : activeTab;

  // Enforce clean URL redirects:
  // - Unauthenticated non-public visits -> /login
  // - Authenticated visits on invalid/unauthorized tab or /login -> /#dashboard
  useEffect(() => {
    if (isInitializing) return;
    if (!isAuthenticated) {
      if (!showPublicPortal && (window.location.pathname !== '/login' || window.location.hash)) {
        window.history.replaceState(null, '', '/login');
      }
      return;
    }

    const desiredHash = `#${resolvedTab}`;
    if (window.location.pathname !== '/' || window.location.hash !== desiredHash) {
      window.history.replaceState(null, '', `/${desiredHash}`);
    }
  }, [isInitializing, isAuthenticated, showPublicPortal, resolvedTab]);

  const handleTabChange = (tab) => {
    const nextTab = VALID_WORKSPACE_TABS.has(tab) && canAccessTab(tab, can) ? tab : 'dashboard';
    setActiveTab(nextTab);
    if (window.location.pathname !== '/') {
      window.history.replaceState(null, '', `/#${nextTab}`);
    } else {
      window.location.hash = nextTab;
    }
  };

  if (isInitializing) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <p>{t('loading')}</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        {showPublicPortal ? (
          <PublicPortalView
            onGoToLogin={() => {
              setShowPublicPortal(false);
              window.history.pushState(null, '', '/login');
            }}
          />
        ) : (
          <LoginView
            onOpenPublicPortal={() => {
              setShowPublicPortal(true);
              window.history.pushState(null, '', '/#public');
            }}
          />
        )}
        <ToastContainer />
      </>
    );
  }

  const handleGlobalSearchSelect = (tab, data) => {
    handleTabChange(tab);
    if (tab === 'finance') setActiveFeeForReceipt(data);
    else if (tab === 'students') setActiveStudentForIDCard(data);
  };

  return (
    <div className="app-container">
      <a href="#main-content" className="skip-link">{t('skipToMain')}</a>

      <Sidebar
        activeTab={resolvedTab}
        onTabChange={handleTabChange}
        isCollapsed={isSidebarCollapsed}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className="main-content">
        <Navbar
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isOpenMobile={isMobileSidebarOpen}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onOpenQuickAction={() => setIsQuickActionOpen(true)}
          onGlobalSearchSelect={handleGlobalSearchSelect}
        />

        <main id="main-content" tabIndex={-1} style={{ flex: 1, backgroundColor: 'var(--bg-primary)' }}>
          <div key={resolvedTab} className="view-transition-stage">
            {resolvedTab === 'dashboard' && (
              <DashboardView
                onNavigate={handleTabChange}
                onOpenEnroll={() => setIsEnrollOpen(true)}
                onOpenCollectFee={() => { setCollectFeeInitialStudent(null); setIsCollectFeeOpen(true); }}
                onViewReceipt={(fee) => setActiveFeeForReceipt(fee)}
              />
            )}
            {resolvedTab === 'admissions' && <AdmissionsCmsView />}
            {resolvedTab === 'students' && (
              <StudentsView
                onOpenEnroll={() => setIsEnrollOpen(true)}
                onOpenCollectFeeWithStudent={(stu) => { setCollectFeeInitialStudent(stu); setIsCollectFeeOpen(true); }}
                onViewStudentIDCard={(stu) => setActiveStudentForIDCard(stu)}
              />
            )}
            {resolvedTab === 'faculty' && <FacultyView onOpenAddFaculty={() => setIsAddFacultyOpen(true)} />}
            {resolvedTab === 'courses' && <CoursesView onOpenAddCourse={() => setIsAddCourseOpen(true)} />}
            {resolvedTab === 'timetable' && <TimetableView />}
            {resolvedTab === 'exams' && <ExamsLmsView />}
            {resolvedTab === 'finance' && (
              <FinanceView
                onOpenCollectFee={() => { setCollectFeeInitialStudent(null); setIsCollectFeeOpen(true); }}
                onViewReceipt={(fee) => setActiveFeeForReceipt(fee)}
              />
            )}
            {resolvedTab === 'accounting' && <AccountingView />}
            {resolvedTab === 'attendance' && <AttendanceGradesView />}
            {resolvedTab === 'faceAttendance' && <FaceAttendanceView />}
            {resolvedTab === 'leaveManagement' && <LeaveManagementView />}
            {resolvedTab === 'notices' && <NoticeBoardView onOpenBroadcast={() => setIsBroadcastOpen(true)} />}
            {CAMPUS_SERVICE_TABS.has(resolvedTab) && <CampusServicesView activeModule={resolvedTab} />}
            {(resolvedTab === 'reports' || resolvedTab === 'rbacAdmin') && <ReportsAiAdminView mode={resolvedTab} />}
            {resolvedTab === 'audit' && <AuditLogsView />}
            {resolvedTab === 'settings' && <SettingsView />}
          </div>
          <InstitutionalFooter compact />
        </main>
      </div>

      {isEnrollOpen && <EnrollStudentModal onClose={() => setIsEnrollOpen(false)} />}
      {isCollectFeeOpen && (
        <CollectFeeModal
          initialStudent={collectFeeInitialStudent}
          onClose={() => { setIsCollectFeeOpen(false); setCollectFeeInitialStudent(null); }}
          onPaymentComplete={(txn) => { setIsCollectFeeOpen(false); setCollectFeeInitialStudent(null); setActiveFeeForReceipt(txn); }}
        />
      )}
      {activeFeeForReceipt && <FeeReceiptModal feeRecord={activeFeeForReceipt} onClose={() => setActiveFeeForReceipt(null)} />}
      {activeStudentForIDCard && <StudentIDCardModal student={activeStudentForIDCard} onClose={() => setActiveStudentForIDCard(null)} />}
      {isAddFacultyOpen && <AddFacultyModal onClose={() => setIsAddFacultyOpen(false)} />}
      {isAddCourseOpen && <AddCourseModal onClose={() => setIsAddCourseOpen(false)} />}
      {isBroadcastOpen && <BroadcastModal onClose={() => setIsBroadcastOpen(false)} />}
      {isQuickActionOpen && (
        <QuickActionModal
          onClose={() => setIsQuickActionOpen(false)}
          onOpenEnroll={() => setIsEnrollOpen(true)}
          onOpenCollectFee={() => { setCollectFeeInitialStudent(null); setIsCollectFeeOpen(true); }}
          onOpenAddFaculty={() => setIsAddFacultyOpen(true)}
          onOpenAddCourse={() => setIsAddCourseOpen(true)}
          onOpenBroadcast={() => setIsBroadcastOpen(true)}
        />
      )}

      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <ERPProvider>
        <ERPApp />
      </ERPProvider>
    </LanguageProvider>
  );
}
