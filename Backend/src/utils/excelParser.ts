import ExcelJS from 'exceljs';

export interface BulkOrderRow {
  poNumber: string;
  clientCode: string;
  requirements: string;
  itemName: string;
  size: string;
  quantity: number;
  unitPrice?: number;
}

export const parseBulkOrderExcel = async (fileBuffer: Buffer): Promise<BulkOrderRow[]> => {
  const workbook = new ExcelJS.Workbook();
  const excelBuffer = fileBuffer as unknown as Buffer;
  await workbook.xlsx.load(excelBuffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);
  const worksheet = workbook.worksheets[0];
  const rows: BulkOrderRow[] = [];

  worksheet.eachRow((row, rowNumber) => {
    // Skip header row
    if (rowNumber === 1) return;

    const poNumber = row.getCell(1).text?.toString().trim();
    const clientCode = row.getCell(2).text?.toString().trim();
    const requirements = row.getCell(3).text?.toString().trim();
    const itemName = row.getCell(4).text?.toString().trim();
    const size = row.getCell(5).text?.toString().trim();
    const quantity = Number(row.getCell(6).value || 0);
    const unitPrice = Number(row.getCell(7).value || 0);

    if (poNumber && clientCode && itemName) {
      rows.push({ poNumber, clientCode, requirements, itemName, size, quantity, unitPrice });
    }
  });

  return rows;
};
