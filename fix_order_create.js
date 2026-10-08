const fs = require('fs');

let file = fs.readFileSync('Backend/src/modules/orders/order.service.ts', 'utf8');

file = file.replace(
  /const order = await tx\.orm\.public\.Order\.create\(\{/,
  `const client = await tx.orm.public.Client.where({ id: dbId(data.clientId) }).first();
      if (!client) throw new Error('Client not found');
      const orderCount = await tx.orm.public.Order.count();
      
      const order = await tx.orm.public.Order.create({
        orderNumber: \`ORD-2026-\${1000 + Number(orderCount)}\`,
        clientCode: client.clientcode,`
);

fs.writeFileSync('Backend/src/modules/orders/order.service.ts', file);
console.log("Fixed Order.create in order.service.ts");
