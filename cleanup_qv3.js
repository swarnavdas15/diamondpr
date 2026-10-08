const fs = require('fs');

let file = fs.readFileSync('StickerSmash/src/components/views/QuotationsView.tsx', 'utf8');

file = file.replace(/convertQuotationToOrder,\n\s*/, '');
// Also fix line 360: visible={!!conversionModalQuotation} probably broke because conversionModalQuotation was removed
file = file.replace(/visible=\{!!conversionModalQuotation\}/, 'visible={false}');

fs.writeFileSync('StickerSmash/src/components/views/QuotationsView.tsx', file);
console.log("Cleaned up destructuring");
