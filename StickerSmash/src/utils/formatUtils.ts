/**
 * Format utility functions for Manufacturing ERP
 */

export const formatDate = (dateStr?: string): string => {
  if (!dateStr || dateStr === 'N/A' || dateStr === 'None' || !dateStr.trim()) return 'N/A';
  
  const trimmed = dateStr.trim();
  
  // Handle ISO strings or YYYY-MM-DD (e.g. 2026-09-30, 2026-09-30T04:59:17.123Z)
  const ymdMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    const [, year, month, day] = ymdMatch;
    return `${day}/${month}/${year}`;
  }

  // Handle DD-MM-YYYY or DD/MM/YYYY if already formatted
  const dmyMatch = trimmed.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})/);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    return `${day}/${month}/${year}`;
  }

  try {
    const d = new Date(trimmed);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    return dateStr;
  }
};
