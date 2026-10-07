const fs = require('fs');

let data = fs.readFileSync('StickerSmash/src/context/ERPContext.tsx', 'utf8');

const createQuotationRegex = /const createQuotation = \(data: \{[\s\S]*?return newQuotation;\n  \};/m;
const newCreateQuotation = `const createQuotation = async (data: any): Promise<Quotation> => {
    try {
      const res = await apiClient.post('/quotations', data);
      await fetchLiveDashboardData();
      return res.data.quotation;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };`;

data = data.replace(createQuotationRegex, newCreateQuotation);

const convertQuotationRegex = /const convertQuotationToOrder = async \([\s\S]*?return newOrder;\n  \};/m;
const newConvertQuotation = `const convertQuotationToOrder = async (
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
  };`;

data = data.replace(convertQuotationRegex, newConvertQuotation);

const deleteQuotationRegex = /const deleteQuotation = \(id: string\) => \{\n    setQuotations\(prev => prev\.filter\(q => q\.id !== id\)\);\n  \};/m;
const newDeleteQuotation = `const deleteQuotation = async (id: string): Promise<void> => {
    try {
      await apiClient.delete(\`/quotations/\${id}\`);
      await fetchLiveDashboardData();
    } catch (e) {
      console.error(e);
      throw e;
    }
  };`;

data = data.replace(deleteQuotationRegex, newDeleteQuotation);

fs.writeFileSync('StickerSmash/src/context/ERPContext.tsx', data);
console.log("Replaced createQuotation, convertQuotationToOrder, deleteQuotation.");
