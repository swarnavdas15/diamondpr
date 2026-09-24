import { Router } from 'express';
import multer from 'multer';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { uploadExcel } from '../../middlewares/upload.middleware';
import { createClientSchema, createOrderSchema } from './order.validation';
import { createClientController, createOrderController, bulkUploadOrdersController } from './order.controller';
import { getDepartmentOrdersController, advanceOrderStageController } from './workflow.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Authenticated Routes for Sales & Admins
router.use(authenticateToken);

router.post(
  '/client', 
  authorizeRoles('SUPER_ADMIN', 'ADMIN', 'SALES'), 
  validate(createClientSchema), 
  createClientController
);

// Create Order with Zod Validation
router.post(
  '/create', 
  authorizeRoles('SUPER_ADMIN', 'ADMIN', 'SALES'), 
  validate(createOrderSchema), 
  createOrderController
);

// Bulk Upload Excel File via uploadExcel middleware
router.post(
  '/bulk-upload', 
  authorizeRoles('SUPER_ADMIN', 'ADMIN', 'SALES'), 
  uploadExcel.single('file'), 
  bulkUploadOrdersController
);
router.get('/', authorizeRoles('SUPER_ADMIN', 'ADMIN', 'SALES', 'PURCHASE', 'PRODUCTION', 'TESTING'), getDepartmentOrdersController);
router.post('/:orderId/advance-stage', authorizeRoles('SUPER_ADMIN', 'ADMIN', 'PURCHASE', 'PRODUCTION', 'TESTING'), advanceOrderStageController);

export default router;
