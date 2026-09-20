/**
 * DIAMOND FLANGES & FITTINGS PVT LTD - COMMON MPA CONTROLLER (V3 - STEEPERS & MODALS)
 */

document.addEventListener('DOMContentLoaded', async () => {
  const currentUser = window.storage ? window.storage.getCurrentUser() : null;
  const isLoginPage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/');

  if (!currentUser && !isLoginPage) {
    window.location.href = '../index.html';
    return;
  }

  if (currentUser && isLoginPage) {
    window.location.href = 'pages/dashboard.html';
    return;
  }

  if (!isLoginPage) {
    await loadSharedComponents();
    initLayoutUI(currentUser);
  }

  applySavedTheme();
});

async function loadSharedComponents() {
  const loads = [
    { id: 'sidebar-container', path: '../components/sidebar.html' },
    { id: 'header-container', path: '../components/header.html' },
    { id: 'footer-container', path: '../components/footer.html' },
    { id: 'modals-container', path: '../components/modals.html' }
  ];

  for (const item of loads) {
    const el = document.getElementById(item.id);
    if (el) {
      try {
        const resp = await fetch(item.path);
        if (resp.ok) {
          el.innerHTML = await resp.text();
        }
      } catch (err) {
        console.error(`Failed to load component ${item.path}:`, err);
      }
    }
  }
}

function initLayoutUI(user) {
  if (user) {
    const sidebarAvatar = document.getElementById('sidebar-user-avatar');
    const sidebarName = document.getElementById('sidebar-user-name');
    const sidebarRole = document.getElementById('sidebar-user-role');
    const headerAvatar = document.getElementById('header-user-avatar');
    const headerName = document.getElementById('header-user-name');

    if (sidebarAvatar) sidebarAvatar.src = user.avatar;
    if (sidebarName) sidebarName.textContent = user.name;
    if (sidebarRole) sidebarRole.textContent = `${user.role} (${user.department})`;
    if (headerAvatar) headerAvatar.src = user.avatar;
    if (headerName) headerName.textContent = `${user.name.split(' ')[0]} [${user.role}]`;
  }

  const dateTextEl = document.getElementById('header-date-text');
  if (dateTextEl) {
    const today = new Date();
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    dateTextEl.textContent = today.toLocaleDateString('en-GB', options);
  }

  const path = window.location.pathname;
  let pageName = path.substring(path.lastIndexOf('/') + 1).replace('.html', '');
  if (pageName === 'project-details') pageName = 'projects';
  if (pageName === 'task-details') pageName = 'tasks';
  if (pageName === 'company-details') pageName = 'companies';

  document.querySelectorAll('.nav-item').forEach(link => {
    if (link.dataset.page === pageName) link.classList.add('active');
    else link.classList.remove('active');
  });

  renderBreadcrumbs();

  const toggleBtn = document.getElementById('sidebar-toggle-btn');
  const sidebar = document.getElementById('app-sidebar');
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => sidebar.classList.toggle('collapsed'));
  }

  const logoutBtn = document.getElementById('sidebar-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.storage.logout();
      window.location.href = '../index.html';
    });
  }

  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const current = window.storage.data.settings.theme || 'light';
      const next = current === 'light' ? 'dark' : 'light';
      window.storage.data.settings.theme = next;
      window.storage.saveState();
      applySavedTheme();
      showToast(`Switched to ${next} theme`, 'info');
    });
  }

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      openGlobalSearchModal();
    }
  });

  const searchTrigger = document.getElementById('global-search-trigger');
  if (searchTrigger) searchTrigger.addEventListener('click', openGlobalSearchModal);
}

function renderBreadcrumbs() {
  const container = document.getElementById('breadcrumb-nav');
  if (!container) return;

  const path = window.location.pathname;
  const fileName = path.substring(path.lastIndexOf('/') + 1);

  const crumbMap = {
    'dashboard.html': [{ label: 'Dashboard', url: 'dashboard.html' }],
    'projects.html': [{ label: 'Dashboard', url: 'dashboard.html' }, { label: 'Work Orders', url: 'projects.html' }],
    'project-details.html': [{ label: 'Dashboard', url: 'dashboard.html' }, { label: 'Work Orders', url: 'projects.html' }, { label: 'Order Details', url: '#' }],
    'tasks.html': [{ label: 'Dashboard', url: 'dashboard.html' }, { label: 'Tasks', url: 'tasks.html' }],
    'companies.html': [{ label: 'Dashboard', url: 'dashboard.html' }, { label: 'Companies CRM', url: 'companies.html' }],
    'users.html': [{ label: 'Dashboard', url: 'dashboard.html' }, { label: 'Users & Roles', url: 'users.html' }]
  };

  const crumbs = crumbMap[fileName] || [{ label: 'Dashboard', url: 'dashboard.html' }];
  container.innerHTML = crumbs.map((c, i) => {
    const isLast = i === crumbs.length - 1;
    return isLast
      ? `<span class="breadcrumb-item active">${c.label}</span>`
      : `<a href="${c.url}" class="breadcrumb-item">${c.label}</a><span class="breadcrumb-separator">/</span>`;
  }).join('');
}

