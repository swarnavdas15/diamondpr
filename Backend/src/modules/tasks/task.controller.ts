import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { TaskService } from './task.service';

export const handleCreateTask = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, priority, assignedToDepartment, assignedToId, orderId, dueDate } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Task title is required', message: 'Task title is required' });
    }

    const createdById = req.user?.userId || '';
    const task = await TaskService.createTask(
      {
        orderId,
        title,
        description,
        priority,
        assignedToId,
        assignedToDepartment,
        dueDate,
      },
      createdById
    );

    return res.status(201).json({ success: true, message: 'Task assigned successfully', task });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Failed to create task', message: err.message });
  }
};

export const createTaskHandler = handleCreateTask;

export const handleListTasks = async (req: AuthRequest, res: Response) => {
  try {
    const tasks = await TaskService.listTasks();
    return res.status(200).json({ success: true, tasks });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to fetch tasks', message: err.message });
  }
};

export const handleUpdateTaskStatus = async (req: AuthRequest, res: Response) => {
  try {
    const taskId = (req.params.id || req.params.taskId) as string;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required', message: 'Status is required' });
    }

    const task = await TaskService.updateTaskStatus(taskId, status);
    return res.status(200).json({ success: true, message: 'Task status updated', task });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Failed to update task status', message: err.message });
  }
};

export const updateTaskStatusHandler = handleUpdateTaskStatus;

export const handleGetMyTasks = async (req: AuthRequest, res: Response) => {
  try {
    const tasks = await TaskService.getTasksByUser(req.user!.userId);
    return res.status(200).json({ success: true, tasks });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message, error: err.message });
  }
};

export const getMyTasksHandler = handleGetMyTasks;

export const handleDeleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const taskId = req.params.id as string;
    const role = req.user?.role;
    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      return res.status(403).json({ error: 'Permission denied. Only Super Admin and Admin can delete tasks.' });
    }

    await TaskService.deleteTask(taskId);
    return res.status(200).json({ success: true, message: 'Task successfully deleted' });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Failed to delete task' });
  }
};
