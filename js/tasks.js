/**
 * DIAMOND FLANGES & FITTINGS PVT LTD - TASKS & KANBAN CONTROLLER (V3)
 */

let currentTaskViewMode = 'kanban';

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    initTasksView();
  }, 100);
});

function initTasksView() {
  const users = window.storage.data.users || [];
  
  // Populate Assignee Filter
  const assFilter = document.getElementById('task-assignee-filter');
  if (assFilter) {
    assFilter.innerHTML = '<option value="">All Assignees</option>' + 
      users.map(u => `<option value="${u.id}">${u.name} (${u.role})</option>`).join('');
  }

  // Populate Assignee in Modal
  const modalAss = document.getElementById('task-assignee');
  if (modalAss) {
    modalAss.innerHTML = users.map(u => `<option value="${u.id}">${u.name} — ${u.role} (${u.department})</option>`).join('');
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
  const tasks = window.storage.data.tasks || [];
  const users = window.storage.data.users || [];

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
  const currentUser = window.storage.getCurrentUser();
  const canDelete = currentUser && (currentUser.role === 'Super Admin' || currentUser.role === 'Admin');

  const assignee = users.find(u => u.id === task.assignedTo);
  const pBadge = task.priority === 'Urgent' ? 'badge-urgent' : (task.priority === 'High' ? 'badge-pending' : 'badge-inprocess');
  const todayStr = new Date().toISOString().split('T')[0];
  const isOverdue = task.dueDate < todayStr && task.status !== 'Completed';

  return `
    <div class="kanban-card" draggable="true" data-task-id="${task.id}">
      <div class="flex-space-between">
        <div class="flex-row" style="gap:4px;">
          <span class="badge ${pBadge}">${task.priority}</span>
          ${task.department ? `<span class="badge" style="background:#f1f5f9; color:#475569;">${task.department}</span>` : ''}
        </div>
        <div class="flex-row" style="gap:4px;">
          ${canDelete ? `<button class="btn btn-sm" style="padding:2px 6px; background:#ef4444; color:#ffffff;" onclick="handleDeleteTask('${task.id}')" title="Delete Task (Admin Only)"><i class="fas fa-trash"></i></button>` : ''}
        </div>
      </div>
      <div class="kanban-card-title" style="margin-top:6px;">${task.title}</div>
      <div style="font-size:11px; color:var(--text-muted); display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
        ${task.description || 'No additional instructions provided.'}
      </div>
      <div class="kanban-card-meta" style="margin-top:8px;">
        <div class="flex-row">
          <img src="${assignee ? assignee.avatar : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60'}" class="assignee-avatar" title="${assignee ? assignee.name : 'Unassigned'}">
          <span style="font-size:11px;">${assignee ? assignee.name.split(' ')[0] : 'Unassigned'}</span>
        </div>
        <span style="color:${isOverdue ? 'var(--status-urgent)' : 'inherit'}; font-weight:${isOverdue ? '700' : 'normal'}; font-size:11px;">
          <i class="far fa-calendar-alt"></i> ${task.dueDate}
        </span>
      </div>
    </div>
  `;
}

function renderTaskListHtml() {
  const tasks = window.storage.data.tasks || [];
  const users = window.storage.data.users || [];
  const currentUser = window.storage.getCurrentUser();
  const canDelete = currentUser && (currentUser.role === 'Super Admin' || currentUser.role === 'Admin');

  return `
    <div class="widget-card">
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Task Title</th>
              <th>Dept</th>
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
                  <td style="font-weight:600;">${t.title}</td>
                  <td><span class="badge" style="background:#f1f5f9; color:#475569;">${t.department || 'General'}</span></td>
                  <td><span class="badge ${t.priority === 'Urgent' ? 'badge-urgent' : 'badge-inprocess'}">${t.priority}</span></td>
                  <td>${assignee ? assignee.name : 'Unassigned'}</td>
                  <td>${t.dueDate}</td>
                  <td><span class="badge badge-waiting">${t.status}</span></td>
                  <td>
                    <div class="flex-row" style="gap:6px;">
                      ${canDelete ? `<button class="btn btn-sm" style="background:#ef4444; color:#fff;" onclick="handleDeleteTask('${t.id}')"><i class="fas fa-trash"></i> Delete</button>` : '<span style="font-size:12px; color:var(--text-muted);">View Only</span>'}
                    </div>
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

  const filtered = (window.storage.data.tasks || []).filter(t => {
    const matchQ = t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q);
    const matchPrio = prio === '' || t.priority === prio;
    const matchAss = ass === '' || t.assignedTo === ass;
    return matchQ && matchPrio && matchAss;
  });

  const wrapper = document.getElementById('tasks-content-wrapper');
  if (!wrapper) return;

  if (currentTaskViewMode === 'kanban') {
    const users = window.storage.data.users || [];
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

function handleDeleteTask(taskId) {
  if (!confirm('Are you sure you want to delete this task?')) return;
  const res = window.storage.deleteTask(taskId);
  if (res.success) {
    showToast(res.message, 'success');
    renderTasksContent();
  } else {
    showToast(res.message, 'error');
  }
}

function handleSaveTask(e) {
  if (e) e.preventDefault();
  const id = document.getElementById('task-id')?.value;
  const title = document.getElementById('task-title')?.value;
  const dept = document.getElementById('task-dept-assign')?.value;
  const priority = document.getElementById('task-priority')?.value;
  const assignedTo = document.getElementById('task-assignee')?.value;
  const dueDate = document.getElementById('task-due-date')?.value;
  const description = document.getElementById('task-desc')?.value;

  if (!title || !dueDate) {
    showToast('Please fill in Task Title and Due Date', 'error');
    return;
  }

  const currentUser = window.storage.getCurrentUser();

  if (id) {
    const existing = window.storage.data.tasks.find(t => t.id === id);
    if (existing) {
      existing.title = title;
      existing.department = dept;
      existing.priority = priority;
      existing.assignedTo = assignedTo;
      existing.dueDate = dueDate;
      existing.description = description;
      window.storage.logActivity(currentUser?.name || 'User', 'Task Updated', `Updated task "${title}"`);
    }
  } else {
    const newTask = {
      id: 'TSK-' + Math.floor(1000 + Math.random() * 9000),
      title: title,
      department: dept || 'Production',
      assignedTo: assignedTo || currentUser?.id || 'usr-1',
      priority: priority || 'Medium',
      dueDate: dueDate,
      status: 'To Do',
      description: description || ''
    };
    window.storage.data.tasks.unshift(newTask);
    window.storage.logActivity(currentUser?.name || 'User', 'Task Created', `Created task "${title}" for ${dept} department`);
  }

  window.storage.saveState();
  closeModal('add-task-modal');
  showToast('Task saved successfully!', 'success');

  document.getElementById('task-form')?.reset();
  if (document.getElementById('task-id')) document.getElementById('task-id').value = '';

  if (typeof renderTasksContent === 'function') {
    renderTasksContent();
  }
}

window.handleDeleteTask = handleDeleteTask;
window.handleSaveTask = handleSaveTask;
