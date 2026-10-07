const fs = require('fs');

let qv = fs.readFileSync('StickerSmash/src/components/views/QuotationsView.tsx', 'utf8');

qv = qv.replace(
  `onPress={(e) => {
                              e.stopPropagation();
                              if (window.confirm(\`Delete quotation \${q.quotationNumber}?\`)) {
                                await deleteQuotation(q.id);
                              }
                            }}`,
  `onPress={async (e) => {
                              e.stopPropagation();
                              if (window.confirm(\`Delete quotation \${q.quotationNumber}?\`)) {
                                await deleteQuotation(q.id);
                              }
                            }}`
);

fs.writeFileSync('StickerSmash/src/components/views/QuotationsView.tsx', qv);
console.log("Fixed QuotationsView await");