function applySavedTheme() {
  const theme = window.storage ? (window.storage.data.settings.theme || 'light') : 'light';
  document.documentElement.setAttribute('data-theme', theme);
  const icon = document.getElementById('theme-icon');
  if (icon) icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const iconMap = { success: 'fas fa-check-circle', warning: 'fas fa-exclamation-triangle', error: 'fas fa-times-circle', info: 'fas fa-info-circle' };
  toast.innerHTML = `<i class="${iconMap[type] || iconMap.info}"></i><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}

// ORDER OVERVIEW & REAL-TIME TIMELINE STEPPER MODAL
function openOrderOverview(orderId) {
  const order = window.storage.getOrderById(orderId);
  if (!order) return;

  const currentUser = window.storage.getCurrentUser();
  const role = currentUser ? currentUser.role : 'Guest';

  // Elements
  const numEl = document.getElementById('overview-order-number');
  const statusEl = document.getElementById('overview-order-status-badge');
  const clientNameEl = document.getElementById('overview-client-name');
  const clientCodeEl = document.getElementById('overview-client-code');
  const poEl = document.getElementById('overview-po-number');
  const delEl = document.getElementById('overview-delivery-date');
  const itemsEl = document.getElementById('overview-items-list');
  const remarksEl = document.getElementById('overview-remarks');
  const stepperEl = document.getElementById('overview-stepper-timeline');

  if (numEl) numEl.textContent = order.projectNumber;
  if (statusEl) {
    statusEl.textContent = order.status;
    statusEl.className = `badge ${order.status === 'Completed' ? 'badge-completed' : 'badge-inprocess'}`;
  }
  if (clientNameEl) clientNameEl.textContent = order.clientName; // Note: Masked automatically by storage.getOrderById!
  if (clientCodeEl) clientCodeEl.textContent = order.clientCode;
  if (poEl) poEl.textContent = order.poNumber;
  if (delEl) delEl.textContent = order.deliveryDate;
  if (itemsEl) itemsEl.textContent = order.itemsList || 'Forged Flanges & Fittings Specification';
  if (remarksEl) remarksEl.textContent = order.remarks || 'Standard production parameters sustained.';

  // Render Dynamic Timeline Stepper
  if (stepperEl) {
    const reqStages = order.requiredStages || ['Purchase', 'Production', 'Quality Testing', 'Dispatch'];
    const stageStatuses = order.stageStatuses || {};

    const stageIcons = {
      Purchase: 'fas fa-cart-shopping',
      Production: 'fas fa-gears',
      'Quality Testing': 'fas fa-vial-circle-check',
      Dispatch: 'fas fa-truck-fast'
    };

    stepperEl.innerHTML = reqStages.map((st, idx) => {
      const stInfo = stageStatuses[st] || { status: 'Pending', timestamp: '—', updatedBy: '—' };
      const isDone = stInfo.status === 'Done';
      const isInProgress = stInfo.status === 'In-Progress';

      const badgeClass = isDone ? 'badge-completed' : (isInProgress ? 'badge-inprocess' : 'badge-pending');

      return `
        <div class="stepper-step ${isDone ? 'completed' : (isInProgress ? 'active' : '')}">
          <div class="stepper-icon-circle" style="background:${isDone ? '#16a34a' : (isInProgress ? '#2563eb' : 'var(--border-color)')}; color:#ffffff;">
            <i class="${stageIcons[st] || 'fas fa-check'}"></i>
          </div>
          <div class="stepper-details">
            <div class="flex-space-between">
              <strong style="font-size:13px;">${idx + 1}. ${st} Stage</strong>
              <span class="badge ${badgeClass}">${stInfo.status}</span>
            </div>
            <div style="font-size:11px; color:var(--text-muted); margin-top:3px;">
              <div>🕒 Timestamp: <strong>${stInfo.timestamp}</strong></div>
              <div>👤 Action By: ${stInfo.updatedBy}</div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  openModal('order-overview-modal');
}

// SALES ORDER INITIATION HANDLER
function openInitiateOrderModal() {
  const selectEl = document.getElementById('init-client-select');
  if (selectEl) {
    selectEl.innerHTML = window.storage.data.companies.map(c => `
      <option value="${c.id}" data-code="${c.code}" data-name="${c.name}">${c.name} (${c.code})</option>
    `).join('');
  }
  updateClientCodePreview();
  openModal('initiate-order-modal');
}

