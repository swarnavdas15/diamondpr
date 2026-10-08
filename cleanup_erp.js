const fs = require('fs');

let file = fs.readFileSync('StickerSmash/src/context/ERPContext.tsx', 'utf8');

file = file.replace(
  /const convertQuotationToOrder = async \([\s\S]*?\n\s*convertQuotationToOrder,/,
  ''
);

fs.writeFileSync('StickerSmash/src/context/ERPContext.tsx', file);
console.log("Cleaned up ERPContext.tsx");
