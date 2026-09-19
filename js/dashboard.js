/**
 * DIAMOND FLANGES & FITTINGS PVT LTD - DASHBOARD PAGE CONTROLLER
 */

document.addEventListener('DOMContentLoaded', () => {
  // Wait for layout injection
  setTimeout(() => {
    initDashboardView();
  }, 100);
});

function initDashboardView() {
  const tasks = window.storage.data.tasks;
  const projects = window.storage.data.projects;
  const users = window.storage.data.users;
  const currentUserId = window.storage.getCurrentUser()?.userId;
  const todayStr = new Date().toISOString().split('T')[0];

  // Render KPI Tasks Row
  const totalTasks = tasks.length;
  const dueTasks = tasks.filter(t => t.dueDate <= todayStr && t.status !== 'Completed').length;
  const assignedToMe = tasks.filter(t => t.assignedTo === currentUserId).length;
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const taskCompRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const kpiTasksRow = document.getElementById('kpi-row-tasks');
  if (kpiTasksRow) {
    kpiTasksRow.innerHTML = `
      <div class="kpi-card">
        <div class="kpi-header"><span class="kpi-title">Total Tasks</span><div class="kpi-icon blue"><i class="fas fa-list-check"></i></div></div>
        <div class="kpi-value">${totalTasks}</div>
        <div class="kpi-footer"><span class="kpi-trend up"><i class="fas fa-arrow-up"></i> Active</span><span class="text-muted">Target: 100%</span></div>
        <div class="progress-bar-bg"><div class="progress-bar-fill" style="width: 80%"></div></div>
      </div>
      <div class="kpi-card">
        <div class="kpi-header"><span class="kpi-title">Due Tasks</span><div class="kpi-icon amber"><i class="fas fa-exclamation-circle"></i></div></div>
        <div class="kpi-value" style="color:var(--status-pending);">${dueTasks}</div>
        <div class="kpi-footer"><span class="kpi-trend down"><i class="fas fa-clock"></i> Action required</span><span class="text-muted">Urgent</span></div>
        <div class="progress-bar-bg"><div class="progress-bar-fill" style="width: ${dueTasks > 0 ? 60 : 0}%; background:var(--status-pending);"></div></div>
      </div>
      <div class="kpi-card">
        <div class="kpi-header"><span class="kpi-title">Assigned To Me</span><div class="kpi-icon purple"><i class="fas fa-user-check"></i></div></div>
        <div class="kpi-value">${assignedToMe}</div>
        <div class="kpi-footer"><span class="kpi-trend up"><i class="fas fa-user"></i> My Queue</span><span class="text-muted">Active</span></div>
        <div class="progress-bar-bg"><div class="progress-bar-fill" style="width: 50%; background:#7e22ce;"></div></div>
      </div>
      <div class="kpi-card">
        <div class="kpi-header"><span class="kpi-title">Completed Tasks</span><div class="kpi-icon green"><i class="fas fa-check-circle"></i></div></div>
        <div class="kpi-value">${completedTasks}</div>
        <div class="kpi-footer"><span class="kpi-trend up"><i class="fas fa-chart-line"></i> ${taskCompRate}% Rate</span><span class="text-muted">Finished</span></div>
        <div class="progress-bar-bg"><div class="progress-bar-fill" style="width: ${taskCompRate}%; background:var(--status-completed);"></div></div>
      </div>
    `;
  }

  // Render KPI Projects Row
  const totalProjects = projects.length;
  const projectsDueToday = projects.filter(p => p.deliveryDate === todayStr).length;
  const activeProjects = projects.filter(p => p.status !== 'Completed').length;
  const completedProjects = projects.filter(p => p.status === 'Completed').length;
  const projectCompRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;

  const kpiProjectsRow = document.getElementById('kpi-row-projects');
  if (kpiProjectsRow) {
    kpiProjectsRow.innerHTML = `
      <div class="kpi-card">
        <div class="kpi-header"><span class="kpi-title">Total Projects</span><div class="kpi-icon cyan"><i class="fas fa-folder-open"></i></div></div>
        <div class="kpi-value">${totalProjects}</div>
        <div class="kpi-footer"><span class="kpi-trend up"><i class="fas fa-building"></i> 3 Key Clients</span><span class="text-muted">Pipeline</span></div>
        <div class="progress-bar-bg"><div class="progress-bar-fill" style="width: 100%; background:var(--status-dispatched);"></div></div>
      </div>
      <div class="kpi-card">
        <div class="kpi-header"><span class="kpi-title">Projects Due Today</span><div class="kpi-icon amber"><i class="fas fa-calendar-day"></i></div></div>
        <div class="kpi-value">${projectsDueToday}</div>
        <div class="kpi-footer"><span class="kpi-trend down"><i class="fas fa-truck"></i> Ready for dispatch</span><span class="text-muted">Today</span></div>
        <div class="progress-bar-bg"><div class="progress-bar-fill" style="width: ${projectsDueToday > 0 ? 100 : 0}%; background:#d97706;"></div></div>
      </div>
      <div class="kpi-card">
        <div class="kpi-header"><span class="kpi-title">Active In Process</span><div class="kpi-icon blue"><i class="fas fa-cogs"></i></div></div>
        <div class="kpi-value">${activeProjects}</div>
        <div class="kpi-footer"><span class="kpi-trend up"><i class="fas fa-sync"></i> Floor active</span><span class="text-muted">Production</span></div>
        <div class="progress-bar-bg"><div class="progress-bar-fill" style="width: 75%;"></div></div>
      </div>
      <div class="kpi-card">
        <div class="kpi-header"><span class="kpi-title">Completed Projects</span><div class="kpi-icon green"><i class="fas fa-flag-checkered"></i></div></div>
        <div class="kpi-value">${completedProjects}</div>
        <div class="kpi-footer"><span class="kpi-trend up"><i class="fas fa-percentage"></i> ${projectCompRate}% Delivered</span><span class="text-muted">Closed</span></div>
        <div class="progress-bar-bg"><div class="progress-bar-fill" style="width: ${projectCompRate}%; background:var(--status-completed);"></div></div>
      </div>
    `;
  }

  renderProjectStatusOverview(projects);
  renderUpcomingDeadlinesTable(tasks, users);
  renderMiniCalendar(tasks);
  renderDashboardActivities(window.storage.data.activities);
}

