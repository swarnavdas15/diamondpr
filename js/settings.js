/**
 * DIAMOND FLANGES & FITTINGS PVT LTD - SETTINGS PAGE CONTROLLER
 * Comprehensive Super Admin Client Details Visibility & Permissions Management
 */

let currentUserFilter = 'ALL';

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    initSettingsView();
    renderUserVisibilityTable();
    renderSettingsClientsTable();
    

  }, 100);
});

function initSettingsView() {
  const settings = window.storage.data.settings;
  const nameEl = document.getElementById('setting-company-name');
  const tagEl = document.getElementById('setting-tagline');
  const currEl = document.getElementById('setting-currency');

  if (nameEl) nameEl.value = settings.companyName || '';
  if (tagEl) tagEl.value = settings.tagline || '';
  if (currEl) currEl.value = settings.currency || 'INR';

  // Check if current logged-in user is Super Admin
  const currentUser = window.storage.getCurrentUser();
  const isSuperAdmin = currentUser && currentUser.role === 'Super Admin';
  const superAdminActionBar = document.getElementById('super-admin-action-bar');
  if (superAdminActionBar && !isSuperAdmin) {
    superAdminActionBar.style.display = 'none';
  }
}

function setUserFilter(filter, btn) {
  currentUserFilter = filter;
  document.querySelectorAll('#user-filter-chips .filter-chip').forEach(el => {
    el.classList.remove('active');
    el.classList.remove('btn-primary');
    el.classList.add('btn-secondary');
  });
  if (btn) {
    btn.classList.add('active');
    btn.classList.add('btn-primary');
    btn.classList.remove('btn-secondary');
  }
  renderUserVisibilityTable();
}

