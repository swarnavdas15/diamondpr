import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import {
  handleListVendors,
  handleCreateVendor,
  handleUpdateVendor,
  handleDeleteVendor,
} from './vendor.controller';

const router = Router();

router.use(authenticateToken);

// All authenticated users can list/view vendors
router.get('/', handleListVendors);

// Create and update vendor details
router.post('/', requireRole(['SUPER_ADMIN', 'ADMIN', 'PURCHASE', 'SALES']), handleCreateVendor);
router.patch('/:id', requireRole(['SUPER_ADMIN', 'ADMIN', 'PURCHASE', 'SALES']), handleUpdateVendor);

// Only Super Admin & Admin can delete vendors
router.delete('/:id', requireRole(['SUPER_ADMIN', 'ADMIN']), handleDeleteVendor);

export default router;
