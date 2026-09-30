import { db } from '../../prisma/db';
import { dbId } from '../../prisma/ids';
import { OrderStage } from '../../types/enums';

const serializeStageSequence = (stages: OrderStage[]) => stages.join(',');
const toOptionalBigInt = (value?: number) => (value == null ? null : BigInt(value));

export class OrderService {
  static async createClient(
    data: {
      companyName: string;
      contactNo: string;
      contactName?: string;
      email?: string;
      gstNumber?: string;
      address?: string;
      industry?: string;
      remarks?: string;
      clientCode: string;
    },
    userId: string
  ) {
    return await db.orm.public.Client.create({
      clientcode: data.clientCode,
      companyName: data.companyName,
      contactName: data.contactName ?? null,
      contactNo: data.contactNo,
      email: data.email ?? null,
      gstNumber: data.gstNumber ?? null,
      address: data.address ?? null,
      industry: data.industry ?? null,
      remarks: data.remarks ?? null,
      createdById: dbId(userId)
    });
  }

  static async createOrder(
    data: {
      poNumber: string;
      clientId: string;
      requirements?: string;
      technicalRequirements?: string;
      materialRequirements?: string;
      budget?: number;
      requiredQuantity?: number;
      purchaseRequired?: boolean;
      productionRequired?: boolean;
      qualityTestingRequired?: boolean;
      dispatchRequired?: boolean;
      stageSequence?: OrderStage[];
      items?: { itemName: string; size: string; quantity: number; unitPrice?: number }[];
    },
    userId: string
  ) {
    const existingOrder = await db.orm.public.Order.where({ poNumber: data.poNumber }).first();
    if (existingOrder) {
      throw new Error(`PO Number "${data.poNumber}" already exists. Please use a unique PO Number.`);
    }

    const defaultPipeline: OrderStage[] = [OrderStage.PURCHASE, OrderStage.TESTING, OrderStage.DISPATCH, OrderStage.COMPLETED];
    const rawPipeline = data.stageSequence && data.stageSequence.length > 0 ? data.stageSequence : defaultPipeline;
    const pipeline = rawPipeline.filter((stg) => stg !== OrderStage.QUOTATION);
    if (pipeline.length === 0) pipeline.push(OrderStage.PURCHASE, OrderStage.COMPLETED);

    const initialStage = pipeline[0];

    return await db.transaction(async (tx) => {
      const itemsSum = Array.isArray(data.items) && data.items.length > 0
        ? data.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
        : 0;
      const calcQty = itemsSum > 0 ? itemsSum : Number(data.requiredQuantity || 1);

      const order = await tx.orm.public.Order.create({
        poNumber: data.poNumber,
        clientId: dbId(data.clientId),
        requirements: data.requirements || data.technicalRequirements || '',
        budget: toOptionalBigInt(data.budget),
        requiredQuantity: calcQty,
        unit: 'pcs',
        stageSequence: serializeStageSequence(pipeline),
        currentStage: initialStage,
        createdById: dbId(userId)
      });

      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          await tx.orm.public.OrderItem.create({
            orderId: order.id,
            itemName: item.itemName,
            size: item.size,
            quantity: item.quantity,
            unitPrice: toOptionalBigInt(item.unitPrice)
          });
        }
      }

      await tx.orm.public.StageLog.create({
        orderId: order.id,
        stage: initialStage,
        changedById: dbId(userId)
      });

      return await tx.orm.public.Order
        .where({ id: order.id })
        .include('client', (client) => client.select('id', 'clientcode', 'companyName'))
        .include('items', (items) => items.orderBy((item) => item.itemName.asc()))
        .include('stageLogs', (logs) => logs.orderBy((log) => log.createdAt.asc()))
        .first();
    });
  }

  static async getOrdersByRole(_role: string, stage?: OrderStage) {
    let query = db.orm.public.Order.where({ isDeleted: 0 });

    if (stage) {
      query = query.where({ currentStage: stage });
    }

    return await query
      .include('client', (client) => client.select('clientcode', 'companyName'))
      .include('items', (items) => items.orderBy((item) => item.itemName.asc()))
      .include('tasks', (tasks) => tasks.orderBy((task) => task.createdAt.desc()))
      .include('stageLogs', (logs) => logs.orderBy((log) => log.createdAt.asc()))
      .orderBy((order) => order.createdAt.desc())
      .all();
  }
}

