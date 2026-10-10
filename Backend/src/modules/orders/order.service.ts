import { db } from '../../prisma/db';
import { dbId } from '../../prisma/ids';
import { OrderStage } from '../../types/enums';

async function generateNextClientCode(tx: any, isTemporary: boolean): Promise<string> {
  const prefix = isTemporary ? 'TMP' : 'CL';
  const pattern = `${prefix}-`;
  
  const existingClients = await tx.orm.public.Client.where({ isDeleted: 0 }).all();
  let maxNum = 1000;
  
  for (const c of existingClients) {
    const code = c.clientcode || c.clientCode || '';
    if (code.startsWith(pattern)) {
      const numStr = code.slice(pattern.length);
      const num = parseInt(numStr, 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }
  
  return `${prefix}-${maxNum + 1}`;
}

const serializeStageSequence = (stages: OrderStage[]) => stages.join(',');
const toOptionalBigInt = (value?: number | string | null) => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return BigInt(Math.round(num));
};

export class OrderService {
  static async createClient(
    data: {
      companyName: string;
      contactNo: string;
      contactName?: string;
      email?: string;
      gstNumber?: string;
      panNumber?: string;
      websiteUrl?: string;
      address?: string;
      industry?: string;
      remarks?: string;
      clientCode?: string;
      isTemporary?: boolean;
    },
    userId: string
  ) {
    const isTemp = !!data.isTemporary;
    
    let clientcode = data.clientCode && data.clientCode.trim() ? data.clientCode.trim() : await generateNextClientCode(db, isTemp);

    const client = await db.orm.public.Client.create({
      clientcode,
      companyName: data.companyName,
      contactName: data.contactName ?? null,
      contactNo: data.contactNo,
      email: data.email ?? null,
      gstNumber: data.gstNumber ?? null,
      panNumber: data.panNumber ?? null,
      websiteUrl: data.websiteUrl ?? null,
      address: data.address ?? null,
      industry: data.industry ?? null,
      remarks: data.remarks ?? null,
      createdById: userId ? dbId(userId) : undefined,
      isTemporary: isTemp,
      status: isTemp ? 'PROSPECT' : 'ACTIVE',
    });

    await db.orm.public.CompanyContact.create({
      companyId: client.id,
      fullName: data.contactName || 'Primary Contact',
      mobile: data.contactNo,
      email: data.email ?? null,
      designation: 'Primary Contact'
    });

    return client;
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
      let client = await tx.orm.public.Client.where({ id: dbId(data.clientId) }).first();
      if (!client) throw new Error('Client not found');

      let clientCode = client.clientcode;
      if (client.isTemporary) {
        if (clientCode.startsWith('TMP-')) {
          clientCode = await generateNextClientCode(tx, false);
        }

        // Promote client to permanent
        await tx.orm.public.Client.where({ id: client.id }).update({
          isTemporary: false,
          clientcode: clientCode,
          status: 'ACTIVE',
        });

        // 1. Sync all linked Quotations
        try {
          const quotes = await tx.orm.public.Quotation.where({ clientId: client.id }).all();
          for (const q of quotes) {
            await tx.orm.public.Quotation.where({ id: q.id }).update({ clientCode });
          }
        } catch (e) {
          console.warn('Sync quote clientCode warning:', e);
        }

        // 2. Sync any previously linked Orders (if any exist)
        try {
          const existingClientOrders = await tx.orm.public.Order.where({ clientId: client.id }).all();
          for (const o of existingClientOrders) {
            await tx.orm.public.Order.where({ id: o.id }).update({ clientCode });
          }
        } catch (e) {
          console.warn('Sync existing order clientCode warning:', e);
        }
      }

      const poNumber = String(data.poNumber || '').trim();
      if (!poNumber) throw new Error('PO Number is required');
      const existingPo = await tx.orm.public.Order.where({ poNumber }).first();
      if (existingPo) throw new Error(`PO Number "${poNumber}" already exists. Please use a unique PO Number.`);

      const allOrders = await tx.orm.public.Order.all();
      const orderCount = allOrders.length;
      
      const order = await tx.orm.public.Order.create({
        orderNumber: `ORD-2026-${1000 + Number(orderCount)}`,
        clientCode: clientCode, // Uses promoted permanent CL-xxxx code
        poNumber,
        clientId: dbId(data.clientId),
        requirements: data.requirements || data.technicalRequirements || '',
        technicalRequirements: data.technicalRequirements || '',
        materialRequirements: data.materialRequirements || '',
        budget: toOptionalBigInt(data.budget),
        requiredQuantity: Math.max(1, Math.round(Number(data.requiredQuantity) || 1)),
        purchaseRequired: data.purchaseRequired ?? true,
        productionRequired: data.productionRequired ?? true,
        qualityTestingRequired: data.qualityTestingRequired ?? true,
        dispatchRequired: data.dispatchRequired ?? true,
        stageSequence: serializeStageSequence(pipeline),
        currentStage: initialStage,
        createdById: userId ? dbId(userId) : undefined
      });

      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          await tx.orm.public.OrderItem.create({
            orderId: order.id,
            itemName: String(item.itemName || '').trim() || 'General Item',
            size: String(item.size || '').trim() || 'Standard',
            quantity: Math.max(1, Math.round(Number(item.quantity) || 1)),
            unitPrice: toOptionalBigInt(item.unitPrice)
          });
        }
      }

      await tx.orm.public.StageLog.create({
        orderId: order.id,
        stage: initialStage,
        changedById: userId ? dbId(userId) : undefined
      });

      return await tx.orm.public.Order
        .where({ id: order.id })
        .include('client', (client) => client.select('id', 'clientcode', 'companyName', 'contactNo'))
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
      .include('client', (client) => client.select('clientcode', 'companyName', 'contactNo'))
      .include('items', (items) => items.orderBy((item) => item.itemName.asc()))
      .include('tasks', (tasks) => tasks.orderBy((task) => task.createdAt.desc()))
     .include('purchaseBatches', (batches) => batches.orderBy((batch) => batch.createdAt.desc()))
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
    .include('client', (client) => client.select('clientcode', 'companyName', 'contactNo'))
    .include('items', (items) => items.orderBy((item) => item.itemName.asc()))
    .include('tasks', (tasks) => tasks.orderBy((task) => task.createdAt.desc()))
     .include('purchaseBatches', (batches) => batches.orderBy((batch) => batch.createdAt.desc()))
    .include('stageLogs', (logs) => logs.orderBy((log) => log.createdAt.asc()))
    .first();
};
export const updateSalesWorkflowStage = async (id: string, stage: string, userId: string, remarks?: string) => {
  return await db.orm.public.StageLog.create({
    orderId: dbId(id),
    stage: stage as OrderStage,
    changedById: userId ? dbId(userId) : undefined
  });
};
export const addPurchaseBatch = async (orderId: string, data: any, userId: string) => {
  const batch = await db.orm.public.PurchaseBatch.create({
    orderId: dbId(orderId),
    vendorName: data.vendorName,
    quantityReceived: Math.round(Number(data.quantityReceived || 0)),
    cost: data.cost ? Number(data.cost) : null,
    remarks: data.remarks || null,
    createdById: dbId(userId)
  });

  const order = await db.orm.public.Order.where({ id: dbId(orderId) }).first();
  if (!order) throw new Error('Order not found');
  
  const newPurchaseQty = (order.purchaseQuantity || 0) + Math.round(Number(data.quantityReceived || 0));
  const calcStatus = newPurchaseQty >= order.requiredQuantity ? 'COMPLETED' : 'IN_PROGRESS';
  
  await db.orm.public.Order.where({ id: dbId(orderId) }).update({
    purchaseQuantity: newPurchaseQty,
    purchaseStatus: calcStatus,
    vendorSelected: data.vendorName, // Track the latest vendor on the order itself
    procurementNotes: data.remarks
  });
  
  // Create stage log for the batch
  await updateSalesWorkflowStage(orderId, 'PURCHASE', userId, data.remarks);

  return batch;
};

