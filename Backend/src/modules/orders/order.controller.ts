import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { OrderService } from './order.service';
import { parseBulkOrderExcel } from '../../utils/excelParser';
import { db } from '../../prisma/db';

export const createClientController = async (req: AuthRequest, res: Response) => {
  try {
    const client = await OrderService.createClient(req.body, req.user!.userId);
    res.status(201).json({ success: true, client });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const createOrderController = async (req: AuthRequest, res: Response) => {
  try {
    const order = await OrderService.createOrder(req.body, req.user!.userId);
    res.status(201).json({ success: true, order });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const bulkUploadOrdersController = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Excel file is required' });
    }

    const rows = await parseBulkOrderExcel(req.file.buffer);
    const createdOrders = [];

    for (const row of rows) {
      const client = await db.orm.public.Client
        .where({ clientcode: row.clientCode })
        .first();

      if (!client) continue;

      const order = await OrderService.createOrder({
        poNumber: row.poNumber,
        clientId: client.id,
        requirements: row.requirements,
        stageSequence: ['QUOTATION', 'PURCHASE', 'MACHINING', 'DISPATCH', 'COMPLETED'],
        items: [{ itemName: row.itemName, size: row.size, quantity: row.quantity, unitPrice: row.unitPrice }]
      }, req.user!.userId);

      createdOrders.push(order);
    }

    res.status(200).json({ success: true, count: createdOrders.length, createdOrders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
