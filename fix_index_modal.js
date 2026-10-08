const fs = require('fs');

let file = fs.readFileSync('StickerSmash/src/app/index.tsx', 'utf8');

file = file.replace(
  /const \[createOrderVisible, setCreateOrderVisible\] = useState\(false\);/,
  "const [createOrderVisible, setCreateOrderVisible] = useState(false);\n  const [orderInitialData, setOrderInitialData] = useState<any>(null);"
);

file = file.replace(
  /onOpenCreateOrder=\{\(\) => setCreateOrderVisible\(true\)\}/g,
  "onOpenCreateOrder={() => { setOrderInitialData(null); setCreateOrderVisible(true); }}"
);

file = file.replace(
  /return <QuotationsView onOpenCreateQuotation=\{\(\) => setCreateQuotationVisible\(true\)\} \/>;/,
  "return <QuotationsView onOpenCreateQuotation={() => setCreateQuotationVisible(true)} onOpenCreateOrderWithData={(data) => { setOrderInitialData(data); setCreateOrderVisible(true); }} />;"
);

file = file.replace(
  /<CreateOrderModal visible=\{createOrderVisible\} onClose=\{\(\) => setCreateOrderVisible\(false\)\} \/>/,
  "<CreateOrderModal visible={createOrderVisible} onClose={() => { setCreateOrderVisible(false); setOrderInitialData(null); }} initialData={orderInitialData} />"
);

fs.writeFileSync('StickerSmash/src/app/index.tsx', file);
console.log("Fixed index.tsx");
