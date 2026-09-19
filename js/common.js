/**
 * DIAMOND FLANGES & FITTINGS PVT LTD - COMMON MPA LAYOUT CONTROLLER
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Check Authentication Session
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

  // Load Component Partials if not login page
  if (!isLoginPage) {
    await loadSharedComponents();
    initLayoutUI(currentUser);
  }

  applySavedTheme();
});

// Load Reusable Components dynamically
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

// Initialize Header, Sidebar, Active Links, & Breadcrumbs
function initLayoutUI(user) {
  // Update User info in Sidebar & Header
  if (user) {
    const sidebarAvatar = document.getElementById('sidebar-user-avatar');
    const sidebarName = document.getElementById('sidebar-user-name');
    const sidebarRole = document.getElementById('sidebar-user-role');
    const headerAvatar = document.getElementById('header-user-avatar');
    const headerName = document.getElementById('header-user-name');

    if (sidebarAvatar) sidebarAvatar.src = user.avatar;
    if (sidebarName) sidebarName.textContent = user.name;
    if (sidebarRole) sidebarRole.textContent = user.role;
    if (headerAvatar) headerAvatar.src = user.avatar;
    if (headerName) headerName.textContent = user.name.split(' ')[0];
  }

  // Active Link Highlighting
  const path = window.location.pathname;
  let pageName = path.substring(path.lastIndexOf('/') + 1).replace('.html', '');
  if (pageName === 'project-details') pageName = 'projects';
  if (pageName === 'task-details') pageName = 'tasks';
  if (pageName === 'company-details') pageName = 'companies';

  document.querySelectorAll('.nav-item').forEach(link => {
    if (link.dataset.page === pageName) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Generate Breadcrumbs
  renderBreadcrumbs();

  // Sidebar Collapse Toggle
  const toggleBtn = document.getElementById('sidebar-toggle-btn');
  const sidebar = document.getElementById('app-sidebar');
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
    });
  }

  // Logout Trigger
  const logoutBtn = document.getElementById('sidebar-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.storage.logout();
      window.location.href = '../index.html';
    });
  }

  // Theme Toggle Trigger
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

  // Global Search Keyboard Trigger (Ctrl+K)
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

// Breadcrumbs Renderer
function renderBreadcrumbs() {
  const container = document.getElementById('breadcrumb-nav');
  if (!container) return;

  const path = window.location.pathname;
  const fileName = path.substring(path.lastIndexOf('/') + 1);

  const crumbMap = {
    'dashboard.html': [{ label: 'Dashboard', url: 'dashboard.html' }],
    'projects.html': [{ label: 'Dashboard', url: 'dashboard.html' }, { label: 'Projects & POs', url: 'projects.html' }],
    'project-details.html': [{ label: 'Dashboard', url: 'dashboard.html' }, { label: 'Projects', url: 'projects.html' }, { label: 'Project Details', url: '#' }],
    'tasks.html': [{ label: 'Dashboard', url: 'dashboard.html' }, { label: 'Tasks', url: 'tasks.html' }],
    'task-details.html': [{ label: 'Dashboard', url: 'dashboard.html' }, { label: 'Tasks', url: 'tasks.html' }, { label: 'Task Details', url: '#' }],
    'companies.html': [{ label: 'Dashboard', url: 'dashboard.html' }, { label: 'Companies CRM', url: 'companies.html' }],
    'company-details.html': [{ label: 'Dashboard', url: 'dashboard.html' }, { label: 'Companies', url: 'companies.html' }, { label: 'Company Details', url: '#' }],
    'contacts.html': [{ label: 'Dashboard', url: 'dashboard.html' }, { label: 'Contacts Directory', url: 'contacts.html' }],
    'vendors.html': [{ label: 'Dashboard', url: 'dashboard.html' }, { label: 'Vendors Directory', url: 'vendors.html' }],
    'calendar.html': [{ label: 'Dashboard', url: 'dashboard.html' }, { label: 'Calendar', url: 'calendar.html' }],
    'reports.html': [{ label: 'Dashboard', url: 'dashboard.html' }, { label: 'Reports Analytics', url: 'reports.html' }],
    'users.html': [{ label: 'Dashboard', url: 'dashboard.html' }, { label: 'Users & Org Chart', url: 'users.html' }],
    'files.html': [{ label: 'Dashboard', url: 'dashboard.html' }, { label: 'Files & Drawings', url: 'files.html' }],
    'settings.html': [{ label: 'Dashboard', url: 'dashboard.html' }, { label: 'Settings', url: 'settings.html' }]
  };

  const crumbs = crumbMap[fileName] || [{ label: 'Dashboard', url: 'dashboard.html' }];

  container.innerHTML = crumbs.map((c, i) => {
    const isLast = i === crumbs.length - 1;
    return isLast
      ? `<span class="breadcrumb-item active">${c.label}</span>`
      : `<a href="${c.url}" class="breadcrumb-item">${c.label}</a><span class="breadcrumb-separator">/</span>`;
  }).join('');
}

// Theme Switcher Engine
function applySavedTheme() {
  const theme = window.storage ? (window.storage.data.settings.theme || 'light') : 'light';
  document.documentElement.setAttribute('data-theme', theme);
  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }
}

// Toast System
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
    list.innerHTML = `<div style="padding:20px; text-align:center; color:var(--text-muted)">Type to search across Projects, Tasks, Clients...</div>`;
    return;
  }

  const q = query.toLowerCase();
  let results = [];

  // Search Projects
  window.storage.data.projects.forEach(p => {
    if (p.projectNumber.toLowerCase().includes(q) || p.clientName.toLowerCase().includes(q)) {
      results.push({
        title: `${p.projectNumber} - ${p.clientName}`,
        sub: `Value: ₹${(p.value).toLocaleString()} | Status: ${p.status}`,
        url: `project-details.html?id=${p.id}`
      });
    }
  });

  // Search Tasks
  window.storage.data.tasks.forEach(t => {
    if (t.title.toLowerCase().includes(q)) {
      results.push({
        title: t.title,
        sub: `Priority: ${t.priority} | Status: ${t.status}`,
        url: `task-details.html?id=${t.id}`
      });
    }
  });

  // Search Companies
  window.storage.data.companies.forEach(c => {
    if (c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)) {
      results.push({
        title: c.name,
        sub: `${c.code} | Industry: ${c.industry}`,
        url: `company-details.html?id=${c.id}`
      });
    }
  });

  if (results.length === 0) {
    list.innerHTML = `<div style="padding:20px; text-align:center; color:var(--text-muted)">No matching records found for "${query}".</div>`;
    return;
  }

  list.innerHTML = results.map(r => `
    <div class="search-result-item" onclick="window.location.href='${r.url}'">
      <div class="kpi-icon blue" style="width:32px;height:32px;font-size:14px;"><i class="fas fa-search"></i></div>
      <div>
        <div style="font-weight:600;font-size:13.5px;">${r.title}</div>
        <div style="font-size:12px;color:var(--text-muted);">${r.sub}</div>
      </div>
    </div>
  `).join('');
}
