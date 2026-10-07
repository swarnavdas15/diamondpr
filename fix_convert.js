const fs = require('fs');
let data = fs.readFileSync('StickerSmash/src/context/ERPContext.tsx', 'utf8');

const oldFuncStart = `  const convertQuotationToOrder = async (
    quotationId: string,
    data: {
      convertedOrderValue: number;
      poNumber?: string;
      technicalRequirements?: string;
      materialRequirements?: string;
      requiredQuantity?: number;
      purchaseRequired?: boolean;
      productionRequired?: boolean;
      qualityTestingRequired?: boolean;
      dispatchRequired?: boolean;
      customStages?: Omit<CustomStage, 'id' | 'createdAt' | 'status'>[];
      items?: Array<{ itemName: string; size: string; quantity: number; unitPrice?: number }>;
    }
  ): Order => {`;
  
const newFuncStart = `  const convertQuotationToOrder = async (
    quotationId: string,
    data: {
      convertedOrderValue: number;
      poNumber?: string;
      technicalRequirements?: string;
      materialRequirements?: string;
      requiredQuantity?: number;
      purchaseRequired?: boolean;
      productionRequired?: boolean;
      qualityTestingRequired?: boolean;
      dispatchRequired?: boolean;
      customStages?: Omit<CustomStage, 'id' | 'createdAt' | 'status'>[];
      items?: Array<{ itemName: string; size: string; quantity: number; unitPrice?: number }>;
    }
  ): Promise<Order> => {`;

data = data.replace(oldFuncStart, newFuncStart);

// Also fix targetClient undefined issue
const oldTargetClientCheck = `    if (!targetClient) {
      targetClient = await createClient({`;
const newTargetClientCheck = `    if (!targetClient) {
      targetClient = await createClient({`;

const oldAfterClient = `    const order = await createOrder({
      clientId: targetClient.id,`;
const newAfterClient = `    if (!targetClient || !targetClient.id) throw new Error('Client creation failed');
    const order = await createOrder({
      clientId: targetClient.id,`;

data = data.replace(oldAfterClient, newAfterClient);

// Update quotation live sync
const oldUpdateCall = `    updateQuotation(quotationId, {
      status: 'FULLY_CONVERTED',
      convertedOrderValue: data.convertedOrderValue,
      convertedOrderId: order.id,
      convertedOrderNumber: order.orderNumber,
      isLocked: true
    });`;
const newUpdateCall = `    try {
      await apiClient.patch(\`/quotations/\${quotationId}\`, {
        status: 'FULLY_CONVERTED',
        convertedOrderValue: data.convertedOrderValue,
        convertedOrderId: order.id,
        convertedOrderNumber: order.orderNumber,
        isLocked: true
      });
      await fetchLiveDashboardData();
    } catch(err) {
      console.warn("Could not sync quotation status to backend", err);
    }`;

data = data.replace(oldUpdateCall, newUpdateCall);

fs.writeFileSync('StickerSmash/src/context/ERPContext.tsx', data);
console.log("Fixed convertQuotationToOrder");
