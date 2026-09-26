/**
 * DIAMOND FLANGES & FITTINGS PVT LTD - DEDICATED DEPARTMENT DASHBOARDS (V3)
 */

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    initDashboardView();
  }, 100);
});

function initDashboardView() {
  let currentUser = window.storage ? window.storage.getCurrentUser() : null;
  if (!currentUser && window.storage && window.storage.data && window.storage.data.users) {
    currentUser = window.storage.data.users[0]; // Default fallback to Super Admin
  }
  if (!currentUser) return;

  const container = document.getElementById('dashboard-dynamic-content');
  if (!container) return;

  // Render Role Banner
  const roleBanner = document.getElementById('dashboard-role-banner');
  if (roleBanner) {
    roleBanner.innerHTML = `
      <div class="flex-space-between flex-wrap" style="gap:16px;">
        <div>
          <span class="badge" style="background:rgba(255,255,255,0.15); color:#ffffff; padding:4px 10px; margin-bottom:6px; font-size:11px;">
            <i class="fas fa-shield-halved"></i> ROLE: ${currentUser.role.toUpperCase()} [${currentUser.department}]
          </span>
          <h2 style="color:#ffffff; font-size: 22px; margin-top:2px;">Operational Dashboard — ${getRoleDashboardTitle(currentUser.role)}</h2>
          <p style="color:#94a3b8; font-size:13px;">Logged in as: <strong>${currentUser.name}</strong> (${currentUser.email})</p>
        </div>
        <div style="display:flex; gap:10px; align-items:center;">
          ${renderRoleHeaderActions(currentUser.role)}
        </div>
      </div>
    `;
  }

  // Render Tailored Dashboard based on Role
  switch (currentUser.role) {
    case 'Super Admin':
    case 'Admin':
      renderAdminDashboard(container, currentUser);
      break;
    case 'Sales':
      renderSalesDashboard(container);
      break;
    case 'Purchase':
      renderPurchaseDashboard(container);
      break;
    case 'Production':
      renderProductionDashboard(container);
      break;
    case 'Quality Testing':
      renderGCDashboard(container);
      break;
    case 'Dispatch':
      renderDispatchDashboard(container);
      break;
    default:
      renderAdminDashboard(container, currentUser);
  }
}

function getRoleDashboardTitle(role) {
  const map = {
    'Super Admin': 'Executive Operations & RBAC Control Center',
    'Admin': 'Plant Operations Supervision & Task Oversight',
    'Sales': 'Sales & Commercial Order Initiation Center',
    'Purchase': 'Procurement & Raw Material Supply Chain Queue',
    'Production': 'Shopfloor Machining & Forging Work Orders',
    'Quality Testing': 'QA / QC Metallurgical Testing Laboratory',
    'Dispatch': 'Logistics Yard & Ready-to-Ship Queue'
  };
  return map[role] || 'Department Dashboard';
}

function renderRoleHeaderActions(role) {
  if (role === 'Super Admin') {
    return `<button class="btn" style="background:#2563eb; color:#ffffff; font-weight:600;" onclick="openCreateUserModal()"><i class="fas fa-user-plus"></i> + Create New User</button>`;
  }
  if (role === 'Sales') {
    return `<button class="btn" style="background:#2563eb; color:#ffffff; font-weight:600;" onclick="openInitiateOrderModal()"><i class="fas fa-file-signature"></i> + Initiate Work Order</button>`;
  }
  return `<button class="btn" style="background:rgba(255,255,255,0.15); color:#ffffff; border:1px solid rgba(255,255,255,0.35); font-weight:600;" onclick="window.location.reload()"><i class="fas fa-sync"></i> Refresh Data</button>`;
}

