/**
 * DIAMOND FLANGES & FITTINGS PVT LTD - TASK DETAILS PAGE CONTROLLER
 */

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    initTaskDetailsView();
  }, 100);
});

function initTaskDetailsView() {
  const params = new URLSearchParams(window.location.search);
  const taskId = params.get('id') || 'tsk-1';

  const task = window.storage.data.tasks.find(t => t.id === taskId);
  const container = document.getElementById('task-details-content');
  if (!container) return;

  if (!task) {
    container.innerHTML = `<div style="padding:40px; text-align:center;"><h3>Task not found</h3><a href="tasks.html" class="btn btn-secondary">Back to Tasks</a></div>`;
    return;
  }

  const assignee = window.storage.data.users.find(u => u.id === task.assignedTo);
  const project = window.storage.data.projects.find(p => p.id === task.projectId);

  const pBadge = task.priority === 'Urgent' ? 'badge-urgent' : (task.priority === 'High' ? 'badge-pending' : 'badge-inprocess');

  container.innerHTML = `
    <div class="section-header">
      <div class="section-title-group">
        <div class="flex-row">
          <span class="badge ${pBadge}">${task.priority}</span>
          <h2>Task: ${task.title}</h2>
        </div>
        <p><i class="fas fa-tasks"></i> Status: <strong>${task.status}</strong> | Due Date: <strong>${task.dueDate}</strong></p>
      </div>
      <div class="section-actions">
        <a href="tasks.html" class="btn btn-secondary"><i class="fas fa-arrow-left"></i> Back to Tasks</a>
        <button class="btn btn-primary" onclick="markTaskCompleted('${task.id}')"><i class="fas fa-check"></i> Mark Complete</button>
      </div>
    </div>

    <!-- Task Split Grid -->
    <div class="grid-2col" style="margin-bottom:24px;">
      <div class="widget-card">
        <h3 style="font-size:16px; margin-bottom:14px;"><i class="fas fa-info-circle" style="color:var(--accent);"></i> Task Overview & Assignment</h3>
        <div style="font-size:13px; display:flex; flex-direction:column; gap:12px;">
          <div><strong>Task Title:</strong> ${task.title}</div>
          <div><strong>Priority:</strong> <span class="badge ${pBadge}">${task.priority}</span></div>
          <div><strong>Status:</strong> <span class="badge badge-waiting">${task.status}</span></div>
          <div>
            <strong>Assigned Person:</strong>
            <div class="flex-row" style="margin-top:4px;">
              <img src="${assignee ? assignee.avatar : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60'}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;" alt="">
              <span>${assignee ? assignee.name + ' (' + assignee.designation + ')' : 'Unassigned'}</span>
            </div>
          </div>
          <div><strong>Repeat Schedule:</strong> ${task.repeatSchedule || 'None'}</div>
          <div>
            <strong>Linked Work Order:</strong>
            ${project ? `<a href="project-details.html?id=${project.id}" style="font-weight:600;">${project.projectNumber} - ${project.clientName}</a>` : 'General Plant Task'}
          </div>
        </div>
      </div>

      <div class="widget-card">
        <h3 style="font-size:16px; margin-bottom:14px;"><i class="fas fa-align-left" style="color:var(--accent);"></i> Detailed Instructions & Notes</h3>
        <div style="font-size:13px; line-height:1.6; background:var(--bg-app); padding:14px; border-radius:var(--radius-sm); border:1px solid var(--border-color);">
          ${task.description || 'No additional instructions provided.'}
        </div>
      </div>
    </div>

    <!-- Comments & Activity History -->
    <div class="widget-card">
      <div class="widget-header">
        <div class="widget-title"><i class="fas fa-comments" style="color:var(--accent);"></i> Work Activity Log & Comments</div>
      </div>
      <div style="font-size:13px; display:flex; flex-direction:column; gap:12px;">
        <div style="padding:10px; background:var(--bg-app); border-radius:var(--radius-sm);">
          <strong>${assignee ? assignee.name : 'System'}:</strong> Updated status to "${task.status}" on ${task.dueDate}
        </div>
        <div class="flex-row">
          <input type="text" id="task-comment-input" class="form-control" placeholder="Add work note / comment...">
          <button class="btn btn-primary" onclick="addCommentSim()"><i class="fas fa-paper-plane"></i> Post</button>
        </div>
      </div>
    </div>
  `;
}

function markTaskCompleted(taskId) {
  const task = window.storage.data.tasks.find(t => t.id === taskId);
  if (task) {
    task.status = 'Completed';
    window.storage.saveState();
    showToast('Task marked as Completed!', 'success');
    initTaskDetailsView();
  }
}

function addCommentSim() {
  const input = document.getElementById('task-comment-input');
  if (input && input.value.trim()) {
    showToast('Work note appended to activity trail', 'success');
    input.value = '';
  }
}
