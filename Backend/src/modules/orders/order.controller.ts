import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { OrderService, createOrder, getOrders, getOrderById, updateSalesWorkflowStage, updatePurchaseStage, addPurchaseBatch, updateProductionStage, updateQualityStage, updateDispatchStage, verifyAndCompleteOrder } from './order.service';
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
    console.log("Create order error:", err);
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
    const formattedOrders = orders.map((o: any) => ({ ...o, clientCode: o.client?.clientcode || o.client?.clientCode, clientName: o.client?.companyName, contactNo: o.client?.contactNo }));
    const maskedOrders = maskOrderList ? maskOrderList(formattedOrders, role) : formattedOrders;
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

    const formattedOrder = { ...order, clientCode: (order as any).client?.clientcode || (order as any).client?.clientCode, clientName: (order as any).client?.companyName, contactNo: (order as any).client?.contactNo };
    const maskedOrder = maskOrderData ? maskOrderData(formattedOrder, req.user?.role) : formattedOrder;
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

export const handleAddPurchaseBatch = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.userId || '';
    const batch = await addPurchaseBatch(id, req.body, userId);
    return res.status(201).json({ success: true, message: 'Purchase batch added successfully', batch });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Failed to add purchase batch' });
  }
};

export const handleUpdatePurchaseStage = async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const { status, vendorSelected, procurementNotes, processedQty } = req.body;
      const userId = req.user?.userId || '';
      const order = await updatePurchaseStage(id, status, userId, procurementNotes, processedQty, vendorSelected);
    return res.status(200).json({ success: true, message: 'Purchase stage updated', order });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Failed to update purchase stage' });
  }
};

export const handleUpdateProductionStage = async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const { status, shopFloorNotes, processedQty, isRework } = req.body;
      const userId = req.user?.userId || '';
      const order = await updateProductionStage(id, status, userId, shopFloorNotes, processedQty, isRework);
    return res.status(200).json({ success: true, message: 'Production stage updated', order });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Failed to update production stage' });
  }
};

export const handleUpdateQualityStage = async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const { status, qcRemarks, qcResult, processedQty } = req.body;
      const userId = req.user?.userId || '';
      const order = await updateQualityStage(id, status, userId, qcRemarks, processedQty, qcResult);
    return res.status(200).json({ success: true, message: 'Quality testing stage updated', order });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Failed to update quality stage' });
  }
};

export const handleUpdateDispatchStage = async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const { status, dispatchNotes, processedQty, logisticsEntry, transportRef } = req.body;
      const userId = req.user?.userId || '';
      const order = await updateDispatchStage(id, status, userId, dispatchNotes, processedQty, logisticsEntry, transportRef);
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

import { updateOrder } from './order.service';

export const handleUpdateOrder = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const order = await updateOrder(id, req.body);
    return res.status(200).json({ success: true, message: 'Order updated', order });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Failed to update order' });
  }
};
