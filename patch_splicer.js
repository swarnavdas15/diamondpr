const fs = require('fs');

let data = fs.readFileSync('StickerSmash/src/context/ERPContext.tsx', 'utf8');
const lines = data.split(/\r?\n/);

let createStart = lines.findIndex(l => l.includes('const createQuotation = (data: {'));
let updateStart = lines.findIndex(l => l.includes('const updateQuotation = async (id: string, data: Partial<Quotation>) => {'));
if (createStart !== -1 && updateStart !== -1) {
  lines.splice(createStart, updateStart - createStart, `  const createQuotation = async (data: any): Promise<Quotation> => {
    try {
      const res = await apiClient.post('/quotations', data);
      await fetchLiveDashboardData();
      return res.data.quotation;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };\n\n`);
  console.log("Replaced createQuotation!");
}

let convertStart = lines.findIndex(l => l.includes('const convertQuotationToOrder = async ('));
let markStart = lines.findIndex(l => l.includes('const markQuotationLost = async ('));
if (convertStart !== -1 && markStart !== -1) {
  lines.splice(convertStart, markStart - convertStart, `  const convertQuotationToOrder = async (
    quotationId: string,
    data: any
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
      console.warn('Could not sync quotation status to backend', err);
    }

    return order;
  };\n\n`);
  console.log("Replaced convertQuotationToOrder!");
}

fs.writeFileSync('StickerSmash/src/context/ERPContext.tsx', lines.join('\n'));

// Now fix QuotationsView line 636 issue:
let qv = fs.readFileSync('StickerSmash/src/components/views/QuotationsView.tsx', 'utf8');
qv = qv.replace(
  /onPress=\{\(e\) => \{\n\s*e\.stopPropagation\(\);\n\s*if \(window\.confirm/g,
  'onPress={async (e) => {\n                              e.stopPropagation();\n                              if (window.confirm'
);
fs.writeFileSync('StickerSmash/src/components/views/QuotationsView.tsx', qv);
console.log("Fixed QuotationsView await");

