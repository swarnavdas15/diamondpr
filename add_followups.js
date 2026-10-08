const fs = require('fs');

let schema = fs.readFileSync('Backend/prisma/schema.prisma', 'utf8');

if (!schema.includes('followUps QuotationFollowUp[]')) {
  // Find where model Quotation ends
  const lines = schema.split(/\r?\n/);
  const qStart = lines.findIndex(l => l.includes('model Quotation {'));
  let inserted = false;
  for (let i = qStart; i < lines.length; i++) {
    if (lines[i].trim() === '}') {
      lines.splice(i, 0, '  followUps            QuotationFollowUp[]');
      inserted = true;
      break;
    }
  }

  if (inserted) {
    fs.writeFileSync('Backend/prisma/schema.prisma', lines.join('\n'));
    console.log("Added followUps relation successfully.");
  } else {
    console.log("Failed to insert.");
  }
} else {
  console.log("Already has followUps.");
}
