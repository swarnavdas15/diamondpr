const fs = require('fs');
let file = fs.readFileSync('StickerSmash/src/components/views/QuotationsView.tsx', 'utf8');

const start = file.indexOf('const handleSaveConversion = async');
const end = file.indexOf('const handleUnlockQuotation = async (q: Quotation)');

if (start !== -1 && end !== -1) {
  file = file.substring(0, start) + file.substring(end);
  fs.writeFileSync('StickerSmash/src/components/views/QuotationsView.tsx', file);
  console.log("Removed handleSaveConversion by finding start and end.");
} else {
  console.log("Could not find start or end");
}
