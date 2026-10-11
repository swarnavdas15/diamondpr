import { db } from '../../prisma/db';
import { dbId } from '../../prisma/ids';
import { OrderStage } from '../../types/enums';

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
      dateOfBirth?: string;
      clientCode: string;
    },
    userId: string
  ) {
    let combinedRemarks = data.remarks || '';
    if (data.dateOfBirth) {
      const dobStr = String(data.dateOfBirth).trim();
      if (dobStr) {
        combinedRemarks = `[DOB:${dobStr}] ${combinedRemarks}`.trim();
      }
    }

    const client = await db.orm.public.Client.create({
      clientcode: data.clientCode,
      companyName: data.companyName,
      contactName: data.contactName ?? null,
      contactNo: data.contactNo,
      email: data.email ?? null,
      gstNumber: data.gstNumber ?? null,
      panNumber: data.panNumber ?? null,
      websiteUrl: data.websiteUrl ?? null,
      address: data.address ?? null,
      industry: data.industry ?? null,
      remarks: combinedRemarks || null,
      createdById: userId ? dbId(userId) : undefined
    });

    await db.orm.public.CompanyContact.create({
      companyId: client.id,
      fullName: data.contactName || 'Primary Contact',
      mobile: data.contactNo,
      email: data.email ?? null,
      designation: 'Primary Contact'
    });

    const match = (client.remarks || '').match(/\[DOB:([\d\-]+)\]/);
    const dateOfBirth = match ? match[1] : undefined;
    const cleanRemarks = (client.remarks || '').replace(/\[DOB:[\d\-]+\]\s*/, '').trim();

    return {
      ...client,
      dateOfBirth,
      remarks: cleanRemarks,
    };
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
    const firstActiveStage =
      data.purchaseRequired !== false
        ? OrderStage.PURCHASE
        : (data.productionRequired !== false ? OrderStage.CUTTING : OrderStage.DISPATCH);

    const pipeline =
      data.stageSequence && data.stageSequence.length > 0
        ? data.stageSequence.filter((s: string) => s !== OrderStage.QUOTATION)
        : [firstActiveStage, OrderStage.DISPATCH, OrderStage.COMPLETED];

    const initialStage = pipeline[0] || firstActiveStage;

    return await db.transaction(async (tx) => {
      const client = await tx.orm.public.Client.where({ id: dbId(data.clientId) }).first();
      if (!client) throw new Error('Client not found');

      let effectiveClientCode = ((client as any).clientcode || (client as any).clientCode || '').toUpperCase();
      if (effectiveClientCode.startsWith('TMP') || effectiveClientCode.startsWith('TEMP')) {
        const allClients = await tx.orm.public.Client.where({ isDeleted: 0 }).all();
        const permClients = allClients.filter((c: any) => (c.clientcode || '').toUpperCase().startsWith('CL-'));
        let maxNum = 1000;
        for (const c of permClients) {
          const match = (c.clientcode || '').match(/^CL-(\d+)$/i);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNum) maxNum = num;
          }
        }
        effectiveClientCode = `CL-${maxNum + 1}`;
        await tx.orm.public.Client.where({ id: dbId(data.clientId) }).update({ clientcode: effectiveClientCode });
        const linkedQuotations = await tx.orm.public.Quotation.where({ clientId: dbId(data.clientId) }).all();
        for (const q of linkedQuotations) {
          await tx.orm.public.Quotation.where({ id: q.id }).update({ clientCode: effectiveClientCode });
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
        clientCode: effectiveClientCode,
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

      if ((data as any).customStages && Array.isArray((data as any).customStages) && (data as any).customStages.length > 0) {
        for (const stage of (data as any).customStages) {
          const stageName = stage.stageName || stage.name || 'Custom Stage';
          const stageDesc = stage.description || '';
          const dept = stage.department || 'CUSTOM_STAGE';
          const userIds: string[] = stage.assignedUserIds || (stage.assignedToUserId ? [stage.assignedToUserId] : []);
          const userNames: string[] = stage.assignedUserNames || (stage.assignedToName ? [stage.assignedToName] : []);

          if (userIds.length > 0) {
            for (let i = 0; i < userIds.length; i++) {
              const uId = userIds[i];
              let uName = userNames[i] || undefined;
              if (!uName && uId) {
                try {
                  const assignedUser = await tx.orm.public.User.where({ id: dbId(uId) }).first();
                  if (assignedUser) {
                    uName = assignedUser.name;
                  }
                } catch {
                  // ignore
                }
              }
              await tx.orm.public.Task.create({
                title: `[Custom Stage] ${stageName} - ${order.orderNumber}`,
                description: stageDesc ? `Stage Details: ${stageDesc}` : `Custom Workflow Stage: ${stageName}`,
                priority: 'HIGH',
                status: 'PENDING',
                orderId: order.id,
                orderNumber: order.orderNumber,
                assignedToDepartment: dept,
                assignedToUserId: dbId(uId),
                assignedToId: dbId(uId),
                assignedToName: uName,
                createdByName: 'System',
                createdByRole: 'SUPER_ADMIN',
              });
            }
          } else {
            await tx.orm.public.Task.create({
              title: `[Custom Stage] ${stageName} - ${order.orderNumber}`,
              description: stageDesc ? `Stage Details: ${stageDesc}` : `Custom Workflow Stage: ${stageName}`,
              priority: 'HIGH',
              status: 'PENDING',
              orderId: order.id,
              orderNumber: order.orderNumber,
              assignedToDepartment: dept,
              createdByName: 'System',
              createdByRole: 'SUPER_ADMIN',
            });
          }
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

    const orders = await query
      .include('client', (client) => client.select('clientcode', 'companyName', 'contactNo'))
      .include('items', (items) => items.orderBy((item) => item.itemName.asc()))
      .include('tasks', (tasks) => tasks.orderBy((task) => task.createdAt.desc()))
     .include('purchaseBatches', (batches) => batches.orderBy((batch) => batch.createdAt.desc()))
      .include('stageLogs', (logs) => logs.orderBy((log) => log.createdAt.asc()))
      .orderBy((order) => order.createdAt.desc())
      .all();

    return orders.map((o: any) => formatOrderWithBatches(o));
  }
}

export const encodeBatchRemarks = (meta: {
  quantityOrdered: number;
  invoiceNumber?: string;
  receivingDate?: string;
  status?: string;
  userRemarks?: string;
}) => {
  const metaObj = {
    quantityOrdered: meta.quantityOrdered,
    invoiceNumber: meta.invoiceNumber || '',
    receivingDate: meta.receivingDate || '',
    status: meta.status || 'ORDERED'
  };
  const metaStr = `[PB_META:${JSON.stringify(metaObj)}]`;
  return meta.userRemarks ? `${metaStr} ${meta.userRemarks}`.trim() : metaStr;
};

export const parseBatchRemarks = (rawRemarks?: string | null, rawQtyReceived?: number) => {
  const result = {
    quantityOrdered: rawQtyReceived || 0,
    invoiceNumber: '',
    receivingDate: '',
    status: (rawQtyReceived || 0) > 0 ? 'FULLY_RECEIVED' : 'ORDERED',
    cleanRemarks: rawRemarks || ''
  };

  if (!rawRemarks) return result;

  const match = rawRemarks.match(/\[PB_META:(.*?)\]/);
  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed.quantityOrdered !== undefined) result.quantityOrdered = Number(parsed.quantityOrdered);
      if (parsed.invoiceNumber) result.invoiceNumber = String(parsed.invoiceNumber);
      if (parsed.receivingDate) result.receivingDate = String(parsed.receivingDate);
      if (parsed.status) result.status = String(parsed.status);
      result.cleanRemarks = rawRemarks.replace(/\[PB_META:.*?\]\s*/, '').trim();
    } catch {
      // ignore
    }
  }

  const received = rawQtyReceived || 0;
  if (result.quantityOrdered > 0) {
    if (received >= result.quantityOrdered) {
      result.status = 'FULLY_RECEIVED';
    } else if (received > 0) {
      result.status = 'PARTIALLY_RECEIVED';
    } else {
      result.status = 'ORDERED';
    }
  }

  return result;
};

