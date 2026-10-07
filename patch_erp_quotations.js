const fs = require('fs');

let file = 'StickerSmash/src/context/ERPContext.tsx';
let data = fs.readFileSync(file, 'utf8');

// 1. Update Types
data = data.replace(
  /createQuotation: \(data: \{([\s\S]*?)\}\) => Quotation;/,
  "createQuotation: (data: {$1}) => Promise<Quotation>;"
);
data = data.replace(
  "updateQuotation: (id: string, data: Partial<Quotation>) => void;",
  "updateQuotation: (id: string, data: Partial<Quotation>) => Promise<void>;"
);
data = data.replace(
  "addQuotationFollowUp: (\n    quotationId: string,\n    data: { followUpDate: string; notes: string; status: FollowUpStatus }\n  ) => void;",
  "addQuotationFollowUp: (\n    quotationId: string,\n    data: { followUpDate: string; notes: string; status: FollowUpStatus }\n  ) => Promise<void>;"
);
data = data.replace(
  /markQuotationLost: \([\s\S]*?\) => void;/,
  `markQuotationLost: (
    quotationId: string,
    data: { lostReason: LostReason; lostValue?: number; lostRemarks?: string; lostDate?: string; }
  ) => Promise<void>;`
);
data = data.replace(
  "deleteQuotation: (id: string) => void;",
  "deleteQuotation: (id: string) => Promise<void>;"
);

// 2. Hydration
data = data.replace(
  "const [clientsRes, ordersRes, contactsRes] = await Promise.all([\n        apiClient.get('/clients'),\n        apiClient.get('/orders'),\n        apiClient.get('/clients/contacts')\n      ]);",
  "const [clientsRes, ordersRes, contactsRes, quotationsRes] = await Promise.all([\n        apiClient.get('/clients'),\n        apiClient.get('/orders'),\n        apiClient.get('/clients/contacts'),\n        apiClient.get('/quotations')\n      ]);"
);
data = data.replace(
  "setCompanyContacts(contactsRes.data.contacts || []);",
  "setCompanyContacts(contactsRes.data.contacts || []);\n      setQuotations(quotationsRes.data.quotations || []);"
);

// 3. Methods

const oldCreateQuotation = /const createQuotation = \([\s\S]*?return newQuotation;\n  \};/m;
const newCreateQuotation = `const createQuotation = async (data: {
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
  };`;
data = data.replace(oldCreateQuotation, newCreateQuotation);

const oldUpdateQuotation = /const updateQuotation = \(id: string, data: Partial<Quotation>\) => \{[\s\S]*?\n  \};/m;
const newUpdateQuotation = `const updateQuotation = async (id: string, data: Partial<Quotation>) => {
    try {
      await apiClient.patch(\`/quotations/\${id}\`, data);
      await fetchLiveDashboardData();
    } catch (e) {
      console.error(e);
      throw e;
    }
  };`;
data = data.replace(oldUpdateQuotation, newUpdateQuotation);

const oldAddQuotationFollowUp = /const addQuotationFollowUp = \([\s\S]*?\n  \};/m;
const newAddQuotationFollowUp = `const addQuotationFollowUp = async (
    quotationId: string,
    data: { followUpDate: string; notes: string; status: FollowUpStatus }
  ) => {
    try {
      await apiClient.post(\`/quotations/\${quotationId}/follow-up\`, data);
      await fetchLiveDashboardData();
    } catch (e) {
      console.error(e);
      throw e;
    }
  };`;
data = data.replace(oldAddQuotationFollowUp, newAddQuotationFollowUp);

const oldMarkQuotationLost = /const markQuotationLost = \([\s\S]*?\n  \};/m;
const newMarkQuotationLost = `const markQuotationLost = async (
    quotationId: string,
    data: {
      lostReason: LostReason;
      lostValue?: number;
      lostRemarks?: string;
      lostDate?: string;
    }
  ) => {
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
  };`;
data = data.replace(oldMarkQuotationLost, newMarkQuotationLost);

const oldDeleteQuotation = /const deleteQuotation = \(id: string\) => \{\n    setQuotations\(prev => prev.filter\(q => q.id !== id\)\);\n  \};/;
const newDeleteQuotation = `const deleteQuotation = async (id: string) => {
    try {
      await apiClient.delete(\`/quotations/\${id}\`);
      await fetchLiveDashboardData();
    } catch (e) {
      console.error(e);
      throw e;
    }
  };`;
data = data.replace(oldDeleteQuotation, newDeleteQuotation);

const oldConvertQuotation = /const convertQuotationToOrder = async \([\s\S]*?return order;\n  \};/m;
const newConvertQuotation = `const convertQuotationToOrder = async (
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
    
    if (!targetClient || !targetClient.id) {
      throw new Error('Failed to create or link client for this quotation.');
    }

    // 1. Create the live order
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

    // 2. Inform the backend that the quotation was converted
    try {
      await apiClient.patch(\`/quotations/\${quotationId}\`, {
        status: 'FULLY_CONVERTED',
        convertedOrderValue: data.convertedOrderValue,
        convertedOrderId: order.id,
        convertedOrderNumber: order.orderNumber,
        isLocked: true
      });
      await fetchLiveDashboardData();
    } catch (err) {
      console.warn('Failed to fully mark quotation as converted on the backend:', err);
      // We don't throw because the order was already successfully created
    }

    return order;
  };`;
data = data.replace(oldConvertQuotation, newConvertQuotation);

fs.writeFileSync(file, data);
console.log('ERPContext quotation integration patched!');
