/**
 * DIAMOND FLANGES & FITTINGS PVT LTD - CORE APP CONTROLLER & STATE STORE
 */

const STORAGE_KEY = 'DIAMOND_ERP_DATA_V1';

class AppStore {
  constructor() {
    this.data = this.loadState();
    this.currentView = 'dashboard';
    this.searchQuery = '';
  }

  // Load from LocalStorage or seed demo data
  loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to parse LocalStorage data:', e);
    }
    // Fallback seed
    const initial = getInitialDemoData();
    this.saveState(initial);
    return initial;
  }

  saveState(customData = null) {
    if (customData) this.data = customData;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  resetToDemo() {
    const demo = getInitialDemoData();
    this.saveState(demo);
    window.location.reload();
  }

  // Auth Operations
  login(username, password, selectedRole = null) {
    const user = this.data.users.find(
      u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );

    if (user) {
      if (user.status !== 'Active') {
        return { success: false, message: 'Account is deactivated. Contact Admin.' };
      }
      this.data.session = {
        userId: user.id,
        username: user.username,
        name: user.name,
        role: selectedRole || user.role,
        department: user.department,
        designation: user.designation,
        avatar: user.avatar,
        loginTime: new Date().toLocaleString()
      };
      
      // Log Activity
      this.logActivity(user.name + ' (' + (selectedRole || user.role) + ')', 'User Login', 'Logged in to Diamond ERP system');
      this.saveState();
      return { success: true, user: this.data.session };
    }

    return { success: false, message: 'Invalid username or password.' };
  }

  logout() {
    if (this.data.session) {
      this.logActivity(this.data.session.name, 'User Logout', 'Logged out of Diamond ERP');
    }
    this.data.session = null;
    this.saveState();
    window.location.reload();
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

// Instantiate Global Store
const store = new AppStore();

// UI Navigation Router & Page Controller
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  applyTheme(store.data.settings.theme || 'light');
  checkAuth();
  setupEventListeners();
  updateUIUserInfo();
}

function checkAuth() {
  const session = store.getCurrentUser();
  const authScreen = document.getElementById('auth-screen');
  const appContainer = document.getElementById('app-container');

  if (!session) {
    authScreen.style.display = 'flex';
    appContainer.style.display = 'none';
  } else {
    authScreen.style.display = 'none';
    appContainer.style.display = 'flex';
    navigateTo('dashboard');
  }
}

function navigateTo(viewId) {
  store.currentView = viewId;

  // Update Nav Items active class
  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.dataset.view === viewId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Hide all sections, show targeted section
  document.querySelectorAll('.view-section').forEach(sec => {
    sec.classList.remove('active');
  });

  const targetSec = document.getElementById(`view-${viewId}`);
  if (targetSec) {
    targetSec.classList.add('active');
  }

  // Update Header Title
  const headerTitle = document.getElementById('header-page-title');
  if (headerTitle) {
    const titleMap = {
      dashboard: 'Executive Dashboard',
      companies: 'Company CRM & Client Directory',
      contacts: 'Contact Registry',
      projects: 'Project & Work Order Management',
      tasks: 'Task & Kanban Board',
      vendors: 'Vendor & Supply Chain Directory',
      calendar: 'Corporate Calendar & Schedules',
      reports: 'Reports & Business Analytics',
      users: 'User Directory & Organization Chart',
      files: 'File & Engineering Drawings Management',
      activity: 'Audit Trail & Activity Log',
      settings: 'ERP System Settings & Data Backup'
    };
    headerTitle.textContent = titleMap[viewId] || 'Diamond ERP';
  }

  // Trigger View Specific Renderers
  renderViewModule(viewId);
}

function renderViewModule(viewId) {
  switch (viewId) {
    case 'dashboard':
      if (typeof renderDashboard === 'function') renderDashboard();
      break;
    case 'companies':
      if (typeof renderCompanies === 'function') renderCompanies();
      break;
    case 'contacts':
      if (typeof renderContacts === 'function') renderContacts();
      break;
    case 'projects':
      if (typeof renderProjects === 'function') renderProjects();
      break;
    case 'tasks':
      if (typeof renderTasks === 'function') renderTasks();
      break;
    case 'vendors':
      if (typeof renderVendors === 'function') renderVendors();
      break;
    case 'calendar':
      if (typeof renderCalendar === 'function') renderCalendar();
      break;
    case 'reports':
      if (typeof renderReports === 'function') renderReports();
      break;
    case 'users':
      if (typeof renderUsers === 'function') renderUsers();
      break;
    case 'files':
      if (typeof renderFiles === 'function') renderFiles();
      break;
    case 'activity':
      if (typeof renderActivity === 'function') renderActivity();
      break;
    case 'settings':
      if (typeof renderSettings === 'function') renderSettings();
      break;
  }
}

// Global Event Listeners Setup
function setupEventListeners() {
  // Sidebar Navigation Click
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const view = item.dataset.view;
      if (view === 'logout') {
        store.logout();
      } else {
        navigateTo(view);
      }
    });
  });

  // Sidebar Collapse Toggle
  const toggleBtn = document.getElementById('sidebar-toggle-btn');
  const sidebar = document.getElementById('app-sidebar');
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
    });
  }

  // Theme Toggle Button
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const current = store.data.settings.theme || 'light';
      const next = current === 'light' ? 'dark' : 'light';
      store.data.settings.theme = next;
      store.saveState();
      applyTheme(next);
      showToast(`Switched to ${next} theme`, 'info');
    });
  }

  // Login Form Submission
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const u = document.getElementById('login-username').value;
      const p = document.getElementById('login-password').value;
      const r = document.querySelector('.role-chip.active')?.dataset.role || null;

      const res = store.login(u, p, r);
      if (res.success) {
        showToast('Login successful! Welcome back.', 'success');
        checkAuth();
        updateUIUserInfo();
      } else {
        showToast(res.message, 'error');
      }
    });
  }

  // Global Search Modal Keyboard Shortcut (Ctrl+K or Cmd+K)
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      openGlobalSearchModal();
    }
  });

  const searchTrigger = document.getElementById('global-search-trigger');
  if (searchTrigger) {
    searchTrigger.addEventListener('click', openGlobalSearchModal);
  }
}

