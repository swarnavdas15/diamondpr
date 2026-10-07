const fs = require('fs');
let data = fs.readFileSync('StickerSmash/src/context/ERPContext.tsx', 'utf8');
const lines = data.split(/\r?\n/);
let startIndex = -1;
let endIndex = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const createQuotation =')) {
    if (startIndex === -1) startIndex = i; // first match
  }
  if (lines[i].includes('const createOrder = async')) {
    endIndex = i; // createOrder is right after convertQuotationToOrder maybe?
    break;
  }
}

console.log("Start:", startIndex, "End:", endIndex);

const newQuotationMethods = `
  const createQuotation = async (data: {
    companyName: string;
    clientCode: string;
    clientId?: string;
    contactPerson: string;
    mobileNumber: string;
    email: string;
    inquiryRef?: string;
    quotationAmount: number;
    expectedOrderValue?: number;
    salesExecutive: string;
    followUpDate?: string;
    status?: QuotationStatus;
    remarks?: string;
  }): Promise<Quotation> => {
    try {
      const res = await apiClient.post('/quotations', data);
      await fetchLiveDashboardData();
      return res.data.quotation;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const updateQuotation = async (id: string, data: Partial<Quotation>): Promise<void> => {
    try {
      await apiClient.patch(\`/quotations/\${id}\`, data);
      await fetchLiveDashboardData();
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const addQuotationFollowUp = async (
    quotationId: string,
    data: { followUpDate: string; notes: string; status: FollowUpStatus }
  ): Promise<void> => {
    try {
      await apiClient.post(\`/quotations/\${quotationId}/follow-up\`, data);
      await fetchLiveDashboardData();
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const markQuotationLost = async (
    quotationId: string,
    data: {
      lostReason: LostReason;
      lostValue?: number;
      lostRemarks?: string;
      lostDate?: string;
    }
  ): Promise<void> => {
    try {
      await apiClient.patch(\`/quotations/\${quotationId}\`, {
        status: 'LOST',
        ...data
      });
      await fetchLiveDashboardData();
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const deleteQuotation = async (id: string): Promise<void> => {
    try {
      await apiClient.delete(\`/quotations/\${id}\`);
      await fetchLiveDashboardData();
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const convertQuotationToOrder = async (
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
  ): Promise<Order> => {
    const targetQuotation = quotations.find((q) => q.id === quotationId);
    if (!targetQuotation) {
      throw new Error('Quotation not found.');
    }
    if (targetQuotation.status === 'FULLY_CONVERTED' || targetQuotation.status === 'LOST') {
      throw new Error('Cannot convert a quotation that is already fully converted or lost.');
    }

    let targetClient = clients.find(
      (c) => c.clientCode.toLowerCase() === targetQuotation.clientCode.toLowerCase()
    );

    if (!targetClient) {
      targetClient = await createClient({
        clientCode: targetQuotation.clientCode,
        companyName: targetQuotation.companyName,
        contactName: targetQuotation.contactPerson,
        contactNo: targetQuotation.mobileNumber,
        email: targetQuotation.email,
      });
    }

    if (!targetClient || !targetClient.id) throw new Error('Client creation failed');
    const order = await createOrder({
      clientId: targetClient.id,
      poNumber: data.poNumber || \`PO-\${targetQuotation.quotationNumber}\`,
      technicalRequirements: data.technicalRequirements,
      materialRequirements: data.materialRequirements,
      requiredQuantity: data.requiredQuantity,
      purchaseRequired: data.purchaseRequired,
      productionRequired: data.productionRequired,
      qualityTestingRequired: data.qualityTestingRequired,
      dispatchRequired: data.dispatchRequired,
      budget: data.convertedOrderValue,
      items: data.items,
    });

    try {
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
    }

    return order;
  };

`;

if (startIndex > -1 && endIndex > -1) {
  lines.splice(startIndex, endIndex - startIndex, newQuotationMethods);
  fs.writeFileSync('StickerSmash/src/context/ERPContext.tsx', lines.join('\\n'));
  console.log("Successfully injected new methods!");
} else {
  console.log("Could not find start/end bounds.");
}
