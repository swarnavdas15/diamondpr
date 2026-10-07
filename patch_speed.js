const fs = require('fs');

function injectFastParsing(file) {
  let data = fs.readFileSync(file, 'utf8');

  // Inject apiClient import
  if (!data.includes("import { apiClient }")) {
    data = data.replace("import { useERP }", "import { apiClient } from '../api/client';\nimport { useERP }");
  }
  
  if (file.includes('CreateClientModal')) {
    data = data.replace(
      /const processExcelData = async \(binaryStr: string\) => \{[\s\S]*?\} catch \(err\) \{/,
      `const processExcelData = async (binaryStr: string) => {
    try {
      setSuccessMsg('Processing Excel Data...');
      const workbook = XLSX.read(binaryStr, { type: 'binary' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      const processedCodes = new Set<string>();
      const validRows = [];

      for (const row of data as any[]) {
        const clientCode = row['ClientCode'];
        const companyName = row['CompanyName'];
        const contactNo = row['ContactNo'];
        if (!clientCode || !companyName || !contactNo) continue;
        
        const normalizedCode = clientCode.toString().trim().toLowerCase();
        const isDuplicateInState = clients.some(
          (c) => (c.clientCode || '').trim().toLowerCase() === normalizedCode
        );

        if (!isDuplicateInState && !processedCodes.has(normalizedCode)) {
          processedCodes.add(normalizedCode);
          validRows.push({
            clientCode: clientCode.toString(),
            companyName: companyName.toString(),
            contactNo: contactNo.toString(),
            contactName: row['ContactName'] ? row['ContactName'].toString() : '',
            email: row['Email'] ? row['Email'].toString() : '',
            address: row['Address'] ? row['Address'].toString() : '',
            gstNumber: row['GSTNumber'] ? row['GSTNumber'].toString() : '',
            industry: row['Industry'] ? row['Industry'].toString() : '',
            remarks: row['Remarks'] ? row['Remarks'].toString() : '',
          });
        }
      }

      let successCount = 0;
      const chunkSize = 20;
      
      for (let i = 0; i < validRows.length; i += chunkSize) {
        const chunk = validRows.slice(i, i + chunkSize);
        await Promise.all(
          chunk.map((data) =>
            apiClient.post(\`/orders/client\`, data).then(() => { successCount++; }).catch(e => console.error(e))
          )
        );
      }

      if (successCount > 0) {
        await refreshData();
        setSuccessMsg(\`Successfully imported \${successCount} clients from Excel.\`);
        setTimeout(() => handleClose(), 2000);
      } else {
        setError('No valid/new clients found in the Excel file.');
        setSuccessMsg('');
      }
    } catch (err) {`
    );
  } else if (file.includes('CreateOrderModal')) {
    data = data.replace(
      /const processExcelData = \(data: any\[\]\) => \{[\s\S]*?if \(successCount > 0\) \{/,
      `const processExcelData = async (data: any[]) => {
      setSuccessMsg('Processing Excel Data...');
      let successCount = 0;
      let errCount = 0;
      
      const validOrders = [];
      data.forEach((row) => {
        const client = clients.find(c => 
          (row.ClientCode && c.clientCode.toLowerCase() === String(row.ClientCode).toLowerCase()) || 
          (row.ClientCode && c.companyName.toLowerCase() === String(row.ClientCode).toLowerCase())
        );
        if (!client) {
          errCount++;
          return;
        }
        validOrders.push({
          clientId: client.id,
          poNumber: row.PONumber ? row.PONumber.toString() : '',
          convertedOrderValue: row.Budget ? parseFloat(row.Budget) : 0,
          technicalRequirements: row.TechnicalRequirements || '',
          materialRequirements: row.MaterialRequirements || '',
          requiredQuantity: row.RequiredQuantity ? parseInt(row.RequiredQuantity, 10) : 1,
          purchaseRequired: true,
          productionRequired: true,
          qualityTestingRequired: true,
          dispatchRequired: true,
          items: [{
             itemName: row.ItemName || 'Bulk Imported Item',
             size: row.Size || '',
             quantity: row.RequiredQuantity ? parseInt(row.RequiredQuantity, 10) : 1,
             unitPrice: row.UnitPrice ? parseFloat(row.UnitPrice) : undefined,
          }]
        });
      });
      
      const chunkSize = 20;
      for (let i = 0; i < validOrders.length; i += chunkSize) {
        const chunk = validOrders.slice(i, i + chunkSize);
        await Promise.all(
          chunk.map((orderData) =>
            apiClient.post(\`/orders\`, orderData).then(() => { successCount++; }).catch(e => { errCount++; console.error(e); })
          )
        );
      }
      
      if (successCount > 0) {
        await refreshData();
        `
    );
    
    // Also, CreateOrderModal processExcelData was synchronous, but now it's async, we need to ensure the caller awaits it or handles it properly.
    // The caller is inside handleFileUpload reader.onload
    // reader.onload = (evt) => {
    //   const bstr = evt.target?.result as string;
    //   const workbook = XLSX.read(bstr, { type: 'binary' });
    //   ...
    //   processExcelData(data);
    // }
    // Since it's fire-and-forget, it works fine.
  }

  // Add refreshData to useERP destructuring
  if (!data.includes('refreshData')) {
    data = data.replace("useERP();", "useERP();\n  const { refreshData } = useERP(); // Just in case it wasn't destructured");
  }

  fs.writeFileSync(file, data);
}

injectFastParsing('StickerSmash/src/components/CreateClientModal.tsx');
injectFastParsing('StickerSmash/src/components/CreateOrderModal.tsx');
