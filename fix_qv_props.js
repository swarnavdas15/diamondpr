const fs = require('fs');

let file = fs.readFileSync('StickerSmash/src/components/views/QuotationsView.tsx', 'utf8');

file = file.replace(
  /interface QuotationsViewProps \{[\s\S]*?\}/,
  "interface QuotationsViewProps {\n  onOpenCreateQuotation?: () => void;\n  onOpenCreateOrderWithData?: (data: any) => void;\n}"
);

file = file.replace(
  /export const QuotationsView: React\.FC<QuotationsViewProps> = \(\{ onOpenCreateQuotation \}\) => \{/,
  "export const QuotationsView: React.FC<QuotationsViewProps> = ({ onOpenCreateQuotation, onOpenCreateOrderWithData }) => {"
);

fs.writeFileSync('StickerSmash/src/components/views/QuotationsView.tsx', file);
console.log("Fixed QuotationsView props");
