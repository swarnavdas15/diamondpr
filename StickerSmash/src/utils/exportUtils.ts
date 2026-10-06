import { Platform } from 'react-native';
import { formatAppDate } from './dateFormatter';

/**
 * Universal Export Utilities for Diamond Flanges ERP
 * Supports Export to Excel (.csv format with UTF-8 BOM) and Export to PDF (Print Preview HTML window).
 */

export interface ExportDataPayload {
  title: string;
  subtitle?: string;
  filename: string;
  headers: string[];
  rows: (string | number | boolean | null | undefined)[][];
}

/**
 * Export data to Excel (CSV with UTF-8 BOM for proper Excel rendering)
 */
export const exportToExcel = (payload: ExportDataPayload) => {
  const { filename, headers, rows } = payload;
  
  // Format cells safely escaping quotes and commas
  const sanitizeCell = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerRow = headers.map(sanitizeCell).join(',');
  const bodyRows = rows.map(row => row.map(sanitizeCell).join(',')).join('\n');
  const csvContent = '\uFEFF' + headerRow + '\n' + bodyRows;

  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.document) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}_${formatAppDate(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    console.log('Exporting CSV data:', csvContent);
  }
};

/**
 * Export data to PDF via a clean, printable HTML document window
 */
export const exportToPDF = (payload: ExportDataPayload) => {
  const { title, subtitle, headers, rows, filename } = payload;

  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.document) {
    console.log('PDF export is available on Web runtime.');
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to generate and view PDF reports.');
    return;
  }

  const generatedDate = formatAppDate(new Date());

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} - Diamond Flanges ERP</title>
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 20px; font-size: 12px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px; }
          .logo { font-size: 20px; font-weight: 800; color: #0284c7; letter-spacing: 0.5px; }
          .logo span { color: #38bdf8; }
          .doc-title { font-size: 18px; font-weight: 700; color: #1e293b; margin: 0; }
          .doc-sub { font-size: 12px; color: #64748b; margin-top: 4px; }
          .meta { text-align: right; font-size: 11px; color: #64748b; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background-color: #0f172a; color: #ffffff; font-weight: 600; text-align: left; padding: 8px 10px; font-size: 11px; text-transform: uppercase; border: 1px solid #1e293b; }
          td { padding: 8px 10px; border: 1px solid #e2e8f0; font-size: 11px; color: #334155; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .footer { margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; }
          .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 10px; }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 15px; text-align: right;">
          <button onclick="window.print()" style="background: #0284c7; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600;">🖨️ Print / Save as PDF</button>
        </div>
        <div class="header">
          <div>
            <div class="logo">DIAMOND <span>FLANGES</span> ERP</div>
            <div class="doc-title">${title}</div>
            ${subtitle ? `<div class="doc-sub">${subtitle}</div>` : ''}
          </div>
          <div class="meta">
            <div><strong>Generated:</strong> ${generatedDate}</div>
            <div><strong>System:</strong> Diamond Flanges ERP v2.0</div>
            <div><strong>Format:</strong> Official Export PDF</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              ${headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => `
              <tr>
                ${row.map(val => `<td>${val === null || val === undefined ? '-' : String(val)}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <div>Confidential - Internal ERP Document</div>
          <div>Diamond Flanges Enterprise Pipeline System</div>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  setTimeout(() => {
    printWindow.focus();
  }, 300);
};