export const createOrder = async (data: any, userId: string) => OrderService.createOrder(data, userId);
export const getOrders = async (userRole?: string) => OrderService.getOrdersByRole(userRole || 'ALL');
export const getOrderById = async (id: string) => {
  return await db.orm.public.Order
    .where({ id: dbId(id), isDeleted: 0 })
    .include('client', (client) => client.select('clientcode', 'companyName'))
    .include('items', (items) => items.orderBy((item) => item.itemName.asc()))
    .include('tasks', (tasks) => tasks.orderBy((task) => task.createdAt.desc()))
    .include('stageLogs', (logs) => logs.orderBy((log) => log.createdAt.asc()))
    .first();
};
const resolveOrderAndUser = async (tx: any, id: string, userId?: string) => {
  let order = await tx.orm.public.Order.where({ id: dbId(id) }).first();
  if (!order) {
    order = await tx.orm.public.Order.where({ poNumber: id }).first();
  }
  if (!order) {
    order = await tx.orm.public.Order.where({ orderNumber: id }).first();
  }
  if (!order) {
    throw new Error(`Order '${id}' not found in database.`);
  }

  let validUserId: string | null = null;
  if (userId) {
    try {
      const userObj = await tx.orm.public.User.where({ id: dbId(userId) }).first();
      if (userObj) {
        validUserId = userObj.id;
      }
    } catch {
      validUserId = null;
    }
  }

  return { orderId: order.id, validUserId };
};

export const updateSalesWorkflowStage = async (id: string, stage: string, userId: string, remarks?: string) => {
  const validStage: OrderStage = Object.values(OrderStage).includes(stage as any)
    ? (stage as OrderStage)
    : OrderStage.PURCHASE;

  return await db.transaction(async (tx) => {
    const { orderId, validUserId } = await resolveOrderAndUser(tx, id, userId);

    await tx.orm.public.StageLog.create({
      orderId: dbId(orderId),
      stage: validStage,
      changedById: validUserId ? dbId(validUserId) : null,
    });

    return await tx.orm.public.Order.where({ id: dbId(orderId) }).first();
  });
};

export const updatePurchaseStage = async (
  id: string,
  status: string,
  userId: string,
  remarks?: string,
  vendorSelected?: string,
  processedQty?: number
) => {
  return await db.transaction(async (tx) => {
    const { orderId, validUserId } = await resolveOrderAndUser(tx, id, userId);

    const updatePayload: any = {};
    if (status) updatePayload.purchaseStatus = status;
    if (vendorSelected) updatePayload.vendorSelected = vendorSelected;
    if (remarks) updatePayload.procurementNotes = remarks;
    if (typeof processedQty === 'number') updatePayload.purchaseQuantity = processedQty;

    if (status === 'COMPLETED') {
      updatePayload.currentStage = OrderStage.TESTING; // Next pipeline department
    }

    if (Object.keys(updatePayload).length > 0) {
      await tx.orm.public.Order.where({ id: dbId(orderId) }).update(updatePayload);
    }

    await tx.orm.public.StageLog.create({
      orderId: dbId(orderId),
      stage: OrderStage.PURCHASE,
      changedById: validUserId ? dbId(validUserId) : null,
    });

    return await tx.orm.public.Order.where({ id: dbId(orderId) }).first();
  });
};

export const updateProductionStage = async (
  id: string,
  status: string,
  userId: string,
  notes?: string,
  processedQty?: number,
  isRework?: boolean
) => {
  return await db.transaction(async (tx) => {
    const { orderId, validUserId } = await resolveOrderAndUser(tx, id, userId);

    const updatePayload: any = {};
    if (status) updatePayload.productionStatus = status;
    if (notes) updatePayload.shopFloorNotes = notes;

    if (typeof processedQty === 'number' && processedQty > 0) {
      const existingOrder = await tx.orm.public.Order.where({ id: dbId(orderId) }).first();
      if (existingOrder) {
        if (isRework) {
          const currentRework = (existingOrder as any).reworkQuantity || 0;
          const currentProd = (existingOrder as any).productionQuantity || 0;
          updatePayload.reworkQuantity = Math.max(0, currentRework - processedQty);
          updatePayload.productionQuantity = currentProd + processedQty;
        } else {
          const currentProd = (existingOrder as any).productionQuantity || 0;
          updatePayload.productionQuantity = currentProd + processedQty;
        }
      }
    }

    if (status === 'COMPLETED') updatePayload.currentStage = OrderStage.TESTING;

    if (Object.keys(updatePayload).length > 0) {
      await tx.orm.public.Order.where({ id: dbId(orderId) }).update(updatePayload);
    }

    await tx.orm.public.StageLog.create({
      orderId: dbId(orderId),
      stage: OrderStage.MACHINING,
      changedById: validUserId ? dbId(validUserId) : null,
    });

    return await tx.orm.public.Order.where({ id: dbId(orderId) }).first();
  });
};

