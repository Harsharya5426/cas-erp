/**
 * Official CAS AKTU Lucknow B.Tech 3rd Semester Timetables (Session 2026-27, w.e.f. 5th Oct 2026)
 * Signed by Dr. Anuj Kumar Sharma (Dean Academics, CAS)
 * & Official AKTU Lucknow Holiday Calendar 2026 (Letter No. AKTU/Registrar/Estab/2025/9743, dated 29 Dec 2025)
 */

export const TIMETABLE_PERIODS = [
  '9:30 AM - 10:20 AM',
  '10:20 AM - 11:10 AM',
  '11:10 AM - 12:00 PM',
  '12:00 PM - 12:50 PM',
  'LUNCH (12:50 PM - 02:00 PM)',
  '02:00 PM - 02:50 PM',
  '02:50 PM - 03:40 PM',
  '03:40 PM - 04:30 PM'
];

export const OFFICIAL_TIMETABLES = [
  {
    id: 'MECHA',
    branchTitle: 'B.Tech (Mechanical & Mechatronics Engineering)',
    shortLabel: 'B.Tech MECHA (Sem 3)',
    semester: '3rd Semester',
    session: 'Session 2026-27 w.e.f. 5th Oct 2026',
    coordinator: 'Dr. Anurag Namdev',
    room: '218',
    pdfUrl: '/docs/cas-timetable-2026-27.pdf#page=1',
    days: [
      {
        day: 'MONDAY',
        morning: [
          { label: 'CAS 302 (417)', span: 1 },
          { label: 'CME 303', span: 1 },
          { label: 'CME 302', span: 1 },
          { label: 'CME 304', span: 1 }
        ],
        afternoon: [
          { label: 'CME 302', span: 1 },
          { label: 'Sensors and Actuators Lab', span: 2, isLab: true }
        ]
      },
      {
        day: 'TUESDAY',
        morning: [
          { label: 'CAS 302 (417)', span: 1 },
          { label: 'CME 303', span: 1 },
          { label: 'CME 353', span: 2, isLab: true }
        ],
        afternoon: [
          { label: 'CME 351', span: 2, isLab: true },
          { label: 'LIBRARY', span: 1, isActivity: true }
        ]
      },
      {
        day: 'WEDNESDAY',
        morning: [
          { label: 'CAS 302 (417)', span: 1 },
          { label: 'CME 303', span: 1 },
          { label: 'CME 302', span: 1 },
          { label: 'CVA 301', span: 1 }
        ],
        afternoon: [
          { label: 'CME 301', span: 1 },
          { label: 'CME 354', span: 2, isLab: true }
        ]
      },
      {
        day: 'THURSDAY',
        morning: [
          { label: 'CVA 301', span: 1 },
          { label: 'CME 304', span: 1 },
          { label: 'PROBLEM SOLVING', span: 1, isActivity: true },
          { label: 'CME 301', span: 1 }
        ],
        afternoon: [
          { label: 'Design Thinking & Innovation / IDEA LAB', span: 2, isLab: true },
          { label: 'SPORTS', span: 1, isActivity: true }
        ]
      },
      {
        day: 'FRIDAY',
        morning: [
          { label: 'CME 301', span: 1 },
          { label: 'CME 304', span: 1 },
          { label: 'CME 301', span: 1 },
          { label: 'CME 304', span: 1 }
        ],
        afternoon: [
          { label: 'MAKERS LAB', span: 2, isLab: true },
          { label: '—', span: 1 }
        ]
      },
      {
        day: 'SATURDAY',
        morning: [{ label: '—', span: 4 }],
        afternoon: [{ label: '—', span: 3 }]
      }
    ],
    subjects: [
      { code: 'CAS 302', name: 'Engineering Mathematics-III', faculty: 'Dr. Prachi Gupta', labStaff: '' },
      { code: 'CME 301', name: 'Fundamentals of Thermodynamics and Fluid Mechanics', faculty: 'Dr. Summaiya Javed', labStaff: '' },
      { code: 'CME 302', name: 'Material Science and Metallurgy', faculty: 'Dr. Anurag Namdev', labStaff: '' },
      { code: 'CME 303', name: 'Introduction to Robotics', faculty: 'Dr. Anuj Kumar Sharma', labStaff: '' },
      { code: 'CME 304', name: 'Analog and Digital Electronics', faculty: 'Dr. Shagun Pal', labStaff: '' },
      { code: 'CME 351', name: 'Thermodynamics and Fluid Lab', faculty: 'Dr. Summaiya Javed', labStaff: '' },
      { code: 'CME 353', name: 'Robotics Lab', faculty: 'Dr. Siddharth Yadav & Dr. Anurag Namdev', labStaff: '' },
      { code: 'CME 354', name: 'Analog and Digital Electronics Lab', faculty: 'Dr. Shagun Pal', labStaff: '' },
      { code: 'CVA 301', name: 'Constitution of India', faculty: 'Er. Hrishikesh Kumar Singh', labStaff: '' }
    ]
  },
  {
    id: 'VLSI',
    branchTitle: 'B.Tech (VLSI Design & Technology)',
    shortLabel: 'B.Tech VLSI (Sem 3)',
    semester: '3rd Semester',
    session: 'Session 2026-27 w.e.f. 5th Oct 2026',
    coordinator: 'Dr. Shagun Pal',
    room: '302',
    pdfUrl: '/docs/cas-timetable-2026-27.pdf#page=2',
    days: [
      {
        day: 'MONDAY',
        morning: [
          { label: 'CAS 302 (417)', span: 1 },
          { label: 'CEC 303', span: 1 },
          { label: 'CEC 302', span: 1 },
          { label: 'CEC 304', span: 1 }
        ],
        afternoon: [
          { label: 'CEC 354', span: 2, isLab: true },
          { label: 'LIBRARY', span: 1, isActivity: true }
        ]
      },
      {
        day: 'TUESDAY',
        morning: [
          { label: 'CAS 302 (417)', span: 1 },
          { label: 'LIBRARY', span: 1, isActivity: true },
          { label: 'CEC 304', span: 1 },
          { label: 'CVA 301', span: 1 }
        ],
        afternoon: [
          { label: 'CEC 301 (T)', span: 1 },
          { label: 'Makers Lab', span: 2, isLab: true }
        ]
      },
      {
        day: 'WEDNESDAY',
        morning: [
          { label: 'CAS 302 (417)', span: 1 },
          { label: 'CEC 303 (T)', span: 1 },
          { label: 'CEC 303', span: 1 },
          { label: 'CEC 301', span: 1 }
        ],
        afternoon: [
          { label: 'CEC 353', span: 2, isLab: true },
          { label: 'CEC 302 (T)', span: 1 }
        ]
      },
      {
        day: 'THURSDAY',
        morning: [
          { label: 'CEC 302', span: 1 },
          { label: 'CVA 301', span: 1 },
          { label: 'CEC 304', span: 1 },
          { label: 'CEC 301', span: 1 }
        ],
        afternoon: [
          { label: 'CEC 351', span: 2, isLab: true },
          { label: 'SPORTS', span: 1, isActivity: true }
        ]
      },
      {
        day: 'FRIDAY',
        morning: [
          { label: 'CEC 302', span: 1 },
          { label: 'CEC 304 (T)', span: 1 },
          { label: 'CEC 303', span: 1 },
          { label: '—', span: 1 }
        ],
        afternoon: [
          { label: 'Design Thinking & Innovation / IDEA LAB', span: 2, isLab: true },
          { label: 'SPORTS', span: 1, isActivity: true }
        ]
      },
      {
        day: 'SATURDAY',
        morning: [{ label: '—', span: 4 }],
        afternoon: [{ label: '—', span: 3 }]
      }
    ],
    subjects: [
      { code: 'CAS 302', name: 'Engineering Mathematics-III', faculty: 'Dr. Prachi Gupta', labStaff: '' },
      { code: 'CEC 301', name: 'Network Analysis and Synthesis', faculty: 'Dr. Vibhu Kumar Tripathi', labStaff: '' },
      { code: 'CEC 302', name: 'Electronic Devices and Circuits', faculty: 'Dr. Shagun Pal', labStaff: '' },
      { code: 'CEC 303', name: 'Digital Logic Design', faculty: 'Dr. Kumari Pushpa', labStaff: '' },
      { code: 'CEC 304', name: 'Signal and Systems', faculty: 'Dr. Kumari Pushpa', labStaff: '' },
      { code: 'CEC 351', name: 'Network Analysis and Synthesis Lab', faculty: 'Dr. Vibhu Kumar Tripathi', labStaff: '' },
      { code: 'CEC 353', name: 'Digital Logic Design Lab', faculty: 'Dr. Kumari Pushpa', labStaff: 'Ms. Monica Singh' },
      { code: 'CEC 354', name: 'Electronics and Signal Systems Lab', faculty: 'Dr. Shagun Pal / Dr. Kumari Pushpa', labStaff: 'Ms. Monica Singh' },
      { code: 'CVA 301', name: 'Constitution of India', faculty: 'Er. Hrishikesh Kumar Singh', labStaff: '' }
    ]
  },
  {
    id: 'CSE',
    branchTitle: 'B.Tech (Computer Science & Engineering)',
    shortLabel: 'B.Tech CSE (Sem 3)',
    semester: '3rd Semester',
    session: 'Session 2026-27 w.e.f. 5th Oct 2026',
    coordinator: 'Er. Harendra Singh',
    room: '416',
    pdfUrl: '/docs/cas-timetable-2026-27.pdf#page=3',
    days: [
      {
        day: 'MONDAY',
        morning: [
          { label: 'CCS 303 (T)', span: 1 },
          { label: 'CVA 302 (SSB)', span: 1 },
          { label: 'CCS 304 (SSB)', span: 1 },
          { label: 'CCS 301', span: 1 }
        ],
        afternoon: [
          { label: 'MAKERS LAB B1', span: 2, isLab: true },
          { label: 'LIBRARY', span: 1, isActivity: true }
        ]
      },
      {
        day: 'TUESDAY',
        morning: [
          { label: 'CCS 351 (B1 & B2)', span: 2, isLab: true },
          { label: 'CAS 301 (SSB)', span: 1 },
          { label: 'CCS 301', span: 1 }
        ],
        afternoon: [
          { label: 'Design Thinking & Innovation / IDEA LAB', span: 3, isLab: true }
        ]
      },
      {
        day: 'WEDNESDAY',
        morning: [
          { label: 'DISCUSSION / PROJECT', span: 1, isActivity: true },
          { label: 'CVA 302 (SSB)', span: 1 },
          { label: 'CCS 353 (B1 & B2)', span: 2, isLab: true }
        ],
        afternoon: [
          { label: 'MAKERS LAB B2', span: 2, isLab: true },
          { label: 'CCS 303', span: 1 }
        ]
      },
      {
        day: 'THURSDAY',
        morning: [
          { label: 'CCS 304 (SSB)', span: 1 },
          { label: 'CAS 301 (SSB)', span: 1 },
          { label: 'CCS 301', span: 1 },
          { label: 'CCS 302 (T)', span: 1 }
        ],
        afternoon: [
          { label: 'DISCUSSION / PROJECT', span: 3, isActivity: true }
        ]
      },
      {
        day: 'FRIDAY',
        morning: [
          { label: 'CCS 354 (B1 & B2)', span: 2, isLab: true },
          { label: 'CAS 301 (SSB)', span: 1 },
          { label: 'CCS 304 (SSB)', span: 1 }
        ],
        afternoon: [
          { label: 'CCS 302 (SSB)', span: 3 }
        ]
      },
      {
        day: 'SATURDAY',
        morning: [
          { label: 'CCS 302', span: 1 },
          { label: 'CCS 303 (SSB)', span: 2 },
          { label: '—', span: 1 }
        ],
        afternoon: [{ label: '—', span: 3 }]
      }
    ],
    subjects: [
      { code: 'CAS 301', name: 'Discrete Mathematics', faculty: 'Er. Shilpi Shukla', labStaff: '' },
      { code: 'CCS 301', name: 'Software Engineering', faculty: 'Er. Pushpanjali Pandey', labStaff: '' },
      { code: 'CCS 302', name: 'Design and Analysis of Algorithms', faculty: 'Dr. Abhinesh Kaushik', labStaff: '' },
      { code: 'CCS 303', name: 'Object Oriented Programming', faculty: 'Dr. Vrijendra Singh', labStaff: '' },
      { code: 'CCS 304', name: 'Database Management System', faculty: 'Er. Harendra Singh', labStaff: '' },
      { code: 'CCS 351', name: 'Software Engineering Lab', faculty: 'Er. Pushpanjali Pandey', labStaff: '' },
      { code: 'CCS 353', name: 'Object Oriented Programming Lab', faculty: 'Er. Shilpi Shukla', labStaff: 'Mr. Divyanshu Chauhan' },
      { code: 'CCS 354', name: 'Database Management System Lab', faculty: 'Er. Harendra Singh', labStaff: 'Mr. Divyanshu Chauhan' },
      { code: 'CVA 302', name: 'Universal Human Values', faculty: 'Dr. Parul Singh', labStaff: '' }
    ]
  },
  {
    id: 'AIML',
    branchTitle: 'B.Tech (CSE — AI & Machine Learning)',
    shortLabel: 'B.Tech CSE-AIML (Sem 3)',
    semester: '3rd Semester',
    session: 'Session 2026-27 w.e.f. 5th Oct 2026',
    coordinator: 'Er. Shilpi Shukla',
    room: '417',
    pdfUrl: '/docs/cas-timetable-2026-27.pdf#page=4',
    days: [
      {
        day: 'MONDAY',
        morning: [
          { label: 'CAI 303', span: 1 },
          { label: 'CVA 302 (SSB)', span: 1 },
          { label: 'CAI 304 (SSB)', span: 1 },
          { label: 'CAI 301 (Room 417)', span: 1 }
        ],
        afternoon: [
          { label: 'Design Thinking & Innovation / IDEA LAB', span: 2, isLab: true },
          { label: 'LIBRARY', span: 1, isActivity: true }
        ]
      },
      {
        day: 'TUESDAY',
        morning: [
          { label: 'CAI 354 (B1 & B2)', span: 2, isLab: true },
          { label: 'CAS 301 (SSB)', span: 1 },
          { label: 'CAI 301 (Room 417)', span: 1 }
        ],
        afternoon: [
          { label: 'MAKERS LAB B2', span: 2, isLab: true },
          { label: 'DISCUSSION / PROJECT', span: 1, isActivity: true }
        ]
      },
      {
        day: 'WEDNESDAY',
        morning: [
          { label: 'DISCUSSION / PROJECT', span: 1, isActivity: true },
          { label: 'CVA 302 (SSB)', span: 1 },
          { label: 'CAI 302 (T)', span: 1 },
          { label: 'CAI 301 (Room 417)', span: 1 }
        ],
        afternoon: [
          { label: 'DISCUSSION / PROJECT', span: 3, isActivity: true }
        ]
      },
      {
        day: 'THURSDAY',
        morning: [
          { label: 'CAI 304 (SSB)', span: 1 },
          { label: 'CAS 301 (SSB)', span: 1 },
          { label: 'CAI 353 (B1 & B2)', span: 2, isLab: true }
        ],
        afternoon: [
          { label: 'MAKERS LAB B1', span: 2, isLab: true },
          { label: 'CAI 303', span: 1 }
        ]
      },
      {
        day: 'FRIDAY',
        morning: [
          { label: 'CAI 351 (B1 & B2)', span: 2, isLab: true },
          { label: 'CAS 301 (SSB)', span: 1 },
          { label: 'CAI 304 (SSB)', span: 1 }
        ],
        afternoon: [
          { label: 'CAI 302 (SSB)', span: 3 }
        ]
      },
      {
        day: 'SATURDAY',
        morning: [
          { label: 'CAI 302', span: 1 },
          { label: 'CAI 303 (SSB)', span: 2 },
          { label: '—', span: 1 }
        ],
        afternoon: [{ label: '—', span: 3 }]
      }
    ],
    subjects: [
      { code: 'CAS 301', name: 'Discrete Mathematics', faculty: 'Er. Shilpi Shukla', labStaff: '' },
      { code: 'CAI 301', name: 'Software Engineering', faculty: 'Er. Sneh Lata', labStaff: '' },
      { code: 'CAI 302', name: 'Design and Analysis of Algorithms', faculty: 'Dr. Abhinesh Kaushik', labStaff: '' },
      { code: 'CAI 303', name: 'Object Oriented Programming', faculty: 'Dr. Vrijendra Singh', labStaff: '' },
      { code: 'CAI 304', name: 'Database Management System', faculty: 'Er. Harendra Singh', labStaff: '' },
      { code: 'CAI 351', name: 'Software Engineering Lab', faculty: 'Er. Sneh Lata', labStaff: '' },
      { code: 'CAI 353', name: 'Object Oriented Programming Lab', faculty: 'Er. Shilpi Shukla', labStaff: 'Mr. Divyanshu Chauhan' },
      { code: 'CAI 354', name: 'Database Management System Lab', faculty: 'Er. Harendra Singh', labStaff: 'Mr. Divyanshu Chauhan' },
      { code: 'CVA 302', name: 'Universal Human Values', faculty: 'Dr. Parul Singh', labStaff: '' }
    ]
  }
];

