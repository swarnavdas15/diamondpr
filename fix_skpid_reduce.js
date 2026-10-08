const fs = require('fs');
let file = fs.readFileSync('StickerSmash/src/components/dashboards/SalesKPIDetailsModal.tsx', 'utf8');

file = file.replace(
  /const totalQuotationValue = quotations\.reduce\(\(acc, q\) => acc \+ q\.quotationAmount, 0\);/,
  "const totalQuotationValue = quotations.reduce((acc, q) => acc + Number(q.quotationAmount || 0), 0);"
);

file = file.replace(
  /const totalConvertedValue = convertedQuotations\.reduce\(\(acc, q\) => acc \+ \(q\.convertedOrderValue \|\| 0\), 0\);/,
  "const totalConvertedValue = convertedQuotations.reduce((acc, q) => acc + Number(q.convertedOrderValue || 0), 0);"
);

file = file.replace(
  /const totalLostValue = lostQuotations\.reduce\(\(acc, q\) => acc \+ \(q\.lostValue \|\| 0\), 0\);/,
  "const totalLostValue = lostQuotations.reduce((acc, q) => acc + Number(q.lostValue || 0), 0);"
);

fs.writeFileSync('StickerSmash/src/components/dashboards/SalesKPIDetailsModal.tsx', file);
console.log("Fixed reduce in SalesKPIDetailsModal");
