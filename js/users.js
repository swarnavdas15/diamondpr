/**
 * DIAMOND FLANGES & FITTINGS PVT LTD - USERS & ORG CHART CONTROLLER
 */

let currentUserTab = 'list';

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    initUsersView();
  }, 100);
});

function initUsersView() {
  renderUsersContent();
}

function switchUserTab(tab) {
  currentUserTab = tab;
  const btnL = document.getElementById('user-tab-btn-list');
  const btnO = document.getElementById('user-tab-btn-org');
  if (btnL && btnO) {
    if (tab === 'list') {
      btnL.classList.add('active');
      btnO.classList.remove('active');
    } else {
      btnO.classList.add('active');
      btnL.classList.remove('active');
    }
  }
  renderUsersContent();
}

function renderUsersContent() {
  const container = document.getElementById('users-tab-content');
  if (!container) return;

  if (currentUserTab === 'list') {
    container.innerHTML = renderUserListHtml();
  } else {
    container.innerHTML = renderOrgChartHtml();
  }
}

function renderUserListHtml() {
  const users = window.storage.data.users;

  return `
    <div class="widget-card">
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Username & Email</th>
              <th>Department & Designation</th>
              <th>Role</th>
              <th>Reporting Manager</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => {
              const mgr = users.find(m => m.id === u.managerId);
              return `
                <tr>
                  <td>
                    <div class="flex-row">
                      <img src="${u.avatar}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;" alt="">
                      <div>
                        <div style="font-weight:600;">${u.name}</div>
                        <div style="font-size:11px; color:var(--text-muted);">📞 ${u.mobile}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div><strong>${u.username}</strong></div>
                    <div style="font-size:11px; color:var(--text-muted);">${u.email}</div>
                  </td>
                  <td>
                    <div style="font-weight:600;">${u.designation}</div>
                    <div style="font-size:11px; color:var(--text-muted);">${u.department}</div>
                  </td>
                  <td><span class="badge badge-inprocess">${u.role}</span></td>
                  <td style="font-size:12px;">${mgr ? mgr.name : '— (Top Executive)'}</td>
                  <td><span class="badge ${u.status === 'Active' ? 'badge-completed' : 'badge-urgent'}">${u.status}</span></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderOrgChartHtml() {
  const users = window.storage.data.users;

  const ceo = users.find(u => !u.managerId || u.role === 'Super Admin') || users[0];
  const managers = users.filter(u => u.managerId === ceo.id);

  return `
    <div class="org-chart-wrapper">
      <div class="org-tree">
        <div class="org-node ceo">
          <span class="badge badge-inprocess" style="position:absolute; top:-10px; font-size:10px;">TOP EXECUTIVE</span>
          <img src="${ceo.avatar}" class="org-avatar" alt="">
          <div class="org-name">${ceo.name}</div>
          <div class="org-role">${ceo.designation}</div>
          <div style="font-size:11px; color:var(--text-muted);">📞 ${ceo.mobile}</div>
        </div>

        <div class="org-children">
          ${managers.map(mgr => {
            const subordinates = users.filter(u => u.managerId === mgr.id);
            return `
              <div style="display:flex; flex-direction:column; align-items:center; gap:20px;">
                <div class="org-node">
                  <img src="${mgr.avatar}" class="org-avatar" alt="">
                  <div class="org-name">${mgr.name}</div>
                  <div class="org-role">${mgr.designation}</div>
                  <div style="font-size:11px; color:var(--text-muted);">${mgr.department}</div>
                </div>

                ${subordinates.length > 0 ? `
                  <div class="org-children">
                    ${subordinates.map(emp => `
                      <div class="org-node">
                        <img src="${emp.avatar}" class="org-avatar" alt="">
                        <div class="org-name">${emp.name}</div>
                        <div class="org-role">${emp.designation}</div>
                        <div style="font-size:11px; color:var(--text-muted);">📞 ${emp.mobile}</div>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}
