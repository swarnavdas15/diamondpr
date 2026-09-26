import { PrismaClient, DepartmentStatus, SalesWorkflowStage, QCResult } from '@prisma/client';

const prisma = new PrismaClient();

export const createOrder = async (data: {
  poNumber: string;
  clientId: string;
  budget?: number;
  technicalRequirements?: string;
  materialRequirements?: string;
  requiredQuantity?: number;
  purchaseRequired?: boolean;
  productionRequired?: boolean;
  qualityTestingRequired?: boolean;
  dispatchRequired?: boolean;
  items?: Array<{ itemName: string; size: string; quantity: number; unitPrice?: number }>;
  createdById: string;
}) => {
  const client = await prisma.client.findUnique({ where: { id: data.clientId } });
  if (!client) throw new Error('Client not found');

  const count = await prisma.order.count();
  const orderNumber = `ORD-2026-${String(count + 1).padStart(3, '0')}`;

  const order = await prisma.order.create({
    data: {
      orderNumber,
      poNumber: data.poNumber,
      clientId: data.clientId,
      clientCode: client.clientCode,
      budget: data.budget,
      technicalRequirements: data.technicalRequirements,
      materialRequirements: data.materialRequirements,
      requiredQuantity: data.requiredQuantity || 1,

      // Custom pipeline setup
      purchaseRequired: data.purchaseRequired ?? true,
      productionRequired: data.productionRequired ?? true,
      qualityTestingRequired: data.qualityTestingRequired ?? true,
      dispatchRequired: data.dispatchRequired ?? true,

      salesWorkflowStage: SalesWorkflowStage.REQUIREMENT_RECEIVED,
      status: DepartmentStatus.IN_PROGRESS,
      createdById: data.createdById,

      items: data.items
        ? {
            create: data.items.map((i) => ({
              itemName: i.itemName,
              size: i.size,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
            })),
          }
        : undefined,

      stageLogs: {
        create: [
          {
            department: 'SALES',
            action: 'Order Initiated',
            currentStatus: 'REQUIREMENT_RECEIVED',
            remarks: 'New sales order registered with custom pipeline options.',
            changedById: data.createdById,
          },
        ],
      },
    },
    include: {
      client: true,
      items: true,
      stageLogs: true,
    },
  });

  return order;
};

export const getOrders = async (userRole?: string) => {
  const whereCondition: any = {};

  // Quality Testing Dashboard strictly shows only orders where qualityTestingRequired = true
  if (userRole === 'QUALITY_TESTING') {
    whereCondition.qualityTestingRequired = true;
  }

  // Dispatch Dashboard shows completed/approved/QC passed orders
  if (userRole === 'DISPATCH') {
    whereCondition.dispatchRequired = true;
  }

  return prisma.order.findMany({
    where: whereCondition,
    include: {
      client: true,
      items: true,
      tasks: true,
      stageLogs: {
        orderBy: { createdAt: 'desc' },
        include: {
          changedBy: {
            select: { id: true, name: true, role: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const getOrderById = async (id: string) => {
  return prisma.order.findUnique({
    where: { id },
    include: {
      client: true,
      items: true,
      tasks: {
        include: {
          createdBy: { select: { id: true, name: true, role: true } },
          assignedTo: { select: { id: true, name: true, role: true } },
        },
      },
      drawings: true,
      notes: true,
      stageLogs: {
        orderBy: { createdAt: 'desc' },
        include: {
          changedBy: {
            select: { id: true, name: true, role: true },
          },
        },
      },
    },
  });
};

export const updateSalesWorkflowStage = async (
  orderId: string,
  stage: SalesWorkflowStage,
  userId: string,
  remarks?: string
) => {
  const drawingApproved = stage === SalesWorkflowStage.DRAWING_APPROVED || stage === SalesWorkflowStage.ORDER_CONFIRMED;

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      salesWorkflowStage: stage,
      drawingApproved,
      stageLogs: {
        create: {
          department: 'SALES',
          action: `Sales Workflow Stage -> ${stage}`,
          currentStatus: stage,
          remarks: remarks || `Sales updated stage to ${stage}`,
          changedById: userId,
        },
      },
    },
  });
  return order;
};

export const updatePurchaseStage = async (
  orderId: string,
  data: { status: DepartmentStatus; vendorSelected?: string; procurementNotes?: string },
  userId: string
) => {
  return prisma.order.update({
    where: { id: orderId },
    data: {
      purchaseStatus: data.status,
      vendorSelected: data.vendorSelected,
      procurementNotes: data.procurementNotes,
      stageLogs: {
        create: {
          department: 'PURCHASE',
          action: `Purchase Status -> ${data.status}`,
          currentStatus: data.status,
          remarks: data.procurementNotes || `Vendor: ${data.vendorSelected || 'N/A'}`,
          changedById: userId,
        },
      },
    },
  });
};

export const updateProductionStage = async (
  orderId: string,
  data: { status: DepartmentStatus; shopFloorNotes?: string },
  userId: string
) => {
  return prisma.order.update({
    where: { id: orderId },
    data: {
      productionStatus: data.status,
      shopFloorNotes: data.shopFloorNotes,
      stageLogs: {
        create: {
          department: 'PRODUCTION',
          action: `Production Status -> ${data.status}`,
          currentStatus: data.status,
          remarks: data.shopFloorNotes || 'Shop floor progress updated',
          changedById: userId,
        },
      },
    },
  });
};

export const updateQualityStage = async (
  orderId: string,
  data: { status: DepartmentStatus; qcResult?: QCResult; qcRemarks?: string },
  userId: string
) => {
  return prisma.order.update({
    where: { id: orderId },
    data: {
      qualityStatus: data.status,
      qcResult: data.qcResult || QCResult.PENDING,
      qcRemarks: data.qcRemarks,
      stageLogs: {
        create: {
          department: 'QUALITY_TESTING',
          action: `Quality Status -> ${data.status} (${data.qcResult || 'PENDING'})`,
          currentStatus: data.status,
          remarks: data.qcRemarks || 'Quality inspection updated',
          changedById: userId,
        },
      },
    },
  });
};

export const updateDispatchStage = async (
  orderId: string,
  data: { status: DepartmentStatus; logisticsEntry?: string; transportRef?: string; dispatchNotes?: string },
  userId: string
) => {
  return prisma.order.update({
    where: { id: orderId },
    data: {
      dispatchStatus: data.status,
      logisticsEntry: data.logisticsEntry,
      transportRef: data.transportRef,
      dispatchNotes: data.dispatchNotes,
      stageLogs: {
        create: {
          department: 'DISPATCH',
          action: `Dispatch Status -> ${data.status}`,
          currentStatus: data.status,
          remarks: `Transport Ref: ${data.transportRef || 'N/A'}. ${data.dispatchNotes || ''}`,
          changedById: userId,
        },
      },
    },
  });
};

export const verifyAndCompleteOrder = async (orderId: string, userId: string, remarks?: string) => {
  return prisma.order.update({
    where: { id: orderId },
    data: {
      salesVerification: DepartmentStatus.COMPLETED,
      status: DepartmentStatus.COMPLETED,
      stageLogs: {
        create: {
          department: 'SALES',
          action: 'Final Sales Verification - Order Closed',
          currentStatus: 'COMPLETED',
          remarks: remarks || 'Sales verified all departmental workflows and marked order completed.',
          changedById: userId,
        },
      },
    },
  });
};
