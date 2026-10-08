const fs = require('fs');

let file = fs.readFileSync('StickerSmash/src/components/views/QuotationsView.tsx', 'utf8');

file = file.replace(
  /interface QuotationsViewProps \{\n\s*onOpenCreateQuotation\?: \(\) => void;\n\}/,
  "interface QuotationsViewProps {\n  onOpenCreateQuotation?: () => void;\n  onOpenCreateOrderWithData?: (data: any) => void;\n}"
);

file = file.replace(
  /export const QuotationsView: React\.FC<QuotationsViewProps> = \(\{ onOpenCreateQuotation \}\) => \{/,
  "export const QuotationsView: React.FC<QuotationsViewProps> = ({ onOpenCreateQuotation, onOpenCreateOrderWithData }) => {"
);

file = file.replace(
  /onPress=\{\(\) => setConversionModalQuotation\(q\)\}/,
  `onPress={() => {
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
    } else {
      setConversionModalQuotation(q);
    }
  }}`
);

fs.writeFileSync('StickerSmash/src/components/views/QuotationsView.tsx', file);
console.log("Fixed QuotationsView.tsx");
