const fs = require('fs');
let data = fs.readFileSync('StickerSmash/src/context/ERPContext.tsx', 'utf8');

// Fix 1: fetchLiveDashboardData
const oldFetchRegex = /const \[clientsRes, ordersRes, contactsRes\] = await Promise\.all\(\[\s*apiClient\.get\('\/clients'\),\s*apiClient\.get\('\/orders'\),\s*apiClient\.get\('\/clients\/contacts'\)\s*\]\);/;
data = data.replace(oldFetchRegex, `const [clientsRes, ordersRes, contactsRes, quotationsRes] = await Promise.all([
          apiClient.get('/clients'),
          apiClient.get('/orders'),
          apiClient.get('/clients/contacts'),
          apiClient.get('/quotations')
        ]);`);

// Fix 2: createQuotation
const createQRegex = /const createQuotation = \(data: \{[\s\S]*?return newQuotation;\n  \};/m;
const newCreateQ = `const createQuotation = async (data: any): Promise<Quotation> => {
    try {
      const res = await apiClient.post('/quotations', data);
      await fetchLiveDashboardData();
      return res.data.quotation;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };`;
data = data.replace(createQRegex, newCreateQ);

// Fix 3: convertQuotationToOrder
const convertQRegex = /const convertQuotationToOrder = async \([\s\S]*?return newOrder;\n  \};/m;
const newConvertQ = `const convertQuotationToOrder = async (
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
data = data.replace(convertQRegex, newConvertQ);

// Fix 4: deleteQuotation
const deleteQRegex = /const deleteQuotation = \(id: string\) => \{\s*setQuotations\(prev => prev\.filter\(q => q\.id !== id\)\);\s*\};/m;
const newDeleteQ = `const deleteQuotation = async (id: string): Promise<void> => {
    try {
      await apiClient.delete(\`/quotations/\${id}\`);
      await fetchLiveDashboardData();
    } catch (e) {
      console.error(e);
      throw e;
    }
  };`;
data = data.replace(deleteQRegex, newDeleteQ);

fs.writeFileSync('StickerSmash/src/context/ERPContext.tsx', data);
console.log("Replaced using strong regexes!");