// -----------------------------------------------------------------------------
// 1. SUPER ADMIN & ADMIN DASHBOARD
// -----------------------------------------------------------------------------
function renderAdminDashboard(container, currentUser) {
  const users = window.storage.data.users;
  const orders = window.storage.getOrdersForCurrentUser();
  const tasks = window.storage.data.tasks;

  container.innerHTML = `
    <!-- User Management Table (Super Admin & Admin View) -->
    <div class="widget-card" style="margin-bottom:24px;">
      <div class="widget-header">
        <div class="widget-title">
          <i class="fas fa-users-gear" style="color:var(--accent);"></i> User Management & System Role Assignments
          ${currentUser.role === 'Super Admin' ? '<span class="badge badge-inprocess" style="font-size:10px;">Super Admin Only Creation</span>' : '<span class="badge badge-waiting" style="font-size:10px;">Read Only View</span>'}
        </div>
        ${currentUser.role === 'Super Admin' ? '<button class="btn btn-primary btn-sm" onclick="openCreateUserModal()"><i class="fas fa-plus"></i> Add User</button>' : ''}
      </div>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Login Email</th>
              <th>System Role & Rights</th>
              <th>Department</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => `
              <tr>
                <td>
                  <div class="flex-row">
                    <img src="${u.avatar}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;">
                    <strong>${u.name}</strong>
                  </div>
                </td>
                <td>${u.email}</td>
                <td><span class="badge badge-inprocess">${u.role}</span></td>
                <td>${u.department}</td>
                <td><span class="badge ${u.status === 'Active' ? 'badge-completed' : 'badge-urgent'}">${u.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Global Order Pipeline -->
    <div class="widget-card" style="margin-bottom:24px;">
      <div class="widget-header">
        <div class="widget-title"><i class="fas fa-cubes" style="color:var(--accent);"></i> Global Work Order Pipeline Oversight</div>
      </div>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Client Name</th>
              <th>PO Number</th>
              <th>Delivery Date</th>
              <th>Value (INR)</th>
              <th>Active Stage Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map(o => `
              <tr onclick="openOrderOverview('${o.id}')" style="cursor:pointer;">
                <td><strong style="color:var(--accent); font-size:14px;">${o.projectNumber}</strong></td>
                <td><strong>${o.clientName}</strong></td>
                <td>${o.poNumber}</td>
                <td>${o.deliveryDate}</td>
                <td style="font-weight:700;">₹${o.value.toLocaleString('en-IN')}</td>
                <td><span class="badge badge-inprocess">${o.status} (${o.progress}%)</span></td>
                <td><button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); openOrderOverview('${o.id}')"><i class="fas fa-route"></i> Stepper</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Task Oversight with Task Delete Rights (Super Admin & Admin Exclusive) -->
    <div class="widget-card">
      <div class="widget-header">
        <div class="widget-title">
          <i class="fas fa-list-check" style="color:var(--status-pending);"></i> Cross-Team Task Oversight & Task Deletion
          <span class="badge badge-urgent" style="font-size:10px;">Delete Reserved for Super Admin / Admin</span>
        </div>
      </div>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Task Title</th>
              <th>From Dept</th>
              <th>Assigned Dept</th>
              <th>Due Date</th>
              <th>Priority</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${tasks.map(t => `
              <tr>
                <td style="font-weight:600;">${t.title}</td>
                <td><span class="badge badge-waiting">${t.fromDepartment || 'Plant'}</span></td>
                <td><span class="badge badge-inprocess">${t.assignedToDepartment || 'Sales'}</span></td>
                <td>${t.dueDate}</td>
                <td><span class="badge ${t.priority === 'Urgent' ? 'badge-urgent' : 'badge-inprocess'}">${t.priority}</span></td>
                <td>
                  <button class="btn btn-danger btn-sm" onclick="handleAdminDeleteTask('${t.id}')" title="Delete Task (Admin Right)"><i class="fas fa-trash"></i> Delete</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function handleAdminDeleteTask(taskId) {
  if (confirm('Are you sure you want to delete this task? (Admin Privilege)')) {
    const res = window.storage.deleteTask(taskId);
    if (res.success) {
      showToast('Task deleted successfully', 'info');
      initDashboardView();
    } else {
      showToast(res.message, 'error');
    }
  }
}

// -----------------------------------------------------------------------------
// 2. SALES DEPARTMENT DASHBOARD
// -----------------------------------------------------------------------------
function renderSalesDashboard(container) {
  const orders = window.storage.getOrdersForCurrentUser();
  const companies = window.storage.data.companies;

  container.innerHTML = `
    <!-- Sales Action Banner -->
    <div class="widget-card" style="margin-bottom:24px; background:linear-gradient(135deg, #2563EB, #1d4ed8); color:#ffffff; border:none; box-shadow:var(--shadow-lg);">
      <div class="flex-space-between flex-wrap" style="gap:16px;">
        <div>
          <span class="badge" style="background:rgba(255,255,255,0.2); color:#ffffff; padding:4px 10px; margin-bottom:6px; font-size:11px;">
            <i class="fas fa-briefcase"></i> COMMERCIAL & SALES WORKFLOW
          </span>
          <h3 style="color:#ffffff; font-size:20px; margin-top:4px;">Commercial Orders & Sales Approval Command</h3>
          <p style="font-size:13px; opacity:0.9;">Manage 6-stage sales approvals, track drawing & quotation milestones, and monitor customer PO execution.</p>
        </div>
      </div>
    </div>

    <!-- SALES TEAM ACTIONABLE TO-DO LIST & APPROVAL TRACKER -->
    ${renderSalesTodoList(orders)}

    <!-- Sales Orders Queue -->
    <div class="widget-card" style="margin-bottom:24px;">
      <div class="widget-header">
        <div class="widget-title"><i class="fas fa-file-signature" style="color:var(--primary);"></i> Customer Work Orders Pipeline</div>
      </div>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Client Name</th>
              <th>Client Code</th>
              <th>PO Number</th>
              <th>Order Value</th>
              <th>Quotation</th>
              <th>Progress</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map(o => `
              <tr onclick="openOrderOverview('${o.id}')" style="cursor:pointer;">
                <td><strong style="color:var(--primary); font-size:14px;">${o.projectNumber}</strong></td>
                <td><strong>${o.clientName}</strong></td>
                <td><span class="badge badge-inprocess">${o.clientCode}</span></td>
                <td>${o.poNumber}</td>
                <td style="font-weight:700;">₹${(o.value || 0).toLocaleString('en-IN')}</td>
                <td><span class="badge ${o.quotationStatus === 'Approved' ? 'badge-completed' : 'badge-pending'}">${o.quotationStatus || 'Approved'}</span></td>
                <td>
                  <div style="font-size:11px; font-weight:600; margin-bottom:2px;">${o.progress}% (${o.status})</div>
                  <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${o.progress}%;"></div></div>
                </td>
                <td>
                  <div class="flex-row" onclick="event.stopPropagation();">
                    <button class="btn btn-secondary btn-sm" onclick="openOrderOverview('${o.id}')"><i class="fas fa-route"></i> Stepper</button>
                    ${o.progress === 100 && o.status !== 'Completed' ? `<button class="btn btn-primary btn-sm" onclick="markOrderFinalCompleted('${o.id}')"><i class="fas fa-check-double"></i> Mark Order Done</button>` : ''}
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Client Directory -->
    <div class="widget-card">
      <div class="widget-header">
        <div class="widget-title"><i class="fas fa-building" style="color:var(--primary);"></i> Registered Clients & Automated Client Codes</div>
      </div>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Client Code</th>
              <th>Client Name</th>
              <th>Industry</th>
              <th>GSTIN</th>
              <th>Tier</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${companies.map(c => `
              <tr>
                <td><span class="badge badge-inprocess" style="font-weight:700;">${c.code}</span></td>
                <td><strong>${c.name}</strong></td>
                <td>${c.industry}</td>
                <td><code>${c.gstin}</code></td>
                <td><span class="badge badge-completed">${c.rating}</span></td>
                <td><a href="company-details.html?id=${c.id}" class="btn btn-secondary btn-sm"><i class="fas fa-eye"></i> View Profile</a></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderSalesTodoList(orders) {
  const currentUser = window.storage.getCurrentUser();
  const canEditQuotApproved = currentUser && (currentUser.role === 'Sales' || currentUser.role === 'Admin' || currentUser.role === 'Super Admin');

  return `
    <div class="widget-card" style="margin-bottom:24px;">
      <div class="widget-header">
        <div class="widget-title">
          <i class="fas fa-tasks" style="color:var(--primary);"></i> Sales Team Actionable To-Do List & Approval Tracker
        </div>
        <span class="badge" style="background:var(--primary-light); color:var(--primary); font-weight:700;">
          ${orders.length} Orders Under Track
        </span>
      </div>
      <p style="font-size:12px; color:var(--text-muted); margin-top:-6px; margin-bottom:16px;">
        Manage sequential 6-stage sales approvals. <strong>Quotation Approved</strong> status is strictly restricted to authorized Sales/Admin accounts.
      </p>

      <div style="display:flex; flex-direction:column; gap:16px;">
        ${orders.map(o => {
          const wf = o.salesWorkflow || {
            reqReceived: true,
            quotPrepared: true,
            quotApproved: o.quotationStatus === 'Approved',
            drawingSubmitted: true,
            drawingApproved: o.drawingApprovalStatus === 'Approved',
            orderConfirmed: o.status !== 'Work Order Pending'
          };

          const steps = [wf.reqReceived, wf.quotPrepared, wf.quotApproved, wf.drawingSubmitted, wf.drawingApproved, wf.orderConfirmed];
          const completedStepsCount = steps.filter(Boolean).length;
          const pct = Math.round((completedStepsCount / 6) * 100);

          let pendingAction = 'Order Confirmed & Active in Plant';
          if (!wf.reqReceived) pendingAction = 'Awaiting Client Requirement Specs';
          else if (!wf.quotPrepared) pendingAction = 'Prepare Commercial Quotation';
          else if (!wf.quotApproved) pendingAction = 'Pending Client Quotation Approval';
          else if (!wf.drawingSubmitted) pendingAction = 'Submit Engineering GA Drawings';
          else if (!wf.drawingApproved) pendingAction = 'Awaiting Client Drawing Approval Stamp';
          else if (!wf.orderConfirmed) pendingAction = 'Finalize PO Confirmation';

          return `
            <div class="sales-todo-card">
              <div class="flex-space-between flex-wrap" style="gap:10px; margin-bottom:8px;">
                <div class="flex-row">
                  <span class="badge badge-inprocess" style="font-weight:700;">${o.projectNumber}</span>
                  <strong style="font-size:14px; color:var(--text-main);">${o.clientName}</strong>
                  <span class="badge" style="background:var(--bg-app); border:1px solid var(--border-color); font-size:11px;">${o.clientCode}</span>
                </div>
                <div class="flex-row">
                  <span class="badge ${o.priority === 'Urgent' ? 'badge-urgent' : 'badge-pending'}"><i class="fas fa-flag"></i> ${o.priority || 'Medium Priority'}</span>
                  <span style="font-size:12px; color:var(--text-muted);"><i class="far fa-calendar-alt"></i> Due: <strong>${o.deliveryDate}</strong></span>
                </div>
              </div>

              <!-- Pending Action & Progress Bar -->
              <div class="flex-space-between" style="font-size:12px; margin-bottom:10px;">
                <div>
                  <span style="color:var(--text-muted);">Next Pending Action:</span>
                  <strong style="color:var(--warning); font-size:12.5px; margin-left:4px;"><i class="fas fa-clock"></i> ${pendingAction}</strong>
                </div>
                <div style="font-weight:700; color:var(--primary);">${pct}% Workflow Approved</div>
              </div>
              <div class="progress-bar-bg" style="height:6px; margin-bottom:12px;">
                <div class="progress-bar-fill" style="width:${pct}%; background:${pct === 100 ? 'var(--success)' : 'var(--primary)'};"></div>
              </div>

              <!-- Interactive Approval Checkboxes -->
              <div class="todo-checklist-grid">
                <label class="todo-check-item ${wf.reqReceived ? 'checked' : ''}">
                  <input type="checkbox" ${wf.reqReceived ? 'checked' : ''} onchange="toggleSalesStage('${o.id}', 'reqReceived', this.checked)">
                  <span>1. Requirement Received</span>
                </label>

                <label class="todo-check-item ${wf.quotPrepared ? 'checked' : ''}">
                  <input type="checkbox" ${wf.quotPrepared ? 'checked' : ''} onchange="toggleSalesStage('${o.id}', 'quotPrepared', this.checked)">
                  <span>2. Quotation Prepared</span>
                </label>

                <label class="todo-check-item ${wf.quotApproved ? 'checked' : ''}" style="${!canEditQuotApproved ? 'opacity:0.6;' : ''}" title="${!canEditQuotApproved ? 'Only Sales/Admin can edit Quotation Approval' : ''}">
                  <input type="checkbox" ${wf.quotApproved ? 'checked' : ''} ${!canEditQuotApproved ? 'disabled' : ''} onchange="toggleSalesStage('${o.id}', 'quotApproved', this.checked)">
                  <span>3. Quotation Approved ${!canEditQuotApproved ? '🔒' : ''}</span>
                </label>

                <label class="todo-check-item ${wf.drawingSubmitted ? 'checked' : ''}">
                  <input type="checkbox" ${wf.drawingSubmitted ? 'checked' : ''} onchange="toggleSalesStage('${o.id}', 'drawingSubmitted', this.checked)">
                  <span>4. Drawing Submitted</span>
                </label>

                <label class="todo-check-item ${wf.drawingApproved ? 'checked' : ''}">
                  <input type="checkbox" ${wf.drawingApproved ? 'checked' : ''} onchange="toggleSalesStage('${o.id}', 'drawingApproved', this.checked)">
                  <span>5. Drawing Approved</span>
                </label>

                <label class="todo-check-item ${wf.orderConfirmed ? 'checked' : ''}">
                  <input type="checkbox" ${wf.orderConfirmed ? 'checked' : ''} onchange="toggleSalesStage('${o.id}', 'orderConfirmed', this.checked)">
                  <span>6. Order Confirmed</span>
                </label>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function toggleSalesStage(orderId, stageKey, checked) {
  const res = window.storage.updateSalesWorkflowStage(orderId, stageKey, checked);
  if (res.success) {
    showToast(res.message, 'success');
    initDashboardView();
  } else {
    showToast(res.message, 'error');
    initDashboardView();
  }
}
window.toggleSalesStage = toggleSalesStage;

function markOrderFinalCompleted(orderId) {
  const order = window.storage.data.projects.find(p => p.id === orderId);
  if (order) {
    order.status = 'Completed';
    window.storage.logActivity(window.storage.getCurrentUser()?.name || 'Sales', 'Order Completed', `Final verification performed for ${order.projectNumber}`);
    window.storage.saveState();
    showToast(`Order ${order.projectNumber} marked as COMPLETED!`, 'success');
    initDashboardView();
  }
}

// -----------------------------------------------------------------------------
// 3. PURCHASE TEAM DASHBOARD (STRICT DATA MASKING APPLIED!)
// -----------------------------------------------------------------------------
function renderPurchaseDashboard(container) {
  const orders = window.storage.getOrdersForCurrentUser();

  container.innerHTML = `
    <!-- Masking Security Alert -->
    <div class="widget-card" style="margin-bottom:24px; border-left:4px solid var(--status-urgent);">
      <div class="flex-space-between">
        <div>
          <h4 style="color:var(--status-urgent); font-size:14px;"><i class="fas fa-user-shield"></i> Data Masking Active — Procurement Queue</h4>
          <p style="font-size:12px; color:var(--text-muted); margin-top:2px;">Client Names are automatically masked as per ERP compliance. Only Client Codes & Raw Material requirements are shown.</p>
        </div>
      </div>
    </div>

    <!-- Purchase Masked Order Queue -->
    <div class="widget-card">
      <div class="widget-header">
        <div class="widget-title"><i class="fas fa-cart-shopping" style="color:var(--accent);"></i> Raw Material Sourcing Queue</div>
      </div>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Client Code (Masked)</th>
              <th>PO Number</th>
              <th>Required Raw Materials / Items</th>
              <th>Purchase Stage Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map(o => {
              const stInfo = (o.stageStatuses && o.stageStatuses.Purchase) || { status: 'Pending', timestamp: '—' };
              const isDone = stInfo.status === 'Done';

              return `
                <tr onclick="openOrderOverview('${o.id}')" style="cursor:pointer;">
                  <td><strong style="color:var(--accent);">${o.projectNumber}</strong></td>
                  <td><span class="badge badge-waiting">${o.clientName}</span></td>
                  <td>${o.poNumber}</td>
                  <td style="font-size:12px; max-width:300px; font-weight:600;">${o.rawMaterialRequired || o.itemsList}</td>
                  <td><span class="badge ${isDone ? 'badge-completed' : 'badge-pending'}">${stInfo.status} (${stInfo.timestamp})</span></td>
                  <td onclick="event.stopPropagation();">
                    ${!isDone ? `<button class="btn btn-primary btn-sm" onclick="handleUpdateStage('${o.id}', 'Purchase', 'Done')"><i class="fas fa-check"></i> Mark Purchase Done</button>` : '<span class="badge badge-completed"><i class="fas fa-check-circle"></i> Verified</span>'}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// -----------------------------------------------------------------------------
// 4. PRODUCTION TEAM DASHBOARD (STRICT DATA MASKING APPLIED!)
// -----------------------------------------------------------------------------
function renderProductionDashboard(container) {
  const orders = window.storage.getOrdersForCurrentUser();

  container.innerHTML = `
    <!-- Masking Security Alert -->
    <div class="widget-card" style="margin-bottom:24px; border-left:4px solid var(--status-urgent);">
      <div>
        <h4 style="color:var(--status-urgent); font-size:14px;"><i class="fas fa-user-shield"></i> Data Masking Active — Shopfloor Manufacturing</h4>
        <p style="font-size:12px; color:var(--text-muted); margin-top:2px;">Client Names are masked. Follow technical specs and items list for Machining & Forging.</p>
      </div>
    </div>

    <!-- Active Production Work Orders -->
    <div class="widget-card">
      <div class="widget-header">
        <div class="widget-title"><i class="fas fa-gears" style="color:var(--accent);"></i> Shopfloor Production Work Orders</div>
      </div>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Work Order #</th>
              <th>Client Code (Masked)</th>
              <th>PO Number</th>
              <th>Items Specifications</th>
              <th>Target Delivery</th>
              <th>Production Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map(o => {
              const stInfo = (o.stageStatuses && o.stageStatuses.Production) || { status: 'Pending', timestamp: '—' };
              const isDone = stInfo.status === 'Done';

              return `
                <tr onclick="openOrderOverview('${o.id}')" style="cursor:pointer;">
                  <td><strong style="color:var(--accent);">${o.projectNumber}</strong></td>
                  <td><span class="badge badge-waiting">${o.clientName}</span></td>
                  <td>${o.poNumber}</td>
                  <td style="font-size:12px; max-width:300px; font-weight:600;">${o.itemsList}</td>
                  <td>${o.deliveryDate}</td>
                  <td><span class="badge ${isDone ? 'badge-completed' : 'badge-inprocess'}">${stInfo.status}</span></td>
                  <td onclick="event.stopPropagation();">
                    ${!isDone ? `<button class="btn btn-primary btn-sm" onclick="handleUpdateStage('${o.id}', 'Production', 'Done')"><i class="fas fa-check"></i> Mark Production Done</button>` : '<span class="badge badge-completed"><i class="fas fa-check-circle"></i> Complete</span>'}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// -----------------------------------------------------------------------------
// 5. QUALITY TESTING (QC) DASHBOARD (STRICT DATA MASKING APPLIED!)
// -----------------------------------------------------------------------------
function renderGCDashboard(container) {
  const orders = window.storage.getOrdersForCurrentUser();
  // Filter orders that require Quality Testing stage
  const qcOrders = orders.filter(o => !o.requiredStages || o.requiredStages.includes('Quality Testing'));

  container.innerHTML = `
    <!-- Masking Security Alert -->
    <div class="widget-card" style="margin-bottom:24px; border-left:4px solid var(--status-urgent);">
      <div>
        <h4 style="color:var(--status-urgent); font-size:14px;"><i class="fas fa-vial-circle-check"></i> QA / QC Lab Testing Queue</h4>
        <p style="font-size:12px; color:var(--text-muted); margin-top:2px;">Showing orders where Quality Testing stage was enabled. Verify Hydrostatic & Ultrasonic parameters.</p>
      </div>
    </div>

    <div class="widget-card">
      <div class="widget-header">
        <div class="widget-title"><i class="fas fa-vial-circle-check" style="color:var(--accent);"></i> Metallurgical & Pressure Testing Queue</div>
      </div>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Client Code (Masked)</th>
              <th>PO Number</th>
              <th>Items Specification</th>
              <th>Test Result Log</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${qcOrders.map(o => {
              const stInfo = (o.stageStatuses && o.stageStatuses['Quality Testing']) || { status: 'Pending', timestamp: '—' };
              const isDone = stInfo.status === 'Done';

              return `
                <tr onclick="openOrderOverview('${o.id}')" style="cursor:pointer;">
                  <td><strong style="color:var(--accent);">${o.projectNumber}</strong></td>
                  <td><span class="badge badge-waiting">${o.clientName}</span></td>
                  <td>${o.poNumber}</td>
                  <td style="font-size:12px; max-width:280px; font-weight:600;">${o.itemsList}</td>
                  <td><span class="badge ${isDone ? 'badge-completed' : 'badge-pending'}">${isDone ? 'Passed (150 BAR)' : 'Pending Testing'}</span></td>
                  <td onclick="event.stopPropagation();">
                    ${!isDone ? `<button class="btn btn-primary btn-sm" onclick="handleUpdateStage('${o.id}', 'Quality Testing', 'Done')"><i class="fas fa-check"></i> Log Pass & Testing Done</button>` : '<span class="badge badge-completed"><i class="fas fa-circle-check"></i> Testing Passed</span>'}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// -----------------------------------------------------------------------------
// 6. DISPATCH & LOGISTICS DASHBOARD (STRICT DATA MASKING APPLIED!)
// -----------------------------------------------------------------------------
function renderDispatchDashboard(container) {
  const orders = window.storage.getOrdersForCurrentUser();

  container.innerHTML = `
    <!-- Masking Security Alert -->
    <div class="widget-card" style="margin-bottom:24px; border-left:4px solid var(--status-urgent);">
      <div>
        <h4 style="color:var(--status-urgent); font-size:14px;"><i class="fas fa-truck-fast"></i> Dispatch Yard & Transport Queue</h4>
        <p style="font-size:12px; color:var(--text-muted); margin-top:2px;">Client Names are masked. Enter Lorry / AWB Tracking details to complete dispatch.</p>
      </div>
    </div>

    <div class="widget-card">
      <div class="widget-header">
        <div class="widget-title"><i class="fas fa-truck-ramp-box" style="color:var(--accent);"></i> Ready-to-Ship Queue & Logistics Details</div>
      </div>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Client Code (Masked)</th>
              <th>PO Number</th>
              <th>Items Quantity</th>
              <th>Transport Carrier & LR #</th>
              <th>Dispatch Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map(o => {
              const stInfo = (o.stageStatuses && o.stageStatuses.Dispatch) || { status: 'Pending', timestamp: '—' };
              const isDone = stInfo.status === 'Done';

              return `
                <tr onclick="openOrderOverview('${o.id}')" style="cursor:pointer;">
                  <td><strong style="color:var(--accent);">${o.projectNumber}</strong></td>
                  <td><span class="badge badge-waiting">${o.clientName}</span></td>
                  <td>${o.poNumber}</td>
                  <td style="font-size:12px; font-weight:600;">${o.itemsList}</td>
                  <td onclick="event.stopPropagation();">
                    ${!isDone ? `<input type="text" id="lr-input-${o.id}" class="form-control" placeholder="e.g. VRL LR-9921" style="padding:4px 8px; font-size:12px;">` : `<span style="font-weight:600; font-size:12px;">${stInfo.lrNumber || 'VRL Logistics (LR-9921)'}</span>`}
                  </td>
                  <td><span class="badge ${isDone ? 'badge-completed' : 'badge-dispatched'}">${stInfo.status}</span></td>
                  <td onclick="event.stopPropagation();">
                    ${!isDone ? `<button class="btn btn-primary btn-sm" onclick="handleDispatchSubmit('${o.id}')"><i class="fas fa-truck"></i> Mark Dispatched</button>` : '<span class="badge badge-completed"><i class="fas fa-circle-check"></i> Shipped</span>'}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// STAGE UPDATE HANDLER FOR DEPARTMENTS
function handleUpdateStage(orderId, stageName, newStatus) {
  const res = window.storage.updateOrderStage(orderId, stageName, newStatus);
  if (res.success) {
    showToast(`Updated stage "${stageName}" to ${newStatus}!`, 'success');
    initDashboardView();
  } else {
    showToast(res.message, 'error');
  }
}

function handleDispatchSubmit(orderId) {
  const lrInput = document.getElementById(`lr-input-${orderId}`);
  const lrVal = lrInput ? lrInput.value : 'VRL Freight (LR-9921)';

  const res = window.storage.updateOrderStage(orderId, 'Dispatch', 'Done', { lrNumber: lrVal });
  if (res.success) {
    showToast(`Shipment dispatched with LR: ${lrVal}`, 'success');
    initDashboardView();
  } else {
    showToast(res.message, 'error');
  }
}
