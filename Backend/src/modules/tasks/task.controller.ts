import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { TaskService } from './task.service';

export const createTaskHandler = async (req: AuthRequest, res: Response) => {
  try {
    const task = await TaskService.createTask(req.body, req.user!.userId);
    res.status(201).json({ success: true, task });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateTaskStatusHandler = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    const updatedTask = await TaskService.updateTaskStatus(taskId as string, status);
    res.status(200).json({ success: true, task: updatedTask });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getMyTasksHandler = async (req: AuthRequest, res: Response) => {
  try {
    const tasks = await TaskService.getTasksByUser(req.user!.userId);
    res.status(200).json({ success: true, tasks });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};