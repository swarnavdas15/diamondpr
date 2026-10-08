const fs = require('fs');
let file = fs.readFileSync('StickerSmash/src/components/views/QuotationsView.tsx', 'utf8');

const startIndex = file.indexOf('const handleSaveConversion =');
if (startIndex !== -1) {
  const endIndex = file.indexOf('const handleSaveSentDetails =');
  if (endIndex !== -1) {
    file = file.substring(0, startIndex) + file.substring(endIndex);
    fs.writeFileSync('StickerSmash/src/components/views/QuotationsView.tsx', file);
    console.log("Removed handleSaveConversion block");
  } else {
    console.log("Could not find end of handleSaveConversion block");
  }
} else {
  console.log("Could not find handleSaveConversion");
}
