const fs = require('fs');

let file = fs.readFileSync('StickerSmash/src/components/views/QuotationsView.tsx', 'utf8');

// Use regex to remove from "const handleSaveConversion" to "const handleSaveSentDetails"
file = file.replace(
  /const handleSaveConversion = async \([\s\S]*?const handleSaveSentDetails =/,
  "const handleSaveSentDetails ="
);

fs.writeFileSync('StickerSmash/src/components/views/QuotationsView.tsx', file);
console.log("Removed handleSaveConversion properly!");
