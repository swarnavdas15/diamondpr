import { db } from '../../prisma/db';
import { dbId } from '../../prisma/ids';
import { Priority, TaskStatus } from '../../types/enums';

export class TaskService {
  static async createTask(
    data: {
      orderId?: string;
      orderNumber?: string;
      title: string;
      description?: string;
      priority?: any;
      assignedToDepartment?: string;
      assignedToUserId?: string;
      assignedToName?: string;
      dueDate?: string;
    },
    currentUser: any
  ) {
    const taskData: any = {
      title: data.title,
      description: data.description ?? null,
      priority: data.priority || 'MEDIUM',
      status: 'PENDING',
      dueDate: data.dueDate ?? null,
      assignedToDepartment: data.assignedToDepartment ?? null,
      assignedToUserId: data.assignedToUserId ? dbId(data.assignedToUserId) : null,
      assignedToName: data.assignedToName ?? null,
      createdByName: currentUser?.name || 'System',
      createdByRole: currentUser?.role || 'SUPER_ADMIN',
      createdByUserId: currentUser?.userId ? dbId(currentUser.userId) : null,
      createdById: currentUser?.userId ? dbId(currentUser.userId) : null,
    };

    if (data.orderId) taskData.orderId = dbId(data.orderId);
    if (data.orderNumber) taskData.orderNumber = data.orderNumber;
    if (data.assignedToUserId) taskData.assignedToId = dbId(data.assignedToUserId);

    const task = await db.orm.public.Task.create(taskData);
    return task;
  }

  static async updateTaskStatus(taskId: string, status: any) {
    return await db.orm.public.Task
      .where({ id: dbId(taskId) })
      .update({ status });
  }

  static async getTasksByUser(userId: string) {
    return await db.orm.public.Task
      .where({ isDeleted: 0 })
      .orderBy((task) => task.createdAt.desc())
      .all();
  }

  static async listTasks() {
    return await db.orm.public.Task
      .where({ isDeleted: 0 })
      .orderBy((task) => task.createdAt.desc())
      .all();
  }

  static async deleteTask(taskId: string) {
    return await db.orm.public.Task
      .where({ id: dbId(taskId) })
      .update({ isDeleted: 1 });
  }
}

export const createTask = TaskService.createTask;
export const listTasks = TaskService.listTasks;
export const updateTaskStatus = TaskService.updateTaskStatus;
export const deleteTask = TaskService.deleteTask;
export const getTasksByUser = TaskService.getTasksByUser;
