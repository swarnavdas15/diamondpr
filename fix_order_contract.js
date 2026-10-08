const fs = require('fs');

let file = fs.readFileSync('Backend/src/prisma/contract.ts', 'utf8');

file = file.replace(
  /const Order = model\('Order', \{\n\s*fields: \{\n\s*id: field\.id\.uuidv7String\(\),\n\s*poNumber: field\.text\(\)\.unique\(\),/,
  "const Order = model('Order', {\n      fields: {\n        id: field.id.uuidv7String(),\n        orderNumber: field.text().unique(),\n        poNumber: field.text(),\n        clientCode: field.text(),"
);

fs.writeFileSync('Backend/src/prisma/contract.ts', file);
console.log("Fixed Order in contract.ts");