function updateClientCodePreview() {
  const selectEl = document.getElementById('init-client-select');
  const codeEl = document.getElementById('init-client-code');
  if (selectEl && codeEl) {
    const selectedOpt = selectEl.options[selectEl.selectedIndex];
    if (selectedOpt) {
      codeEl.value = selectedOpt.dataset.code;
    }
  }
}

function handleInitiateOrderSubmit(e) {
  e.preventDefault();
  const currentUser = window.storage.getCurrentUser();

  const selectEl = document.getElementById('init-client-select');
  const selectedOpt = selectEl.options[selectEl.selectedIndex];

  // Pipeline Customizer Checkboxes
  const reqStages = [];
  if (document.getElementById('stage-cb-purchase')?.checked) reqStages.push('Purchase');
  if (document.getElementById('stage-cb-production')?.checked) reqStages.push('Production');
  if (document.getElementById('stage-cb-qc')?.checked) reqStages.push('Quality Testing');
  if (document.getElementById('stage-cb-dispatch')?.checked) reqStages.push('Dispatch');

  if (reqStages.length === 0) {
    showToast('Please select at least one required stage in the Pipeline Customizer.', 'warning');
    return;
  }

  const newOrder = {
    id: 'prj-' + Date.now(),
    projectNumber: document.getElementById('init-order-number').value,
    clientCode: selectedOpt.dataset.code,
    clientName: selectedOpt.dataset.name,
    poNumber: document.getElementById('init-po-number').value,
    poDate: document.getElementById('init-po-date').value,
    deliveryDate: document.getElementById('init-delivery-date').value,
    value: parseFloat(document.getElementById('init-value').value) || 0,
    itemsList: document.getElementById('init-items-list').value,
    quotationStatus: document.getElementById('init-quotation-status').value,
    drawingApprovalStatus: 'Approved',
    salesWorkflow: {
      reqReceived: document.getElementById('init-cb-req')?.checked ?? true,
      quotPrepared: document.getElementById('init-cb-quot')?.checked ?? true,
      quotApproved: document.getElementById('init-cb-quot-app')?.checked ?? true,
      drawingSubmitted: document.getElementById('init-cb-drw')?.checked ?? true,
      drawingApproved: document.getElementById('init-cb-drw-app')?.checked ?? true,
      orderConfirmed: document.getElementById('init-cb-ord-conf')?.checked ?? true
    },
    requiredStages: reqStages,
    stageStatuses: {},
    status: 'In Process',
    progress: 0,
    remarks: 'Order initiated by Sales Department.'
  };

  // Initialize Stage Statuses
  reqStages.forEach((st, idx) => {
    newOrder.stageStatuses[st] = {
      status: idx === 0 ? 'In-Progress' : 'Pending',
      timestamp: idx === 0 ? new Date().toISOString().replace('T', ' ').substring(0, 16) : '—',
      updatedBy: idx === 0 ? `${currentUser?.name || 'Sales'} (Initiated)` : '—'
    };
  });

  window.storage.data.projects.unshift(newOrder);
  window.storage.logActivity(currentUser?.name || 'Sales', 'Order Initiated', `Created Work Order ${newOrder.projectNumber} with ${reqStages.length} custom stages`);
  window.storage.saveState();

  closeModal('initiate-order-modal');
  showToast('New Customer Work Order Initiated Successfully!', 'success');
  if (typeof initDashboardView === 'function') initDashboardView();
  if (typeof initProjectsView === 'function') initProjectsView();
}

// SUPER ADMIN USER CREATION HANDLER
function openCreateUserModal() {
  const currentUser = window.storage.getCurrentUser();
  if (!currentUser || currentUser.role !== 'Super Admin') {
    showToast('Permission Denied: Only Super Admin can create new user accounts.', 'error');
    return;
  }
  openModal('create-user-modal');
}

function handleCreateUserSubmit(e) {
  e.preventDefault();
  const userData = {
    name: document.getElementById('user-new-name').value,
    email: document.getElementById('user-new-email').value,
    username: document.getElementById('user-new-username').value,
    password: document.getElementById('user-new-password').value,
    role: document.getElementById('user-new-role').value,
    department: document.getElementById('user-new-dept').value,
    designation: document.getElementById('user-new-designation').value
  };

  const res = window.storage.createUser(userData);
  if (res.success) {
    closeModal('create-user-modal');
    showToast(`Created new ${res.user.role} user: ${res.user.name}!`, 'success');
    if (typeof initDashboardView === 'function') initDashboardView();
    if (typeof initUsersView === 'function') initUsersView();
  } else {
    showToast(res.message, 'error');
  }
}

// Global Search Results Renderer
function openGlobalSearchModal() {
  openModal('global-search-modal');
  const input = document.getElementById('global-search-input');
  if (input) {
    input.value = '';
    input.focus();
    renderGlobalSearchResults('');
  }
}

