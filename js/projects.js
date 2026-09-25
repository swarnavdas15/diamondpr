/**
 * DIAMOND FLANGES & FITTINGS PVT LTD - PROJECTS PAGE CONTROLLER (V3 - Masking & Timeline Support)
 */

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    initProjectsView();
  }, 100);
});

function initProjectsView() {
  const tbody = document.getElementById('projects-table-tbody');
  if (!tbody) return;

  const orders = window.storage.getOrdersForCurrentUser();
  tbody.innerHTML = renderProjectsTableRows(orders);
}

function renderProjectsTableRows(list) {
  if (!list || list.length === 0) {
    return `<tr><td colspan="8" style="text-align:center; padding:30px; color:var(--text-muted);">No work orders found.</td></tr>`;
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
          <a href="javascript:void(0)" onclick="renderOrderOverviewModal('${p.id}')" style="font-weight:700; color:var(--accent); font-family:'Outfit'; font-size:14px;">
            ${p.projectNumber}
          </a>
        </td>
        <td>
          <div style="font-weight:600; font-size:13px;">${p.clientName}</div>
          <div style="font-size:11px; color:var(--text-muted);">
            <span class="badge badge-inprocess" style="font-size:10px; padding:1px 5px;">${p.clientCode || 'CLI-8821'}</span> 
            <i class="fas fa-file-invoice" style="margin-left:4px;"></i> ${p.poNumber} (${p.poDate || 'N/A'})
          </div>
        </td>
        <td style="font-weight:600;">
          <i class="far fa-calendar-alt"></i> ${p.deliveryDate}
          ${isOverdue ? '<span class="badge badge-urgent" style="font-size:9px; margin-left:4px;">OVERDUE</span>' : ''}
          ${isToday ? '<span class="badge badge-pending" style="font-size:9px; margin-left:4px;">DUE TODAY</span>' : ''}
        </td>
        <td style="font-weight:700;">₹${(p.value || 0).toLocaleString('en-IN')}</td>
        <td style="font-size:12px; max-width:200px;">${p.materialStatus || 'Scheduled'}</td>
        <td style="min-width:110px;">
          <div class="flex-space-between" style="font-size:11px; margin-bottom:2px;"><span>${p.progress}%</span></div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width:${p.progress}%; background:${p.progress === 100 ? 'var(--status-completed)' : 'var(--accent)'}"></div>
          </div>
        </td>
        <td><span class="badge ${statusBadgeMap[p.status] || 'badge-inprocess'}">${p.status}</span></td>
        <td>
          <button onclick="renderOrderOverviewModal('${p.id}')" class="btn btn-secondary btn-sm" title="View Stepper Timeline"><i class="fas fa-route"></i> Stepper</button>
        </td>
      </tr>
    `;
  }).join('');
}

function filterProjectsList() {
  const query = document.getElementById('project-search-input')?.value.toLowerCase() || '';
  const status = document.getElementById('project-status-filter')?.value || '';

  const orders = window.storage.getOrdersForCurrentUser();

  const filtered = orders.filter(p => {
    const matchQ = p.projectNumber.toLowerCase().includes(query) || 
                   p.clientName.toLowerCase().includes(query) || 
                   (p.clientCode || '').toLowerCase().includes(query) ||
                   p.poNumber.toLowerCase().includes(query);
    const matchSt = status === '' || p.status === status;
    return matchQ && matchSt;
  });

  const tbody = document.getElementById('projects-table-tbody');
  if (tbody) tbody.innerHTML = renderProjectsTableRows(filtered);
}

function exportProjectsCSV() {
  const orders = window.storage.getOrdersForCurrentUser();
  let csv = 'Project Number,Client Code/Name,PO Number,Delivery Date,Value INR,Status,Progress Pct\n';
  orders.forEach(p => {
    csv += `"${p.projectNumber}","${p.clientName}","${p.poNumber}","${p.deliveryDate}",${p.value},"${p.status}",${p.progress}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', 'Diamond_ERP_Work_Orders_Report.csv');
  a.click();
  showToast('Exported work order pipeline to CSV', 'success');
}
