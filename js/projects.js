/**
 * DIAMOND FLANGES & FITTINGS PVT LTD - PROJECTS PAGE CONTROLLER
 */

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    initProjectsView();
  }, 100);
});

function initProjectsView() {
  const tbody = document.getElementById('projects-table-tbody');
  if (!tbody) return;
  tbody.innerHTML = renderProjectsTableRows(window.storage.data.projects);
}

function renderProjectsTableRows(list) {
  if (list.length === 0) {
    return `<tr><td colspan="8" style="text-align:center; padding:30px; color:var(--text-muted);">No projects found.</td></tr>`;
  }

  const todayStr = new Date().toISOString().split('T')[0];

  const statusBadgeMap = {
    'Work Order Pending': 'badge-pending',
    'In Process': 'badge-inprocess',
    'Vendor Material Pending': 'badge-waiting',
    'Waiting Client Approval': 'badge-waiting',
    'Part Dispatched': 'badge-dispatched',
    'Completed': 'badge-completed'
  };

  return list.map(p => {
    const isOverdue = p.deliveryDate < todayStr && p.status !== 'Completed';
    const isToday = p.deliveryDate === todayStr;

    return `
      <tr>
        <td>
          <a href="project-details.html?id=${p.id}" style="font-weight:700; color:var(--accent); font-family:'Outfit'; font-size:14px;">
            ${p.projectNumber}
          </a>
        </td>
        <td>
          <div style="font-weight:600;">${p.clientName}</div>
          <div style="font-size:11px; color:var(--text-muted);"><i class="fas fa-file-invoice"></i> ${p.poNumber} (${p.poDate})</div>
        </td>
        <td style="font-weight:600;">
          <i class="far fa-calendar-alt"></i> ${p.deliveryDate}
          ${isOverdue ? '<span class="badge badge-urgent" style="font-size:9px; margin-left:4px;">OVERDUE</span>' : ''}
          ${isToday ? '<span class="badge badge-pending" style="font-size:9px; margin-left:4px;">DUE TODAY</span>' : ''}
        </td>
        <td style="font-weight:700;">₹${(p.value).toLocaleString('en-IN')}</td>
        <td style="font-size:12px; max-width:200px;">${p.materialStatus}</td>
        <td style="min-width:110px;">
          <div class="flex-space-between" style="font-size:11px; margin-bottom:2px;"><span>${p.progress}%</span></div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width:${p.progress}%; background:${p.progress === 100 ? 'var(--status-completed)' : 'var(--accent)'}"></div>
          </div>
        </td>
        <td><span class="badge ${statusBadgeMap[p.status] || 'badge-inprocess'}">${p.status}</span></td>
        <td>
          <a href="project-details.html?id=${p.id}" class="btn btn-secondary btn-sm" title="View Full Details"><i class="fas fa-eye"></i> Details</a>
        </td>
      </tr>
    `;
  }).join('');
}

function filterProjectsList() {
  const query = document.getElementById('project-search-input')?.value.toLowerCase() || '';
  const status = document.getElementById('project-status-filter')?.value || '';

  const filtered = window.storage.data.projects.filter(p => {
    const matchQ = p.projectNumber.toLowerCase().includes(query) || p.clientName.toLowerCase().includes(query) || p.poNumber.toLowerCase().includes(query);
    const matchSt = status === '' || p.status === status;
    return matchQ && matchSt;
  });

  const tbody = document.getElementById('projects-table-tbody');
  if (tbody) tbody.innerHTML = renderProjectsTableRows(filtered);
}

function exportProjectsCSV() {
  let csv = 'Project Number,Client Name,PO Number,Delivery Date,Value INR,Status,Progress Pct\n';
  window.storage.data.projects.forEach(p => {
    csv += `"${p.projectNumber}","${p.clientName}","${p.poNumber}","${p.deliveryDate}",${p.value},"${p.status}",${p.progress}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', 'Diamond_ERP_Projects_Report.csv');
  a.click();
  showToast('Exported project pipeline to CSV', 'success');
}
