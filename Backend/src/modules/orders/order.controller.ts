import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import * as orderService from './order.service';
import { maskOrderList, maskOrderData } from '../../middlewares/masking.middleware';

export const handleCreateOrder = async (req: AuthRequest, res: Response) => {
  try {
    const {
      poNumber,
      clientId,
      budget,
      technicalRequirements,
      materialRequirements,
      requiredQuantity,
      purchaseRequired,
      productionRequired,
      qualityTestingRequired,
      dispatchRequired,
      items,
    } = req.body;

    if (!poNumber || !clientId) {
      return res.status(400).json({ error: 'PO Number and Client are required' });
    }

    const createdById = req.user?.userId || '';
    const order = await orderService.createOrder({
      poNumber,
      clientId,
      budget,
      technicalRequirements,
      materialRequirements,
      requiredQuantity,
      purchaseRequired,
      productionRequired,
      qualityTestingRequired,
      dispatchRequired,
      items,
      createdById,
    });

    return res.status(201).json({
      message: 'Order created with custom pipeline options',
      order: maskOrderData(order, req.user?.role),
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to create order' });
  }
};

export const handleGetOrders = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role;
    const orders = await orderService.getOrders(role);
    const maskedOrders = maskOrderList(orders, role);
    return res.status(200).json({ orders: maskedOrders });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch orders' });
  }
};

export const handleGetOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const order = await orderService.getOrderById(id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const maskedOrder = maskOrderData(order, req.user?.role);
    return res.status(200).json({ order: maskedOrder });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch order details' });
  }
};

export const handleUpdateSalesWorkflow = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { stage, remarks } = req.body;
    const userId = req.user?.userId || '';
    const order = await orderService.updateSalesWorkflowStage(id, stage, userId, remarks);
    return res.status(200).json({ message: 'Sales workflow stage updated', order: maskOrderData(order, req.user?.role) });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to update sales workflow' });
  }
};

export const handleUpdatePurchaseStage = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status, vendorSelected, procurementNotes } = req.body;
    const userId = req.user?.userId || '';
    const order = await orderService.updatePurchaseStage(id, { status, vendorSelected, procurementNotes }, userId);
    return res.status(200).json({ message: 'Purchase stage updated', order: maskOrderData(order, req.user?.role) });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to update purchase stage' });
  }
};

export const handleUpdateProductionStage = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status, shopFloorNotes } = req.body;
    const userId = req.user?.userId || '';
    const order = await orderService.updateProductionStage(id, { status, shopFloorNotes }, userId);
    return res.status(200).json({ message: 'Production stage updated', order: maskOrderData(order, req.user?.role) });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to update production stage' });
  }
};

export const handleUpdateQualityStage = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status, qcResult, qcRemarks } = req.body;
    const userId = req.user?.userId || '';
    const order = await orderService.updateQualityStage(id, { status, qcResult, qcRemarks }, userId);
    return res.status(200).json({ message: 'Quality testing stage updated', order: maskOrderData(order, req.user?.role) });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to update quality stage' });
  }
};

export const handleUpdateDispatchStage = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status, logisticsEntry, transportRef, dispatchNotes } = req.body;
    const userId = req.user?.userId || '';
    const order = await orderService.updateDispatchStage(
      id,
      { status, logisticsEntry, transportRef, dispatchNotes },
      userId
    );
    return res.status(200).json({ message: 'Dispatch stage updated', order: maskOrderData(order, req.user?.role) });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to update dispatch stage' });
  }
};

export const handleVerifyAndCompleteOrder = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { remarks } = req.body;
    const userId = req.user?.userId || '';
    const order = await orderService.verifyAndCompleteOrder(id, userId, remarks);
    return res.status(200).json({ message: 'Order verified and closed by Sales', order: maskOrderData(order, req.user?.role) });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to verify order completion' });
  }
};
