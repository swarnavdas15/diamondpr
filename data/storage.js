/**
 * DIAMOND FLANGES & FITTINGS PVT LTD - CENTRALIZED LOCALSTORAGE API (V3 - RBAC & MASKING)
 */

const STORAGE_KEY = 'DIAMOND_ERP_DATA_V3';

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
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'usr-2',
      username: 'supervisor',
      email: 'supervisor@diamondflanges.com',
      password: 'mgr123',
      name: 'Vikram Malhotra',
      mobile: '+91 98331 44556',
      role: 'Admin',
      department: 'Plant Operations Management',
      designation: 'General Operations Supervisor',
      managerId: 'usr-1',
      status: 'Active',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'usr-3',
      username: 'sales',
      email: 'sales@diamondflanges.com',
      password: 'emp123',
      name: 'Amit Swaminathan',
      mobile: '+91 98990 22334',
      role: 'Sales',
      department: 'Commercial & Sales',
      designation: 'Sales & Commercial Manager',
      managerId: 'usr-1',
      status: 'Active',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'usr-4',
      username: 'purchase',
      email: 'purchase@diamondflanges.com',
      password: 'emp123',
      name: 'Harish Verma',
      mobile: '+91 98450 11990',
      role: 'Purchase',
      department: 'Procurement & Raw Material',
      designation: 'Purchase Manager',
      managerId: 'usr-2',
      status: 'Active',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'usr-5',
      username: 'production',
      email: 'production@diamondflanges.com',
      password: 'emp123',
      name: 'Karan Patel',
      mobile: '+91 98220 55443',
      role: 'Production',
      department: 'Machining & Forging Plant',
      designation: 'Shopfloor Production Head',
      managerId: 'usr-2',
      status: 'Active',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'usr-6',
      username: 'qc',
      email: 'qc@diamondflanges.com',
      password: 'emp123',
      name: 'Priya Sundaram',
      mobile: '+91 97112 66778',
      role: 'Quality Testing',
      department: 'QA / QC Metallurgical Lab',
      designation: 'Senior QA Testing Inspector',
      managerId: 'usr-2',
      status: 'Active',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'usr-7',
      username: 'dispatch',
      email: 'dispatch@diamondflanges.com',
      password: 'emp123',
      name: 'Suresh Kumar',
      mobile: '+91 94441 55667',
      role: 'Dispatch',
      department: 'Logistics & Dispatch Yard',
      designation: 'Dispatch & Logistics Officer',
      managerId: 'usr-3',
      status: 'Active',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
    }
  ],
  companies: [
    {
      id: 'comp-1',
      code: 'CLI-8821',
      name: 'Larsen & Toubro Heavy Engineering',
      industry: 'Oil & Gas EPC',
      gstin: '27AAACL1234F1Z9',
      pan: 'AAACL1234F',
      website: 'www.larsentoubro.com',
      rating: 'Tier 1 Key Account',
      addresses: [
        {
          id: 'addr-1',
          type: 'Powai Campus',
          address: 'Gate 7, Powai Campus, Saki Vihar Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          pin: '400072',
          gstin: '27AAACL1234F1Z9'
        }
      ],
      contacts: [
        {
          id: 'cnt-1',
          title: 'Mr.',
          firstName: 'Anand',
          lastName: 'Deshmukh',
          position: 'VP Procurement - Piping',
          mobile: '+91 98201 99887',
          whatsapp: '+91 98201 99887',
          officialEmail: 'anand.deshmukh@larsentoubro.com',
          photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80'
        }
      ]
    },
    {
      id: 'comp-2',
      code: 'CLI-5510',
      name: 'Reliance Industries Limited (Refinery Div)',
      industry: 'Petrochemicals & Refining',
      gstin: '24AABCR5678G1Z3',
      pan: 'AABCR5678G',
      website: 'www.ril.com',
      rating: 'Tier 1 Key Account',
      addresses: [
        {
          id: 'addr-2',
          type: 'Jamnagar Unit',
          address: 'Motikhavdi, Reliance Complex',
          city: 'Jamnagar',
          state: 'Gujarat',
          pin: '361142',
          gstin: '24AABCR5678G1Z3'
        }
      ],
      contacts: [
        {
          id: 'cnt-2',
          title: 'Mr.',
          firstName: 'Sunil',
          lastName: 'Venkatesh',
          position: 'Head of Maintenance',
          mobile: '+91 99798 33441',
          whatsapp: '+91 99798 33441',
          officialEmail: 'sunil.venkatesh@ril.com',
          photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80'
        }
      ]
    },
    {
      id: 'comp-3',
      code: 'CLI-3392',
      name: 'Bharat Heavy Electricals Ltd (BHEL)',
      industry: 'Power Generation & Defense',
      gstin: '07AAACB0987H1Z5',
      pan: 'AAACB0987H',
      website: 'www.bhel.com',
      rating: 'Government Undertaking',
      addresses: [
        {
          id: 'addr-3',
          type: 'Chennai PSSR',
          address: '690 Anna Salai, Nandanam',
          city: 'Chennai',
          state: 'Tamil Nadu',
          pin: '600035',
          gstin: '33AAACB0987H1Z1'
        }
      ],
      contacts: [
        {
          id: 'cnt-3',
          title: 'Mr.',
          firstName: 'Ramesh',
          lastName: 'Subramanian',
          position: 'GM Procurement',
          mobile: '+91 94440 88776',
          whatsapp: '+91 94440 88776',
          officialEmail: 'rsubramanian@bhel.in',
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
      materialSupplied: 'Solution Annealing & Hardness Testing',
      status: 'Active / Sub-contractor',
      rating: 4.6
    }
  ],
  projects: [
    {
      id: 'prj-101',
      projectNumber: 'PRJ-2026-089',
      clientCode: 'CLI-8821',
      clientName: 'Larsen & Toubro Heavy Engineering',
      poNumber: 'PO-LT-HE-99481',
      poDate: '2026-08-15',
      deliveryDate: '2026-09-30',
      value: 4850000,
      itemsList: '24" ANSI Class 1500 Weld Neck Flanges - SS 316L (Qty: 300 Pcs)',
      rawMaterialRequired: 'SS 316L Forged Billets & Heat Batch Certification',
      quotationStatus: 'Approved',
      drawingApprovalStatus: 'Approved',
      salesWorkflow: {
        reqReceived: true,
        quotPrepared: true,
        quotApproved: true,
        drawingSubmitted: true,
        drawingApproved: true,
        orderConfirmed: true
      },
      requiredStages: ['Purchase', 'Production', 'Quality Testing', 'Dispatch'],
      stageStatuses: {
        Purchase: { status: 'Done', timestamp: '2026-08-20 11:30', updatedBy: 'Harish Verma (Purchase)' },
        Production: { status: 'In-Progress', timestamp: '2026-08-25 14:15', updatedBy: 'Karan Patel (Production)' },
        'Quality Testing': { status: 'Pending', timestamp: '—', updatedBy: '—' },
        Dispatch: { status: 'Pending', timestamp: '—', updatedBy: '—' }
      },
      status: 'In Process',
      progress: 50,
      remarks: 'Hydrostatic test ready at 150 BAR.'
    },
    {
      id: 'prj-102',
      projectNumber: 'PRJ-2026-092',
      clientCode: 'CLI-5510',
      clientName: 'Reliance Industries Limited (Refinery Div)',
      poNumber: 'PO-RIL-REF-55102',
      poDate: '2026-09-01',
      deliveryDate: '2026-09-19',
      value: 3200000,
      itemsList: 'ASTM A105 Carbon Steel Blind & Slip-On Flanges (Qty: 180 Pcs)',
      rawMaterialRequired: 'A105 Carbon Steel Heavy Rings',
      quotationStatus: 'Approved',
      drawingApprovalStatus: 'Approved',
      salesWorkflow: {
        reqReceived: true,
        quotPrepared: true,
        quotApproved: true,
        drawingSubmitted: true,
        drawingApproved: true,
        orderConfirmed: true
      },
      requiredStages: ['Purchase', 'Production', 'Quality Testing', 'Dispatch'],
      stageStatuses: {
        Purchase: { status: 'Done', timestamp: '2026-09-03 10:00', updatedBy: 'Harish Verma (Purchase)' },
        Production: { status: 'Done', timestamp: '2026-09-10 16:30', updatedBy: 'Karan Patel (Production)' },
        'Quality Testing': { status: 'Done', timestamp: '2026-09-15 11:20', updatedBy: 'Priya Sundaram (QC)' },
        Dispatch: { status: 'In-Progress', timestamp: '2026-09-19 09:15', updatedBy: 'Suresh Kumar (Dispatch)' }
      },
      status: 'Part Dispatched',
      progress: 90,
      remarks: 'Ready for final truck loading at Jamnagar Refinery gate.'
    },
    {
      id: 'prj-103',
      projectNumber: 'PRJ-2026-095',
      clientCode: 'CLI-3392',
      clientName: 'Bharat Heavy Electricals Ltd (BHEL)',
      poNumber: 'PO-BHEL-PSSR-3392',
      poDate: '2026-09-10',
      deliveryDate: '2026-10-15',
      value: 7500000,
      itemsList: 'Alloy Steel F22 High Temp Flanges for Power Plant (Qty: 500 Pcs)',
      rawMaterialRequired: 'Alloy Steel F22 Billets from JSW Steel',
      quotationStatus: 'Approved',
      drawingApprovalStatus: 'Pending',
      salesWorkflow: {
        reqReceived: true,
        quotPrepared: true,
        quotApproved: true,
        drawingSubmitted: true,
        drawingApproved: false,
        orderConfirmed: false
      },
      requiredStages: ['Purchase', 'Production', 'Dispatch'],
      stageStatuses: {
        Purchase: { status: 'In-Progress', timestamp: '2026-09-12 14:00', updatedBy: 'Harish Verma (Purchase)' },
        Production: { status: 'Pending', timestamp: '—', updatedBy: '—' },
        Dispatch: { status: 'Pending', timestamp: '—', updatedBy: '—' }
      },
      status: 'Vendor Material Pending',
      progress: 20,
      remarks: 'Waiting on mill test certificate from JSW Steel.'
    }
  ],
  tasks: [
    {
      id: 'tsk-1',
      title: 'Upload Mill Test Report (MTC 3.1) for L&T Order PRJ-2026-089',
      description: 'Attach heat batch #HT-9921 chemical composition report.',
      priority: 'High',
      status: 'In Progress',
      fromDepartment: 'Quality Testing',
      assignedToDepartment: 'Sales',
      assignedTo: 'usr-3',
      projectId: 'prj-101',
      dueDate: '2026-09-20'
    },
    {
      id: 'tsk-2',
      title: 'Arrange Truck Loading for Jamnagar Refinery Shipment',
      description: 'Verify VCI rust coating before wooden box strapping.',
      priority: 'Urgent',
      status: 'To Do',
      fromDepartment: 'Sales',
      assignedToDepartment: 'Dispatch',
      assignedTo: 'usr-7',
      projectId: 'prj-102',
      dueDate: '2026-09-19'
    },
    {
      id: 'tsk-3',
      title: 'Follow-up with JSW Forgings for Alloy F22 Bars',
      description: 'Call supplier Harish Mehta to confirm delivery timeline.',
      priority: 'High',
      status: 'Waiting on Vendor',
      fromDepartment: 'Production',
      assignedToDepartment: 'Purchase',
      assignedTo: 'usr-4',
      projectId: 'prj-103',
      dueDate: '2026-09-21'
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
      projectId: 'prj-101'
    }
  ],
  activities: [
    {
      id: 'act-1',
      user: 'Rajesh Sharma (Super Admin)',
      action: 'System Initialized',
      details: 'Initialized RBAC & Data Masking Engine',
      timestamp: '2026-09-20 01:40:00',
      icon: 'key'
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
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse LocalStorage:', e);
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

  // Authentication Engine
  login(emailOrUsername, password) {
    const input = emailOrUsername.trim().toLowerCase();
    const user = this.data.users.find(
      u => (u.email.toLowerCase() === input || u.username.toLowerCase() === input) && u.password === password
    );

    if (user) {
      if (user.status !== 'Active') {
        return { success: false, message: 'Account is deactivated. Contact Super Admin.' };
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
      
      this.logActivity(user.name, 'User Login', `Logged in as ${user.role} (${user.email})`);
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

  // STRICT DATA MASKING HELPER
  // Non-sales department roles (Purchase, Production, Quality Testing, Dispatch) MUST NEVER SEE actual Client Name!
  maskOrder(order) {
    const currentUser = this.getCurrentUser();
    const role = currentUser ? currentUser.role : 'Guest';
    const isUnmaskedRole = role === 'Super Admin' || role === 'Admin' || role === 'Sales';

    const maskedCopy = JSON.parse(JSON.stringify(order));
    if (!isUnmaskedRole) {
      maskedCopy.clientName = `*** MASKED (${maskedCopy.clientCode}) ***`;
    }
    return maskedCopy;
  }

  getOrdersForCurrentUser() {
    return this.data.projects.map(p => this.maskOrder(p));
  }

  getOrderById(id) {
    const p = this.data.projects.find(item => item.id === id);
    return p ? this.maskOrder(p) : null;
  }

  // USER CREATION - SUPER ADMIN PRIVILEGE ONLY
  createUser(userData) {
    const currentUser = this.getCurrentUser();
    if (!currentUser || currentUser.role !== 'Super Admin') {
      return { success: false, message: 'Permission Denied: Only Super Admin can create new users.' };
    }

    const newUser = {
      id: 'usr-' + Date.now(),
      username: userData.username,
      email: userData.email,
      password: userData.password || 'emp123',
      name: userData.name,
      mobile: userData.mobile,
      role: userData.role,
      department: userData.department,
      designation: userData.designation,
      managerId: userData.managerId || 'usr-1',
      status: 'Active',
      avatar: userData.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
    };

    this.data.users.push(newUser);
    this.logActivity(currentUser.name, 'User Created', `Created new ${newUser.role} account: ${newUser.name} (${newUser.email})`);
    this.saveState();
    return { success: true, user: newUser };
  }

  // TASK DELETION - SUPER ADMIN & ADMIN PRIVILEGE ONLY
  deleteTask(taskId) {
    const currentUser = this.getCurrentUser();
    if (!currentUser || (currentUser.role !== 'Super Admin' && currentUser.role !== 'Admin')) {
      return { success: false, message: 'Permission Denied: Only Super Admin and Admin can delete tasks.' };
    }

    const tIndex = this.data.tasks.findIndex(t => t.id === taskId);
    if (tIndex >= 0) {
      const removed = this.data.tasks.splice(tIndex, 1)[0];
      this.logActivity(currentUser.name, 'Task Deleted', `Deleted task: "${removed.title}"`);
      this.saveState();
      return { success: true };
    }
    return { success: false, message: 'Task not found.' };
  }

  // DEPARTMENT STAGE WORKFLOW UPDATER
  updateOrderStage(orderId, stageName, newStatus, extraData = {}) {
    const order = this.data.projects.find(p => p.id === orderId);
    const currentUser = this.getCurrentUser();
    if (!order) return { success: false, message: 'Order not found' };

    if (!order.stageStatuses) order.stageStatuses = {};
    const timestampStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    order.stageStatuses[stageName] = {
      status: newStatus,
      timestamp: timestampStr,
      updatedBy: `${currentUser?.name || 'User'} (${currentUser?.role || 'Dept'})`,
      ...extraData
    };

    // Calculate Overall Order Progress
    const reqStages = order.requiredStages || ['Purchase', 'Production', 'Quality Testing', 'Dispatch'];
    const doneCount = reqStages.filter(st => order.stageStatuses[st] && order.stageStatuses[st].status === 'Done').length;
    order.progress = Math.round((doneCount / reqStages.length) * 100);

    if (doneCount === reqStages.length) {
      order.status = 'Ready for Final Sales Verification';
    } else {
      order.status = 'In Process';
    }

    this.logActivity(currentUser?.name || 'User', `${stageName} Stage Updated`, `Updated ${order.projectNumber} stage "${stageName}" to ${newStatus}`);
    this.saveState();
    return { success: true, order: order };
  }

  // SALES 6-STAGE APPROVAL WORKFLOW UPDATER
  updateSalesWorkflowStage(orderId, stageKey, value) {
    const currentUser = this.getCurrentUser();
    const isAuthorized = currentUser && (currentUser.role === 'Sales' || currentUser.role === 'Admin' || currentUser.role === 'Super Admin');

    if (stageKey === 'quotApproved' && !isAuthorized) {
      return { success: false, message: 'Access Denied: Only authorized Sales/Admin users can edit Quotation Approval status.' };
    }

    const order = this.data.projects.find(p => p.id === orderId);
    if (!order) return { success: false, message: 'Work order not found.' };

    if (!order.salesWorkflow) {
      order.salesWorkflow = {
        reqReceived: true,
        quotPrepared: true,
        quotApproved: false,
        drawingSubmitted: false,
        drawingApproved: false,
        orderConfirmed: false
      };
    }

    order.salesWorkflow[stageKey] = Boolean(value);

    // Synchronize Quotation and Drawing Status strings
    if (stageKey === 'quotApproved') {
      order.quotationStatus = value ? 'Approved' : 'Pending';
    }
    if (stageKey === 'drawingApproved') {
      order.drawingApprovalStatus = value ? 'Approved' : 'Pending';
    }

    this.logActivity(currentUser?.name || 'User', 'Sales Approval Updated', `Set "${stageKey}" to ${value ? 'YES' : 'NO'} for Order ${order.projectNumber}`);
    this.saveState();
    return { success: true, message: `Sales stage "${stageKey}" updated successfully.` };
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
    if (this.data.activities.length > 200) this.data.activities.pop();
  }
}

window.storage = new StorageManager();
