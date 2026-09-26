/**
 * DIAMOND FLANGES & FITTINGS PVT LTD - CALENDAR PAGE CONTROLLER
 */

let currentCalendarDate = new Date();

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    initCalendarView();
  }, 100);
});

function initCalendarView() {
  renderFullMonthGrid();
}

function changeCalendarMonth(delta) {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
  renderFullMonthGrid();
}

function renderFullMonthGrid() {
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const titleEl = document.getElementById('calendar-month-title');
  if (titleEl) titleEl.textContent = `${monthNames[month]} ${year}`;

  const container = document.getElementById('full-calendar-grid');
  if (!container) return;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const events = window.storage.data.calendarEvents;
  const tasks = window.storage.data.tasks;

  let daysHtml = '';
  for (let i = 0; i < firstDayIndex; i++) {
    daysHtml += `<div style="min-height:95px; background:var(--bg-app); border:1px solid var(--border-color); opacity:0.4;"></div>`;
  }

  const now = new Date();
  const isCurrentMonthYear = now.getFullYear() === year && now.getMonth() === month;

  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = isCurrentMonthYear && d === now.getDate();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    const dayEvts = events.filter(e => e.date === dateStr);
    const dayTasks = tasks.filter(t => t.dueDate === dateStr);

    daysHtml += `
      <div style="min-height:95px; background:var(--bg-surface); border:1px solid var(--border-color); padding:6px; font-size:12px; display:flex; flex-direction:column; gap:4px; ${isToday ? 'border:2px solid var(--accent);' : ''}">
        <div class="flex-space-between" style="font-weight:700;">
          <span style="${isToday ? 'background:var(--accent); color:#ffffff; padding:2px 6px; border-radius:50%; font-size:11px;' : ''}">${d}</span>
        </div>

        ${dayEvts.map(ev => `
          <div style="background:${ev.color || '#2563eb'}; color:#ffffff; font-size:10px; padding:2px 4px; border-radius:3px; font-weight:600; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;" title="${ev.title}">
            ${ev.time ? ev.time + ' ' : ''}${ev.title}
          </div>
        `).join('')}

        ${dayTasks.map(t => `
          <div style="background:rgba(217, 119, 6, 0.2); color:#b45309; border:1px solid #fef3c7; font-size:10px; padding:2px 4px; border-radius:3px; font-weight:600; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;" title="${t.title}">
            📋 ${t.title}
          </div>
        `).join('')}
      </div>
    `;
  }

  container.innerHTML = `
    <div style="display:grid; grid-template-columns: repeat(7, 1fr); text-align:center; font-weight:700; font-size:12px; background:var(--bg-app); border-bottom:1px solid var(--border-color);">
      <div style="padding:8px;">SUN</div><div style="padding:8px;">MON</div><div style="padding:8px;">TUE</div><div style="padding:8px;">WED</div><div style="padding:8px;">THU</div><div style="padding:8px;">FRI</div><div style="padding:8px;">SAT</div>
    </div>
    <div style="display:grid; grid-template-columns: repeat(7, 1fr);">
      ${daysHtml}
    </div>
  `;
}
