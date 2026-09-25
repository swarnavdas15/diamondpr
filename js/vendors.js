/**
 * DIAMOND FLANGES & FITTINGS PVT LTD - VENDORS PAGE CONTROLLER
 */

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    initVendorsView();
  }, 100);
});

function initVendorsView() {
  const tbody = document.getElementById('vendors-table-tbody');
  if (!tbody) return;

  tbody.innerHTML = window.storage.data.vendors.map(v => `
    <tr>
      <td><strong style="color:var(--accent);">${v.code}</strong></td>
      <td style="font-weight:600;">${v.name}</td>
      <td>
        <div>${v.contactPerson}</div>
        <div style="font-size:11px; color:var(--text-muted);">📞 ${v.phone} | ✉️ ${v.email}</div>
      </td>
      <td style="max-width:300px; font-size:12px;">${v.materialSupplied}</td>
      <td><span style="color:#d97706; font-weight:700;">★ ${v.rating || '4.5'}</span></td>
      <td><span class="badge badge-completed">${v.status}</span></td>
    </tr>
  `).join('');
}

function exportVendorsCSV() {
  let csv = 'Vendor Code,Vendor Name,Contact Person,Phone,Email,Material Supplied,Rating,Status\n';
  window.storage.data.vendors.forEach(v => {
    csv += `"${v.code}","${v.name}","${v.contactPerson}","${v.phone}","${v.email}","${v.materialSupplied}",${v.rating},"${v.status}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', 'Diamond_ERP_Vendors_Directory.csv');
  a.click();
  showToast('Exported vendor directory to CSV', 'success');
}
