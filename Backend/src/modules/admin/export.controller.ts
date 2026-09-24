import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { db } from '../../prisma/db';
import ExcelJS from 'exceljs';

export const exportOrdersToExcelController = async (req: AuthRequest, res: Response) => {
  try {
    // Fetch all active and soft-deleted orders for master reporting
    const orders = await db.orm.public.Order
      .include('client', (client) => client.select('clientcode', 'companyName'))
      .include('createdBy', (user) => user.select('name'))
      .include('items', (items) => items.orderBy((item) => item.itemName.asc()))
      .include('stageLogs', (logs) =>
        logs
          .include('changedBy', (user) => user.select('name', 'role'))
          .orderBy((log) => log.createdAt.asc())
      )
      .orderBy((order) => order.createdAt.desc())
      .all();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Master Order Reports');

    // Header Styling
    worksheet.columns = [
      { header: 'PO Number', key: 'poNumber', width: 18 },
      { header: 'Client Code', key: 'clientCode', width: 15 },
      { header: 'Company Name', key: 'companyName', width: 25 },
      { header: 'Current Stage', key: 'currentStage', width: 18 },
      { header: 'Requirements', key: 'requirements', width: 30 },
      { header: 'Items & Specs', key: 'items', width: 35 },
      { header: 'Created By', key: 'createdBy', width: 18 },
      { header: 'Created At', key: 'createdAt', width: 20 },
      { header: 'Stage Progression Log', key: 'logs', width: 45 }
    ];

    // Format Header Row
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1F497D' }
    };
    
    orders.forEach((order: any) => {
      const itemsSummary = order.items
        .map((i: any) => `${i.itemName} (${i.size}) - Qty: ${i.quantity}`)
        .join('; ');

      const logsSummary = order.stageLogs
        .map((l: any) => `[${l.stage} by ${l.changedBy.name} on ${new Date(l.createdAt).toLocaleDateString()}]`)
        .join(' -> ');

      worksheet.addRow({
        poNumber: order.poNumber,
        clientCode: order.client.clientcode,
        companyName: order.client.companyName,
        currentStage: order.currentStage,
        requirements: order.requirements,
        items: itemsSummary,
        createdBy: order.createdBy.name,
        createdAt: new Date(order.createdAt).toISOString().split('T')[0],
        logs: logsSummary
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=' + `ERP_Master_Report_${Date.now()}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.status(200).end();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
