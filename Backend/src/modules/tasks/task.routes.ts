import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import {
  handleCreateTask,
  handleListTasks,
  handleUpdateTaskStatus,
  handleDeleteTask,
} from './task.controller';

const router = Router();

// All authenticated roles can list tasks and update task status
router.get('/', authenticateToken, handleListTasks);
router.post('/', authenticateToken, handleCreateTask);
router.patch('/:id/status', authenticateToken, handleUpdateTaskStatus);

// STRICT: Only SUPER_ADMIN and ADMIN can delete tasks
router.delete('/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), handleDeleteTask);

export default router;
