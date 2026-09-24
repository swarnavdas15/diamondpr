import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { createTaskHandler, updateTaskStatusHandler, getMyTasksHandler } from './task.controller';

const router = Router();

router.use(authenticateToken);

router.post('/create', createTaskHandler);
router.patch('/:taskId/status', updateTaskStatusHandler);
router.get('/my-tasks', getMyTasksHandler);

export default router;