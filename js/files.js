/**
 * DIAMOND FLANGES & FITTINGS PVT LTD - FILES PAGE CONTROLLER
 */

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    initFilesView();
  }, 100);
});

function initFilesView() {
  const files = window.storage.data.files;
  const grid = document.getElementById('files-grid-container');
  if (!grid) return;

  const storageLimit = window.storage.data.settings.fileStorageLimitMB || 50;
  const totalUsedBytes = files.reduce((acc, f) => acc + (f.sizeBytes || 1000000), 0);
  const totalUsedMB = (totalUsedBytes / (1024 * 1024)).toFixed(1);
  const pctUsed = Math.round((totalUsedMB / storageLimit) * 100);

  const txtEl = document.getElementById('files-storage-text');
  const fillEl = document.getElementById('files-storage-fill');
  if (txtEl) txtEl.textContent = `${totalUsedMB} MB / ${storageLimit} MB (${pctUsed}% Used)`;
  if (fillEl) fillEl.style.width = `${pctUsed}%`;

  const iconMap = {
    'Drawing & Specs': 'fas fa-drafting-compass',
    'Inspection Report': 'fas fa-file-shield',
    'Invoice & Dispatch': 'fas fa-file-invoice-dollar',
    'Raw Material MTC': 'fas fa-certificate'
  };

  grid.innerHTML = files.map(f => `
    <div class="file-card">
      <div class="file-icon-preview">
        <i class="${iconMap[f.category] || 'fas fa-file-pdf'}"></i>
      </div>
      <div style="font-weight:600; font-size:13px; line-height:1.3; height:34px; overflow:hidden; text-overflow:ellipsis;">
        ${f.name}
      </div>
      <div style="font-size:11px; color:var(--text-muted);">
        <div>Category: ${f.category}</div>
        <div>Size: ${f.sizeFormatted} | By: ${f.uploadedBy}</div>
        <div>Uploaded: ${f.uploadedAt}</div>
      </div>
      <div class="flex-space-between" style="margin-top:auto; padding-top:8px; border-top:1px solid var(--border-color);">
        <button class="btn btn-secondary btn-sm" onclick="previewFile('${f.id}')" title="Preview"><i class="fas fa-eye"></i> View</button>
        <button class="btn btn-secondary btn-sm" onclick="showToast('Downloading document...', 'info')" title="Download"><i class="fas fa-download"></i></button>
      </div>
    </div>
  `).join('');
}

function previewFile(fileId) {
  const f = window.storage.data.files.find(item => item.id === fileId);
  if (!f) return;

  const modal = document.getElementById('preview-file-modal');
  const title = document.getElementById('preview-file-title');
  const body = document.getElementById('preview-file-body');

  if (modal && title && body) {
    title.textContent = f.name;
    body.innerHTML = `
      <div style="text-align:center; padding:30px; background:var(--bg-app); border-radius:var(--radius-sm);">
        <i class="fas fa-file-pdf" style="font-size:64px; color:var(--accent); margin-bottom:16px;"></i>
        <h4>${f.name}</h4>
        <p style="color:var(--text-muted); font-size:13px; margin-top:6px;">Category: ${f.category} | Access: ${f.access}</p>
        <div style="margin-top:20px; padding:14px; background:var(--bg-surface); border:1px solid var(--border-color); text-align:left; font-family:monospace; font-size:12px;">
          --- DIAMOND FLANGES & FITTINGS DOCUMENT PREVIEW SIMULATION ---<br>
          Heat Batch #: HT-9921<br>
          Ultrasonic Flaw Test: 100% Passed (ASME Sec VIII Div 1)<br>
          Hydrostatic Test Pressure: 150 BAR (Sustained 30 Mins)<br>
          Inspector Clearance: BV Quality Inspector Approved
        </div>
      </div>
    `;
    openModal('preview-file-modal');
  }
}
