/**
 * DIAMOND FLANGES & FITTINGS PVT LTD - TASKS & KANBAN CONTROLLER
 */

let currentTaskViewMode = 'kanban';

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    initTasksView();
  }, 100);
});

function initTasksView() {
  // Populate Assignee Filter
  const assFilter = document.getElementById('task-assignee-filter');
  if (assFilter) {
    assFilter.innerHTML = '<option value="">All Assignees</option>' + 
      window.storage.data.users.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
  }

  renderTasksContent();
}

function switchTaskView(mode) {
  currentTaskViewMode = mode;
  const btnK = document.getElementById('task-view-btn-kanban');
  const btnL = document.getElementById('task-view-btn-list');
  if (btnK && btnL) {
    if (mode === 'kanban') {
      btnK.classList.add('active');
      btnL.classList.remove('active');
    } else {
      btnL.classList.add('active');
      btnK.classList.remove('active');
    }
  }
  renderTasksContent();
}

function renderTasksContent() {
  const wrapper = document.getElementById('tasks-content-wrapper');
  if (!wrapper) return;

  if (currentTaskViewMode === 'kanban') {
    wrapper.innerHTML = renderKanbanBoardHtml();
    setupKanbanDragAndDrop();
  } else {
    wrapper.innerHTML = renderTaskListHtml();
  }
}

function renderKanbanBoardHtml() {
  const tasks = window.storage.data.tasks;
  const users = window.storage.data.users;

  const columns = [
    { key: 'To Do', title: 'To Do', color: '#ea580c' },
    { key: 'In Progress', title: 'In Progress', color: '#2563eb' },
    { key: 'Waiting', title: 'Waiting (Vendor / Client)', color: '#d97706' },
    { key: 'Completed', title: 'Completed', color: '#16a34a' }
  ];

  return `
    <div class="kanban-board-container">
      ${columns.map(col => {
        const colTasks = tasks.filter(t => {
          if (col.key === 'Waiting') {
            return t.status === 'Waiting on Vendor' || t.status === 'Waiting on Client' || t.status === 'Waiting';
          }
          return t.status === col.key;
        });

        return `
          <div class="kanban-column" data-status="${col.key}">
            <div class="kanban-column-header">
              <div class="kanban-title">
                <span style="width:10px;height:10px;border-radius:50%;background:${col.color}"></span>
                ${col.title}
              </div>
              <span class="kanban-count">${colTasks.length}</span>
            </div>
            
            <div class="kanban-cards-wrapper" data-status="${col.key}">
              ${colTasks.map(t => renderKanbanCard(t, users)).join('')}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderKanbanCard(task, users) {
  const assignee = users.find(u => u.id === task.assignedTo);
  const pBadge = task.priority === 'Urgent' ? 'badge-urgent' : (task.priority === 'High' ? 'badge-pending' : 'badge-inprocess');
  const todayStr = new Date().toISOString().split('T')[0];
  const isOverdue = task.dueDate < todayStr && task.status !== 'Completed';

  return `
    <div class="kanban-card" draggable="true" data-task-id="${task.id}">
      <div class="flex-space-between">
        <span class="badge ${pBadge}">${task.priority}</span>
        <a href="task-details.html?id=${task.id}" class="btn btn-secondary btn-sm" style="padding:2px 6px;" title="View Details"><i class="fas fa-eye"></i></a>
      </div>
      <div class="kanban-card-title"><a href="task-details.html?id=${task.id}">${task.title}</a></div>
      <div style="font-size:11px; color:var(--text-muted); display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
        ${task.description}
      </div>
      <div class="kanban-card-meta">
        <div class="flex-row">
          <img src="${assignee ? assignee.avatar : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60'}" class="assignee-avatar" title="${assignee ? assignee.name : 'Unassigned'}">
          <span style="font-size:11px;">${assignee ? assignee.name.split(' ')[0] : 'Unassigned'}</span>
        </div>
        <span style="color:${isOverdue ? 'var(--status-urgent)' : 'inherit'}; font-weight:${isOverdue ? '700' : 'normal'};">
          <i class="far fa-calendar-alt"></i> ${task.dueDate}
        </span>
      </div>
    </div>
  `;
}

function renderTaskListHtml() {
  const tasks = window.storage.data.tasks;
  const users = window.storage.data.users;

  return `
    <div class="widget-card">
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Task Title</th>
              <th>Priority</th>
              <th>Assigned To</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${tasks.map(t => {
              const assignee = users.find(u => u.id === t.assignedTo);
              return `
                <tr>
                  <td style="font-weight:600;"><a href="task-details.html?id=${t.id}">${t.title}</a></td>
                  <td><span class="badge ${t.priority === 'Urgent' ? 'badge-urgent' : 'badge-inprocess'}">${t.priority}</span></td>
                  <td>${assignee ? assignee.name : 'Unassigned'}</td>
                  <td>${t.dueDate}</td>
                  <td><span class="badge badge-waiting">${t.status}</span></td>
                  <td>
                    <a href="task-details.html?id=${t.id}" class="btn btn-secondary btn-sm"><i class="fas fa-eye"></i> Details</a>
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

function setupKanbanDragAndDrop() {
  const cards = document.querySelectorAll('.kanban-card');
  const dropZones = document.querySelectorAll('.kanban-cards-wrapper');

  cards.forEach(card => {
    card.addEventListener('dragstart', (e) => {
      card.classList.add('dragging');
      e.dataTransfer.setData('text/plain', card.dataset.taskId);
    });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
  });

  dropZones.forEach(zone => {
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('drag-over');
    });

    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));

    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      const taskId = e.dataTransfer.getData('text/plain');
      const newStatus = zone.dataset.status;

      const task = window.storage.data.tasks.find(t => t.id === taskId);
      if (task) {
        task.status = newStatus === 'Waiting' ? 'Waiting on Vendor' : newStatus;
        window.storage.logActivity(window.storage.getCurrentUser()?.name || 'User', 'Task Dragged', `Moved "${task.title}" to ${newStatus}`);
        window.storage.saveState();
        showToast(`Task status updated to ${newStatus}`, 'success');
        renderTasksContent();
      }
    });
  });
}

function filterTasksContent() {
  const q = document.getElementById('task-search-input')?.value.toLowerCase() || '';
  const prio = document.getElementById('task-priority-filter')?.value || '';
  const ass = document.getElementById('task-assignee-filter')?.value || '';

  const filtered = window.storage.data.tasks.filter(t => {
    const matchQ = t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
    const matchPrio = prio === '' || t.priority === prio;
    const matchAss = ass === '' || t.assignedTo === ass;
    return matchQ && matchPrio && matchAss;
  });

  const wrapper = document.getElementById('tasks-content-wrapper');
  if (!wrapper) return;

  if (currentTaskViewMode === 'kanban') {
    const users = window.storage.data.users;
    document.querySelectorAll('.kanban-column').forEach(col => {
      const status = col.dataset.status;
      const colTasks = filtered.filter(t => {
        if (status === 'Waiting') return t.status === 'Waiting on Vendor' || t.status === 'Waiting on Client' || t.status === 'Waiting';
        return t.status === status;
      });

      const cardsWrap = col.querySelector('.kanban-cards-wrapper');
      const countEl = col.querySelector('.kanban-count');
      if (countEl) countEl.textContent = colTasks.length;
      if (cardsWrap) cardsWrap.innerHTML = colTasks.map(t => renderKanbanCard(t, users)).join('');
    });
    setupKanbanDragAndDrop();
  }
}
