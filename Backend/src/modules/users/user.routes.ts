import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import {
  handleCreateUser,
  handleListUsers,
  handleToggleUserStatus,
  handleUpdateUserRole,
  handleDeleteUser,
  handleResetPassword,
  handleUpdateUserDetails,
} from './user.controller';

const router = Router();

// Only SUPER_ADMIN can create users, toggle status, modify roles, delete, and reset password
router.post('/', authenticateToken, requireRole(['SUPER_ADMIN']), handleCreateUser);
router.patch('/:id', authenticateToken, requireRole(['SUPER_ADMIN']), handleUpdateUserDetails);
router.patch('/:id/status', authenticateToken, requireRole(['SUPER_ADMIN']), handleToggleUserStatus);
router.patch('/:id/role', authenticateToken, requireRole(['SUPER_ADMIN']), handleUpdateUserRole);
router.delete('/:id', authenticateToken, requireRole(['SUPER_ADMIN']), handleDeleteUser);
router.patch('/:id/password', authenticateToken, requireRole(['SUPER_ADMIN']), handleResetPassword);

// SUPER_ADMIN and ADMIN can list users
router.get('/', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), handleListUsers);

export default router;
