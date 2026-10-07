const fs = require('fs');
let data = fs.readFileSync('StickerSmash/src/context/ERPContext.tsx', 'utf8');

data = data.replace('interface ERPContextType {\\n  refreshData: () => Promise<void>;', 'interface ERPContextType {\n  refreshData: () => Promise<void>;');

fs.writeFileSync('StickerSmash/src/context/ERPContext.tsx', data);
console.log('Fixed');
