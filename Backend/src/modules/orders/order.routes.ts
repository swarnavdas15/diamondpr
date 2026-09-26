import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import {
  handleCreateOrder,
  handleGetOrders,
  handleGetOrderById,
  handleUpdateSalesWorkflow,
  handleUpdatePurchaseStage,
  handleUpdateProductionStage,
  handleUpdateQualityStage,
  handleUpdateDispatchStage,
  handleVerifyAndCompleteOrder,
} from './order.controller';

const router = Router();

// All authenticated roles can list/view orders (with data masking applied automatically based on role)
router.get('/', authenticateToken, handleGetOrders);
router.get('/:id', authenticateToken, handleGetOrderById);

// Order creation & Sales verification restricted to Sales, Admin, Super Admin
router.post('/', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN', 'SALES']), handleCreateOrder);
router.patch(
  '/:id/sales-workflow',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'SALES']),
  handleUpdateSalesWorkflow
);
router.patch(
  '/:id/verify-completion',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'SALES']),
  handleVerifyAndCompleteOrder
);

// Department-specific stage routes
router.patch(
  '/:id/purchase',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'PURCHASE']),
  handleUpdatePurchaseStage
);
router.patch(
  '/:id/production',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'PRODUCTION']),
  handleUpdateProductionStage
);
router.patch(
  '/:id/quality',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'QUALITY_TESTING']),
  handleUpdateQualityStage
);
router.patch(
  '/:id/dispatch',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'DISPATCH']),
  handleUpdateDispatchStage
);

export default router;
