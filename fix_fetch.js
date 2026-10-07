const fs = require('fs');
let data = fs.readFileSync('StickerSmash/src/context/ERPContext.tsx', 'utf8');

const oldStr = `const [clientsRes, ordersRes, contactsRes] = await Promise.all([
          apiClient.get('/clients'),
          apiClient.get('/orders'),
          apiClient.get('/clients/contacts')
        ]);`;
const newStr = `const [clientsRes, ordersRes, contactsRes, quotationsRes] = await Promise.all([
          apiClient.get('/clients'),
          apiClient.get('/orders'),
          apiClient.get('/clients/contacts'),
          apiClient.get('/quotations')
        ]);`;

data = data.replace(oldStr, newStr);
fs.writeFileSync('StickerSmash/src/context/ERPContext.tsx', data);
console.log("Fixed fetchLiveDashboardData");
