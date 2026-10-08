const fs = require('fs');
let file = fs.readFileSync('StickerSmash/src/components/views/QuotationsView.tsx', 'utf8');

file = file.replace(
  /\['SENT', 'NEGOTIATION', 'APPROVED', 'FULLY_CONVERTED', 'LOST'\]\.map\(\(st\)/g,
  "['DRAFT', 'SENT', 'NEGOTIATION', 'APPROVED', 'FULLY_CONVERTED', 'LOST'].map((st)"
);

fs.writeFileSync('StickerSmash/src/components/views/QuotationsView.tsx', file);
console.log("Added DRAFT filter");
