const fs = require('fs');

let file = fs.readFileSync('StickerSmash/src/components/views/QuotationsView.tsx', 'utf8');

// Replace the fallback in onPress and handleStatusChange
file = file.replace(
  /\} else if \(newSt === 'APPROVED'\) \{\n\s*setConversionError\(''\);\n\s*setConversionModalQuotation\(q\);/,
  `} else if (newSt === 'APPROVED') {
      if (onOpenCreateOrderWithData) {
        const targetClient = clients.find(c => c.clientCode.toLowerCase() === q.clientCode.toLowerCase());
        onOpenCreateOrderWithData({
          quotationId: q.id,
          clientId: targetClient?.id,
          poNumber: \`PO-\${q.quotationNumber}\`,
          budget: q.quotationAmount,
          requiredQuantity: 1,
          technicalRequirements: q.remarks || q.inquiryRef || '',
        });
      }
    `
);

// Remove the modal and states
file = file.replace(/const \[conversionModalQuotation, setConversionModalQuotation\] = useState<Quotation \| null>\(null\);/, '');
file = file.replace(/const \[conversionError, setConversionError\] = useState\(''\);/, '');
file = file.replace(/import \{ QuotationConversionModal, QuotationConversionData \} from '\.\.\/quotations\/QuotationConversionModal';/, '');

file = file.replace(
  /<QuotationConversionModal\s+visible=\{\!\!conversionModalQuotation\}\s+quotation=\{conversionModalQuotation\}\s+onClose=\{\(\) => setConversionModalQuotation\(null\)\}\s+onSubmitConversion=\{handleSaveConversion\}\s+externalError=\{conversionError\}\s+\/>/,
  ''
);

// Remove handleSaveConversion entirely
file = file.replace(
  /const handleSaveConversion = async \(data: QuotationConversionData\) => \{[\s\S]*?catch \(err: any\) \{[\s\S]*?\}\n\s*\};/,
  ''
);

fs.writeFileSync('StickerSmash/src/components/views/QuotationsView.tsx', file);
console.log("Cleaned up QuotationsView.tsx");
