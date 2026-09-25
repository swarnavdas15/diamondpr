import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import {
  handleCreateUser,
  handleListUsers,
  handleToggleUserStatus,
  handleUpdateUserRole,
} from './user.controller';

const router = Router();

// Only SUPER_ADMIN can create users, toggle status, modify roles
router.post('/', authenticateToken, requireRole(['SUPER_ADMIN']), handleCreateUser);
router.patch('/:id/status', authenticateToken, requireRole(['SUPER_ADMIN']), handleToggleUserStatus);
router.patch('/:id/role', authenticateToken, requireRole(['SUPER_ADMIN']), handleUpdateUserRole);

// SUPER_ADMIN and ADMIN can list users
router.get('/', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), handleListUsers);

export default router;
