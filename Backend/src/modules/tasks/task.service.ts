import { db } from '../../prisma/db';
import { dbId } from '../../prisma/ids';
import { Priority, TaskStatus } from '../../types/enums';

export class TaskService {
  static async createTask(
    data: {
      orderId?: string;
      title: string;
      description?: string;
      priority?: Priority;
      assignedToId?: string;
      assignedToDepartment?: string;
      dueDate?: string;
    },
    createdById: string
  ) {
    const task = await db.orm.public.Task.create({
      orderId: data.orderId ? dbId(data.orderId) : null,
      title: data.title,
      description: data.description ?? null,
      priority: data.priority ?? Priority.MEDIUM,
      status: TaskStatus.PENDING,
      dueDate: data.dueDate ?? null,
      assignedToId: data.assignedToId ? dbId(data.assignedToId) : null,
      createdById: dbId(createdById)
    });

    return await db.orm.public.Task
      .where({ id: task.id })
      .include('assignedTo', (user) => user.select('id', 'name', 'role'))
      .include('createdBy', (user) => user.select('id', 'name', 'role'))
      .first();
  }

  static async updateTaskStatus(taskId: string, status: TaskStatus) {
    return await db.orm.public.Task
      .where({ id: dbId(taskId) })
      .update({ status });
  }

  static async getTasksByUser(userId: string) {
    return await db.orm.public.Task
      .where({ assignedToId: dbId(userId) })
      .include('order', (order) => order.select('poNumber', 'currentStage'))
      .orderBy((task) => task.createdAt.desc())
      .all();
  }

  static async listTasks() {
    return await db.orm.public.Task
      .where({ isDeleted: 0 })
      .include('assignedTo', (user) => user.select('id', 'name', 'role'))
      .include('createdBy', (user) => user.select('id', 'name', 'role'))
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
