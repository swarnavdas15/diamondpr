const fs = require('fs');

let file = fs.readFileSync('StickerSmash/src/components/views/QuotationsView.tsx', 'utf8');

file = file.replace(/setConversionModalQuotation\(q\);/g, '');
file = file.replace(/setConversionModalQuotation\(null\);/g, '');

fs.writeFileSync('StickerSmash/src/components/views/QuotationsView.tsx', file);
console.log("Removed remaining setConversionModalQuotation");