function renderUserVisibilityTable() {
  const tbody = document.getElementById('user-visibility-tbody');
  if (!tbody) return;

  const users = window.storage.data.users || [];
  const searchInput = document.getElementById('user-visibility-search');
  const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';

  const currentUser = window.storage.getCurrentUser();
  const isSuperAdmin = currentUser && currentUser.role === 'Super Admin';

  let allowedCount = 0;
  let restrictedCount = 0;

  users.forEach(u => {
    if (window.storage.hasClientAccess(u.id)) {
      allowedCount++;
    } else {
      restrictedCount++;
    }
  });

  const countAllEl = document.getElementById('count-all-users');
  const countAllowedEl = document.getElementById('count-allowed-users');
  const countRestrictedEl = document.getElementById('count-restricted-users');

  if (countAllEl) countAllEl.textContent = users.length;
  if (countAllowedEl) countAllowedEl.textContent = allowedCount;
  if (countRestrictedEl) countRestrictedEl.textContent = restrictedCount;

  const filtered = users.filter(u => {
    const hasAccess = window.storage.hasClientAccess(u.id);
    if (currentUserFilter === 'ALLOWED' && !hasAccess) return false;
    if (currentUserFilter === 'RESTRICTED' && hasAccess) return false;

    if (searchQuery) {
      return (
        u.name.toLowerCase().includes(searchQuery) ||
        u.username.toLowerCase().includes(searchQuery) ||
        u.email.toLowerCase().includes(searchQuery) ||
        u.role.toLowerCase().includes(searchQuery) ||
        (u.department && u.department.toLowerCase().includes(searchQuery))
      );
    }
    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 24px;">
          No system users found matching the filter criteria.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(u => {
    const hasAccess = window.storage.hasClientAccess(u.id);
    const isOwner = u.role === 'Super Admin';

    let roleBadgeColor = 'var(--accent)';
    if (u.role === 'Super Admin') roleBadgeColor = '#f59e0b';
    else if (u.role === 'Admin') roleBadgeColor = '#3b82f6';
    else if (u.role === 'Sales') roleBadgeColor = '#10b981';
    else if (u.role === 'Purchase') roleBadgeColor = '#8b5cf6';
    else if (u.role === 'Production') roleBadgeColor = '#f97316';
    else if (u.role === 'Quality Testing') roleBadgeColor = '#06b6d4';
    else if (u.role === 'Dispatch') roleBadgeColor = '#ec4899';

    return `
      <tr style="border-bottom: 1px solid var(--border-color);">
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            <img src="${u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}" 
                 style="width: 34px; height: 34px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border-color);">
            <div>
              <div style="font-weight: 700; color: var(--text-main);">${u.name}</div>
              <div style="font-size: 11px; color: var(--text-muted);">@${u.username}</div>
            </div>
          </div>
        </td>
        <td>
          <span class="badge" style="background: rgba(255,255,255,0.05); color: ${roleBadgeColor}; border: 1px solid ${roleBadgeColor}; font-weight: 700; font-size: 11px; padding: 2px 6px; border-radius: 4px;">
            ${u.role}
          </span>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">${u.department || 'Plant Department'}</div>
        </td>
        <td>
          <div style="color: var(--text-main); font-size: 12px;">${u.email}</div>
          <div style="font-size: 10px; color: #10b981; font-weight: 700;">● ${u.status || 'Active'}</div>
        </td>
        <td>
          ${hasAccess ? `
            <span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid #10b981; font-weight: 800; font-size: 11px; padding: 4px 8px; border-radius: 4px;">
              🔓 UNMASKED (FULL ACCESS)
            </span>
            <div style="font-size: 10px; color: #10b981; margin-top: 2px;">Can view client names & contacts</div>
          ` : `
            <span class="badge" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid #ef4444; font-weight: 800; font-size: 11px; padding: 4px 8px; border-radius: 4px;">
              🔒 MASKED (CONFIDENTIAL)
            </span>
            <div style="font-size: 10px; color: #ef4444; margin-top: 2px;">Client details masked</div>
          `}
        </td>
        <td>
          ${isOwner ? `
            <span class="badge" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid #f59e0b; font-weight: 800; padding: 5px 10px;">
              👑 Owner (Always Allowed)
            </span>
          ` : isSuperAdmin ? `
            <div style="display: flex; gap: 6px; align-items: center;">
              <button class="btn btn-sm ${hasAccess ? 'btn-success' : 'btn-secondary'}" 
                      style="${hasAccess ? 'background: #10b981; color:#fff;' : 'background: rgba(16,185,129,0.1); border-color:#10b981; color:#10b981;'}"
                      onclick="handleSetUserAccess('${u.id}', true)">
                ${hasAccess ? '✓ Allowed' : 'Allow Access'}
              </button>
              <button class="btn btn-sm ${!hasAccess ? 'btn-danger' : 'btn-secondary'}" 
                      style="${!hasAccess ? 'background: #ef4444; color:#fff;' : 'background: rgba(239,68,68,0.1); border-color:#ef4444; color:#ef4444;'}"
                      onclick="handleSetUserAccess('${u.id}', false)">
                ${!hasAccess ? '🔒 Masked' : 'Restrict'}
              </button>
            </div>
          ` : `
            <span style="font-size: 11px; color: var(--text-muted);"><i class="fas fa-lock"></i> Super Admin Only</span>
          `}
        </td>
      </tr>
    `;
  }).join('');
}

function renderSettingsClientsTable() {
  const tbody = document.getElementById('settings-clients-tbody');
  if (!tbody) return;

  const companies = window.storage.data.companies || [];
  const badge = document.getElementById('client-total-badge');
  if (badge) badge.textContent = `${companies.length} Clients Registered`;

  if (companies.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; color:var(--text-muted); padding:20px;">
          No client records registered.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = companies.map(c => {
    const contact = (c.contacts && c.contacts[0]) ? c.contacts[0] : null;
    const contactName = contact ? `${contact.title || ''} ${contact.firstName} ${contact.lastName}`.trim() : 'Primary Procurement Officer';
    const contactPhone = contact ? contact.mobile : '+91 98200 00000';
    const contactEmail = contact ? contact.officialEmail : 'contact@company.com';

    return `
      <tr style="border-bottom: 1px solid var(--border-color);">
        <td><strong style="color: var(--accent);">${c.code}</strong></td>
        <td>
          <div style="font-weight: 700; color: var(--text-main);">${c.name}</div>
          <div style="font-size: 11px; color: var(--text-muted);">${c.industry || 'Heavy Engineering & Piping'}</div>
        </td>
        <td>
          <div style="color: var(--text-main);">${contactName}</div>
          <div style="font-size: 11px; color: var(--text-muted);">${contact ? contact.position : 'Procurement'}</div>
        </td>
        <td>
          <div style="font-size: 12px;">${contactPhone}</div>
          <div style="font-size: 11px; color: var(--text-muted);">${contactEmail}</div>
        </td>
        <td><span style="font-weight: 700; color: var(--text-main);">${c.gstin || '27AAACL1234F1Z9'}</span></td>
        <td>
          <span class="badge" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid #38bdf8; font-size: 10px; font-weight: 700;">
            🛡️ Confidential Record
          </span>
        </td>
      </tr>
    `;
  }).join('');
}

function handleSetUserAccess(userId, allowed) {
  const res = window.storage.setUserClientAccess(userId, allowed);
  if (res.success) {
    showToast(res.message, 'success');
    renderUserVisibilityTable();
  } else {
    showToast(res.message, 'warning');
  }
}

function handleGrantAllAccess() {
  const res = window.storage.setBulkUserClientAccess(true);
  if (res.success) {
    showToast('Granted client details visibility to all users.', 'success');
    renderUserVisibilityTable();
  } else {
    showToast(res.message, 'warning');
  }
}

function handleMaskOperationalRoles() {
  const res = window.storage.setBulkUserClientAccess(false, ['Purchase', 'Production', 'Quality Testing', 'Dispatch']);
  if (res.success) {
    showToast('Masked client details for Purchase, Production, Quality, and Dispatch roles.', 'info');
    renderUserVisibilityTable();
  } else {
    showToast(res.message, 'warning');
  }
}

function handleResetAccessDefaults() {
  const res = window.storage.resetClientAccessToDefaults();
  if (res.success) {
    showToast('Reset user client details visibility to role defaults.', 'success');
    renderUserVisibilityTable();
  } else {
    showToast(res.message, 'warning');
  }
}

function saveSettingsForm() {
  window.storage.data.settings.companyName = document.getElementById('setting-company-name').value;
  window.storage.data.settings.tagline = document.getElementById('setting-tagline').value;
  window.storage.data.settings.currency = document.getElementById('setting-currency').value;
  window.storage.saveState();
  showToast('Settings saved successfully', 'success');
}

function exportFullJSONBackup() {
  const jsonStr = JSON.stringify(window.storage.data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', `Diamond_ERP_Backup_${new Date().toISOString().split('T')[0]}.json`);
  a.click();
  showToast('Downloaded full system JSON backup', 'success');
}

function importFullJSONBackup() {
  const fileInput = document.getElementById('import-backup-file');
  if (!fileInput || !fileInput.files[0]) {
    showToast('Please select a valid JSON backup file first.', 'warning');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (parsed && parsed.users && parsed.projects) {
        window.storage.saveState(parsed);
        showToast('Backup restored successfully! Reloading...', 'success');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        showToast('Invalid backup JSON structure.', 'error');
      }
    } catch (err) {
      showToast('Error reading JSON file.', 'error');
    }
  };
  reader.readAsText(fileInput.files[0]);
}