function renderProjectStatusOverview(projects) {
  const categories = [
    { label: 'Work Order Pending', color: '#ea580c' },
    { label: 'In Process', color: '#2563eb' },
    { label: 'Vendor Material Pending', color: '#d97706' },
    { label: 'Waiting Client Approval', color: '#7e22ce' },
    { label: 'Part Dispatched', color: '#0891b2' },
    { label: 'Completed', color: '#16a34a' }
  ];

  const counts = categories.map(cat => ({
    ...cat,
    count: projects.filter(p => p.status === cat.label).length
  }));

  const total = projects.length || 1;

  const barsContainer = document.getElementById('project-status-bars-container');
  if (barsContainer) {
    barsContainer.innerHTML = counts.map(item => {
      const pct = Math.round((item.count / total) * 100);
      return `
        <div>
          <div class="flex-space-between" style="font-size:12px; margin-bottom:4px;">
            <span style="font-weight:600; display:flex; align-items:center; gap:6px;">
              <span style="width:8px;height:8px;border-radius:50%;background:${item.color}"></span>
              ${item.label}
            </span>
            <span style="font-weight:700;">${item.count} (${pct}%)</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width:${pct}%; background:${item.color};"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  const canvas = document.getElementById('projectStatusDoughnutCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const outerRadius = 85;
  const innerRadius = 55;
  let startAngle = -0.5 * Math.PI;

  counts.forEach(item => {
    if (item.count === 0) return;
    const sliceAngle = (item.count / total) * 2 * Math.PI;

    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, startAngle, startAngle + sliceAngle);
    ctx.arc(centerX, centerY, innerRadius, startAngle + sliceAngle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = item.color;
    ctx.fill();

    startAngle += sliceAngle;
  });

  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-main').trim();
  ctx.font = 'bold 22px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(total.toString(), centerX, centerY - 6);
  ctx.font = '11px Inter, sans-serif';
  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-muted').trim();
  ctx.fillText('Projects', centerX, centerY + 14);
}

function renderUpcomingDeadlinesTable(tasks, users) {
  const tbody = document.getElementById('upcoming-deadlines-tbody');
  if (!tbody) return;

  const topTasks = tasks.slice(0, 5);
  tbody.innerHTML = topTasks.map(t => {
    const assignee = users.find(u => u.id === t.assignedTo);
    const pBadge = t.priority === 'Urgent' ? 'badge-urgent' : (t.priority === 'High' ? 'badge-pending' : 'badge-inprocess');

    return `
      <tr>
        <td style="font-weight:600;"><a href="task-details.html?id=${t.id}">${t.title}</a></td>
        <td>
          <div class="flex-row">
            <img src="${assignee ? assignee.avatar : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60'}" class="assignee-avatar" alt="">
            <span>${assignee ? assignee.name : 'Unassigned'}</span>
          </div>
        </td>
        <td style="font-weight:600;"><i class="far fa-calendar-alt"></i> ${t.dueDate}</td>
        <td><span class="badge ${pBadge}">${t.priority}</span></td>
        <td><a href="task-details.html?id=${t.id}" class="btn btn-secondary btn-sm">View</a></td>
      </tr>
    `;
  }).join('');
}

function renderMiniCalendar(tasks) {
  const container = document.getElementById('dashboard-mini-calendar');
  if (!container) return;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const deadlines = tasks.map(t => parseInt(t.dueDate.split('-')[2]));

  let daysHtml = '';
  for (let i = 0; i < firstDayIndex; i++) {
    daysHtml += `<div class="mini-day-cell"></div>`;
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === now.getDate();
    const hasDeadline = deadlines.includes(d);
    daysHtml += `
      <div class="mini-day-cell ${isToday ? 'today' : ''} ${hasDeadline ? 'has-deadline' : ''}">
        ${d}
      </div>
    `;
  }

  container.innerHTML = `
    <div class="calendar-mini-header">
      <div class="calendar-mini-title">${monthNames[month]} ${year}</div>
      <div style="font-size:11px; color:var(--text-muted);"><i class="fas fa-circle" style="color:var(--status-urgent); font-size:8px;"></i> Deadlines</div>
    </div>
    <div class="mini-calendar-grid">
      <div class="mini-day-label">S</div><div class="mini-day-label">M</div><div class="mini-day-label">T</div><div class="mini-day-label">W</div><div class="mini-day-label">T</div><div class="mini-day-label">F</div><div class="mini-day-label">S</div>
      ${daysHtml}
    </div>
  `;
}

function renderDashboardActivities(activities) {
  const container = document.getElementById('dashboard-activity-timeline');
  if (!container) return;

  const topActs = activities.slice(0, 4);
  const iconMap = { key: 'fas fa-key', 'file-up': 'fas fa-file-arrow-up', 'check-square': 'fas fa-check-square', truck: 'fas fa-truck-fast', building: 'fas fa-building' };

  container.innerHTML = topActs.map(act => `
    <div class="timeline-item">
      <div class="timeline-icon"><i class="${iconMap[act.icon] || 'fas fa-activity'}"></i></div>
      <div class="timeline-content">
        <div class="timeline-user">${act.user} <span style="font-weight:normal; color:var(--text-muted); font-size:12px;">${act.action}</span></div>
        <div class="timeline-desc">${act.details}</div>
        <div class="timeline-time">${act.timestamp}</div>
      </div>
    </div>
  `).join('');
}