export const formatOrderWithBatches = (order: any) => {
  if (!order) return order;

  // Resolve legacy or invalid QUOTATION stage to active manufacturing/procurement stage
  if (!order.currentStage || order.currentStage === 'QUOTATION' || order.currentStage === 'SALES') {
    if (order.status === 'COMPLETED' || order.dispatchStatus === 'COMPLETED') {
      order.currentStage = 'COMPLETED';
    } else if (order.purchaseRequired && order.purchaseStatus !== 'COMPLETED') {
      order.currentStage = 'PURCHASE';
    } else if (order.productionRequired && order.productionStatus !== 'COMPLETED') {
      order.currentStage = 'CUTTING';
    } else if (order.qualityTestingRequired && order.qualityStatus !== 'COMPLETED') {
      order.currentStage = 'TESTING';
    } else {
      order.currentStage = 'DISPATCH';
    }
  }

  if (order.purchaseBatches && Array.isArray(order.purchaseBatches)) {
    order.purchaseBatches = order.purchaseBatches.map((b: any) => {
      const meta = parseBatchRemarks(b.remarks, b.quantityReceived);
      return {
        ...b,
        quantityOrdered: meta.quantityOrdered,
        quantityReceived: b.quantityReceived || 0,
        invoiceNumber: meta.invoiceNumber,
        invoiceRef: meta.invoiceNumber,
        receivingDate: meta.receivingDate,
        deliveryDate: meta.receivingDate,
        status: meta.status,
        remarks: meta.cleanRemarks,
      };
    });
  }
  return order;
};

