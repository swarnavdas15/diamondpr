import { PrismaClient, Priority, TaskStatus, Role } from '@prisma/client';

const prisma = new PrismaClient();

export const createTask = async (data: {
  title: string;
  description?: string;
  priority?: Priority;
  assignedToDepartment?: Role;
  assignedToId?: string;
  orderId?: string;
  dueDate?: Date;
  createdById: string;
}) => {
  return prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      priority: data.priority || Priority.MEDIUM,
      assignedToDepartment: data.assignedToDepartment,
      assignedToId: data.assignedToId,
      orderId: data.orderId,
      dueDate: data.dueDate,
      createdById: data.createdById,
    },
    include: {
      createdBy: { select: { id: true, name: true, role: true } },
      assignedTo: { select: { id: true, name: true, role: true } },
      order: { select: { id: true, orderNumber: true, clientCode: true } },
    },
  });
};

export const listTasks = async () => {
  return prisma.task.findMany({
    include: {
      createdBy: { select: { id: true, name: true, role: true } },
      assignedTo: { select: { id: true, name: true, role: true } },
      order: { select: { id: true, orderNumber: true, clientCode: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
  return prisma.task.update({
    where: { id: taskId },
    data: { status },
    include: {
      createdBy: { select: { id: true, name: true, role: true } },
      assignedTo: { select: { id: true, name: true, role: true } },
    },
  });
};

export const deleteTask = async (taskId: string) => {
  return prisma.task.delete({
    where: { id: taskId },
  });
};
