const fs = require('fs');

let file = fs.readFileSync('StickerSmash/src/components/quotations/QuotationFollowUpModal.tsx', 'utf8');

file = file.replace(
  /if \(!followUpDate\.trim\(\)\) \{\s*setError\('Follow-Up Date is required\.'\);\s*return;\s*\}/,
  "if (!followUpDate.trim()) {\n      setError('Follow-Up Date is required.');\n      return;\n    }\n    if (!notes.trim()) {\n      setError('Discussion notes are required.');\n      return;\n    }"
);

fs.writeFileSync('StickerSmash/src/components/quotations/QuotationFollowUpModal.tsx', file);
console.log("Fixed QuotationFollowUpModal.tsx");