export const updatePurchaseStage = async (id: string, status: string, userId: string, notes?: string, processedQty?: number, vendorSelected?: string) => {
  const updateData: any = { purchaseStatus: status };
  if (notes !== undefined) updateData.procurementNotes = notes;
  if (vendorSelected !== undefined) updateData.vendorSelected = vendorSelected;
  if (processedQty !== undefined) { const ord = await db.orm.public.Order.where({ id: dbId(id) }).first(); updateData.purchaseQuantity = Math.round(Number(ord?.purchaseQuantity || 0) + Number(processedQty)); }
  await db.orm.public.Order.where({ id: dbId(id) }).update(updateData);
  await updateSalesWorkflowStage(id, 'PURCHASE', userId, notes);
  return await getOrderById(id);
};
export const updateProductionStage = async (id: string, status: string, userId: string, notes?: string, processedQty?: number, isRework?: boolean) => {
  const order = await db.orm.public.Order.where({ id: dbId(id) }).first();
  if (!order) throw new Error('Order not found');
  const updateData: any = { productionStatus: status };
  if (notes !== undefined) updateData.shopFloorNotes = notes;
  if (processedQty !== undefined) updateData.productionQuantity = Math.round(Number(order.productionQuantity || 0) + Number(processedQty));
  if (isRework !== undefined) updateData.reworkQuantity = Math.round(Number(order.reworkQuantity || 0) + Number(processedQty || 0));
  await db.orm.public.Order.where({ id: dbId(id) }).update(updateData);
  await updateSalesWorkflowStage(id, 'PRODUCTION', userId, notes);
  return await getOrderById(id);
};
export const updateQualityStage = async (id: string, status: string, userId: string, notes?: string, processedQty?: number, qcResult?: string) => {
  const order = await db.orm.public.Order.where({ id: dbId(id) }).first();
  if (!order) throw new Error('Order not found');
  const updateData: any = { qualityStatus: status };
  if (notes !== undefined) updateData.qcRemarks = notes;
  if (qcResult !== undefined) updateData.qcResult = qcResult;
  if (processedQty !== undefined) {
    updateData.qcQuantity = Math.round(Number(order.qcQuantity || 0) + Number(processedQty));
    if (qcResult === 'PASSED') updateData.qcPassedQuantity = Math.round(Number(order.qcPassedQuantity || 0) + Number(processedQty));
    if (qcResult === 'FAILED') updateData.qcFailedQuantity = Math.round(Number(order.qcFailedQuantity || 0) + Number(processedQty));
  }
  await db.orm.public.Order.where({ id: dbId(id) }).update(updateData);
  await updateSalesWorkflowStage(id, 'TESTING', userId, notes);
  return await getOrderById(id);
};
export const updateDispatchStage = async (id: string, status: string, userId: string, notes?: string, processedQty?: number, logisticsEntry?: string, transportRef?: string) => {
  const updateData: any = { dispatchStatus: status };
  if (notes !== undefined) updateData.dispatchNotes = notes;
  if (processedQty !== undefined) { const ord = await db.orm.public.Order.where({ id: dbId(id) }).first(); updateData.dispatchQuantity = Math.round(Number(ord?.dispatchQuantity || 0) + Number(processedQty)); }
  if (logisticsEntry !== undefined) updateData.logisticsEntry = logisticsEntry;
  if (transportRef !== undefined) updateData.transportRef = transportRef;
  await db.orm.public.Order.where({ id: dbId(id) }).update(updateData);
  await updateSalesWorkflowStage(id, 'DISPATCH', userId, notes);
  return await getOrderById(id);
};
export const verifyAndCompleteOrder = async (id: string, userId: string, remarks?: string) => {
  await db.orm.public.Order.where({ id: dbId(id) }).update({ currentStage: 'COMPLETED' });
  await updateSalesWorkflowStage(id, 'COMPLETED', userId, remarks);
  return await getOrderById(id);
};
export const updateOrder = async (id: string, data: any) => {
  const updateData: any = {};
  if (data.poNumber !== undefined) updateData.poNumber = data.poNumber;
  if (data.budget !== undefined) updateData.budget = data.budget;
  if (data.technicalRequirements !== undefined) updateData.technicalRequirements = data.technicalRequirements;
  if (data.materialRequirements !== undefined) updateData.materialRequirements = data.materialRequirements;
  if (data.requiredQuantity !== undefined) updateData.requiredQuantity = data.requiredQuantity;
  if (data.purchaseRequired !== undefined) updateData.purchaseRequired = data.purchaseRequired;
  if (data.productionRequired !== undefined) updateData.productionRequired = data.productionRequired;
  if (data.qualityTestingRequired !== undefined) updateData.qualityTestingRequired = data.qualityTestingRequired;
  if (data.dispatchRequired !== undefined) updateData.dispatchRequired = data.dispatchRequired;

  if (Object.keys(updateData).length > 0) {
    await db.orm.public.Order.where({ id: dbId(id) }).update(updateData);
  }
  return await getOrderById(id);
};
