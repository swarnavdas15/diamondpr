const fs = require('fs');

let file = fs.readFileSync('Backend/src/modules/quotations/quotation.controller.ts', 'utf8');

file = file.replace(
  /if \(!followUpDate \|\| !notes\) \{\s*return res\.status\(400\)\.json\(\{ success: false, error: 'Follow-up date and notes are required' \}\);\s*\}/,
  "if (!followUpDate) {\n      return res.status(400).json({ success: false, error: 'Follow-up date is required' });\n    }\n    if (!notes) req.body.notes = 'No notes provided';"
);

fs.writeFileSync('Backend/src/modules/quotations/quotation.controller.ts', file);
console.log("Fixed quotation.controller.ts");
