const fs = require('fs');

let file = fs.readFileSync('StickerSmash/src/components/views/QuotationsView.tsx', 'utf8');

const start = file.indexOf('const handleSaveConversion = async (data');
if (start !== -1) {
  const endStr = "setConversionError(err?.message || 'Failed to convert quotation.');\n    }\n  };\n";
  const end = file.indexOf(endStr, start);
  
  if (end !== -1) {
    file = file.substring(0, start) + file.substring(end + endStr.length);
    fs.writeFileSync('StickerSmash/src/components/views/QuotationsView.tsx', file);
    console.log("Removed handleSaveConversion perfectly.");
  } else {
    console.log("Could not find end of handleSaveConversion");
  }
} else {
  console.log("Could not find handleSaveConversion start");
}