export const updateQualityStage = async (
  id: string,
  status: string,
  userId: string,
  notes?: string,
  qcResult?: string,
  processedQty?: number,
  passedQty?: number,
  failedQty?: number
) => {
  return await db.transaction(async (tx) => {
    const { orderId, validUserId } = await resolveOrderAndUser(tx, id, userId);

    const existingOrder = await tx.orm.public.Order.where({ id: dbId(orderId) }).first();
    if (!existingOrder) {
      throw new Error('Order not found');
    }

    const updatePayload: any = {};
    if (status) updatePayload.qualityStatus = status;
    if (qcResult) updatePayload.qcResult = qcResult;
    if (notes) updatePayload.qcRemarks = notes;

    const pQty = typeof passedQty === 'number' ? passedQty : (status === 'PASSED' || qcResult === 'PASSED' ? (processedQty || 0) : 0);
    const fQty = typeof failedQty === 'number' ? failedQty : (status === 'FAILED' || qcResult === 'FAILED' ? (processedQty || 0) : 0);
    const totalInspected = typeof processedQty === 'number' && processedQty > 0 ? processedQty : (pQty + fQty);

    if (totalInspected > 0) {
      const currentPassed = (existingOrder as any).qcPassedQuantity || 0;
      const currentFailed = (existingOrder as any).qcFailedQuantity || 0;
      const currentQc = (existingOrder as any).qcQuantity || 0;
      const currentProd = (existingOrder as any).productionQuantity || 0;
      const currentRework = (existingOrder as any).reworkQuantity || 0;

      const newPassed = currentPassed + pQty;
      const newFailed = currentFailed + fQty;
      const newQc = currentQc + totalInspected;

      updatePayload.qcPassedQuantity = newPassed;
      updatePayload.qcFailedQuantity = newFailed;
      updatePayload.qcQuantity = newQc;

      // When items fail QC (fQty > 0):
      // The failed items MUST go back to Production for remanufacturing / rework!
      // Net finished produced quantity becomes reduced by failedQty (so only good passed items remain in production output)
      if (fQty > 0) {
        updatePayload.productionQuantity = Math.max(0, currentProd - fQty);
        updatePayload.reworkQuantity = currentRework + fQty;
        updatePayload.productionStatus = 'IN_PROGRESS';
        updatePayload.currentStage = OrderStage.MACHINING; // Return to Production stage!
      } else if (newPassed >= (existingOrder as any).requiredQuantity) {
        updatePayload.currentStage = OrderStage.DISPATCH;
        updatePayload.qualityStatus = 'COMPLETED';
      }
    } else {
      if (status === 'COMPLETED' || qcResult === 'PASSED') {
        updatePayload.currentStage = OrderStage.DISPATCH;
      }
    }

    if (Object.keys(updatePayload).length > 0) {
      await tx.orm.public.Order.where({ id: dbId(orderId) }).update(updatePayload);
    }

    await tx.orm.public.StageLog.create({
      orderId: dbId(orderId),
      stage: OrderStage.TESTING,
      changedById: validUserId ? dbId(validUserId) : null,
    });

    return await tx.orm.public.Order.where({ id: dbId(orderId) }).first();
  });
};

export const updateDispatchStage = async (
  id: string,
  status: string,
  userId: string,
  notes?: string,
  logisticsEntry?: string,
  transportRef?: string,
  processedQty?: number
) => {
  return await db.transaction(async (tx) => {
    const { orderId, validUserId } = await resolveOrderAndUser(tx, id, userId);

    const order = await tx.orm.public.Order.where({ id: dbId(orderId) }).first();
    if (!order) throw new Error('Order not found');

    const updatePayload: any = {};
    if (status) updatePayload.dispatchStatus = status;
    if (notes) updatePayload.dispatchNotes = notes;
    if (logisticsEntry) updatePayload.logisticsEntry = logisticsEntry;
    if (transportRef) updatePayload.transportRef = transportRef;

    if (processedQty && processedQty > 0) {
      const currentDisp = order.dispatchQuantity || 0;
      const newDispQty = currentDisp + processedQty;
      updatePayload.dispatchQuantity = newDispQty;

      const reqQty = order.requiredQuantity || 0;
      if (newDispQty >= reqQty) {
        updatePayload.dispatchStatus = 'COMPLETED';
        updatePayload.currentStage = OrderStage.COMPLETED;
      } else {
        updatePayload.dispatchStatus = 'IN_PROGRESS';
      }
    } else if (status === 'COMPLETED' || status === 'DISPATCHED') {
      updatePayload.currentStage = OrderStage.COMPLETED;
    }

    if (Object.keys(updatePayload).length > 0) {
      await tx.orm.public.Order.where({ id: dbId(orderId) }).update(updatePayload);
    }

    await tx.orm.public.StageLog.create({
      orderId: dbId(orderId),
      stage: OrderStage.DISPATCH,
      changedById: validUserId ? dbId(validUserId) : null,
    });

    return await tx.orm.public.Order.where({ id: dbId(orderId) }).first();
  });
};

export const verifyAndCompleteOrder = async (
  id: string,
  userId: string,
  remarks?: string
) => {
  return await db.transaction(async (tx) => {
    const { orderId, validUserId } = await resolveOrderAndUser(tx, id, userId);

    await tx.orm.public.Order.where({ id: dbId(orderId) }).update({
      currentStage: OrderStage.COMPLETED,
    });

    await tx.orm.public.StageLog.create({
      orderId: dbId(orderId),
      stage: OrderStage.COMPLETED,
      changedById: validUserId ? dbId(validUserId) : null,
    });

    return await tx.orm.public.Order.where({ id: dbId(orderId) }).first();
  });
};
