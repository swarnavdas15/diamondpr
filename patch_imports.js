const fs = require('fs');

const filesToPatch = [
  'StickerSmash/src/components/quotations/QuotationConversionModal.tsx',
  'StickerSmash/src/components/quotations/QuotationFollowUpModal.tsx',
  'StickerSmash/src/components/quotations/QuotationSentModal.tsx',
  'StickerSmash/src/components/views/QuotationsView.tsx'
];

filesToPatch.forEach(file => {
  let data = fs.readFileSync(file, 'utf8');
  if (!data.includes('DatePickerInput')) return;
  if (!data.includes('import DatePickerInput')) {
    data = data.replace(
      "import React",
      "import DatePickerInput from '../ui/DatePickerInput';\nimport React"
    );
    fs.writeFileSync(file, data);
    console.log("Patched " + file);
  }
});