// Apply Theme
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }
}

// Update User Info in Top Header & Sidebar
function updateUIUserInfo() {
  const user = store.getCurrentUser();
  if (!user) return;

  const headerAvatar = document.getElementById('header-user-avatar');
  const headerName = document.getElementById('header-user-name');
  const sidebarAvatar = document.getElementById('sidebar-user-avatar');
  const sidebarName = document.getElementById('sidebar-user-name');
  const sidebarRole = document.getElementById('sidebar-user-role');

  if (headerAvatar) headerAvatar.src = user.avatar;
  if (headerName) headerName.textContent = user.name.split(' ')[0];
  if (sidebarAvatar) sidebarAvatar.src = user.avatar;
  if (sidebarName) sidebarName.textContent = user.name;
  if (sidebarRole) sidebarRole.textContent = user.role;
}

// Toast Notification System
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const iconMap = {
    success: 'fas fa-check-circle',
    warning: 'fas fa-exclamation-triangle',
    error: 'fas fa-times-circle',
    info: 'fas fa-info-circle'
  };

  toast.innerHTML = `
    <i class="${iconMap[type] || iconMap.info}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

// Modal Helpers
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}

// Global Search System
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
    list.innerHTML = `<div style="padding:20px; text-align:center; color:var(--text-muted)">Type to search across Projects, Tasks, Clients, and Files...</div>`;
    return;
  }

  const q = query.toLowerCase();
  let results = [];

  // Search Projects
  store.data.projects.forEach(p => {
    if (p.projectNumber.toLowerCase().includes(q) || p.clientName.toLowerCase().includes(q) || p.notes.toLowerCase().includes(q)) {
      results.push({
        type: 'Project',
        icon: 'fas fa-folder-open',
        title: `${p.projectNumber} - ${p.clientName}`,
        sub: `Value: ₹${(p.value).toLocaleString()} | Status: ${p.status}`,
        action: () => { closeModal('global-search-modal'); navigateTo('projects'); }
      });
    }
  });

  // Search Tasks
  store.data.tasks.forEach(t => {
    if (t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)) {
      results.push({
        type: 'Task',
        icon: 'fas fa-tasks',
        title: t.title,
        sub: `Priority: ${t.priority} | Status: ${t.status}`,
        action: () => { closeModal('global-search-modal'); navigateTo('tasks'); }
      });
    }
  });

  // Search Companies
  store.data.companies.forEach(c => {
    if (c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.industry.toLowerCase().includes(q)) {
      results.push({
        type: 'Company CRM',
        icon: 'fas fa-building',
        title: c.name,
        sub: `${c.code} | Industry: ${c.industry}`,
        action: () => { closeModal('global-search-modal'); navigateTo('companies'); }
      });
    }
  });

  if (results.length === 0) {
    list.innerHTML = `<div style="padding:20px; text-align:center; color:var(--text-muted)">No matching records found for "${query}".</div>`;
    return;
  }

  list.innerHTML = results.map((r, idx) => `
    <div class="search-result-item" onclick="execSearchResult(${idx})">
      <div class="kpi-icon blue" style="width:36px;height:36px;font-size:16px"><i class="${r.icon}"></i></div>
      <div>
        <div style="font-weight:600;font-size:14px">${r.title}</div>
        <div style="font-size:12px;color:var(--text-muted)">${r.sub}</div>
      </div>
      <span class="badge badge-inprocess" style="margin-left:auto">${r.type}</span>
    </div>
  `).join('');

  window._currentSearchResults = results;
}

function execSearchResult(idx) {
  if (window._currentSearchResults && window._currentSearchResults[idx]) {
    window._currentSearchResults[idx].action();
  }
}
