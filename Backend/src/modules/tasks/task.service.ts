import { db } from '../../prisma/db';
import { dbId } from '../../prisma/ids';
import { Priority, TaskStatus } from '../../types/enums';

export class TaskService {
  static async createTask(
    data: {
      orderId: string;
      title: string;
      description?: string;
      priority?: Priority;
      assignedToId: string;
      dueDate?: string;
    },
    createdById: string
  ) {
    const task = await db.orm.public.Task.create({
      orderId: dbId(data.orderId),
      title: data.title,
      description: data.description ?? null,
      priority: data.priority ?? Priority.MEDIUM,
      status: TaskStatus.PENDING,
      dueDate: data.dueDate ?? null,
      assignedToId: dbId(data.assignedToId),
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
}
