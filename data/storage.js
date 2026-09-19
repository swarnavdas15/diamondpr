/**
 * DIAMOND FLANGES & FITTINGS PVT LTD - CENTRALIZED LOCALSTORAGE API
 */

const STORAGE_KEY = 'DIAMOND_ERP_DATA_V2';

const INITIAL_DEMO_DATA = {
  session: null,
  settings: {
    theme: 'light',
    companyName: 'Diamond Flanges & Fittings Pvt Ltd',
    tagline: 'Leading Manufacturer of Forged Flanges, Pipe Fittings & Valves',
    currency: 'INR',
    fileStorageLimitMB: 50,
  },
  users: [
    {
      id: 'usr-1',
      username: 'admin',
      email: 'admin@diamondflanges.com',
      password: 'admin123',
      name: 'Rajesh Sharma',
      mobile: '+91 98200 11223',
      role: 'Super Admin',
      department: 'Executive Board',
      designation: 'Managing Director & CEO',
      managerId: null,
      status: 'Active',
      dob: '1975-08-14',
      anniversary: '2001-11-20',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'usr-2',
      username: 'manager',
      email: 'vikram.m@diamondflanges.com',
      password: 'mgr123',
      name: 'Vikram Malhotra',
      mobile: '+91 98331 44556',
      role: 'Manager',
      department: 'Production & Machining',
      designation: 'General Manager - Plant',
      managerId: 'usr-1',
      status: 'Active',
      dob: '1982-04-10',
      anniversary: '2009-02-14',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'usr-3',
      username: 'employee',
      email: 'priya.s@diamondflanges.com',
      password: 'emp123',
      name: 'Priya Sundaram',
      mobile: '+91 97112 66778',
      role: 'Employee',
      department: 'Quality Assurance & Testing',
      designation: 'Senior QA Inspector',
      managerId: 'usr-2',
      status: 'Active',
      dob: '1991-09-25',
      anniversary: '2018-05-12',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'usr-4',
      username: 'amits',
      email: 'amit.s@diamondflanges.com',
      password: 'emp123',
      name: 'Amit Swaminathan',
      mobile: '+91 98990 22334',
      role: 'Manager',
      department: 'Sales & Commercial Procurement',
      designation: 'Commercial Manager',
      managerId: 'usr-1',
      status: 'Active',
      dob: '1986-12-05',
      anniversary: '2013-06-28',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'usr-5',
      username: 'sureshk',
      email: 'suresh.k@diamondflanges.com',
      password: 'emp123',
      name: 'Suresh Kumar',
      mobile: '+91 94441 55667',
      role: 'Employee',
      department: 'Logistics & Dispatch',
      designation: 'Logistics Coordinator',
      managerId: 'usr-4',
      status: 'Active',
      dob: '1993-01-18',
      anniversary: '2020-10-05',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
    }
  ],
  companies: [
    {
      id: 'comp-1',
      code: 'DFF-CUST-001',
      name: 'Larsen & Toubro Heavy Engineering',
      industry: 'Oil & Gas EPC',
      gstin: '27AAACL1234F1Z9',
      pan: 'AAACL1234F',
      website: 'www.larsentoubro.com',
      rating: 'Tier 1 Key Account',
      addresses: [
        {
          id: 'addr-1',
          type: 'Head Office & Works',
          address: 'Gate 7, Powai Campus, Saki Vihar Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          pin: '400072',
          gstin: '27AAACL1234F1Z9'
        },
        {
          id: 'addr-2',
          type: 'Hazira Manufacturing Complex',
          address: 'Surat-Hazira Road, Post Bhatha',
          city: 'Surat',
          state: 'Gujarat',
          pin: '394510',
          gstin: '24AAACL1234F2Z8'
        }
      ],
      contacts: [
        {
          id: 'cnt-1',
          title: 'Mr.',
          firstName: 'Anand',
          lastName: 'Deshmukh',
          position: 'VP Procurement - Piping & Pressure Vessels',
          mobile: '+91 98201 99887',
          whatsapp: '+91 98201 99887',
          landline: '022 6705 4000',
          officialEmail: 'anand.deshmukh@larsentoubro.com',
          personalEmail: '',
          dob: '1976-06-15',
          anniversary: '2004-12-10',
          photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80'
        },
        {
          id: 'cnt-2',
          title: 'Ms.',
          firstName: 'Meera',
          lastName: 'Shah',
          position: 'Chief QA/QC Inspector',
          mobile: '+91 98920 11445',
          whatsapp: '+91 98920 11445',
          landline: '022 6705 4012',
          officialEmail: 'meera.shah@larsentoubro.com',
          personalEmail: '',
          dob: '1984-03-29',
          anniversary: '2012-04-18',
          photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80'
        }
      ]
    },
    {
      id: 'comp-2',
      code: 'DFF-CUST-002',
      name: 'Reliance Industries Limited (Refinery Div)',
      industry: 'Petrochemicals & Refining',
      gstin: '24AABCR5678G1Z3',
      pan: 'AABCR5678G',
      website: 'www.ril.com',
      rating: 'Tier 1 Key Account',
      addresses: [
        {
          id: 'addr-3',
          type: 'Jamnagar Export Refinery Unit',
          address: 'Motikhavdi, Reliance Complex',
          city: 'Jamnagar',
          state: 'Gujarat',
          pin: '361142',
          gstin: '24AABCR5678G1Z3'
        }
      ],
      contacts: [
        {
          id: 'cnt-3',
          title: 'Mr.',
          firstName: 'Sunil',
          lastName: 'Venkatesh',
          position: 'Head of Maintenance & Piping Overhaul',
          mobile: '+91 99798 33441',
          whatsapp: '+91 99798 33441',
          landline: '0288 2883000',
          officialEmail: 'sunil.venkatesh@ril.com',
          personalEmail: '',
          dob: '1979-11-03',
          anniversary: '2006-08-20',
          photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80'
        }
      ]
    },
    {
      id: 'comp-3',
      code: 'DFF-CUST-003',
      name: 'Bharat Heavy Electricals Ltd (BHEL)',
      industry: 'Power Generation & Defense',
      gstin: '07AAACB0987H1Z5',
      pan: 'AAACB0987H',
      website: 'www.bhel.com',
      rating: 'Government Undertaking',
      addresses: [
        {
          id: 'addr-4',
          type: 'Power Sector Southern Region',
          address: '690 Anna Salai, Nandanam',
          city: 'Chennai',
          state: 'Tamil Nadu',
          pin: '600035',
          gstin: '33AAACB0987H1Z1'
        }
      ],
      contacts: [
        {
          id: 'cnt-4',
          title: 'Mr.',
          firstName: 'Ramesh',
          lastName: 'Subramanian',
          position: 'General Manager Procurement',
          mobile: '+91 94440 88776',
          whatsapp: '+91 94440 88776',
          landline: '044 2433 0011',
          officialEmail: 'rsubramanian@bhel.in',
          personalEmail: '',
          dob: '1972-01-30',
          anniversary: '1998-05-24',
          photo: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80'
        }
      ]
    }
  ],
  vendors: [
    {
      id: 'vnd-1',
      code: 'VND-FORGE-01',
      name: 'JSW Steel & Heavy Forgings Ltd',
      contactPerson: 'Harish Mehta',
      phone: '+91 98450 11990',
      email: 'h.mehta@jswforgings.com',
      materialSupplied: 'Carbon Steel (ASTM A105) & SS 316L Rough Forgings',
      status: 'Active / Certified Vendor',
      rating: 4.8
    },
    {
      id: 'vnd-2',
      code: 'VND-HEAT-02',
      name: 'Apex Heat Treatment & Metallurgical Lab',
      contactPerson: 'Dr. K. N. Patil',
      phone: '+91 98220 55443',
      email: 'info@apexheattreat.co.in',
      materialSupplied: 'Solution Annealing, Normalizing & Hardness Testing',
      status: 'Active / Sub-contractor',
      rating: 4.6
    },
    {
      id: 'vnd-3',
      code: 'VND-FAST-03',
      name: 'Sundram Fasteners Ltd',
      contactPerson: 'S. Rajagopalan',
      phone: '+91 94443 22110',
      email: 's.rajagopalan@sundram.com',
      materialSupplied: 'High Tensile Stud Bolts (ASTM A193 B7 / B8M)',
      status: 'Active',
      rating: 4.9
    }
  ],
  projects: [
    {
      id: 'prj-101',
      projectNumber: 'PRJ-2026-089',
      clientName: 'Larsen & Toubro Heavy Engineering',
      poNumber: 'PO-LT-HE-99481',
      poDate: '2026-08-15',
      deliveryDate: '2026-09-30',
      value: 4850000,
      materialStatus: 'SS 316L Rough Forgings Received & Machining In Process',
      dispatchStatus: 'Part Batch Dispatched (120/300 Pcs)',
      vendorNames: 'JSW Steel & Heavy Forgings Ltd, Apex Heat Treatment',
      remarks: 'Hydrostatic testing completed at 150 BAR. Third party inspection by Bureau Veritas scheduled for Sept 25.',
      status: 'In Process',
      progress: 68,
      notes: 'High pressure ANSI Class 1500 Weld Neck Flanges for offshore platform piping.'
    },
    {
      id: 'prj-102',
      projectNumber: 'PRJ-2026-092',
      clientName: 'Reliance Industries Limited (Refinery Div)',
      poNumber: 'PO-RIL-REF-55102',
      poDate: '2026-09-01',
      deliveryDate: '2026-09-19',
      value: 3200000,
      materialStatus: 'Heat Treatment & CNC Facing Completed',
      dispatchStatus: 'Final Inspection Ready & Packaging Underway',
      vendorNames: 'Sundram Fasteners Ltd',
      remarks: 'Client QA clearance issued. Ready for dispatch trucks today afternoon.',
      status: 'Part Dispatched',
      progress: 92,
      notes: 'ASTM A105 Carbon Steel Blind & Slip-On Flanges for Jamnagar Turnaround.'
    },
    {
      id: 'prj-103',
      projectNumber: 'PRJ-2026-095',
      clientName: 'Bharat Heavy Electricals Ltd (BHEL)',
      poNumber: 'PO-BHEL-PSSR-3392',
      poDate: '2026-09-10',
      deliveryDate: '2026-10-15',
      value: 7500000,
      materialStatus: 'Raw Billets Order Placed with JSW',
      dispatchStatus: 'Pending Machining',
      vendorNames: 'JSW Steel & Heavy Forgings Ltd',
      remarks: 'Waiting on raw material mill test certificate approval from BHEL QA.',
      status: 'Vendor Material Pending',
      progress: 25,
      notes: 'Alloy Steel F22 High Temp Flanges for Supercritical Thermal Power Plant.'
    },
    {
      id: 'prj-104',
      projectNumber: 'PRJ-2026-078',
      clientName: 'Indian Oil Corporation Ltd (IOCL)',
      poNumber: 'PO-IOCL-PANIPAT-112',
      poDate: '2026-07-20',
      deliveryDate: '2026-09-10',
      value: 1950000,
      materialStatus: 'All 150 Pcs Dispatched & Delivered',
      dispatchStatus: 'Complete Dispatch Delivered at Panipat Refinery',
      vendorNames: 'JSW Steel, Apex Heat Treatment',
      remarks: 'Final invoice and Mill Test Certificate (MTC) 3.1 uploaded and submitted.',
      status: 'Completed',
      progress: 100,
      notes: 'Duplex Stainless Steel UNS S31803 Threaded Fittings.'
    },
    {
      id: 'prj-105',
      projectNumber: 'PRJ-2026-099',
      clientName: 'ONGC Hazira Complex',
      poNumber: 'PO-ONGC-HAZ-8821',
      poDate: '2026-09-14',
      deliveryDate: '2026-10-30',
      value: 6200000,
      materialStatus: 'Work Order Created & Internal Production Sheet Drafted',
      dispatchStatus: 'Work Order Pending Approval',
      vendorNames: 'To be assigned',
      remarks: 'Client approval pending for modified ASME B16.5 flange thickness drawings.',
      status: 'Waiting Client Approval',
      progress: 10,
      notes: 'Custom RTJ (Ring Type Joint) Flanges for High-Sour Gas Service.'
    }
  ],
  tasks: [
    {
      id: 'tsk-1',
      title: 'Upload Mill Test Report (MTC 3.1) for L&T Order PRJ-2026-089',
      description: 'Ensure heat batch #HT-9921 chemical composition and ultrasonic flaw test reports are attached to client portal.',
      priority: 'High',
      status: 'In Progress',
      assignedTo: 'usr-3',
      projectId: 'prj-101',
      dueDate: '2026-09-20',
      repeatSchedule: 'None',
      attachmentsCount: 2
    },
    {
      id: 'tsk-2',
      title: 'Inspect Final Packaging of 24" Class 1500 Flanges for RIL',
      description: 'Check rust-preventive vci coating, plastic end protectors, and heavy wooden box strapping before truck loading.',
      priority: 'Urgent',
      status: 'To Do',
      assignedTo: 'usr-5',
      projectId: 'prj-102',
      dueDate: '2026-09-19',
      repeatSchedule: 'None',
      attachmentsCount: 1
    },
    {
      id: 'tsk-3',
      title: 'Follow-up with JSW Forgings for Alloy F22 Billets Dispatch',
      description: 'Call Harish Mehta to confirm dispatch of 15 Tons forged bars from Bellary plant for BHEL project.',
      priority: 'High',
      status: 'Waiting on Vendor',
      assignedTo: 'usr-4',
      projectId: 'prj-103',
      dueDate: '2026-09-21',
      repeatSchedule: 'Daily',
      attachmentsCount: 0
    },
    {
      id: 'tsk-4',
      title: 'Submit Drawing Revision R2 to ONGC Technical Committee',
      description: 'Revise raised face gasket seat dimensions as per ONGC comments on PRJ-2026-099.',
      priority: 'Medium',
      status: 'Waiting on Client',
      assignedTo: 'usr-2',
      projectId: 'prj-105',
      dueDate: '2026-09-22',
      repeatSchedule: 'None',
      attachmentsCount: 3
    }
  ],
  files: [
    {
      id: 'fl-1',
      name: 'ASME_B16.5_Flange_Dimensions_Catalog_2026.pdf',
      category: 'Drawing & Specs',
      sizeBytes: 4850000,
      sizeFormatted: '4.6 MB',
      uploadedBy: 'Rajesh Sharma',
      uploadedAt: '2026-09-01 10:30',
      projectId: 'prj-101',
      access: 'All Users',
      fileType: 'application/pdf'
    },
    {
      id: 'fl-2',
      name: 'L&T_Hydrotest_Inspection_Certificate_BV.pdf',
      category: 'Inspection Report',
      sizeBytes: 1820000,
      sizeFormatted: '1.7 MB',
      uploadedBy: 'Priya Sundaram',
      uploadedAt: '2026-09-18 16:45',
      projectId: 'prj-101',
      access: 'Managers & QA',
      fileType: 'application/pdf'
    }
  ],
  activities: [
    {
      id: 'act-1',
      user: 'Rajesh Sharma (Admin)',
      action: 'User Login',
      details: 'Logged into system via email admin@diamondflanges.com',
      timestamp: '2026-09-19 14:20:12',
      icon: 'key'
    }
  ],
  calendarEvents: [
    {
      id: 'evt-1',
      title: 'Bureau Veritas Third-Party Inspection (L&T Order)',
      date: '2026-09-25',
      time: '10:30 AM',
      type: 'Audit',
      color: '#2563eb'
    },
    {
      id: 'evt-2',
      title: 'RIL Jamnagar Order Dispatch Deadline',
      date: '2026-09-19',
      time: '04:00 PM',
      type: 'Dispatch',
      color: '#dc2626'
    }
  ]
};

