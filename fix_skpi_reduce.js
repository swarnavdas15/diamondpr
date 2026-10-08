const fs = require('fs');

function fixReduce(filePath) {
  let file = fs.readFileSync(filePath, 'utf8');

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

  fs.writeFileSync(filePath, file);
}

fixReduce('StickerSmash/src/components/dashboards/SalesKPICards.tsx');
console.log("Fixed reduce in SalesKPICards.tsx");
