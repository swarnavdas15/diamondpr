const fs = require('fs');
let data = fs.readFileSync('StickerSmash/src/context/ERPContext.tsx', 'utf8');

data = data.replace('export interface ERPContextType {', 'export interface ERPContextType {\n  refreshData: () => Promise<void>;');

const badString = 'return (\\n    <ERPContext.Provider\\n      value={{\\n        refreshData: fetchLiveDashboardData,';
if (data.includes(badString)) {
  data = data.replace(badString, 'return (\n    <ERPContext.Provider\n      value={{\n        refreshData: fetchLiveDashboardData,');
} else {
  // If not there, let's inject it cleanly
  const goodString = 'return (\n    <ERPContext.Provider\n      value={{';
  if (data.includes(goodString)) {
    data = data.replace(goodString, 'return (\n    <ERPContext.Provider\n      value={{\n        refreshData: fetchLiveDashboardData,');
  }
}

fs.writeFileSync('StickerSmash/src/context/ERPContext.tsx', data);
console.log('done');