export const createOrder = async (data: any, userId: string) => OrderService.createOrder(data, userId);
export const getOrders = async (userRole?: string) => OrderService.getOrdersByRole(userRole || 'ALL');
export const getOrderById = async (id: string) => {
  const order = await db.orm.public.Order
    .where({ id: dbId(id), isDeleted: 0 })
    .include('client', (client) => client.select('clientcode', 'companyName', 'contactNo'))
    .include('items', (items) => items.orderBy((item) => item.itemName.asc()))
    .include('tasks', (tasks) => tasks.orderBy((task) => task.createdAt.desc()))
    .include('purchaseBatches', (batches) => batches.orderBy((batch) => batch.createdAt.desc()))
    .include('stageLogs', (logs) => logs.orderBy((log) => log.createdAt.asc()))
    .first();

  return formatOrderWithBatches(order);
};

export const updateSalesWorkflowStage = async (id: string, stage: string, userId: string, remarks?: string) => {
  return await db.orm.public.StageLog.create({
    orderId: dbId(id),
    stage: stage as OrderStage,
    changedById: userId ? dbId(userId) : undefined
  });
};

export const addPurchaseBatch = async (orderId: string, data: any, userId: string) => {
  const order = await db.orm.public.Order.where({ id: dbId(orderId) }).first();
  if (!order) throw new Error('Order not found');

  const qtyOrdered = Math.max(0, Math.round(Number(data.quantityOrdered || data.quantityReceived || 0)));
  const qtyReceived = Math.max(0, Math.round(Number(data.quantityReceived || 0)));
  const initialStatus = qtyReceived >= qtyOrdered && qtyOrdered > 0
    ? 'FULLY_RECEIVED'
    : (qtyReceived > 0 ? 'PARTIALLY_RECEIVED' : 'ORDERED');

  const encodedRemarks = encodeBatchRemarks({
    quantityOrdered: qtyOrdered,
    invoiceNumber: data.invoiceNumber || data.invoiceRef || '',
    receivingDate: data.receivingDate || data.deliveryDate || '',
    status: initialStatus,
    userRemarks: data.remarks
  });

  const batch = await db.orm.public.PurchaseBatch.create({
    orderId: dbId(orderId),
    vendorName: data.vendorName,
    quantityReceived: qtyReceived,
    cost: data.cost ? Number(data.cost) : null,
    remarks: encodedRemarks,
    createdById: dbId(userId)
  });

  // Calculate totals across ALL batches of the order
  const allBatches = await db.orm.public.PurchaseBatch.where({ orderId: dbId(orderId) }).all();
  let totalReceived = 0;
  let allFullyReceived = true;
  for (const b of allBatches) {
    const meta = parseBatchRemarks(b.remarks, b.quantityReceived);
    const rec = Number(b.quantityReceived || 0);
    totalReceived += rec;
    if (meta.quantityOrdered > 0 && rec < meta.quantityOrdered) {
      allFullyReceived = false;
    }
  }

  // REQUIREMENT 3: "Purchase Done" logic:
  // Order turant "Purchase Done" nahi hoga. Jab poora order cycle complete ho jayega
  // (yaani jitne order diye the, jaise total 100, wo poore alag-alag vendors se fully receive ho jayenge),
  // tabhi overall status "Purchase Done" mein convert hoga.
  let calcStatus = 'IN_PROGRESS';
  if (totalReceived >= order.requiredQuantity && allFullyReceived) {
    calcStatus = 'COMPLETED';
  } else if (totalReceived > 0) {
    calcStatus = 'IN_PROGRESS';
  } else {
    calcStatus = 'IN_PROGRESS'; // Order Placed / Pending Receive
  }

  await db.orm.public.Order.where({ id: dbId(orderId) }).update({
    purchaseQuantity: totalReceived,
    purchaseStatus: calcStatus,
    vendorSelected: data.vendorName,
    procurementNotes: calcStatus === 'COMPLETED'
      ? 'Material fully procured and received.'
      : (totalReceived > 0
          ? `Partial receipt: ${totalReceived}/${order.requiredQuantity} pcs`
          : `Order placed with ${data.vendorName} (${qtyOrdered} pcs) - Pending Receive`)
  });

  await updateSalesWorkflowStage(
    orderId,
    'PURCHASE',
    userId,
    qtyReceived > 0
      ? `Received ${qtyReceived}/${qtyOrdered} pcs from ${data.vendorName}`
      : `Placed purchase order for ${qtyOrdered} pcs with ${data.vendorName} (Pending Receive)`
  );

  return {
    ...batch,
    quantityOrdered: qtyOrdered,
    quantityReceived: qtyReceived,
    invoiceNumber: data.invoiceNumber || '',
    receivingDate: data.receivingDate || '',
    status: initialStatus,
    remarks: data.remarks || ''
  };
};

