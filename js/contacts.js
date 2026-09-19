/**
 * DIAMOND FLANGES & FITTINGS PVT LTD - CONTACTS REGISTRY CONTROLLER
 */

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    initContactsView();
  }, 100);
});

function initContactsView() {
  const tbody = document.getElementById('contacts-table-tbody');
  if (!tbody) return;

  let allContacts = [];
  window.storage.data.companies.forEach(comp => {
    comp.contacts.forEach(cnt => {
      allContacts.push({
        ...cnt,
        companyName: comp.name,
        companyCode: comp.code,
        companyId: comp.id
      });
    });
  });

  tbody.innerHTML = allContacts.map(cnt => `
    <tr>
      <td>
        <div class="flex-row">
          <img src="${cnt.photo}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;" alt="">
          <span style="font-weight:600;">${cnt.title} ${cnt.firstName} ${cnt.lastName}</span>
        </div>
      </td>
      <td>
        <a href="company-details.html?id=${cnt.companyId}">
          <span class="badge badge-inprocess">${cnt.companyCode}</span> ${cnt.companyName}
        </a>
      </td>
      <td style="color:var(--text-muted);">${cnt.position}</td>
      <td>
        <a href="tel:${cnt.mobile}" style="margin-right:8px;"><i class="fas fa-phone" style="color:#16a34a;"></i> ${cnt.mobile}</a>
        <a href="https://wa.me/${cnt.whatsapp.replace(/\D/g,'')}" target="_blank"><i class="fab fa-whatsapp" style="color:#25D366;"></i></a>
      </td>
      <td><a href="mailto:${cnt.officialEmail}">${cnt.officialEmail}</a></td>
      <td style="font-size:11px; color:var(--text-muted);">
        🎂 ${cnt.dob || 'N/A'} | 💍 ${cnt.anniversary || 'N/A'}
      </td>
    </tr>
  `).join('');
}
