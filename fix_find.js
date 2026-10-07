const fs = require('fs');
let data = fs.readFileSync('StickerSmash/src/components/CreateOrderModal.tsx', 'utf8');

data = data.replace(/c\.clientCode\.toLowerCase\(\)/g, "(c.clientCode || '').toLowerCase()");
data = data.replace(/c\.companyName\.toLowerCase\(\)/g, "(c.companyName || '').toLowerCase()");

fs.writeFileSync('StickerSmash/src/components/CreateOrderModal.tsx', data);
console.log('Fixed CreateOrderModal find');