export const receivePurchaseBatch = async (
  orderId: string,
  batchId: string,
  data: {
    receivedQuantity: number;
    invoiceNumber: string;
    receivingDate: string;
    remarks?: string;
  },
  userId: string
) => {
  const batch = await db.orm.public.PurchaseBatch.where({ id: dbId(batchId) }).first();
  if (!batch) throw new Error('Purchase batch not found');

  const meta = parseBatchRemarks(batch.remarks, batch.quantityReceived);
  const newReceivedQty = Math.max(0, Math.round(Number(data.receivedQuantity || 0)));
  const qtyOrdered = meta.quantityOrdered || newReceivedQty;

  const newStatus = newReceivedQty >= qtyOrdered && qtyOrdered > 0
    ? 'FULLY_RECEIVED'
    : (newReceivedQty > 0 ? 'PARTIALLY_RECEIVED' : 'ORDERED');

  const encodedRemarks = encodeBatchRemarks({
    quantityOrdered: qtyOrdered,
    invoiceNumber: data.invoiceNumber || meta.invoiceNumber,
    receivingDate: data.receivingDate || meta.receivingDate || new Date().toISOString().split('T')[0],
    status: newStatus,
    userRemarks: data.remarks || meta.cleanRemarks
  });

  await db.orm.public.PurchaseBatch.where({ id: dbId(batchId) }).update({
    quantityReceived: newReceivedQty,
    remarks: encodedRemarks
  });

  const order = await db.orm.public.Order.where({ id: dbId(orderId) }).first();
  if (!order) throw new Error('Order not found');

  const allBatches = await db.orm.public.PurchaseBatch.where({ orderId: dbId(orderId) }).all();
  let totalReceived = 0;
  let allFullyReceived = true;
  for (const b of allBatches) {
    const bRec = b.id === batchId ? newReceivedQty : (b.quantityReceived || 0);
    const bMeta = b.id === batchId
      ? { quantityOrdered: qtyOrdered, status: newStatus }
      : parseBatchRemarks(b.remarks, b.quantityReceived);
    totalReceived += bRec;
    if (bMeta.quantityOrdered > 0 && bRec < bMeta.quantityOrdered) {
      allFullyReceived = false;
    }
  }

  // REQUIREMENT 3: "Purchase Done" logic:
  let calcStatus = 'IN_PROGRESS';
  if (totalReceived >= order.requiredQuantity && allFullyReceived) {
    calcStatus = 'COMPLETED';
  } else if (totalReceived > 0) {
    calcStatus = 'IN_PROGRESS';
  } else {
    calcStatus = 'IN_PROGRESS';
  }

  await db.orm.public.Order.where({ id: dbId(orderId) }).update({
    purchaseQuantity: totalReceived,
    purchaseStatus: calcStatus,
    procurementNotes: calcStatus === 'COMPLETED'
      ? 'Material fully procured and verified.'
      : `Material receipt in progress (${totalReceived}/${order.requiredQuantity} pcs received)`
  });

  await updateSalesWorkflowStage(
    orderId,
    'PURCHASE',
    userId,
    `Received ${newReceivedQty} pcs from ${batch.vendorName} (Invoice: ${data.invoiceNumber})`
  );

  return { success: true, batchId, purchaseStatus: calcStatus, totalReceived };
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
  if (data.poNumber !== undefined) updateData.poNumber = String(data.poNumber).trim();
  if (data.clientId !== undefined) updateData.clientId = dbId(data.clientId);
  if (data.clientCode !== undefined) updateData.clientCode = data.clientCode;
  if (data.clientName !== undefined) updateData.clientName = data.clientName;
  if (data.budget !== undefined) updateData.budget = toOptionalBigInt(data.budget);
  if (data.technicalRequirements !== undefined) updateData.technicalRequirements = data.technicalRequirements;
  if (data.materialRequirements !== undefined) updateData.materialRequirements = data.materialRequirements;
  if (data.requiredQuantity !== undefined) updateData.requiredQuantity = Math.max(1, Math.round(Number(data.requiredQuantity) || 1));
  if (data.purchaseRequired !== undefined) updateData.purchaseRequired = data.purchaseRequired;
  if (data.productionRequired !== undefined) updateData.productionRequired = data.productionRequired;
  if (data.qualityTestingRequired !== undefined) updateData.qualityTestingRequired = data.qualityTestingRequired;
  if (data.dispatchRequired !== undefined) updateData.dispatchRequired = data.dispatchRequired;

  if (Object.keys(updateData).length > 0) {
    await db.orm.public.Order.where({ id: dbId(id) }).update(updateData);
  }

  if (data.items && Array.isArray(data.items) && data.items.length > 0) {
    await db.orm.public.OrderItem.where({ orderId: dbId(id) }).delete();
    for (const item of data.items) {
      if (item.itemName) {
        await db.orm.public.OrderItem.create({
          orderId: dbId(id),
          itemName: item.itemName,
          size: item.size || '',
          quantity: Number(item.quantity) || 1,
          unitPrice: toOptionalBigInt(item.unitPrice),
        });
      }
    }
  }

  return await getOrderById(id);
};
