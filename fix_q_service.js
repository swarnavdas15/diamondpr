const fs = require('fs');
let data = fs.readFileSync('Backend/src/modules/quotations/quotation.service.ts', 'utf8');
data = data.replace(/\\nexport const deleteQuotation = async \(id: string\) => \{\\n  await db\.orm\.public\.Quotation\.where\(\{ id: dbId\(id\) \}\)\.delete\(\);\\n  return \{ success: true \};\\n\};\\n/, `
export const deleteQuotation = async (id: string) => {
  await db.orm.public.Quotation.where({ id: dbId(id) }).delete();
  return { success: true };
};
`);
fs.writeFileSync('Backend/src/modules/quotations/quotation.service.ts', data);
console.log("Fixed quotation.service.ts");