function renderGlobalSearchResults(query) {
  const list = document.getElementById('global-search-results');
  if (!list) return;

  if (!query.trim()) {
    list.innerHTML = `<div style="padding:20px; text-align:center; color:var(--text-muted)">Type to search across Projects, Tasks, Companies...</div>`;
    return;
  }

  const q = query.toLowerCase();
  let results = [];

  window.storage.getOrdersForCurrentUser().forEach(p => {
    if (p.projectNumber.toLowerCase().includes(q) || p.clientName.toLowerCase().includes(q) || p.poNumber.toLowerCase().includes(q)) {
      results.push({
        title: `${p.projectNumber} - ${p.clientName}`,
        sub: `PO: ${p.poNumber} | Status: ${p.status}`,
        action: () => { closeModal('global-search-modal'); openOrderOverview(p.id); }
      });
    }
  });

  window.storage.data.tasks.forEach(t => {
    if (t.title.toLowerCase().includes(q)) {
      results.push({
        title: t.title,
        sub: `Priority: ${t.priority} | Status: ${t.status}`,
        action: () => { closeModal('global-search-modal'); window.location.href = `task-details.html?id=${t.id}`; }
      });
    }
  });

  if (results.length === 0) {
    list.innerHTML = `<div style="padding:20px; text-align:center; color:var(--text-muted)">No matching records found for "${query}".</div>`;
    return;
  }

  list.innerHTML = results.map((r, idx) => `
    <div class="search-result-item" onclick="execSearchResult(${idx})">
      <div class="kpi-icon blue" style="width:32px;height:32px;font-size:14px;"><i class="fas fa-search"></i></div>
      <div>
        <div style="font-weight:600;font-size:13.5px;">${r.title}</div>
        <div style="font-size:12px;color:var(--text-muted);">${r.sub}</div>
      </div>
    </div>
  `).join('');

  window._searchResults = results;
}

function execSearchResult(idx) {
  if (window._searchResults && window._searchResults[idx]) {
    window._searchResults[idx].action();
  }
}

// HEADER COMPACT CALENDAR DROPDOWN POPOVER
function toggleHeaderCalendar(e) {
  if (e) e.stopPropagation();
  const popover = document.getElementById('header-calendar-popover');
  if (!popover) return;

  const isActive = popover.classList.contains('active');
  if (isActive) {
    popover.classList.remove('active');
  } else {
    renderHeaderCalendarPopover(popover);
    popover.classList.add('active');
  }
}

document.addEventListener('click', (e) => {
  const popover = document.getElementById('header-calendar-popover');
  const dateBtn = document.getElementById('header-date-btn');
  if (popover && popover.classList.contains('active')) {
    if (!popover.contains(e.target) && !dateBtn?.contains(e.target)) {
      popover.classList.remove('active');
    }
  }
});

function renderHeaderCalendarPopover(container) {
  const now = new Date();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentMonth = monthNames[now.getMonth()];
  const currentYear = now.getFullYear();
  const todayDate = now.getDate();

  const firstDay = new Date(currentYear, now.getMonth(), 1).getDay();
  const daysInMonth = new Date(currentYear, now.getMonth() + 1, 0).getDate();

  let daysHtml = '';
  for (let i = 0; i < firstDay; i++) {
    daysHtml += `<div class="mini-cal-day" style="opacity:0.2;"></div>`;
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === todayDate;
    const hasEvent = (d === 15 || d === 20 || d === 25);
    daysHtml += `<div class="mini-cal-day ${isToday ? 'today' : ''} ${hasEvent ? 'has-event' : ''}">${d}</div>`;
  }

  container.innerHTML = `
    <div class="mini-cal-header">
      <span><i class="fas fa-calendar-day" style="color:var(--primary);"></i> ${currentMonth} ${currentYear}</span>
      <button class="btn btn-secondary btn-sm" onclick="toggleHeaderCalendar()">&times;</button>
    </div>
    <div class="mini-cal-days">
      <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
    </div>
    <div class="mini-cal-grid">
      ${daysHtml}
    </div>
    <div style="margin-top:12px; padding-top:10px; border-top:1px solid var(--border-color); font-size:11px; color:var(--text-muted); display:flex; justify-content:space-between; align-items:center;">
      <span><span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:var(--accent); margin-right:4px;"></span> Plant Schedules</span>
      <span style="font-weight:600; color:var(--primary); cursor:pointer;" onclick="showToast('Plant operations scheduled today: 4 Dispatch Batches', 'info')">4 Milestones</span>
    </div>
  `;
}

window.toggleHeaderCalendar = toggleHeaderCalendar;
window.renderHeaderCalendarPopover = renderHeaderCalendarPopover;
