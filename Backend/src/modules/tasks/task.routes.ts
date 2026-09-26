import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import {
  handleCreateTask,
  createTaskHandler,
  handleListTasks,
  handleUpdateTaskStatus,
  updateTaskStatusHandler,
  getMyTasksHandler,
  handleDeleteTask,
} from './task.controller';

const router = Router();

router.use(authenticateToken);

router.get('/', handleListTasks);
router.post('/', handleCreateTask);
router.post('/create', createTaskHandler);
router.get('/my-tasks', getMyTasksHandler);

router.patch('/:id/status', handleUpdateTaskStatus);
router.patch('/:taskId/status', updateTaskStatusHandler);

// STRICT: Only SUPER_ADMIN and ADMIN can delete tasks
router.delete('/:id', requireRole(['SUPER_ADMIN', 'ADMIN']), handleDeleteTask);

export default router;