export const AKTU_HOLIDAY_CALENDAR_2026 = {
  letterNo: 'AKTU/Registrar/Estab/2025/9743',
  issuedDate: '29 December 2025',
  signatory: 'Reena Singh, Registrar — Dr. A.P.J. Abdul Kalam Technical University, Lucknow',
  pdfUrl: '/docs/aktu-holiday-calendar-2026.pdf',
  notes: [
    '* Festivals marked with asterisk (*) are subject to local moon sighting.',
    '** Applicable exclusively to Banks / Treasuries / Sub-Treasuries.',
    '# Local holidays notified under Manual of Government Orders (Revised) 1981 Edition Para-247(C).',
    '+ Executive-order holidays are not applicable to offices observing a five-day working week.',
    'Every employee may avail any two (2) Restricted Holidays from the Restricted Holiday list.'
  ],
  publicHolidays: [
    { sr: 1, date: '2026-01-03', day: 'Saturday', name: 'Hazrat Ali Birthday *', nameHi: 'मो० हजरत अली का जन्म दिवस *' },
    { sr: 2, date: '2026-01-26', day: 'Monday', name: 'Republic Day', nameHi: 'गणतंत्र दिवस' },
    { sr: 3, date: '2026-02-15', day: 'Sunday', name: 'Mahashivratri', nameHi: 'महाशिवरात्रि' },
    { sr: 4, date: '2026-03-02', day: 'Monday', name: 'Holika Dahan', nameHi: 'होलिका दहन' },
    { sr: 5, date: '2026-03-04', day: 'Wednesday', name: 'Holi', nameHi: 'होली' },
    { sr: 6, date: '2026-03-05', day: 'Thursday', name: 'Holi (Local Holiday) #', nameHi: 'होली #' },
    { sr: 7, date: '2026-03-11', day: 'Wednesday', name: 'Sheetala Ashtami #', nameHi: 'शीतलाष्टमी #' },
    { sr: 8, date: '2026-03-21', day: 'Saturday', name: 'Eid-ul-Fitr *', nameHi: 'ईद-उल-फितर *' },
    { sr: 9, date: '2026-03-26', day: 'Thursday', name: 'Ram Navami', nameHi: 'राम नवमी' },
    { sr: 10, date: '2026-03-31', day: 'Tuesday', name: 'Mahavir Jayanti', nameHi: 'महावीर जयंती' },
    { sr: 11, date: '2026-04-01', day: 'Wednesday', name: 'Commercial Bank Annual Closing **', nameHi: 'वाणिज्य बैंकों की वार्षिक लेखाबंदी **' },
    { sr: 12, date: '2026-04-03', day: 'Friday', name: 'Good Friday', nameHi: 'गुड फ्राइडे' },
    { sr: 13, date: '2026-04-14', day: 'Tuesday', name: 'Dr. Bhimrao Ambedkar Jayanti', nameHi: 'डा० भीमराव अम्बेडकर जी का जन्म दिवस' },
    { sr: 14, date: '2026-05-01', day: 'Friday', name: 'Buddha Purnima', nameHi: 'बुद्ध पूर्णिमा' },
    { sr: 15, date: '2026-05-05', day: 'Tuesday', name: 'Mahavir Ji Fair (Bada Mangal) #', nameHi: 'महावीर जी का मेला (प्रथम बड़ा मंगल) #' },
    { sr: 16, date: '2026-05-27', day: 'Wednesday', name: 'Eid-ul-Zuha (Bakrid) *', nameHi: 'ईदुज्जुहा (बकरीद) *' },
    { sr: 17, date: '2026-06-26', day: 'Friday', name: 'Muharram *', nameHi: 'मोहर्रम *' },
    { sr: 18, date: '2026-08-15', day: 'Saturday', name: 'Independence Day', nameHi: 'स्वतंत्रता दिवस' },
    { sr: 19, date: '2026-08-26', day: 'Wednesday', name: 'Eid-e-Milad / Barawafat *', nameHi: 'ईद-ए-मिलाद / बारावफात *' },
    { sr: 20, date: '2026-08-28', day: 'Friday', name: 'Raksha Bandhan', nameHi: 'रक्षा बंधन' },
    { sr: 21, date: '2026-09-04', day: 'Friday', name: 'Janmashtami', nameHi: 'जन्माष्टमी' },
    { sr: 22, date: '2026-10-02', day: 'Friday', name: 'Mahatma Gandhi Jayanti', nameHi: 'महात्मा गांधी जयंती' },
    { sr: 23, date: '2026-10-20', day: 'Tuesday', name: 'Dussehra (Mahanavami / Vijayadashami)', nameHi: 'दशहरा महानवमी / विजयदशमी' },
    { sr: 24, date: '2026-11-08', day: 'Sunday', name: 'Deepawali (Diwali)', nameHi: 'दीपावली' },
    { sr: 25, date: '2026-11-09', day: 'Monday', name: 'Govardhan Puja', nameHi: 'गोवर्धन पूजा' },
    { sr: 26, date: '2026-11-11', day: 'Wednesday', name: 'Bhai Dooj / Chitragupta Jayanti', nameHi: 'भईयादूज / चित्रगुप्त जयन्ती' },
    { sr: 27, date: '2026-11-24', day: 'Tuesday', name: 'Guru Nanak Jayanti / Kartik Purnima', nameHi: 'गुरु नानक जयंती / कार्तिक पूर्णिमा' },
    { sr: 28, date: '2026-11-24', day: 'Tuesday', name: 'Guru Tegh Bahadur Shaheed Diwas +', nameHi: 'गुरु तेग बहादुर शहीद दिवस +' },
    { sr: 29, date: '2026-12-25', day: 'Friday', name: 'Christmas Day', nameHi: 'क्रिसमस-डे' }
  ],
  restrictedHolidays: [
    { sr: 1, date: '2026-01-01', day: 'Thursday', name: "New Year's Day", nameHi: 'नव वर्ष दिवस' },
    { sr: 2, date: '2026-01-14', day: 'Wednesday', name: 'Makar Sankranti', nameHi: 'मकर संक्रान्ति' },
    { sr: 3, date: '2026-01-23', day: 'Friday', name: 'Basant Panchami', nameHi: 'बसंत पंचमी' },
    { sr: 4, date: '2026-01-24', day: 'Saturday', name: 'Jannayak Karpoori Thakur Jayanti', nameHi: 'जननायक कर्पूरी ठाकुर जन्म दिवस' },
    { sr: 5, date: '2026-02-01', day: 'Sunday', name: 'Sant Ravidas Jayanti', nameHi: 'संत रविदास जयंती' },
    { sr: 6, date: '2026-02-04', day: 'Wednesday', name: 'Shab-e-Barat *', nameHi: 'शबे बारात *' },
    { sr: 7, date: '2026-03-05', day: 'Thursday', name: 'Holi (Restricted)', nameHi: 'होली' },
    { sr: 8, date: '2026-03-13', day: 'Friday', name: 'Jamat-ul-Vida (Alvida) *', nameHi: 'जमात-उल-विदा (अलविदा) *' },
    { sr: 9, date: '2026-03-19', day: 'Thursday', name: 'Cheti Chand', nameHi: 'चेटी चन्द' },
    { sr: 10, date: '2026-03-22', day: 'Sunday', name: 'Eid-ul-Fitr (Restricted) *', nameHi: 'ईद-उल-फितर *' },
    { sr: 11, date: '2026-04-04', day: 'Saturday', name: 'Easter Saturday', nameHi: 'ईस्टर सैटरडे' },
    { sr: 12, date: '2026-04-05', day: 'Sunday', name: 'Maharshi Kashyap & Nishad Raj Guhya Jayanti', nameHi: 'महर्षि कश्यप एवं महाराजा निषाद राज गुह्य जयन्ती' },
    { sr: 13, date: '2026-04-06', day: 'Monday', name: 'Easter Monday', nameHi: 'ईस्टर मन्डे' },
    { sr: 14, date: '2026-04-17', day: 'Friday', name: 'Chandrashekhar Jayanti', nameHi: 'चन्द्रशेखर जयंती' },
    { sr: 15, date: '2026-04-19', day: 'Sunday', name: 'Parshuram Jayanti', nameHi: 'परशुराम जयन्ती' },
    { sr: 16, date: '2026-05-09', day: 'Saturday', name: 'Lok Nayak Maharana Pratap Jayanti', nameHi: 'लोक नायक महाराणा प्रताप जयन्ती' },
    { sr: 17, date: '2026-05-28', day: 'Thursday', name: 'Eid-ul-Zuha (Bakrid Restricted) *', nameHi: 'ईदुज्जुहा (बकरीद) *' },
    { sr: 18, date: '2026-06-25', day: 'Thursday', name: 'Muharram (Restricted) *', nameHi: 'मोहर्रम *' },
    { sr: 19, date: '2026-08-04', day: 'Tuesday', name: 'Chehlum *', nameHi: 'चेहल्लुम *' },
    { sr: 20, date: '2026-09-17', day: 'Thursday', name: 'Vishwakarma Puja', nameHi: 'विश्वकर्मा पूजा' },
    { sr: 21, date: '2026-09-25', day: 'Friday', name: 'Anant Chaturdashi', nameHi: 'अनन्त चतुर्दशी' },
    { sr: 22, date: '2026-10-11', day: 'Sunday', name: 'Maharaja Agrasen Jayanti', nameHi: 'महाराजा अग्रसेन जयन्ती' },
    { sr: 23, date: '2026-10-19', day: 'Monday', name: 'Dussehra (Maha Ashtami)', nameHi: 'दशहरा (महाअष्टमी)' },
    { sr: 24, date: '2026-10-26', day: 'Monday', name: 'Maharshi Valmiki Jayanti', nameHi: 'महर्षि बाल्मीकि जयन्ती' },
    { sr: 25, date: '2026-10-31', day: 'Saturday', name: 'Sardar Vallabhbhai Patel & Acharya Narendra Dev Jayanti', nameHi: 'सरदार बल्लभ भाई पटेल एवं आचार्य नरेन्द्र देव जयंती' },
    { sr: 26, date: '2026-11-08', day: 'Sunday', name: 'Narak Chaturdashi', nameHi: 'नरक चतुर्दशी' },
    { sr: 27, date: '2026-11-15', day: 'Sunday', name: 'Chhath Puja Parv', nameHi: 'छठ पूजा पर्व' },
    { sr: 28, date: '2026-11-16', day: 'Monday', name: 'Veerangana Uda Devi Shaheed Diwas', nameHi: 'वीरांगना ऊदा देवी शहीद दिवस' },
    { sr: 29, date: '2026-12-16', day: 'Wednesday', name: 'Hazrat Khwaja Moinuddin Chishti Urs *', nameHi: 'हजरत ख्वाजा मुईनुद्दीन चिश्ती अजमेरी गरीब नवाज रह का उर्स *' },
    { sr: 30, date: '2026-12-23', day: 'Wednesday', name: 'Chaudhary Charan Singh Jayanti', nameHi: 'चौधरी चरण सिंह का जन्म दिवस' },
    { sr: 31, date: '2026-12-24', day: 'Thursday', name: 'Christmas Eve', nameHi: 'क्रिसमस ईव' }
  ]
};
