const fs = require('fs');

let file = fs.readFileSync('StickerSmash/src/components/views/QuotationsView.tsx', 'utf8');

const regex = /const handleSaveConversion = async \([\s\S]*?catch \(err: any\) \{[\s\S]*?\}\n\s*\};\n/;
file = file.replace(regex, '');

fs.writeFileSync('StickerSmash/src/components/views/QuotationsView.tsx', file);
console.log("Removed handleSaveConversion using regex.");