class StorageManager {
  constructor() {
    this.data = this.loadState();
  }

  loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to parse LocalStorage data:', e);
    }
    this.saveState(INITIAL_DEMO_DATA);
    return JSON.parse(JSON.stringify(INITIAL_DEMO_DATA));
  }

  saveState(customData = null) {
    if (customData) this.data = customData;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  resetToDemo() {
    this.saveState(INITIAL_DEMO_DATA);
    window.location.reload();
  }

  // Authentication by Email or Username
  login(emailOrUsername, password) {
    const input = emailOrUsername.trim().toLowerCase();
    const user = this.data.users.find(
      u => (u.email.toLowerCase() === input || u.username.toLowerCase() === input) && u.password === password
    );

    if (user) {
      if (user.status !== 'Active') {
        return { success: false, message: 'Account is deactivated. Contact Administrator.' };
      }
      this.data.session = {
        userId: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        designation: user.designation,
        avatar: user.avatar,
        loginTime: new Date().toLocaleString()
      };
      
      this.logActivity(user.name, 'User Login', `Logged in via email ${user.email}`);
      this.saveState();
      return { success: true, user: this.data.session };
    }

    return { success: false, message: 'Invalid email address or password.' };
  }

  logout() {
    if (this.data.session) {
      this.logActivity(this.data.session.name, 'User Logout', 'Logged out of Diamond ERP');
    }
    this.data.session = null;
    this.saveState();
  }

  getCurrentUser() {
    return this.data.session;
  }

  logActivity(user, action, details, icon = 'activity') {
    const newAct = {
      id: 'act-' + Date.now(),
      user: user,
      action: action,
      details: details,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      icon: icon
    };
    this.data.activities.unshift(newAct);
    if (this.data.activities.length > 200) {
      this.data.activities.pop();
    }
  }
}

// Global Storage Singleton instance
window.storage = new StorageManager();
