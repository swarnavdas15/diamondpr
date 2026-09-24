import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { db } from '../../prisma/db';
import { dbId } from '../../prisma/ids';
import { OrderStage } from '../../types/enums';

const productionStages = [
  OrderStage.CUTTING,
  OrderStage.FORGING,
  OrderStage.MACHINING,
  OrderStage.HEAT_TREATMENT
] as const;

const parseStageSequence = (sequence: string): OrderStage[] =>
  sequence
    .split(',')
    .map((stage) => stage.trim())
    .filter((stage): stage is OrderStage =>
      Object.values(OrderStage).includes(stage as OrderStage)
    );

export const getDepartmentOrdersController = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user!.role;
    let query = db.orm.public.Order.where({ isDeleted: 0 });

    if (userRole === 'PURCHASE') {
      query = query.where({ currentStage: OrderStage.PURCHASE });
    } else if (userRole === 'PRODUCTION') {
      query = query.where((order) => order.currentStage.in([...productionStages]));
    } else if (userRole === 'TESTING') {
      query = query.where({ currentStage: OrderStage.TESTING });
    }

    const orders = await query
      .select('id', 'poNumber', 'currentStage', 'stageSequence', 'requirements', 'createdAt')
      .include('client', (client) =>
        userRole === 'PURCHASE'
          ? client.select('clientcode')
          : client.select('clientcode', 'companyName')
      )
      .include('items', (items) => items.orderBy((item) => item.itemName.asc()))
      .include('tasks', (tasks) => tasks.orderBy((task) => task.createdAt.desc()))
      .include('notes', (notes) =>
        notes
          .include('user', (user) => user.select('name', 'role'))
          .orderBy((note) => note.createdAt.desc())
      )
      .orderBy((order) => order.createdAt.desc())
      .all();

    return res.status(200).json({ success: true, orders });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const advanceOrderStageController = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const userId = req.user!.userId;

    const order = await db.orm.public.Order.first({ id: dbId(orderId as string) });

    if (!order || order.isDeleted === 1) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const currentSequence = parseStageSequence(order.stageSequence);
    const currentIndex = currentSequence.indexOf(order.currentStage);

    if (currentIndex === -1 || currentIndex >= currentSequence.length - 1) {
      return res.status(400).json({
        message: 'Order is already at the final stage or sequence is invalid'
      });
    }

    const nextStage = currentSequence[currentIndex + 1];

    const updatedOrder = await db.transaction(async (tx) => {
      const updated = await tx.orm.public.Order
        .where({ id: dbId(orderId as string) })
        .update({ currentStage: nextStage });

      await tx.orm.public.StageLog.create({
        orderId: dbId(orderId as string),
        stage: nextStage,
        changedById: dbId(userId)
      });

      return updated;
    });

    return res.status(200).json({
      success: true,
      message: `Order transitioned from ${order.currentStage} to ${nextStage}`,
      order: updatedOrder
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
