/**
 * DIAMOND FLANGES & FITTINGS PVT LTD - SETTINGS PAGE CONTROLLER
 */

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    initSettingsView();
  }, 100);
});

function initSettingsView() {
  const settings = window.storage.data.settings;
  const nameEl = document.getElementById('setting-company-name');
  const tagEl = document.getElementById('setting-tagline');
  const currEl = document.getElementById('setting-currency');

  if (nameEl) nameEl.value = settings.companyName;
  if (tagEl) tagEl.value = settings.tagline;
  if (currEl) currEl.value = settings.currency;
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
