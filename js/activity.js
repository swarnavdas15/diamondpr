/**
 * DIAMOND FLANGES & FITTINGS PVT LTD - ACTIVITY AUDIT TRAIL MODULE
 */

function renderActivity() {
  const container = document.getElementById('view-activity');
  if (!container) return;

  const activities = store.data.activities;

  container.innerHTML = `
    <div class="section-header">
      <div class="section-title-group">
        <h2>Audit Trail & Operational Activity Log</h2>
        <p>Immutable event log tracking logins, project status transitions, and administrative modifications.</p>
      </div>
      <div class="section-actions">
        <button class="btn btn-secondary" onclick="exportActivityCSV()"><i class="fas fa-download"></i> Export Log</button>
      </div>
    </div>

    <div class="widget-card">
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action Event</th>
              <th>Activity Description</th>
            </tr>
          </thead>
          <tbody>
            ${activities.map(act => `
              <tr>
                <td style="font-family:monospace; font-size:12px; color:var(--text-muted);">${act.timestamp}</td>
                <td><strong style="color:var(--text-main);">${act.user}</strong></td>
                <td><span class="badge badge-inprocess">${act.action}</span></td>
                <td>${act.details}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderSettings() {
  const container = document.getElementById('view-settings');
  if (!container) return;

  const settings = store.data.settings;

  container.innerHTML = `
    <div class="section-header">
      <div class="section-title-group">
        <h2>ERP System Settings & Data Backup</h2>
        <p>Manage system configuration, LocalStorage data backups, and demo reset.</p>
      </div>
    </div>

    <div class="grid-2col">
      <div class="widget-card">
        <h3 style="font-size:16px; margin-bottom:14px;"><i class="fas fa-sliders" style="color:var(--accent);"></i> General Company Parameters</h3>
        <div class="form-group">
          <label>Company Legal Name</label>
          <input type="text" id="setting-company-name" class="form-control" value="${settings.companyName}">
        </div>
        <div class="form-group">
          <label>Corporate Tagline</label>
          <input type="text" id="setting-tagline" class="form-control" value="${settings.tagline}">
        </div>
        <div class="form-group">
          <label>Default Currency</label>
          <input type="text" id="setting-currency" class="form-control" value="${settings.currency}">
        </div>
        <button class="btn btn-primary" onclick="saveSettingsForm()"><i class="fas fa-save"></i> Save System Settings</button>
      </div>

      <div class="widget-card">
        <h3 style="font-size:16px; margin-bottom:14px;"><i class="fas fa-database" style="color:var(--accent);"></i> Data Backup & Restore</h3>
        <p style="font-size:13px; color:var(--text-muted); margin-bottom:16px;">
          Export your entire Diamond ERP system database as a JSON file or restore from a previously exported backup.
        </p>
        <div style="display:flex; flex-direction:column; gap:12px;">
          <button class="btn btn-secondary" onclick="exportFullJSONBackup()"><i class="fas fa-file-export"></i> Export Complete System Backup (JSON)</button>
          
          <div style="border-top:1px solid var(--border-color); padding-top:12px; margin-top:6px;">
            <label style="font-size:12px; font-weight:700;">Restore from Backup JSON</label>
            <input type="file" id="import-backup-file" accept=".json" class="form-control" style="margin-top:6px;">
            <button class="btn btn-primary" onclick="importFullJSONBackup()" style="margin-top:8px;"><i class="fas fa-file-import"></i> Restore Backup File</button>
          </div>

          <div style="border-top:1px solid var(--border-color); padding-top:12px; margin-top:6px;">
            <button class="btn btn-danger" onclick="store.resetToDemo()"><i class="fas fa-arrow-rotate-left"></i> Reset System to Initial Demo Data</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function saveSettingsForm() {
  store.data.settings.companyName = document.getElementById('setting-company-name').value;
  store.data.settings.tagline = document.getElementById('setting-tagline').value;
  store.data.settings.currency = document.getElementById('setting-currency').value;
  store.saveState();
  showToast('Settings saved successfully', 'success');
}

function exportFullJSONBackup() {
  const jsonStr = JSON.stringify(store.data, null, 2);
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
        store.saveState(parsed);
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

function exportActivityCSV() {
  let csv = 'Timestamp,User,Action,Details\n';
  store.data.activities.forEach(a => {
    csv += `"${a.timestamp}","${a.user}","${a.action}","${a.details}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', 'Diamond_ERP_Audit_Trail.csv');
  a.click();
  showToast('Exported audit trail to CSV', 'success');
}
