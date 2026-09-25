import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import * as taskService from './task.service';

export const handleCreateTask = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, priority, assignedToDepartment, assignedToId, orderId, dueDate } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const createdById = req.user?.userId || '';
    const task = await taskService.createTask({
      title,
      description,
      priority,
      assignedToDepartment,
      assignedToId,
      orderId,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      createdById,
    });

    return res.status(201).json({ message: 'Task assigned successfully', task });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to create task' });
  }
};

export const handleListTasks = async (req: AuthRequest, res: Response) => {
  try {
    const tasks = await taskService.listTasks();
    return res.status(200).json({ tasks });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch tasks' });
  }
};

export const handleUpdateTaskStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const task = await taskService.updateTaskStatus(id as string, status);
    return res.status(200).json({ message: 'Task status updated', task });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to update task status' });
  }
};

export const handleDeleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Strict Task Deletion Rules: Only SUPER_ADMIN and ADMIN can delete tasks
    const role = req.user?.role;
    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      return res.status(403).json({ error: 'Permission denied. Only Super Admin and Admin can delete tasks.' });
    }

    await taskService.deleteTask(id as string);
    return res.status(200).json({ message: 'Task successfully deleted' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to delete task' });
  }
};
