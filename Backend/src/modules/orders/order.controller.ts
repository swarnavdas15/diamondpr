import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { OrderService, createOrder, getOrders, getOrderById, updateSalesWorkflowStage, updatePurchaseStage, updateProductionStage, updateQualityStage, updateDispatchStage, verifyAndCompleteOrder } from './order.service';
import { parseBulkOrderExcel } from '../../utils/excelParser';
import { db } from '../../prisma/db';
import { maskOrderList, maskOrderData } from '../../middlewares/masking.middleware';

export const createClientController = async (req: AuthRequest, res: Response) => {
  try {
    const client = await OrderService.createClient(req.body, req.user!.userId);
    res.status(201).json({ success: true, client });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message, error: error.message });
  }
};

export const createOrderController = async (req: AuthRequest, res: Response) => {
  try {
    const order = await OrderService.createOrder(req.body, req.user!.userId);
    res.status(201).json({ success: true, order });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message, error: error.message });
  }
};

export const handleCreateOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { poNumber, clientId } = req.body;
    if (!poNumber || !clientId) {
      return res.status(400).json({ error: 'PO Number and Client are required', message: 'PO Number and Client are required' });
    }

    const createdById = req.user?.userId || '';
    const order = await createOrder({ ...req.body }, createdById);
    return res.status(201).json({
      success: true,
      message: 'Order created with custom pipeline options',
      order: maskOrderData ? maskOrderData(order, req.user?.role) : order,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Failed to create order', message: err.message });
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
        items: [{ itemName: row.itemName, size: row.size, quantity: row.quantity, unitPrice: row.unitPrice }]
      }, req.user!.userId);

      createdOrders.push(order);
    }

    res.status(200).json({ success: true, count: createdOrders.length, createdOrders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, error: error.message });
  }
};

export const handleGetOrders = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role;
    const orders = await getOrders(role);
    const maskedOrders = maskOrderList ? maskOrderList(orders, role) : orders;
    return res.status(200).json({ success: true, orders: maskedOrders });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to fetch orders' });
  }
};

export const handleGetOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const order = await getOrderById(id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const maskedOrder = maskOrderData ? maskOrderData(order, req.user?.role) : order;
    return res.status(200).json({ success: true, order: maskedOrder });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to fetch order details' });
  }
};

export const handleUpdateSalesWorkflow = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { stage, remarks } = req.body;
    const userId = req.user?.userId || '';
    const order = await updateSalesWorkflowStage(id, stage, userId, remarks);
    return res.status(200).json({ success: true, message: 'Sales workflow stage updated', order });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Failed to update sales workflow' });
  }
};

export const handleUpdatePurchaseStage = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status, vendorSelected, procurementNotes } = req.body;
    const userId = req.user?.userId || '';
    const order = await updatePurchaseStage(id, status, userId, procurementNotes);
    return res.status(200).json({ success: true, message: 'Purchase stage updated', order });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Failed to update purchase stage' });
  }
};

export const handleUpdateProductionStage = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status, shopFloorNotes } = req.body;
    const userId = req.user?.userId || '';
    const order = await updateProductionStage(id, status, userId, shopFloorNotes);
    return res.status(200).json({ success: true, message: 'Production stage updated', order });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Failed to update production stage' });
  }
};

export const handleUpdateQualityStage = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status, qcRemarks } = req.body;
    const userId = req.user?.userId || '';
    const order = await updateQualityStage(id, status, userId, qcRemarks);
    return res.status(200).json({ success: true, message: 'Quality testing stage updated', order });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Failed to update quality stage' });
  }
};

export const handleUpdateDispatchStage = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status, dispatchNotes } = req.body;
    const userId = req.user?.userId || '';
    const order = await updateDispatchStage(id, status, userId, dispatchNotes);
    return res.status(200).json({ success: true, message: 'Dispatch stage updated', order });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Failed to update dispatch stage' });
  }
};

export const handleVerifyAndCompleteOrder = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { remarks } = req.body;
    const userId = req.user?.userId || '';
    const order = await verifyAndCompleteOrder(id, userId, remarks);
    return res.status(200).json({ success: true, message: 'Order verified and closed by Sales', order });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Failed to verify order completion' });
  }
};
