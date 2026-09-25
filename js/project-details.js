/**
 * DIAMOND FLANGES & FITTINGS PVT LTD - PROJECT DETAILS PAGE CONTROLLER
 */

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    initProjectDetailsView();
  }, 100);
});

function initProjectDetailsView() {
  const params = new URLSearchParams(window.location.search);
  const prjId = params.get('id') || 'prj-101';

  const project = window.storage.data.projects.find(p => p.id === prjId);
  const container = document.getElementById('project-details-content');
  if (!container) return;

  if (!project) {
    container.innerHTML = `<div style="padding:40px; text-align:center;"><h3>Work Order not found</h3><a href="projects.html" class="btn btn-secondary">Back to Projects</a></div>`;
    return;
  }

  // Linked tasks & files
  const linkedTasks = window.storage.data.tasks.filter(t => t.projectId === prjId);
  const linkedFiles = window.storage.data.files.filter(f => f.projectId === prjId);

  const statusBadgeMap = {
    'Work Order Pending': 'badge-pending',
    'In Process': 'badge-inprocess',
    'Vendor Material Pending': 'badge-waiting',
    'Waiting Client Approval': 'badge-waiting',
    'Part Dispatched': 'badge-dispatched',
    'Completed': 'badge-completed'
  };

  container.innerHTML = `
    <div class="section-header">
      <div class="section-title-group">
        <div class="flex-row">
          <span class="badge ${statusBadgeMap[project.status] || 'badge-inprocess'}">${project.status}</span>
          <h2>Work Order: ${project.projectNumber}</h2>
        </div>
        <p><i class="fas fa-building"></i> Client: <strong>${project.clientName}</strong> | PO #: ${project.poNumber} (${project.poDate})</p>
      </div>
      <div class="section-actions">
        <a href="projects.html" class="btn btn-secondary"><i class="fas fa-arrow-left"></i> Back to Projects</a>
        <button class="btn btn-primary" onclick="showToast('Dispatch update recorded', 'success')"><i class="fas fa-truck"></i> Update Dispatch</button>
      </div>
    </div>

    <!-- Project Metrics Grid -->
    <div class="kpi-row" style="margin-bottom:24px;">
      <div class="kpi-card" style="padding:16px;">
        <div class="kpi-title">Order Value</div>
        <div class="kpi-value" style="font-size:22px; color:var(--accent);">₹${project.value.toLocaleString('en-IN')}</div>
      </div>
      <div class="kpi-card" style="padding:16px;">
        <div class="kpi-title">Target Delivery Date</div>
        <div class="kpi-value" style="font-size:22px;"><i class="far fa-calendar-alt"></i> ${project.deliveryDate}</div>
      </div>
      <div class="kpi-card" style="padding:16px;">
        <div class="kpi-title">Manufacturing Progress</div>
        <div class="kpi-value" style="font-size:22px; color:var(--status-completed);">${project.progress}%</div>
        <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${project.progress}%; background:var(--status-completed);"></div></div>
      </div>
    </div>

    <!-- Details Split Grid -->
    <div class="grid-2col" style="margin-bottom:24px;">
      <div class="widget-card">
        <h3 style="font-size:16px; margin-bottom:14px;"><i class="fas fa-cogs" style="color:var(--accent);"></i> Material Forging & Machining Status</h3>
        <div style="font-size:13px; display:flex; flex-direction:column; gap:10px;">
          <div><strong>Material Status:</strong> ${project.materialStatus}</div>
          <div><strong>Dispatch Status:</strong> ${project.dispatchStatus}</div>
          <div><strong>Sub-Contractors / Vendors:</strong> ${project.vendorNames}</div>
          <div><strong>Engineering Specifications / Notes:</strong> ${project.notes || project.remarks}</div>
        </div>
      </div>

      <div class="widget-card">
        <h3 style="font-size:16px; margin-bottom:14px;"><i class="fas fa-list-check" style="color:var(--accent);"></i> Linked Production Tasks (${linkedTasks.length})</h3>
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Task Title</th>
                <th>Due Date</th>
                <th>Priority</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${linkedTasks.map(t => `
                <tr>
                  <td><a href="task-details.html?id=${t.id}">${t.title}</a></td>
                  <td>${t.dueDate}</td>
                  <td><span class="badge badge-urgent">${t.priority}</span></td>
                  <td><span class="badge badge-inprocess">${t.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Attached Engineering Drawings & Test Certificates -->
    <div class="widget-card">
      <div class="widget-header">
        <div class="widget-title"><i class="fas fa-file-pdf" style="color:var(--accent);"></i> Associated Mill Test Certificates (MTC 3.1) & Drawings (${linkedFiles.length})</div>
      </div>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Document Name</th>
              <th>Category</th>
              <th>File Size</th>
              <th>Uploaded By</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${linkedFiles.map(f => `
              <tr>
                <td style="font-weight:600;">${f.name}</td>
                <td><span class="badge badge-inprocess">${f.category}</span></td>
                <td>${f.sizeFormatted}</td>
                <td>${f.uploadedBy}</td>
                <td><button class="btn btn-secondary btn-sm" onclick="showToast('Downloading document...', 'info')"><i class="fas fa-download"></i> Download</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}
