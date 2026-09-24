import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { db } from '../../prisma/db';
import { dbId } from '../../prisma/ids';

export const softDeleteOrderController = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const order = await db.orm.public.Order.first({ id: dbId(orderId as string) });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await db.orm.public.Order
      .where({ id: dbId(orderId as string) })
      .update({ isDeleted: 1 });

    return res.status(200).json({
      success: true,
      message: `Order ${order.poNumber} has been safely archived.`
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
