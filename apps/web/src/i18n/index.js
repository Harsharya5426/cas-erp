import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

export const resources = {
  en: {
    translation: {
      brandName: 'cas.erp',
      institutionTitle: 'Centre for Advanced Studies, AKTU Lucknow',
      skipToMain: 'Skip to main content',
      publicPortal: 'Public Portal & Admissions',
      signIn: 'Portal Sign In',
      signOut: 'Sign Out',
      languageLabel: 'हिन्दी',
      loading: 'Loading institutional records...',
      retry: 'Retry',
      save: 'Save Changes',
      cancel: 'Cancel',
      submit: 'Submit',
      approve: 'Approve',
      reject: 'Reject',
      searchPlaceholder: 'Search students, courses, receipts, notices...',
      nav: {
        overview: 'Overview',
        academics: 'Academic Core',
        operations: 'Campus Operations',
        ecosystem: 'Campus Ecosystem',
        governance: 'Governance & Admin',
        dashboard: 'Executive Dashboard',
        admissions: 'Admissions & CMS',
        students: 'Student Directory',
        faculty: 'Faculty & Staff HR',
        courses: 'Academic Catalog',
        timetable: 'Timetable & Calendar',
        attendance: 'Lecture & Staff Attendance',
        faceAttendance: 'Mark Attendance',
        leaveManagement: 'Leave & Outpass',
        exams: 'Exams, Results & LMS',
        finance: 'Fees & Cashfree Ledger',
        accounting: 'Double-Entry Accounting',
        library: 'Library & Circulation',
        hostel: 'Hostel & Mess',
        documents: 'Documents & Certificates',
        placement: 'Placement & Alumni',
        inventory: 'Inventory & Procurement',
        grievances: 'Grievance & Helpdesk',
        campusOps: 'Events, Research & Safety',
        notices: 'Campus Notices',
        reports: 'Reports & AI Advisor',
        rbacAdmin: 'RBAC, Users & Migration',
        audit: 'Immutable Audit Logs',
        settings: 'Governance & Settings',
        parentPortal: 'Parent / Guardian Portal'
      },
      auth: {
        portalHeading: 'ERP Portal Login',
        title: 'Centre for Advanced Studies',
        subtitle: 'Dr. A.P.J. Abdul Kalam Technical University, Lucknow',
        univFull: 'Dr. A.P.J. Abdul Kalam Technical University, Uttar Pradesh, Lucknow',
        centreTagline: 'Autonomous Post-Graduate & Research Centre • AKTU Lucknow',
        email: 'User ID / Institutional Email',
        password: 'Password',
        mfaCode: 'Authenticator / Recovery Code (if MFA enabled)',
        loginBtn: 'Sign In Securely',
        forgotPassword: 'Forgot Password?',
        publicPortalLink: 'Public Portal →',
        disclaimerPrimary: 'ERP Portal for Centre for Advanced Studies (CAS), Dr. A.P.J. Abdul Kalam Technical University, Lucknow.',
        disclaimerSecondary: 'Centre for Advanced Studies Academic & Administrative ERP System',
        poweredByBadge: 'CAS Academic ERP',
        resetTitle: 'Password Recovery',
        sendReset: 'Send Recovery Token',
        applyPublic: 'Apply for Admission / Track Application',
        verifyCert: 'Verify QR Certificate'
      },
      biometrics: {
        policyNotice: 'Biometric matching is disabled until institutional privacy assessment, consent, and hardware policy approval are completed. Penalty-free Manual, QR, and RFID attendance remain active.'
      }
    }
  },
  hi: {
    translation: {
      brandName: 'cas.erp',
      institutionTitle: 'सेंटर फॉर एडवांस्ड स्टडीज, एकेटीयू लखनऊ',
      skipToMain: 'मुख्य सामग्री पर जाएं',
      publicPortal: 'सार्वजनिक पोर्टल और प्रवेश',
      signIn: 'पोर्टल लॉगिन',
      signOut: 'साइन आउट',
      languageLabel: 'English',
      loading: 'संस्थान रिकॉर्ड लोड हो रहे हैं...',
      retry: 'पुनः प्रयास करें',
      save: 'परिवर्तन सहेजें',
      cancel: 'रद्द करें',
      submit: 'जमा करें',
      approve: 'स्वीकृत करें',
      reject: 'अस्वीकार करें',
      searchPlaceholder: 'छात्र, पाठ्यक्रम, रसीद, सूचना खोजें...',
      nav: {
        overview: 'सारांश',
        academics: 'शैक्षणिक कोर',
        operations: 'कैंपस संचालन',
        ecosystem: 'परिसर सेवाएं',
        governance: 'प्रशासन और शासन',
        dashboard: 'कार्यकारी डैशबोर्ड',
        admissions: 'प्रवेश और वेबसाइट CMS',
        students: 'छात्र निर्देशिका',
        faculty: 'संकाय और कर्मचारी HR',
        courses: 'शैक्षणिक पाठ्यक्रम',
        timetable: 'समय सारणी और टकराव जांच',
        attendance: 'कक्षा एवं कर्मचारी उपस्थिति',
        faceAttendance: 'उपस्थिति दर्ज करें',
        leaveManagement: 'अवकाश एवं आउटपास',
        exams: 'परीक्षा, परिणाम और LMS',
        finance: 'शुल्क और कैशफ्री खाता',
        accounting: 'दोहरी प्रविष्टि लेखांकन',
        library: 'पुस्तकालय और संचलन',
        hostel: 'छात्रावास और मेस',
        documents: 'दस्तावेज़ और प्रमाणपत्र',
        placement: 'प्लेसमेंट और पूर्व छात्र',
        inventory: 'इन्वेंटरी और खरीद',
        grievances: 'शिकायत निवारण और हेल्पडेस्क',
        campusOps: 'कार्यक्रम, शोध और सुरक्षा',
        notices: 'परिसर सूचनाएं',
        reports: 'रिपोर्ट और AI सलाहकार',
        rbacAdmin: 'भूमिका, उपयोगकर्ता और माइग्रेशन',
        audit: 'अपरिवर्तनीय ऑडिट लॉग',
        settings: 'शासन और सेटिंग्स',
        parentPortal: 'अभिभावक पोर्टल'
      },
      auth: {
        portalHeading: 'ई० आर० पी० लॉगिन',
        title: 'सेंटर फॉर एडवांस्ड स्टडीज',
        subtitle: 'डॉ. ए.पी.जे. अब्दुल कलाम प्राविधिक विश्वविद्यालय, लखनऊ',
        univFull: 'डॉ० ए०पी०जे० अब्दुल कलाम प्राविधिक विश्वविद्यालय, उत्तर प्रदेश, लखनऊ',
        centreTagline: 'स्वायत्त स्नातकोत्तर एवं अनुसंधान केंद्र • एकेटीयू लखनऊ',
        email: 'यूजर आई० डी० / संस्थागत ईमेल',
        password: 'पासवर्ड',
        mfaCode: 'प्रमाणीकरण / रिकवरी कोड (यदि MFA सक्रिय है)',
        loginBtn: 'सुरक्षित साइन इन करें',
        forgotPassword: 'पासवर्ड भूल गए?',
        publicPortalLink: 'सार्वजनिक पोर्टल →',
        disclaimerPrimary: 'डॉ० ए०पी०जे० अब्दुल कलाम प्राविधिक विश्वविद्यालय, लखनऊ के सेंटर फॉर एडवांस्ड स्टडीज (CAS) हेतु शैक्षणिक ई० आर० पी० पोर्टल।',
        disclaimerSecondary: 'सेंटर फॉर एडवांस्ड स्टडीज शैक्षणिक एवं प्रबंधन ईआरपी प्रणाली',
        poweredByBadge: 'कैस एकेडमिक ईआरपी',
        resetTitle: 'पासवर्ड पुनर्प्राप्ति',
        sendReset: 'रिकवरी टोकन भेजें',
        applyPublic: 'प्रवेश आवेदन करें / स्थिति ट्रैक करें',
        verifyCert: 'QR प्रमाणपत्र सत्यापित करें'
      },
      biometrics: {
        policyNotice: 'संस्थागत गोपनीयता मूल्यांकन, सहमति और हार्डवेयर नीति स्वीकृति पूर्ण होने तक बायोमेट्रिक मिलान अक्षम है। मैनुअल, QR और RFID उपस्थिति सक्रिय हैं।'
      }
    }
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false
  }
});

export default i18n;

