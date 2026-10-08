const fs = require('fs');
let file = fs.readFileSync('StickerSmash/src/components/views/QuotationsView.tsx', 'utf8');

file = file.replace(
  /const formatCurrency = \(val: number\) => `[^$]+\$\{val\.toLocaleString\('en-IN'\)\}`;/,
  "const formatCurrency = (val: number | string) => `₹${Number(val || 0).toLocaleString('en-IN')}`;"
);

file = file.replace(
  /const totalQuotationValue = quotations\.reduce\(\(acc, q\) => acc \+ q\.quotationAmount, 0\);/,
  "const totalQuotationValue = quotations.reduce((acc, q) => acc + Number(q.quotationAmount || 0), 0);"
);

file = file.replace(
  /const convertedValue = quotations\.reduce\(\(acc, q\) => acc \+ \(q\.convertedOrderValue \|\| 0\), 0\);/,
  "const convertedValue = quotations.reduce((acc, q) => acc + Number(q.convertedOrderValue || 0), 0);"
);

file = file.replace(
  /const lostBusinessValue = quotations\.reduce\(\(acc, q\) => acc \+ \(q\.lostValue \|\| 0\), 0\);/,
  "const lostBusinessValue = quotations.reduce((acc, q) => acc + Number(q.lostValue || 0), 0);"
);

fs.writeFileSync('StickerSmash/src/components/views/QuotationsView.tsx', file);
console.log("Fixed QuotationsView formatting and calculation");
