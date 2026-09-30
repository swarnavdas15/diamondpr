import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireRole, authorizeRoles } from '../../middlewares/role.middleware';
import { uploadExcel } from '../../middlewares/upload.middleware';
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
  createClientController,
  createOrderController,
  bulkUploadOrdersController,
} from './order.controller';
import { getDepartmentOrdersController, advanceOrderStageController } from './workflow.controller';

const router = Router();

router.use(authenticateToken);

// All authenticated roles can list/view orders
router.get('/', handleGetOrders);
router.get('/:id', handleGetOrderById);

// Client creation & Bulk Upload
router.post('/client', requireRole(['SUPER_ADMIN', 'ADMIN', 'SALES']), createClientController);
router.post('/create', requireRole(['SUPER_ADMIN', 'ADMIN', 'SALES']), createOrderController);
router.post('/bulk-upload', requireRole(['SUPER_ADMIN', 'ADMIN', 'SALES']), uploadExcel.single('file'), bulkUploadOrdersController);

// Order creation & Sales verification
router.post('/', requireRole(['SUPER_ADMIN', 'ADMIN', 'SALES']), handleCreateOrder);
router.patch('/:id/sales-workflow', requireRole(['SUPER_ADMIN', 'ADMIN', 'SALES']), handleUpdateSalesWorkflow);
router.patch('/:id/verify-completion', requireRole(['SUPER_ADMIN', 'ADMIN', 'SALES']), handleVerifyAndCompleteOrder);

// Department stage routes
router.patch('/:id/purchase', requireRole(['SUPER_ADMIN', 'ADMIN', 'PURCHASE']), handleUpdatePurchaseStage);
router.patch('/:id/production', requireRole(['SUPER_ADMIN', 'ADMIN', 'PRODUCTION']), handleUpdateProductionStage);
router.patch('/:id/quality', requireRole(['SUPER_ADMIN', 'ADMIN', 'PRODUCTION', 'QUALITY_TESTING', 'TESTING', 'SALES', 'PURCHASE', 'DISPATCH']), handleUpdateQualityStage);
router.patch('/:id/dispatch', requireRole(['SUPER_ADMIN', 'ADMIN', 'DISPATCH']), handleUpdateDispatchStage);

// Stage advancement
router.post('/:orderId/advance-stage', authorizeRoles('SUPER_ADMIN', 'ADMIN', 'PURCHASE', 'PRODUCTION', 'TESTING', 'DISPATCH'), advanceOrderStageController);

export default router;
