const fs = require('fs');

// Fix 1: quotation.routes.ts import
let routes = fs.readFileSync('Backend/src/modules/quotations/quotation.routes.ts', 'utf8');
routes = routes.replace(
  "handleAddQuotationFollowUp,\n} from './quotation.controller';",
  "handleAddQuotationFollowUp,\n  handleDeleteQuotation,\n} from './quotation.controller';"
);
fs.writeFileSync('Backend/src/modules/quotations/quotation.routes.ts', routes);


// Fix 2: QuotationsView.tsx await
let qv = fs.readFileSync('StickerSmash/src/components/views/QuotationsView.tsx', 'utf8');
const searchString = `onPress={(e) => {
                              e.stopPropagation();
                              if (window.confirm(\`Delete quotation \${q.quotationNumber}?\`)) {
                                await deleteQuotation(q.id);
                              }
                            }}`;

const replaceString = `onPress={async (e) => {
                              e.stopPropagation();
                              if (window.confirm(\`Delete quotation \${q.quotationNumber}?\`)) {
                                await deleteQuotation(q.id);
                              }
                            }}`;

if (qv.includes(searchString)) {
  qv = qv.replace(searchString, replaceString);
  fs.writeFileSync('StickerSmash/src/components/views/QuotationsView.tsx', qv);
  console.log("Replaced exactly in QuotationsView");
} else {
  console.log("Could not find the exact string in QuotationsView. Trying regex fallback...");
  qv = qv.replace(/onPress=\{\(e\) => \{\s*e\.stopPropagation\(\);\s*if \(window\.confirm\(`Delete quotation \$\{q\.quotationNumber\}\?`\)\) \{\s*await deleteQuotation\(q\.id\);\s*\}\s*\}\}/, replaceString);
  fs.writeFileSync('StickerSmash/src/components/views/QuotationsView.tsx', qv);
}
