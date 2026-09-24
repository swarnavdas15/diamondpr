import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/role.middleware';
import { createDepartmentUserController, getAllUsersController } from './admin.controller';
import { exportOrdersToExcelController } from './export.controller';
import { softDeleteOrderController } from './deletion.controller';

const router = Router();

// All Admin routes require valid JWT
router.use(authenticateToken);

// 1. User Management (SUPER_ADMIN Only)
router.post('/users', authorizeRoles('SUPER_ADMIN'), createDepartmentUserController);
router.get('/users', authorizeRoles('SUPER_ADMIN', 'ADMIN'), getAllUsersController);

// 2. Master Excel Export (SUPER_ADMIN Only)
router.get('/export-excel', authorizeRoles('SUPER_ADMIN'), exportOrdersToExcelController);

// 3. Deletion Endpoint Guard (SUPER_ADMIN & ADMIN Only)
router.delete('/orders/:orderId', authorizeRoles('SUPER_ADMIN', 'ADMIN'), softDeleteOrderController);

export default router;