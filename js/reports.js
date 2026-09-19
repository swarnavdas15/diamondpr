/**
 * DIAMOND FLANGES & FITTINGS PVT LTD - REPORTS PAGE CONTROLLER
 */

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    initReportsView();
  }, 100);
});

function initReportsView() {
  const projects = window.storage.data.projects;
  const totalRevenue = projects.reduce((acc, p) => acc + p.value, 0);

  const revEl = document.getElementById('reports-total-revenue');
  if (revEl) revEl.textContent = `₹${totalRevenue.toLocaleString('en-IN')}`;

  drawRevenueBarChart(projects);
  drawTaskPriorityPieChart(window.storage.data.tasks);
}

function drawRevenueBarChart(projects) {
  const canvas = document.getElementById('revenueBarChartCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const labels = projects.map(p => p.projectNumber);
  const data = projects.map(p => p.value / 100000);

  const padding = 40;
  const chartHeight = canvas.height - padding * 2;
  const chartWidth = canvas.width - padding * 2;
  const barWidth = (chartWidth / data.length) - 16;
  const maxVal = Math.max(...data, 100);

  ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--border-color').trim();
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, canvas.height - padding);
  ctx.lineTo(canvas.width - padding, canvas.height - padding);
  ctx.stroke();

  data.forEach((val, i) => {
    const x = padding + i * (barWidth + 16) + 8;
    const barH = (val / maxVal) * chartHeight;
    const y = canvas.height - padding - barH;

    ctx.fillStyle = '#2563eb';
    ctx.fillRect(x, y, barWidth, barH);

    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-muted').trim();
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(labels[i].replace('PRJ-2026-', '#'), x + barWidth / 2, canvas.height - padding + 14);
    ctx.fillText(`₹${val.toFixed(1)}L`, x + barWidth / 2, y - 6);
  });
}

function drawTaskPriorityPieChart(tasks) {
  const canvas = document.getElementById('taskPriorityPieCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const categories = [
    { label: 'Urgent', count: tasks.filter(t => t.priority === 'Urgent').length, color: '#dc2626' },
    { label: 'High', count: tasks.filter(t => t.priority === 'High').length, color: '#ea580c' },
    { label: 'Medium', count: tasks.filter(t => t.priority === 'Medium').length, color: '#2563eb' },
    { label: 'Low', count: tasks.filter(t => t.priority === 'Low').length, color: '#16a34a' }
  ];

  const total = tasks.length || 1;
  let startAngle = -0.5 * Math.PI;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 80;

  categories.forEach(item => {
    if (item.count === 0) return;
    const sliceAngle = (item.count / total) * 2 * Math.PI;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = item.color;
    ctx.fill();

    startAngle += sliceAngle;
  });
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
  a.setAttribute('download', 'Diamond_ERP_Analytics_Report.csv');
  a.click();
  showToast('Exported report analytics to CSV', 'success');
}
