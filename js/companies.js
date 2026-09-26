/**
 * DIAMOND FLANGES & FITTINGS PVT LTD - COMPANIES CRM CONTROLLER
 */

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    initCompaniesView();
  }, 100);
});

function initCompaniesView() {
  const grid = document.getElementById('companies-cards-grid');
  if (!grid) return;
  grid.innerHTML = renderCompanyCardsHtml(window.storage.data.companies);
}

function renderCompanyCardsHtml(list) {
  if (list.length === 0) {
    return `<div style="grid-column:1/-1; padding:40px; text-align:center; color:var(--text-muted);">No company records found.</div>`;
  }

  return list.map(c => `
    <div class="widget-card" style="position:relative;">
      <div class="flex-space-between" style="border-bottom:1px solid var(--border-color); padding-bottom:12px;">
        <div>
          <span class="badge badge-inprocess" style="margin-bottom:6px;">${c.code}</span>
          <h3 style="font-size:16px;"><a href="company-details.html?id=${c.id}">${c.name}</a></h3>
          <div style="font-size:12px; color:var(--text-muted);"><i class="fas fa-industry"></i> ${c.industry} | Rating: ${c.rating || 'Standard'}</div>
        </div>
        <div class="flex-row">
          <a href="company-details.html?id=${c.id}" class="btn btn-secondary btn-sm" title="View Full Details"><i class="fas fa-arrow-right"></i> Details</a>
        </div>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; font-size:12px; margin:10px 0;">
        <div><strong>GSTIN:</strong> ${c.gstin}</div>
        <div><strong>PAN:</strong> ${c.pan}</div>
        <div style="grid-column:1/-1;"><strong>Website:</strong> <a href="https://${c.website}" target="_blank">${c.website}</a></div>
      </div>

      <div style="margin-top:10px; background:var(--bg-app); border-radius:var(--radius-sm); padding:10px;">
        <div class="flex-space-between" style="font-size:12px; font-weight:700; margin-bottom:6px;">
          <span><i class="fas fa-map-marker-alt" style="color:var(--status-urgent)"></i> Addresses (${c.addresses.length})</span>
        </div>
        ${c.addresses.map(a => `
          <div style="font-size:11px; margin-bottom:4px;">
            <strong style="color:var(--accent);">${a.type}:</strong> ${a.city}, ${a.state}
          </div>
        `).join('')}
      </div>

      <div style="margin-top:10px; background:var(--bg-app); border-radius:var(--radius-sm); padding:10px;">
        <div class="flex-space-between" style="font-size:12px; font-weight:700; margin-bottom:6px;">
          <span><i class="fas fa-users" style="color:var(--accent)"></i> Executive Contacts (${c.contacts.length})</span>
        </div>
        ${c.contacts.map(cnt => `
          <div class="flex-space-between" style="font-size:11px; margin-bottom:4px;">
            <div><strong>${cnt.title} ${cnt.firstName} ${cnt.lastName}</strong> - <span style="color:var(--text-muted);">${cnt.position}</span></div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function filterCompaniesList() {
  const query = document.getElementById('company-search-input')?.value.toLowerCase() || '';
  const ind = document.getElementById('company-industry-filter')?.value || '';

  const filtered = window.storage.data.companies.filter(c => {
    const matchQ = c.name.toLowerCase().includes(query) || c.gstin.toLowerCase().includes(query) || c.code.toLowerCase().includes(query);
    const matchInd = ind === '' || c.industry === ind;
    return matchQ && matchInd;
  });

  const grid = document.getElementById('companies-cards-grid');
  if (grid) grid.innerHTML = renderCompanyCardsHtml(filtered);
}

function exportCompaniesCSV() {
  let csv = 'Company Code,Company Name,Industry,GSTIN,PAN,Website\n';
  window.storage.data.companies.forEach(c => {
    csv += `"${c.code}","${c.name}","${c.industry}","${c.gstin}","${c.pan}","${c.website}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', 'Diamond_ERP_Companies_Export.csv');
  a.click();
  showToast('Exported company directory to CSV', 'success');
}
