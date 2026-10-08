const fs = require('fs');

function fixFile(filePath) {
  let file = fs.readFileSync(filePath, 'utf8');

  file = file.replace(
    /const formatCurrency = \(val: number\) => `[^$]+\$\{val\.toLocaleString\('en-IN'\)\}`;/,
    "const formatCurrency = (val: number | string) => `₹${Number(val || 0).toLocaleString('en-IN')}`;"
  );

  fs.writeFileSync(filePath, file);
}

fixFile('StickerSmash/src/components/dashboards/SalesKPICards.tsx');
console.log("Fixed SalesKPICards.tsx");
