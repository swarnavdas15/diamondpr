const fs = require('fs');

const filesToPatch = [
  'StickerSmash/src/components/quotations/QuotationConversionModal.tsx',
  'StickerSmash/src/components/quotations/QuotationFollowUpModal.tsx',
  'StickerSmash/src/components/quotations/QuotationSentModal.tsx',
  'StickerSmash/src/components/views/QuotationsView.tsx'
];

filesToPatch.forEach(file => {
  let data = fs.readFileSync(file, 'utf8');
  if (data.includes("import DatePickerInput from '../ui/DatePickerInput';")) {
    data = data.replace(
      "import DatePickerInput from '../ui/DatePickerInput';",
      "import { DatePickerInput } from '../ui/DatePickerInput';"
    );
    fs.writeFileSync(file, data);
    console.log("Patched named export in " + file);
  }
});

let contextFile = 'StickerSmash/src/context/ERPContext.tsx';
let data = fs.readFileSync(contextFile, 'utf8');
if (!data.includes('uploadPrimaryContactProfileImage: (clientId: string,')) {
  data = data.replace(
    "  uploadClientProfileImage: (clientId: string, uri: string, name: string, type: string) => Promise<void>;",
    "  uploadClientProfileImage: (clientId: string, uri: string, name: string, type: string) => Promise<void>;\n  uploadPrimaryContactProfileImage: (clientId: string, uri: string, name: string, type: string) => Promise<void>;"
  );
  fs.writeFileSync(contextFile, data);
  console.log("Patched ERPContextType");
}
