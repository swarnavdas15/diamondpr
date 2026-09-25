import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { handleCreateClient, handleListClients } from './client.controller';

const router = Router();

// Only Sales, Admin, Super Admin can manage & view complete Client list
router.post('/', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN', 'SALES']), handleCreateClient);
router.get('/', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN', 'SALES']), handleListClients);

export default router;
