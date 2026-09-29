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
    const pipeline =
      data.stageSequence && data.stageSequence.length > 0
        ? data.stageSequence
        : [OrderStage.QUOTATION, OrderStage.PURCHASE, OrderStage.DISPATCH, OrderStage.COMPLETED];

    const initialStage = pipeline[0];

    return await db.transaction(async (tx) => {
      const order = await tx.orm.public.Order.create({
        poNumber: data.poNumber,
        clientId: dbId(data.clientId),
        requirements: data.requirements || data.technicalRequirements || '',
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
export const updateSalesWorkflowStage = async (id: string, stage: string, userId: string, remarks?: string) => {
  return await db.orm.public.StageLog.create({
    orderId: dbId(id),
    stage: stage as OrderStage,
    changedById: dbId(userId)
  });
};
export const updatePurchaseStage = updateSalesWorkflowStage;
export const updateProductionStage = updateSalesWorkflowStage;
export const updateQualityStage = updateSalesWorkflowStage;
export const updateDispatchStage = updateSalesWorkflowStage;
export const verifyAndCompleteOrder = updateSalesWorkflowStage;
