/**
 * DIAMOND FLANGES & FITTINGS PVT LTD - COMPANY DETAILS PAGE CONTROLLER
 */

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    initCompanyDetailsView();
  }, 100);
});

function initCompanyDetailsView() {
  const params = new URLSearchParams(window.location.search);
  const companyId = params.get('id') || 'comp-1';

  const company = window.storage.data.companies.find(c => c.id === companyId);
  const container = document.getElementById('company-details-content');
  if (!container) return;

  if (!company) {
    container.innerHTML = `<div style="padding:40px; text-align:center;"><h3>Company not found</h3><a href="companies.html" class="btn btn-secondary">Back to Companies</a></div>`;
    return;
  }

  // Find linked projects
  const linkedProjects = window.storage.data.projects.filter(p => p.clientName.toLowerCase().includes(company.name.toLowerCase().split(' ')[0]));

  container.innerHTML = `
    <div class="section-header">
      <div class="section-title-group">
        <div class="flex-row">
          <span class="badge badge-inprocess">${company.code}</span>
          <h2>${company.name}</h2>
        </div>
        <p><i class="fas fa-industry"></i> Industry: ${company.industry} | Rating: ${company.rating || 'Tier 1'}</p>
      </div>
      <div class="section-actions">
        <a href="companies.html" class="btn btn-secondary"><i class="fas fa-arrow-left"></i> Back to Companies</a>
      </div>
    </div>

    <!-- Company Overview Cards Grid -->
    <div class="grid-2col" style="margin-bottom:24px;">
      <div class="widget-card">
        <h3 style="font-size:16px; margin-bottom:14px;"><i class="fas fa-building" style="color:var(--accent);"></i> Account Overview & Tax Details</h3>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; font-size:13px;">
          <div><strong>GSTIN:</strong> ${company.gstin}</div>
          <div><strong>PAN:</strong> ${company.pan}</div>
          <div><strong>Account Code:</strong> ${company.code}</div>
          <div><strong>Website:</strong> <a href="https://${company.website}" target="_blank">${company.website}</a></div>
        </div>
      </div>

      <div class="widget-card">
        <h3 style="font-size:16px; margin-bottom:14px;"><i class="fas fa-map-marker-alt" style="color:var(--status-urgent);"></i> Registered Locations & Works (${company.addresses.length})</h3>
        ${company.addresses.map(a => `
          <div style="font-size:12px; margin-bottom:8px; padding-bottom:8px; border-bottom:1px solid var(--border-color);">
            <strong style="color:var(--accent);">${a.type}:</strong> ${a.address}, ${a.city}, ${a.state} - ${a.pin} (GST: ${a.gstin})
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Key Executive Contacts Table -->
    <div class="widget-card" style="margin-bottom:24px;">
      <div class="widget-header">
        <div class="widget-title"><i class="fas fa-address-book" style="color:var(--accent);"></i> Executive Contacts & Decision Makers</div>
      </div>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Contact Name</th>
              <th>Designation</th>
              <th>Mobile & WhatsApp</th>
              <th>Official Email</th>
              <th>Key Dates</th>
            </tr>
          </thead>
          <tbody>
            ${company.contacts.map(cnt => `
              <tr>
                <td>
                  <div class="flex-row">
                    <img src="${cnt.photo}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;" alt="">
                    <span style="font-weight:600;">${cnt.title} ${cnt.firstName} ${cnt.lastName}</span>
                  </div>
                </td>
                <td style="color:var(--text-muted);">${cnt.position}</td>
                <td>
                  <a href="tel:${cnt.mobile}" style="margin-right:8px;"><i class="fas fa-phone" style="color:#16a34a;"></i> ${cnt.mobile}</a>
                  <a href="https://wa.me/${cnt.whatsapp.replace(/\D/g,'')}" target="_blank"><i class="fab fa-whatsapp" style="color:#25D366;"></i></a>
                </td>
                <td><a href="mailto:${cnt.officialEmail}">${cnt.officialEmail}</a></td>
                <td style="font-size:11px; color:var(--text-muted);">🎂 ${cnt.dob || 'N/A'} | 💍 ${cnt.anniversary || 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Active Projects Table -->
    <div class="widget-card">
      <div class="widget-header">
        <div class="widget-title"><i class="fas fa-folder-open" style="color:var(--accent);"></i> Linked Manufacturing Work Orders (${linkedProjects.length})</div>
      </div>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Project #</th>
              <th>PO Number</th>
              <th>Delivery Date</th>
              <th>Value (INR)</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${linkedProjects.map(p => `
              <tr>
                <td><strong style="color:var(--accent);">${p.projectNumber}</strong></td>
                <td>${p.poNumber}</td>
                <td>${p.deliveryDate}</td>
                <td style="font-weight:700;">₹${p.value.toLocaleString('en-IN')}</td>
                <td><span class="badge badge-inprocess">${p.status}</span></td>
                <td><a href="project-details.html?id=${p.id}" class="btn btn-secondary btn-sm">View Details</a></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}
