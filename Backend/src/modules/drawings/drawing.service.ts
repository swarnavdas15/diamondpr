import { db } from '../../prisma/db';
import { dbId } from '../../prisma/ids';

export class DrawingService {
  static async uploadDrawing(
    data: {
      orderId: string;
      filename: string;
      fileUrl: string;
    },
    uploadedById: string
  ) {
    const drawing = await db.orm.public.Drawing.create({
      orderId: dbId(data.orderId),
      filename: data.filename,
      fileUrl: data.fileUrl,
      uploadedById: dbId(uploadedById)
    });

    return await db.orm.public.Drawing
      .where({ id: drawing.id })
      .include('uploadedBy', (user) => user.select('name', 'role'))
      .first();
  }

  static async getOrderDrawings(orderId: string) {
    return await db.orm.public.Drawing
      .where({ orderId: dbId(orderId) })
      .include('uploadedBy', (user) => user.select('name', 'role'))
      .orderBy((drawing) => drawing.createdAt.desc())
      .all();
  }
}
