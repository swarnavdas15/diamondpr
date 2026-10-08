const fs = require('fs');

let contractStr = fs.readFileSync('Backend/src/prisma/contract.ts', 'utf8');

// If Quotation already exists, skip
if (!contractStr.includes("model('Quotation'")) {
  
  // Insert Quotation and QuotationFollowUp models before the `return {` block
  const modelsStr = `
    const Quotation = model('Quotation', {
      fields: {
        id: field.id.uuidv7String(),
        quotationNumber: field.text().unique(),
        quotationDate: field.temporal.createdAtString(),
        clientId: field.uuidString(),
        clientCode: field.text(),
        companyName: field.text(),
        contactPerson: field.text(),
        mobileNumber: field.text(),
        email: field.text(),
        inquiryRef: field.text().optional(),
        quotationAmount: field.float(),
        expectedOrderValue: field.float().optional(),
        salesExecutive: field.text(),
        salesExecutiveUserId: field.uuidString().optional(),
        followUpDate: field.temporal.timestampString().optional(),
        status: field.text().default('DRAFT'),
        remarks: field.text().optional(),
        
        convertedOrderValue: field.float().optional(),
        lostValue: field.float().optional(),
        convertedOrderId: field.uuidString().optional(),
        convertedOrderNumber: field.text().optional(),
        lostDate: field.temporal.timestampString().optional(),
        lostReason: field.text().optional(),
        lostRemarks: field.text().optional(),
        competitorName: field.text().optional(),
        
        sentVia: field.text().optional(),
        sentAt: field.temporal.timestampString().optional(),
        sentNotes: field.text().optional(),
        negotiationDate: field.temporal.timestampString().optional(),
        expectedClosureDate: field.temporal.timestampString().optional(),
        isLocked: field.boolean().default(false),
        
        createdAt: field.temporal.createdAtString(),
        updatedAt: field.temporal.updatedAtString(),
      },
    });

    const QuotationFollowUp = model('QuotationFollowUp', {
      fields: {
        id: field.id.uuidv7String(),
        quotationId: field.uuidString(),
        followUpDate: field.temporal.timestampString(),
        notes: field.text(),
        status: field.text().default('PENDING'),
        createdByName: field.text(),
        createdAt: field.temporal.createdAtString(),
      },
    });
`;

  // Inject models
  contractStr = contractStr.replace('return {', modelsStr + '\n    return {');
  
  // Inject into the returned models object
  const relationsStr = `
        Quotation: Quotation.relations({
          client: rel.belongsTo(Client, { from: 'clientId', to: 'id' }),
          followUps: rel.hasMany(QuotationFollowUp, { by: 'quotationId' }),
        }),
        QuotationFollowUp: QuotationFollowUp.relations({
          quotation: rel.belongsTo(Quotation, { from: 'quotationId', to: 'id' }),
        }),
`;
  contractStr = contractStr.replace('models: {', 'models: {' + relationsStr);

  fs.writeFileSync('Backend/src/prisma/contract.ts', contractStr);
  console.log("Injected Quotation into contract.ts");
} else {
  console.log("Quotation already exists in contract.ts");
}
